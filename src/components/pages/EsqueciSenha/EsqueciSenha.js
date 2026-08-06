import { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './EsqueciSenha.module.css';

export default function EsqueciSenha() {
  const [form, setForm] = useState({ login: '', chave_recuperacao: '', nova_senha: '', confirmacao_nova_senha: '' });
  const [mensagem, setMensagem] = useState('');
  const [novaChave, setNovaChave] = useState('');
  const alterar = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const enviar = async (e) => {
    e.preventDefault(); setMensagem('');
    const response = await fetch('/escolas/recuperar-acesso', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) { setMensagem(data.message || 'Não foi possível recuperar o acesso.'); return; }
    setNovaChave(data.recoveryKey || ''); setMensagem(data.message || 'Senha alterada com sucesso.');
  };
  const baixar = () => { const blob = new Blob([novaChave], { type: 'text/plain' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'sage-chave-recuperacao.txt'; a.click(); URL.revokeObjectURL(url); };
  return <div className={styles.container}><div className={styles.cardContainer}>
    <h2>Recuperar acesso local</h2><p>Use o login da unidade e sua chave de recuperação.</p>
    <form onSubmit={enviar}>
      <input name="login" placeholder="Login da unidade" value={form.login} onChange={alterar} required />
      <input name="chave_recuperacao" placeholder="Chave de recuperação" value={form.chave_recuperacao} onChange={alterar} required />
      <input type="password" name="nova_senha" placeholder="Nova senha (mínimo 8 caracteres)" value={form.nova_senha} onChange={alterar} minLength={8} required />
      <input type="password" name="confirmacao_nova_senha" placeholder="Confirme a nova senha" value={form.confirmacao_nova_senha} onChange={alterar} minLength={8} required />
      <button type="submit">ALTERAR SENHA</button>
    </form>
    {mensagem && <p>{mensagem}</p>}
    {novaChave && <><p>Uma nova chave foi gerada. Salve-a agora:</p><textarea readOnly value={novaChave} /><button type="button" onClick={() => navigator.clipboard?.writeText(novaChave)}>COPIAR</button><button type="button" onClick={baixar}>BAIXAR</button><button type="button" onClick={() => window.print()}>IMPRIMIR</button></>}
    <Link to="/login">Voltar ao login</Link>
  </div></div>;
}
