import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  { value: "", label: "INT" },
  { value: "DIV A", label: "DIV A" },
  { value: "DIV B", label: "DIV B" },
];

function Horarios() {
  console.log("🔄 COMPONENTE RENDERIZANDO - Horarios()");
  
  const [horarios, setHorarios] = useState([]);
  const [turmas, setTurmas] = useState([]);
  const [catalogoAulas, setCatalogoAulas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editor, setEditor] = useState(null); // { turmaId, day, slot }
  const [selectedAulaId, setSelectedAulaId] = useState("");
  const [selectedDivisao, setSelectedDivisao] = useState("");
  const [originalDivisao, setOriginalDivisao] = useState(""); // Divisão original quando editor foi aberto
  const [savingSlot, setSavingSlot] = useState(false);
  const [slotError, setSlotError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const popoverRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const normalizeHorariosList = (res) => {
      console.log("🔍 normalizeHorariosList recebido:", res);
      const list = res?.data?.data || res?.data || res || [];
      console.log("🔍 normalizeHorariosList após processar:", list);
      return Array.isArray(list) ? list : [];
    };

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const horariosRes = await listarHorarios();
        const dataHorarios = normalizeHorariosList(horariosRes);

        const turmasRes = await api.get("/turmas");
        const dataTurmas = turmasRes?.data?.data || turmasRes?.data || turmasRes || [];

        console.log("📚 Turmas carregadas:", dataTurmas);
        console.log("📚 É array?", Array.isArray(dataTurmas), "Tamanho:", Array.isArray(dataTurmas) ? dataTurmas.length : 0);

        setHorarios(dataHorarios);
        setTurmas(Array.isArray(dataTurmas) ? dataTurmas : []);
        console.log("✅ setTurmas chamado com:", Array.isArray(dataTurmas) ? dataTurmas.length : 0, "itens");
      } catch (err) {
        setError("Erro ao carregar dados.");
        console.error("❌ Erro no fetch:", err);
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

  // Monitor de horários para debugging
  useEffect(() => {
    console.log("📊 Horários state atualizado:", horarios);
    console.log("📊 Quantidade total:", horarios.length);
    if (horarios.length > 0) {
      console.log("📊 Primeiro horário:", horarios[0]);
    }
  }, [horarios]);

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

  const getAulasForSlot = (turmaAulas, day, slotStart, slotEnd) => {
    const dayNormalized = normalizeDay(day);

    const normalizeTime = (time) => {
      const str = String(time || "").replace(/\s+/g, "");
      const match = str.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
      if (!match) return "";
      const h = match[1].padStart(2, "0");
      const m = match[2];
      return `${h}:${m}`;
    };

    const isSameDay = (aulaDay) => {
      const normalized = normalizeDay(aulaDay);
      const checkDay = normalized
        .replace("-FEIRA", "")
        .replace("ÇA", "CA")
        .substring(0, 5);
      const checkDayNorm = dayNormalized
        .replace("-FEIRA", "")
        .replace("ÇA", "CA")
        .substring(0, 5);
      return checkDay === checkDayNorm || checkDay.includes(checkDayNorm) || checkDayNorm.includes(checkDay);
    };

    const slotStartNorm = normalizeTime(slotStart);
    const slotEndNorm = normalizeTime(slotEnd);

    const foundAulas = turmaAulas.filter((aula) => {
      // Formato range: "07:30-08:20"
      if (!aula.horario || !aula.horario.includes('-')) return false;
      
      const [inicio, fim] = aula.horario.split('-');
      const aulaInicio = normalizeTime(inicio);
      const aulaFim = normalizeTime(fim);
      
      const sameDay = isSameDay(aula.dia_semana || aula.diaSemana);
      
      // Verificar se o slot da grade coincide com o horário da aula
      const matchStart = aulaInicio === slotStartNorm;
      
      return sameDay && matchStart;
    });

    return foundAulas;
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

  const aulasPorTurma = useMemo(() => {
    const grouped = groupAulasByTurma(horarios);
    console.log("🔄 aulasPorTurma recalculado:", grouped);
    return grouped;
  }, [horarios]);

  const turmaIds = useMemo(() => {
    // Mostrar turmas que têm horários + turmas do sistema que ainda não têm horários
    const idsFromHorarios = Object.keys(aulasPorTurma);
    const idsFromTurmas = turmas.map((t) => String(t.id));
    const result = Array.from(new Set([...idsFromTurmas, ...idsFromHorarios])).sort((a, b) => Number(a) - Number(b));
    console.log("🎯 turmaIds calculado:", result);
    console.log("  idsFromHorarios:", idsFromHorarios);
    console.log("  idsFromTurmas:", idsFromTurmas);
    console.log("  turmas array:", turmas);
    return result;
  }, [aulasPorTurma, turmas]);

  const openEditor = (turmaId, day, slot, aulaAtual) => {
    setEditor({ turmaId, day, slot });
    const aulaId = aulaAtual?.aulaId || aulaAtual?.aula?.id || aulaAtual?.id || "";
    setSelectedAulaId(aulaId ? String(aulaId) : "");
    // Se aulaAtual tem apenas divisao definida (slot vazio de uma divisão específica)
    const divisao = aulaAtual?.divisao || aulaAtual?.aula?.divisao || "";
    setSelectedDivisao(divisao || "");
    setOriginalDivisao(divisao || ""); // Guardar divisão original
    setSlotError(null);
    setSearchTerm("");
  };

  const closeEditor = () => {
    setEditor(null);
    setSelectedAulaId("");
    setSelectedDivisao("");
    setOriginalDivisao("");
    setSlotError(null);
    setSearchTerm("");
  };

  const handleSaveSlot = async () => {
    if (!editor) return;

    setSavingSlot(true);
    setSlotError(null);

    try {
      const turmaAulas = aulasPorTurma[editor.turmaId] || [];
      
      // Buscar aula existente COM A MESMA DIVISÃO
      const aulasNoSlot = getAulasForSlot(
        turmaAulas,
        editor.day,
        editor.slot.start,
        editor.slot.end
      );
      
      // Usar divisão original (quando editor foi aberto) para encontrar a aula
      // Isso permite mudar a divisão de uma aula existente (ex: DIV A -> INT)
      const divisaoOriginal = originalDivisao || 'INT';
      const novaDiv = selectedDivisao || 'INT';
      const aulaExistente = aulasNoSlot.find(a => (getAulaDivisao(a) || 'INT') === divisaoOriginal);

      console.log("Divisão original:", divisaoOriginal);
      console.log("Nova divisão:", novaDiv);
      console.log("Aulas no slot:", aulasNoSlot.length);
      console.log("Aula existente com divisão original:", aulaExistente ? JSON.stringify(aulaExistente, null, 2) : "NENHUMA");

      // Se nenhuma aula foi selecionada (clicou em "Nenhum")
      if (!selectedAulaId) {
        if (aulaExistente?.id) {
          // Deletar a aula existente
          console.log(`Deletando horário existente ID ${aulaExistente.id}`);
          try {
            const deleteRes = await fetch(`http://localhost:3000/horarios-aulas/${aulaExistente.id}`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              }
            });

            if (!deleteRes.ok) {
              throw new Error('Erro ao deletar horário');
            }

            console.log("✅ Horário deletado com sucesso, ID:", aulaExistente.id);
          } catch (deleteErr) {
            console.error("❌ Erro ao deletar:", deleteErr);
            throw deleteErr;
          }
        } else {
          // Não existe aula para deletar, então apenas fecha o editor
          console.log("Nenhuma aula para remover neste slot");
        }
      } else {
        // Usuário selecionou uma aula - criar ou atualizar
        const payload = {
          turmaId: Number(editor.turmaId),
          diaSemana: normalizeDay(editor.day),
          horario: `${editor.slot.start}-${editor.slot.end}`,
          aulaId: Number(selectedAulaId),
          divisao: novaDiv,
          salaId: null,
          ...(aulaExistente?.id && { horarioIdExcluir: aulaExistente.id }),
        };

        console.log("=== HORÁRIOS DEBUG ===");
        console.log("Payload a ser enviado:", JSON.stringify(payload, null, 2));

        // Validação prévia (detecta conflito de professor e duplicatas)
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
            return;
          } else {
            console.warn("Falha na validação de horário", err);
          }
        }

        if (aulaExistente?.id) {
          console.log(`Atualizando horário existente ID ${aulaExistente.id} (${divisaoOriginal} → ${novaDiv})`);
          try {
            await atualizarHorario(aulaExistente.id, payload);
            console.log("✅ Atualização bem-sucedida");
          } catch (updateErr) {
            console.error("❌ Erro ao atualizar:", updateErr);
            throw updateErr;
          }
        } else {
          console.log(`Criando novo horário (divisão: ${novaDiv})`);
          try {
            const createRes = await criarHorario(payload);
            console.log("✅ Criação bem-sucedida, response:", createRes);
          } catch (createErr) {
            console.error("❌ Erro ao criar:", createErr);
            throw createErr;
          }
        }
      }

      // Recarregar TODOS os horários (sem filtro de turma)
      console.log("🔄 Recarregando todos os horários...");
      const horariosRes = await listarHorarios();
      console.log("📥 listarHorarios() response recebida:", horariosRes);
      console.log("📥 response.data:", horariosRes?.data);
      const dataHorarios = horariosRes?.data?.data || horariosRes?.data || horariosRes || [];
      console.log("📥 dataHorarios após processar:", dataHorarios);
      console.log("📥 É array?", Array.isArray(dataHorarios), "Tamanho:", Array.isArray(dataHorarios) ? dataHorarios.length : 0);
      console.log("📥 Primeiro item:", dataHorarios[0]);
      setHorarios(Array.isArray(dataHorarios) ? dataHorarios : []);
      console.log("✅ setHorarios chamado com:", Array.isArray(dataHorarios) ? dataHorarios.length : 0, "itens");
      closeEditor();
    } catch (err) {
      console.error("=== ERRO AO SALVAR HORÁRIO ===");
      console.error("Erro completo:", err);
      if (err?.status === 409 && err?.data?.conflicts) {
        const msg = err.data.conflicts.map((c) => {
          if (c.type === "professor") {
            return `Professor em conflito: ${c.details?.professorNome} (${c.details?.aulaConflito} - ${c.details?.turmaConflito})`;
          }
          if (c.type === "sala") {
            return `Sala em conflito: ${c.details?.salaId || c.details?.salaNome} (${c.details?.turmaConflito})`;
          }
          return c.message || "Conflito de horário";
        }).join("\n");
        setSlotError(msg);
      } else {
        setSlotError(err.message || "Erro ao salvar horário.");
      }
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

  console.log("🔼 RENDERIZAÇÃO: turmaIds =", turmaIds);
  console.log("🔼 RENDERIZAÇÃO: horarios =", horarios);
  console.log("🔼 RENDERIZAÇÃO: aulasPorTurma =", aulasPorTurma);

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <h1 className={styles.pageTitle}>Horários</h1>
        <button
          className={styles.btnAdd}
          onClick={() => navigate("/aulas")}
        >
          <FontAwesomeIcon icon={faPlus} /> Gerenciar aulas
        </button>
      </div>

      {turmaIds.length === 0 && (
        <div className={styles.emptyState}>Nenhuma turma encontrada.</div>
      )}

      {turmaIds.length > 0 && console.log("✅ Renderizando", turmaIds.length, "turmas")}

      {console.log("🔍 Antes do map, turmaIds:", turmaIds)}
      {turmaIds.map((turmaId) => (
        <div key={turmaId} className={styles.turmaSection}>
          <h2 className={styles.turmaTitle}>{getNomeTurma(turmaId)}</h2>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3>Tabela do Horário</h3>
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
                          // Obter todas as aulas deste slot
                          const aulasEncontradas = getAulasForSlot(
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

                          // Agrupar aulas por divisão
                          const aulaDivA = aulasEncontradas.find(a => (getAulaDivisao(a) || 'INT') === 'DIV A');
                          const aulaDivB = aulasEncontradas.find(a => (getAulaDivisao(a) || 'INT') === 'DIV B');
                          const aulaInt = aulasEncontradas.find(a => (getAulaDivisao(a) || 'INT') === 'INT');

                          // Se tem INT, mostrar apenas INT (quadrado inteiro)
                          const temInt = !!aulaInt;
                          // Se tem DIV A ou DIV B, sempre mostrar os dois lados
                          const temDivisao = !!aulaDivA || !!aulaDivB;

                          return (
                            <td key={dayValue} className={styles.slotCell}>
                              {temInt ? (
                                // INT ocupa quadrado inteiro
                                <button
                                  type="button"
                                  className={styles.slotButton}
                                  onClick={() => openEditor(turmaId, dayValue, slot, aulaInt)}
                                >
                                  <div className={styles.aulaInfo}>
                                    <span className={styles.materiaNome}>
                                      {getAulaNome(aulaInt)}
                                    </span>
                                  </div>
                                </button>
                              ) : temDivisao ? (
                                // Dividir em DIV A e DIV B (sempre mostra os dois)
                                <div className={styles.divisoesContainer}>
                                  {/* DIV A */}
                                  <div className={styles.divisaoSection} style={{ width: '50%' }}>
                                    <button
                                      type="button"
                                      className={styles.slotButton}
                                      onClick={() => openEditor(turmaId, dayValue, slot, aulaDivA || { divisao: 'DIV A' })}
                                      title={aulaDivA ? `${getAulaNome(aulaDivA)} - DIV A` : 'Adicionar DIV A'}
                                    >
                                      {aulaDivA ? (
                                        <div className={styles.aulaInfo}>
                                          <span className={styles.materiaNome}>
                                            {getAulaNome(aulaDivA)}
                                          </span>
                                          <span className={styles.divisaoTag}>DIV A</span>
                                        </div>
                                      ) : (
                                        <span className={styles.emptySlot}>DIV A</span>
                                      )}
                                    </button>
                                  </div>
                                  
                                  {/* DIV B */}
                                  <div className={styles.divisaoSection} style={{ width: '50%' }}>
                                    <button
                                      type="button"
                                      className={styles.slotButton}
                                      onClick={() => openEditor(turmaId, dayValue, slot, aulaDivB || { divisao: 'DIV B' })}
                                      title={aulaDivB ? `${getAulaNome(aulaDivB)} - DIV B` : 'Adicionar DIV B'}
                                    >
                                      {aulaDivB ? (
                                        <div className={styles.aulaInfo}>
                                          <span className={styles.materiaNome}>
                                            {getAulaNome(aulaDivB)}
                                          </span>
                                          <span className={styles.divisaoTag}>DIV B</span>
                                        </div>
                                      ) : (
                                        <span className={styles.emptySlot}>DIV B</span>
                                      )}
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                // Slot completamente vazio
                                <button
                                  type="button"
                                  className={styles.slotButton}
                                  onClick={() => openEditor(turmaId, dayValue, slot, null)}
                                >
                                  <span className={styles.emptySlot}>Selecionar</span>
                                </button>
                              )}

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
                                      onClick={() => navigate("/aulas")}
                                    >
                                      + Criar nova aula
                                    </button>
                                    {selectedAulaId && (
                                      <button
                                        type="button"
                                        className={styles.popoverItem}
                                        onClick={() => setSelectedAulaId("")}
                                      >
                                        <span className={styles.popoverItemName} style={{ color: '#999' }}>Nenhum</span>
                                      </button>
                                    )}
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
          </div>
        </div>
      ))}
    </div>
  );
}

export default Horarios;
