import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import styles from "./Adicionar.module.css";
import { api } from "../../../services/api";
import BackButton from "../../layout/BackButton/BackButton";

function Adicionar() {
  const { tipo } = useParams();
  const [formData, setFormData] = useState({ tipo });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [modalType, setModalType] = useState(null);
  const [todasTurmas, setTodasTurmas] = useState([]);
  const [todosCursos, setTodosCursos] = useState([]);
  const [todasEscolas, setTodasEscolas] = useState([]);
  const [todasEmpresas, setTodasEmpresas] = useState([]);

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
    { value: "INT", label: "INT" }
  ];

  const contratOptions = [
    { value: "DETERMINADO", label: "DETERMINADO" },
    { value: "INDETERMINADO", label: "INDETERMINADO" },
  ];

  const funcaoOptions = [
    { value: "VIGILANTE", label: "VIGILANTE" },
    { value: "AUXILIAR_LIMPEZA", label: "AUXILIAR_LIMPEZA" },
    { value: "SEGURANCA", label: "SEGURANCA" },
    { value: "SERVICOS_GERAIS", label: "SERVICOS_GERAIS" },
    { value: "TECNICO_MANUTENCAO", label: "TECNICO_MANUTENCAO" },
    { value: "JARDINEIRO", label: "JARDINEIRO" },
    { value: "CANTINEIRO", label: "CANTINEIRO" },
    { value: "COZINHEIRO", label: "COZINHEIRO" },
    { value: "OUTRO", label: "OUTRO" },
  ];

  const traduzErro = (erro) => {
    if (!erro) return "Erro desconhecido.";
    if (erro.includes("Duplicate entry")) return "Registro duplicado.";
    if (erro.includes("Data truncated")) return "Formato de dado inválido.";
    if (erro.includes("Cannot add or update a child row"))
      return "Erro de relacionamento (chave estrangeira).";
    return erro;
  };

  useEffect(() => {
    const buscarDados = async () => {
      try {
        const turmasJson = await api.get(`/turmas`);
        setTodasTurmas(turmasJson.data || turmasJson || []); 

        const cursosJson = await api.get(`/cursos`);
        setTodosCursos(cursosJson.data || cursosJson || []);

        const empresasJson = await api.get(`/empresas`);
        setTodasEmpresas(empresasJson.data || empresasJson || []);

        const escolasJson = await api.get(`/escolas`);
        setTodasEscolas(escolasJson.data || escolasJson || []);

      } catch (error) {
        console.error("Erro ao buscar dados:", error);
        setMessage(`Erro ao carregar dados: ${error.message}`);
        setModalType("error");
      }
    };
    buscarDados();
  }, [tipo]);

  const handleInputChange = (campo, valor) => {
    setFormData((prev) => ({ ...prev, [campo]: valor }));
  };

  const formatDate = (date) => {
    if (!date) return null;
    return new Date(date).toISOString().split("T")[0];
  };

  const handleSalvar = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setMessage("");
    setModalType(null);

    let payload = Object.fromEntries(
      Object.entries(formData).map(([key, value]) => [
        key,
        value === "" ? null : value,
      ])
    );

    if (!payload.foto) {
      payload.foto = "foto_exemplo.png";
    }

    payload.data_nascimento = formatDate(payload.data_nascimento);
    payload.data_admissao = formatDate(payload.data_admissao);
    payload.data_saida = formatDate(payload.data_saida);
    payload.responsavel_data_nascimento = formatDate(
      payload.responsavel_data_nascimento
    );

    if (tipo === "TERCEIRIZADO") {
      payload.empresa_id = payload.empresa;
      delete payload.empresa;
    }

    try {
      await api.post("/pessoas", payload);

      setMessage(`${tipo} adicionado com sucesso!`);
      setModalType("success");
      setFormData({ tipo });

    } catch (err) {
      console.error("Erro ao salvar:", err);
      setMessage(traduzErro(err.message)); 
      setModalType("error");
    } finally {
      setLoading(false);
    }
  };


  const renderCampo = (label, campo, type = "text") => (
    <div className={styles.inputGroup}>
      <label>{label}</label>
      <input
        type={type}
        value={formData[campo] || ""}
        onChange={(e) => handleInputChange(campo, e.target.value)}
      />
    </div>
  );

  const renderDropdown = (label, campo, options, labelField = "nome") => (
    <div className={styles.inputGroup}>
      <label>{label}</label>
      <select
        value={formData[campo] || ""}
        onChange={(e) => handleInputChange(campo, e.target.value)}
      >
        <option value="">Selecione...</option>
        {options.map((opt) => (
          <option key={opt.id || opt.value} value={opt.id || opt.value}>
            {opt[labelField] || opt.label}
          </option>
        ))}
      </select>
    </div>
  );

  const renderCamposEspecificos = () => {
    switch (tipo) {
      case "ALUNO":
        return (
          <>
            <div className={styles.inputRow}>
              {renderCampo("RA", "ra")}
              {renderCampo("RM (Matrícula)", "rm")}
            </div>
            <div className={styles.inputRow}>
              {renderCampo("RG", "rg")}
              {renderCampo("CPF", "cpf")}
            </div>
            <div className={styles.inputRow}>
              {renderDropdown("Escola", "unidade_id", todasEscolas)}
              {renderDropdown("Curso", "curso_id", todosCursos)}
              {renderDropdown("Turma", "turma_id", todasTurmas)}
            </div>
            <div className={styles.inputRow}>
              {renderDropdown("Divisão", "divisao", divOptions, "label")}
              {renderDropdown("Status", "status", statusOptions, "label")}
            </div>
            <div className={styles.inputRow}>
              {renderCampo("Cartão Rfid", "cartao_rfid")}
              {renderCampo("Email Institucional", "email")}
              {renderCampo("Telefone", "telefone")}
            </div>
            <div className={styles.inputRow}>
              {renderCampo("Data de Nascimento", "data_nascimento", "date")}
            </div>
          </>
        );
      case "RESPONSAVEL":
        return (
          <>
            <div className={styles.inputRow}>
              {renderDropdown("Escola", "unidade_id", todasEscolas)}
              {renderCampo("Aluno ID", "aluno_id")}
            </div>
            <div className={styles.inputRow}>
              {renderCampo("CPF", "cpf")}
              {renderCampo("RG", "rg")}
            </div>
            <div className={styles.inputRow}>
              {renderCampo("Telefone", "telefone")}
              {renderCampo("Email", "email")}
            </div>
            <div className={styles.inputRow}>
              {renderCampo("Data de Nascimento", "data_nascimento", "date")}
            </div>
          </>
        );
      case "PROFESSOR":
        return (
          <>
            <div className={styles.inputRow}>
              {renderDropdown("Escola", "unidade_id", todasEscolas)}
              {renderCampo("Matrícula", "matricula")}
            </div>
            <div className={styles.inputRow}>
              {renderCampo("CPF", "cpf")}
              {renderCampo("RG", "rg")}
            </div>
            <div className={styles.inputRow}>
              {renderDropdown("Tipo de Contrato", "tipo_contrato", contratOptions, "label")}
              {renderCampo("Data de Admissão", "data_admissao", "date")}
              {renderCampo("Data de Saída", "data_saida", "date")}
            </div>
            <div className={styles.inputRow}>
              {renderCampo("Cartão Rfid", "cartao_rfid")}
              {renderCampo("Email", "email")}
              {renderCampo("Telefone", "telefone")}
            </div>
            <div className={styles.inputRow}>
              {renderCampo("Data de Nascimento", "data_nascimento", "date")}
            </div>
          </>
        );
      case "PROFADM":
        return (
          <>
            <div className={styles.inputRow}>
              {renderDropdown("Escola", "unidade_id", todasEscolas)}
              {renderCampo("Matrícula", "matricula")}
            </div>
            <div className={styles.inputRow}>
              {renderCampo("CPF", "cpf")}
              {renderCampo("RG", "rg")}
              {renderCampo("Cargo", "cargo")}
            </div>
            <div className={styles.inputRow}>
              {renderDropdown("Tipo de Contrato", "tipo_contrato", contratOptions, "label")}
              {renderCampo("Data de Admissão", "data_admissao", "date")}
              {renderCampo("Data de Saída", "data_saida", "date")}
            </div>
            <div className={styles.inputRow}>
              {renderCampo("Email", "email")}
              {renderCampo("Telefone", "telefone")}
            </div>
            <div className={styles.inputRow}>
              {renderCampo("Data de Nascimento", "data_nascimento", "date")}
            </div>
          </>
        );
      case "ADMINISTRADOR":
        return (
          <>
            <div className={styles.inputRow}>
              {renderDropdown("Escola", "unidade_id", todasEscolas)}
              {renderCampo("Matrícula", "matricula")}
              {tipo === "TERCEIRIZADO" && renderCampo("RG", "rg")}
            </div>
            <div className={styles.inputRow}>
              {renderCampo("CPF", "cpf")}
              {tipo === "TERCEIRIZADO"
                ? renderDropdown("Empresa", "empresa", todasEmpresas)
                : renderCampo("RG", "rg")}
              {tipo === "TERCEIRIZADO"
                ? renderDropdown("Função", "funcao", funcaoOptions, "label")
                : renderCampo("Cargo", "cargo")}
            </div>
            <div className={styles.inputRow}>
              {renderDropdown("Tipo de Contrato", "tipo_contrato", contratOptions, "label")}
              {renderCampo("Data de Admissão", "data_admissao", "date")}
              {renderCampo("Data de Saída", "data_saida", "date")}
            </div>
            <div className={styles.inputRow}>
              {renderCampo("Email", "email")}
              {renderCampo("Telefone", "telefone")}
            </div>
            <div className={styles.inputRow}>
              {renderCampo("Data de Nascimento", "data_nascimento", "date")}
            </div>
          </>
        );
      case "TERCEIRIZADO":
        return (
          <>
            <div className={styles.inputRow}>
              {renderDropdown("Escola", "unidade_id", todasEscolas)}
              {renderCampo("Matrícula", "matricula")}
              {tipo === "TERCEIRIZADO" && renderCampo("RG", "rg")}
            </div>
            <div className={styles.inputRow}>
              {renderCampo("CPF", "cpf")}
              {tipo === "TERCEIRIZADO"
                ? renderDropdown("Empresa", "empresa", todasEmpresas)
                : renderCampo("RG", "rg")}
              {tipo === "TERCEIRIZADO"
                ? renderDropdown("Função", "funcao", funcaoOptions, "label")
                : renderCampo("Cargo", "cargo")}
            </div>
            <div className={styles.inputRow}>
              {renderDropdown("Tipo de Contrato", "tipo_contrato", contratOptions, "label")}
              {renderCampo("Data de Admissão", "data_admissao", "date")}
              {renderCampo("Data de Saída", "data_saida", "date")}
            </div>
            <div className={styles.inputRow}>
              {renderCampo("Email", "email")}
              {renderCampo("Telefone", "telefone")}
            </div>
            <div className={styles.inputRow}>
              {renderCampo("Data de Nascimento", "data_nascimento", "date")}
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className={styles.cadastroContainer}>
      <BackButton fallback="/pessoas" />
      <section className={styles.dadosSection}>
        <div className={styles.header}>
          <h2>Adicionar {tipo}</h2>
          <button
            className={styles.exportar}
            onClick={handleSalvar}
            disabled={loading}
          >
            {loading ? "Salvando..." : "Salvar"}
          </button>
        </div>

        <form className={styles.dadosForm} onSubmit={handleSalvar}>
          <div className={styles.inputRow}>{renderCampo("Nome", "nome")}</div>
          {renderCamposEspecificos()}
        </form>
      </section>

      {modalType && (
        <div className={styles.modalOverlay}>
          <div
            className={`${styles.modalContent} ${
              modalType === "success" ? styles.success : styles.error
            }`}
          >
            <h3>{modalType === "success" ? "Sucesso" : "Erro"}</h3>
            <p>{message}</p>
            <button
              className={styles.closeButton}
              onClick={() => setModalType(null)}
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Adicionar;
