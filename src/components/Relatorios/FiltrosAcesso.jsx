import React from "react";
import styles from "./FiltrosAcesso.module.css";

const PERIODOS = [
  { value: "TODAY", label: "Hoje" },
  { value: "WEEK", label: "Esta semana" },
  { value: "MONTH", label: "Este mês" },
  { value: "CUSTOM", label: "Personalizado" },
];

export default function FiltrosAcesso({
  filtros,
  onChange,
  turmas = [],
  onRefresh,
}) {
  const isCustom = filtros.periodo === "CUSTOM";

  return (
    <div className={styles.container}>
      <div className={styles.row}>
        <div className={styles.group}>
          <span className={styles.groupLabel}>Grupo</span>
          <button
            type="button"
            onClick={() => onChange({ ...filtros, grupo: "ALUNOS" })}
            className={filtros.grupo === "ALUNOS" ? styles.active : ""}
          >
            Alunos
          </button>
          <button
            type="button"
            onClick={() => onChange({ ...filtros, grupo: "FUNCIONARIOS" })}
            className={filtros.grupo === "FUNCIONARIOS" ? styles.active : ""}
          >
            Funcionários
          </button>
        </div>

        <div className={styles.group}>
          <span className={styles.groupLabel}>Período</span>
          {PERIODOS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() =>
                onChange({
                  ...filtros,
                  periodo: p.value,
                  ...(p.value !== "CUSTOM" ? { data_inicio: "", data_fim: "" } : {}),
                })
              }
              className={filtros.periodo === p.value ? styles.active : ""}
            >
              {p.label}
            </button>
          ))}
        </div>

        {turmas.length > 0 && (
          <div className={styles.selectGroup}>
            <label className={styles.groupLabel} htmlFor="turma">
              Turma
            </label>
            <select
              id="turma"
              value={filtros.turma_id || "TODOS"}
              onChange={(e) =>
                onChange({ ...filtros, turma_id: e.target.value })
              }
              className={styles.select}
            >
              <option value="TODOS">Todas</option>
              {turmas.map((t) => (
                <option key={t.id} value={String(t.id)}>
                  {t.nome}
                </option>
              ))}
            </select>
          </div>
        )}

        <button type="button" onClick={onRefresh} className={styles.refresh}>
          Atualizar
        </button>
      </div>

      {isCustom && (
        <div className={styles.dateRow}>
          <div className={styles.dateField}>
            <label htmlFor="data_inicio">De</label>
            <input
              id="data_inicio"
              type="date"
              value={filtros.data_inicio || ""}
              onChange={(e) =>
                onChange({ ...filtros, data_inicio: e.target.value })
              }
              className={styles.input}
            />
          </div>
          <div className={styles.dateField}>
            <label htmlFor="data_fim">Até</label>
            <input
              id="data_fim"
              type="date"
              value={filtros.data_fim || ""}
              onChange={(e) =>
                onChange({ ...filtros, data_fim: e.target.value })
              }
              className={styles.input}
            />
          </div>
        </div>
      )}
    </div>
  );
}
