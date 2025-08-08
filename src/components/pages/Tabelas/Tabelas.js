import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import styles from "./Tabelas.module.css";
import { faSearch } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

function Tabelas() {
  const { tipo } = useParams();
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
      let url = "";

      if (tipo === "professores") {
        const profRes = await fetch(
          "http://localhost:3000/pessoas/tipo/PROFESSOR"
        );
        const prof = (await profRes.json()).map((p) => ({
          ...p,
          trabalhaNaADM: false,
        }));

        const profadmRes = await fetch(
          "http://localhost:3000/pessoas/tipo/PROFADM"
        );
        const profadm = (await profadmRes.json()).map((p) => ({
          ...p,
          trabalhaNaADM: true,
        }));

        setDados([...prof, ...profadm]);
        return;
      }

      url = `http://localhost:3000/pessoas/tipo/${tipoMap[
        tipo
      ]?.toUpperCase()}`;
      if (!url) return;

      const res = await fetch(url);
      const data = await res.json();
      setDados(data);
    };

    fetchData();
  }, [tipo]);

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
        {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
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
              <td>{formatarTelefone(p.telefone)}</td>
              <td>{formatarTurma(p.turma_id)}</td>
              <td>
                <button
                  className={styles.verMais}
                  onClick={() => handleVerMais(p.id)}
                >
                  Ver mais informações
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
                  Ver mais informações
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
                  Ver mais informações
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
              <td>{p.cnpj}</td>
              <td>
                <button
                  className={styles.verMais}
                  onClick={() => handleVerMais(p.id)}
                >
                  Ver mais informações
                </button>
              </td>
            </>
          )}
        </tr>
      ));

    return (
      <>
        {commonHeader}
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nome</th>
              {tipo === "turmas" && (
                <>
                  <th>RM</th>
                  <th>Email</th>
                  <th>Data de Nascimento</th>
                  <th>Telefone</th>
                  <th>Turma</th>
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
                  <th>CNPJ</th>
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
