import React from "react";
import styles from "./FiltrosAcesso.module.css";

const PERIODOS = [
  { value: "TODAY", label: "Hoje" },
  { value: "SPECIFIC_DAY", label: "Dia específico" },
  { value: "CURRENT_WEEK", label: "Semana atual" },
  { value: "CURRENT_MONTH", label: "Mês atual" },
  { value: "SPECIFIC_WEEK", label: "Semana específica" },
  { value: "SPECIFIC_MONTH", label: "Mês específico" },
];

const TIPOS_FUNCIONARIO = [
  { value: "TODOS", label: "Todos" },
  { value: "PROFESSOR", label: "Professores" },
  { value: "ADMIN", label: "Administrativos" },
  { value: "TERCEIRIZADO", label: "Terceirizados" },
];

export default function FiltrosAcesso({ filtros, onChange, turmas = [], onRefresh }) {
  const handleGrupo = (grupo) => {
    onChange({
      ...filtros,
      grupo,
      tipo_funcionario: grupo === "FUNCIONARIOS" ? filtros.tipo_funcionario || "TODOS" : null,
      turma_id: grupo === "ALUNOS" ? filtros.turma_id : null,
    });
  };

  const handleSelect = (field, value) => {
    onChange({ ...filtros, [field]: value });
  };

  const shouldShowDataRange = ["SPECIFIC_DAY", "SPECIFIC_WEEK", "SPECIFIC_MONTH"].includes(
    filtros.periodo
  );

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div>
          <p className={styles.subtitle}>Filtros do relatório</p>
          <h2 className={styles.title}>Acesso & Presença</h2>
        </div>
        <div className={styles.actions}>
          <button className={styles.refresh} onClick={onRefresh}>Atualizar</button>
        </div>
      </div>

      <div className={styles.grid}>
        <div className={styles.groupBox}>
          <span className={styles.label}>Grupo</span>
          <div className={styles.segmented}>
            <button
              className={`${styles.segment} ${filtros.grupo === "FUNCIONARIOS" ? styles.active : ""}`}
              onClick={() => handleGrupo("FUNCIONARIOS")}
              type="button"
            >
              Funcionários
            </button>
            <button
              className={`${styles.segment} ${filtros.grupo === "ALUNOS" ? styles.active : ""}`}
              onClick={() => handleGrupo("ALUNOS")}
              type="button"
            >
              Alunos
            </button>
          </div>
        </div>

        {filtros.grupo === "FUNCIONARIOS" ? (
          <div className={styles.field}>
            <label className={styles.label}>Tipo de Funcionário</label>
            <select
              className={styles.select}
              value={filtros.tipo_funcionario || "TODOS"}
              onChange={(e) => handleSelect("tipo_funcionario", e.target.value)}
            >
              {TIPOS_FUNCIONARIO.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className={styles.field}>
            <label className={styles.label}>Turma</label>
            <select
              className={styles.select}
              value={filtros.turma_id || "TODOS"}
              onChange={(e) => handleSelect("turma_id", e.target.value)}
            >
              <option value="TODOS">Todas</option>
              {turmas.map((turma) => (
                <option key={turma.id || turma.turma_id} value={turma.id || turma.turma_id}>
                  {turma.nome || turma.turma}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className={styles.field}>
          <label className={styles.label}>Período</label>
          <select
            className={styles.select}
            value={filtros.periodo}
            onChange={(e) => handleSelect("periodo", e.target.value)}
          >
            {PERIODOS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {shouldShowDataRange && (
          <div className={styles.range}>
            <div className={styles.field}>
              <label className={styles.label}>Data inicial</label>
              <input
                type="date"
                className={styles.select}
                value={filtros.data_inicio || ""}
                onChange={(e) => handleSelect("data_inicio", e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Data final</label>
              <input
                type="date"
                className={styles.select}
                value={filtros.data_fim || ""}
                onChange={(e) => handleSelect("data_fim", e.target.value)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
