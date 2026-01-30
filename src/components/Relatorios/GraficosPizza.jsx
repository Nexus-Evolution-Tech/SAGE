import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import styles from "./GraficosPizza.module.css";

const LABEL_MAP = {
  "No Horário": "No horário",
  "Atrasados": "Atrasados",
  "Faltantes": "Faltantes",
};

export default function GraficosPizza({ dados }) {
  if (!dados?.length) {
    return (
      <div className={styles.wrapper}>
        <h3 className={styles.title}>Distribuição por status</h3>
        <div className={styles.empty}>Nenhum dado para exibir</div>
      </div>
    );
  }

  const chartData = dados.map((item) => ({
    name: LABEL_MAP[item.label] || item.label,
    value: Number(item.value) || 0,
    color: item.color || "#94a3b8",
  })).filter((d) => d.value > 0);

  if (chartData.length === 0) {
    return (
      <div className={styles.wrapper}>
        <h3 className={styles.title}>Distribuição por status</h3>
        <div className={styles.empty}>Nenhum dado para exibir</div>
      </div>
    );
  }


  return (
    <div className={styles.wrapper} style={{ height: 380, display: 'flex', flexDirection: 'column' }}>
      <h3 className={styles.title} style={{ marginBottom: '10px' }}>Distribuição por status</h3>
      <div style={{ flex: 1, width: '100%', minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          {/* Adicionamos margem lateral para a label (texto da % ) não cortar */}
          <PieChart margin={{ left: 40, right: 40 }}>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80} // Reduzi de 100 para 80 para sobrar espaço para o texto
              paddingAngle={4}
              dataKey="value"
              nameKey="name"
              label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
              ))}
            </Pie>
            <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0" }} />
            <Legend verticalAlign="bottom" height={36} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
