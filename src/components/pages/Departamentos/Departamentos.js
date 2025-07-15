import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Departamentos.module.css";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

function Departamentos() {
  const [mostrarOpcoes, setMostrarOpcoes] = useState(false);

  const [dados, setDados] = useState({
    turmas: [],
    professores: [],
    administracao: [],
    terceirizados: [],
  });

  const navigate = useNavigate();

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

  const formatarData = (dataISO) => {
    if (!dataISO) return "";
    const data = new Date(dataISO);
    return data.toLocaleDateString("pt-BR", { timeZone: "UTC" });
  };

  const formatarTelefone = (telefone) => {
    if (!telefone) return "";
    const numeros = telefone.replace(/\D/g, "");
    if (numeros.length === 11) {
      return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(
        7
      )}`;
    }
    return telefone;
  };

  const buscarFoto = async (id) => {
    try {
      const res = await fetch(`http://localhost:3000/pessoas/url/${id}`);
      const json = await res.json();
      return json.url || "";
    } catch (err) {
      console.error("Erro ao buscar imagem:", err);
      return "";
    }
  };

  useEffect(() => {
    const buscarDados = async () => {
      try {
        const tipos = [
          { key: "turmas", url: "ALUNO" },
          { key: "professores", url: "PROFESSOR" },
          { key: "profadm", url: "PROFADM" },
          { key: "administracao", url: "ADMINISTRADOR" },
          { key: "terceirizados", url: "TERCEIRIZADO" },
        ];

        const resultado = {
          turmas: [],
          professores: [],
          administracao: [],
          terceirizados: [],
        };

        for (const { key, url } of tipos) {
          const res = await fetch(`http://localhost:3000/pessoas/tipo/${url}`);
          let pessoas = await res.json();

          if (key === "profadm") {
            pessoas = pessoas.map((p) => ({ ...p, trabalhaNaADM: true }));
            resultado.professores.push(...pessoas);
            continue;
          }

          if (key === "professores") {
            pessoas = pessoas.map((p) => ({ ...p, trabalhaNaADM: false }));
          }

          const pessoasComFoto = await Promise.all(
            pessoas.slice(0, 3).map(async (pessoa) => {
              const foto = await buscarFoto(pessoa.id);
              return { ...pessoa, foto };
            })
          );

          resultado[key] = pessoasComFoto;
        }

        setDados(resultado);
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
      }
    };

    buscarDados();
  }, []);

  const Section = ({ title, subtitle, columns, data, tipo }) => {
    return (
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>{title}</h2>
          <button
            className={styles.verMais}
            onClick={() =>
              tipo === "turmas"
                ? navigate(`/turmas`)
                : navigate(`/tabelas/${tipo}`)
            }
          >
            Ver mais →
          </button>
        </div>
        <h3 className={styles.subtitle}>{subtitle}</h3>
        <table className={styles.table}>
          <thead>
            <tr>
              {columns.map((col, i) => (
                <th key={i}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((p, i) => (
              <tr key={i}>
                <td>{p.nome}</td>
                <td>
                  <img
                    src={p.foto}
                    alt="Foto"
                    className={styles.fotoMiniatura}
                    onError={(e) => (e.target.style.display = "none")}
                  />
                </td>
                {"rm" in p && <td>{p.rm}</td>}
                {"rg" in p && <td>{p.rg}</td>}
                <td>{p.email}</td>
                <td>{formatarTelefone(p.telefone)}</td>
                {"data_nascimento" in p && (
                  <td>{formatarData(p.data_nascimento)}</td>
                )}
                {"turma_id" in p && <td>{formatarTurma(p.turma_id)}</td>}
                {"empresa" in p && <td>{p.empresa}</td>}
                {"cnpj" in p && <td>{p.cnpj}</td>}
                {"cargo" in p && <td>{p.cargo}</td>}
                {"trabalhaNaADM" in p && (
                  <td>{p.trabalhaNaADM ? "Sim" : "Não"}</td>
                )}
                <td>
                  <button
                    className={styles.verBtn}
                    onClick={() => navigate(`/formulario/${tipo}/${p.id}`)}
                  >
                    Ver informações
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className={styles.container}>
       <div className={styles.titleContainer}>
        <div className={styles.div}></div>
      <h1 className={styles.title}>Departamentos</h1>
      <div style={{ position: "relative" }}>
        <button
          className={styles.addPeople}
          onClick={() => setMostrarOpcoes(!mostrarOpcoes)}
        >
          <FontAwesomeIcon icon={faPlus} className={styles.iconSearch} />
        </button>
        {mostrarOpcoes && (
          <div className={styles.opcoesContainer}>
            <button onClick={() => navigate("/adicionar/ALUNO")}>Aluno</button>
            <button onClick={() => navigate("/adicionar/PROFESSOR")}>Professor</button>
            <button onClick={() => navigate("/adicionar/ADMINISTRADOR")}>Administrador</button>
            <button onClick={() => navigate("/adicionar/TERCEIRIZADO")}>Terceirizado</button>
          </div>
        )}
      </div>
    </div>

      <Section
        title="Turmas"
        subtitle="Tabela dos Alunos do 1º Ano A"
        tipo="turmas"
        columns={[
          "Nome",
          "Foto",
          "RM",
          "RG",
          "Email Institucional",
          "Telefone",
          "Data de Nascimento",
          "Turma",
          "Mais",
        ]}
        data={dados.turmas}
      />
      <Section
        title="Professores"
        subtitle="Tabela dos Professores"
        tipo="professores"
        columns={[
          "Nome",
          "Foto",
          "RG",
          "Email",
          "Telefone",
          "Data de Nascimento",
          "ADM",
          "Mais",
        ]}
        data={dados.professores}
      />
      <Section
        title="Administração"
        subtitle="Tabela da Administração da Escola"
        tipo="administracao"
        columns={[
          "Nome",
          "Foto",
          "RG",
          "Email",
          "Telefone",
          "Data de Nascimento",
          "Cargo",
          "Mais",
        ]}
        data={dados.administracao}
      />
      <Section
        title="Terceirizados"
        subtitle="Tabela de Terceirizados"
        tipo="terceirizados"
        columns={["Nome", "Foto", "RG", "Email", "Telefone", "Empresa", "Mais"]}
        data={dados.terceirizados}
      />
    </div>
  );
}

export default Departamentos;
