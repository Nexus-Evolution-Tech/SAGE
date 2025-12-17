import { useEffect, useState } from "react";
import styles from "./Turmas.module.css";
import TableSection from "../../layout/Table/Table";
import { api } from "../../../services/api";
import SkeletonLoader from "../../common/SkeletonLoader"; // --- Adicionar Skeleton

function Turmas() {
  const [dadosPorTurma, setDadosPorTurma] = useState({});
  const [loading, setLoading] = useState(true); // --- MUDANÇA 2: Estado de Loading
  const [error, setError] = useState(null); // --- MUDANÇA 3: Estado de Erro

  useEffect(() => {
    const fetchTurmas = async () => {
      setLoading(true);
      setError(null);
      try {
        // --- MUDANÇA 4: Usar api.get() para buscar alunos ---
        const alunosJson = await api.get(
          "/pessoas/tipo/ALUNO?limit=1000"
        );
        // Garantir que estamos pegando o array, mesmo que a API não retorne .data
        const alunos = alunosJson.data || alunosJson || [];

        const agrupados = {};
        alunos.forEach((aluno) => {
          const turmaId = aluno.turma_id || 0; // Agrupa alunos sem turma em '0'
          if (!agrupados[turmaId])
            agrupados[turmaId] = { alunos: [], nome: "" };
          agrupados[turmaId].alunos.push(aluno);
        });

        // Busca os nomes das turmas
        await Promise.all(
          Object.keys(agrupados).map(async (turmaId) => {
            if (turmaId === "0") {
              agrupados[turmaId].nome = "Sem turma";
              return;
            }
            try {
              // --- MUDANÇA 5: Usar api.get() para buscar nome da turma ---
              const turmaData = await api.get(`/turmas/${turmaId}`);
              
              // Lógica para encontrar o nome (robusta)
              agrupados[turmaId].nome =
                turmaData.data?.[0]?.nome ||
                turmaData[0]?.nome ||
                turmaData.nome || // Caso a resposta seja um objeto único
                `Turma ${turmaId}`;
            } catch (err) {
              console.error(`Erro ao buscar turma ${turmaId}:`, err);
              agrupados[turmaId].nome = `Turma ${turmaId}`;
            }
          })
        );

        setDadosPorTurma(agrupados);
      } catch (err) {
        // --- MUDANÇA 6: Tratamento de erro centralizado ---
        console.error("Erro ao buscar alunos:", err);
        setError(err.message || "Falha ao carregar dados dos alunos.");
      } finally {
        setLoading(false);
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

      {/* --- MUDANÇA 7: Renderizar estado de loading ou erro --- */}
      {loading && <SkeletonLoader type="table" count={6} />}
      {error && <p className={styles.errorMessage}>{error}</p>}

      {!loading &&
        !error &&
        Object.entries(dadosPorTurma).map(([turmaId, { nome, alunos }]) => {
          const rows = alunos.slice(0, 5).map((a) => ({
            Nome: a.nome,
            RM: a.rm || a.matricula || "-",
            Email: a.email || "-",
            "Data Nascimento": formatarData(a.data_nascimento),
            id: a.id, // ID usado para o link 'Ver mais'
          }));

          return (
            <TableSection
              key={turmaId}
              title={nome}
              subtitle={`Tabela do ${nome}`}
              // --- MUDANÇA 8: Adicionada a coluna "Telefone" ---
              columns={[
                "Nome",
                "RM",
                "Email",
                "Data Nascimento",
              ]}
              data={rows}
              tipo="aluno"
              link={`/tabelas/turmas/${turmaId}`}
            />
          );
        })}
    </div>
  );
}

export default Turmas;