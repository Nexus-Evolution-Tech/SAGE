import styles from "./Dispositivos.module.css";
import catracaPlaceholder from "../../../img/catraca.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCirclePlus,
  faXmark,
  faTrash,
  faRefresh,
} from "@fortawesome/free-solid-svg-icons";
import { useState, useEffect } from "react";
import { api } from "../../../services/api";

function Dispositivos() {
  const [dispositivos, setDispositivos] = useState([]);
  const [statusDispositivos, setStatusDispositivos] = useState({});
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);

  const [newDeviceData, setNewDeviceData] = useState({
    nome: "",
    modelo: "",
    endereco: "",
    porta: "",
    usuario: "",
    senha: "",
  });

  // ===============================
  // BUSCAR DISPOSITIVOS + STATUS
  // ===============================
  const fetchDispositivos = async () => {
    try {
      const result = await api.get("/dispositivos");
      const dataDispositivos = result.data || [];

      setDispositivos(dataDispositivos);

      const statusData = await api.get("/dispositivos/status");

      const statusMap = {};
      statusData.forEach((item) => {
        statusMap[item.id] = item.status;
      });

      setStatusDispositivos(statusMap);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchDispositivos();
  }, []);

  const totalCount = dispositivos.length;
  const onlineCount = dispositivos.filter((d) => {
    const st = (statusDispositivos[d.id] || "").toUpperCase();
    return st === "ONLINE" || st === "ON";
  }).length;
  const offlineCount = totalCount - onlineCount;

  // ===============================
  // CORREÇÃO: RELOAD STATUS INDIVIDUAL
  // ===============================
  const handleReloadStatus = async (id) => {
    if (!id) return;

    // Define status visual temporário
    setStatusDispositivos((prev) => ({
      ...prev,
      [id]: "Verificando...",
    }));

    try {
      const response = await api.get(`/dispositivos/${id}/status`);
      
      // O backend retorna um objeto: { id: 1, nome: "...", status: "ONLINE" }
      // Precisamos extrair especificamente a propriedade .status
      const novoStatus = response.data.status; 

      setStatusDispositivos((prev) => ({
        ...prev,
        [id]: novoStatus,
      }));
    } catch (err) {
      console.error("Erro ao atualizar status:", err);
      setStatusDispositivos((prev) => ({
        ...prev,
        [id]: "OFFLINE", // Define como OFFLINE em caso de erro na requisição
      }));
    }
  };

  // ===============================
  // FORM INPUT HANDLER
  // ===============================
  const handleInputChange = (e) => {
    setNewDeviceData({ ...newDeviceData, [e.target.name]: e.target.value });
  };

  // ===============================
  // SALVAR DISPOSITIVO NA API
  // ===============================
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await api.post("/dispositivos", newDeviceData);

      setDispositivos((prev) => [...prev, response.data]);

      setNewDeviceData({
        nome: "",
        modelo: "",
        endereco: "",
        porta: "",
        usuario: "",
        senha: "",
      });

      setShowForm(false);
    } catch (err) {
      setError(err.message);
    }
  };

  // ===============================
  // REMOVER DISPOSITIVO
  // ===============================
  const handleDeleteDevice = async (id) => {
    if (!window.confirm("Tem certeza que deseja excluir esse dispositivo?")) {
      return;
    }

    try {
      await api.delete(`/dispositivos/${id}`);

      setDispositivos((prev) => prev.filter((d) => d.id !== id));
      setSelectedDevice(null);
    } catch (err) {
      alert("Erro ao remover: " + err.message);
    }
  };

  return (
    <div className={styles.container}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
        <h1 className={styles.title}>Dispositivos</h1>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.35rem",
            fontSize: "0.95rem",
            color: onlineCount > 0 ? "#0f9d58" : "#d93025",
          }}
        >
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: onlineCount > 0 ? "#0f9d58" : "#d93025",
              boxShadow: onlineCount > 0 ? "0 0 6px #0f9d58" : "0 0 6px #d93025",
            }}
          />
          {onlineCount} online / {offlineCount} offline
        </span>
      </div>

      <div className={styles.cards}>
        {dispositivos.map((dispositivo) => (
          <div
            key={dispositivo.id}
            className={styles.cardContainer}
            onClick={() => setSelectedDevice(dispositivo)}
          >
            <h3 className={styles.cardTitle}>{dispositivo.nome}</h3>
            <h4 className={styles.cardModel}>Modelo: {dispositivo.modelo}</h4>
            <p className={styles.cardArea}>ID: {dispositivo.id}</p>

            {dispositivo.foto ? (
              <img src={dispositivo.foto} alt={dispositivo.nome} />
            ) : (
              <img src={catracaPlaceholder} alt="catraca placeholder" />
            )}
          </div>
        ))}

        <div className={styles.buttonContainer}>
          <button
            onClick={() => setShowForm(true)}
            className={styles.iconButton}
          >
            <FontAwesomeIcon icon={faCirclePlus} className={styles.icon} />
            <p className={styles.buttonText}>Adicionar dispositivo</p>
          </button>
        </div>
      </div>

      {/* MODAL DETALHES */}
      {selectedDevice && (
        <div className={styles.overlay}>
          <div className={styles.formContainer}>
            <div className={styles.titleContainer}>
              <button
                className={styles.closeButton}
                onClick={() => handleDeleteDevice(selectedDevice.id)}
              >
                <FontAwesomeIcon icon={faTrash} className={styles.iconRed} />
              </button>

              <h2>Detalhes do Dispositivo</h2>

              <button
                className={styles.closeButton}
                onClick={() => setSelectedDevice(null)}
              >
                <FontAwesomeIcon icon={faXmark} className={styles.icon} />
              </button>
            </div>

            <div className={styles.sideContainer}>
              <div className={styles.sidePhotoContainer}>
                <img
                  src={catracaPlaceholder}
                  alt="Catraca"
                  className={styles.catraca}
                />
              </div>

              <div className={styles.dataContainer}>
                <strong>Nome</strong>
                <div className={styles.infoContainer}>
                  <p>{selectedDevice.nome}</p>
                </div>

                <div className={styles.cardsRow}>
                  <div className={styles.inputContainer}>
                    <strong>Modelo</strong>
                    <div className={styles.infoContainerRow}>
                      <p>{selectedDevice.modelo}</p>
                    </div>
                  </div>

                  <div className={styles.inputContainer}>
                    <strong>Usuário</strong>
                    <div className={styles.infoContainerRow}>
                      <p>{selectedDevice.usuario}</p>
                    </div>
                  </div>
                </div>

                <div className={styles.testContainer}>
                  <h4>Testar Conexão</h4>

                  <div className={styles.testContainerRow}>
                    {/* LÓGICA CONDICIONAL DE COR BASEADA EM "ONLINE" (CAIXA ALTA) */}
                    <p
                      className={`${styles.statusBase} ${
                        statusDispositivos[selectedDevice.id] === "ONLINE"
                          ? styles.statusOnline
                          : styles.statusOffline
                      }`}
                    >
                      {statusDispositivos[selectedDevice.id] || "Carregando..."}
                    </p>

                    <button 
                      className={styles.reloadButton}
                      onClick={() => handleReloadStatus(selectedDevice.id)}
                    >
                      <FontAwesomeIcon
                        icon={faRefresh}
                        className={styles.icon}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ADD */}
      {showForm && (
        <div className={styles.overlay}>
          <div className={styles.formContainer}>
            <div className={styles.titleContainer}>
              <h2>Adicionar Dispositivo</h2>
              <button
                className={styles.closeButton}
                onClick={() => setShowForm(false)}
              >
                <FontAwesomeIcon icon={faXmark} className={styles.icon} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className={styles.dataContainer}>
                <strong>Nome</strong>
                <input
                  type="text"
                  name="nome"
                  value={newDeviceData.nome}
                  onChange={handleInputChange}
                  required
                />

                <strong>IP</strong>
                <input
                  type="text"
                  name="endereco"
                  value={newDeviceData.endereco}
                  onChange={handleInputChange}
                  required
                />

                <strong>Porta</strong>
                <input
                  type="text"
                  name="porta"
                  value={newDeviceData.porta}
                  onChange={handleInputChange}
                  required
                />

                <button type="submit" className={styles.reloadButton}>
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dispositivos;