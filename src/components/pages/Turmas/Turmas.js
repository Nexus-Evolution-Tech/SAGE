import { useEffect, useState } from "react";
import styles from "./Turmas.module.css";
import TableSection from "../../layout/Table/Table";
import { api } from "../../../services/api";
import SkeletonLoader from "../../common/SkeletonLoader";
import BackButton from "../../layout/BackButton/BackButton";

function Turmas() {
  const [dadosPorTurma, setDadosPorTurma] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Novo estado para a busca
  const [termoBusca, setTermoBusca] = useState("");

  useEffect(() => {
    const fetchTurmas = async () => {
      setLoading(true);
      setError(null);
      try {
        // Busca todos os alunos (limit alto para garantir que a busca funcione em todos)
        const alunosJson = await api.get("/pessoas/tipo/ALUNO?limit=1000");
        const alunos = alunosJson.data || alunosJson || [];

        const agrupados = {};
        alunos.forEach((aluno) => {
          const turmaId = aluno.turma_id || 0;
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
              const turmaData = await api.get(`/turmas/${turmaId}`);
              agrupados[turmaId].nome =
                turmaData.data?.[0]?.nome ||
                turmaData[0]?.nome ||
                turmaData.nome ||
                `Turma ${turmaId}`;
            } catch (err) {
              console.error(`Erro ao buscar turma ${turmaId}:`, err);
              agrupados[turmaId].nome = `Turma ${turmaId}`;
            }
          })
        );

        setDadosPorTurma(agrupados);
      } catch (err) {
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

  // Lógica de Filtragem e Processamento para exibição
  const turmasProcessadas = Object.entries(dadosPorTurma)
    .map(([turmaId, { nome, alunos }]) => {
      let alunosFiltrados = alunos;

      // 1. Se tiver busca, filtra a lista completa
      if (termoBusca) {
        const termo = termoBusca.toLowerCase();
        alunosFiltrados = alunos.filter(
          (a) =>
            a.nome?.toLowerCase().includes(termo) ||
            (a.rm && String(a.rm).toLowerCase().includes(termo)) ||
            a.email?.toLowerCase().includes(termo)
        );
      } else {
        // 2. Se NÃO tiver busca, aplica o limite de 5 visualização original
        alunosFiltrados = alunos.slice(0, 5);
      }

      return {
        turmaId,
        nome,
        alunosParaExibir: alunosFiltrados,
      };
    })
    // Remove turmas que ficaram vazias após o filtro (apenas visualmente)
    .filter((grupo) => grupo.alunosParaExibir.length > 0);

  return (
    <div className={styles.container}>
      <div className={styles.pageHeaderRow}>
        <BackButton fallback="/pessoas" />
        <h1 className={styles.title}>Turmas</h1>
      </div>
      <div className={styles.headerContainer} style={{ marginBottom: "1.5rem" }}>
        {/* --- CAMPO DE BUSCA --- */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            position: "relative",
            maxWidth: "400px",
            marginTop: "1rem",
          }}
        >
          <input
            type="text"
            placeholder="Buscar aluno por nome, RM ou email..."
            value={termoBusca}
            onChange={(e) => setTermoBusca(e.target.value)}
            style={{
              padding: "0.5rem",
              borderRadius: "5px",
              border: "1px solid #ccc",
              fontSize: "1rem",
              width: "100%",
              minWidth: "300px",
            }}
          />
        </div>
      </div>

      {loading && <SkeletonLoader type="table" count={6} />}
      {error && <p className={styles.errorMessage}>{error}</p>}

      {!loading && !error && (
        <>
          {/* Mensagem de Nenhum Resultado */}
          {turmasProcessadas.length === 0 && termoBusca && (
            <div style={{ textAlign: "center", padding: "3rem", color: "#666" }}>
              <h3>Nenhum aluno encontrado para "{termoBusca}"</h3>
            </div>
          )}

          {/* Renderização das Tabelas */}
          {turmasProcessadas.map(({ turmaId, nome, alunosParaExibir }) => {
            const rows = alunosParaExibir.map((a) => ({
              Nome: a.nome,
              RM: a.rm || a.matricula || "-",
              Email: a.email || "-",
              "Data Nascimento": formatarData(a.data_nascimento),
              id: a.id,
            }));

            return (
              <TableSection
                key={turmaId}
                title={nome}
                subtitle={termoBusca ? `Resultados da busca em ${nome}` : `Tabela do ${nome}`}
                columns={[
                  "Nome",
                  "RM",
                  "Email",
                  "Data Nascimento",
                ]}
                data={rows}
                tipo="aluno"
                // Se tiver busca, talvez queira bloquear o link ou mantê-lo. Mantive o link.
                link={`/tabelas/turmas/${turmaId}`}
              />
            );
          })}
        </>
      )}
    </div>
  );
}

export default Turmas;