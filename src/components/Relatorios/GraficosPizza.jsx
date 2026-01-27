import React from "react";
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from "recharts";
import styles from "./GraficosPizza.module.css";

export default function GraficosPizza({ dados = [], titulo = "Status de Acesso" }) {
  const safeData = Array.isArray(dados) ? dados : [];
  const hasData = safeData.some((item) => Number(item.value) > 0);

  return (
    /* Definimos altura fixa e layout flex para evitar recortes */
    <div className={styles.container} style={{ height: 420, display: 'flex', flexDirection: 'column' }}>
      <div className={styles.header} style={{ marginBottom: '10px' }}>
        <h3 style={{ margin: 0 }}>{titulo}</h3>
        <span className={styles.hint} style={{ fontSize: '12px', color: '#666' }}>
          Distribuição de status
        </span>
      </div>

      {hasData ? (
        <div style={{ flex: 1, width: '100%', minHeight: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            {/* Adicionamos margens para as labels laterais não sumirem */}
            <PieChart margin={{ top: 0, right: 30, bottom: 0, left: 30 }}>
              <Pie
                data={safeData}
                cx="50%"
                cy="50%"
                innerRadius={60} // Aumentado levemente para um look mais moderno
                outerRadius={85} // Reduzido para dar espaço às labels externas
                paddingAngle={5}
                dataKey="value"
                nameKey="label"
                /* Label otimizada para não quebrar o layout */
                label={({ name, percent, payload }) => 
                  `${name || payload.label}: ${(percent * 100).toFixed(1)}%`
                }
              >
                {safeData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color || "#3b82f6"} 
                    stroke="none" // Remove a borda branca padrão entre fatias se desejar
                  />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => [`${value} pessoas`, "Quantidade"]} 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
              />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className={styles.empty} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
          Sem dados para exibir.
        </div>
      )}
    </div>
  );
}