import styles from "./Home.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faUnlock } from "@fortawesome/free-solid-svg-icons";
import userPlaceholder from "../../../img/user.png";
import { useCallback, useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../../services/api";
import { useWebSocket } from "../../../hooks/useWebSocket";
import useMonitoringStore from "../../../stores/monitoringStore";
import SkeletonLoader from "../../common/SkeletonLoader";
import { shallow } from "zustand/shallow";

function Monitoramento() {
  const itemsPerPage = 10;

  const recentAccesses = useMonitoringStore((state) => state.recentAccesses, shallow);

  // Enriquecer dados de acesso com foto/nome
  const enrichAccess = useCallback(async (acesso) => {
    const baseAccess = {
      ...acesso,
      area: "Portaria Principal",
      dispositivo: "Catraca Esquerda (IDBlock)",
      autorizacao: acesso.permitido ? "Acesso autorizado" : "Acesso negado",
      status: acesso.permitido ? "authorized" : "denied",
      dataHora: new Date(acesso.data_hora).toLocaleString("pt-BR"),
    };

    if (!acesso.pessoa_id) {
      return {
        ...baseAccess,
        nome: "Visitante/Desconhecido",
        foto: userPlaceholder,
        perfil: "N/A",
      };
    }

    try {
      const [pessoa, fotoData] = await Promise.all([
        api.get(`/pessoas/${acesso.pessoa_id}`),
        api.get(`/pessoas/url/${acesso.pessoa_id}`),
      ]);

      return {
        ...baseAccess,
        nome: pessoa.nome || "Nome não encontrado",
        foto: fotoData.url || userPlaceholder,
        perfil: pessoa.perfil || "Perfil não informado",
      };
    } catch (error) {
      console.error(
        `Erro ao buscar dados para pessoa_id ${acesso.pessoa_id}:`,
        error
      );
      return {
        ...baseAccess,
        nome: "Erro ao carregar dados",
        foto: userPlaceholder,
        perfil: "Erro",
      };
    }
  }, []);

  // Carregar acessos iniciais via React Query e preencher o store
  const {
    data,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["home", "acessos"],
    queryFn: async () => {
      const acessosResponse = await api.get("/acessos?page=1&limit=50");

      if (!acessosResponse.data || !Array.isArray(acessosResponse.data)) {
        throw new Error("Formato de resposta inesperado da API.");
      }

      const acessosArray = acessosResponse.data.sort((a, b) => {
        return new Date(b.data_hora) - new Date(a.data_hora);
      });

      const enrichedAccesses = await Promise.all(
        acessosArray.map(enrichAccess)
      );
      return enrichedAccesses;
    },
    staleTime: 10000, // 10 segundos para permitir updates rápidos
    gcTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    refetchInterval: 3000, // polling a cada 3s garante updates rápidos
  });

  // WebSocket para receber novos acessos em tempo real
  const onAccess = useCallback(
    async (data) => {
      console.log("[Home] acesso:novo recebido", data);
      const enriched = await enrichAccess(data);
      useMonitoringStore.getState().addRecentAccess(enriched);
    },
    [enrichAccess]
  );

  // Memorizar opções para evitar recriar objeto e resubscrever desnecessariamente
  const wsOptions = useMemo(
    () => ({
      autoSubscribeAccess: true,
      onAccess,
    }),
    [onAccess]
  );

  // Mantém WebSocket para receber acessos, mas não exibe status separado
  useWebSocket(wsOptions);

  // Health check da API (badge verde/vermelho)
  const { isError: apiError, isLoading: healthLoading } = useQuery({
    queryKey: ["health"],
    queryFn: async () => {
      await api.get("/health");
      return true;
    },
    refetchInterval: 5000, // 5s para acompanhar estado da API em tempo real
    staleTime: 4000,
    retry: 1,
  });

  const fallbackAccesses = data || [];
  const effectiveAccesses = recentAccesses.length > 0 ? recentAccesses : fallbackAccesses;

  const latestAccess = effectiveAccesses[0];
  const accessLogs = effectiveAccesses.slice(1);

  const isLoadingState = isLoading && effectiveAccesses.length === 0;

  // Liberar acesso: quando último acesso é negado, mostrar L | x (5 min limite; 1 min sem resposta = negado)
  const currentDeniedKey = latestAccess?.status === "denied"
    ? `${latestAccess.pessoa_id ?? "x"}-${latestAccess.data_hora ?? Date.now()}`
    : null;
  const [pendingDeniedKey, setPendingDeniedKey] = useState(null);
  const [pendingAt, setPendingAt] = useState(null);
  const [userChoice, setUserChoice] = useState(null); // 'liberar' | 'negar' | null

  useEffect(() => {
    if (currentDeniedKey && currentDeniedKey !== pendingDeniedKey) {
      setPendingDeniedKey(currentDeniedKey);
      setPendingAt(Date.now());
      setUserChoice(null);
    }
  }, [currentDeniedKey, pendingDeniedKey]);

  // 1 min sem resposta = considerado negado
  useEffect(() => {
    if (!pendingAt || userChoice !== null) return;
    const t = setTimeout(() => {
      setUserChoice("negar");
    }, 60 * 1000);
    return () => clearTimeout(t);
  }, [pendingAt, userChoice]);

  // 5 min: remove o bloco Liberar acesso
  useEffect(() => {
    if (!pendingAt) return;
    const t = setInterval(() => {
      if (Date.now() - pendingAt > 5 * 60 * 1000) {
        setPendingDeniedKey(null);
        setPendingAt(null);
        setUserChoice(null);
      }
    }, 5000);
    return () => clearInterval(t);
  }, [pendingAt]);

  const showLiberarAcesso =
    latestAccess?.status === "denied" &&
    pendingDeniedKey === currentDeniedKey &&
    pendingAt &&
    Date.now() - pendingAt <= 5 * 60 * 1000;

  const handleLiberar = () => {
    setUserChoice("liberar");
    // TODO: acionar endpoint na catraca para liberar acesso
  };

  const handleNegar = () => {
    setUserChoice("negar");
  };

  return (
    <div className={styles.monitoramentoContainer}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
        <h1 className={styles.pageTitle}>Monitoramento</h1>
        {/** API status: default offline while loading; online only after success */}
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.35rem",
            fontSize: "0.95rem",
            color: (!healthLoading && !apiError) ? "#0f9d58" : "#d93025",
          }}
        >
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: (!healthLoading && !apiError) ? "#0f9d58" : "#d93025",
              boxShadow: (!healthLoading && !apiError) ? "0 0 6px #0f9d58" : "0 0 6px #d93025",
            }}
          />
          {(!healthLoading && !apiError) ? "API online" : "API offline"}
        </span>
      </div>

      {isLoadingState && (
        <SkeletonLoader type="feed" count={5} />
      )}

      {error && !isLoadingState && (
        <p style={{ color: "red" }}>Erro ao carregar dados: {error.message || error}</p>
      )}
      {/* Exibe o relógio (opcional) */}
      {/* <p>{currentDateTime}</p> */}

      {latestAccess ? (
        <div className={styles.accessCard}>
          <div className={styles.profileInfo}>
            <div className={styles.profilePicture}>
              <img
                src={latestAccess.foto || userPlaceholder}
                alt="Foto de perfil"
                onError={(e) => { e.target.onerror = null; e.target.src = userPlaceholder; }}
              />
            </div>
            <div className={styles.profileDetails}>
              <p className={styles.dateTime}>
                Data e hora: {latestAccess.dataHora}
              </p>
              <h3>{latestAccess.nome || "Nome não encontrado"}</h3>
              <p>Área: {latestAccess.area}</p>
              {/* O nome do dispositivo aparecerá aqui automaticamente agora */}
              <p>Dispositivo: {latestAccess.dispositivo}</p>
              <br />
              <p>{latestAccess.autorizacao}</p>
              {latestAccess.status === "denied" && showLiberarAcesso && (
                <div className={styles.liberarAcesso}>
                  <span className={styles.liberarLabel}>Liberar acesso:</span>
                  {userChoice === null ? (
                    <>
                      <button
                        type="button"
                        className={styles.liberarBtn}
                        onClick={handleLiberar}
                        title="Liberar acesso"
                      >
                        L
                      </button>
                      <span className={styles.liberarSep}>|</span>
                      <button
                        type="button"
                        className={styles.negarBtn}
                        onClick={handleNegar}
                        title="Manter negado"
                      >
                        ×
                      </button>
                    </>
                  ) : userChoice === "liberar" ? (
                    <span className={styles.liberadoLabel}>
                      <FontAwesomeIcon icon={faUnlock} /> Liberado
                    </span>
                  ) : (
                    <span className={styles.negadoLabel}>Negado</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <p style={{textAlign: 'center', margin: '20px'}}>Nenhum acesso recente encontrado.</p>
      )}

      <div className={styles.tableContainer}>
        {isLoading ? (
          <SkeletonLoader type="table" count={itemsPerPage} />
        ) : (
          <table className={styles.accessTable}>
            <thead>
              <tr>
                <th>Foto</th>
                <th>Data e Hora</th>
                <th>Perfil</th>
                <th>Área</th>
                <th>Dispositivo</th>
                <th>Autorização</th>
              </tr>
            </thead>
            <tbody>
              {accessLogs.slice(0, itemsPerPage).map((log) => (
                <tr key={log.id}>
                  <td>
                    <img
                      src={log.foto || userPlaceholder}
                      alt="Foto"
                      className={styles.avatarImg}
                      onError={(e) => { e.target.onerror = null; e.target.src = userPlaceholder; }}
                    />
                  </td>
                  <td>{log.dataHora}</td>
                  <td>
                    <p className={styles.profileName}>{log.nome}</p>
                    <p className={styles.profileSubtitle}>{log.perfil}</p>
                  </td>
                  <td>{log.area}</td>
                  <td>{log.dispositivo}</td>
                  <td>
                    <span
                      className={`${styles.statusBadge} ${styles[log.status]}`}
                    >
                      {log.autorizacao}
                      {log.status === "denied" && (
                        <FontAwesomeIcon
                          icon={faTimes}
                          className={styles.deniedIcon}
                        />
                      )}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Monitoramento;