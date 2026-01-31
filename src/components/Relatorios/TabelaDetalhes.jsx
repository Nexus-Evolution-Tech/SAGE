import React from "react";
import { useNavigate } from "react-router-dom";
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

export default function TabelaDetalhes({ linhas = [], loading, onSearch, pagination }) {
  const navigate = useNavigate();
  const { page = 1, totalPages = 1, total = 0, pageSize = 25, onPageChange } = pagination || {};
  const temTurma = linhas.some((r) => r.turma);

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
                {temTurma && <th>Turma</th>}
                <th>Status</th>
                <th>Horário previsto</th>
                <th>Horário chegada</th>
              </tr>
            </thead>
            <tbody>
              {linhas.map((row) => (
                <tr
                  key={row.id ?? row.nome}
                  className={styles.rowLink}
                  onClick={() => row.id && navigate(`/relatorios/pessoa/${row.id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if ((e.key === "Enter" || e.key === " ") && row.id) {
                      e.preventDefault();
                      navigate(`/relatorios/pessoa/${row.id}`);
                    }
                  }}
                >
                  <td>{row.nome ?? "—"}</td>
                  {temTurma && <td>{row.turma ?? "—"}</td>}
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

      {pagination && total > 0 && (
        <div className={styles.pagination}>
          <span className={styles.paginationInfo}>
            {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, total)} de {total}
          </span>
          <div className={styles.paginationControls}>
            <button
              type="button"
              className={styles.pageBtn}
              onClick={() => onPageChange?.(page - 1)}
              disabled={page <= 1}
            >
              Anterior
            </button>
            <span className={styles.pageNum}>
              Página {page} de {totalPages}
            </span>
            <button
              type="button"
              className={styles.pageBtn}
              onClick={() => onPageChange?.(page + 1)}
              disabled={page >= totalPages}
            >
              Próxima
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
