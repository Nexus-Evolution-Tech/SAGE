import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import styles from './FiltrosAcesso.module.css';

export default function FiltrosAcesso({ filtro, onChangeFiltro }) {
  const [turmas, setTurmas] = useState([]);
  const [carregandoTurmas, setCarregandoTurmas] = useState(false);

  // Carregar turmas ao montar componente
  useEffect(() => {
    buscarTurmas();
  }, []);

  const buscarTurmas = async () => {
    try {
      setCarregandoTurmas(true);
      console.log('[FILTROS] Buscando turmas...');
      const response = await api.get('/api/relatorios/turmas');
      const dados = response?.data || response;
      console.log('[FILTROS] Turmas carregadas:', dados);
      setTurmas(Array.isArray(dados) ? dados : []);
    } catch (err) {
      console.error('[FILTROS-ERROR] Erro ao carregar turmas:', err);
      setTurmas([]);
    } finally {
      setCarregandoTurmas(false);
    }
  };

  const handleGrupo = (grupo) => {
    console.log('[FILTROS] Grupo clicado:', grupo);
    onChangeFiltro({
      grupo,
      tipo: grupo === 'ALUNOS' ? 'TODOS' : 'TODOS'
    });
  };

  const handleTipo = (tipo) => {
    console.log('[FILTROS] Tipo clicado:', tipo);
    onChangeFiltro({ ...filtro, tipo });
  };

  const opcoesAlunos = [
    { value: 'TODOS', label: 'Todas as Turmas' },
    ...turmas.map(t => ({ value: String(t.id), label: t.nome }))
  ];

  const opcoesFuncionarios = [
    { value: 'TODOS', label: 'Todos' },
    { value: 'PROFESSOR', label: 'Professores' },
    { value: 'ADMINISTRADOR', label: 'Administrativos' },
    { value: 'TERCEIRIZADO', label: 'Terceirizados' }
  ];

  const opcoes = filtro.grupo === 'ALUNOS' ? opcoesAlunos : opcoesFuncionarios;

  return (
    <div className={styles.filtros}>
      <div className={styles.grupo}>
        <label>Grupo</label>
        <div className={styles.radio}>
          <button
            className={filtro.grupo === 'ALUNOS' ? styles.ativo : ''}
            onClick={() => handleGrupo('ALUNOS')}
          >
            Alunos
          </button>
          <button
            className={filtro.grupo === 'FUNCIONARIOS' ? styles.ativo : ''}
            onClick={() => handleGrupo('FUNCIONARIOS')}
          >
            Funcionários
          </button>
        </div>
      </div>

      <div className={styles.tipo}>
        <label>{filtro.grupo === 'ALUNOS' ? 'Turma' : 'Tipo'}</label>
        <select 
          value={filtro.tipo} 
          onChange={(e) => handleTipo(e.target.value)}
          disabled={carregandoTurmas && filtro.grupo === 'ALUNOS'}
        >
          {opcoes.length === 0 && filtro.grupo === 'ALUNOS' ? (
            <option disabled>Carregando turmas...</option>
          ) : (
            opcoes.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))
          )}
        </select>
      </div>
    </div>
  );
}
