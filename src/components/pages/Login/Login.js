import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import styles from "./Login.module.css";
import logo from '../../../img/logo.png';

// Modal (sem alterações)
const Modal = ({ message, onClose }) => {
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Aviso</h2>
          <button onClick={onClose} className={styles.closeButton}>&times;</button>
        </div>
        <p className={styles.modalMessage}>{message}</p>
      </div>
    </div>
  );
};

function Login() {
  const [schools, setSchools] = useState([]);
  const [selectedSchoolLogin, setSelectedSchoolLogin] = useState(""); 
  const [password, setPassword] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState(""); 
  const navigate = useNavigate();

  // useEffect (sem alterações)
  useEffect(() => {
    const fetchSchools = async () => {
      try {
        // Usando fetch normal aqui, pois é um GET simples
        const response = await fetch("http://localhost:3000/escolas"); 
        if (!response.ok) {
          throw new Error('Erro ao buscar as escolas.');
        }
        
        const data = await response.json(); 

        if (data.data && Array.isArray(data.data)) {
          setSchools(data.data); 
          
          if (data.data.length > 0) {
            setSelectedSchoolLogin(data.data[0].login); 
          }
        } else {
          throw new Error("A resposta da API não continha um array 'data'.");
        }
      } catch (error) {
        console.error("Erro ao buscar escolas (Verifique se a API está rodando):", error);
        setModalMessage("Não foi possível carregar as escolas. Verifique a API.");
        setShowModal(true);
      }
    };
    fetchSchools();
  }, []); 

  const handleLogin = async (e) => {
    e.preventDefault(); 

    const selectedSchool = schools.find(
      (school) => school.login === selectedSchoolLogin 
    );
    const usuario = selectedSchoolLogin; 

    if (!usuario || !password || !selectedSchool) {
      setModalMessage("Por favor, selecione a escola e digite a senha.");
      setShowModal(true);
      return;
    }
    
    const id = selectedSchool.id;

    console.log("--- DADOS QUE SERÃO ENVIADOS ---");
    console.log("URL:", `http://localhost:3000/escolas/login/${id}`);
    console.log("BODY (Payload):", JSON.stringify({ usuario: usuario, senha: password }));

    try {
      const response = await fetch(`http://localhost:3000/escolas/login/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ usuario: usuario, senha: password }),
      });

      // ==================================
      //      NOVA DEPURAÇÃO
      // ==================================
      console.log("Resposta da API (bruta):", response);
      if (!response.ok) {
        console.error("A resposta da API não foi 'OK'. Status:", response.status);
      }
      // ==================================

      // Esta linha pode falhar se a resposta não for JSON (ex: erro 500)
      const data = await response.json(); 
      console.log("Resposta da API (JSON):", data);

      if (response.ok) {
        localStorage.setItem('token', data.token);
        console.log("Login OK! Redirecionando...");
        navigate("/"); // Redireciona para a Home (ou '/monitoramento')
      } else {
        setModalMessage(data.message || "Credenciais inválidas.");
        setShowModal(true);
      }
    } catch (error) {
      // ==================================
      //      DEPURAÇÃO DE ERRO
      // ==================================
      console.error("--- ERRO CATASTRÓFICO NO FETCH ---");
      console.error("Isso é provavelmente um erro de CORS ou rede.", error);
      // ==================================
      setModalMessage(`Erro de conexão: ${error.message}. (Verifique o console)`);
      setShowModal(true);
    }
  };

  // return (sem alterações)
  return (
    <div className={styles.container}>
      {showModal && (
        <Modal
          message={modalMessage}
          onClose={() => setShowModal(false)}
        />
      )}
      <div className={styles.cardContainer}>
        <img src={logo} alt="logo" className={styles.logo} />
        <div className={styles.cardTitle}>Login</div>

        <form className={styles.inputs} onSubmit={handleLogin}>
          
          <select
            className={`${styles.input} ${styles.selectInput}`}
            value={selectedSchoolLogin} 
            onChange={(e) => setSelectedSchoolLogin(e.target.value)} 
            required
          >
            {schools.map((school) => (
              <option key={school.id} value={school.login}> 
                {school.nome}
              </option>
            ))}
          </select>
          
          <input
            type="password"
            placeholder="Senha"
            className={styles.input}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit" className={styles.btn}>
            ENTRAR
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;