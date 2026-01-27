import React from 'react';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import styles from './GraficosPizza.module.css';

export default function GraficosPizza({ dados }) {
  if (!dados || !Array.isArray(dados) || dados.length === 0) {
    return (
      <div className={styles.container} style={{ height: 420, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <h3>Status de Acesso</h3>
        <div style={{ color: '#999' }}>Nenhum dado disponível</div>
      </div>
    );
  }

  return (
    /* Definimos o container como Flex para separar título e gráfico */
    <div className={styles.container} style={{ height: 420, display: 'flex', flexDirection: 'column' }}>
      <h3 style={{ margin: '0 0 10px 0' }}>Status de Acesso</h3>
      
      <div className={styles.chartWrapper} style={{ flex: 1, width: '100%', minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          {/* Ajustamos a margem para dar espaço às etiquetas laterais */}
          <PieChart margin={{ top: 0, right: 40, bottom: 0, left: 40 }}>
            <Pie
              data={dados}
              cx="50%"
              cy="50%"
              labelLine={true} // Linha que liga a pizza ao texto, ajuda a não cortar
              /* Ajuste na label para evitar que textos longos fujam da tela */
              label={({ label, percentual }) => `${label} (${percentual.toFixed(1)}%)`}
              /* Diminuímos ligeiramente o raio (de 110 para 80) para caber as labels */
              outerRadius={80} 
              fill="#8884d8"
              dataKey="value"
              nameKey="label"
            >
              {dados.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color || '#8884d8'} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => `${value} pessoas`} />
            <Legend verticalAlign="bottom" height={36}/>
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}