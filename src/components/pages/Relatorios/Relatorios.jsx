import React, { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getRelatorioAcessoResumo,
  getRelatorioAcessoDetalhes,
  getRelatorioTurmas,
} from "../../../services/api";

import FiltrosAcesso from "../../Relatorios/FiltrosAcesso.jsx";
import GraficosPizza from "../../Relatorios/GraficosPizza.jsx";
import GraficosLinha from "../../Relatorios/GraficosLinha.jsx";
import MetricasCard from "../../Relatorios/MetricasCard.jsx";
import TabelaDetalhes from "../../Relatorios/TabelaDetalhes.jsx";

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

function normalizarPizza(data) {
  if (!Array.isArray(data)) return [];
  return data.map((item) => ({
    ...item,
    color: item.color || (item.label?.toUpperCase().includes("ATRAS") ? cores.amarelo : 
           item.label?.toUpperCase().includes("FALT") ? cores.vermelho : cores.verde),
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

export default function Relatorios() {
  const [filtros, setFiltros] = useState(filtrosIniciais);
  const [busca, setBusca] = useState("");
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
  });

  const detalhesQuery = useQuery({
    queryKey: ["relatorios", "detalhes", filtros],
    queryFn: () => getRelatorioAcessoDetalhes({ ...filtros, limit: 20 }),
  });

  const metricas = resumoQuery.data?.metricas || { total: 0, no_horario: 0, atrasados: 0, faltantes: 0 };
  const pizza = normalizarPizza(resumoQuery.data?.dados_pizza || resumoQuery.data?.pizza);
  const linha = normalizarLinha(resumoQuery.data?.dados_linha || resumoQuery.data?.linha);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["relatorios"] });
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>Relatórios SAGE</p>
          <h1 className={styles.title}>Acesso e Presença</h1>
          <p className={styles.data}>
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className={styles.status}>
          {resumoQuery.isFetching ? 'Atualizando...' : 'Conectado'}
        </div>
      </header>

      <div className={styles.surface}>
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

        <TabelaDetalhes
          linhas={detalhesQuery.data?.dados || []}
          loading={detalhesQuery.isLoading}
          onSearch={setBusca}
        />
      </div>
    </div>
  );
}