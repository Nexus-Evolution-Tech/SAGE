import styles from "./Dispositivos.module.css";
import catracaPlaceholder from "../../../img/catraca.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCirclePlus,
  faXmark,
  faTrash,
  faRefresh,
  faArrowsRotate,
  faBan,
} from "@fortawesome/free-solid-svg-icons";
import { useState, useEffect } from "react";
import { api } from "../../../services/api";
import SkeletonLoader from "../../common/SkeletonLoader";
import SystemStatusBadge from "../../common/SystemStatusBadge/SystemStatusBadge";

function Dispositivos() {
  const [dispositivos, setDispositivos] = useState([]);
  const [areas, setAreas] = useState([]);
  const [statusDispositivos, setStatusDispositivos] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [logsInfo, setLogsInfo] = useState(null);
  const [zerarLoading, setZerarLoading] = useState(false);
  const [zerarApagarNoSistema, setZerarApagarNoSistema] = useState(false);
  const [toggleSyncLoading, setToggleSyncLoading] = useState(null); // id do dispositivo em loading

  const [newDeviceData, setNewDeviceData] = useState({
    nome: "",
    modelo: "",
    endereco: "",
    porta: "",
    usuario: "",
    senha: "",
  });

  const areaPorId = areas.reduce((acc, a) => ({ ...acc, [a.id]: a.nome }), {});

  // ===============================
  // BUSCAR DISPOSITIVOS + STATUS + ÁREAS
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
    }
  };

  const fetchAreas = async () => {
    try {
      const res = await api.get("/areas?limit=100");
      const list = res?.data ?? res ?? [];
      setAreas(Array.isArray(list) ? list : []);
    } catch (err) {
      setAreas([]);
    }
  };

  useEffect(() => {
    fetchDispositivos();
    fetchAreas();
  }, []);

  // Ao abrir o modal de detalhes, verificar se a catraca tem muitos logs antigos
  useEffect(() => {
    if (!selectedDevice?.id) {
      setLogsInfo(null);
      return;
    }
    let cancelled = false;
    api.get(`/dispositivos/${selectedDevice.id}/logs-info`)
      .then((data) => {
        if (!cancelled && data) setLogsInfo(data);
      })
      .catch(() => {
        if (!cancelled) setLogsInfo(null);
      });
    return () => { cancelled = true; };
  }, [selectedDevice?.id]);

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

  const handleZerarLogs = async () => {
    if (!selectedDevice?.id) return;
    setZerarLoading(true);
    try {
      await api.post(`/dispositivos/${selectedDevice.id}/zerar-logs`, {
        apagarAcessosNoSistema: zerarApagarNoSistema,
      });
      setLogsInfo(null);
      setSelectedDevice(null);
      fetchDispositivos();
      alert("Logs da catraca zerados com sucesso. Um backup foi gerado no servidor antes da operação.");
    } catch (err) {
      alert("Erro ao zerar logs: " + (err.message || err.data?.message || "Erro desconhecido"));
    } finally {
      setZerarLoading(false);
    }
  };

  // Ativar/desativar sincronização automática do dispositivo
  const handleToggleSync = async (e, dispositivo) => {
    e.stopPropagation();
    if (!dispositivo?.id) return;
    const novoValor = !(dispositivo.sync_enabled === true || dispositivo.sync_enabled === 1);
    setToggleSyncLoading(dispositivo.id);
    try {
      await api.post(`/dispositivos/${dispositivo.id}/toggle-sync`, { sync_enabled: novoValor });
      setDispositivos((prev) =>
        prev.map((d) =>
          d.id === dispositivo.id ? { ...d, sync_enabled: novoValor } : d
        )
      );
      if (selectedDevice?.id === dispositivo.id) {
        setSelectedDevice((prev) => (prev ? { ...prev, sync_enabled: novoValor } : null));
      }
    } catch (err) {
      alert("Erro ao alterar sincronização: " + (err.message || err.response?.data?.message || "Erro desconhecido"));
    } finally {
      setToggleSyncLoading(null);
    }
  };

  const isSyncAtivo = (d) => d.sync_enabled === true || d.sync_enabled === 1;

  return (
    <div className={styles.container}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
        <h1 className={styles.title}>Dispositivos</h1>
        <SystemStatusBadge
          countOnline={onlineCount}
          countOffline={offlineCount}
          title={onlineCount > 0 ? "Dispositivos ativos" : "Nenhum dispositivo online"}
        />
      </div>

      <div className={styles.cards}>
        {dispositivos.length === 0 ? (
          <SkeletonLoader type="card" count={1} />
        ) : (
          <>
            {dispositivos.map((dispositivo) => {
              const syncAtivo = isSyncAtivo(dispositivo);
              const syncLoading = toggleSyncLoading === dispositivo.id;
              return (
                <div
                  key={dispositivo.id}
                  className={styles.cardContainer}
                  onClick={() => setSelectedDevice(dispositivo)}
                >
                  <h3 className={styles.cardTitle}>{dispositivo.nome}</h3>
                  <h4 className={styles.cardModel}>Modelo: {dispositivo.modelo}</h4>
                  <p className={styles.cardArea}>ID: {dispositivo.id}</p>
                  <p className={styles.cardArea}>
                    Área: {dispositivo.area_id != null && dispositivo.area_id !== ""
                      ? (areaPorId[dispositivo.area_id] || `ID ${dispositivo.area_id}`)
                      : "Sem área"}
                  </p>

                  <div
                    className={styles.syncToggleRow}
                    onClick={(e) => handleToggleSync(e, dispositivo)}
                    title={syncAtivo ? "Clique para desativar a sincronização automática" : "Clique para ativar a sincronização automática"}
                  >
                    <span className={styles.syncLabel}>Sincronização:</span>
                    <button
                      type="button"
                      className={`${styles.syncToggleBtn} ${syncAtivo ? styles.syncAtivo : styles.syncInativo}`}
                      disabled={syncLoading}
                    >
                      {syncLoading ? (
                        "..."
                      ) : syncAtivo ? (
                        <>
                          <FontAwesomeIcon icon={faArrowsRotate} className={styles.syncIcon} />
                          Ativo
                        </>
                      ) : (
                        <>
                          <FontAwesomeIcon icon={faBan} className={styles.syncIcon} />
                          Desativado
                        </>
                      )}
                    </button>
                  </div>

                  {dispositivo.foto ? (
                    <img src={dispositivo.foto} alt={dispositivo.nome} />
                  ) : (
                    <img src={catracaPlaceholder} alt="catraca placeholder" />
                  )}
                </div>
              );
            })}
          </>
        )}

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

                <strong>Área vinculada</strong>
                <div className={styles.infoContainer}>
                  <p>
                    {selectedDevice.area_id != null && selectedDevice.area_id !== ""
                      ? (areaPorId[selectedDevice.area_id] || `Área ID ${selectedDevice.area_id}`)
                      : "Sem área"}
                  </p>
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
                  <h4>Sincronização automática</h4>
                  <div className={styles.testContainerRow}>
                    <span className={styles.syncLabel}>Status:</span>
                    <button
                      type="button"
                      className={`${styles.syncToggleBtn} ${isSyncAtivo(selectedDevice) ? styles.syncAtivo : styles.syncInativo}`}
                      disabled={toggleSyncLoading === selectedDevice.id}
                      onClick={() => handleToggleSync({ stopPropagation: () => {} }, selectedDevice)}
                    >
                      {toggleSyncLoading === selectedDevice.id ? (
                        "..."
                      ) : isSyncAtivo(selectedDevice) ? (
                        <>
                          <FontAwesomeIcon icon={faArrowsRotate} className={styles.syncIcon} />
                          Ativo
                        </>
                      ) : (
                        <>
                          <FontAwesomeIcon icon={faBan} className={styles.syncIcon} />
                          Desativado
                        </>
                      )}
                    </button>
                  </div>
                  <p className={styles.syncHint}>
                    {isSyncAtivo(selectedDevice)
                      ? "O sistema sincroniza pessoas e acessos com esta catraca automaticamente."
                      : "A sincronização está desativada. Ative para sincronizar pessoas e acessos."}
                  </p>
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

                {logsInfo?.hasManyOldLogs && (
                  <div className={styles.logsInfoBox}>
                    <h4>Dados antigos na catraca</h4>
                    <p>
                      Esta catraca possui muitos registros de acesso antigos
                      {logsInfo.estimatedCount != null ? ` (cerca de ${logsInfo.estimatedCount.toLocaleString("pt-BR")})` : ""}.
                      Você pode zerar para começar do zero (um backup será gerado antes) ou continuar sincronizando a partir daqui.
                    </p>
                    <label className={styles.checkboxRow}>
                      <input
                        type="checkbox"
                        checked={zerarApagarNoSistema}
                        onChange={(e) => setZerarApagarNoSistema(e.target.checked)}
                      />
                      <span>Apagar também os acessos deste dispositivo no sistema</span>
                    </label>
                    <div className={styles.logsInfoActions}>
                      <button
                        type="button"
                        className={styles.reloadButton}
                        onClick={handleZerarLogs}
                        disabled={zerarLoading}
                      >
                        {zerarLoading ? "Processando..." : "Fazer backup e zerar"}
                      </button>
                      <button
                        type="button"
                        className={styles.logsInfoSecondary}
                        onClick={() => setLogsInfo(null)}
                      >
                        Continuar a partir daqui
                      </button>
                    </div>
                  </div>
                )}
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

                <div style={{ marginTop: "1rem" }}>
                  <button type="submit" className={styles.reloadButton}>
                    Salvar
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dispositivos;
