import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Departamentos.module.css";
import {
  faPlus,
  faDownload,
  faUpload,
  faFileExcel,
} from "@fortawesome/free-solid-svg-icons"; 
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { api } from "../../../services/api";

function Departamentos() {
  const [mostrarOpcoes, setMostrarOpcoes] = useState(false);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarLista, setMostrarLista] = useState(false);

  const [mostrarModalImportar, setMostrarModalImportar] = useState(false);
  const [arquivoSelecionado, setArquivoSelecionado] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [mensagemUpload, setMensagemUpload] = useState({ tipo: "", texto: "" });
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");

  const [mostrarModalExportar, setMostrarModalExportar] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState("");

  const [dados, setDados] = useState({
    turmas: [],
    professores: [],
    administracao: [],
    terceirizados: [],
  });
  const navigate = useNavigate();

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
      const json = await api.get(`/pessoas/url/${id}`);
      return json.url || "";
    } catch (err) {
      console.error(`Erro ao buscar imagem para id ${id}:`, err);
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
          const json = await api.get(`/pessoas/tipo/${url}`);
          const pessoas = json.data || json;

          if (!Array.isArray(pessoas)) {
            console.error(
              `A API para /pessoas/tipo/${url} não retornou um array.`,
              pessoas
            );
            continue;
          }

          if (key === "profadm") {
            const pessoasComFlag = pessoas.map((p) => ({
              ...p,
              trabalhaNaADM: true,
            }));
            resultado.professores.push(...pessoasComFlag);
            continue;
          }

          if (key === "professores") {
            const pessoasComFlag = pessoas.map((p) => ({
              ...p,
              trabalhaNaADM: false,
            }));
            const pessoasComFoto = await Promise.all(
              pessoasComFlag.slice(0, 3).map(async (pessoa) => {
                const foto = await buscarFoto(pessoa.id);
                return { ...pessoa, foto };
              })
            );
            resultado.professores.push(...pessoasComFoto);
            continue;
          }

          const pessoasComFoto = await Promise.all(
            pessoas.slice(0, 3).map(async (pessoa) => {
              const foto = await buscarFoto(pessoa.id);

              let empresaNome = "";
              if (key === "terceirizados" && pessoa.empresa_id) {
                try {
                  const jsonEmpresa = await api.get(
                    `/empresas/${pessoa.empresa_id}`
                  );
                  empresaNome = Array.isArray(jsonEmpresa)
                    ? jsonEmpresa[0]?.nome || ""
                    : jsonEmpresa.nome || "";
                } catch (err) {
                  console.error("Erro ao buscar empresa:", err);
                }
              }

              return { ...pessoa, foto, empresa: empresaNome };
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

  const handleFileSelect = (file) => {
    if (file) {
      if (
        file.type ===
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        file.type === "application/vnd.ms-excel" ||
        file.type === "text/csv"
      ) {
        setArquivoSelecionado(file);
        setMensagemUpload({ tipo: "", texto: "" });
      } else {
        setMensagemUpload({
          tipo: "erro",
          texto: "Formato de arquivo inválido. Use .xlsx, .xls ou .csv",
        });
        setArquivoSelecionado(null);
      }
    }
  };

  const handleFileChange = (e) => {
    handleFileSelect(e.target.files?.[0]);
  };

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files?.[0]);
  }, []);

  const handleBuscarArquivoClick = () => {
    fileInputRef.current?.click();
  };

  const handleUpload = async () => {
    if (!arquivoSelecionado) {
      setMensagemUpload({
        tipo: "erro",
        texto: "Por favor, selecione um arquivo.",
      });
      return;
    }

    setIsUploading(true);
    setMensagemUpload({ tipo: "", texto: "" });

    const formData = new FormData();
    formData.append("planilha", arquivoSelecionado);

    try {
      const response = await api.postFormData("/dados/importar", formData);
      setMensagemUpload({
        tipo: "sucesso",
        texto: response?.data?.message || response?.message || "Arquivo importado com sucesso!",
      });
      setArquivoSelecionado(null);
    } catch (error) {
      const errorMsg =
        error.message || "Erro ao enviar o arquivo. Tente novamente.";
      console.error("Erro no upload:", error);
      setMensagemUpload({ 
        tipo: "erro", 
        texto: errorMsg 
      });
    } finally {
      setIsUploading(false);
    }
  };

  const fecharModalImportar = () => {
    setMostrarModalImportar(false);
    setArquivoSelecionado(null);
    setIsUploading(false);
    setMensagemUpload({ tipo: "", texto: "" });
    setIsDragging(false);
  };

  const handleDownloadModelo = async () => {
    setIsDownloading(true);
    setDownloadError("");

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error("Usuário não autenticado.");
      }
      const headers = new Headers();
      headers.append('Authorization', `Bearer ${token}`);
      const response = await fetch("http://localhost:3000/dados/planilha-modelo", {
        method: 'GET',
        headers: headers,
      });

      if (response.status === 401 || response.status === 403) {
        window.dispatchEvent(new CustomEvent('auth-expired', { 
          detail: { message: 'Sua sessão expirou. Faça login novamente.' } 
        }));
        throw new Error("Sua sessão expirou.");
      }
      if (!response.ok) {
        throw new Error(`Erro ao baixar o arquivo: ${response.statusText}`);
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get('content-disposition');
      let filename = 'planilha-modelo.xlsx';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+?)"?$/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      console.error("Erro no download:", error);
      setDownloadError(error.message || "Não foi possível baixar o arquivo.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadExportacao = async () => {
    setIsExporting(true);
    setExportError("");

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error("Usuário não autenticado.");
      }

      const headers = new Headers();
      headers.append('Authorization', `Bearer ${token}`);

      const response = await fetch("http://localhost:3000/dados/exportar", {
        method: 'GET',
        headers: headers,
      });

      if (response.status === 401 || response.status === 403) {
        window.dispatchEvent(new CustomEvent('auth-expired', { 
          detail: { message: 'Sua sessão expirou. Faça login novamente.' } 
        }));
        throw new Error("Sua sessão expirou.");
      }

      if (!response.ok) {
         try {
            const errData = await response.json();
            throw new Error(errData.message || `Erro do servidor: ${response.statusText}`);
          } catch (jsonError) {
            throw new Error(`Erro ao exportar: ${response.statusText}`);
          }
      }

      const blob = await response.blob();

      const contentDisposition = response.headers.get('content-disposition');
      let filename = 'exportacao-dados.xlsx';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+?)"?$/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      window.URL.revokeObjectURL(url);
      a.remove();

    } catch (error) {
      console.error("Erro na exportação:", error);
      setExportError(error.message || "Não foi possível gerar o arquivo.");
    } finally {
      setIsExporting(false);
    }
  };


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
                  {p.foto ? (
                    <img
                      src={p.foto}
                      alt="Foto"
                      className={styles.fotoMiniatura}
                      onError={(e) => (e.target.style.display = "none")}
                    />
                  ) : (
                    "-"
                  )}
                </td>
                {"rm" in p && <td>{p.rm || "-"}</td>}
                <td>{p.email || "-"}</td>
                <td>{formatarTelefone(p.telefone)}</td>
                {"data_nascimento" in p && (
                  <td>{formatarData(p.data_nascimento)}</td>
                )}
                {"divisao" in p && <td>{p.divisao || "-"}</td>}
                {tipo === "administracao" && "cargo" in p && (
                  <td>{p.cargo || "-"}</td>
                )}
                {tipo === "terceirizados" && "empresa" in p && (
                  <td>{p.empresa || "-"}</td>
                )}
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
        <div style={{ position: "relative", gap: "1rem", display: "flex" }}>
          <button
            className={styles.addPeople}
            onClick={() => setMostrarOpcoes(!mostrarOpcoes)}
            title="Adicionar pessoas"
          >
            <FontAwesomeIcon icon={faPlus} className={styles.iconSearch} />
          </button>

          <button
            className={styles.addPeople}
            onClick={() => setMostrarModal(true)}
            title="Baixar planilha-modelo"
          >
            <FontAwesomeIcon icon={faDownload} className={styles.iconSearch} />
          </button>

          <button
            className={styles.addPeople}
            onClick={() => setMostrarModalExportar(true)} 
            title="Exportar dados"
          >
            <FontAwesomeIcon icon={faUpload} className={styles.iconSearch} />
          </button>

          {mostrarOpcoes && (
            <div
              className={styles.modalOverlay}
              onClick={() => setMostrarOpcoes(false)}
            >
              <div
                className={styles.modalContentSelect}
                onClick={(e) => e.stopPropagation()}
              >
                <div className={styles.titleModal}>
                  <h2>Escolha uma opção</h2>
                </div>
                <div className={styles.buttonsModal}>
                  <button
                    className={styles.modalButton}
                    onClick={() => setMostrarLista(!mostrarLista)}
                  >
                    Adicionar Manualmente
                  </button>
                  <button
                    className={styles.modalButton}
                    onClick={() => {
                      setMostrarOpcoes(false); 
                      setMostrarModalImportar(true);
                    }}
                  >
                    Importar Planilha
                  </button>
                </div>
              </div>
            </div>
          )}

          {mostrarLista && (
            <div
              className={styles.modalOverlay}
              onClick={() => setMostrarLista(false)}
            >
              <div
                className={styles.modalContentList}
                onClick={(e) => e.stopPropagation()}
              >
                <div className={styles.opcoesContainer}>
                  <button onClick={() => navigate("/adicionar/ALUNO")}>
                    Aluno
                  </button>
                  <button onClick={() => navigate("/adicionar/PROFESSOR")}>
                    Professor
                  </button>
                  <button onClick={() => navigate("/adicionar/PROFADM")}>
                    Professor Administrador
                  </button>
                  <button onClick={() => navigate("/adicionar/ADMINISTRADOR")}>
                    Administrador
                  </button>
                  <button onClick={() => navigate("/adicionar/TERCEIRIZADO")}>
                    Terceirizado
                  </button>
                </div>
              </div>
            </div>
          )}

          {mostrarModal && (
            <div
              className={styles.modalOverlay}
              onClick={() => {
                setMostrarModal(false);
                setDownloadError("");
              }}
            >
              <div
                className={styles.modalContent}
                onClick={(e) => e.stopPropagation()}
              >
                <div className={styles.titleModal}>
                  <h2>Download da Planilha-Modelo</h2>
                  <p>Preencha para inserir novas pessoas no sistema</p>
                </div>
                <div className={styles.buttonModal}>
                  <button
                    className={styles.modalButton}
                    onClick={handleDownloadModelo}
                    disabled={isDownloading}
                  >
                    {isDownloading ? "Baixando..." : "Download"}
                    <FontAwesomeIcon
                      icon={faDownload}
                      className={styles.iconSearch}
                    />
                  </button>
                </div>
                {downloadError && (
                  <div 
                    className={`${styles.uploadMessage} ${styles.erro}`} 
                    style={{marginTop: '1rem', textAlign: 'center'}}
                  >
                    {downloadError}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {mostrarModalExportar && (
            <div
              className={styles.modalOverlay}
              onClick={() => {
                setMostrarModalExportar(false);
                setExportError("");
              }}
            >
              <div
                className={styles.modalContent} 
                onClick={(e) => e.stopPropagation()}
              >
                <div className={styles.titleModal}>
                  <h2>Exportar Dados do Sistema</h2>
                  <p>Um arquivo .xlsx com todos os dados será gerado.</p>
                </div>

                <div className={styles.buttonModal}>
                  <button
                    className={styles.modalButton}
                    onClick={handleDownloadExportacao} 
                    disabled={isExporting} 
                  >
                    {isExporting ? "Gerando..." : "Exportar e Baixar"}
                    <FontAwesomeIcon
                      icon={faDownload} 
                      className={styles.iconSearch}
                      style={{ marginLeft: '10px' }}
                    />
                  </button>
                </div>
                
                {exportError && (
                  <div 
                    className={`${styles.uploadMessage} ${styles.erro}`} 
                    style={{marginTop: '1rem', textAlign: 'center'}}
                  >
                    {exportError}
                  </div>
                )}
              </div>
            </div>
          )}


          {mostrarModalImportar && (
            <div
              className={styles.modalOverlay}
              onClick={fecharModalImportar}
            >
              <div
                className={styles.modalContentExcel}
                onClick={(e) => e.stopPropagation()}
              >
                <div className={styles.titleModal}>
                  <h2>Importar Planilha</h2>
                  <p>Arraste e solte o arquivo ou busque no seu computador.</p>
                </div>
                <div
                  className={`${styles.dropZone} ${
                    isDragging ? styles.dropZoneActive : ""
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className={styles.fileInput}
                    accept=".xlsx, .xls, .csv"
                  />
                  {arquivoSelecionado ? (
                    <div className={styles.fileInfo}>
                      <FontAwesomeIcon
                        icon={faFileExcel}
                        size="3x"
                        color="#217346"
                      />
                      <span className={styles.fileName}>
                        {arquivoSelecionado.name}
                      </span>
                      <button
                        className={styles.removerArquivoBtn}
                        onClick={() => setArquivoSelecionado(null)}
                      >
                        Trocar arquivo
                      </button>
                    </div>
                  ) : (
                    <div className={styles.dropZonePrompt}>
                      <FontAwesomeIcon icon={faUpload} size="3x" />
                      <p>Arraste e solte o arquivo aqui</p>
                      <p style={{ margin: "0.5rem 0" }}>ou</p>
                      <button
                        className={styles.modalButton}
                        onClick={handleBuscarArquivoClick}
                      >
                        Buscar Arquivo
                      </button>
                    </div>
                  )}
                </div>
                {mensagemUpload.texto && (
                  <div
                    className={`${styles.uploadMessage} ${
                      mensagemUpload.tipo === "sucesso"
                        ? styles.sucesso
                        : styles.erro
                    }`}
                  >
                    {mensagemUpload.texto}
                  </div>
                )}
                <div
                  className={styles.buttonsModal}
                  style={{ marginTop: "1.5rem" }}
                >
                  <button
                    className={styles.modalButton}
                    onClick={handleUpload}
                    disabled={!arquivoSelecionado || isUploading}
                  >
                    {isUploading ? "Enviando..." : "Enviar Arquivo"}
                  </button>
                </div>
              </div>
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
          "Email Institucional",
          "Telefone",
          "Data de Nascimento",
          "Divisão",
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
        columns={[
          "Nome",
          "Foto",
          "Email",
          "Telefone",
          "Data de Nascimento",
          "Empresa",
          "Mais",
        ]}
        data={dados.terceirizados}
      />
    </div>
  );
}

export default Departamentos;