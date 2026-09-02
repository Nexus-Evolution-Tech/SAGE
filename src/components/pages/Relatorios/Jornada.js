import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getRelatorioJornada, getFolhaPresenca, getFolhaPonto } from "../../../services/api";
import BackButton from "../../layout/BackButton/BackButton";
import styles from "./Jornada.module.css";

function hoje() {
  return new Date().toISOString().slice(0, 10);
}

export default function Jornada() {
  const [dataInicio, setDataInicio] = useState(hoje);
  const [dataFim, setDataFim] = useState(hoje);
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["relatorios", "jornada", dataInicio, dataFim],
    queryFn: () => getRelatorioJornada({ data_inicio: dataInicio, data_fim: dataFim }),
    enabled: Boolean(dataInicio && dataFim && dataInicio <= dataFim),
  });
  const folhaPresencaQuery = useQuery({
    queryKey: ["relatorios", "folha-presenca", dataInicio, dataFim],
    queryFn: () => getFolhaPresenca({ data_inicio: dataInicio, data_fim: dataFim }),
    enabled: Boolean(dataInicio && dataFim && dataInicio <= dataFim),
  });
  const folhaPontoQuery = useQuery({
    queryKey: ["relatorios", "folha-ponto", dataInicio, dataFim],
    queryFn: () => getFolhaPonto({ data_inicio: dataInicio, data_fim: dataFim }),
    enabled: Boolean(dataInicio && dataFim && dataInicio <= dataFim),
  });

  const pendencias = data?.pendencias ?? [];
  const jornadas = data?.jornadas ?? [];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <BackButton fallback="/relatorios" />
        <div>
          <h1 className={styles.title}>Jornada e pendências</h1>
          <p className={styles.subtitle}>Eventos reais pareados sem estimar horários ausentes.</p>
        </div>
      </header>

      <section className={styles.surface}>
        <div className={styles.filters}>
          <label>De<input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} /></label>
          <label>Até<input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} /></label>
        </div>

        {isLoading && <p className={styles.message}>Carregando jornada...</p>}
        {isError && <p className={styles.error}>{error?.message || "Não foi possível carregar a jornada."}</p>}

        {!isLoading && !isError && (
          <>
            <div className={styles.summary}>
              <div><strong>{jornadas.length}</strong><span>dias com eventos</span></div>
              <div className={pendencias.length ? styles.warning : styles.ok}>
                <strong>{pendencias.length}</strong><span>pendências para revisão</span>
              </div>
            </div>

            <h2 className={styles.sectionTitle}>Pendências</h2>
            {pendencias.length === 0 ? (
              <p className={styles.message}>Nenhuma pendência no período.</p>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead><tr><th>Data</th><th>Pessoa</th><th>Turma</th><th>Tipo</th><th>Evento</th></tr></thead>
                  <tbody>{pendencias.map((item, index) => (
                    <tr key={`${item.evento?.id ?? "pendencia"}-${index}`}>
                      <td>{item.data}</td>
                      <td>{item.nome || "—"}</td>
                      <td>{item.turma || "—"}</td>
                      <td><span className={styles.badge}>{item.tipo}</span></td>
                      <td>{item.evento?.momento ? new Date(item.evento.momento).toLocaleTimeString("pt-BR") : "Sem horário"}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}

            <h2 className={styles.sectionTitle}>Jornadas pareadas</h2>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead><tr><th>Data</th><th>Pessoa</th><th>Turma</th><th>Pares</th><th>Pendências</th></tr></thead>
                <tbody>{jornadas.map((item) => (
                  <tr key={`${item.pessoa_id}-${item.data}`}>
                    <td>{item.data}</td><td>{item.nome || "—"}</td><td>{item.turma || "—"}</td>
                    <td>{item.pares.length}</td><td>{item.pendencias.length}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>

            <h2 className={styles.sectionTitle}>Folha de ponto — proposta</h2>
            {folhaPontoQuery.isLoading ? <p className={styles.message}>Calculando totais...</p> : folhaPontoQuery.isError ? <p className={styles.error}>Não foi possível calcular a folha de ponto.</p> : (
              <>
                <p className={folhaPontoQuery.data?.pode_fechar ? styles.okText : styles.warningText}>
                  {folhaPontoQuery.data?.pode_fechar ? "Período sem pendências: pronto para conferência humana." : "Fechamento bloqueado: resolva as pendências antes da confirmação."}
                </p>
                <div className={styles.tableWrap}><table className={styles.table}>
                  <thead><tr><th>Data</th><th>Pessoa</th><th>Pares</th><th>Total bruto</th><th>Pendências</th></tr></thead>
                  <tbody>{(folhaPontoQuery.data?.linhas ?? []).map((linha) => (
                    <tr key={`${linha.pessoa_id}-${linha.data}`}><td>{linha.data}</td><td>{linha.nome || "—"}</td><td>{linha.pares.length}</td><td>{Math.round(linha.total_ms / 60000)} min</td><td>{linha.pendencias.length}</td></tr>
                  ))}</tbody>
                </table></div>
              </>
            )}

            <h2 className={styles.sectionTitle}>Folha de presença por slot</h2>
            {folhaPresencaQuery.isLoading ? <p className={styles.message}>Calculando slots...</p> : folhaPresencaQuery.isError ? <p className={styles.error}>Não foi possível calcular a folha de presença.</p> : (
              <div className={styles.tableWrap}><table className={styles.table}>
                <thead><tr><th>Data</th><th>Pessoa</th><th>Turma</th><th>Faixa</th><th>Status</th></tr></thead>
                <tbody>{(folhaPresencaQuery.data?.linhas ?? []).map((linha, index) => (
                  <tr key={`${linha.pessoa_id}-${linha.data}-${linha.faixa_inicio}-${index}`}><td>{linha.data}</td><td>{linha.nome || "—"}</td><td>{linha.turma || "—"}</td><td>{linha.faixa_inicio}–{linha.faixa_fim}</td><td>{linha.status}</td></tr>
                ))}</tbody>
              </table></div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
