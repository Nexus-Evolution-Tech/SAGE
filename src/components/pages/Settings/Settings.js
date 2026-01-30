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
} from "@fortawesome/free-solid-svg-icons";
import { api } from "../../../services/api";
import styles from "./Settings.module.css";

const STORAGE_SOUND = "sage_notifications_sound";
const STORAGE_UNIDADE = "sage_unidade";
const APP_VERSION = "0.1.0";

const DADOS_UNIDADE_INICIAL = {
  nome: "ETEC Taboão da Serra",
  numero_unidade: "206",
  cnpj: "62823257000109",
  login: "admin",
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

  const [mostrarTrocarSenha, setMostrarTrocarSenha] = useState(false);
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [salvandoSenha, setSalvandoSenha] = useState(false);
  const [erroSenha, setErroSenha] = useState(null);

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

  const handleChangeUnidade = (campo, valor) => {
    setUnidade((prev) => ({ ...prev, [campo]: valor ?? "" }));
    setErroUnidade(null);
  };

  const handleSalvarUnidade = async () => {
    setErroUnidade(null);
    setSalvandoUnidade(true);
    const payload = { ...unidade };
    delete payload.senha;
    try {
      await api.patch("/unidade", payload);
      setEditandoUnidade(false);
    } catch (err) {
      try {
        localStorage.setItem(STORAGE_UNIDADE, JSON.stringify(payload));
        setEditandoUnidade(false);
      } catch {
        setErroUnidade(err?.message || "Erro ao salvar. Tente novamente.");
      }
    } finally {
      setSalvandoUnidade(false);
    }
  };

  const handleTrocarSenha = async (e) => {
    e.preventDefault();
    setErroSenha(null);
    if (novaSenha.length < 6) {
      setErroSenha("A senha deve ter no mínimo 6 caracteres.");
      return;
    }
    if (novaSenha !== confirmarSenha) {
      setErroSenha("As senhas não coincidem.");
      return;
    }
    setSalvandoSenha(true);
    try {
      await api.patch("/unidade/trocar-senha", { nova_senha: novaSenha });
      setNovaSenha("");
      setConfirmarSenha("");
      setMostrarTrocarSenha(false);
    } catch (err) {
      setErroSenha(err?.message || "Erro ao alterar senha. Tente novamente.");
    } finally {
      setSalvandoSenha(false);
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
                {["nome", "numero_unidade", "cnpj", "login"].map((key) => (
                  <div key={key} className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      {key === "numero_unidade" ? "Nº Unidade" : key === "login" ? "Login" : key.toUpperCase()}
                    </label>
                    <input
                      type="text"
                      className={styles.formInput}
                      value={unidade[key] ?? ""}
                      onChange={(e) => handleChangeUnidade(key, e.target.value)}
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

        {mostrarTrocarSenha && (
          <div className={`${styles.card} ${styles.trocarSenhaCard}`}>
            <h3 className={styles.trocarSenhaTitle}>Trocar senha</h3>
            <form onSubmit={handleTrocarSenha} className={styles.trocarSenhaForm}>
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
