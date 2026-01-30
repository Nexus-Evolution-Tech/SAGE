import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import styles from "./GraficosLinha.module.css";

const cores = {
  no_horario: "#4CAF50",
  atrasados: "#FFC107",
  faltantes: "#F44336",
};

export default function GraficosLinha({ dados }) {
  if (!dados?.length) {
    return (
      <div className={styles.wrapper} style={{ height: 350, display: 'flex', flexDirection: 'column' }}>
        <h3 className={styles.title}>Presença por horário</h3>
        <div className={styles.empty} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          Nenhum dado para exibir
        </div>
      </div>
    );
  }

  const chartData = dados.map((item) => ({
    horario: item.horario || item.label,
    "No horário": Number(item.no_horario) || 0,
    Atrasados: Number(item.atrasados) || 0,
    Faltantes: Number(item.faltantes) || 0,
  }));

  return (
    <div className={styles.wrapper} style={{ height: 380, display: 'flex', flexDirection: 'column' }}>
      <h3 className={styles.title} style={{ marginBottom: '10px' }}>Presença por horário</h3>
      <div style={{ flex: 1, width: '100%', minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          {/* Aumentamos a margem esquerda (left: -20) e direita para o gráfico respirar */}
          <LineChart data={chartData} margin={{ top: 10, right: 30, left: -10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="horario" tick={{ fontSize: 12 }} stroke="#64748b" axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12 }} stroke="#64748b" axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0" }} />
            <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '20px' }} />
            <Line type="monotone" dataKey="No horário" stroke={cores.no_horario} strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
            <Line type="monotone" dataKey="Atrasados" stroke={cores.atrasados} strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
            <Line type="monotone" dataKey="Faltantes" stroke={cores.faltantes} strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}