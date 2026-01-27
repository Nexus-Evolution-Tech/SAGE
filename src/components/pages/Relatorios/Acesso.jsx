import React, { useState, useEffect } from 'react';
import FiltrosAcesso from '../../Relatorios/FiltrosAcesso';
import MetricasCards from '../../Relatorios/MetricasCards';
import GraficosPizza from '../../Relatorios/GraficosPizza';
import GraficosLinha from '../../Relatorios/GraficosLinha';
import { api } from '../../../services/api';
import styles from './Acesso.module.css';

export default function AcessoRelatorio() {
  const [filtro, setFiltro] = useState({
    grupo: 'ALUNOS',
    tipo: 'TODOS'
  });
  
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);

  // Função de busca de dados (sem dependências)
  const buscarDados = async (filtroAtual) => {
    setCarregando(true);
    setErro(null);
    try {
      const params = { grupo: filtroAtual.grupo, tipo: filtroAtual.tipo };
      console.log('[ACESSO] Iniciando busca com filtros:', params);

      try {
        console.log('[ACESSO] Tentando GET /api/relatorios/acesso com params:', params);
        const response = await api.get('/api/relatorios/acesso', { params });
        const payload = response?.data || response;
        console.log('[ACESSO] Dados recebidos da API:', payload);
        console.log('[ACESSO] Estrutura: metricas =', payload?.metricas, ', pizza =', payload?.pizza, ', linha =', payload?.linha);
        setDados(payload);
      } catch (err) {
        console.error('[ACESSO-ERROR] Erro na requisição:', err);
        throw err;
      }
    } catch (err) {
      console.error('[ACESSO-ERROR] Erro ao buscar dados:', err);
      setErro(err.message || 'Não foi possível carregar os dados.');
    } finally {
      setCarregando(false);
    }
  };

  // Effect que roda quando filtro muda
  useEffect(() => {
    console.log('[ACESSO] Filtro mudou:', filtro);
    buscarDados(filtro);
  }, [filtro]);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>Relatórios</p>
          <h1 className={styles.title}>Acesso e Presença</h1>
          <p className={styles.data}>
            {new Date().toLocaleDateString('pt-BR', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
        <div className={styles.status}>{carregando ? 'Atualizando…' : 'Pronto'}</div>
      </header>

      <div className={styles.surface}>
        <FiltrosAcesso filtro={filtro} onChangeFiltro={setFiltro} />

        {erro && (
          <div className={styles.erro}>
            <div>
              <strong>Erro ao carregar dados.</strong>
              <p>{erro}</p>
            </div>
            <button onClick={() => buscarDados(filtro)} className={styles.retry}>Tentar novamente</button>
          </div>
        )}

        {carregando && !dados && (
          <div className={styles.carregando}>Carregando dados...</div>
        )}

        {dados && (
          <>
            <MetricasCards metricas={dados.metricas} />

            <div className={styles.graficos}>
              <GraficosPizza dados={dados.pizza} />
              <GraficosLinha dados={dados.linha} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
