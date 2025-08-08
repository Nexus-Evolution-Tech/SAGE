import React, { useEffect, useState } from "react";
import styles from "./Home.module.css";
import user from "../../../img/user.png";

const Monitoramento = () => {
  const [dados, setDados] = useState([]);

  useEffect(() => {
    fetch("http://localhost:3001/usuarios")
      .then((res) => res.json())
      .then((data) => setDados(data))
      .catch((err) => console.error("Erro ao buscar dados:", err));
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.titleContainer}>
        <h1 className={styles.title}>Monitoramento</h1>
      </div>

      {/* Cartão de acesso (exemplo do primeiro usuário) */}
      {dados.length > 0 && (
        <div className={styles.accessCard}>
          <div className={styles.userImageContainer}>
            <img src={user} alt="user" className={styles.userImage} />
          </div>
          <div>
            <p className={styles.date}>{new Date().toLocaleString()}</p>
            <a href="/login" style={{ textDecoration: 'none' }}><p className={styles.name}>{dados[0]["Usuário"]}</p></a>
            <a href="/cadastro"><p>Área: Portaria Principal</p></a>
            <p>Dispositivo: Catraca Esquerda (iDBlock)</p>
            <p className={styles.accessRequired}>
              Acesso requerido
              <a href="/" style={{ textDecoration: "none" }}><span className={styles.iconCheck}>✔</span></a>
              <a href="/" style={{ textDecoration: "none" }}><span className={styles.iconCross}>✘</span></a>
            </p>
          </div>
        </div>
      )}

      {/* Tabela */}
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
            {dados.map((usuario, index) => (
              <tr key={index}>
                <td>{new Date().toLocaleString()}</td>
                <td>{usuario["Usuário"]}</td>
                <td>Portaria Principal</td>
                <td>{index % 2 === 0 ? "Catraca Esquerda (iDBlock)" : "Catraca Direita (iDBlock)"}</td>
                <td className={styles.accessGranted}>Acesso autorizado</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Monitoramento;
