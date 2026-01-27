import React from "react";
import styles from "./TabelaDetalhes.module.css";

function formatStatus(status) {
  if (!status) return "-";
  const normalized = status.toString().toUpperCase();
  if (normalized.includes("ATRAS")) return "ATRASADO";
  if (normalized.includes("FALT")) return "FALTA";
  if (normalized.includes("HOR")) return "NO HORÁRIO";
  return normalized;
}

function statusTone(status) {
  const normalized = (status || "").toString().toUpperCase();
  if (normalized.includes("ATRAS")) return styles.warning;
  if (normalized.includes("FALT")) return styles.danger;
  return styles.success;
}

export default function TabelaDetalhes({ linhas = [], loading = false, onSearch }) {
  const safeLines = Array.isArray(linhas) ? linhas : [];

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div>
          <p className={styles.subtitle}>Detalhamento</p>
          <h3 className={styles.title}>Registros individuais</h3>
        </div>
        {onSearch && (
          <input
            className={styles.search}
            placeholder="Buscar por nome ou status"
            onChange={(e) => onSearch(e.target.value)}
          />
        )}
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Tipo/Turma</th>
              <th>Data</th>
              <th>Previsto</th>
              <th>Chegada</th>
              <th>Status</th>
              <th>Atraso (min)</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan="7" className={styles.empty}>Carregando registros...</td>
              </tr>
            )}
            {!loading && safeLines.length === 0 && (
              <tr>
                <td colSpan="7" className={styles.empty}>Nenhum registro para o filtro aplicado.</td>
              </tr>
            )}
            {!loading &&
              safeLines.map((linha) => (
                <tr key={linha.id || `${linha.nome}-${linha.data}-${linha.status}`}>
                  <td>{linha.nome || linha.pessoa || "-"}</td>
                  <td>{linha.tipo || linha.turma || "-"}</td>
                  <td>{linha.data ? new Date(linha.data).toLocaleDateString("pt-BR") : "-"}</td>
                  <td>{linha.horario_previsto || "-"}</td>
                  <td>{linha.horario_chegada || linha.hora_entrada || "-"}</td>
                  <td>
                    <span className={`${styles.badge} ${statusTone(linha.status)}`}>
                      {formatStatus(linha.status)}
                    </span>
                  </td>
                  <td>{linha.minutos_atraso ?? linha.atraso_minutos ?? "-"}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
