import styles from "./Dispositivos.module.css";
import catracaPlaceholder from "../../../img/catraca.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCirclePlus,
  faRotateLeft,
  faXmark,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { useState, useEffect } from "react";

function Dispositivos() {
  const [dispositivos, setDispositivos] = useState([]);
  const [statusDispositivos, setStatusDispositivos] = useState({});
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null); // <-- novo estado
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
      const responseDispositivos = await fetch(
        "http://localhost:3000/dispositivos"
      );
      if (!responseDispositivos.ok) {
        throw new Error(`Erro HTTP! Status: ${responseDispositivos.status}`);
      }
      const dataDispositivos = await responseDispositivos.json();
      setDispositivos(dataDispositivos);

      const responseStatus = await fetch(
        `http://localhost:3000/dispositivos/status`
      );
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
        throw new Error(
          `Erro ao adicionar dispositivo: ${response.status} - ${
            errorData.message || "Erro desconhecido"
          }`
        );
      }

      const novoDispositivo = await response.json();
      setDispositivos((prevDispositivos) => [
        ...prevDispositivos,
        novoDispositivo,
      ]);

      setNewDeviceData({
        nome: "",
        modelo: "",
        endereco: "",
        porta: "",
        usuario: "",
        senha: "",
      });
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

  const handleCardClick = (device) => {
    setSelectedDevice(device);
  };

  const closeModal = () => {
    setSelectedDevice(null);
  };

  const closeAddModal = () => {
    setShowForm(false);
  };

  if (error) {
    return (
      <div className={styles.container}>
        Erro ao carregar dispositivos: {error}
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Dispositivos</h1>
      <div className={styles.cards}>
        {dispositivos.map((dispositivo) => (
          <div
            key={dispositivo.id}
            className={styles.cardContainer}
            onClick={() => handleCardClick(dispositivo)} // clique abre modal
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
            onClick={() => setShowForm(!showForm)}
            className={styles.iconButton}
          >
            <FontAwesomeIcon icon={faCirclePlus} className={styles.icon} />
            <p className={styles.buttonText}>Adicionar dispositivo</p>
          </button>
        </div>
      </div>

      {selectedDevice && (
        <div className={styles.overlay}>
          <div className={styles.formContainer}>
            <div className={styles.titleContainer}>
              <button className={styles.closeButton}>
                <FontAwesomeIcon icon={faTrash} className={styles.iconRed} />
              </button>
              <h2>Detalhes do Dispositivo</h2>
              <button className={styles.closeButton} onClick={closeModal}>
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
                <strong>Nome do Dispositivo</strong>
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
                  <div className={styles.testTitle}>
                    <h4>Testar Conexão</h4>
                  </div>

                  <div className={styles.testButtonsRow}>
                    <button className={styles.reloadButton}>
                      {" "}
                      <FontAwesomeIcon
                        icon={faRotateLeft}
                        className={styles.icon}
                      />
                    </button>
                    <div className={styles.infoContainerRow}>
                      <p className={styles.status}>
                        {statusDispositivos[selectedDevice.id] ||
                          "Carregando..."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {showForm && (
        <div className={styles.overlay}>
          <div className={styles.formContainer}>
            <div className={styles.titleContainer}>
              <h2>ㅤ</h2>
              <h2>Adicionar Dispositivo</h2>
              <button className={styles.closeButton} onClick={closeAddModal}>
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
                <div className={styles.dropContainer}>
                  <button className={styles.reloadButton}> Buscar</button>
                  <select className={`${styles.input} ${styles.selectInput}`}>
                    Nenhum
                  </select>
                </div>
                <strong>Nome do Dispositivo</strong>
                <input
                  type="text"
                  id="nome"
                  name="nome"
                  value={newDeviceData.nome}
                  onChange={handleInputChange}
                  required
                  placeholder="Catraca 1"
                />

                <div className={styles.cardsRow}>
                  <div className={styles.inputContainer}>
                    <strong>IP</strong>
                    <input
                      type="text"
                      id="nome"
                      name="nome"
                      value={newDeviceData.nome}
                      onChange={handleInputChange}
                      required
                      placeholder="192.168.10.67"
                    />
                  </div>

                  <div className={styles.inputContainer}>
                    <strong>Porta</strong>
                    <input
                      type="text"
                      id="nome"
                      name="nome"
                      value={newDeviceData.nome}
                      onChange={handleInputChange}
                      required
                      placeholder="80"
                    />
                  </div>
                </div>

                <div className={styles.testContainer}>
                  <div className={styles.testButtonsRoww}>
                    <button className={styles.reloadButton}> Salvar</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* {showForm && (
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
              <button type="button" onClick={() => setShowForm(false)}>
                Cancelar
              </button>
            </form>
          </div>
        </div>
      )} */}
    </div>
  );
}

export default Dispositivos;
