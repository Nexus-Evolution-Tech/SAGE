import { useState } from "react";
import { Link } from "react-router-dom";
import styles from "./EsqueciSenha.module.css";
import logo from "../../../img/logo.png";
import { useNotifications } from "../../../contexts/NotificationContext";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3000";

function EsqueciSenha() {
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState(null);
  const [erro, setErro] = useState(null);
  const { addNotification } = useNotifications();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro(null);
    setMensagem(null);
    const emailTrim = email.trim();
    if (!emailTrim) {
      setErro("Informe o e-mail cadastrado na unidade.");
      return;
    }
    setEnviando(true);
    try {
      const res = await fetch(`${API_URL}/escolas/esqueci-senha`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailTrim }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        const msg = data.message || "Se o e-mail estiver cadastrado, você receberá um link para redefinir a senha. Verifique sua caixa de entrada e o spam.";
        setMensagem(msg);
        setEmail("");
        addNotification({
          title: "Link de redefinição enviado",
          message: msg,
          type: "info",
        });
      } else {
        setErro(data.message || "Não foi possível processar. Tente novamente.");
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
        <h1 className={styles.cardTitle}>Esqueci a senha</h1>
        <p className={styles.cardSubtitle}>
          Informe o e-mail cadastrado na unidade. Enviaremos um link para redefinir sua senha.
        </p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="E-mail cadastrado"
            className={styles.input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={enviando}
            autoComplete="email"
          />
          {erro && <p className={styles.erro}>{erro}</p>}
          {mensagem && <p className={styles.sucesso}>{mensagem}</p>}
          <button type="submit" className={styles.btn} disabled={enviando}>
            {enviando ? "Enviando…" : "Enviar link"}
          </button>
        </form>

        <Link to="/login" className={styles.linkVoltar}>
          Voltar ao login
        </Link>
      </div>
    </div>
  );
}

export default EsqueciSenha;
