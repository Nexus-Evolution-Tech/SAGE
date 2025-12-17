// src/hooks/useCachedApi.js
import { useState, useEffect, useCallback } from 'react';
import { useCache } from '../contexts/CacheContext';
import * as api from '../services/api';

/**
 * Hook customizado para fazer requisições com cache inteligente
 * 
 * @param {string} resourceType - Tipo do recurso (pessoas, departamentos, etc)
 * @param {string} endpoint - Endpoint da API
 * @param {object} options - Opções adicionais
 * @param {boolean} options.autoFetch - Se deve buscar automaticamente ao montar (default: true)
 * @param {boolean} options.fetchOnMount - Alias para autoFetch
 * @param {any} options.params - Parâmetros para a requisição
 * @returns {object} { data, loading, error, refetch, invalidate }
 */
export function useCachedApi(resourceType, endpoint, options = {}) {
  const { 
    autoFetch = true, 
    fetchOnMount = true,
    params = null 
  } = options;

  const { 
    fetchWithCache, 
    getCachedData, 
    invalidateCacheByResource 
  } = useCache();

  // Cria uma chave única para o cache baseada no recurso + params
  const cacheKey = params 
    ? `${resourceType}:${endpoint}:${JSON.stringify(params)}`
    : `${resourceType}:${endpoint}`;

  const [state, setState] = useState(() => {
    // Tenta obter dados do cache imediatamente
    const cached = getCachedData(cacheKey, resourceType);
    return {
      data: cached?.data || null,
      loading: !cached,
      error: cached?.error || null
    };
  });

  /**
   * Função para buscar dados (com cache)
   */
  const fetchData = useCallback(async (forceRefresh = false) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Mapeia o endpoint para a função correta da API
      const apiFn = getApiFunctionByEndpoint(endpoint, params);
      
      const result = await fetchWithCache(
        cacheKey,
        resourceType,
        apiFn,
        forceRefresh
      );

      setState({
        data: result.data,
        loading: false,
        error: result.error
      });

      return result.data;
    } catch (error) {
      setState({
        data: null,
        loading: false,
        error: error.message
      });
      throw error;
    }
  }, [cacheKey, resourceType, endpoint, params, fetchWithCache]);

  /**
   * Função para forçar atualização (ignora cache)
   */
  const refetch = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);

  /**
   * Função para invalidar o cache deste recurso
   */
  const invalidate = useCallback(() => {
    invalidateCacheByResource(resourceType);
  }, [resourceType, invalidateCacheByResource]);

  // Busca inicial (se autoFetch estiver habilitado)
  useEffect(() => {
    if (autoFetch || fetchOnMount) {
      fetchData(false);
    }
  }, [cacheKey]); // Refetch apenas se a chave do cache mudar

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    refetch,
    invalidate,
    fetchData
  };
}

/**
 * Hook especializado para operações de CREATE
 * Retorna função otimizada que invalida cache automaticamente
 */
export function useCachedCreate(resourceType) {
  const { addCacheItem, invalidateCacheByResource } = useCache();

  const create = useCallback(async (endpoint, data, options = {}) => {
    const apiFn = getApiFunctionByEndpoint(endpoint, null, 'POST');
    const result = await apiFn(data);

    // Estratégias de invalidação:
    // 1. Se temos o objeto criado e a chave de lista, adiciona otimisticamente
    if (result && options.listCacheKey) {
      addCacheItem(options.listCacheKey, result);
    }
    
    // 2. Se não, invalida todo o recurso para forçar reload
    if (!options.listCacheKey) {
      invalidateCacheByResource(resourceType);
    }

    return result;
  }, [resourceType, addCacheItem, invalidateCacheByResource]);

  return { create };
}

/**
 * Hook especializado para operações de UPDATE
 * Retorna função otimizada que atualiza cache localmente
 */
export function useCachedUpdate(resourceType) {
  const { updateCacheItem, invalidateCacheByResource } = useCache();

  const update = useCallback(async (endpoint, id, data, options = {}) => {
    const apiFn = getApiFunctionByEndpoint(endpoint, null, 'PUT');
    const result = await apiFn(id, data);

    // Estratégias de atualização:
    // 1. Se temos a chave de lista, atualiza o item localmente
    if (options.listCacheKey) {
      updateCacheItem(options.listCacheKey, id, result || data);
    }
    
    // 2. Se não, invalida todo o recurso
    if (!options.listCacheKey) {
      invalidateCacheByResource(resourceType);
    }

    return result;
  }, [resourceType, updateCacheItem, invalidateCacheByResource]);

  return { update };
}

/**
 * Hook especializado para operações de DELETE
 * Retorna função otimizada que remove do cache localmente
 */
export function useCachedDelete(resourceType) {
  const { removeCacheItem, invalidateCacheByResource } = useCache();

  const remove = useCallback(async (endpoint, id, options = {}) => {
    const apiFn = getApiFunctionByEndpoint(endpoint, null, 'DELETE');
    await apiFn(id);

    // Estratégias de remoção:
    // 1. Se temos a chave de lista, remove o item localmente
    if (options.listCacheKey) {
      removeCacheItem(options.listCacheKey, id);
    }
    
    // 2. Se não, invalida todo o recurso
    if (!options.listCacheKey) {
      invalidateCacheByResource(resourceType);
    }
  }, [resourceType, removeCacheItem, invalidateCacheByResource]);

  return { remove };
}

/**
 * Mapeia endpoints para funções da API
 * Centraliza a lógica de chamada à API
 */
function getApiFunctionByEndpoint(endpoint, params = null, method = 'GET') {
  // Remove barra inicial se existir
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  
  // Parse do endpoint para extrair recurso base
  const [resource, ...rest] = cleanEndpoint.split('/');

  // Mapeia os recursos para as funções da API
  const apiMap = {
    // GET
    GET: {
      'pessoas': () => api.listarPessoas(),
      'pessoas-completo': () => api.listarPessoasCompleto(),
      'departamentos': () => api.listarDepartamentos(),
      'areas': () => api.listarAreas(),
      'dispositivos': () => api.listarDispositivos(),
      'turmas': () => api.listarTurmas(),
      'cursos': () => api.listarCursos(),
      'escolas': () => api.listarEscolas(),
      'disciplinas': () => api.listarDisciplinas(),
      'aulas': () => api.listarAulas(),
      'horarios': () => api.listarHorarios(),
      'acessos': () => api.listarAcessos(),
      'acessos-hoje': () => api.listarAcessosHoje(),
      'acessos-recentes': () => api.listarAcessosRecentes(),
    },
    // POST
    POST: {
      'pessoas': (data) => api.criarPessoa(data),
      'departamentos': (data) => api.criarDepartamento(data),
      'areas': (data) => api.criarArea(data),
      'dispositivos': (data) => api.criarDispositivo(data),
      'turmas': (data) => api.criarTurma(data),
      'cursos': (data) => api.criarCurso(data),
      'disciplinas': (data) => api.criarDisciplina(data),
      'aulas': (data) => api.criarAula(data),
      'horarios': (data) => api.criarHorario(data),
    },
    // PUT
    PUT: {
      'pessoas': (id, data) => api.atualizarPessoa(id, data),
      'departamentos': (id, data) => api.atualizarDepartamento(id, data),
      'areas': (id, data) => api.atualizarArea(id, data),
      'dispositivos': (id, data) => api.atualizarDispositivo(id, data),
      'turmas': (id, data) => api.atualizarTurma(id, data),
      'cursos': (id, data) => api.atualizarCurso(id, data),
      'disciplinas': (id, data) => api.atualizarDisciplina(id, data),
      'aulas': (id, data) => api.atualizarAula(id, data),
    },
    // DELETE
    DELETE: {
      'pessoas': (id) => api.deletarPessoa(id),
      'departamentos': (id) => api.deletarDepartamento(id),
      'areas': (id) => api.deletarArea(id),
      'dispositivos': (id) => api.deletarDispositivo(id),
      'turmas': (id) => api.deletarTurma(id),
      'cursos': (id) => api.deletarCurso(id),
      'disciplinas': (id) => api.deletarDisciplina(id),
      'aulas': (id) => api.deletarAula(id),
    }
  };

  const mappedFunction = apiMap[method]?.[resource] || apiMap[method]?.[cleanEndpoint];

  if (!mappedFunction) {
    throw new Error(`Endpoint não mapeado: ${method} ${endpoint}`);
  }

  return mappedFunction;
}

/**
 * Hook que combina múltiplas requisições em paralelo
 * Útil para páginas que precisam de vários recursos
 */
export function useCachedMultiple(requests) {
  const [state, setState] = useState({
    data: {},
    loading: true,
    error: null
  });

  const fetchAll = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const results = await Promise.all(
        requests.map(({ resourceType, endpoint, params }) => {
          const { fetchData } = useCachedApi(resourceType, endpoint, { 
            autoFetch: false,
            params 
          });
          return fetchData();
        })
      );

      const dataMap = {};
      requests.forEach((req, index) => {
        dataMap[req.key || req.resourceType] = results[index];
      });

      setState({
        data: dataMap,
        loading: false,
        error: null
      });
    } catch (error) {
      setState({
        data: {},
        loading: false,
        error: error.message
      });
    }
  }, [requests]);

  useEffect(() => {
    fetchAll();
  }, []);

  return state;
}
