import React from 'react';
export default function MetricasCard({ label, value, color }) {
  return (
    <div style={{padding: '20px', borderRadius: '12px', background: '#fff', borderLeft: `5px solid ${color}`, boxShadow: '0 2px 8px rgba(0,0,0,0.05)'}}>
      <div style={{fontSize: '11px', color: '#64748b', fontWeight: '800', textTransform: 'uppercase'}}>{label}</div>
      <div style={{fontSize: '24px', fontWeight: '800', color: '#021932'}}>{value}</div>
    </div>
  );
}
