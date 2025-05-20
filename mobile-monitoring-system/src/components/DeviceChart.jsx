import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function DeviceChart({ data }) {
  const chartData = {
    labels: data.map((_, i) => `记录 ${i + 1}`),
    datasets: [
      {
        label: '电池电量 (%)',
        data: data.map(d => d.data.batteryLevel || 0),
        borderColor: 'rgba(75,192,192,1)',
        fill: false,
      },
    ],
  };

  return <Line data={chartData} />;
}