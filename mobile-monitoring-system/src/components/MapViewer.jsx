import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export default function MapViewer({ position }) {
  if (!position || !position.latitude || !position.longitude) {
    return <p>未获取到位置信息</p>;
  }

  return (
    <MapContainer center={[position.latitude, position.longitude]} zoom={13} style={{ height: '300px', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />
      <Marker position={[position.latitude, position.longitude]}>
        <Popup>当前位置</Popup>
      </Marker>
    </MapContainer>
  );
}