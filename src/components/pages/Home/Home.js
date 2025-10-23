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
  const [fotoUrl, setFotoUrl] = useState("foto_exemplo.png");

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
    async function fetchAccesses() {
      try {
        const response = await fetch("http://localhost:3000/acessos?limit=10");
        const acessos = await response.json();

        async function enrichAccess(acesso) {
          if (!acesso.pessoa_id) return acesso;

          try {
            const pessoaRes = await fetch(
              `http://localhost:3000/pessoas/${acesso.pessoa_id}`
            );
            const pessoa = await pessoaRes.json();

            const fotoRes = await fetch(
              `http://localhost:3000/pessoas/url/${acesso.pessoa_id}`
            );
            const fotoData = await fotoRes.json();

            return {
              ...acesso,
              nome: pessoa.nome,
              foto: fotoData.url || userPlaceholder,
              perfil: pessoa.perfil || "Perfil não informado",
              area: "Portaria Principal",
              dispositivo: "Catraca Esquerda (IDBlock)",
              autorizacao: acesso.permitido
                ? "Acesso autorizado"
                : "Acesso negado",
              status: acesso.permitido ? "authorized" : "denied",
              dataHora: new Date(acesso.data_hora).toLocaleString("pt-BR"),
            };
          } catch (error) {
            console.error("Erro ao buscar pessoa ou foto:", error);
            return acesso;
          }
        }

        const enrichedAccesses = [];
        for (let i = 0; i < acessos.length; i++) {
          const enriched = await enrichAccess(acessos[i]);
          enrichedAccesses.push(enriched);
        }

        setLatestAccess(enrichedAccesses[0]);
        setAccessLogs(enrichedAccesses.slice(1));
      } catch (error) {
        console.error("Erro ao buscar acessos:", error);
      }
    }

    fetchAccesses();
  }, []);

  
  return (
    <div className={styles.monitoramentoContainer}>
      <h1 className={styles.pageTitle}>Monitoramento</h1>

      {latestAccess && (
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
      )}

      {/* <div className={styles.filterContainer}>
        <div className={styles.filterButton}>
          <FontAwesomeIcon icon={faListOl} className={styles.deniedIcon} />
          <p className={styles.itemsText}>Itens por página</p>

          <select
            className={styles.dropdown}
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>

        <div className={styles.filterButton}>
          <FontAwesomeIcon icon={faFilter} className={styles.deniedIcon} />
        </div>
      </div> */}

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
              <tr key={log.id}>
                <td>
                  <img
                    src={log.foto || userPlaceholder}
                    alt="Foto"
                    style={{
                      width: "90px",
                      height: "90px",
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
