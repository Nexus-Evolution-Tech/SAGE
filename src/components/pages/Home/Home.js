import styles from "./Home.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilter, faTimes, faListOl } from "@fortawesome/free-solid-svg-icons";
import userPlaceholder from "../../../img/user.png";
import { useEffect, useState } from "react";

function Monitoramento() {
  const [accessLogs, setAccessLogs] = useState([]);
  const [latestAccess, setLatestAccess] = useState(null);
  const [currentDateTime, setCurrentDateTime] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(10);
  // Removido estado 'fotoUrl' pois não estava sendo usado

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const date = now.toLocaleDateString("pt-BR");
      const time = now.toLocaleTimeString("pt-BR");
      setCurrentDateTime(`${date} ${time}`);
    };

    updateDateTime();
    const intervalId = setInterval(updateDateTime, 1000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    async function enrichAccess(acesso) {
      // Objeto base para retorno
      const baseAccess = {
        ...acesso,
        area: "Portaria Principal",
        dispositivo: "Catraca Esquerda (IDBlock)",
        autorizacao: acesso.permitido ? "Acesso autorizado" : "Acesso negado",
        status: acesso.permitido ? "authorized" : "denied",
        dataHora: new Date(acesso.data_hora).toLocaleString("pt-BR"),
      };

      // Se não tiver pessoa_id, retorna os dados parciais
      if (!acesso.pessoa_id) {
        return {
          ...baseAccess,
          nome: "Visitante/Desconhecido",
          foto: userPlaceholder,
          perfil: "N/A",
        };
      }

      try {
        const [pessoaRes, fotoRes] = await Promise.all([
          fetch(`http://localhost:3000/pessoas/${acesso.pessoa_id}`),
          fetch(`http://localhost:3000/pessoas/url/${acesso.pessoa_id}`),
        ]);

        // Verificação de segurança (boa prática)
        if (!pessoaRes.ok)
          throw new Error(`Pessoa não encontrada (${pessoaRes.status})`);
        if (!fotoRes.ok)
          throw new Error(`URL da foto não encontrada (${fotoRes.status})`);

        const pessoa = await pessoaRes.json();
        const fotoData = await fotoRes.json();

        // ================== CORREÇÃO AQUI ==================
        // O objeto 'pessoa' não tem 'data' dentro dele
        return {
          ...baseAccess,
          nome: pessoa.nome || "Nome não encontrado", // ACESSO DIRETO
          foto: fotoData.url || userPlaceholder,
          perfil: pessoa.perfil || "Perfil não informado", // ACESSO DIRETO
        };
        // ===================================================
      } catch (error) {
        // Esta é a linha 71 que você vê no log
        console.error(
          `Erro ao buscar dados para pessoa_id ${acesso.pessoa_id}:`,
          error
        );
        // Retorna dados "quebrados" de forma controlada
        return {
          ...baseAccess,
          nome: "Erro ao carregar dados",
          foto: userPlaceholder,
          perfil: "Erro",
        };
      }
    }
    async function fetchAccesses() {
      try {
        const response = await fetch("http://localhost:3000/acessos");
        const acessosResponse = await response.json(); // É o objeto { data: [...] }

        // CORREÇÃO: 'acessosResponse.data' é o array que queremos iterar
        if (!acessosResponse.data || !Array.isArray(acessosResponse.data)) {
          console.error(
            "Formato de resposta inesperado da API:",
            acessosResponse
          );
          return;
        }

        const acessosArray = acessosResponse.data;

        // =================================================================
        // INÍCIO DA CORREÇÃO (ORDENAÇÃO)
        // =================================================================
        // Ordena o array pelos dados originais (mais recente primeiro)
        const sortedArray = acessosArray.sort((a, b) => {
          return new Date(b.data_hora) - new Date(a.data_hora);
        });
        // =================================================================
        // FIM DA CORREÇÃO
        // =================================================================

        // OTIMIZAÇÃO: Executa todas as promessas de "enriquecimento" em paralelo
        // (Agora usando o 'sortedArray')
        const enrichedAccesses = await Promise.all(
          sortedArray.map(enrichAccess)
        );

        if (enrichedAccesses.length > 0) {
          // Como o array está ordenado, o [0] é o mais recente
          setLatestAccess(enrichedAccesses[0]);
          setAccessLogs(enrichedAccesses.slice(1));
        }
      } catch (error) {
        console.error("Erro ao buscar acessos:", error);
      }
    }

    fetchAccesses();
  }, []); // Dependência vazia está correta, busca apenas uma vez

  return (
    <div className={styles.monitoramentoContainer}>
      <h1 className={styles.pageTitle}>Monitoramento</h1>

      {latestAccess ? (
        <div className={styles.accessCard}>
          <div className={styles.profileInfo}>
            <div className={styles.profilePicture}>
              <img
                src={latestAccess.foto || userPlaceholder}
                alt="Foto de perfil"
              />
            </div>
            <div className={styles.profileDetails}>
              <p className={styles.dateTime}>
                Data e hora: {latestAccess.dataHora}
              </p>
              <h3>{latestAccess.nome || "Nome não encontrado"}</h3>
              <p>Área: {latestAccess.area}</p>
              <p>Dispositivo: {latestAccess.dispositivo}</p>
              <br />
              <p>{latestAccess.autorizacao}</p>
            </div>
          </div>
        </div>
      ) : (
        <p>Carregando último acesso...</p>
      )}

      {/* Seu filtro (comentado) */}
      {/* <div className={styles.filterContainer}> ... </div> */}

      <div className={styles.tableContainer}>
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
              // 'log.id' do acesso original é uma chave melhor
              <tr key={log.id}>
                <td>
                  <img
                    src={log.foto || userPlaceholder}
                    alt="Foto"
                    style={{
                      width: "80px",
                      height: "80px",
                      borderRadius: "50%",
                      objectFit: "cover",
                    }}
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
      </div>
    </div>
  );
}

export default Monitoramento;