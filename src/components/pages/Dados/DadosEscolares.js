import React, { useState, useEffect, useCallback } from "react";
import { api } from "../../../services/api"; // Verifique se este caminho está correto
import styles from "./DadosEscolares.module.css";
import { FaPlus, FaTrash, FaPen } from "react-icons/fa";

const DadosEscolares = () => {
  // --- Estados de Dados ---
  const [escolas, setEscolas] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [turmas, setTurmas] = useState([]);
  const [salas, setSalas] = useState([]);

  // --- Estados de Seleção (Cascata) ---
  const [selectedEscolaId, setSelectedEscolaId] = useState("");
  const [selectedCursoId, setSelectedCursoId] = useState("");
  const [selectedTurmaId, setSelectedTurmaId] = useState("");
  const [selectedSalaId, setSelectedSalaId] = useState("");

  // --- Estados de Modal ---
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState(""); // 'escola', 'curso', 'turma', 'sala'
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});

  // --- Carregamento Inicial ---
  const fetchData = useCallback(async () => {
    try {
      const [resEscolas, resCursos, resTurmas, resSalas] = await Promise.all([
        api.get("/escolas?limit=1000"),
        api.get("/cursos?limit=1000"),
        api.get("/turmas?limit=1000"),
        api.get("/sala?limit=1000"),
      ]);

      const listaEscolas = resEscolas.data.data || resEscolas.data || [];
      const listaCursos = resCursos.data.data || resCursos.data || [];
      const listaTurmas = resTurmas.data.data || resTurmas.data || [];
      const listaSalas = resSalas.data.data || resSalas.data || [];

      setEscolas(listaEscolas);
      setCursos(listaCursos);
      setTurmas(listaTurmas);
      setSalas(listaSalas);

      // Selecionar a primeira escola por padrão se houver e nenhuma estiver selecionada
      setSelectedEscolaId((currentEscolaId) =>
        listaEscolas.length > 0 && !currentEscolaId
          ? listaEscolas[0].id
          : currentEscolaId
      );
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      alert("Erro ao carregar dados. Verifique o console.");
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Lógica de Filtros em Cascata ---

  // 1. Salas: Filtra pela escola selecionada (unidade_id)
  const filteredSalas = salas.filter((s) => {
    // DEBUG SILENCIOSO: Garante que os tipos (string/number) batam
    const escolaId = String(selectedEscolaId);
    const salaUnidadeId = String(s.unidade_id);
    return salaUnidadeId === escolaId;
  });

  // 2. Turmas: Filtra pela escola selecionada (unidade_id)
  const turmasDaEscola = turmas.filter(
    (t) => String(t.unidade_id) === String(selectedEscolaId)
  );

  // 3. Cursos: Exibir apenas cursos que possuem turmas nesta escola
  const cursosDaEscolaIds = [
    ...new Set(turmasDaEscola.map((t) => t.curso_id).filter((id) => id !== null)),
  ];
  
  const filteredCursos = cursos.filter((c) =>
    cursosDaEscolaIds.includes(c.id)
  );

  // 4. Turmas (Refinado): Filtra pelo Curso selecionado E Escola Selecionada
  const filteredTurmas = turmasDaEscola.filter(
    (t) => !selectedCursoId || String(t.curso_id) === String(selectedCursoId)
  );

  // --- CRUD Operations ---

  const handleOpenModal = (type, item = null) => {
    setModalType(type);
    setEditingItem(item);
    setFormData(item || {});
    setModalOpen(true);
  };

  const handleDelete = async (type, id) => {
    if (!window.confirm("Tem certeza que deseja excluir este registro?")) return;
    try {
      await api.delete(`/${type}s/${id}`);
      fetchData();
      
      // Limpa seleções se o item deletado estava selecionado
      if (type === 'escola' && String(id) === String(selectedEscolaId)) setSelectedEscolaId('');
      if (type === 'curso' && String(id) === String(selectedCursoId)) setSelectedCursoId('');
      if (type === 'turma' && String(id) === String(selectedTurmaId)) setSelectedTurmaId('');
      if (type === 'sala' && String(id) === String(selectedSalaId)) setSelectedSalaId('');
      
    } catch (error) {
      console.error(error);
      alert("Erro ao excluir.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const endpoint = `/${modalType}s`;
      const payload = { ...formData };
      
      // Injeta ID da escola automaticamente para Turma e Sala se não existir
      if ((modalType === 'turma' || modalType === 'sala') && !payload.unidade_id) {
        payload.unidade_id = selectedEscolaId;
      }

      // Converte números se necessário (opcional, dependendo do backend)
      if (payload.capacidade) payload.capacidade = Number(payload.capacidade);
      if (payload.duracao) payload.duracao = Number(payload.duracao);

      if (editingItem) {
        await api.put(`${endpoint}/${editingItem.id}`, payload);
      } else {
        await api.post(endpoint, payload);
      }
      
      setModalOpen(false);
      fetchData();
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("Erro ao salvar dados.");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // --- Renderização dos Modais ---
  const renderModalContent = () => {
    switch (modalType) {
      case "escola":
        return (
          <>
            <div className={styles.modalFormGroup}>
              <label>Nome</label>
              <input name="nome" value={formData.nome || ""} onChange={handleInputChange} required />
            </div>
            <div className={styles.modalFormGroup}>
              <label>CNPJ</label>
              <input name="cnpj" value={formData.cnpj || ""} onChange={handleInputChange} />
            </div>
            <div className={styles.modalFormGroup}>
              <label>Cidade</label>
              <input name="cidade" value={formData.cidade || ""} onChange={handleInputChange} />
            </div>
          </>
        );
      case "curso":
        return (
          <>
            <div className={styles.modalFormGroup}>
              <label>Nome do Curso</label>
              <input name="nome" value={formData.nome || ""} onChange={handleInputChange} required />
            </div>
            <div className={styles.modalFormGroup}>
              <label>Duração (horas)</label>
              <input type="number" name="duracao" value={formData.duracao || ""} onChange={handleInputChange} />
            </div>
          </>
        );
      case "turma":
        return (
          <>
            <div className={styles.modalFormGroup}>
              <label>Nome da Turma</label>
              <input name="nome" value={formData.nome || ""} onChange={handleInputChange} required />
            </div>
            <div className={styles.modalFormGroup}>
              <label>Turno</label>
              <select name="turno" value={formData.turno || ""} onChange={handleInputChange}>
                <option value="">Selecione</option>
                <option value="MANHA">Manhã</option>
                <option value="TARDE">Tarde</option>
                <option value="NOITE">Noite</option>
                <option value="INTEGRAL">Integral</option>
              </select>
            </div>
            <div className={styles.modalFormGroup}>
              <label>Curso</label>
              <select name="curso_id" value={formData.curso_id || ""} onChange={handleInputChange} required>
                <option value="">Selecione o Curso</option>
                {cursos.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
          </>
        );
      case "sala":
        return (
          <>
            <div className={styles.modalFormGroup}>
              <label>Nome da Sala</label>
              <input name="nome" value={formData.nome || ""} onChange={handleInputChange} required />
            </div>
            <div className={styles.modalFormGroup}>
              <label>Número</label>
              <input name="numero" value={formData.numero || ""} onChange={handleInputChange} />
            </div>
            <div className={styles.modalFormGroup}>
              <label>Capacidade</label>
              <input type="number" name="capacidade" value={formData.capacidade || ""} onChange={handleInputChange} />
            </div>
            <div className={styles.modalFormGroup}>
              <label>Tipo</label>
              <select name="tipo" value={formData.tipo || "SALA_AULA"} onChange={handleInputChange}>
                <option value="SALA_AULA">Sala de Aula</option>
                <option value="LABORATORIO">Laboratório</option>
              </select>
            </div>
            {/* Campo oculto apenas para visualização de debug se necessário */}
            <input type="hidden" name="unidade_id" value={selectedEscolaId} />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Dados Escolares</h1>
      </div>

      <div className={styles.card}>
        {/* === SELEÇÃO DE ESCOLA === */}
        <div className={styles.schoolHeader}>
          <div className={styles.schoolSelector}>
            <select
              value={selectedEscolaId}
              onChange={(e) => {
                setSelectedEscolaId(e.target.value);
                setSelectedCursoId(""); 
                setSelectedTurmaId("");
                setSelectedSalaId("");
              }}
            >
              <option value="">Selecione uma Escola...</option>
              {escolas.map((escola) => (
                <option key={escola.id} value={escola.id}>
                  {escola.nome}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.actionButtons}>
            {selectedEscolaId && (
              <>
                <button
                  className={`${styles.btn} ${styles.btnEdit}`}
                  onClick={() => handleOpenModal("escola", escolas.find(e => String(e.id) === String(selectedEscolaId)))}
                >
                  <FaPen />
                </button>
                <button
                  className={`${styles.btn} ${styles.btnDanger}`}
                  onClick={() => handleDelete("escola", selectedEscolaId)}
                >
                  <FaTrash />
                </button>
              </>
            )}
            <button
              className={`${styles.btn} ${styles.btnPrimary}`}
              onClick={() => handleOpenModal("escola")}
            >
              <FaPlus />
            </button>
          </div>
        </div>

        <div className={styles.formBody}>
          
          {/* 1. CURSO */}
          <div className={styles.formGroup}>
            <label>Curso</label>
            <div className={styles.inputWrapper}>
              <select
                className={styles.selectInput}
                value={selectedCursoId}
                onChange={(e) => setSelectedCursoId(e.target.value)}
                disabled={!selectedEscolaId}
              >
                <option value="">Selecione um curso (Filtrado por turmas existentes)</option>
                {filteredCursos.map((curso) => (
                  <option key={curso.id} value={curso.id}>
                    {curso.nome}
                  </option>
                ))}
              </select>
              <button
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={() => handleOpenModal("curso")}
                title="Novo Curso"
              >
                <FaPlus />
              </button>
              {selectedCursoId && (
                 <button
                 className={`${styles.btn} ${styles.btnEdit}`}
                 onClick={() => handleOpenModal("curso", cursos.find(c => String(c.id) === String(selectedCursoId)))}
               >
                 <FaPen />
               </button>
              )}
            </div>
          </div>

          {/* 2. TURMAS */}
          <div className={styles.formGroup}>
            <label>Turmas</label>
            <div className={styles.inputWrapper}>
              <select
                className={styles.selectInput}
                value={selectedTurmaId}
                onChange={(e) => setSelectedTurmaId(e.target.value)}
                disabled={!selectedEscolaId}
              >
                <option value="">Selecione uma turma...</option>
                {filteredTurmas.map((turma) => (
                  <option key={turma.id} value={turma.id}>
                    {turma.nome}
                  </option>
                ))}
              </select>
              <button
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={() => handleOpenModal("turma")}
                disabled={!selectedEscolaId}
              >
                <FaPlus />
              </button>
              {selectedTurmaId && (
                <>
                  <button
                    className={`${styles.btn} ${styles.btnEdit}`}
                    onClick={() => handleOpenModal("turma", turmas.find(t => String(t.id) === String(selectedTurmaId)))}
                  >
                    <FaPen />
                  </button>
                  <button
                    className={`${styles.btn} ${styles.btnDanger}`}
                    onClick={() => handleDelete("turma", selectedTurmaId)}
                  >
                    <FaTrash />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* 3. SALAS */}
          <div className={styles.formGroup}>
            <label>Salas</label>
            <div className={styles.inputWrapper}>
              <select
                className={styles.selectInput}
                value={selectedSalaId}
                onChange={(e) => setSelectedSalaId(e.target.value)}
                disabled={!selectedEscolaId}
              >
                <option value="">Selecione uma sala...</option>
                {filteredSalas.map((sala) => (
                  <option key={sala.id} value={sala.id}>
                    {sala.nome} - {sala.numero}
                  </option>
                ))}
              </select>
              <button
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={() => handleOpenModal("sala")}
                disabled={!selectedEscolaId}
              >
                <FaPlus />
              </button>
              {selectedSalaId && (
                <>
                  <button
                    className={`${styles.btn} ${styles.btnEdit}`}
                    onClick={() => handleOpenModal("sala", salas.find(s => String(s.id) === String(selectedSalaId)))}
                  >
                    <FaPen />
                  </button>
                  <button
                    className={`${styles.btn} ${styles.btnDanger}`}
                    onClick={() => handleDelete("sala", selectedSalaId)}
                  >
                    <FaTrash />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {modalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>{editingItem ? "Editar" : "Adicionar"} {modalType.charAt(0).toUpperCase() + modalType.slice(1)}</h2>
              <button onClick={() => setModalOpen(false)} className={styles.btn}>X</button>
            </div>
            <form onSubmit={handleSubmit}>
              {renderModalContent()}
              <div className={styles.modalFooter}>
                <button type="button" onClick={() => setModalOpen(false)} className={styles.btn}>
                  Cancelar
                </button>
                <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`}>
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DadosEscolares;
