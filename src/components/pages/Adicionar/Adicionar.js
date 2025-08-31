import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import styles from "./Adicionar.module.css";

function Adicionar() {
  const { tipo } = useParams();
  const [formData, setFormData] = useState({ tipo });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [todasTurmas, setTodasTurmas] = useState([]);
  const [todosCursos, setTodosCursos] = useState([]);
  const [todasEscolas, setTodasEscolas] = useState([]);

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

  useEffect(() => {
    const buscarDados = async () => {
      try {
        if (tipo === 'ALUNO') {
          const turmasRes = await fetch(`http://localhost:3000/turmas`);
          setTodasTurmas(await turmasRes.json());

          const cursosRes = await fetch(`http://localhost:3000/cursos`);
          setTodosCursos(await cursosRes.json());

          const escolasRes = await fetch(`http://localhost:3000/escolas`);
          setTodasEscolas(await escolasRes.json());
        }
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
      }
    };
    buscarDados();
  }, [tipo]);

  const handleInputChange = (campo, valor) => {
    setFormData((prev) => ({ ...prev, [campo]: valor }));
  };

  const handleSalvar = async (e) => {
  if (e) e.preventDefault();
  setLoading(true);
  setMessage("");

  // Converte "" em null
  let payload = Object.fromEntries(
    Object.entries(formData).map(([key, value]) => [
      key,
      value === "" ? null : value,
    ])
  );

  // Se não houver foto, define foto_exemplo.png
  if (!payload.foto) {
    payload.foto = "foto_exemplo.png";
  }

  console.log("Payload final:", payload);

  try {
    const response = await fetch("http://localhost:3000/pessoas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erro detalhado:", errorText);
      throw new Error("Erro ao adicionar aluno.");
    }

    setMessage(`${tipo} adicionado com sucesso!`);
    setFormData({ tipo }); // limpa formulário
  } catch (err) {
    console.error("Erro ao salvar:", err);
    setMessage("Erro ao salvar aluno.");
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
              {renderCampo("Email Institucional", "email")}
              {renderCampo("Telefone", "telefone")}
            </div>
            <div className={styles.inputRow}>
              {renderCampo("Data de Nascimento", "data_nascimento", "date")}
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.subtitle}>Dados do Responsável</label>
            </div>
            <div className={styles.inputRow}>
              {renderCampo("Nome do Responsável", "responsavel_nome")}
              {renderCampo("RG", "responsavel_rg")}
              {renderCampo("CPF", "responsavel_cpf")}
            </div>
            <div className={styles.inputRow}>
              {renderCampo("Telefone", "responsavel_telefone")}
              {renderCampo("Email", "responsavel_email")}
              {renderCampo("Data de Nascimento", "responsavel_data_nascimento", "date")}
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
        <input className={styles.imageButton}
          type="file"
          accept="image/*"
          onChange={(e) => handleInputChange("foto", e.target.files[0]?.name)}
        />
      </aside>

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
        {message && <p className={styles.message}>{message}</p>}
      </section>
    </div>
  );
}

export default Adicionar;
