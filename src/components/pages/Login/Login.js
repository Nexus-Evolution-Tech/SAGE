import { useState, useEffect } from "react";
import { Link, useNavigate } from 'react-router-dom';
import styles from "./Login.module.css";

import logo from '../../../img/logo.png';


const Modal = ({ message, onClose }) => {
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Erro de Login</h2>
          <button onClick={onClose} className={styles.closeButton}>&times;</button>
        </div>
        <p className={styles.modalMessage}>{message}</p>
      </div>
    </div>
  );
};

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [schools, setSchools] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const response = await fetch("http://localhost:3000/escolas");
        if (!response.ok) {
          throw new Error('Erro ao buscar as escolas.');
        }
        const data = await response.json();
        setSchools(data);
        if (data.length > 0) {
            setUsername(data[0].login);
        }
      } catch (error) {
        console.error("Erro na comunicação com o backend:", error);
      }
    };
    fetchSchools();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!username || !password) {
      setShowModal(true);
      return;
    }

    try {
      const response = await fetch("http://localhost:3000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        navigate("/");
      } else if (response.status === 401) {
        setShowModal(true);
      } else {
        console.error("Erro no login:", response.statusText);
        setShowModal(true);
      }
    } catch (error) {
      console.error("Erro na comunicação com o backend:", error);
      setShowModal(true);
    }
  };

  return (
    <div className={styles.container}>
      {showModal && (
        <Modal
          message="Utilizador ou senha incorretos."
          onClose={() => setShowModal(false)}
        />
      )}
      <div className={styles.cardContainer}>
        <img src={logo} alt="logo" className={styles.logo} />
        <div className={styles.cardTitle}>Login</div>

        <form className={styles.inputs} onSubmit={handleLogin}>
          <select
            className={`${styles.input} ${styles.selectInput}`}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          >
            {schools.map((school) => (
              <option key={school.id} value={school.login}>
                {school.nome}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Usuário"
            className={styles.input}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Senha"
            className={styles.input}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

           <Link className={styles.btn} to='/inicio'>
          ENTRAR
        </Link>
          {/* <button type="submit" className={styles.btn}>
            ENTRAR
          </button> */}
        </form>

        {/*
        <Link className={styles.btn} to='/'>
          ENTRAR
        </Link>
        */}
      </div>
    </div>
  );
}

export default Login;
