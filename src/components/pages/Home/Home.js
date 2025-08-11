import styles from "./Home.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faTimes } from "@fortawesome/free-solid-svg-icons";
import userPlaceholder from "../../../img/user.png"; // Mock para a foto de perfil
import { useEffect, useState } from "react";

// Dados de exemplo para a tabela
const accessLogs = [
  {
    id: 1,
    dataHora: "18/05/2024\n11:24:32",
    nome: "Fulano oliveira",
    perfil: "Aluno (1° A)",
    area: "Portaria Principal",
    dispositivo: "Catraca Esquerda (IDBlock)",
    autorizacao: "Acesso requerido",
    status: "required",
  },
  {
    id: 2,
    dataHora: "18/05/2024\n11:24:32",
    nome: "Fulana alves",
    perfil: "Professor",
    area: "Portaria Principal",
    dispositivo: "Catraca Direita (IDBlock)",
    autorizacao: "Acesso autorizado",
    status: "authorized",
  },
  {
    id: 3,
    dataHora: "18/05/2024\n11:24:32",
    nome: "Fulano roberto",
    perfil: "Administração",
    area: "Portaria Principal",
    dispositivo: "Catraca Esquerda (IDBlock)",
    autorizacao: "Acesso negado",
    status: "denied",
  },
  {
    id: 4,
    dataHora: "18/05/2024\n11:24:32",
    nome: "Fulano Tadeu",
    perfil: "Professor",
    area: "Portaria Principal",
    dispositivo: "Catraca Direita (IDBlock)",
    autorizacao: "Acesso autorizado",
    status: "authorized",
  },
];

function Monitoramento() {
  const [currentDateTime, setCurrentDateTime] = useState("");

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

  return (
    <div className={styles.monitoramentoContainer}>
      <h1 className={styles.pageTitle}>Monitoramento</h1>

      {/* Card superior de acesso */}
      <div className={styles.accessCard}>
        <div className={styles.profileInfo}>
          <div className={styles.profilePicture}>
            <img src={userPlaceholder} alt="Foto de perfil" />
          </div>
          <div className={styles.profileDetails}>
            <p className={styles.dateTime}>Data e hora: {currentDateTime}</p>
            <h3>Fulano Oliveira</h3>
            <p>Área: Portaria Princ.</p>
            <p>Dispositivo: Catraca Esquerda (IDBlock)</p>
          </div>
        </div>
        <div className={styles.accessStatus}>
          <p className={styles.requiredText}>Acesso requerido</p>
          <div className={styles.actionButtons}>
            <button className={`${styles.actionButton} ${styles.check}`}>
              <FontAwesomeIcon icon={faCheck} />
            </button>
            <button className={`${styles.actionButton} ${styles.times}`}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
        </div>
      </div>

      {/* Tabela de logs de acesso */}
      <div className={styles.tableContainer}>
        <table className={styles.accessTable}>
          <thead>
            <tr>
              <th>Data e Hora</th>
              <th>Perfil</th>
              <th>Área</th>
              <th>Dispositivo</th>
              <th>Autorização</th>
            </tr>
          </thead>
          <tbody>
            {accessLogs.map((log) => (
              <tr key={log.id}>
                <td>{log.dataHora}</td>
                <td>
                  <p className={styles.profileName}>{log.nome}</p>
                  <p className={styles.profileSubtitle}>{log.perfil}</p>
                </td>
                <td>{log.area}</td>
                <td>{log.dispositivo}</td>
                <td>
                  <span className={`${styles.statusBadge} ${styles[log.status]}`}>
                    {log.autorizacao}
                    {log.status === "denied" && (
                      <FontAwesomeIcon icon={faTimes} className={styles.deniedIcon} />
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