import React, { useState, useEffect, useCallback } from "react";
import styles from "./Areas.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCirclePlus, faXmark, faTrash, faLink, faUnlink } from "@fortawesome/free-solid-svg-icons";
import areaPlaceholder from "../../../img/entrada.png";
import catracaPlaceholder from "../../../img/catraca.png";
import { api } from "../../../services/api";
import SkeletonLoader from "../../common/SkeletonLoader";

const initialDeviceForm = {
  nome: "",
  endereco: "",
  porta: "",
  modelo: "",
  usuario: "",
  senha: "",
};

function Areas() {
  const [areas, setAreas] = useState([]);
  const [dispositivos, setDispositivos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingDispositivos, setLoadingDispositivos] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedArea, setSelectedArea] = useState(null);
  const [nome, setNome] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [showAddDeviceForm, setShowAddDeviceForm] = useState(false);
  const [newDeviceData, setNewDeviceData] = useState(initialDeviceForm);
  const [submittingDevice, setSubmittingDevice] = useState(false);
  const [associatingId, setAssociatingId] = useState(null);
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3000";

  const fetchAreas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.listarAreas({ limit: 100 });
      const list = res?.data ?? res ?? [];
      setAreas(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err?.message || "Erro ao carregar áreas.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDispositivos = useCallback(async () => {
    setLoadingDispositivos(true);
    try {
      const result = await api.get("/dispositivos");
      const list = result?.data ?? result ?? [];
      setDispositivos(Array.isArray(list) ? list : []);
    } catch (err) {
      setDispositivos([]);
    } finally {
      setLoadingDispositivos(false);
    }
  }, []);

  useEffect(() => {
    fetchAreas();
  }, [fetchAreas]);

  useEffect(() => {
    if (showModal) fetchDispositivos();
  }, [showModal, fetchDispositivos]);

  const getPhotoUrl = (area) => {
    if (!area?.foto) return null;
    return `${API_URL.replace(/\/$/, "")}/uploads/${area.foto.replace(/^\/+/, "")}`;
  };

  const openNew = () => {
    setSelectedArea(null);
    setNome("");
    setPhotoFile(null);
    setFormError("");
    setShowAddDeviceForm(false);
    setNewDeviceData(initialDeviceForm);
    setShowModal(true);
  };

  const openArea = (area) => {
    setSelectedArea(area);
    setNome(area?.nome ?? "");
    setPhotoFile(null);
    setFormError("");
    setShowAddDeviceForm(false);
    setNewDeviceData(initialDeviceForm);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedArea(null);
    setNome("");
    setPhotoFile(null);
    setFormError("");
    setSubmitting(false);
    setShowAddDeviceForm(false);
    setNewDeviceData(initialDeviceForm);
  };

  const currentAreaId = selectedArea?.id ?? null;
  const dispositivosDaArea = currentAreaId
    ? dispositivos.filter((d) => d.area_id != null && Number(d.area_id) === Number(currentAreaId))
    : [];
  // Para associar: sem área (null/undefined) OU em outra área
  const dispositivosParaAssociar = currentAreaId
    ? dispositivos.filter((d) => d.area_id == null || d.area_id === "" || Number(d.area_id) !== Number(currentAreaId))
    : dispositivos;

  const isEditing = !!selectedArea?.id;

  const handleSubmitArea = async (e) => {
    e.preventDefault();
    const nomeTrim = nome?.trim();
    if (!nomeTrim) {
      setFormError("Informe o nome da área.");
      return;
    }
    setSubmitting(true);
    setFormError("");
    try {
      let areaId = selectedArea?.id;
      if (isEditing) {
        await api.atualizarArea(selectedArea.id, { nome: nomeTrim });
        setAreas((prev) =>
          prev.map((a) => (a.id === selectedArea.id ? { ...a, nome: nomeTrim } : a))
        );
        setSelectedArea((prev) => (prev ? { ...prev, nome: nomeTrim } : null));
      } else {
        const created = await api.criarArea({ nome: nomeTrim });
        const newArea = created?.data ?? created;
        areaId = newArea?.id;
        if (areaId) {
          setAreas((prev) => [...prev, { id: areaId, nome: nomeTrim }]);
          setSelectedArea({ id: areaId, nome: nomeTrim });
        } else {
          await fetchAreas();
        }
      }

      if (photoFile && areaId) {
        const formData = new FormData();
        formData.append("foto", photoFile);
        const uploadRes = await api.uploadFotoArea(areaId, formData);
        const fotoPath = uploadRes?.foto;
        if (fotoPath) {
          setAreas((prev) =>
            prev.map((a) => (a.id === areaId ? { ...a, nome: nomeTrim, foto: fotoPath } : a))
          );
          setSelectedArea((prev) => (prev?.id === areaId ? { ...prev, nome: nomeTrim, foto: fotoPath } : prev));
        } else {
          setFormError("Foto enviada mas a resposta não trouxe o caminho. Recarregue a página.");
        }
      }
    } catch (err) {
      const msg = err?.message || "Erro ao salvar.";
      setFormError(msg.includes("foto") ? `${msg} Verifique se a coluna 'foto' existe na tabela Area (rode migration_area_foto.sql).` : msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChangeDevice = (e) => {
    setNewDeviceData({ ...newDeviceData, [e.target.name]: e.target.value });
  };

  const handleCreateDevice = async (e) => {
    e.preventDefault();
    if (!currentAreaId) return;
    setSubmittingDevice(true);
    try {
      const payload = { ...newDeviceData, area_id: currentAreaId };
      const res = await api.post("/dispositivos", payload);
      const created = res?.data ?? res;
      setDispositivos((prev) => [...prev, created]);
      setNewDeviceData(initialDeviceForm);
      setShowAddDeviceForm(false);
    } catch (err) {
      alert(err?.message || "Erro ao criar dispositivo.");
    } finally {
      setSubmittingDevice(false);
    }
  };

  const handleAssociar = async (deviceId) => {
    if (!currentAreaId) return;
    setAssociatingId(deviceId);
    try {
      await api.patch(`/dispositivos/${deviceId}`, { area_id: currentAreaId });
      await fetchDispositivos();
    } catch (err) {
      alert(err?.message || "Erro ao associar.");
    } finally {
      setAssociatingId(null);
    }
  };

  const handleDesassociar = async (deviceId) => {
    setAssociatingId(deviceId);
    try {
      await api.patch(`/dispositivos/${deviceId}`, { area_id: null });
      await fetchDispositivos();
    } catch (err) {
      alert(err?.message || "Erro ao desassociar.");
    } finally {
      setAssociatingId(null);
    }
  };

  const handleDeleteArea = async (id) => {
    if (!window.confirm("Tem certeza que deseja excluir essa área?")) return;
    try {
      await api.deletarArea(id);
      setAreas((prev) => prev.filter((a) => a.id !== id));
      if (selectedArea?.id === id) closeModal();
    } catch (err) {
      alert(err?.message || "Erro ao excluir.");
    }
  };

  return (
    <div className={styles.container}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
        <h1 className={styles.title}>Áreas</h1>
      </div>

      <div className={styles.cards}>
        {loading ? (
          <SkeletonLoader type="card" count={1} />
        ) : (
          <>
            {areas.map((area) => (
              <div
                key={area.id}
                className={styles.cardContainer}
                onClick={() => openArea(area)}
              >
                <h3 className={styles.cardTitle}>{area.nome}</h3>
                <p className={styles.cardArea}>ID: {area.id}</p>
                {area.foto ? (
                  <img
                    src={getPhotoUrl(area)}
                    alt={area.nome}
                    onError={(e) => { e.target.onerror = null; e.target.src = areaPlaceholder; }}
                  />
                ) : (
                  <img src={areaPlaceholder} alt="Área" />
                )}
              </div>
            ))}
          </>
        )}

        <div className={styles.buttonContainer}>
          <button onClick={openNew} className={styles.iconButton}>
            <FontAwesomeIcon icon={faCirclePlus} className={styles.icon} />
            <p className={styles.buttonText}>Adicionar área</p>
          </button>
        </div>
      </div>

      {error && <div className={styles.errorMessage}>{error}</div>}

      {showModal && (
        <div className={styles.overlay}>
          <div className={styles.formContainer}>
            <div className={styles.titleContainer}>
              {isEditing ? (
                <button
                  type="button"
                  className={styles.closeButton}
                  onClick={() => handleDeleteArea(selectedArea.id)}
                  title="Excluir área"
                >
                  <FontAwesomeIcon icon={faTrash} className={styles.iconRed} />
                </button>
              ) : (
                <span />
              )}

              <h2>{isEditing ? "Detalhes da Área" : "Nova Área"}</h2>

              <button type="button" className={styles.closeButton} onClick={closeModal}>
                <FontAwesomeIcon icon={faXmark} className={styles.icon} />
              </button>
            </div>

            <div className={styles.sideContainer}>
              <div className={styles.sidePhotoContainer}>
                {photoFile ? (
                  <img src={URL.createObjectURL(photoFile)} alt="Preview" className={styles.areaImage} />
                ) : selectedArea?.foto ? (
                  <img
                    src={getPhotoUrl(selectedArea)}
                    alt=""
                    className={styles.areaImage}
                    onError={(e) => { e.target.onerror = null; e.target.src = areaPlaceholder; }}
                  />
                ) : (
                  <img src={areaPlaceholder} alt="Área" className={styles.areaImage} />
                )}
                <label htmlFor="area-photo" className={styles.uploadButton}>
                  Escolher imagem
                </label>
                <input
                  id="area-photo"
                  type="file"
                  accept="image/*"
                  className={styles.fileInput}
                  onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                  disabled={submitting}
                />
              </div>

              <div className={styles.dataContainer}>
                <form onSubmit={handleSubmitArea}>
                  <strong>Nome da área</strong>
                  <div className={styles.infoContainer}>
                    <input
                      type="text"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      placeholder="Ex: Portaria Principal, Biblioteca"
                      disabled={submitting}
                      className={styles.inputInline}
                    />
                  </div>
                  {formError && <p className={styles.formError}>{formError}</p>}
                  <div className={styles.testContainer}>
                    <button type="submit" className={styles.reloadButton} disabled={submitting}>
                      {submitting ? "Salvando…" : "Salvar área"}
                    </button>
                  </div>
                </form>

                {/* Só mostra seção de dispositivos quando a área já existe (id) */}
                {currentAreaId && (
                  <div className={styles.relatedSection}>
                    <h4>Dispositivos nesta área</h4>
                    {loadingDispositivos ? (
                      <p className={styles.relatedDevicesEmpty}>Carregando dispositivos…</p>
                    ) : (
                      <>
                        {dispositivosDaArea.length > 0 ? (
                          <div className={styles.deviceGrid}>
                            {dispositivosDaArea.map((d) => (
                              <div key={d.id} className={styles.deviceCard}>
                                <h5 className={styles.deviceCardTitle}>{d.nome}</h5>
                                <p className={styles.deviceCardModel}>Modelo: {d.modelo || "—"}</p>
                                <p className={styles.deviceCardId}>ID: {d.id}</p>
                                <img src={catracaPlaceholder} alt="" className={styles.deviceCardImage} />
                                <button
                                  type="button"
                                  className={styles.btnDesassociar}
                                  onClick={(e) => { e.stopPropagation(); handleDesassociar(d.id); }}
                                  disabled={associatingId === d.id}
                                >
                                  <FontAwesomeIcon icon={faUnlink} /> Desassociar
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className={styles.relatedDevicesEmpty}>
                            Nenhum dispositivo nesta área. Crie um ou associe um existente abaixo.
                          </p>
                        )}

                        <button
                          type="button"
                          className={styles.iconButton}
                          onClick={() => setShowAddDeviceForm(!showAddDeviceForm)}
                          style={{ marginTop: "0.75rem" }}
                        >
                          <FontAwesomeIcon icon={faCirclePlus} className={styles.icon} />
                          <span>{showAddDeviceForm ? "Cancelar" : "Adicionar dispositivo"}</span>
                        </button>

                        {showAddDeviceForm && (
                          <form onSubmit={handleCreateDevice} className={styles.deviceForm}>
                            <strong>Novo dispositivo (já vinculado a esta área)</strong>
                            <input
                              type="text"
                              name="nome"
                              value={newDeviceData.nome}
                              onChange={handleInputChangeDevice}
                              placeholder="Nome"
                              required
                            />
                            <input
                              type="text"
                              name="endereco"
                              value={newDeviceData.endereco}
                              onChange={handleInputChangeDevice}
                              placeholder="IP"
                              required
                            />
                            <input
                              type="text"
                              name="porta"
                              value={newDeviceData.porta}
                              onChange={handleInputChangeDevice}
                              placeholder="Porta"
                              required
                            />
                            <input
                              type="text"
                              name="modelo"
                              value={newDeviceData.modelo}
                              onChange={handleInputChangeDevice}
                              placeholder="Modelo (opcional)"
                            />
                            <button type="submit" className={styles.reloadButton} disabled={submittingDevice}>
                              {submittingDevice ? "Criando…" : "Criar dispositivo"}
                            </button>
                          </form>
                        )}

                        <h4 className={styles.subSectionTitle}>Associar dispositivo existente</h4>
                        {dispositivosParaAssociar.length === 0 ? (
                          <p className={styles.relatedDevicesEmpty}>
                            Nenhum dispositivo disponível para associar (todos já estão nesta área ou em outra). Para trazer um dispositivo aqui, abra a outra área e use &quot;Desassociar&quot; nele.
                          </p>
                        ) : (
                          <div className={styles.deviceGrid}>
                            {dispositivosParaAssociar.map((d) => (
                              <div key={d.id} className={styles.deviceCard}>
                                <h5 className={styles.deviceCardTitle}>{d.nome}</h5>
                                <p className={styles.deviceCardModel}>Modelo: {d.modelo || "—"}</p>
                                <p className={styles.deviceCardId}>ID: {d.id}</p>
                                <img src={catracaPlaceholder} alt="" className={styles.deviceCardImage} />
                                <button
                                  type="button"
                                  className={styles.btnAssociar}
                                  onClick={(e) => { e.stopPropagation(); handleAssociar(d.id); }}
                                  disabled={associatingId === d.id}
                                >
                                  <FontAwesomeIcon icon={faLink} /> {associatingId === d.id ? "Associando…" : "Associar"}
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {!currentAreaId && (
                  <p className={styles.relatedDevicesEmpty}>
                    Salve a área primeiro para listar e adicionar dispositivos aqui.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Areas;
