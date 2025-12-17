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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../services/api";
import useWebSocket from "../../../hooks/useWebSocket";
import useMonitoringStore from "../../../stores/monitoringStore";

function Dispositivos() {
  const queryClient = useQueryClient();
  const { deviceStatuses } = useMonitoringStore();
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

  // Conectar ao WebSocket e auto-inscrever em eventos de dispositivos
  const { isConnected } = useWebSocket({
    autoSubscribeDevices: true,
    onDeviceStatus: (data) => {
      console.log('📱 Status de dispositivo atualizado:', data);
      // React Query invalidará automaticamente via hook
    }
  });

  // ===============================
  // REACT QUERY - BUSCAR DISPOSITIVOS
  // ===============================
  const { data: dispositivos = [], isLoading, refetch } = useQuery({
    queryKey: ['dispositivos'],
    queryFn: async () => {
      const result = await api.get("/dispositivos");
      return result.data || [];
    },
    onError: (err) => {
      setError(err.message);
    }
  });

  // ===============================
  // BUSCAR STATUS DOS DISPOSITIVOS
  // ===============================
  const { data: statusData = [] } = useQuery({
    queryKey: ['dispositivos', 'status'],
    queryFn: async () => {
      const result = await api.get("/dispositivos/status");
      return result.data || [];
    },
    refetchInterval: 30000 // Refetch a cada 30s como fallback
  });

  // Criar mapa de status (priorizar dados do WebSocket se disponíveis)
  const statusDispositivos = {};
  
  // Primeiro, pegar status do endpoint
  statusData.forEach((item) => {
    statusDispositivos[item.id] = item.status;
  });

  // Sobrescrever com dados do WebSocket se disponíveis
  deviceStatuses.forEach((device) => {
    statusDispositivos[device.dispositivo_id] = device.status;
  });

  // ===============================
  // MUTATION - RECARREGAR STATUS INDIVIDUAL
  // ===============================
  const reloadStatusMutation = useMutation({
    mutationFn: async (id) => {
      const response = await api.get(`/dispositivos/${id}/status`);
      return { id, status: response.data.status };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dispositivos', 'status'] });
    },
    onError: (err) => {
      console.error("Erro ao atualizar status:", err);
      setError("Erro ao verificar status do dispositivo");
    }
  });

  const handleReloadStatus = (id) => {
    if (id) {
      reloadStatusMutation.mutate(id);
    }
  };

  // ===============================
  // MUTATION - ADICIONAR DISPOSITIVO
  // ===============================
  const addDeviceMutation = useMutation({
    mutationFn: async (deviceData) => {
      const response = await api.post("/dispositivos", deviceData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dispositivos'] });
      setShowForm(false);
      setNewDeviceData({
        nome: "",
        modelo: "",
        endereco: "",
        porta: "",
        usuario: "",
        senha: "",
      });
    },
    onError: (err) => {
      console.error("Erro ao adicionar dispositivo:", err);
      setError("Erro ao adicionar dispositivo");
    }
  });

  const handleAddDevice = async (e) => {
    e.preventDefault();
    addDeviceMutation.mutate(newDeviceData);
  };

  // ===============================
  // MUTATION - REMOVER DISPOSITIVO
  // ===============================
  const deleteDeviceMutation = useMutation({
    mutationFn: async (id) => {
      await api.delete(`/dispositivos/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dispositivos'] });
      setSelectedDevice(null);
    },
    onError: (err) => {
      console.error("Erro ao remover dispositivo:", err);
      setError("Erro ao remover dispositivo");
    }
  });

  const handleRemoveDevice = (id) => {
    if (window.confirm("Tem certeza que deseja remover este dispositivo?")) {
      deleteDeviceMutation.mutate(id);
    }
  };

  // ===============================
  // RENDER
  // ===============================
  if (isLoading) {
    return <div className={styles.loading}>Carregando dispositivos...</div>;
  }

  return (
    <div className={styles.dispositivos}>
      <div className={styles.header}>
        <h1>Dispositivos</h1>
        <div className={styles.headerActions}>
          {isConnected && (
            <span className={styles.wsStatus}>
              🟢 Tempo Real Ativo
            </span>
          )}
          <button
            className={styles.addButton}
            onClick={() => setShowForm(!showForm)}
          >
            <FontAwesomeIcon icon={faCirclePlus} />
            Adicionar Dispositivo
          </button>
        </div>
      </div>

      {error && (
        <div className={styles.error}>
          ⚠️ {error}
          <button onClick={() => setError(null)}>
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>
      )}

      {showForm && (
        <div className={styles.formContainer}>
          <form onSubmit={handleAddDevice} className={styles.form}>
            <h2>Novo Dispositivo</h2>
            <input
              type="text"
              placeholder="Nome"
              value={newDeviceData.nome}
              onChange={(e) =>
                setNewDeviceData({ ...newDeviceData, nome: e.target.value })
              }
              required
            />
            <input
              type="text"
              placeholder="Modelo"
              value={newDeviceData.modelo}
              onChange={(e) =>
                setNewDeviceData({ ...newDeviceData, modelo: e.target.value })
              }
              required
            />
            <input
              type="text"
              placeholder="Endereço IP"
              value={newDeviceData.endereco}
              onChange={(e) =>
                setNewDeviceData({ ...newDeviceData, endereco: e.target.value })
              }
              required
            />
            <input
              type="text"
              placeholder="Porta"
              value={newDeviceData.porta}
              onChange={(e) =>
                setNewDeviceData({ ...newDeviceData, porta: e.target.value })
              }
              required
            />
            <input
              type="text"
              placeholder="Usuário"
              value={newDeviceData.usuario}
              onChange={(e) =>
                setNewDeviceData({ ...newDeviceData, usuario: e.target.value })
              }
            />
            <input
              type="password"
              placeholder="Senha"
              value={newDeviceData.senha}
              onChange={(e) =>
                setNewDeviceData({ ...newDeviceData, senha: e.target.value })
              }
            />
            <div className={styles.formActions}>
              <button type="submit" disabled={addDeviceMutation.isLoading}>
                {addDeviceMutation.isLoading ? 'Adicionando...' : 'Adicionar'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className={styles.cancelButton}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className={styles.dispositivosGrid}>
        {dispositivos.map((dispositivo) => {
          const status = statusDispositivos[dispositivo.id] || "DESCONHECIDO";
          const statusClass = status === "ONLINE" ? styles.online : styles.offline;
          const isReloading = reloadStatusMutation.isLoading && reloadStatusMutation.variables === dispositivo.id;

          return (
            <div key={dispositivo.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <img
                  src={catracaPlaceholder}
                  alt={dispositivo.nome}
                  className={styles.cardImage}
                />
                <button
                  className={styles.removeButton}
                  onClick={() => handleRemoveDevice(dispositivo.id)}
                  disabled={deleteDeviceMutation.isLoading}
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </div>
              <div className={styles.cardBody}>
                <h3>{dispositivo.nome}</h3>
                <p className={styles.modelo}>{dispositivo.modelo}</p>
                <p className={styles.endereco}>
                  {dispositivo.endereco}:{dispositivo.porta}
                </p>
                <div className={styles.statusContainer}>
                  <span className={`${styles.status} ${statusClass}`}>
                    {isReloading ? 'Verificando...' : status}
                  </span>
                  <button
                    className={styles.reloadButton}
                    onClick={() => handleReloadStatus(dispositivo.id)}
                    disabled={isReloading}
                    title="Verificar status"
                  >
                    <FontAwesomeIcon icon={faRefresh} spin={isReloading} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {dispositivos.length === 0 && (
        <div className={styles.empty}>
          <p>Nenhum dispositivo cadastrado</p>
        </div>
      )}
    </div>
  );
}

export default Dispositivos;
