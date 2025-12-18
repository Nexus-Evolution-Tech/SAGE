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

  // === FUNÇÃO DE BUSCA CORRIGIDA E BLINDADA ===
  const fetchAllPages = async (endpoint) => {
    try {
      // 1. Busca a primeira página
      const response = await api.get(endpoint, { params: { page: 1, limit: 50 } });
      const responseBody = response.data;

      // CENÁRIO A: A API retornou o array diretamente (sem paginação wrapper)
      if (Array.isArray(responseBody)) {
        return responseBody;
      }

      // CENÁRIO B: A API retornou um objeto paginado (ex: { data: [], totalPages: 4 })
      // Aqui usamos "responseBody.data || []" para garantir que se for undefined, vira array vazio
      let list = [];
      
      if (Array.isArray(responseBody.data)) {
        list = responseBody.data;
      } else if (responseBody.data && Array.isArray(responseBody.data.data)) {
         // Alguns backends aninham data.data
         list = responseBody.data.data;
      } else {
        console.warn(`Atenção: Estrutura inesperada em ${endpoint}. Retornando vazio.`, responseBody);
        return [];
      }

      // Se achamos a lista, vamos ver se tem mais páginas
      const totalPages = responseBody.totalPages || responseBody.last_page || 1;
      let allData = [...list];

      // 2. Busca o restante em paralelo se houver mais páginas
      if (totalPages > 1) {
        const promises = [];
        for (let page = 2; page <= totalPages; page++) {
          promises.push(api.get(endpoint, { params: { page, limit: 50 } }));
        }

        const responses = await Promise.all(promises);

        responses.forEach((res) => {
          const body = res.data;
          // Tenta extrair o array da resposta das outras páginas
          const pageData = Array.isArray(body) ? body : (body.data || []);
          if (Array.isArray(pageData)) {
            allData = [...allData, ...pageData];
          }
        });
      }

      return allData;

    } catch (error) {
      console.error(`Erro fatal ao buscar ${endpoint}:`, error);
      // Retorna array vazio em caso de erro de rede para não quebrar o Promise.all
      return [];
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [aulasData, turmasData] = await Promise.all([
          fetchAllPages("/aulas"),
          fetchAllPages("/turmas")
        ]);

        console.log("Aulas carregadas:", aulasData.length);
        console.log("Turmas carregadas:", turmasData.length);

        setAulas(aulasData);
        setTurmas(turmasData);
      } catch (err) {
        setError("Erro ao carregar dados. Verifique o console.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const groupAulasByTurma = (aulasData) => {
    if (!Array.isArray(aulasData)) return {};
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
    // Garante que turmas é um array antes de procurar
    if (!Array.isArray(turmas)) return `Turma ${id}`;
    const turmaEncontrada = turmas.find((t) => t.id === Number(id));
    return turmaEncontrada ? turmaEncontrada.nome : `Turma ${id}`;
  };

  const getAulaForSlot = (turmaAulas, day, slotStart, slotEnd) => {
    if (!turmaAulas) return undefined;
    
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

      {Object.keys(aulasPorTurma).length === 0 && !loading && (
          <div style={{ padding: 20, textAlign: "center" }}>
            Nenhuma aula encontrada. Se você inseriu os dados no banco, verifique se a API está retornando a estrutura esperada (F12).
          </div>
      )}

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
                    <th className={styles.firstCol}>Horário</th>
                    {DAYS_OF_WEEK.map((day) => (
                      <th key={day}>
                        {day.charAt(0) + day.slice(1).toLowerCase()}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {TIME_SLOTS.map((slot, index) => {
                    
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
                        <td className={styles.timeCell} style={{ fontWeight: 'bold', backgroundColor: '#f9f9f9' }}>
                          {slot.start} - {slot.end}
                        </td>

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