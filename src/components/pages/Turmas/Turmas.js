import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Turmas.module.css";

function Turmas() {
  const [dadosPorTurma, setDadosPorTurma] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTurmas = async () => {
      try {
        const res = await fetch("http://localhost:3000/pessoas/tipo/ALUNO");
        const alunos = await res.json();

        const agrupados = {};

        // Agrupar alunos por turma_id
        alunos.forEach((aluno) => {
          const turmaId = aluno.turma_id;
          if (!agrupados[turmaId]) agrupados[turmaId] = { alunos: [], nome: "" };
          agrupados[turmaId].alunos.push(aluno);
        });

        // Buscar o nome de cada turma
        await Promise.all(
          Object.keys(agrupados).map(async (turmaId) => {
            const turmaRes = await fetch(`http://localhost:3000/turmas/${turmaId}`);
            const turmaData = await turmaRes.json();
            agrupados[turmaId].nome = turmaData[0]?.nome || `Turma ${turmaId}`;
          })
        );

        setDadosPorTurma(agrupados);
      } catch (err) {
        console.error("Erro ao buscar turmas:", err);
      }
    };

    fetchTurmas();
  }, []);

  const formatarData = (dataISO) => {
    if (!dataISO) return "";
    return new Date(dataISO).toLocaleDateString("pt-BR", { timeZone: "UTC" });
  };

  const formatarTelefone = (telefone) => {
    if (!telefone) return "";
    const numeros = telefone.replace(/\D/g, "");
    if (numeros.length === 11)
      return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`;
    return telefone;
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Turmas</h1>

      {Object.entries(dadosPorTurma).map(([turmaId, { nome, alunos }]) => (
        <div key={turmaId} className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>{nome}</h2>
            <button
              className={styles.verMais}
              onClick={() => navigate(`/tabelas/turma/${turmaId}`)}
            >
              Ver mais →
            </button>
          </div>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nome</th>
                <th>RM</th>
                <th>Email</th>
                <th>Telefone</th>
                <th>Data Nascimento</th>
                <th>Mais</th>
              </tr>
            </thead>
            <tbody>
              {alunos.slice(0, 5).map((a) => (
                <tr key={a.id}>
                  <td>{a.nome}</td>
                  <td>{a.rm}</td>
                  <td>{a.email}</td>
                  <td>{formatarTelefone(a.telefone)}</td>
                  <td>{formatarData(a.data_nascimento)}</td>
                  <td>
                    <button
                      className={styles.verBtn}
                      onClick={() => navigate(`/formulario/aluno/${a.id}`)}
                    >
                      Ver informações
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

export default Turmas;
