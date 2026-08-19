import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../../services/api";
import { setPasswordChangeRequired } from "../../../utils/session";
import styles from "../Settings/Settings.module.css";
export function TrocarSenhaForm({ onCancel, onSuccess }) {
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [salvandoSenha, setSalvandoSenha] = useState(false);
  const [erroSenha, setErroSenha] = useState(null);
  const handleTrocarSenha = async (event) => {
    event.preventDefault();
    setErroSenha(null);
    if (!senhaAtual.trim()) {
      setErroSenha("Informe a senha atual.");
      return;
    }
    if (novaSenha.length < 8) {
      setErroSenha("A nova senha deve ter no mínimo 8 caracteres.");
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
      setPasswordChangeRequired(false);
      window.dispatchEvent(new Event("auth-changed"));
      onSuccess?.();
    } catch (err) {
      setErroSenha(err?.message || "Erro ao alterar senha. Tente novamente.");
    } finally {
      setSalvandoSenha(false);
    }
  };
  const field = (id, label, value, setValue, props = {}) => <div className={styles.formGroup}>
    <label className={styles.formLabel} htmlFor={id}>{label}</label>
    <input {...props} id={id} type="password" className={styles.formInput} value={value} onChange={(event) => setValue(event.target.value)} required />
  </div>;
  return (
    <form onSubmit={handleTrocarSenha} className={styles.trocarSenhaForm} aria-label="Troca de senha">
      {field("senha-atual", "Senha atual", senhaAtual, setSenhaAtual, { placeholder: "Digite sua senha atual", autoComplete: "current-password" })}
      {field("nova-senha", "Nova senha", novaSenha, setNovaSenha, { placeholder: "Mínimo 8 caracteres", autoComplete: "new-password", minLength: 8 })}
      {field("confirmar-senha", "Confirmar nova senha", confirmarSenha, setConfirmarSenha, { placeholder: "Repita a nova senha", autoComplete: "new-password", minLength: 8 })}
      {erroSenha && <p className={styles.errorText}>{erroSenha}</p>}
      <div className={styles.cardActions}>
        {onCancel && <button type="button" className={styles.btnSecondary} onClick={onCancel}>Cancelar</button>}
        <button type="submit" className={styles.btnPrimary} disabled={salvandoSenha}>{salvandoSenha ? "Salvando…" : "Alterar senha"}</button>
      </div>
    </form>
  );
}
export default function TrocarSenha() {
  const navigate = useNavigate();
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Troca de senha</h1>
        <p className={styles.subtitle}>Defina sua nova senha para continuar no SAGE.</p>
      </header>
      <div className={`${styles.card} ${styles.trocarSenhaCard}`}>
        <h2 className={styles.trocarSenhaTitle}>Trocar senha</h2>
        <p className={styles.trocarSenhaDesc}>Informe a senha atual e defina uma nova com no mínimo 8 caracteres.</p>
        <TrocarSenhaForm onSuccess={() => navigate("/inicio", { replace: true })} />
      </div>
    </div>
  );
}
