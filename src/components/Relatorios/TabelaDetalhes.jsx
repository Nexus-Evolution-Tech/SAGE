import React from "react";
import styles from "./TabelaDetalhes.module.css";

const STATUS_LABEL = {
  NO_HORARIO: "No horário",
  ATRASADO: "Atrasado",
  FALTANTE: "Faltante",
};

function StatusBadge({ status }) {
  const label = STATUS_LABEL[status] || status;
  const className =
    status === "NO_HORARIO"
      ? styles.badgeOk
      : status === "ATRASADO"
        ? styles.badgeWarn
        : styles.badgeErr;
  return <span className={className}>{label}</span>;
}

export default function TabelaDetalhes({ linhas = [], loading, onSearch }) {
  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Detalhes por pessoa</h3>
      <input
        type="text"
        placeholder="Pesquisar por nome, status..."
        className={styles.search}
        onChange={(e) => onSearch?.(e.target.value)}
      />
      <div className={styles.tableWrap}>
        {loading ? (
          <div className={styles.loading}>Carregando...</div>
        ) : !linhas.length ? (
          <div className={styles.empty}>Nenhum registro encontrado</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Status</th>
                <th>Horário previsto</th>
                <th>Horário chegada</th>
              </tr>
            </thead>
            <tbody>
              {linhas.map((row) => (
                <tr key={row.id ?? row.nome}>
                  <td>{row.nome ?? "—"}</td>
                  <td>
                    <StatusBadge status={row.status} />
                  </td>
                  <td>{row.horario_previsto ?? "—"}</td>
                  <td>{row.horario_chegada ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
