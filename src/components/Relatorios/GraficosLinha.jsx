import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import styles from './GraficosLinha.module.css';

export default function GraficosLinha({ dados }) {
  // Normalização dos dados para garantir que o gráfico tenha chaves consistentes
  const normalizado = Array.isArray(dados)
    ? dados.map((item) => ({
        ...item,
        periodo: item.periodo || item.horario || ''
      }))
    : [];

  // Verificação de segurança caso não existam dados
  if (!dados || normalizado.length === 0) {
    return (
      <div className={styles.container} style={{ height: 420 }}>
        <h3>Evolução ao Longo do Dia</h3>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#999' }}>
          Nenhum dado disponível
        </div>
      </div>
    );
  }

// ... (lógica de normalização anterior)

  return (
    <div className={styles.container} style={{ 
      width: '100%', 
      height: 420, 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center' // Centraliza horizontalmente o conteúdo do container
    }}>
      <h3 style={{ width: '100%', textAlign: 'left', marginBottom: '20px' }}>
        Evolução ao Longo do Dia
      </h3>
      
      <div style={{ width: '100%', flex: 1 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart 
            data={normalizado} 
            /* Ajustamos as margens: left 0 ou negativo ajuda se o eixo Y estiver longe */
            margin={{ top: 10, right: 30, left: -20, bottom: 0 }} 
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
            
            <XAxis 
              dataKey="periodo" 
              tick={{ fontSize: 12 }} 
              dy={10} // Empurra os nomes das horas um pouco para baixo
            />
            
            <YAxis 
              tick={{ fontSize: 12 }}
              axisLine={false} // Remove a linha vertical do eixo Y para um look mais limpo
              tickLine={false} 
            />
            
            <Tooltip />
            <Legend verticalAlign="top" align="right" iconType="circle" />
            
            <Line 
              type="monotone" 
              dataKey="no_horario" 
              stroke="#4CAF50" 
              strokeWidth={3}
              dot={{ r: 4, fill: '#4CAF50' }}
            />
            {/* Adicione as outras linhas aqui seguindo o mesmo padrão */}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}