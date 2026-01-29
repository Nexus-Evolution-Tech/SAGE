import React from 'react';
export default function FiltrosAcesso({ filtros, onChange }) {
  return (
    <div style={{padding: '20px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px'}}>
      <div style={{display: 'flex', gap: '15px'}}>
        {['ALUNOS', 'FUNCIONARIOS'].map(g => (
          <button key={g} onClick={() => onChange({...filtros, grupo: g})} 
            style={{padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', 
            background: filtros.grupo === g ? '#021932' : '#fff', 
            color: filtros.grupo === g ? '#fff' : '#021932', border: '1px solid #021932'}}>
            {g}
          </button>
        ))}
      </div>
    </div>
  );
}
