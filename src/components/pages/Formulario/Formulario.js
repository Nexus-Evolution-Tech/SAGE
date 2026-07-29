import { useParams } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import styles from "./Formulario.module.css";
import { api } from "../../../services/api";
import BackButton from "../../layout/BackButton/BackButton";
import HorarioFixoForm from "../../Relatorios/HorarioFixoForm";
import defaultUserImg from "../../../img/user.png";
import { createQRCodeDataUrl } from "../../../utils/qrCode";

function Formulario() {
  const { id } = useParams();
  const [pessoa, setPessoa] = useState(null);
  const [formData, setFormData] = useState({});
  const [fotoUrl, setFotoUrl] = useState(defaultUserImg);

  const [cursoNome, setCursoNome] = useState("");
  const [turmaNome, setTurmaNome] = useState("");
  const [turnoNome, setTurnoNome] = useState("");
  const [responsavel, setResponsavel] = useState(null);
  const [empresaNome, setEmpresaNome] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [qrCodeImageUrl, setQrCodeImageUrl] = useState("");

  const [showCamera, setShowCamera] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [novaFoto, setNovaFoto] = useState(null);
  const [cameraStream, setCameraStream] = useState(null);

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
    { value: "INT", label: "INT" },
  ];
  const periodoOptions = [
    { value: "MANHA", label: "Manhã" },
    { value: "TARDE", label: "Tarde" },
    { value: "NOITE", label: "Noite" },
    { value: "INTEGRAL", label: "Integral" },
  ];

  const fileInputRef = useRef();
  const videoRef = useRef();
  const canvasRef = useRef();

  const formatarTelefone = (tel) => {
    if (!tel) return "";
    const digits = String(tel).replace(/\D/g, "");
    if (digits.length <= 2) return digits;
    if (digits.length <= 6) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    }
    if (digits.length <= 10) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`.trim();
    }
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`.trim();
  };

  const formatarData = (data) => {
    if (!data) return "";
    const parsed = new Date(data);
    if (Number.isNaN(parsed.getTime())) return data;
    return parsed.toLocaleDateString("pt-BR");
  };

  const toDateInputValue = (data) => {
    if (!data) return "";
    const parsed = new Date(data);
    if (Number.isNaN(parsed.getTime())) return "";
    const tzOffset = parsed.getTimezoneOffset() * 60000;
    return new Date(parsed.getTime() - tzOffset).toISOString().split("T")[0];
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const pessoaData = await api.get(`/pessoas/${id}`);
        setPessoa(pessoaData);
        setFormData(pessoaData);

        const fotoData = await api.get(`/pessoas/url/${id}`);
        setFotoUrl(fotoData.url || defaultUserImg);

        if (pessoaData.tipo === "ALUNO") {
          const turmasData = await api.get(`/turmas`);
          setTodasTurmas(
            turmasData.data.map((t) => ({ value: t.id, label: t.nome })),
          );

          if (pessoaData.turma_id) {
            const turmaData = await api.get(`/turmas/${pessoaData.turma_id}`);
            const turmaInfo = Array.isArray(turmaData)
              ? turmaData[0]
              : turmaData;

            setTurmaNome(turmaInfo?.nome || "");
            setTurnoNome(turmaInfo?.turno || "");

            if (turmaInfo?.curso_id) {
              const cursoData = await api.get(`/cursos/${turmaInfo.curso_id}`);
              const curso = cursoData.find((c) => c.id === turmaInfo.curso_id);
              setCursoNome(curso?.nome || "");
            }
          }

          const respData = await api.get(
            `/pessoas/tipo/responsavel?aluno_id=${id}`,
          );
          setResponsavel(respData[0] || null);

          if (!pessoaData.qr_code) {
            try {
              const novaCarteirinha = await api.post(
                `/pessoas/gerar_qrcode/${id}`,
                {},
              );
              const qrValue =
                novaCarteirinha?.qr_code || novaCarteirinha?.data?.qr_code;
              if (qrValue) {
                setPessoa((prev) => ({ ...prev, qr_code: qrValue }));
                setFormData((prev) => ({ ...prev, qr_code: qrValue }));
                setQrCode(qrValue);
              }
            } catch (err) {
              console.error("Erro ao gerar carteirinha automaticamente:", err);
            }
          }

          const anoLetivo = new Date().getFullYear();
          setFormData((prev) => {
            const next = { ...prev };
            if (Object.prototype.hasOwnProperty.call(prev, "ano")) {
              next.ano = anoLetivo;
            }
            if (Object.prototype.hasOwnProperty.call(prev, "ano_letivo")) {
              next.ano_letivo = anoLetivo;
            }
            return next;
          });
        } else if (
          pessoaData.tipo === "TERCEIRIZADO" &&
          pessoaData.empresa_id
        ) {
          const empresaData = await api.get(
            `/empresas/${pessoaData.empresa_id}`,
          );
          setEmpresaNome(
            Array.isArray(empresaData)
              ? empresaData[0]?.nome
              : empresaData?.nome || "",
          );
        }
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
      }
    }

    fetchData();
  }, [id]);

  useEffect(
    () => () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    },
    [cameraStream],
  );

  useEffect(() => {
    let cancelled = false;
    const qrValue = pessoa?.qr_code || qrCode;

    setQrCodeImageUrl("");
    if (!qrValue) {
      return () => {
        cancelled = true;
      };
    }

    createQRCodeDataUrl(qrValue)
      .then((imageUrl) => {
        if (!cancelled) setQrCodeImageUrl(imageUrl);
      })
      .catch((error) => {
        if (!cancelled) {
          console.error("Erro ao gerar imagem do QR Code:", error);
          setQrCodeImageUrl("");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [pessoa?.qr_code, qrCode]);

  const handleInputChange = (campo, valor) => {
    let proximoValor = valor;
    if (campo.toLowerCase().includes("telefone")) {
      proximoValor = formatarTelefone(valor);
    }
    setFormData((prev) => ({ ...prev, [campo]: proximoValor }));
  };

  const handleSelecionarArquivo = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNovaFoto(file);
      setFotoUrl(URL.createObjectURL(file));
    }
  };

  const iniciarCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraStream(stream);
      setShowCamera(true);
    } catch (error) {
      console.error("Erro ao iniciar câmera:", error);
    }
  };

  // --- FUNÇÃO CORRIGIDA PARA GERAR E SALVAR ---
  const handleGerarESalvar = async () => {
    try {
      // 1. Gera o QR Code
      const updatedPessoa = await api.post(`/pessoas/gerar_qrcode/${id}`, {});
      const qrValue = updatedPessoa?.qr_code || updatedPessoa?.data?.qr_code;

      if (!qrValue) throw new Error("Erro ao gerar QR Code");

      // Atualiza o estado local imediatamente
      const novosDados = { ...formData, qr_code: qrValue };
      setPessoa((prev) => ({ ...prev, qr_code: qrValue }));
      setFormData(novosDados);
      setQrCode(qrValue);

      // Exibe modal de sucesso do QR code (opcional, já que vamos salvar)
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 1500);

      // 2. Chama a função de salvar passando os dados atualizados (ou usando o estado se ele tivesse atualizado, mas é mais seguro passar direto)
      await salvarDados(novosDados);
    } catch (error) {
      console.error("Erro ao gerar QR Code e Salvar:", error);
    }
  };

  const handleDownloadQRCode = () => {
    if (!qrCodeImageUrl) return;

    const link = document.createElement("a");
    link.href = qrCodeImageUrl;
    link.download = `carteirinha-${pessoa?.id || "aluno"}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const tirarFoto = () => {
    if (!canvasRef.current || !videoRef.current) return;
    const context = canvasRef.current.getContext("2d");
    context.drawImage(
      videoRef.current,
      0,
      0,
      canvasRef.current.width,
      canvasRef.current.height,
    );

    canvasRef.current.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      setFotoUrl(url);
      setNovaFoto(new File([blob], "foto.png", { type: blob.type }));
    }, "image/png");

    setShowCamera(false);
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
  };

  // Separei a lógica de salvar para poder reutilizar e receber dados opcionais
  const salvarDados = async (dadosParaSalvar = formData) => {
    try {
      await api.patch(`/pessoas/${id}`, dadosParaSalvar);

      if (novaFoto) {
        const formDataUpload = new FormData();
        formDataUpload.append("foto", novaFoto);

        await api.postFormData(`/pessoas/upload/${id}`, formDataUpload);

        const data = await api.get(`/pessoas/url/${id}`);
        setFotoUrl(data.url || defaultUserImg);
        setNovaFoto(null);
      }

      setEditMode(false);
      setPessoa(dadosParaSalvar); // Atualiza o objeto pessoa principal com os novos dados salvos
    } catch (error) {
      console.error("Erro ao atualizar pessoa:", error);
    }
  };

  // Função wrapper para o botão "Salvar" normal
  const handleSalvarClick = () => {
    salvarDados(formData);
  };

  if (!pessoa) return <p className={styles.loading}>Carregando dados...</p>;

  const breadcrumbLabel =
    pessoa?.tipo === "ALUNO" ? "Departamentos / Alunos" : "Departamentos";

  const renderCampo = (
    label,
    campo,
    valor,
    isReadOnly = false,
    type = "text",
  ) => {
    const isDateField = type === "date";
    const inputType = isDateField && !editMode ? "text" : type;

    const value = editMode
      ? isDateField
        ? toDateInputValue(formData[campo] || valor)
        : (formData[campo] ?? "")
      : (valor ?? formData[campo] ?? "");

    return (
      <div className={styles.inputGroup}>
        <label>{label}</label>
        <input
          type={inputType}
          value={value}
          readOnly={isReadOnly || !editMode}
          onChange={(e) => handleInputChange(campo, e.target.value)}
        />
      </div>
    );
  };

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
                formatarTelefone(pessoa?.telefone),
              )}
            </div>
            <div className={styles.inputRow}>
              {renderDropdown("Período", "turno", periodoOptions, turnoNome)}
              {renderCampo(
                "Data de Nascimento",
                "data_nascimento",
                formatarData(pessoa?.data_nascimento),
                false,
                "date",
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
                    true,
                  )}
                  {renderCampo(
                    "Email do Responsável",
                    "resp_email",
                    responsavel?.email,
                    true,
                  )}
                  {renderCampo(
                    "Telefone do Responsável",
                    "resp_telefone",
                    formatarTelefone(responsavel?.telefone),
                    true,
                  )}
                </div>
              </>
            )}
          </>
        );
      case "RESPONSAVEL":
        return (
          <>
            <div className={styles.inputRow}>
              {renderCampo("ID", "id")}
              {renderCampo("Tipo", "tipo")}
            </div>
            <div className={styles.inputRow}>
              {renderCampo(
                "Telefone",
                "telefone",
                formatarTelefone(pessoa?.telefone),
              )}
              {renderCampo("Email", "email")}
              {renderCampo(
                "Data de Nascimento",
                "data_nascimento",
                formatarData(pessoa?.data_nascimento),
                false,
                "date",
              )}
            </div>
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
                "data_admissao",
                formatarData(pessoa?.data_admissao),
                false,
                "date",
              )}
              {renderCampo(
                "Data de Saída",
                "data_saida",
                formatarData(pessoa?.data_saida),
                false,
                "date",
              )}
            </div>
            <div className={styles.inputRow}>
              {renderCampo("Cartão Rfid", "cartao_rfid")}
              {renderCampo("Email", "email")}
              {renderCampo(
                "Data de Nascimento",
                "data_nascimento",
                formatarData(pessoa?.data_nascimento),
                false,
                "date",
              )}
            </div>
            <HorarioFixoForm pessoaId={id} tipo="TERCEIRIZADO" />
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
                formatarTelefone(pessoa?.telefone),
              )}
            </div>
            <div className={styles.inputRow}>
              {renderCampo("Tipo de Contrato", "tipo_contrato")}
              {renderCampo(
                "Data de Admissão",
                "data_admissao",
                formatarData(pessoa?.data_admissao),
                false,
                "date",
              )}
              {renderCampo(
                "Data de Saída",
                "data_saida",
                formatarData(pessoa?.data_saida),
                false,
                "date",
              )}
            </div>
            <div className={styles.inputRow}>
              {renderCampo("Email", "email")}
              {renderCampo(
                "Data de Nascimento",
                "data_nascimento",
                formatarData(pessoa?.data_nascimento),
                false,
                "date",
              )}
              {renderCampo("Cartão Rfid", "cartao_rfid")}
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
                formatarTelefone(pessoa?.telefone),
              )}
            </div>
            <div className={styles.inputRow}>
              {renderCampo("Tipo de Contrato", "tipo_contrato")}
              {renderCampo(
                "Data de Admissão",
                "data_admissao",
                formatarData(pessoa?.data_admissao),
                false,
                "date",
              )}
              {renderCampo(
                "Data de Saída",
                "data_saida",
                formatarData(pessoa?.data_saida),
                false,
                "date",
              )}
            </div>
            <div className={styles.inputRow}>
              {renderCampo(
                "Telefone",
                "telefone",
                formatarTelefone(pessoa?.telefone),
              )}
              {renderCampo("Email", "email")}
              {renderCampo(
                "Data de Nascimento",
                "data_nascimento",
                formatarData(pessoa?.data_nascimento),
                false,
                "date",
              )}
            </div>
            <div className={styles.inputRow}>
              {renderCampo("Cargo", "cargo")}
              {renderCampo("Cartão Rfid", "cartao_rfid")}
            </div>
            <HorarioFixoForm pessoaId={id} tipo="PROFADM" />
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
                formatarTelefone(pessoa?.telefone),
              )}
            </div>
            <div className={styles.inputRow}>
              {renderCampo("Tipo de Contrato", "tipo_contrato")}
              {renderCampo(
                "Data de Admissão",
                "data_admissao",
                formatarData(pessoa?.data_admissao),
                false,
                "date",
              )}
              {renderCampo(
                "Data de Saída",
                "data_saida",
                formatarData(pessoa?.data_saida),
                false,
                "date",
              )}
            </div>
            <div className={styles.inputRow}>
              {renderCampo("Email", "email")}
              {renderCampo(
                "Data de Nascimento",
                "data_nascimento",
                formatarData(pessoa?.data_nascimento),
                false,
                "date",
              )}
            </div>
            <div className={styles.inputRow}>
              {renderCampo("Cargo", "cargo")}
              {renderCampo("Cartão Rfid", "cartao_rfid")}
            </div>
            <HorarioFixoForm pessoaId={id} tipo="ADMINISTRADOR" />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className={styles.cadastroContainer}>
      <div className={styles.pageHeader}>
        <BackButton fallback="/pessoas" />
        <div className={styles.pageTitles}>
          <span className={styles.pageBreadcrumb}>{breadcrumbLabel}</span>
          <h2 className={styles.pageMainTitle}>{pessoa?.nome || "Aluno"}</h2>
        </div>
      </div>
      <aside className={styles.fotoSection}>
        <h3 className={styles.subtitle}>Foto</h3>
        <img
          src={fotoUrl}
          alt="Foto de perfil"
          className={styles.fotoPreview}
          onError={(e) => { e.target.onerror = null; e.target.src = defaultUserImg; }}
        />
        {(editMode || fotoUrl === defaultUserImg) && (
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
        {qrCodeImageUrl ? (
          <img
            src={qrCodeImageUrl}
            alt="QR Code"
            className={styles.fotoPreview}
          />
        ) : (
          <p className={styles.loading}>QR Code indisponível.</p>
        )}

        {(editMode || fotoUrl === defaultUserImg) && (
          <div className={styles.qrButtonContainer}>
            {/* CORREÇÃO AQUI: Botão chama a nova função combinada */}
            <button className={styles.qrButton} onClick={handleGerarESalvar}>
              Gerar QR Code
            </button>
          </div>
        )}

        {qrCodeImageUrl && (
          <button className={styles.qrButton} onClick={handleDownloadQRCode}>
            Baixar QR Code
          </button>
        )}
      </aside>

      <section className={styles.dadosSection}>
        <div className={styles.header}>
          <h2>Informações</h2>
          {editMode ? (
            <button className={styles.actionButton} onClick={handleSalvarClick}>
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
            <p>QR Code gerado e salvo com sucesso!</p>
            <button onClick={() => setShowSuccessModal(false)}>Fechar</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Formulario;
