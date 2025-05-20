import React, { useState, useEffect } from 'react';
import DeviceChart from './components/DeviceChart';
import MapViewer from './components/MapViewer';

const App = () => {
  const [mode, setMode] = useState('');
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loginError, setLoginError] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [devices, setDevices] = useState({});
  const [history, setHistory] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  // 解析 URL 类型
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('type');
    setMode(type);
  }, []);

  // WebSocket 初始化
  useEffect(() => {
    if (!token && mode === 'admin') return;

    const ws = new WebSocket('wss://your-project.vercel.app/api');

    ws.onopen = () => {
      setIsConnected(true);
      ws.send(JSON.stringify({ type: mode, action: 'register' }));
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === 'mobile' && msg.action === 'device_data') {
        setDevices((prev) => ({
          ...prev,
          [msg.deviceId]: { ...msg.data, lastUpdated: new Date() },
        }));
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    return () => ws.close();
  }, [mode, token]);

  // 获取历史记录
  useEffect(() => {
    if (mode === 'admin' && token) {
      fetch('/api/history')
        .then((res) => res.json())
        .then((data) => setHistory(data));
    }
  }, [mode, token]);

  // 登录函数
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setLoginError('');
      } else {
        setLoginError('用户名或密码错误');
      }
    } catch (err) {
      setLoginError('网络错误，请重试');
    }
  };

  // 上报设备信息（移动端）
  const sendDeviceInfo = () => {
    const ws = new WebSocket('wss://your-project.vercel.app/api');
    ws.onopen = () => {
      const data = {
        platform: navigator.platform,
        userAgent: navigator.userAgent,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        batteryLevel: null,
        location: null,
      };
      if (navigator.getBattery) {
        navigator.getBattery().then((battery) => {
          data.batteryLevel = battery.level * 100;
          ws.send(
            JSON.stringify({
              type: 'mobile',
              action: 'device_data',
              deviceId: `mobile-${Math.random().toString(36).substr(2, 9)}`,
              data,
            })
          );
        });
      } else {
        data.batteryLevel = '不支持';
        ws.send(
          JSON.stringify({
            type: 'mobile',
            action: 'device_data',
            deviceId: `mobile-${Math.random().toString(36).substr(2, 9)}`,
            data,
          })
        );
      }

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            data.location = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            };
          },
          () => {
            data.location = '获取失败';
          }
        );
      } else {
        data.location = '不支持';
      }
    };
  };

  // 渲染登录页
  const renderLogin = () => (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <form onSubmit={handleLogin} className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-sm space-y-4">
        <h2 className="text-xl font-bold text-center">管理员登录</h2>
        {loginError && <p className="text-red-400 text-sm">{loginError}</p>}
        <input
          type="text"
          placeholder="用户名"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          className="w-full px-4 py-2 bg-gray-700 rounded focus:outline-none"
        />
        <input
          type="password"
          placeholder="密码"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full px-4 py-2 bg-gray-700 rounded focus:outline-none"
        />
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded font-semibold"
        >
          登录
        </button>
      </form>
    </div>
  );

  // 渲染管理后台
  const renderAdmin = () => (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <header className="text-center py-6">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
          管理后台
        </h1>
        <p className="text-gray-400 mt-2">实时监控移动端设备</p>
      </header>

      {!isConnected ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-red-400">未连接到服务器，请检查网络</p>
        </div>
      ) : (
        <>
          <div className="mt-6 space-y-4">
            {Object.keys(devices).length === 0 ? (
              <p className="text-gray-500">暂无设备连接</p>
            ) : (
              Object.entries(devices).map(([id, info]) => (
                <div key={id} className="bg-gray-800/70 p-4 rounded-lg border border-gray-700">
                  <h3 className="font-semibold">{id}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 text-sm text-gray-300">
                    {Object.entries(info).map(([key, value]) => (
                      <div key={key}>
                        <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').toLowerCase()}:</span>{' '}
                        {typeof value === 'object' ? JSON.stringify(value) : value}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          <h2 className="text-xl font-semibold mt-12">历史记录图表</h2>
          <div className="mt-4">
            <DeviceChart data={history.slice(0, 10)} />
          </div>

          <h2 className="text-xl font-semibold mt-12">设备地图位置</h2>
          <div className="mt-4">
            {history.length > 0 && history[0].data.location ? (
              <MapViewer position={history[0].data.location} />
            ) : (
              <p>未获取到位置信息</p>
            )}
          </div>
        </>
      )}
    </div>
  );

  // 渲染移动端
  const renderMobile = () => (
    <div className="min-h-screen bg-gray-900 text-white p-6 flex flex-col items-center justify-center">
      <h1 className="text-2xl font-bold mb-4">移动端设备</h1>
      <p className="text-gray-400 mb-6 text-center">点击下方按钮上传设备信息</p>
      <button
        onClick={sendDeviceInfo}
        className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white px-6 py-3 rounded-full shadow-lg transform transition hover:scale-105"
      >
        上报设备信息
      </button>
    </div>
  );

  if (mode === 'admin' && !token) return renderLogin();
  if (mode === 'admin') return renderAdmin();
  if (mode === 'mobile') return renderMobile();
  return <div>请访问 ?type=admin 或 ?type=mobile</div>;
};