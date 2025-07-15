import { useParams, useNavigate } from "react-router-dom";
import { useRef, useState } from "react";
import styles from "./Adicionar.module.css";

function Adicionar() {
  const { tipo } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef();
  const videoRef = useRef();
  const canvasRef = useRef();
  const [showCamera, setShowCamera] = useState(false);
  const [fotoBase64, setFotoBase64] = useState(null);
  const [formData, setFormData] = useState({});

  const campos = {
    ALUNO: ["nome", "rg", "cpf", "telefone", "email", "data_nascimento", "genero", "rm", "periodo", "divisao", "turma_id", "curso_id"],
    PROFESSOR: ["nome", "rg", "cpf", "telefone", "email", "data_nascimento", "genero", "siape", "disciplina_id"],
    ADMINISTRADOR: ["nome", "rg", "cpf", "telefone", "email", "data_nascimento", "genero", "cargo", "entrada", "saida"],
    TERCEIRIZADO: ["nome", "rg", "cpf", "telefone", "email", "data_nascimento", "genero", "empresa_id", "funcao", "entrada", "saida"]
  };

  const handleInputChange = (campo, valor) => {
    setFormData(prev => ({ ...prev, [campo]: valor }));
  };

  const handleUpload = (file) => {
    const reader = new FileReader();
    reader.onload = () => setFotoBase64(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSelecionarArquivo = (e) => {
    const file = e.target.files[0];
    if (file) handleUpload(file);
  };

  const iniciarCamera = async () => {
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
    } catch {
      alert("Erro ao acessar a câmera");
    }
  };

  const tirarFoto = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, 300, 300);
    canvas.toBlob((blob) => {
      if (blob) handleUpload(blob);
    });
    const tracks = video.srcObject.getTracks();
    tracks.forEach(track => track.stop());
    setShowCamera(false);
  };

  const gerarDadosCompletos = () => {
    const base = {
      ...formData,
      foto: fotoBase64 || "",
      tipo: tipo,
      status: "ATIVO",
      senha_acesso: "$2b$10$senha_fake_criptografada",
      qr_code: "QR1234567890FAKE",
      cartao_rfid: "RFID1234567890FAKE",
      unidade_id: null,
    };

    // Ajustes específicos
    if (tipo === "ALUNO") {
      base.turma_id = parseInt(base.turma_id || 1);
      base.curso_id = parseInt(base.curso_id || 1);
      base.responsavel_id = null;
    }

    if (tipo === "PROFESSOR") {
      base.disciplina_id = parseInt(base.disciplina_id || 1);
      base.siape = base.siape || "123456";
    }

    if (tipo === "ADMINISTRADOR") {
      base.cargo = base.cargo || "COORDENADOR_PEDAGOGICO";
      base.entrada = base.entrada || "08:00:00";
      base.saida = base.saida || "17:00:00";
    }

    if (tipo === "TERCEIRIZADO") {
      base.funcao = base.funcao || "FAXINEIRO";
      base.entrada = base.entrada || "08:00:00";
      base.saida = base.saida || "17:00:00";
      base.empresa_id = base.empresa_id ? parseInt(base.empresa_id) : null;
    }

    return base;
  };

  const handleSalvar = async () => {
  const obrigatorios = campos[tipo] || [];
  const incompletos = obrigatorios.filter(c => !formData[c]);
  if (incompletos.length > 0) return alert("Preencha todos os campos obrigatórios!");

  if (!fotoBase64) return alert("Adicione uma foto!");

  const fotoNome = `pessoa_${Date.now()}.jpg`;

  const dadosPessoa = {
    ...formData,
    foto: fotoNome,
    tipo,
    status: "ATIVO",
    senha_acesso: "senha123", // senha em texto normal segundo seu exemplo
    qr_code: "QR123456FAKE",
    cartao_rfid: "RFID123456FAKE",
    unidade_id: null
  };

  try {
    // 1. Cria a pessoa
    const res = await fetch("http://localhost:3000/pessoas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dadosPessoa)
    });

    const response = await res.json();
    const idPessoa = response.pessoa.idPessoa;

    // 2. Upload da foto com ID gerado
    const blob = await (await fetch(fotoBase64)).blob();
    const formDataUpload = new FormData();
    formDataUpload.append("foto", blob, fotoNome);
    formDataUpload.append("id", idPessoa);

    await fetch(`http://localhost:3000/pessoas/upload/${idPessoa}`, {
      method: "POST",
      body: formDataUpload
    });

    alert("Pessoa cadastrada com sucesso!");
    navigate("/");
  } catch (err) {
    console.error(err);
    alert("Erro ao cadastrar.");
  }
};


  const renderCampos = () => campos[tipo]?.map(campo => (
    <div className={styles.inputGroup} key={campo}>
      <label>{campo.replace(/_/g, ' ').toUpperCase()}</label>
      <input type="text" value={formData[campo] || ""} onChange={(e) => handleInputChange(campo, e.target.value)} />
    </div>
  )) || <p>Tipo inválido</p>;

  return (
    <div className={styles.cadastroContainer}>
      <aside className={styles.fotoSection}>
        <h3 className={styles.subtitle}>Foto</h3>
        {fotoBase64 ? (
          <img src={fotoBase64} className={styles.fotoPreview} />
        ) : <p>Nenhuma foto selecionada</p>}
        <div className={styles.btnGroup}>
          <input type="file" accept="image/*" ref={fileInputRef} style={{ display: "none" }} onChange={handleSelecionarArquivo} />
          <button onClick={() => fileInputRef.current.click()}>Selecionar arquivo</button>
          <button onClick={iniciarCamera}>Tirar foto</button>
        </div>
        {showCamera && (
          <div className={styles.camera}>
            <video ref={videoRef} width="300" height="300" autoPlay />
            <button onClick={tirarFoto}>Capturar</button>
            <canvas ref={canvasRef} width="300" height="300" style={{ display: "none" }} />
          </div>
        )}
      </aside>

      <section className={styles.dadosSection}>
        <div className={styles.header}>
          <h2>Informações - {tipo}</h2>
          <button className={styles.exportar} onClick={handleSalvar}>Salvar</button>
        </div>
        <form className={styles.dadosForm}>
          {renderCampos()}
        </form>
      </section>
    </div>
  );
}

export default Adicionar;
