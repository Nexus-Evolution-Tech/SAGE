import React, { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
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
import BackButton from "../../layout/BackButton/BackButton";
import { getRelatorioPessoaHistorico } from "../../../services/api";
import styles from "./PessoaHistorico.module.css";

const PAGE_SIZE = 30;
const CORES = { no_horario: "#4CAF50", atrasados: "#FFC107", faltantes: "#F44336" };

function formatarData(val) {
  if (val == null || val === "") return "—";
  const d = val instanceof Date ? val : new Date(val);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function PessoaHistorico() {
  const { id } = useParams();
  const [dataInicio, setDataInicio] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [dataFim, setDataFim] = useState(() => new Date().toISOString().slice(0, 10));
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["relatorios", "pessoa", "historico", id, dataInicio, dataFim, page],
    queryFn: () =>
      getRelatorioPessoaHistorico(Number(id), {
        data_inicio: dataInicio,
        data_fim: dataFim,
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
      }),
    enabled: !!id,
  });

  const pessoa = data?.pessoa;
  const historico = data?.historico ?? [];
  const dadosLinha = data?.dados_linha ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;

  const chartData = useMemo(
    () =>
      dadosLinha.map((d) => ({
        data: d.data,
        "No horário": Number(d.no_horario) || 0,
        Atrasados: Number(d.atrasados) || 0,
        Faltantes: Number(d.faltantes) || 0,
      })),
    [dadosLinha]
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <BackButton fallback="/relatorios" />
        <h1 className={styles.title}>Histórico de Acesso e Presença</h1>
      </div>

      {isLoading && <div className={styles.loading}>Carregando...</div>}
      {isError && (
        <div className={styles.error}>
          {error?.message || "Erro ao carregar histórico."}
        </div>
      )}

      {pessoa && (
        <div className={styles.surface}>
          <div className={styles.pessoaCard}>
            <h2 className={styles.pessoaNome}>{pessoa.nome}</h2>
            <div className={styles.pessoaMeta}>
              {pessoa.turma && <span>Turma: {pessoa.turma}</span>}
              <span>Tipo: {pessoa.tipo || "—"}</span>
            </div>
          </div>

          <div className={styles.filtros}>
            <div className={styles.filtroGrupo}>
              <label htmlFor="data_inicio">De</label>
              <input
                id="data_inicio"
                type="date"
                value={dataInicio}
                onChange={(e) => {
                  setDataInicio(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div className={styles.filtroGrupo}>
              <label htmlFor="data_fim">Até</label>
              <input
                id="data_fim"
                type="date"
                value={dataFim}
                onChange={(e) => {
                  setDataFim(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>

          {chartData.length > 0 && (
            <div className={styles.chartWrap}>
              <h3 className={styles.chartTitle}>Status por dia</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData} margin={{ top: 10, right: 30, left: -10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="data"
                    tick={{ fontSize: 11 }}
                    stroke="#64748b"
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => (v ? new Date(v).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) : "")}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    stroke="#64748b"
                    axisLine={false}
                    tickLine={false}
                    domain={[0, 1]}
                    ticks={[0, 1]}
                    tickFormatter={(v) => (v ? "Sim" : "")}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0" }}
                    labelFormatter={(v) => (v ? formatarData(v) : "")}
                  />
                  <Legend verticalAlign="top" align="right" iconType="circle" />
                  <Line type="monotone" dataKey="No horário" stroke={CORES.no_horario} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="Atrasados" stroke={CORES.atrasados} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="Faltantes" stroke={CORES.faltantes} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className={styles.tableWrap}>
            {historico.length === 0 ? (
              <div className={styles.empty}>
                Nenhum registro no período selecionado.
              </div>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Entrada</th>
                    <th>Saída</th>
                    <th>Status</th>
                    <th>Observações</th>
                  </tr>
                </thead>
                <tbody>
                  {historico.map((item, i) => (
                    <tr key={i}>
                      <td>{formatarData(item.data)}</td>
                      <td>{item.horario_entrada ?? "—"}</td>
                      <td>{item.horario_saida ?? "—"}</td>
                      <td>
                        {item.status === "ATRASADO" ? (
                          <span className={styles.statusAtrasado}>Atrasado</span>
                        ) : item.status === "NO_HORARIO" ? (
                          <span className={styles.statusOk}>No horário</span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>{item.observacoes ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {total > 0 && (
            <div className={styles.pagination}>
              <span className={styles.paginationInfo}>
                {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, total)} de {total}
              </span>
              <div className={styles.paginationControls}>
                <button
                  type="button"
                  className={styles.pageBtn}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  Anterior
                </button>
                <span>
                  Página {page} de {totalPages}
                </span>
                <button
                  type="button"
                  className={styles.pageBtn}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
