import React, { useEffect, useState } from "react";
import { api } from "../../../services/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import styles from "./Horarios.module.css";

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

const DAYS_OF_WEEK = ["SEGUNDA", "TERÇA", "QUARTA", "QUINTA", "SEXTA"];

function Horarios() {
  const [aulas, setAulas] = useState([]);
  const [turmas, setTurmas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [aulasRes, turmasRes] = await Promise.all([
          api.get("/aulas"),
          api.get("/turmas")
        ]);

        const dataAulas = aulasRes.data.data || aulasRes.data;
        const dataTurmas = turmasRes.data.data || turmasRes.data;

        setAulas(dataAulas);
        setTurmas(dataTurmas);
      } catch (err) {
        setError("Erro ao carregar dados.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const groupAulasByTurma = (aulasData) => {
    return aulasData.reduce((acc, aula) => {
      const turmaId = aula.turma_id;
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
    return turmaAulas.find((aula) => {
      const aulaInicio = aula.inicio.substring(0, 5);
      const aulaFim = aula.fim.substring(0, 5);
      const isSameDay = aula.dia_semana === day;
      
      const isHappening = (aulaInicio < slotEnd && aulaFim > slotStart);
      return isSameDay && isHappening;
    });
  };

  const aulasPorTurma = groupAulasByTurma(aulas);

  if (loading) return <div className={styles.loading}>Carregando horários...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>Horários</h1>

      {Object.keys(aulasPorTurma).map((turmaId) => (
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
                    {/* Alteração: Cabeçalho agora tem os Dias da Semana */}
                    <th className={styles.firstCol}>Horário</th>
                    {DAYS_OF_WEEK.map((day) => (
                      <th key={day}>
                        {day.charAt(0) + day.slice(1).toLowerCase()}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Alteração: Loop principal agora é pelos Slots de tempo (Linhas) */}
                  {TIME_SLOTS.map((slot, index) => {
                    
                    // Se for intervalo/almoço, fazemos uma linha inteira (colspan)
                    if (slot.type !== 'aula') {
                        return (
                            <tr key={index} style={{ backgroundColor: '#f0f0f0' }}>
                                <td className={styles.timeCell}>
                                    {slot.start} - {slot.end}
                                </td>
                                <td 
                                    colSpan={DAYS_OF_WEEK.length} 
                                    className={styles.breakCell}
                                    style={{ textAlign: 'center', color: '#666', fontStyle: 'italic', letterSpacing: '2px' }}
                                >
                                    {slot.label.toUpperCase()}
                                </td>
                            </tr>
                        )
                    }

                    return (
                      <tr key={index}>
                        {/* Primeira coluna: O Horário */}
                        <td className={styles.timeCell} style={{ fontWeight: 'bold', backgroundColor: '#f9f9f9' }}>
                          {slot.start} - {slot.end}
                        </td>

                        {/* Colunas seguintes: Os dias da semana */}
                        {DAYS_OF_WEEK.map((day) => {
                          const aulaEncontrada = getAulaForSlot(
                            aulasPorTurma[turmaId],
                            day,
                            slot.start,
                            slot.end
                          );

                          return (
                            <td key={day} className={styles.slotCell}>
                              {aulaEncontrada ? (
                                <div className={styles.aulaInfo}>
                                  <span className={styles.materiaNome}>
                                    {aulaEncontrada.nome.split(" - ")[0]}
                                  </span>
                                  {aulaEncontrada.divisao && aulaEncontrada.divisao !== "INT" && (
                                    <span className={styles.divisaoTag}>
                                      {aulaEncontrada.divisao}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className={styles.emptySlot}>-</span>
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
              <button className={styles.btnAdd}>
                <FontAwesomeIcon icon={faPlus} /> Acrescentar
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default Horarios;