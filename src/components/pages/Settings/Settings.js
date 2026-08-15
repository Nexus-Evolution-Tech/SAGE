import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBell,
  faPalette,
  faCircleInfo,
  faBuilding,
  faPen,
  faKey,
  faTimes,
  faCheck,
  faWrench,
  faSync,
  faDownload,
  faServer,
  faImage,
} from "@fortawesome/free-solid-svg-icons";
import { api } from "../../../services/api";
import styles from "./Settings.module.css";

const API_URL = (process.env.REACT_APP_API_URL || "").replace(/\/$/, "");

function getLogoUrl(logo) {
  if (!logo) return null;
  if (logo.startsWith("http://") || logo.startsWith("https://")) return logo;
  return `${API_URL.replace(/\/$/, "")}/uploads/${logo.replace(/^\/+/, "")}`;
}

const STORAGE_SOUND = "sage_notifications_sound";
const STORAGE_UNIDADE = "sage_unidade";
const APP_VERSION = "0.1.0";

const DADOS_UNIDADE_INICIAL = {
  nome: "ETEC Taboão da Serra",
  numero_unidade: "206",
  cnpj: "62823257000109",
  login: "admin",
  email: "",
  logradouro: "Rua Pedro Bracale",
  numero: "79",
  complemento: "",
  bairro: "Jardim Maria Rosa",
  cidade: "Taboão da Serra",
  estado: "SP",
  cep: "06764230",
  telefone_contato: "1147888150",
  logo: null,
};

function formatCep(value) {
  if (!value) return "";
  const s = String(value).replace(/\D/g, "");
  return s.length >= 5 ? `${s.slice(0, 5)}-${s.slice(5, 8)}` : s;
}

function formatTelefone(value) {
  if (!value) return "";
  const s = String(value).replace(/\D/g, "");
  if (s.length <= 2) return s ? `(${s}` : "";
  if (s.length <= 6) return `(${s.slice(0, 2)}) ${s.slice(2)}`;
  return `(${s.slice(0, 2)}) ${s.slice(2, 6)}-${s.slice(6, 10)}`;
}

function Settings() {
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const stored = localStorage.getItem(STORAGE_SOUND);
    return stored !== "false";
  });

  const [unidade, setUnidade] = useState(DADOS_UNIDADE_INICIAL);
  const [editandoUnidade, setEditandoUnidade] = useState(false);
  const [salvandoUnidade, setSalvandoUnidade] = useState(false);
  const [erroUnidade, setErroUnidade] = useState(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [erroLogo, setErroLogo] = useState(null);

  const [mostrarTrocarSenha, setMostrarTrocarSenha] = useState(false);
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [salvandoSenha, setSalvandoSenha] = useState(false);
  const [erroSenha, setErroSenha] = useState(null);

  // Ferramentas – Catraca
  const [dispositivos, setDispositivos] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [config, setConfig] = useState({ monitorUsePush: false, monitorPollingIntervalMs: 20000, monitorPollingEnabled: true });
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncAllLoading, setSyncAllLoading] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);
  const [monitorConfigLoading, setMonitorConfigLoading] = useState(false);
  const [ferramentasMsg, setFerramentasMsg] = useState(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_SOUND, String(soundEnabled));
  }, [soundEnabled]);

  useEffect(() => {
    async function carregar() {
      try {
        const data = await api.get("/unidade");
        if (data && typeof data === "object") {
          const { senha: _, ...rest } = data;
          setUnidade((prev) => ({ ...DADOS_UNIDADE_INICIAL, ...prev, ...rest }));
          return;
        }
      } catch {
        // Fallback: localStorage ou dados iniciais
      }
      try {
        const stored = localStorage.getItem(STORAGE_UNIDADE);
        if (stored) {
          const parsed = JSON.parse(stored);
          setUnidade((prev) => ({ ...DADOS_UNIDADE_INICIAL, ...prev, ...parsed }));
        }
      } catch {
        // Mantém DADOS_UNIDADE_INICIAL
      }
    }
    carregar();
  }, []);

  useEffect(() => {
    async function carregarFerramentas() {
      try {
        const [list, cfg] = await Promise.all([api.get("/dispositivos"), api.get("/config").catch(() => ({}))]);
        const arr = Array.isArray(list) ? list : list?.data ?? [];
        setDispositivos(arr);
        if (cfg && (cfg.monitorUsePush !== undefined || cfg.monitorPollingIntervalMs !== undefined)) {
          setConfig({
            monitorUsePush: !!cfg.monitorUsePush,
            monitorPollingIntervalMs: cfg.monitorPollingIntervalMs ?? 20000,
            monitorPollingEnabled: (cfg.monitorPollingIntervalMs ?? 20000) > 0,
          });
        }
        if (arr.length > 0) {
          setSelectedDeviceId((prev) => (prev ? prev : String(arr[0].id)));
        }
      } catch {
        // Ignora; ferramentas opcionais
      }
    }
    carregarFerramentas();
  }, []);

  const handleChangeUnidade = (campo, valor) => {
    setUnidade((prev) => ({ ...prev, [campo]: valor ?? "" }));
    setErroUnidade(null);
  };

  const handleLogoUpload = async (e) => {
    const file = e.target?.files?.[0];
    if (!file) return;
    setErroLogo(null);
    setLogoUploading(true);
    try {
      const formData = new FormData();
      formData.append("logo", file);
      const data = await api.postFormData("/unidade/upload-logo", formData);
      setUnidade((prev) => ({ ...prev, logo: data?.logo ?? prev.logo }));
    } catch (err) {
      setErroLogo(err?.message || "Erro ao enviar a logo. Tente novamente.");
    } finally {
      setLogoUploading(false);
      e.target.value = "";
    }
  };

  const handleSalvarUnidade = async () => {
    setErroUnidade(null);
    setSalvandoUnidade(true);
    const payload = {
      nome: unidade.nome, numero_unidade: unidade.numero_unidade, cnpj: unidade.cnpj,
      login: unidade.login, email: unidade.email, logradouro: unidade.logradouro,
      numero: unidade.numero, complemento: unidade.complemento, bairro: unidade.bairro,
      cidade: unidade.cidade, estado: unidade.estado, cep: unidade.cep,
      telefone_contato: unidade.telefone_contato, logo: unidade.logo
    };
    try {
      await api.patch("/unidade", payload);
      setEditandoUnidade(false);
    } catch (err) {
      setErroUnidade(err?.message || "Erro ao salvar. Tente novamente.");
    } finally {
      setSalvandoUnidade(false);
    }
  };

  const handleTrocarSenha = async (e) => {
    e.preventDefault();
    setErroSenha(null);
    if (!senhaAtual.trim()) {
      setErroSenha("Informe a senha atual.");
      return;
    }
    if (novaSenha.length < 6) {
      setErroSenha("A nova senha deve ter no mínimo 6 caracteres.");
      return;
    }
    if (novaSenha !== confirmarSenha) {
      setErroSenha("As senhas não coincidem.");
      return;
    }
    setSalvandoSenha(true);
    try {
      await api.patch("/unidade/trocar-senha", {
        senha_atual: senhaAtual,
        nova_senha: novaSenha,
      });
      setSenhaAtual("");
      setNovaSenha("");
      setConfirmarSenha("");
      setMostrarTrocarSenha(false);
    } catch (err) {
      setErroSenha(err?.message || "Erro ao alterar senha. Tente novamente.");
    } finally {
      setSalvandoSenha(false);
    }
  };

  // Ferramentas – Catraca: ações manuais
  const handleSincronizarDispositivo = async () => {
    if (!selectedDeviceId) {
      setFerramentasMsg("Selecione um dispositivo.");
      return;
    }
    setFerramentasMsg(null);
    setSyncLoading(true);
    try {
      const r = await api.post(`/acessos/sincronizar/${selectedDeviceId}`);
      setFerramentasMsg(r?.message || `Sincronizado. ${r?.inseridos ?? 0} inseridos, ${r?.ignorados ?? 0} ignorados.`);
    } catch (err) {
      setFerramentasMsg("Erro: " + (err?.message || "ao sincronizar"));
    } finally {
      setSyncLoading(false);
    }
  };

  const handleSincronizarTodos = async () => {
    setFerramentasMsg(null);
    setSyncAllLoading(true);
    try {
      const r = await api.post("/acessos/sincronizar-todos");
      setFerramentasMsg(r?.message || "Sincronização concluída.");
    } catch (err) {
      setFerramentasMsg("Erro: " + (err?.message || "ao sincronizar todos"));
    } finally {
      setSyncAllLoading(false);
    }
  };

  const handleBackupLogs = async () => {
    if (!selectedDeviceId) {
      setFerramentasMsg("Selecione um dispositivo.");
      return;
    }
    setFerramentasMsg(null);
    setBackupLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/dispositivos/${selectedDeviceId}/backup-logs`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || "Falha ao gerar backup");
      }
      const blob = await res.blob();
      const disp = res.headers.get("Content-Disposition") || "";
      const match = disp.match(/filename="?([^";]+)"?/);
      const filename = match ? match[1].trim() : `backup-dispositivo-${selectedDeviceId}.jsonl`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      setFerramentasMsg("Backup exportado e baixado.");
    } catch (err) {
      setFerramentasMsg("Erro: " + (err?.message || "ao gerar backup"));
    } finally {
      setBackupLoading(false);
    }
  };

  const handleConfigurarMonitor = async () => {
    if (!selectedDeviceId) {
      setFerramentasMsg("Selecione um dispositivo.");
      return;
    }
    setFerramentasMsg(null);
    setMonitorConfigLoading(true);
    try {
      const r = await api.post(`/dispositivos/${selectedDeviceId}/configurar-monitor`);
      setFerramentasMsg(r?.message || "Monitor configurado na catraca.");
    } catch (err) {
      const msg = err?.data?.message || err?.message || "ao configurar Monitor";
      setFerramentasMsg("Erro: " + msg);
    } finally {
      setMonitorConfigLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Configurações</h1>
        <p className={styles.subtitle}>
          Ajuste as preferências do sistema SAGE
        </p>
      </header>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <FontAwesomeIcon icon={faBuilding} className={styles.sectionIcon} />
          Dados da Unidade
        </h2>
        <div className={styles.card}>
          {!editandoUnidade ? (
            <>
              <div className={styles.unidadeGrid}>
                <div className={styles.unidadeItem}>
                  <span className={styles.unidadeLabel}>Nome</span>
                  <span className={styles.unidadeValue}>{unidade.nome || "—"}</span>
                </div>
                <div className={styles.unidadeItem}>
                  <span className={styles.unidadeLabel}>Nº Unidade</span>
                  <span className={styles.unidadeValue}>{unidade.numero_unidade || "—"}</span>
                </div>
                <div className={styles.unidadeItem}>
                  <span className={styles.unidadeLabel}>CNPJ</span>
                  <span className={styles.unidadeValue}>{unidade.cnpj || "—"}</span>
                </div>
                <div className={styles.unidadeItem}>
                  <span className={styles.unidadeLabel}>Login</span>
                  <span className={styles.unidadeValue}>{unidade.login || "—"}</span>
                </div>
                <div className={styles.unidadeItem}>
                  <span className={styles.unidadeLabel}>Email</span>
                  <span className={styles.unidadeValue}>{unidade.email || "—"}</span>
                </div>
                <div className={styles.unidadeItem}>
                  <span className={styles.unidadeLabel}>Logradouro</span>
                  <span className={styles.unidadeValue}>{unidade.logradouro || "—"}</span>
                </div>
                <div className={styles.unidadeItem}>
                  <span className={styles.unidadeLabel}>Número</span>
                  <span className={styles.unidadeValue}>{unidade.numero || "—"}</span>
                </div>
                <div className={styles.unidadeItem}>
                  <span className={styles.unidadeLabel}>Complemento</span>
                  <span className={styles.unidadeValue}>{unidade.complemento || "—"}</span>
                </div>
                <div className={styles.unidadeItem}>
                  <span className={styles.unidadeLabel}>Bairro</span>
                  <span className={styles.unidadeValue}>{unidade.bairro || "—"}</span>
                </div>
                <div className={styles.unidadeItem}>
                  <span className={styles.unidadeLabel}>Cidade</span>
                  <span className={styles.unidadeValue}>{unidade.cidade || "—"}</span>
                </div>
                <div className={styles.unidadeItem}>
                  <span className={styles.unidadeLabel}>Estado</span>
                  <span className={styles.unidadeValue}>{unidade.estado || "—"}</span>
                </div>
                <div className={styles.unidadeItem}>
                  <span className={styles.unidadeLabel}>CEP</span>
                  <span className={styles.unidadeValue}>{formatCep(unidade.cep) || "—"}</span>
                </div>
                <div className={styles.unidadeItem}>
                  <span className={styles.unidadeLabel}>Telefone</span>
                  <span className={styles.unidadeValue}>{formatTelefone(unidade.telefone_contato) || "—"}</span>
                </div>
                <div className={styles.unidadeItem}>
                  <span className={styles.unidadeLabel}>Senha</span>
                  <span className={styles.unidadeValue}>
                    <button
                      type="button"
                      className={styles.linkButton}
                      onClick={() => setMostrarTrocarSenha(true)}
                    >
                      <FontAwesomeIcon icon={faKey} /> Trocar senha
                    </button>
                  </span>
                </div>
              </div>
              {erroUnidade && <p className={styles.errorText}>{erroUnidade}</p>}
              <div className={styles.cardActions}>
                <button
                  type="button"
                  className={styles.btnPrimary}
                  onClick={() => setEditandoUnidade(true)}
                >
                  <FontAwesomeIcon icon={faPen} /> Editar
                </button>
              </div>
            </>
          ) : (
            <>
              <div className={styles.formGrid}>
                {["nome", "numero_unidade", "cnpj", "login", "email"].map((key) => (
                  <div key={key} className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      {key === "numero_unidade" ? "Nº Unidade" : key === "login" ? "Login" : key === "email" ? "Email" : key.toUpperCase()}
                    </label>
                    <input
                      type={key === "email" ? "email" : "text"}
                      className={styles.formInput}
                      value={unidade[key] ?? ""}
                      onChange={(e) => handleChangeUnidade(key, e.target.value)}
                      placeholder={key === "email" ? "exemplo@etec.sp.gov.br" : undefined}
                    />
                  </div>
                ))}
                <div className={styles.formGroupFull}>
                  <label className={styles.formLabel}>Logradouro</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={unidade.logradouro ?? ""}
                    onChange={(e) => handleChangeUnidade("logradouro", e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Número</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={unidade.numero ?? ""}
                    onChange={(e) => handleChangeUnidade("numero", e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Complemento</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={unidade.complemento ?? ""}
                    onChange={(e) => handleChangeUnidade("complemento", e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Bairro</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={unidade.bairro ?? ""}
                    onChange={(e) => handleChangeUnidade("bairro", e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Cidade</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={unidade.cidade ?? ""}
                    onChange={(e) => handleChangeUnidade("cidade", e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Estado</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={unidade.estado ?? ""}
                    onChange={(e) => handleChangeUnidade("estado", e.target.value)}
                    maxLength={2}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>CEP</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={formatCep(unidade.cep)}
                    onChange={(e) => handleChangeUnidade("cep", e.target.value.replace(/\D/g, ""))}
                    placeholder="00000-000"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Telefone</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={formatTelefone(unidade.telefone_contato)}
                    onChange={(e) => handleChangeUnidade("telefone_contato", e.target.value.replace(/\D/g, ""))}
                    placeholder="(00) 0000-0000"
                  />
                </div>
              </div>
              {erroUnidade && <p className={styles.errorText}>{erroUnidade}</p>}
              <div className={styles.cardActions}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => {
                    setEditandoUnidade(false);
                    setErroUnidade(null);
                  }}
                >
                  <FontAwesomeIcon icon={faTimes} /> Cancelar
                </button>
                <button
                  type="button"
                  className={styles.btnPrimary}
                  onClick={handleSalvarUnidade}
                  disabled={salvandoUnidade}
                >
                  <FontAwesomeIcon icon={faCheck} /> {salvandoUnidade ? "Salvando…" : "Salvar"}
                </button>
              </div>
            </>
          )}
        </div>

        <div className={styles.card}>
          <h3 className={styles.logoSectionTitle}>
            <FontAwesomeIcon icon={faImage} className={styles.sectionIcon} />
            Logo da escola
          </h3>
          <p className={styles.settingDesc}>
            A logo aparece na tela de início (Início), ao lado do nome da escola. A barra superior continua com a logo do SAGE.
          </p>
          <div className={styles.logoRow}>
            {unidade.logo && (
              <div className={styles.logoPreview}>
                <img src={getLogoUrl(unidade.logo)} alt="Logo da escola" onError={(e) => { e.target.style.display = "none"; }} />
              </div>
            )}
            <div className={styles.logoActions}>
              <label className={styles.logoUploadLabel}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  disabled={logoUploading}
                  className={styles.logoInput}
                />
                {logoUploading ? "Enviando…" : (unidade.logo ? "Trocar logo" : "Enviar logo")}
              </label>
            </div>
          </div>
          {erroLogo && <p className={styles.errorText}>{erroLogo}</p>}
        </div>

        {mostrarTrocarSenha && (
          <div className={`${styles.card} ${styles.trocarSenhaCard}`}>
            <h3 className={styles.trocarSenhaTitle}>Trocar senha</h3>
            <p className={styles.trocarSenhaDesc}>Para sua segurança, informe a senha atual antes de definir a nova.</p>
            <form onSubmit={handleTrocarSenha} className={styles.trocarSenhaForm}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Senha atual</label>
                <input
                  type="password"
                  className={styles.formInput}
                  value={senhaAtual}
                  onChange={(e) => setSenhaAtual(e.target.value)}
                  placeholder="Digite sua senha atual"
                  autoComplete="current-password"
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Nova senha</label>
                <input
                  type="password"
                  className={styles.formInput}
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  autoComplete="new-password"
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Confirmar nova senha</label>
                <input
                  type="password"
                  className={styles.formInput}
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  placeholder="Repita a nova senha"
                  autoComplete="new-password"
                />
              </div>
              {erroSenha && <p className={styles.errorText}>{erroSenha}</p>}
              <div className={styles.cardActions}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => {
                    setMostrarTrocarSenha(false);
                    setSenhaAtual("");
                    setNovaSenha("");
                    setConfirmarSenha("");
                    setErroSenha(null);
                  }}
                >
                  Cancelar
                </button>
                <button type="submit" className={styles.btnPrimary} disabled={salvandoSenha}>
                  {salvandoSenha ? "Salvando…" : "Alterar senha"}
                </button>
              </div>
            </form>
          </div>
        )}
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <FontAwesomeIcon icon={faBell} className={styles.sectionIcon} />
          Notificações
        </h2>
        <div className={styles.card}>
          <div className={styles.settingRow}>
            <div className={styles.settingInfo}>
              <span className={styles.settingLabel}>Som ao receber notificação</span>
              <span className={styles.settingDesc}>
                Reproduz um aviso sonoro quando chegar uma nova notificação
              </span>
            </div>
            <button
              type="button"
              className={`${styles.toggle} ${soundEnabled ? styles.toggleOn : ""}`}
              onClick={() => setSoundEnabled((prev) => !prev)}
              aria-pressed={soundEnabled}
              title={soundEnabled ? "Desativar som" : "Ativar som"}
            >
              <span className={styles.toggleThumb} />
            </button>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <FontAwesomeIcon icon={faWrench} className={styles.sectionIcon} />
          Ferramentas – Catraca
        </h2>
        <div className={styles.card}>
          <p className={styles.settingDesc}>
            Ações manuais para sincronizar acessos, exportar backup dos logs da catraca e configurar o Monitor (push).
            Modo atual: <strong>{config.monitorUsePush ? "Monitor (push)" : "Polling"}</strong>
            {config.monitorPollingEnabled && !config.monitorUsePush && (
              <> (servidor consulta a catraca a cada {config.monitorPollingIntervalMs / 1000}s)</>
            )}
            .
          </p>
          <div className={styles.ferramentasRow}>
            <label className={styles.formLabel}>Dispositivo</label>
            <select
              className={styles.ferramentasSelect}
              value={selectedDeviceId}
              onChange={(e) => setSelectedDeviceId(e.target.value)}
            >
              <option value="">Selecione</option>
              {dispositivos.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nome || `Dispositivo ${d.id}`}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.ferramentasButtons}>
            <button
              type="button"
              className={styles.btnPrimary}
              onClick={handleSincronizarDispositivo}
              disabled={syncLoading || !selectedDeviceId}
              title="Sincronizar acessos deste dispositivo com o sistema"
            >
              <FontAwesomeIcon icon={faSync} /> {syncLoading ? "Sincronizando…" : "Sincronizar este dispositivo"}
            </button>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={handleSincronizarTodos}
              disabled={syncAllLoading}
              title="Sincronizar todos os dispositivos"
            >
              <FontAwesomeIcon icon={faSync} /> {syncAllLoading ? "Sincronizando…" : "Sincronizar todos"}
            </button>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={handleBackupLogs}
              disabled={backupLoading || !selectedDeviceId}
              title="Exportar logs da catraca em JSONL (backup)"
            >
              <FontAwesomeIcon icon={faDownload} /> {backupLoading ? "Gerando…" : "Backup logs da catraca"}
            </button>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={handleConfigurarMonitor}
              disabled={monitorConfigLoading || !selectedDeviceId}
              title="Configurar a catraca para enviar eventos (push). Só funciona se MONITOR_USE_PUSH=true no servidor."
            >
              <FontAwesomeIcon icon={faServer} /> {monitorConfigLoading ? "Configurando…" : "Configurar Monitor (push)"}
            </button>
          </div>
          {ferramentasMsg && (
            <p className={ferramentasMsg.startsWith("Erro") ? styles.errorText : styles.settingDesc} style={{ marginTop: "0.75rem" }}>
              {ferramentasMsg}
            </p>
          )}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <FontAwesomeIcon icon={faPalette} className={styles.sectionIcon} />
          Aparência
        </h2>
        <div className={styles.card}>
          <div className={styles.settingRow}>
            <div className={styles.settingInfo}>
              <span className={styles.settingLabel}>Tema</span>
              <span className={styles.settingDesc}>
                O sistema está usando o tema claro. Suporte a tema escuro em breve.
              </span>
            </div>
            <span className={styles.badge}>Claro</span>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <FontAwesomeIcon icon={faCircleInfo} className={styles.sectionIcon} />
          Sobre o SAGE
        </h2>
        <div className={styles.card}>
          <div className={styles.aboutRow}>
            <span className={styles.aboutLabel}>Sistema</span>
            <span className={styles.aboutValue}>SAGE</span>
          </div>
          <div className={styles.aboutRow}>
            <span className={styles.aboutLabel}>Versão</span>
            <span className={styles.aboutValue}>{APP_VERSION}</span>
          </div>
          <p className={styles.aboutDesc}>
            Sistema de controle de acesso, monitoramento de dispositivos,
            gestão de pessoas, turmas, áreas e relatórios.
          </p>
        </div>
      </section>
    </div>
  );
}

export default Settings;
