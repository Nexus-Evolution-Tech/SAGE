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
      <div className={styles.wrapper}>
        <h3 className={styles.title}>Presença por horário</h3>
        <div className={styles.empty}>Nenhum dado para exibir</div>
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
    <div className={styles.wrapper}>
      <h3 className={styles.title}>Presença por horário</h3>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="horario"
            tick={{ fontSize: 12 }}
            stroke="#64748b"
          />
          <YAxis tick={{ fontSize: 12 }} stroke="#64748b" />
          <Tooltip
            contentStyle={{
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="No horário"
            stroke={cores.no_horario}
            strokeWidth={2}
            dot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="Atrasados"
            stroke={cores.atrasados}
            strokeWidth={2}
            dot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="Faltantes"
            stroke={cores.faltantes}
            strokeWidth={2}
            dot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
