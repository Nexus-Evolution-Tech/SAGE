import styles from "./Dispositivos.module.css";
import catracaPlaceholder from "../../../img/catraca.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCirclePlus } from "@fortawesome/free-solid-svg-icons";
import { useState, useEffect } from "react";

function Dispositivos() {
  const [dispositivos, setDispositivos] = useState([]);
  const [statusDispositivos, setStatusDispositivos] = useState({});
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [newDeviceData, setNewDeviceData] = useState({
    nome: "",
    modelo: "",
    endereco: "",
    porta: "",
    usuario: "",
    senha: "",
  });

  const fetchDispositivos = async () => {
    try {
      const responseDispositivos = await fetch("http://localhost:3000/dispositivos");
      if (!responseDispositivos.ok) {
        throw new Error(`Erro HTTP! Status: ${responseDispositivos.status}`);
      }
      const dataDispositivos = await responseDispositivos.json();
      setDispositivos(dataDispositivos);

      const responseStatus = await fetch(`http://localhost:3000/dispositivos/status`);
      if (!responseStatus.ok) {
        throw new Error(`Erro HTTP ao buscar status: ${responseStatus.status}`);
      }
      const dataStatus = await responseStatus.json();

      const statusMap = {};
      dataStatus.forEach((item) => {
        statusMap[item.id] = item.status;
      });
      setStatusDispositivos(statusMap);
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => {
    fetchDispositivos();
  }, []);

  const handleInputChange = (e) => {
    setNewDeviceData({ ...newDeviceData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:3000/dispositivos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newDeviceData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Erro ao adicionar dispositivo: ${response.status} - ${errorData.message || 'Erro desconhecido'}`);
      }

      const novoDispositivo = await response.json();
      setDispositivos((prevDispositivos) => [...prevDispositivos, novoDispositivo]);

      setNewDeviceData({ nome: "", modelo: "", endereco: "", porta: "", usuario: "", senha: "" });
      setShowForm(false);
      setStatusDispositivos((prevStatus) => ({
        ...prevStatus,
        [novoDispositivo.id]: "Disponível",
      }));

      window.location.reload();
    } catch (error) {
      setError(error.message);
    }
  };

  if (error) {
    return <div className={styles.container}>Erro ao carregar dispositivos: {error}</div>;
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Dispositivos</h1>
      <div className={styles.cards}>
        {dispositivos.map((dispositivo) => (
          <div key={dispositivo.id} className={styles.cardContainer}>
            <h3 className={styles.cardTitle}>{dispositivo.nome}</h3>
            <h4 className={styles.cardModel}>Modelo: {dispositivo.modelo}</h4>
            <p className={styles.cardArea}>ID: {dispositivo.id}</p>
            {dispositivo.foto ? (
              <img src={dispositivo.foto} alt={dispositivo.nome} />
            ) : (
              <img src={catracaPlaceholder} alt="catraca placeholder" />
            )}
            <p>Status: {statusDispositivos[dispositivo.id] || "Carregando..."}</p>
            <p>
              Endereço: {dispositivo.endereco}:{dispositivo.porta}
            </p>
            <p>Usuário: {dispositivo.usuario}</p>
          </div>
        ))}

        <button onClick={() => setShowForm(!showForm)} className={styles.iconButton}>
          <FontAwesomeIcon icon={faCirclePlus} className={styles.icon} />
          Adicionar dispositivo
        </button>
      </div>

      {showForm && (
        <div className={styles.overlay}>
          <div className={styles.formContainer}>
            <h2>Adicionar Novo Dispositivo</h2>
            <form onSubmit={handleSubmit}>
              <div>
                <label htmlFor="nome">Nome:</label>
                <input
                  type="text"
                  id="nome"
                  name="nome"
                  value={newDeviceData.nome}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <label htmlFor="modelo">Modelo:</label>
                <input
                  type="text"
                  id="modelo"
                  name="modelo"
                  value={newDeviceData.modelo}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <label htmlFor="endereco">Endereço:</label>
                <input
                  type="text"
                  id="endereco"
                  name="endereco"
                  value={newDeviceData.endereco}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <label htmlFor="porta">Porta:</label>
                <input
                  type="number"
                  id="porta"
                  name="porta"
                  value={newDeviceData.porta}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <label htmlFor="usuario">Usuário:</label>
                <input
                  type="text"
                  id="usuario"
                  name="usuario"
                  value={newDeviceData.usuario}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <label htmlFor="senha">Senha:</label>
                <input
                  type="password"
                  id="senha"
                  name="senha"
                  value={newDeviceData.senha}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <button type="submit">Adicionar Dispositivo</button>
              <button type="button" onClick={() => setShowForm(false)}>Cancelar</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default Dispositivos;

