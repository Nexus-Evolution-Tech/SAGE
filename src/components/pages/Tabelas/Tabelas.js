import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import styles from "./Tabelas.module.css";
import { faSearch } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { api } from "../../../services/api";

function Tabelas() {
  const { tipo, turmaId } = useParams();
  const navigate = useNavigate();
  const [dados, setDados] = useState([]);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const formatarTelefone = (telefone) => {
    const numeros = telefone?.replace(/\D/g, "") || "";
    if (numeros.length === 11)
      return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`;
    return telefone;
  };

  const formatarData = (dataISO) => {
    if (!dataISO) return "";
    return new Date(dataISO).toLocaleDateString("pt-BR", { timeZone: "UTC" });
  };

  const formatarTurma = (id) => {
    const turmas = {
      1: "1° Ano A",
      2: "1° Ano B",
      3: "2° Ano A",
      4: "2° Ano B",
      5: "3° Ano A",
      6: "3° Ano B",
    };
    return turmas[id] || `Turma ${id}`;
  };

  const tipoMap = {
    turmas: "ALUNO",
    administracao: "ADMINISTRADOR",
    terceirizados: "TERCEIRIZADO",
    professores: "PROFESSOR",
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        if (tipo === "professores") {
          const fetchAllPages = async (tipoPessoa) => {
            let allItems = [];
            let page = 1;
            let totalPages = 1;
            do {
              const json = await api.get(`/pessoas/tipo/${tipoPessoa}?page=${page}&limit=100`);
              allItems = [...allItems, ...(json.data || json)];
              totalPages = json.totalPages || 1;
              page++;
            } while (page <= totalPages);
            return allItems;
          };

          const [professores, profAdms] = await Promise.all([
            fetchAllPages("PROFESSOR"),
            fetchAllPages("PROFADM"),
          ]);

          const listaFinal = [
            ...professores.map((p) => ({ ...p, trabalhaNaADM: false })),
            ...profAdms.map((p) => ({ ...p, trabalhaNaADM: true })),
          ];

          setDados(listaFinal);
          return;
        }

        if (tipo === "turmas" && turmaId) {
          let alunos = [];
          let page = 1;
          let totalPages = 1;

          do {
            const json = await api.get(`/pessoas/tipo/ALUNO?page=${page}&limit=100`);
            const todos = json.data || json;
            const filtrados = todos.filter((p) => Number(p.turma_id) === Number(turmaId));
            alunos = [...alunos, ...filtrados];
            totalPages = json.totalPages || 1;
            page++;
          } while (page <= totalPages);

          setDados(alunos);
          return;
        }

        const sigla = tipoMap[tipo]?.toUpperCase();
        if (!sigla) throw new Error("Tipo de rota inválido.");

        let data = [];
        let page = 1;
        let totalPages = 1;

        do {
          const json = await api.get(`/pessoas/tipo/${sigla}?page=${page}&limit=100`);
          data = [...data, ...(json.data || json)];
          totalPages = json.totalPages || 1;
          page++;
        } while (page <= totalPages);

        if (tipo === "terceirizados") {
          const cacheEmpresas = new Map();
          data = await Promise.all(
            data.map(async (p) => {
              if (!p.empresa_id) return { ...p, empresa: "", cnpj: "" };

              if (cacheEmpresas.has(p.empresa_id)) {
                const emp = cacheEmpresas.get(p.empresa_id);
                return { ...p, empresa: emp.nome || "", cnpj: emp.cnpj || "" };
              }

              try {
                const j = await api.get(`/empresas/${p.empresa_id}`);
                const emp = Array.isArray(j) ? j[0] : j;
                cacheEmpresas.set(p.empresa_id, emp || {});
                return { ...p, empresa: emp?.nome || "", cnpj: emp?.cnpj || "" };
              } catch (err) {
                console.error("Erro ao buscar empresa:", err);
                return { ...p, empresa: "", cnpj: "" };
              }
            })
          );
        }

        setDados(data);
      } catch (err) {
        console.error("Erro ao buscar dados:", err);
        setError(err.message || "Falha ao carregar os dados.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [tipo, turmaId]);

  const dadosFiltrados = dados.filter(
    (p) =>
      p.nome?.toLowerCase().includes(busca.toLowerCase()) ||
      p.email?.toLowerCase().includes(busca.toLowerCase()) ||
      p.rm?.toString().includes(busca) ||
      p.rg?.toString().includes(busca) ||
      p.telefone?.includes(busca)
  );

  const handleVerMais = (id) => {
    navigate(`/formulario/${tipoMap[tipo].toLowerCase()}/${id}`);
  };

  const commonHeader = (
    <div className={styles.header}>
      <h2 className={styles.title}>
        {tipo === "turmas" && turmaId
          ? `Alunos da Turma ${formatarTurma(turmaId)}`
          : tipo.charAt(0).toUpperCase() + tipo.slice(1)}
      </h2>
      <div className={styles.searchContainer}>
        <input
          type="search"
          placeholder="Pesquisar"
          className={styles.search}
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        <button className={styles.searchButton} type="button">
          <FontAwesomeIcon icon={faSearch} className={styles.iconSearch} />
        </button>
      </div>
    </div>
  );

  const renderTable = () => {
    // 1. Loading
    if (loading) {
      return (
        <div className={styles.container}>
          {commonHeader}
          <div className={styles.statusContainer}>Carregando dados...</div>
        </div>
      );
    }

    // 2. Erro
    if (error) {
      return (
        <div className={styles.container}>
          {commonHeader}
          <div className={`${styles.statusContainer} ${styles.noResults}`}>
            Erro: {error}
          </div>
        </div>
      );
    }

    // 3. Tabela de Dados
    const renderRows = () =>
      dadosFiltrados.map((p, i) => (
        <tr key={p.id || i}>
          <td>{p.nome}</td>
          {tipo === "turmas" && (
            <>
              <td>{p.rm}</td>
              <td>{p.email}</td>
              <td>{formatarData(p.data_nascimento)}</td>
              <td>
                <button
                  className={styles.verMais}
                  onClick={() => handleVerMais(p.id)}
                >
                  Ver informações
                </button>
              </td>
            </>
          )}
          {tipo === "professores" && (
            <>
              <td>{p.email}</td>
              <td>{formatarTelefone(p.telefone)}</td>
              <td>{p.trabalhaNaADM ? "Sim" : "Não"}</td>
              <td>
                <button
                  className={styles.verMais}
                  onClick={() => handleVerMais(p.id)}
                >
                  Ver informações
                </button>
              </td>
            </>
          )}
          {tipo === "administracao" && (
            <>
              <td>{p.rg}</td>
              <td>{p.email}</td>
              <td>{formatarTelefone(p.telefone)}</td>
              <td>{p.cargo}</td>
              <td>
                <button
                  className={styles.verMais}
                  onClick={() => handleVerMais(p.id)}
                >
                  Ver informações
                </button>
              </td>
            </>
          )}
          {tipo === "terceirizados" && (
            <>
              <td>{p.rg}</td>
              <td>{p.email}</td>
              <td>{formatarTelefone(p.telefone)}</td>
              <td>{p.empresa}</td>
              <td>
                <button
                  className={styles.verMais}
                  onClick={() => handleVerMais(p.id)}
                >
                  Ver informações
                </button>
              </td>
            </>
          )}
        </tr>
      ));

    return (
      <div className={styles.container}>
        {commonHeader}
        <div className={styles.tabeContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nome</th>
                {tipo === "turmas" && (
                  <>
                    <th>RM</th>
                    <th>Email</th>
                    <th>Data de Nascimento</th>
                    <th>Mais informações</th>
                  </>
                )}
                {tipo === "professores" && (
                  <>
                    <th>Email</th>
                    <th>Telefone</th>
                    <th>Trabalha na ADM?</th>
                    <th>Mais informações</th>
                  </>
                )}
                {tipo === "administracao" && (
                  <>
                    <th>RG</th>
                    <th>Email</th>
                    <th>Telefone</th>
                    <th>Cargo</th>
                    <th>Mais informações</th>
                  </>
                )}
                {tipo === "terceirizados" && (
                  <>
                    <th>RG</th>
                    <th>Email</th>
                    <th>Telefone</th>
                    <th>Empresa</th>
                    <th>Mais informações</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {dadosFiltrados.length > 0 ? (
                renderRows()
              ) : (
                <tr>
                  <td colSpan="10" className={styles.noResults}>
                    Nenhum resultado correspondente.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return renderTable();
}

export default Tabelas;