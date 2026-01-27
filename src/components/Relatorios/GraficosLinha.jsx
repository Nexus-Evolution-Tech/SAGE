import React from "react";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import styles from "./GraficosLinha.module.css";

const DIAS_SEMANA = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

function formatarDia(dataStr) {
  if (!dataStr) return "";
  
  try {
    const data = new Date(dataStr + "T00:00:00");
    const dia = DIAS_SEMANA[data.getUTCDay()];
    const diaMes = String(data.getUTCDate()).padStart(2, "0");
    
    return `${dia.slice(0, 3)} ${diaMes}`;
  } catch {
    return dataStr;
  }
}

export default function GraficosLinha({ dados = [], titulo = "Evolução" }) {
  const safeData = Array.isArray(dados) ? dados : [];
  
  // Transforma os dados adicionando um label formatado
  const dataFormatada = safeData.map((item) => ({
    ...item,
    horario: item.dia ? formatarDia(item.dia) : item.horario || item.label,
  }));
  
  // Verifica se há números válidos para exibir
  const hasData = dataFormatada.some((item) =>
    ["no_horario", "atrasados", "faltantes"].some((k) => Number(item[k]) > 0)
  );

  return (
    /* Adicionamos flexbox para organizar o header e o gráfico verticalmente */
    <div className={styles.container} style={{ height: 420, display: 'flex', flexDirection: 'column' }}>
      <div className={styles.header} style={{ marginBottom: '10px' }}>
        <h3 style={{ margin: 0 }}>{titulo}</h3>
        <span className={styles.hint} style={{ fontSize: '12px', color: '#666' }}>
          Agrupado pelo período selecionado
        </span>
      </div>

      {hasData ? (
        /* O flex: 1 garante que o gráfico use todo o espaço restante do card */
        <div style={{ flex: 1, width: '100%', minHeight: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={dataFormatada} 
              /* Ajuste de margem esquerda negativa para centralizar melhor */
              margin={{ top: 8, right: 30, left: -20, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#edf2f7" vertical={false} />
              <XAxis 
                dataKey="horario" 
                tick={{ fill: "#4a5568", fontSize: 12 }} 
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                allowDecimals={false} 
                tick={{ fill: "#4a5568", fontSize: 12 }} 
                tickLine={false}
                axisLine={false}
              />
              <Tooltip cursor={{ stroke: "#cbd5e0" }} />
              <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '20px' }} />
              
              <Line 
                type="monotone" 
                dataKey="no_horario" 
                name="No horário" 
                stroke="#4CAF50" 
                strokeWidth={3}
                dot={false} 
                activeDot={{ r: 6 }}
              />
              <Line type="monotone" dataKey="atrasados" name="Atrasados" stroke="#FFC107" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="faltantes" name="Faltantes" stroke="#F44336" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className={styles.empty} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
          Sem dados para o período escolhido.
        </div>
      )}
    </div>
  );
}