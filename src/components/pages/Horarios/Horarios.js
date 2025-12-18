import React, { useEffect, useMemo, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import styles from "./Horarios.module.css";
import {
  api,
  listarAulas as listarAulasCatalogo,
  listarHorarios,
  criarHorario,
  atualizarHorario,
  validarHorario,
} from "../../../services/api";

const TIME_SLOTS = [
  { start: "07:30", end: "08:20", type: "aula" },
  { start: "08:20", end: "09:10", type: "aula" },
  { start: "09:10", end: "10:00", type: "aula" },
  { start: "10:00", end: "10:20", type: "intervalo", label: "Intervalo" },
  { start: "10:20", end: "11:10", type: "aula" },
  { start: "11:10", end: "12:00", type: "aula" },
  { start: "12:00", end: "13:00", type: "almoco", label: "Almoço" },
  { start: "13:00", end: "13:50", type: "aula" },
  { start: "13:50", end: "14:40", type: "aula" },
  { start: "14:40", end: "15:30", type: "aula" },
];

const DAYS_OF_WEEK = [
  { value: "SEGUNDA", label: "Segunda" },
  { value: "TERCA", label: "Terça" },
  { value: "QUARTA", label: "Quarta" },
  { value: "QUINTA", label: "Quinta" },
  { value: "SEXTA", label: "Sexta" },
];

const normalizeDay = (day) => (day || "").toUpperCase().replace("Ç", "C");
const DIVISOES = [
  { value: "", label: "Nenhuma (INT)" },
  { value: "INT", label: "INT" },
  { value: "DIV A", label: "DIV A" },
  { value: "DIV B", label: "DIV B" },
  { value: "DIV A/B", label: "DIV A/B" },
];

function Horarios() {
  const [horarios, setHorarios] = useState([]);
  const [turmas, setTurmas] = useState([]);
  const [catalogoAulas, setCatalogoAulas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editor, setEditor] = useState(null); // { turmaId, day, slot }
  const [selectedAulaId, setSelectedAulaId] = useState("");
  const [selectedDivisao, setSelectedDivisao] = useState("");
  const [savingSlot, setSavingSlot] = useState(false);
  const [slotError, setSlotError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const popoverRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const horariosRes = await listarHorarios();
        const dataHorarios = horariosRes?.data || horariosRes || [];

        const turmasRes = await api.get("/turmas");
        const dataTurmas = turmasRes?.data?.data || turmasRes?.data || turmasRes || [];

        setHorarios(Array.isArray(dataHorarios) ? dataHorarios : []);
        setTurmas(Array.isArray(dataTurmas) ? dataTurmas : []);
      } catch (err) {
        setError("Erro ao carregar dados.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const fetchCatalogo = async () => {
      try {
        const data = await listarAulasCatalogo();
        const list = data?.data || data || [];
        setCatalogoAulas(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error("Falha ao carregar catálogo de aulas", err);
      }
    };

    fetchData();
    fetchCatalogo();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (editor && popoverRef.current && !popoverRef.current.contains(event.target)) {
        closeEditor();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [editor]);

  const groupAulasByTurma = (horariosData) => {
    return horariosData.reduce((acc, aula) => {
      const turmaId = aula.turmaId || aula.turma_id;
      if (!acc[turmaId]) {
        acc[turmaId] = [];
      }
      acc[turmaId].push(aula);
      return acc;
    }, {});
  };

  const getNomeTurma = (id) => {
    const turmaEncontrada = turmas.find((t) => t.id === Number(id));
    return turmaEncontrada ? turmaEncontrada.nome : `Turma ${id}`;
  };

  const getAulaForSlot = (turmaAulas, day, slotStart, slotEnd) => {
    const dayNormalized = normalizeDay(day);
    return turmaAulas.find((aula) => {
      // Suportar tanto formato antigo (inicio/fim) quanto novo (horario)
      let aulaInicio, aulaFim;

      if (aula.horario) {
        // Formato novo: "07:00-07:50"
        const [inicio, fim] = aula.horario.split("-");
        aulaInicio = inicio;
        aulaFim = fim;
      } else {
        // Formato antigo
        aulaInicio = (aula.inicio || "").substring(0, 5);
        aulaFim = (aula.fim || "").substring(0, 5);
      }

      const aulaDay = normalizeDay(aula.dia_semana || aula.diaSemana);
      const isSameDay = aulaDay === dayNormalized;
      const isHappening = aulaInicio < slotEnd && aulaFim > slotStart;
      return isSameDay && isHappening;
    });
  };

  const getAulaId = (aula) => aula?.aulaId || aula?.aula?.id || aula?.id;

  const getAulaNome = (aula) => {
    const directNome = aula?.nome || aula?.aula?.nome || aula?.aulaNome;
    if (directNome) return directNome;
    const aulaId = getAulaId(aula);
    if (aulaId && Array.isArray(catalogoAulas)) {
      const found = catalogoAulas.find((a) => String(a.id) === String(aulaId));
      if (found?.nome) return found.nome;
    }
    return "Aula";
  };

  const getAulaDivisao = (aula) => aula?.divisao || aula?.aula?.divisao;

  const aulasPorTurma = useMemo(() => groupAulasByTurma(horarios), [horarios]);

  const turmaIds = useMemo(() => {
    const idsFromHorarios = Object.keys(aulasPorTurma);
    const idsFromTurmas = turmas.map((t) => String(t.id));
    return Array.from(new Set([...idsFromTurmas, ...idsFromHorarios]));
  }, [aulasPorTurma, turmas]);

  const openEditor = (turmaId, day, slot, aulaAtual) => {
    setEditor({ turmaId, day, slot });
    const aulaId = aulaAtual?.aulaId || aulaAtual?.aula?.id || aulaAtual?.id || "";
    setSelectedAulaId(aulaId ? String(aulaId) : "");
    const divisao = aulaAtual?.divisao || aulaAtual?.aula?.divisao || "";
    setSelectedDivisao(divisao || "");
    setSlotError(null);
    setSearchTerm("");
  };

  const closeEditor = () => {
    setEditor(null);
    setSelectedAulaId("");
    setSelectedDivisao("");
    setSlotError(null);
    setSearchTerm("");
  };

  const handleSaveSlot = async () => {
    if (!editor) return;
    if (!selectedAulaId) {
      setSlotError("Selecione uma aula.");
      return;
    }

    setSavingSlot(true);
    setSlotError(null);

    const payload = {
      turmaId: Number(editor.turmaId),
      diaSemana: normalizeDay(editor.day),                    // Backend espera diaSemana
      horario: `${editor.slot.start}-${editor.slot.end}`,  // Backend espera "07:00-07:50"
      aulaId: Number(selectedAulaId),
      divisao: selectedDivisao || null,
      salaId: null,                             // TODO: adicionar seleção de sala
    };

    try {
      // Validação prévia (se disponível)
      try {
        await validarHorario(payload);
      } catch (err) {
        if (err?.status === 404) {
          console.warn("Validação de horário indisponível (404)");
        } else if (err?.status === 409 && err?.data?.conflicts) {
          const msg = err.data.conflicts.map((c) => {
            if (c.type === "professor") {
              return `Professor em conflito: ${c.details?.professorNome} (${c.details?.aulaConflito} - ${c.details?.turmaConflito})`;
            } else if (c.type === "sala") {
              return `Sala em conflito: ${c.details?.salaId || c.details?.salaNome} (${c.details?.turmaConflito})`;
            }
            return c.message || "Conflito de horário";
          }).join("\n");
          setSlotError(msg);
          setSavingSlot(false);
          return; // não prossegue com save
        } else {
          console.warn("Falha na validação de horário", err);
        }
      }

      const turmaAulas = aulasPorTurma[editor.turmaId] || [];
      const aulaExistente = getAulaForSlot(
        turmaAulas,
        editor.day,
        editor.slot.start,
        editor.slot.end
      );

      if (aulaExistente?.id) {
        await atualizarHorario(aulaExistente.id, payload);
      } else {
        await criarHorario(payload);
      }

      const horariosRes = await listarHorarios();
      const dataHorarios = horariosRes?.data || horariosRes || [];
      setHorarios(Array.isArray(dataHorarios) ? dataHorarios : []);
      closeEditor();
    } catch (err) {
      setSlotError(err.message || "Erro ao salvar horário.");
    } finally {
      setSavingSlot(false);
    }
  };

  const filteredAulas = useMemo(() => {
    if (!searchTerm) return catalogoAulas;
    const term = searchTerm.toLowerCase();
    return catalogoAulas.filter((a) => (a.nome || "").toLowerCase().includes(term));
  }, [catalogoAulas, searchTerm]);

  if (loading) return <div className={styles.loading}>Carregando horários...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>Horários</h1>

      {turmaIds.length === 0 && (
        <div className={styles.emptyState}>Nenhuma turma encontrada.</div>
      )}

      {turmaIds.map((turmaId) => (
        <div key={turmaId} className={styles.turmaSection}>
          <h2 className={styles.turmaTitle}>{getNomeTurma(turmaId)}</h2>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3>Tabela do Horário</h3>
              <button className={styles.expandButton}>+</button>
            </div>

            <div className={styles.tableResponsive}>
              <table className={styles.scheduleTable}>
                <thead>
                  <tr>
                    <th className={styles.firstCol}>Horário</th>
                    {DAYS_OF_WEEK.map(({ value, label }) => (
                      <th key={value}>{label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {TIME_SLOTS.map((slot, index) => {
                    if (slot.type !== "aula") {
                      return (
                        <tr key={index} style={{ backgroundColor: "#f0f0f0" }}>
                          <td className={styles.timeCell}>
                            {slot.start} - {slot.end}
                          </td>
                          <td
                            colSpan={DAYS_OF_WEEK.length}
                            className={styles.breakCell}
                            style={{
                              textAlign: "center",
                              color: "#666",
                              fontStyle: "italic",
                              letterSpacing: "2px",
                            }}
                          >
                            {slot.label.toUpperCase()}
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr key={index}>
                        <td
                          className={styles.timeCell}
                          style={{ fontWeight: "bold", backgroundColor: "#f9f9f9" }}
                        >
                          {slot.start} - {slot.end}
                        </td>

                        {DAYS_OF_WEEK.map(({ value: dayValue }) => {
                          const aulaEncontrada = getAulaForSlot(
                            aulasPorTurma[turmaId] || [],
                            dayValue,
                            slot.start,
                            slot.end
                          );
                          const isEditing =
                            editor &&
                            editor.turmaId === turmaId &&
                            editor.day === dayValue &&
                            editor.slot.start === slot.start &&
                            editor.slot.end === slot.end;

                          const divisao = getAulaDivisao(aulaEncontrada);

                          return (
                            <td key={dayValue} className={styles.slotCell}>
                              <button
                                type="button"
                                className={styles.slotButton}
                                onClick={() => openEditor(turmaId, dayValue, slot, aulaEncontrada)}
                              >
                                {aulaEncontrada ? (
                                  <div className={styles.aulaInfo}>
                                    <span className={styles.materiaNome}>
                                      {getAulaNome(aulaEncontrada)}
                                    </span>
                                    {divisao && divisao !== "INT" && (
                                      <span className={styles.divisaoTag}>{divisao}</span>
                                    )}
                                  </div>
                                ) : (
                                  <span className={styles.emptySlot}>Selecionar</span>
                                )}
                              </button>

                              {isEditing && (
                                <div className={styles.slotPopover} ref={popoverRef}>
                                  <label className={styles.popoverLabel}>Aula</label>
                                  <input
                                    className={styles.popoverInput}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Buscar ou criar aula"
                                    autoFocus
                                  />

                                  <label className={styles.popoverLabel} style={{ marginTop: 8 }}>Divisão</label>
                                  <select
                                    className={styles.popoverInput}
                                    value={selectedDivisao}
                                    onChange={(e) => setSelectedDivisao(e.target.value)}
                                  >
                                    {DIVISOES.map((opt) => (
                                      <option key={opt.value || 'none'} value={opt.value}>
                                        {opt.label}
                                      </option>
                                    ))}
                                  </select>

                                  <div className={styles.popoverList}>
                                    <button
                                      type="button"
                                      className={styles.popoverItemPrimary}
                                      onClick={() => window.open("/aulas", "_blank")}
                                    >
                                      + Criar nova aula
                                    </button>
                                    {filteredAulas.map((a) => (
                                      <button
                                        type="button"
                                        key={a.id}
                                        className={`${styles.popoverItem} ${
                                          String(selectedAulaId) === String(a.id) ? styles.popoverItemActive : ""
                                        }`}
                                        onClick={() => setSelectedAulaId(String(a.id))}
                                      >
                                        <span className={styles.popoverItemName}>{a.nome}</span>
                                        {a.divisao && <span className={styles.popoverItemTag}>{a.divisao}</span>}
                                      </button>
                                    ))}
                                    {filteredAulas.length === 0 && (
                                      <div className={styles.popoverEmpty}>Nenhuma aula encontrada.</div>
                                    )}
                                  </div>

                                  <div className={styles.popoverActions}>
                                    <button
                                      type="button"
                                      className={styles.secondaryBtn}
                                      onClick={closeEditor}
                                      disabled={savingSlot}
                                    >
                                      Cancelar
                                    </button>
                                    <button
                                      type="button"
                                      className={styles.primaryBtn}
                                      onClick={handleSaveSlot}
                                      disabled={savingSlot}
                                    >
                                      {savingSlot ? "Salvando..." : "Salvar"}
                                    </button>
                                  </div>
                                  {slotError && <div className={styles.error}>{slotError}</div>}
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className={styles.actionsFooter}>
              <button
                className={styles.btnAdd}
                onClick={() => window.open("/aulas", "_blank")}
              >
                <FontAwesomeIcon icon={faPlus} /> Gerenciar aulas
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default Horarios;
