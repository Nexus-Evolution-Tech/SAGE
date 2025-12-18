import React, { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faSearch, faTrash, faEdit } from "@fortawesome/free-solid-svg-icons";
import styles from "./Aulas.module.css";
import BackButton from "../../layout/BackButton/BackButton";
import {
  api,
  listarAulas,
  criarAula,
  atualizarAula,
  deletarAula,
} from "../../../services/api";

function Aulas() {
  const [aulas, setAulas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deletingMateriaId, setDeletingMateriaId] = useState(null);
  const [editing, setEditing] = useState(null);
  const [professores, setProfessores] = useState([]);
  const [salas, setSalas] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [form, setForm] = useState({
    professorId: "",
    materiaId: "",
    salaPadraoId: "",
    observacao: "",
  });

  const placeholder = useMemo(() => aulas.length === 0 && !loading, [aulas, loading]);

  const loadAulas = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listarAulas(search);
      const list = data?.data || data || [];
      setAulas(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err.message || "Falha ao carregar aulas.");
    } finally {
      setLoading(false);
    }
  };

  const loadProfessores = async () => {
    try {
      const res = await api.get("/pessoas/tipo/PROFESSOR");
      const list = res?.data || res || [];
      setProfessores(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Erro ao carregar professores", err);
    }
  };

  const loadSalas = async () => {
    try {
      const res = await api.get("/salas");
      const list = res?.data || res || [];
      setSalas(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Erro ao carregar salas", err);
    }
  };

  const loadMaterias = async () => {
    try {
      const res = await api.get("/materias");
      const list = res?.data || res || [];
      setMaterias(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Erro ao carregar matérias", err);
    }
  };

  useEffect(() => {
    loadAulas();
    loadProfessores();
    loadSalas();
    loadMaterias();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const openModal = (aula = null) => {
    setEditing(aula);
    setForm({
      professorId: aula?.professorId || aula?.professor_id || "",
      materiaId: aula?.materiaId || aula?.materia_id || "",
      salaPadraoId: aula?.salaPadraoId || aula?.sala_padrao_id || "",
      observacao: aula?.observacao || "",
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setSaving(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      // Gerar nome automaticamente baseado em matéria e professor
      const professor = professores.find(p => p.id === Number(form.professorId));
      const materia = materias.find(m => m.id === Number(form.materiaId));
      const nomeProfessor = professor?.nome?.split(" ")[0] || "Prof";
      const nomeMateria = materia?.nome || "Matéria";
      const nomeAula = `${nomeMateria} - ${nomeProfessor}`;

      const payload = {
        nome: nomeAula,
        professorId: form.professorId || null,
        materiaId: form.materiaId || null,
        salaPadraoId: form.salaPadraoId || null,
        observacao: form.observacao || "",
      };

      console.log("[Aulas] Salvando aula:", JSON.stringify(payload, null, 2));

      if (editing?.id) {
        const resultado = await atualizarAula(editing.id, payload);
        console.log("[Aulas] Aula atualizada:", resultado);
      } else {
        const resultado = await criarAula(payload);
        console.log("[Aulas] Aula criada:", resultado);
      }

      await loadAulas();
      closeModal();
    } catch (err) {
      console.error("[Aulas] Erro ao salvar:", err);
      setError(err.message || "Falha ao salvar aula.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMateria = async (id) => {
    if (!id) return;
    const confirmed = window.confirm("Apagar esta matéria? As aulas que usam esta matéria precisarão ser atualizadas.");
    if (!confirmed) return;

    setDeletingMateriaId(id);
    try {
      await api.delete(`/materias/${id}`);
      await loadMaterias();

      setForm((prev) =>
        String(prev.materiaId) === String(id) ? { ...prev, materiaId: "" } : prev
      );
    } catch (err) {
      console.error("[Aulas] Erro ao apagar matéria:", err);
      alert("Erro ao apagar matéria: " + (err.message || err));
    } finally {
      setDeletingMateriaId(null);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Apagar esta aula? Os horários que usarem esta aula ficarão vazios."
    );
    if (!confirmed) return;

    setError(null);
    setDeletingId(id);
    try {
      console.log("[Aulas] Tentando detach aula:", id);
      try {
        const res = await deletarAula(id, "detach");
        console.log("[Aulas] Detach OK:", res);
      } catch (err) {
        console.warn("[Aulas] Detach falhou, tentando deleção total:", err);
        const res2 = await deletarAula(id);
        console.log("[Aulas] Delete total OK:", res2);
      }
      await loadAulas();
    } catch (err) {
      console.error("[Aulas] Erro ao apagar aula:", err);
      setError(err.message || "Falha ao apagar aula.");
    }
    finally {
      setDeletingId(null);
    }
  };

  const renderRows = () => {
    if (loading) {
      return (
        <tr>
          <td colSpan="5" className={styles.center}>Carregando...</td>
        </tr>
      );
    }

    if (placeholder) {
      return (
        <tr>
          <td colSpan="5" className={styles.center}>Nenhuma aula cadastrada.</td>
        </tr>
      );
    }

    return aulas.map((aula) => (
      <tr key={aula.id}>
        <td>{aula.nome}</td>
        <td>{aula.professor?.nome || aula.professorNome || aula.professorId || "-"}</td>
        <td>{aula.salaPadrao?.nome || aula.salaPadraoId || aula.sala_padrao_id || "-"}</td>
        <td>{aula.observacao || "-"}</td>
        <td className={styles.actions}>
          <button
            type="button"
            className={styles.iconBtn}
            onClick={() => openModal(aula)}
            title="Editar"
          >
            <FontAwesomeIcon icon={faEdit} />
          </button>
          <button
            type="button"
            className={`${styles.iconBtn} ${styles.danger}`}
            onClick={() => handleDelete(aula.id)}
            disabled={deletingId === aula.id}
            title="Apagar"
          >
            <FontAwesomeIcon icon={faTrash} />
          </button>
        </td>
      </tr>
    ));
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <BackButton fallback="/horarios" />
        <h1 className={styles.title}>Catálogo de Aulas</h1>
      </div>
      <div className={styles.header}>
        <div className={styles.headerActions}>
          <div className={styles.searchBox}>
            <FontAwesomeIcon icon={faSearch} className={styles.searchIcon} />
            <input
              type="search"
              placeholder="Buscar por nome"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className={styles.primaryBtn} onClick={() => openModal()}>
            <FontAwesomeIcon icon={faPlus} /> Nova aula
          </button>
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Professor</th>
              <th>Sala padrão</th>
              <th>Observação</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>{renderRows()}</tbody>
        </table>
      </div>

      {modalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>{editing ? "Editar aula" : "Nova aula"}</h2>
              <button className={styles.closeBtn} onClick={closeModal}>×</button>
            </div>
            <form className={styles.form} onSubmit={handleSave}>
              <label>
                Matéria *
                <div className={styles.fieldWithAction}>
                  <select
                    name="materiaId"
                    value={form.materiaId}
                    onChange={handleChange}
                    required
                    className={styles.selectField}
                  >
                    <option value="">Selecione uma matéria</option>
                    {materias.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nome}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className={styles.addNewBtn}
                    onClick={async () => {
                      const novaMateria = prompt("Digite o nome da nova matéria:");
                      if (novaMateria?.trim()) {
                        try {
                          console.log("[Aulas] Criando matéria:", novaMateria);
                          const resultado = await api.post("/materias", { nome: novaMateria.trim() });
                          console.log("[Aulas] Matéria criada:", resultado);
                          
                          await loadMaterias();
                          
                          // Selecionar automaticamente a matéria recém-criada
                          const materiaId = resultado?.id || resultado?.data?.id;
                          if (materiaId) {
                            setForm(prev => ({ ...prev, materiaId: String(materiaId) }));
                          }
                          
                          alert("Matéria criada com sucesso!");
                        } catch (err) {
                          console.error("[Aulas] Erro ao criar matéria:", err);
                          alert("Erro ao criar matéria: " + (err.message || err));
                        }
                      }
                    }}
                  >
                    + Nova
                  </button>
                  <button
                    type="button"
                    className={styles.deleteMateriaBtn}
                    onClick={() => handleDeleteMateria(form.materiaId)}
                    disabled={!form.materiaId || deletingMateriaId === form.materiaId}
                    title="Apagar matéria selecionada"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
              </label>
              <label>
                Professor *
                <select
                  name="professorId"
                  value={form.professorId}
                  onChange={handleChange}
                  required
                  className={styles.selectField}
                >
                  <option value="">Selecione um professor</option>
                  {professores.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome}
                    </option>
                  ))}
                </select>
              </label>
              
              <div style={{ 
                padding: "10px 12px", 
                background: "#f0f8ff", 
                borderRadius: "4px", 
                border: "1px solid #b3d9ff",
                marginBottom: "1rem"
              }}>
                <small style={{ color: "#0066cc", fontSize: "0.88rem", lineHeight: "1.4" }}>
                  💡 <strong>Dica:</strong> Esta aula ficará disponível no catálogo. As turmas serão associadas automaticamente quando você adicionar esta aula na grade de horários de cada turma.
                </small>
              </div>

              <label>
                Sala padrão (opcional)
                <select
                  name="salaPadraoId"
                  value={form.salaPadraoId}
                  onChange={handleChange}
                  className={styles.selectField}
                >
                  <option value="">Selecione uma sala</option>
                  {salas.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nome || s.numero || `Sala ${s.id}`}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Observação (opcional)
                <textarea
                  name="observacao"
                  value={form.observacao}
                  onChange={handleChange}
                  rows={3}
                />
              </label>
              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={styles.primaryBtn}
                  disabled={saving}
                >
                  {saving ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Aulas;
