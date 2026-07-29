import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import styles from "./RedefinirSenha.module.css";
import logo from "../../../img/logo.png";

const API_URL = (process.env.REACT_APP_API_URL || "").replace(/\/$/, "");

function RedefinirSenha() {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get("token") || "";
  const [token] = useState(tokenFromUrl);
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState(null);
  const [erro, setErro] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!tokenFromUrl.trim()) {
      setErro("Link inválido. Use o link que foi enviado ao seu e-mail.");
    }
  }, [tokenFromUrl]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro(null);
    setMensagem(null);
    if (!token.trim()) {
      setErro("Link inválido. Use o link que foi enviado ao seu e-mail.");
      return;
    }
    if (novaSenha.length < 6) {
      setErro("A nova senha deve ter no mínimo 6 caracteres.");
      return;
    }
    if (novaSenha !== confirmarSenha) {
      setErro("As senhas não coincidem.");
      return;
    }
    setEnviando(true);
    try {
      const res = await fetch(`${API_URL}/escolas/redefinir-senha`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token.trim(), nova_senha: novaSenha }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMensagem(data.message || "Senha alterada com sucesso. Redirecionando…");
        setTimeout(() => navigate("/login"), 2000);
      } else {
        setErro(data.message || "Não foi possível redefinir a senha. O link pode ter expirado.");
      }
    } catch (err) {
      setErro("Erro de conexão. Verifique se a API está rodando.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.cardContainer}>
        <img src={logo} alt="SAGE" className={styles.logo} />
        <h1 className={styles.cardTitle}>Nova senha</h1>
        <p className={styles.cardSubtitle}>
          Defina uma nova senha para acessar o sistema. Use no mínimo 6 caracteres.
        </p>

        {!tokenFromUrl.trim() ? (
          <>
            <p className={styles.erro}>Link inválido. Solicite uma nova redefinição na tela de login.</p>
            <Link to="/esqueci-senha" className={styles.linkVoltar}>
              Solicitar novo link
            </Link>
          </>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit}>
            <input
              type="password"
              placeholder="Nova senha"
              className={styles.input}
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              disabled={enviando}
              autoComplete="new-password"
              minLength={6}
            />
            <input
              type="password"
              placeholder="Confirmar nova senha"
              className={styles.input}
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              disabled={enviando}
              autoComplete="new-password"
              minLength={6}
            />
            {erro && <p className={styles.erro}>{erro}</p>}
            {mensagem && <p className={styles.sucesso}>{mensagem}</p>}
            <button type="submit" className={styles.btn} disabled={enviando}>
              {enviando ? "Salvando…" : "Redefinir senha"}
            </button>
          </form>
        )}

        <Link to="/login" className={styles.linkVoltar}>
          Voltar ao login
        </Link>
      </div>
    </div>
  );
}

export default RedefinirSenha;
