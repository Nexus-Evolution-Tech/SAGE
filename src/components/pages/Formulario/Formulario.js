import { useParams } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import styles from "./Formulario.module.css";

const TURMAS = {
  1: "1° Ano A",
  2: "1° Ano B",
  3: "2° Ano A",
  4: "2° Ano B",
  5: "3° Ano A",
  14: "3° Ano B",
};

function Formulario() {
  const { id } = useParams();
  const [pessoa, setPessoa] = useState(null);
  const [formData, setFormData] = useState({});
  const [fotoUrl, setFotoUrl] = useState(null);
  const [cursoNome, setCursoNome] = useState("");
  const [responsavel, setResponsavel] = useState(null);
  const [materiaNome, setMateriaNome] = useState("");
  const [empresaNome, setEmpresaNome] = useState("");
  const [showCamera, setShowCamera] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const fileInputRef = useRef();
  const videoRef = useRef();
  const canvasRef = useRef();

  // Busca dados iniciais e popula estados
  useEffect(() => {
    async function fetchData() {
      try {
        const pessoaRes = await fetch(`http://localhost:3000/pessoas/${id}`);
        const pessoaData = await pessoaRes.json();
        setPessoa(pessoaData);
        setFormData(pessoaData); // inicializa formData para edição

        const fotoRes = await fetch(`http://localhost:3000/pessoas/url/${id}`);
        const fotoData = await fotoRes.json();
        setFotoUrl(fotoData.url);

        if (pessoaData.curso_id) {
          const cursoRes = await fetch(
            `http://localhost:3000/cursos/${pessoaData.curso_id}`
          );
          const cursoData = await cursoRes.json();
          setCursoNome(cursoData[0]?.nome || "");
        }

        if (pessoaData.responsavel_id) {
          const respRes = await fetch(
            `http://localhost:3000/responsaveis/${pessoaData.responsavel_id}`
          );
          const respData = await respRes.json();
          setResponsavel(respData[0]);
        }

        if (pessoaData.tipo === "PROFESSOR" && pessoaData.disciplina_id) {
          const materiaRes = await fetch(
            `http://localhost:3000/materias/${pessoaData.disciplina_id}`
          );
          const materiaData = await materiaRes.json();
          setMateriaNome(materiaData[0]?.nome || "");
        }

        if (pessoaData.tipo === "TERCEIRIZADO" && pessoaData.empresa_id) {
          const empresaRes = await fetch(
            `http://localhost:3000/empresas/${pessoaData.empresa_id}`
          );
          const empresaData = await empresaRes.json();
          setEmpresaNome(empresaData[0]?.nome || "");
        }
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
      }
    }
    fetchData();
  }, [id]);

  // Atualiza o formData quando usuário edita um campo
  const handleInputChange = (campo, valor) => {
    setFormData((prev) => ({ ...prev, [campo]: valor }));
  };

  // Upload foto - por arquivo
  const handleUpload = async (file) => {
    const formDataUpload = new FormData();
    formDataUpload.append("foto", file);
    formDataUpload.append("id", id);

    try {
      await fetch(`http://localhost:3000/pessoas/upload/${id}`, {
        method: "POST",
        body: formDataUpload,
      });

      const res = await fetch(`http://localhost:3000/pessoas/url/${id}`);
      const data = await res.json();
      setFotoUrl(data.url);
    } catch {
      alert("Erro ao enviar a foto.");
    }
  };

  // Upload via input file
  const handleSelecionarArquivo = (e) => {
    const file = e.target.files[0];
    if (file) handleUpload(file);
  };

  // Inicia câmera para tirar foto
  const iniciarCamera = async () => {
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
    } catch {
      alert("Erro ao acessar a câmera.");
    }
  };

  // Captura foto da câmera
  const tirarFoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    ctx.drawImage(video, 0, 0, 300, 300);
    canvas.toBlob((blob) => {
      if (blob) handleUpload(blob);
    }, "image/jpeg");

    // Para a câmera
    video.srcObject.getTracks().forEach((track) => track.stop());
    setShowCamera(false);
  };

  // Envia PATCH com dados atualizados
  const handleSalvar = async () => {
    try {
      await fetch(`http://localhost:3000/pessoas/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      alert("Pessoa atualizada com sucesso!");
      setEditMode(false);
      setPessoa(formData);
      // atualiza estado local para refletir mudanças
    } catch {
      alert("Erro ao atualizar pessoa.");
    }
  };

  if (!pessoa) return <p className={styles.loading}>Carregando dados...</p>;

  // Renderiza campo editável ou readonly dependendo do modo
  const renderCampo = (label, campo) => (
    <div className={styles.inputGroup}>
      <label>{label}</label>
      <input
        type="text"
        value={formData[campo] || ""}
        readOnly={!editMode}
        onChange={(e) => handleInputChange(campo, e.target.value)}
      />
    </div>
  );

  // Renderiza os campos específicos do tipo, agora com edição habilitada
  const renderCamposEspecificos = () => {
    const tipo = pessoa.tipo;

    switch (tipo) {
      case "ALUNO":
        return (
          <>
            <div className={styles.inputRow}>
              {renderCampo("Matrícula", "rm")}
              {renderCampo("ID", "id")}
              {renderCampo("Status", "status")}
            </div>
            <div className={styles.inputRow}>
              {renderCampo("Período", "periodo")}
              {renderCampo("Turma", "turma_id")}
              {renderCampo("Divisão", "divisao")}
            </div>
            <div className={styles.inputRow}>
              {renderCampo("Email Institucional", "email")}
              {renderCampo("Telefone", "telefone")}
            </div>
            <div className={styles.inputRow}>
              {renderCampo("Curso", "curso_id")}
              {renderCampo("Gênero", "genero")}
            </div>
            <div className={styles.inputRow}>
              <div className={styles.inputGroup}>
                <label>Nome do Responsável</label>
                <input type="text" value={responsavel?.nome || ""} readOnly />
              </div>
              <div className={styles.inputGroup}>
                <label>Email do Responsável</label>
                <input type="text" value={responsavel?.email || ""} readOnly />
              </div>
              <div className={styles.inputGroup}>
                <label>Telefone do Responsável</label>
                <input
                  type="text"
                  value={responsavel?.telefone || ""}
                  readOnly
                />
              </div>
            </div>
            <div className={styles.inputGroup}>
              <label>Observações</label>
              <textarea
                readOnly={!editMode}
                className={styles.message}
                rows="4"
                value={formData.observacoes || ""}
                onChange={(e) =>
                  handleInputChange("observacoes", e.target.value)
                }
              />
            </div>
          </>
        );
      case "PROFESSOR":
        return (
          <>
            <div className={styles.inputRow}>
              {renderCampo("ID", "id")}
              {renderCampo("Status", "status")}
              {renderCampo("RG", "rg")}
            </div>
            <div className={styles.inputRow}>
              {renderCampo("Telefone", "telefone")}
              {renderCampo("Email", "email")}
              {renderCampo("Data de Nascimento", "data_nascimento")}
            </div>
            <div className={styles.inputRow}>
              {renderCampo("Gênero", "genero")}
              {renderCampo("SIAPE", "siape")}
              {renderCampo("Disciplina", "disciplina_id")}
            </div>
          </>
        );
      case "ADMINISTRADOR":
        return (
          <>
            <div className={styles.inputRow}>
              {renderCampo("ID", "id")}
              {renderCampo("Status", "status")}
              {renderCampo("RG", "rg")}
            </div>
            <div className={styles.inputRow}>
              {renderCampo("Cargo", "cargo")}
              {renderCampo("Entrada", "entrada")}
              {renderCampo("Saída", "saida")}
            </div>
            <div className={styles.inputRow}>
              {renderCampo("Telefone", "telefone")}
              {renderCampo("Email", "email")}
              {renderCampo("Data de Nascimento", "data_nascimento")}
            </div>
            <div className={styles.inputRow}>
              {renderCampo("Gênero", "genero")}
            </div>
          </>
        );
      case "TERCEIRIZADO":
        return (
          <>
            <div className={styles.inputRow}>
              {renderCampo("ID", "id")}
              {renderCampo("Status", "status")}
              {renderCampo("RG", "rg")}
            </div>
            <div className={styles.inputRow}>
              {renderCampo("Empresa", "empresa_id")}
              {renderCampo("Função", "funcao")}
              {renderCampo("Entrada", "entrada")}
              {renderCampo("Saída", "saida")}
            </div>
            <div className={styles.inputRow}>
              {renderCampo("Telefone", "telefone")}
              {renderCampo("Email", "email")}
              {renderCampo("Data de Nascimento", "data_nascimento")}
            </div>
            <div className={styles.inputRow}>
              {renderCampo("Gênero", "genero")}
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className={styles.cadastroContainer}>
      <aside className={styles.fotoSection}>
        <h3 className={styles.subtitle}>Foto</h3>
        {fotoUrl ? (
          <img
            src={fotoUrl}
            alt="Foto de perfil"
            className={styles.fotoPreview}
          />
        ) : (
          <p>Carregando foto...</p>
        )}

        {/* Só mostra opções de troca da foto no modo edição */}
        {editMode && (
          <div className={styles.btnGroup}>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleSelecionarArquivo}
              style={{ display: "none" }}
            />
            <button onClick={() => fileInputRef.current.click()}>
              Selecionar arquivo
            </button>
            <button onClick={iniciarCamera}>Tirar foto</button>
          </div>
        )}

        {showCamera && (
          <div className={styles.camera}>
            <video ref={videoRef} width="300" height="300" autoPlay />
            <button onClick={tirarFoto}>Capturar</button>
            <canvas
              ref={canvasRef}
              width="300"
              height="300"
              style={{ display: "none" }}
            />
          </div>
        )}

        <h3 className={styles.subtitle}>Documento RG</h3>
        <img src="/img/rg.png" alt="RG" className={styles.fotoPreview} />
      </aside>

      <section className={styles.dadosSection}>
        <div className={styles.header}>
          <h2>Informações</h2>
          <button className={styles.exportar}>Exportar</button>
          {/* Botões Editar e Salvar condicionais */}
          {editMode ? (
            <button className={styles.exportar} onClick={handleSalvar}>
              Salvar
            </button>
          ) : (
            <button
              className={styles.exportar}
              onClick={() => setEditMode(true)}
            >
              Editar
            </button>
          )}
        </div>

        <form className={styles.dadosForm} onSubmit={(e) => e.preventDefault()}>
          <div className={styles.inputRow}>{renderCampo("Nome", "nome")}</div>
          {renderCamposEspecificos()}
        </form>
      </section>
    </div>
  );
}

export default Formulario;
