import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Turmas.module.css";
import TableSection from "../../layout/Table/Table";

function Turmas() {
  const [dadosPorTurma, setDadosPorTurma] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTurmas = async () => {
      try {
        const res = await fetch("http://localhost:3000/pessoas/tipo/ALUNO");
        const alunos = await res.json();

        const agrupados = {};
        alunos.forEach((aluno) => {
          const turmaId = aluno.turma_id;
          if (!agrupados[turmaId]) agrupados[turmaId] = { alunos: [], nome: "" };
          agrupados[turmaId].alunos.push(aluno);
        });

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

  const formatarData = (d) =>
    d ? new Date(d).toLocaleDateString("pt-BR", { timeZone: "UTC" }) : "";

  const formatarTelefone = (t) => {
    if (!t) return "";
    const n = t.replace(/\D/g, "");
    return n.length === 11
      ? `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`
      : t;
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Turmas</h1>

      {Object.entries(dadosPorTurma).map(([turmaId, { nome, alunos }]) => {
        const rows = alunos.slice(0, 5).map((a) => ({
          Nome: a.nome,
          RM: a.rm,
          Email: a.email,
          Telefone: formatarTelefone(a.telefone),
          "Data Nascimento": formatarData(a.data_nascimento),
          id: a.id,
        }));

        return (
          <TableSection
            key={turmaId}
            title={nome}
            subtitle={`Tabela do ${nome}`}
            columns={["Nome", "RM", "Email", "Telefone", "Data Nascimento"]}
            data={rows}
            tipo="aluno"
            link={`/tabelas/turma/${turmaId}`}
          />
        );
      })}
    </div>
  );
}

export default Turmas;
