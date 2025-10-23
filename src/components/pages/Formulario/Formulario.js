import { useParams } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import styles from "./Formulario.module.css";

function Formulario() {
  const { id } = useParams();
  const [pessoa, setPessoa] = useState(null);
  const [formData, setFormData] = useState({});
  const [fotoUrl, setFotoUrl] = useState("foto_exemplo.png");

  const [cursoNome, setCursoNome] = useState("");
  const [turmaNome, setTurmaNome] = useState("");
  const [turnoNome, setTurnoNome] = useState("");
  const [responsavel, setResponsavel] = useState(null);
  const [empresaNome, setEmpresaNome] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [qrCode, setQrCode] = useState("");

  const [showCamera, setShowCamera] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [novaFoto, setNovaFoto] = useState(null);

  const [todasTurmas, setTodasTurmas] = useState([]);
  const statusOptions = [
    { value: "CANCELADO", label: "CANCELADO" },
    { value: "CONCLUIDO", label: "CONCLUIDO" },
    { value: "DESISTENTE", label: "DESISTENTE" },
    { value: "EM CURSO", label: "EM CURSO" },
    { value: "RETIDO", label: "RETIDO" },
    { value: "TRANCADO", label: "TRANCADO" },
    { value: "TRANSFERENCIA EXPEDIDA", label: "TRANSFERENCIA EXPEDIDA" },
    { value: "SUSPENSO", label: "SUSPENSO" },
  ];
  const divOptions = [
    { value: "DIV A", label: "DIV A" },
    { value: "DIV B", label: "DIV B" },
  ];

  const fileInputRef = useRef();
  const videoRef = useRef();
  const canvasRef = useRef();

  const formatarTelefone = (tel) => {
    if (!tel) return "";
    const numeroLimpo = tel.replace(/\D/g, "");
    if (numeroLimpo.length === 11) {
      return `(${numeroLimpo.substring(0, 2)}) ${numeroLimpo.substring(
        2,
        7
      )}-${numeroLimpo.substring(7)}`;
    }
    return tel;
  };

  const formatarData = (data) => {
    if (!data) return "";
    const dataLimpa = data.substring(0, 10);
    const [ano, mes, dia] = dataLimpa.split("-");
    return `${dia}/${mes}/${ano}`;
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const pessoaRes = await fetch(`http://localhost:3000/pessoas/${id}`);
        const pessoaData = await pessoaRes.json();
        setPessoa(pessoaData);
        setFormData(pessoaData);

        const fotoRes = await fetch(`http://localhost:3000/pessoas/url/${id}`);
        const fotoData = await fotoRes.json();
        setFotoUrl(fotoData.url || "foto_exemplo.png");

        if (pessoaData.tipo === "ALUNO") {
          const turmasRes = await fetch(`http://localhost:3000/turmas`);
          const turmasData = await turmasRes.json();
          setTodasTurmas(
            turmasData.data.map((t) => ({ value: t.id, label: t.nome }))
          );

          if (pessoaData.turma_id) {
            const turmaRes = await fetch(
              `http://localhost:3000/turmas/${pessoaData.turma_id}`
            );
            const turmaData = await turmaRes.json();
            const turmaInfo = Array.isArray(turmaData)
              ? turmaData[0]
              : turmaData;

            setTurmaNome(turmaInfo?.nome || "");
            setTurnoNome(turmaInfo?.turno || "");

            if (turmaInfo?.curso_id) {
              const cursoRes = await fetch(
                `http://localhost:3000/cursos/${turmaInfo.curso_id}`
              );
              const cursoData = await cursoRes.json();

              const curso = cursoData.find(
                (c) => c.id === turmaInfo.curso_id
              );

              setCursoNome(curso?.nome || "");
            }
          }

          const respRes = await fetch(
            `http://localhost:3000/pessoas/tipo/responsavel?aluno_id=${id}`
          );
          const respData = await respRes.json();
          setResponsavel(respData[0] || null);
        } else if (
          pessoaData.tipo === "TERCEIRIZADO" &&
          pessoaData.empresa_id
        ) {
          const empresaRes = await fetch(
            `http://localhost:3000/empresas/${pessoaData.empresa_id}`
          );
          const empresaData = await empresaRes.json();
          setEmpresaNome(
            Array.isArray(empresaData)
              ? empresaData[0]?.nome
              : empresaData?.nome || ""
          );
        }
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
      }
    }

    fetchData();
  }, [id]);

  const handleInputChange = (campo, valor) => {
    setFormData((prev) => ({ ...prev, [campo]: valor }));
  };

  const handleUpload = async (file) => {
    if (!file) return;
    const formDataUpload = new FormData();
    formDataUpload.append("foto", file);

    try {
      await fetch(`http://localhost:3000/pessoas/upload/${id}`, {
        method: "POST",
        body: formDataUpload,
      });

      const res = await fetch(`http://localhost:3000/pessoas/url/${id}`);
      const data = await res.json();
      setFotoUrl(data.url || "foto_exemplo.png");
      console.log("Foto atualizada com sucesso!");
    } catch (error) {
      console.error("Erro ao enviar a foto:", error);
    }
  };

  const handleSelecionarArquivo = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNovaFoto(file);
      setFotoUrl(URL.createObjectURL(file));
    }
  };

  const iniciarCamera = async () => {
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Erro ao acessar a câmera:", error);
    }
  };

  const handleGerarQRCode = async () => {
    try {
      const response = await fetch(
        `http://localhost:3000/pessoas/gerar_qrcode/${id}`,
        {
          method: "POST",
        }
      );

      if (!response.ok) throw new Error("Erro ao gerar QR Code");

      const updatedPessoa = await response.json();

      setPessoa((prev) => ({ ...prev, qr_code: updatedPessoa.qr_code }));
      setQrCode(updatedPessoa.qr_code);

      setShowSuccessModal(true);

      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error("Erro ao gerar QR Code:", error);
    }
  };

  const handleDownloadQRCode = () => {
    const link = document.createElement("a");
    link.href = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${pessoa?.qr_code}`;
    link.download = "qrcode.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const tirarFoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth || 300;
    canvas.height = video.videoHeight || 300;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (blob) handleUpload(blob);
    }, "image/jpeg");

    if (video.srcObject) {
      video.srcObject.getTracks().forEach((track) => track.stop());
    }
    setShowCamera(false);
  };

  const handleSalvar = async () => {
    try {
      await fetch(`http://localhost:3000/pessoas/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (novaFoto) {
        const formDataUpload = new FormData();
        formDataUpload.append("foto", novaFoto);

        await fetch(`http://localhost:3000/pessoas/upload/${id}`, {
          method: "POST",
          body: formDataUpload,
        });

        const res = await fetch(`http://localhost:3000/pessoas/url/${id}`);
        const data = await res.json();
        setFotoUrl(data.url || "foto_exemplo.png");
        setNovaFoto(null);
      }

      console.log("Pessoa atualizada com sucesso!");
      setEditMode(false);
      setPessoa(formData);
    } catch (error) {
      console.error("Erro ao atualizar pessoa:", error);
    }
  };

  if (!pessoa) return <p className={styles.loading}>Carregando dados...</p>;

  const renderCampo = (label, campo, valor, isReadOnly = false) => (
    <div className={styles.inputGroup}>
      <label>{label}</label>
      <input
        type="text"
        value={valor || formData[campo] || ""}
        readOnly={isReadOnly || !editMode || valor !== undefined}
        onChange={(e) => handleInputChange(campo, e.target.value)}
      />
    </div>
  );

  const renderDropdown = (label, campo, options, displayValue) => {
    const currentDisplayValue = displayValue || formData[campo] || "";
    const selectedOption = options.find((opt) => opt.value === formData[campo]);
    const displayLabel = selectedOption
      ? selectedOption.label
      : currentDisplayValue;

    return (
      <div className={styles.inputGroup}>
        <label>{label}</label>
        {editMode ? (
          <select
            value={formData[campo] || ""}
            onChange={(e) => handleInputChange(campo, e.target.value)}
          >
            {options.map((option, index) => (
              <option key={index} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : (
          <input type="text" value={displayLabel} readOnly />
        )}
      </div>
    );
  };

  const renderCamposEspecificos = () => {
    const tipo = pessoa.tipo;
    switch (tipo) {
      case "ALUNO":
        return (
          <>
            <div className={styles.inputRow}>
              {renderCampo("ID", "id", null, true)}
              {renderCampo("Matrícula", "rm", null, true)}
              {renderDropdown("Status", "status", statusOptions)}
            </div>
            <div className={styles.inputRow}>
              {renderCampo("Curso", "curso", cursoNome, true)}
              {renderDropdown("Turma", "turma_id", todasTurmas, turmaNome)}
              {renderDropdown("Divisão", "divisao", divOptions)}
            </div>
            <div className={styles.inputRow}>
              {renderCampo("Cartão Rfid", "cartao_rfid")}
              {renderCampo("Email Institucional", "email")}
              {renderCampo(
                "Telefone",
                "telefone",
                formatarTelefone(pessoa?.telefone)
              )}
            </div>
            <div className={styles.inputRow}>
              {renderCampo("Período", "turno", turnoNome)}
              {renderCampo(
                "Data de Nascimento",
                "data_nascimento",
                formatarData(pessoa?.data_nascimento)
              )}
            </div>

            {responsavel && (
              <>
                <h3 className={styles.subtitle}>Responsável</h3>
                <div className={styles.inputRow}>
                  {renderCampo(
                    "Nome do Responsável",
                    "resp_nome",
                    responsavel?.nome,
                    true
                  )}
                  {renderCampo(
                    "Email do Responsável",
                    "resp_email",
                    responsavel?.email,
                    true
                  )}
                  {renderCampo(
                    "Telefone do Responsável",
                    "resp_telefone",
                    formatarTelefone(responsavel?.telefone),
                    true
                  )}
                </div>
              </>
            )}
          </>
        );
      case "TERCEIRIZADO":
        return (
          <>
            <div className={styles.inputRow}>
              {renderCampo("ID", "id")}
              {renderCampo("Tipo", "tipo")}
              {renderCampo("Empresa", "empresa", empresaNome)}
            </div>
            <div className={styles.inputRow}>
              {renderCampo("Tipo de Contrato", "tipo_contrato")}
              {renderCampo(
                "Data de Admissão",
                "data_saida",
                formatarData(pessoa?.data_admissao)
              )}
              {renderCampo(
                "Data de Saída",
                "data_saida",
                formatarData(pessoa?.data_saida)
              )}
            </div>
            <div className={styles.inputRow}>
              {renderCampo(
                "Telefone",
                "telefone",
                formatarTelefone(pessoa?.telefone)
              )}
              {renderCampo("Email", "email")}
              {renderCampo(
                "Data de Nascimento",
                "data_nascimento",
                formatarData(pessoa?.data_nascimento)
              )}
            </div>
          </>
        );
      case "PROFESSOR":
        return (
          <>
            <div className={styles.inputRow}>
              {renderCampo("ID", "id")}
              {renderCampo("Tipo", "tipo")}
              {renderCampo(
                "Telefone",
                "telefone",
                formatarTelefone(pessoa?.telefone)
              )}
            </div>
            <div className={styles.inputRow}>
              {renderCampo("Tipo de Contrato", "tipo_contrato")}
              {renderCampo(
                "Data de Admissão",
                "data_admissao",
                formatarData(pessoa?.data_admissao)
              )}
              {renderCampo(
                "Data de Saída",
                "data_saida",
                formatarData(pessoa?.data_saida)
              )}
            </div>
            <div className={styles.inputRow}>
              {renderCampo(
                "Telefone",
                "telefone",
                formatarTelefone(pessoa?.telefone)
              )}
              {renderCampo("Email", "email")}
              {renderCampo(
                "Data de Nascimento",
                "data_nascimento",
                formatarData(pessoa?.data_nascimento)
              )}
            </div>
          </>
        );
      case "PROFADM":
        return (
          <>
            <div className={styles.inputRow}>
              {renderCampo("ID", "id")}
              {renderCampo("Tipo", "tipo")}
              {renderCampo(
                "Telefone",
                "telefone",
                formatarTelefone(pessoa?.telefone)
              )}
            </div>
            <div className={styles.inputRow}>
              {renderCampo("Tipo de Contrato", "tipo_contrato")}
              {renderCampo(
                "Data de Admissão",
                "data_admissao",
                formatarData(pessoa?.data_admissao)
              )}
              {renderCampo(
                "Data de Saída",
                "data_saida",
                formatarData(pessoa?.data_saida)
              )}
            </div>
            <div className={styles.inputRow}>
              {renderCampo(
                "Telefone",
                "telefone",
                formatarTelefone(pessoa?.telefone)
              )}
              {renderCampo("Email", "email")}
              {renderCampo(
                "Data de Nascimento",
                "data_nascimento",
                formatarData(pessoa?.data_nascimento)
              )}
            </div>
            <div className={styles.inputRow}>
              {renderCampo("Cargo", "cargo")}
            </div>
          </>
        );
      case "ADMINISTRADOR":
        return (
          <>
            <div className={styles.inputRow}>
              {renderCampo("ID", "id")}
              {renderCampo("Tipo", "tipo")}
              {renderCampo(
                "Telefone",
                "telefone",
                formatarTelefone(pessoa?.telefone)
              )}
            </div>
            <div className={styles.inputRow}>
              {renderCampo("Tipo de Contrato", "tipo_contrato")}
              {renderCampo(
                "Data de Admissão",
                "data_saida",
                formatarData(pessoa?.data_admissao)
              )}
              {renderCampo(
                "Data de Saída",
                "data_saida",
                formatarData(pessoa?.data_saida)
              )}
            </div>
            <div className={styles.inputRow}>
              
              {renderCampo("Email", "email")}
              {renderCampo(
                "Data de Nascimento",
                "data_nascimento",
                formatarData(pessoa?.data_nascimento)
              )}
            </div>
            <div className={styles.inputRow}>
              {renderCampo("Cargo", "cargo")}
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
        <img
          src={fotoUrl}
          alt="Foto de perfil"
          className={styles.fotoPreview}
        />
        {(editMode || fotoUrl === "foto_exemplo.png") && (
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
        <h3 className={styles.subtitle}>QR Code</h3>
        <img
          src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${pessoa?.qr_code}`}
          alt="QR Code"
          className={styles.fotoPreview}
        />

        <button className={styles.qrButton} onClick={handleGerarQRCode}>
          Gerar QR Code
        </button>

        {pessoa?.qr_code && (
          <button className={styles.qrButton} onClick={handleDownloadQRCode}>
            Baixar QR Code
          </button>
        )}
      </aside>

      <section className={styles.dadosSection}>
        <div className={styles.header}>
          <h2>Informações</h2>
          <button className={styles.actionButton}>Exportar</button>
          {editMode ? (
            <button className={styles.actionButton} onClick={handleSalvar}>
              <p className={styles.textBackground}>Salvar</p>
            </button>
          ) : (
            <button
              className={styles.actionButton}
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

      {showSuccessModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <p>QR Code gerado com sucesso!</p>
            <button onClick={() => setShowSuccessModal(false)}>Fechar</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Formulario;
