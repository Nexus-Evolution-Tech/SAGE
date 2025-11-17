import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import styles from "./Tabelas.module.css";
import { faSearch } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

function Tabelas() {
  const { tipo, turmaId } = useParams(); 
  const navigate = useNavigate();
  const [dados, setDados] = useState([]);
  const [busca, setBusca] = useState("");
  const [showModal, setShowModal] = useState(false);

  const toggleModal = () => setShowModal((prev) => !prev);

  const formatarTelefone = (telefone) => {
    const numeros = telefone?.replace(/\D/g, "") || "";
    if (numeros.length === 11)
      return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(
        7
      )}`;
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
      try {
        if (tipo === "professores") {
          let allProf = [];
          let allProfAdm = [];
          let page = 1;
          let totalPages = 1;

          do {
            const res = await fetch(
              `http://localhost:3000/pessoas/tipo/PROFESSOR?page=${page}&limit=100`
            );
            const json = await res.json();
            allProf = [...allProf, ...(json.data || json)];
            totalPages = json.totalPages || 1;
            page++;
          } while (page <= totalPages);

          page = 1;
          totalPages = 1;
          do {
            const res = await fetch(
              `http://localhost:3000/pessoas/tipo/PROFADM?page=${page}&limit=100`
            );
            const json = await res.json();
            allProfAdm = [...allProfAdm, ...(json.data || json)];
            totalPages = json.totalPages || 1;
            page++;
          } while (page <= totalPages);

          const professores = [
            ...allProf.map((p) => ({ ...p, trabalhaNaADM: false })),
            ...allProfAdm.map((p) => ({ ...p, trabalhaNaADM: true })),
          ];

          setDados(professores);
          return;
        }

        if (tipo === "turmas" && turmaId) {
          let alunos = [];
          let page = 1;
          let totalPages = 1;

          do {
            const res = await fetch(
              `http://localhost:3000/pessoas/tipo/ALUNO?page=${page}&limit=100`
            );
            const json = await res.json();
            const todos = json.data || json;

            const filtrados = todos.filter(
              (p) => Number(p.turma_id) === Number(turmaId)
            );

            alunos = [...alunos, ...filtrados];
            totalPages = json.totalPages || 1;
            page++;
          } while (page <= totalPages);

          setDados(alunos);
          return;
        }

        const sigla = tipoMap[tipo]?.toUpperCase();
        if (!sigla) return;

        let data = [];
        let page = 1;
        let totalPages = 1;

        do {
          const res = await fetch(
            `http://localhost:3000/pessoas/tipo/${sigla}?page=${page}&limit=100`
          );
          const json = await res.json();
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
                const emp = cacheEmpresas.get(p.empresa_id) || {};
                return { ...p, empresa: emp.nome || "", cnpj: emp.cnpj || "" };
              }

              try {
                const r = await fetch(
                  `http://localhost:3000/empresas/${p.empresa_id}`
                );
                const j = await r.json();
                const emp = Array.isArray(j) ? j[0] : j;
                cacheEmpresas.set(p.empresa_id, emp || {});
                return {
                  ...p,
                  empresa: emp?.nome || "",
                  cnpj: emp?.cnpj || "",
                };
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
      <button className={styles.filterBtn} onClick={toggleModal}>
        Filtrar
      </button>
    </div>
  );

  const renderTable = () => {
    const renderRows = () =>
      dadosFiltrados.map((p, i) => (
        <tr key={i}>
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
      <>
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
      </>
    );
  };

  return (
    <div className={styles.container}>
      {renderTable()}
      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>Filtros</h3>
            <p>Configurações de filtro serão adicionadas aqui.</p>
            <button className={styles.closeBtn} onClick={toggleModal}>
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Tabelas;
