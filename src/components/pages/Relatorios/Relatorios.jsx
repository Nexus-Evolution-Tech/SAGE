import React, { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getRelatorioAcessoResumo,
  getRelatorioAcessoDetalhes,
  getRelatorioTurmas,
} from "../../../services/api";
import FiltrosAcesso from "../../Relatorios/FiltrosAcesso";
import GraficosPizza from "../../Relatorios/GraficosPizza";
import GraficosLinha from "../../Relatorios/GraficosLinha";
import MetricasCard from "../../Relatorios/MetricasCard";
import TabelaDetalhes from "../../Relatorios/TabelaDetalhes";
import BotaoExportar from "../../Relatorios/BotaoExportar";
import SimularAcesso from "../../Relatorios/SimularAcesso";
import styles from "./Relatorios.module.css";

const filtrosIniciais = {
  grupo: "ALUNOS",
  tipo_funcionario: "TODOS",
  turma_id: "TODOS",
  periodo: "TODAY",
  data_inicio: "",
  data_fim: "",
};

const cores = {
  verde: "#4CAF50",
  amarelo: "#FFC107",
  vermelho: "#F44336",
};

const emptyMetricas = {
  total: 0,
  no_horario: 0,
  atrasados: 0,
  faltantes: 0,
  percentual_presenca: 0,
};

function normalizarPizza(data) {
  if (!Array.isArray(data)) return [];
  return data.map((item) => ({
    ...item,
    color: (() => {
      if (item.color) return item.color;
      if (item.label) {
        const label = item.label.toUpperCase();
        if (label.includes("ATRAS")) return cores.amarelo;
        if (label.includes("FALT")) return cores.vermelho;
        if (label.includes("HOR")) return cores.verde;
      }
      return cores.verde;
    })(),
    percentual: item.percentual ?? item.percent ?? 0,
  }));
}

function normalizarLinha(data) {
  if (!Array.isArray(data)) return [];
  return data.map((item) => ({
    horario: item.horario || item.label,
    no_horario: Number(item.no_horario) || 0,
    atrasados: Number(item.atrasados) || 0,
    faltantes: Number(item.faltantes) || 0,
  }));
}

function normalizarTabela(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (data.dados && Array.isArray(data.dados)) return data.dados;
  if (data.items && Array.isArray(data.items)) return data.items;
  return [];
}

export default function Relatorios() {
  const [filtros, setFiltros] = useState(filtrosIniciais);
  const [busca, setBusca] = useState("");
  const [showSimularAcesso, setShowSimularAcesso] = useState(false);
  const queryClient = useQueryClient();

  const turmasQuery = useQuery({
    queryKey: ["relatorios", "turmas"],
    queryFn: getRelatorioTurmas,
    staleTime: 1000 * 60 * 60,
  });

  const resumoQuery = useQuery({
    queryKey: ["relatorios", "resumo", filtros],
    queryFn: () => getRelatorioAcessoResumo(filtros),
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const detalhesQuery = useQuery({
    queryKey: ["relatorios", "detalhes", filtros],
    queryFn: () => getRelatorioAcessoDetalhes({ ...filtros, limit: 20 }),
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const metricas = resumoQuery.data?.metricas || emptyMetricas;
  const pizza = normalizarPizza(resumoQuery.data?.dados_pizza || resumoQuery.data?.pizza);
  const linha = normalizarLinha(resumoQuery.data?.dados_linha || resumoQuery.data?.linha);

  const linhasTabela = useMemo(() => {
    const base = normalizarTabela(
      detalhesQuery.data?.dados || detalhesQuery.data?.detalhes || detalhesQuery.data
    );

    if (!busca) return base;

    const term = busca.toLowerCase();
    return base.filter((linha) =>
      [linha.nome, linha.tipo, linha.turma, linha.status]
        .filter(Boolean)
        .some((field) => field.toString().toLowerCase().includes(term))
    );
  }, [detalhesQuery.data, busca]);

  const handleExport = (tipoArquivo) => {
    // TODO: integrar com endpoint de exportação quando backend estiver pronto
    console.log(`[Relatórios] Exportar ${tipoArquivo}`, filtros);
    alert(`Exportação ${tipoArquivo} será habilitada após o endpoint estar disponível.`);
  };

  const handleRefresh = () => {
    resumoQuery.refetch();
    detalhesQuery.refetch();
  };

  return (
    <div className={styles.page}>
      <FiltrosAcesso
        filtros={filtros}
        onChange={setFiltros}
        turmas={turmasQuery.data || []}
        onRefresh={handleRefresh}
      />

      <div className={styles.metricsGrid}>
        <MetricasCard label="Total" value={metricas.total} color="#0ea5e9" />
        <MetricasCard label="No horário" value={metricas.no_horario} color={cores.verde} />
        <MetricasCard label="Atrasados" value={metricas.atrasados} color={cores.amarelo} />
        <MetricasCard label="Faltantes" value={metricas.faltantes} color={cores.vermelho} />
      </div>

      <div className={styles.charts}>
        <GraficosPizza dados={pizza} />
        <GraficosLinha dados={linha} />
      </div>

      <div className={styles.actions}>
        <div>
          <p className={styles.helper}>
            Frequência: {metricas.percentual_presenca ? `${metricas.percentual_presenca}%` : "0%"}
          </p>
        </div>
        <div className={styles.actionButtons}>
          <button 
            className={styles.simulateBtn}
            onClick={() => setShowSimularAcesso(true)}
            title="Simular entrada/saída de aluno para testes"
          >
            + Simular Acesso
          </button>
          <BotaoExportar onExport={handleExport} />
        </div>
      </div>

      <SimularAcesso
        isOpen={showSimularAcesso}
        onClose={() => setShowSimularAcesso(false)}
        onSuccess={() => {
          // Invalida todas as queries de relatório para forçar refetch
          queryClient.invalidateQueries({ queryKey: ["relatorios"] });
          setShowSimularAcesso(false);
        }}
      />

      <TabelaDetalhes
        linhas={linhasTabela}
        loading={detalhesQuery.isLoading}
        onSearch={setBusca}
      />

      {resumoQuery.isError && (
        <div className={styles.error}>Erro ao carregar resumo: {resumoQuery.error?.message}</div>
      )}
      {detalhesQuery.isError && (
        <div className={styles.error}>Erro ao carregar detalhes: {detalhesQuery.error?.message}</div>
      )}
    </div>
  );
}
