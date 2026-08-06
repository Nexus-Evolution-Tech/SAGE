import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import styles from "./Login.module.css";
import logo from '../../../img/logo.png';

const Modal = ({ message, onClose }) => (
  <div className={styles.modalOverlay}>
    <div className={styles.modalContent}>
      <div className={styles.modalHeader}>
        <h2 className={styles.modalTitle}>Aviso</h2>
        <button onClick={onClose} className={styles.closeButton}>&times;</button>
      </div>
      <p className={styles.modalMessage}>{message}</p>
    </div>
  </div>
);

function Login() {
  const [schools, setSchools] = useState([]);
  const [selectedSchoolLogin, setSelectedSchoolLogin] = useState("");
  const [password, setPassword] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [onboardingRequired, setOnboardingRequired] = useState(null);
  const [recoveryKey, setRecoveryKey] = useState('');
  const [recoverySaved, setRecoverySaved] = useState(false);
  const [setup, setSetup] = useState({ nome: '', login: '', senha: '', confirmar: '' });
  const navigate = useNavigate();

  const showError = useCallback((message) => {
    setModalMessage(message);
    setShowModal(true);
  }, []);

  const fetchSchools = useCallback(async () => {
    try {
      const response = await fetch("/escolas");
      if (!response.ok) throw new Error('Erro ao buscar as escolas.');
      const data = await response.json();
      if (!data.data || !Array.isArray(data.data)) throw new Error('Resposta de escolas inválida.');
      setSchools(data.data);
      if (data.data.length > 0) setSelectedSchoolLogin(data.data[0].login);
    } catch (error) {
      showError("Não foi possível carregar as escolas. Verifique a API.");
    }
  }, [showError]);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch('/setup/status');
        if (!response.ok) throw new Error('Status inicial indisponível');
        const status = await response.json();
        setOnboardingRequired(Boolean(status.required));
        if (!status.required) await fetchSchools();
      } catch (error) {
        showError('Não foi possível verificar a configuração inicial do SAGE.');
      }
    };
    load();
  }, [fetchSchools, showError]);

  const handleSetup = async (event) => {
    event.preventDefault();
    if (setup.nome.trim().length < 3) {
      showError('O nome da unidade deve ter ao menos 3 caracteres.');
      return;
    }
    if (!/^[A-Za-z0-9._-]{3,100}$/.test(setup.login.trim())) {
      showError('O login deve ter entre 3 e 100 caracteres e usar apenas letras, números, ponto, hífen ou sublinhado.');
      return;
    }
    if (setup.senha.length < 8) {
      showError('A senha deve ter ao menos 8 caracteres.');
      return;
    }
    if (setup.senha !== setup.confirmar) {
      showError('A confirmação da senha não é igual à senha digitada.');
      return;
    }
    try {
      const response = await fetch('/setup/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: setup.nome, login: setup.login, senha: setup.senha })
      });
      const contentType = response.headers?.get?.('content-type') || '';
      const data = contentType.includes('application/json') ? await response.json() : {};
      if (!response.ok) {
        throw new Error(data.message || `Não foi possível concluir a configuração (erro ${response.status}).`);
      }
      setSetup({ nome: '', login: '', senha: '', confirmar: '' });
      setRecoveryKey(data.recoveryKey || '');
    } catch (error) {
      showError(error.message);
    }
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    const selectedSchool = schools.find((school) => school.login === selectedSchoolLogin);
    if (!selectedSchoolLogin || !password || !selectedSchool) {
      showError('Por favor, selecione a escola e digite a senha.');
      return;
    }
    try {
      const response = await fetch(`/escolas/login/${selectedSchool.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario: selectedSchoolLogin, senha: password })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Credenciais inválidas.');
      localStorage.setItem('token', data.token);
      navigate('/inicio');
    } catch (error) {
      showError(error.message);
    }
  };

  if (onboardingRequired === null) {
    return (
      <div className={styles.container}>
        {showModal && <Modal message={modalMessage} onClose={() => setShowModal(false)} />}
        <div className={styles.cardContainer}>
          <img src={logo} alt="logo" className={styles.logo} />
          <div className={styles.cardTitle}>Carregando SAGE...</div>
        </div>
      </div>
    );
  }

  if (onboardingRequired === true) {
    if (recoveryKey) {
      const baixar = () => {
        const blob = new Blob([`Chave de recuperação SAGE\n\n${recoveryKey}\n`], { type: 'text/plain' });
        const url = URL.createObjectURL(blob); const a = document.createElement('a');
        a.href = url; a.download = 'sage-chave-recuperacao.txt'; a.click(); URL.revokeObjectURL(url);
      };
      return (
        <div className={styles.container}><div className={styles.cardContainer}>
          <img src={logo} alt="logo" className={styles.logo} />
          <div className={styles.cardTitle}>Salve sua chave de recuperação</div>
          <p>Ela será exibida uma única vez. Guarde-a em local seguro.</p>
          <textarea className={styles.input} readOnly value={recoveryKey} rows={3} />
          <button type="button" className={styles.btn} onClick={() => navigator.clipboard?.writeText(recoveryKey)}>COPIAR</button>
          <button type="button" className={styles.btn} onClick={baixar}>BAIXAR</button>
          <button type="button" className={styles.btn} onClick={() => window.print()}>IMPRIMIR</button>
          <label><input type="checkbox" checked={recoverySaved} onChange={(e) => setRecoverySaved(e.target.checked)} /> Confirme que salvou a chave</label>
          <button type="button" className={styles.btn} disabled={!recoverySaved} onClick={() => { setRecoveryKey(''); setOnboardingRequired(false); fetchSchools(); }}>CONCLUIR</button>
        </div></div>
      );
    }
    return (
      <div className={styles.container}>
        {showModal && <Modal message={modalMessage} onClose={() => setShowModal(false)} />}
        <div className={styles.cardContainer}>
          <img src={logo} alt="logo" className={styles.logo} />
          <div className={styles.cardTitle}>Configurar SAGE</div>
          <form className={styles.inputs} onSubmit={handleSetup}>
            <input className={styles.input} placeholder="Nome da unidade" value={setup.nome}
              onChange={(e) => setSetup({ ...setup, nome: e.target.value })} required />
            <input className={styles.input} placeholder="Crie seu login" value={setup.login}
              onChange={(e) => setSetup({ ...setup, login: e.target.value })} minLength={3} required />
            <input type="password" className={styles.input} placeholder="Crie sua senha" value={setup.senha}
              onChange={(e) => setSetup({ ...setup, senha: e.target.value })} minLength={8} required />
            <input type="password" className={styles.input} placeholder="Confirme sua senha" value={setup.confirmar}
              onChange={(e) => setSetup({ ...setup, confirmar: e.target.value })} minLength={8} required />
            <button type="submit" className={styles.btn}>CRIAR ACESSO</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {showModal && <Modal message={modalMessage} onClose={() => setShowModal(false)} />}
      <div className={styles.cardContainer}>
        <img src={logo} alt="logo" className={styles.logo} />
        <div className={styles.cardTitle}>Login</div>
        <form className={styles.inputs} onSubmit={handleLogin}>
          <select className={`${styles.input} ${styles.selectInput}`} value={selectedSchoolLogin}
            onChange={(e) => setSelectedSchoolLogin(e.target.value)} required>
            {schools.map((school) => <option key={school.id} value={school.login}>{school.nome}</option>)}
          </select>
          <input type="password" placeholder="Senha" className={styles.input} value={password}
            onChange={(e) => setPassword(e.target.value)} required />
          <button type="submit" className={styles.btn}>ENTRAR</button>
          <Link to="/esqueci-senha" className={styles.linkEsqueci}>Esqueci a senha</Link>
        </form>
      </div>
    </div>
  );
}

export default Login;
