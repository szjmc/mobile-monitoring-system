const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// 初始化数据库
const adapter = new FileSync('db.json');
const db = low(adapter);
db.defaults({ devices: {}, history: [] }).write();

// WebSocket 连接处理
wss.on('connection', (ws) => {
  console.log('WebSocket client connected');

  ws.on('message', (message) => {
    const data = JSON.parse(message);

    if (data.type === 'mobile' && data.action === 'device_data') {
      // 存储设备数据
      db.set(`devices.${data.deviceId}`, {
        ...data.data,
        lastUpdated: new Date().toISOString(),
      }).write();

      // 存入历史记录
      db.get('history').unshift({
        id: data.deviceId,
        timestamp: new Date().toISOString(),
        data: data.data,
      }).write();
    }

    // 广播给所有管理员客户端
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });
});

// 提供 API 获取历史记录
app.get('/api/history', (req, res) => {
  res.json(db.get('history').value());
});

// 模拟登录接口
app.post('/api/login', express.json(), (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'password') {
    res.json({ success: true, token: 'mock-jwt-token' });
  } else {
    res.status(401).json({ success: false, message: '用户名或密码错误' });
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});