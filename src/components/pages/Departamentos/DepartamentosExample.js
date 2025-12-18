// src/components/pages/Departamentos/DepartamentosExample.js
// EXEMPLO DE COMO USAR O SISTEMA DE CACHE
// Copie este padrão para outros componentes

import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Departamentos.module.css";
import {
  faPlus,
  faDownload,
  faUpload,
  faFileExcel,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useCachedApi } from "../../../hooks/useCachedApi";
import { importarDados, exportarDados, obterPlanilhaModelo } from "../../../services/api";

function DepartamentosExample() {
  const navigate = useNavigate();

  // ============================================
  // SISTEMA DE CACHE - REQUISIÇÕES AUTOMÁTICAS
  // ============================================
  
  // Busca alunos - com cache de 5 minutos
  const { 
    data: alunos, 
    loading: loadingAlunos, 
    error: errorAlunos,
    refetch: refetchAlunos 
  } = useCachedApi('pessoas', '/pessoas/tipo/ALUNO');

  // Busca professores - com cache de 5 minutos
  const { 
    data: professores, 
    loading: loadingProfessores,
    refetch: refetchProfessores 
  } = useCachedApi('pessoas', '/pessoas/tipo/PROFESSOR');

  // Busca administradores - com cache de 5 minutos
  const { 
    data: administracao, 
    loading: loadingAdministracao 
  } = useCachedApi('pessoas', '/pessoas/tipo/ADMINISTRADOR');

  // Busca terceirizados - com cache de 5 minutos
  const { 
    data: terceirizados, 
    loading: loadingTerceirizados 
  } = useCachedApi('pessoas', '/pessoas/tipo/TERCEIRIZADO');

  // ============================================
  // ESTADOS LOCAIS (UI)
  // ============================================
  const [mostrarOpcoes, setMostrarOpcoes] = useState(false);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarLista, setMostrarLista] = useState(false);
  const [mostrarModalImportar, setMostrarModalImportar] = useState(false);
  const [mostrarModalExportar, setMostrarModalExportar] = useState(false);
  const [arquivoSelecionado, setArquivoSelecionado] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [mensagemUpload, setMensagemUpload] = useState({ tipo: "", texto: "" });
  const [isDragging, setIsDragging] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  const [exportError, setExportError] = useState("");
  const fileInputRef = useRef(null);

  // ============================================
  // FUNÇÕES UTILITÁRIAS
  // ============================================
  const formatarData = (dataISO) => {
    if (!dataISO) return "";
    const data = new Date(dataISO);
    return data.toLocaleDateString("pt-BR", { timeZone: "UTC" });
  };

  const formatarTelefone = (telefone) => {
    if (!telefone) return "";
    const numeros = telefone.replace(/\D/g, "");
    if (numeros.length === 11) {
      return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`;
    }
    return telefone;
  };

  // ============================================
  // HANDLERS DE IMPORTAÇÃO/EXPORTAÇÃO
  // ============================================
  const handleImportarSubmit = async (e) => {
    e.preventDefault();
    if (!arquivoSelecionado) {
      setMensagemUpload({ tipo: "erro", texto: "Por favor, selecione um arquivo." });
      return;
    }

    setIsUploading(true);
    setMensagemUpload({ tipo: "", texto: "" });

    try {
      const formData = new FormData();
      formData.append("arquivo", arquivoSelecionado);

      const response = await importarDados(formData);

      setMensagemUpload({
        tipo: "sucesso",
        texto: response.message || "Arquivo importado com sucesso!",
      });

      // INVALIDAR CACHE para forçar reload dos dados
      refetchAlunos();
      refetchProfessores();

      setTimeout(() => {
        setMostrarModalImportar(false);
        setArquivoSelecionado(null);
        setMensagemUpload({ tipo: "", texto: "" });
      }, 2000);
    } catch (error) {
      setMensagemUpload({
        tipo: "erro",
        texto: error.message || "Erro ao importar arquivo.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadModelo = async () => {
    setIsDownloading(true);
    setDownloadError("");

    try {
      const response = await obterPlanilhaModelo();

      if (!response.ok) {
        throw new Error("Erro ao baixar o modelo.");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "modelo_importacao.xlsx";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setDownloadError(error.message);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleExportar = async () => {
    setIsExporting(true);
    setExportError("");

    try {
      const response = await exportarDados();

      if (!response.ok) {
        throw new Error("Erro ao exportar dados.");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `pessoas_export_${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      setTimeout(() => {
        setMostrarModalExportar(false);
      }, 1500);
    } catch (error) {
      setExportError(error.message);
    } finally {
      setIsExporting(false);
    }
  };

  // ============================================
  // RENDER
  // ============================================

  // Loading global
  const isLoading = loadingAlunos || loadingProfessores || loadingAdministracao || loadingTerceirizados;

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Carregando dados...</p>
      </div>
    );
  }

  // Extrai os arrays de dados (compatível com resposta da API)
  const alunosData = Array.isArray(alunos?.data) ? alunos.data : (Array.isArray(alunos) ? alunos : []);
  const professoresData = Array.isArray(professores?.data) ? professores.data : (Array.isArray(professores) ? professores : []);
  const administracaoData = Array.isArray(administracao?.data) ? administracao.data : (Array.isArray(administracao) ? administracao : []);
  const terceirizadosData = Array.isArray(terceirizados?.data) ? terceirizados.data : (Array.isArray(terceirizados) ? terceirizados : []);

  return (
    <div className={styles.container}>
      {/* Header com botões de ação */}
      <div className={styles.header}>
        <h1 className={styles.title}>Gestão de Pessoas</h1>
        <div className={styles.actionButtons}>
          <button
            className={styles.btnAction}
            onClick={() => setMostrarModalImportar(true)}
            title="Importar dados"
          >
            <FontAwesomeIcon icon={faUpload} /> Importar
          </button>
          <button
            className={styles.btnAction}
            onClick={() => setMostrarModalExportar(true)}
            title="Exportar dados"
          >
            <FontAwesomeIcon icon={faDownload} /> Exportar
          </button>
        </div>
      </div>

      {/* Cards de categorias */}
      <div className={styles.cardsGrid}>
        {/* Card Alunos */}
        <div className={styles.card} onClick={() => navigate('/tabelas/alunos')}>
          <div className={styles.cardHeader}>
            <h3>Alunos</h3>
            <span className={styles.badge}>{alunosData.length}</span>
          </div>
          <div className={styles.cardPreview}>
            {alunosData.slice(0, 3).map((aluno) => (
              <div key={aluno.id} className={styles.previewItem}>
                <span>{aluno.nome}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Card Professores */}
        <div className={styles.card} onClick={() => navigate('/tabelas/professores')}>
          <div className={styles.cardHeader}>
            <h3>Professores</h3>
            <span className={styles.badge}>{professoresData.length}</span>
          </div>
          <div className={styles.cardPreview}>
            {professoresData.slice(0, 3).map((prof) => (
              <div key={prof.id} className={styles.previewItem}>
                <span>{prof.nome}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Card Administração */}
        <div className={styles.card} onClick={() => navigate('/tabelas/administracao')}>
          <div className={styles.cardHeader}>
            <h3>Administração</h3>
            <span className={styles.badge}>{administracaoData.length}</span>
          </div>
          <div className={styles.cardPreview}>
            {administracaoData.slice(0, 3).map((adm) => (
              <div key={adm.id} className={styles.previewItem}>
                <span>{adm.nome}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Card Terceirizados */}
        <div className={styles.card} onClick={() => navigate('/tabelas/terceirizados')}>
          <div className={styles.cardHeader}>
            <h3>Terceirizados</h3>
            <span className={styles.badge}>{terceirizadosData.length}</span>
          </div>
          <div className={styles.cardPreview}>
            {terceirizadosData.slice(0, 3).map((terc) => (
              <div key={terc.id} className={styles.previewItem}>
                <span>{terc.nome}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MODAIS (mesma lógica do original) */}
      {mostrarModalImportar && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2>Importar Dados</h2>
            <form onSubmit={handleImportarSubmit}>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => setArquivoSelecionado(e.target.files[0])}
              />
              <button type="submit" disabled={isUploading}>
                {isUploading ? "Importando..." : "Enviar"}
              </button>
              <button type="button" onClick={() => setMostrarModalImportar(false)}>
                Cancelar
              </button>
            </form>
            {mensagemUpload.texto && (
              <p className={mensagemUpload.tipo === "sucesso" ? styles.success : styles.error}>
                {mensagemUpload.texto}
              </p>
            )}
          </div>
        </div>
      )}

      {mostrarModalExportar && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2>Exportar Dados</h2>
            <p>Deseja exportar todos os dados de pessoas para Excel?</p>
            <button onClick={handleExportar} disabled={isExporting}>
              {isExporting ? "Exportando..." : "Exportar"}
            </button>
            <button onClick={() => setMostrarModalExportar(false)}>Cancelar</button>
            {exportError && <p className={styles.error}>{exportError}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

export default DepartamentosExample;
