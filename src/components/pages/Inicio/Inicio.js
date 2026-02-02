import React, { useCallback, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUsers,
  faDoorOpen,
  faChartSimple,
  faArrowRight,
  faUserCheck,
  faMicrochip,
  faCircleCheck,
  faCircleXmark,
  faList,
  faClock,
  faUserClock,
  faUserTie,
  faMapMarkerAlt,
  faCalendarAlt,
} from "@fortawesome/free-solid-svg-icons";
import { api } from "../../../services/api";
import SystemStatusBadge from "../../common/SystemStatusBadge/SystemStatusBadge";
import styles from "./Inicio.module.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3000";
function getLogoUrl(logo) {
  if (!logo) return null;
  if (logo.startsWith("http://") || logo.startsWith("https://")) return logo;
  return `${API_URL.replace(/\/$/, "")}/uploads/${logo.replace(/^\/+/, "")}`;
}

function getCount(res) {
  if (Array.isArray(res)) return res.length;
  if (res?.data && Array.isArray(res.data)) return res.data.length;
  if (typeof res?.total === "number") return res.total;
  return 0;
}

function useCountQuery(key, queryFn, options = {}) {
  const { data, isLoading } = useQuery({
    queryKey: ["inicio", key],
    queryFn,
    staleTime: 1000 * 60 * 2,
    ...options,
  });
  const count = data !== undefined ? getCount(data) : 0;
  return { count, isLoading };
}

export default function Inicio() {
  const hoje = new Date().toDateString();
  const [dataHora, setDataHora] = useState(() => ({
    date: new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" }),
    time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
  }));
  useEffect(() => {
    const t = setInterval(() => {
      const d = new Date();
      setDataHora({
        date: d.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" }),
        time: d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      });
    }, 60000);
    return () => clearInterval(t);
  }, []);

  const { count: totalPessoas, isLoading: loadingPessoas } = useCountQuery(
    "pessoas",
    () => api.get("/pessoas?limit=10000")
  );

  const {
    data: dispositivosData,
    isLoading: loadingDispositivos,
  } = useQuery({
    queryKey: ["inicio", "dispositivos"],
    queryFn: async () => {
      const [devs, status] = await Promise.all([
        api.get("/dispositivos"),
        api.get("/dispositivos/status").catch(() => []),
      ]);
      const list = devs?.data ?? (Array.isArray(devs) ? devs : []);
      const statusMap = {};
      (Array.isArray(status) ? status : []).forEach((item) => {
        statusMap[item.id] = (item.status || "").toUpperCase();
      });
      const online = list.filter(
        (d) => statusMap[d.id] === "ONLINE" || statusMap[d.id] === "ON"
      ).length;
      return { total: list.length, online, offline: list.length - online };
    },
    staleTime: 1000 * 60,
  });

  const { count: acessosHoje, isLoading: loadingAcessos } = useCountQuery(
    "acessos-hoje",
    async () => {
      const r = await api.get("/acessos?page=1&limit=500");
      const list = Array.isArray(r) ? r : r?.data ?? [];
      return list.filter((a) => {
        const d = a.data_hora ? new Date(a.data_hora) : null;
        return d && d.toDateString() === hoje;
      });
    },
    { staleTime: 1000 * 60 }
  );

  const { isError: apiError, isLoading: healthLoading } = useQuery({
    queryKey: ["health"],
    queryFn: () => api.get("/health"),
    refetchInterval: 5000,
    staleTime: 4000,
    retry: 1,
  });

  const enrichAccess = useCallback(async (acesso) => {
    const dataHora = acesso.data_hora
      ? new Date(acesso.data_hora).toLocaleString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";
    if (!acesso.pessoa_id) {
      return {
        id: acesso.id,
        nome: "Visitante",
        dataHora,
        permitido: acesso.permitido,
      };
    }
    try {
      const pessoa = await api.get(`/pessoas/${acesso.pessoa_id}`);
      return {
        id: acesso.id,
        nome: pessoa.nome || "—",
        dataHora,
        permitido: acesso.permitido,
      };
    } catch {
      return {
        id: acesso.id,
        nome: "—",
        dataHora,
        permitido: acesso.permitido,
      };
    }
  }, []);

  const {
    data: ultimosAcessos = [],
    isLoading: loadingUltimos,
  } = useQuery({
    queryKey: ["inicio", "ultimos-acessos"],
    queryFn: async () => {
      const r = await api.get("/acessos?page=1&limit=5");
      const list = Array.isArray(r) ? r : r?.data ?? [];
      const sorted = [...list].sort(
        (a, b) => new Date(b.data_hora) - new Date(a.data_hora)
      );
      return Promise.all(sorted.slice(0, 5).map(enrichAccess));
    },
    staleTime: 1000 * 60,
  });

  const apiOnline = !healthLoading && !apiError;

  const { data: unidade } = useQuery({
    queryKey: ["inicio", "unidade"],
    queryFn: () => api.get("/unidade"),
    staleTime: 1000 * 60 * 5,
  });

  const { data: resumoAlunos } = useQuery({
    queryKey: ["inicio", "resumo-alunos"],
    queryFn: () => api.get("/relatorios/acesso/resumo?periodo=TODAY&grupo=ALUNOS"),
    staleTime: 1000 * 60,
  });
  const { data: resumoFuncionarios } = useQuery({
    queryKey: ["inicio", "resumo-funcionarios"],
    queryFn: () => api.get("/relatorios/acesso/resumo?periodo=TODAY&grupo=FUNCIONARIOS"),
    staleTime: 1000 * 60,
  });
  const metricasAlunos = resumoAlunos?.metricas ?? {};
  const metricasFunc = resumoFuncionarios?.metricas ?? {};
  const alunosAtrasados = metricasAlunos.atrasados ?? 0;
  const funcionariosPresentes = (metricasFunc.no_horario ?? 0) + (metricasFunc.atrasados ?? 0);

  const atalhos = [
    { to: "/pessoas", label: "Pessoas", desc: "Alunos, professores e mais", icon: faUsers },
    { to: "/dispositivos", label: "Dispositivos", desc: "Catracas e equipamentos", icon: faMicrochip },
    { to: "/areas", label: "Áreas", desc: "Locais e controle de acesso", icon: faMapMarkerAlt },
    { to: "/horarios", label: "Horários", desc: "Grade de aulas e horários", icon: faCalendarAlt },
    { to: "/relatorios", label: "Relatórios", desc: "Presença e acessos", icon: faChartSimple },
  ];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleContainer}>
          <h1 className={styles.title}>Início</h1>
          <SystemStatusBadge
            status={healthLoading ? "loading" : apiError ? "offline" : "online"}
            label={healthLoading ? "Verificando..." : apiOnline ? "API online" : "API offline"}
            title={apiOnline ? "API respondendo" : "API indisponível"}
          />
          <span className={styles.dataHora} title={dataHora.date}>
            <FontAwesomeIcon icon={faClock} className={styles.dataHoraIcon} />
            {dataHora.date} — {dataHora.time}
          </span>
        </div>
      </header>

      <div className={styles.surface}>
        {/* Logo e nome da escola (só na tela Início) */}
        {(unidade?.nome || unidade?.logo) && (
          <div className={styles.escolaBrand}>
            {unidade.logo && (
              <div className={styles.escolaLogo}>
                <img src={getLogoUrl(unidade.logo)} alt="" onError={(e) => { e.target.style.display = "none"; }} />
              </div>
            )}
            {unidade.nome && <h2 className={styles.escolaNome}>{unidade.nome}</h2>}
          </div>
        )}

        {/* Métricas principais */}
        <div className={styles.metricsGrid}>
          <div className={styles.card}>
            <div className={styles.cardIcon} data-color="green">
              <FontAwesomeIcon icon={faUserCheck} />
            </div>
            <div className={styles.cardContent}>
              <span className={styles.cardLabel}>Pessoas cadastradas</span>
              {loadingPessoas ? (
                <span className={styles.cardValue} aria-busy="true">—</span>
              ) : (
                <span className={styles.cardValue}>{totalPessoas}</span>
              )}
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardIcon} data-color="blue">
              <FontAwesomeIcon icon={faMicrochip} />
            </div>
            <div className={styles.cardContent}>
              <span className={styles.cardLabel}>Dispositivos</span>
              {loadingDispositivos ? (
                <span className={styles.cardValue} aria-busy="true">—</span>
              ) : (
                <span className={styles.cardValue}>
                  {dispositivosData?.online ?? 0} de {dispositivosData?.total ?? 0} online
                </span>
              )}
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardIcon} data-color="purple">
              <FontAwesomeIcon icon={faDoorOpen} />
            </div>
            <div className={styles.cardContent}>
              <span className={styles.cardLabel}>Acessos hoje</span>
              {loadingAcessos ? (
                <span className={styles.cardValue} aria-busy="true">—</span>
              ) : (
                <span className={styles.cardValue}>{acessosHoje}</span>
              )}
            </div>
          </div>
        </div>

        {/* Card resumidor — insights do dia */}
        <div className={styles.insightsCard}>
          <h2 className={styles.insightsTitle}>Resumo do dia</h2>
          <div className={styles.insightsGrid}>
            <div className={styles.insightItem}>
              <FontAwesomeIcon icon={faUserClock} className={styles.insightIcon} />
              <span className={styles.insightLabel}>Alunos atrasados hoje</span>
              <span className={styles.insightValue}>{alunosAtrasados}</span>
            </div>
            <div className={styles.insightItem}>
              <FontAwesomeIcon icon={faUserTie} className={styles.insightIcon} />
              <span className={styles.insightLabel}>Funcionários presentes hoje</span>
              <span className={styles.insightValue}>{funcionariosPresentes}</span>
            </div>
          </div>
        </div>

        {/* Últimos acessos (dashboard only) + Atalhos */}
        <div className={styles.dashboardRow}>
          <div className={styles.ultimosAcessos}>
            <div className={styles.ultimosHeader}>
              <h2 className={styles.ultimosTitle}>
                <FontAwesomeIcon icon={faList} className={styles.ultimosIcon} />
                Últimos acessos
              </h2>
              <Link to="/monitoramento" className={styles.verTodos}>
                Ver todos
              </Link>
            </div>
            {loadingUltimos ? (
              <ul className={styles.ultimosList}>
                {[1, 2, 3].map((i) => (
                  <li key={i} className={styles.ultimosItem}>
                    <span className={styles.ultimosSkeleton}>—</span>
                  </li>
                ))}
              </ul>
            ) : ultimosAcessos.length === 0 ? (
              <p className={styles.ultimosEmpty}>Nenhum acesso recente.</p>
            ) : (
              <ul className={styles.ultimosList}>
                {ultimosAcessos.map((a) => (
                  <li key={a.id} className={styles.ultimosItem}>
                    <span className={styles.ultimosNome}>{a.nome}</span>
                    <span className={styles.ultimosHora}>{a.dataHora}</span>
                    {a.permitido ? (
                      <FontAwesomeIcon icon={faCircleCheck} className={styles.ultimosOk} />
                    ) : (
                      <FontAwesomeIcon icon={faCircleXmark} className={styles.ultimosNok} />
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className={styles.atalhosGrid}>
            {atalhos.map((a) => (
              <Link
                key={a.to}
                to={a.to}
                className={styles.atalhoCard}
              >
                <div className={styles.atalhoIcon}>
                  <FontAwesomeIcon icon={a.icon} />
                </div>
                <div className={styles.atalhoText}>
                  <span className={styles.atalhoLabel}>{a.label}</span>
                  <span className={styles.atalhoDesc}>{a.desc}</span>
                </div>
                <FontAwesomeIcon icon={faArrowRight} className={styles.atalhoArrow} />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
