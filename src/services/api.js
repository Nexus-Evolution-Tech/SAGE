// src/services/api.js

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
if (process.env.NODE_ENV === 'development') {
  // Log base URL to help diagnose port routing
  // eslint-disable-next-line no-console
  console.log('[API] Base URL:', API_URL);
}

function getToken() {
   return localStorage.getItem('token');
}

/**
 * Lida com TODAS as respostas da API e centraliza o erro 401
 */
async function handleResponse(response) {
  // ==========================================================
  // CORREÇÃO AQUI
  // Agora ele captura tanto 401 (Unauthorized) quanto 403 (Forbidden)
  // ==========================================================
 if (response.status === 401 || response.status === 403) {
// 1. Limpa o token do storage
 localStorage.removeItem('token');
 
 // 2. Dispara um evento global que o React pode ouvir
 let errorMessage = 'Sua sessão expirou ou você não tem permissão. Por favor, faça login novamente.';
try {
const errorData = await response.json();
 if (errorData.message) {
errorMessage = errorData.message;
}
} catch (e) {
// Ignora se não for JSON
 }
 window.dispatchEvent(new CustomEvent('auth-expired', { 
detail: { message: errorMessage } 
  }));
  
  // 3. Lança o erro para que a chamada original (no componente) pare
    // Usamos o status real para o log de erro
  throw new Error(`Não autorizado (${response.status})`);
  }
  
  if (response.status === 204) {
  return null; // Handle 'No Content'
  }
  
  // Clone response para poder ler body múltiplas vezes
  const cloned = response.clone();
  let data;
  try {
    data = await response.json();
  } catch (e) {
    try {
      data = await cloned.text();
    } catch (e2) {
      data = null;
    }
  }

  if (!response.ok) {
    const message = (data && data.message) || (typeof data === 'string' ? data : null);
    const err = new Error(message || `Erro na requisição: ${response.statusText}`);
    err.status = response.status;
    // anexa corpo bruto quando não for JSON
    err.data = (data && typeof data === 'object') ? data : (data ? { raw: data } : null);
    throw err;
  }
  
  return data;
}

function getAuthHeaders(isFormData = false) {
  const token = getToken();
  const headers = new Headers();

  if (!isFormData) {
  headers.append('Content-Type', 'application/json');
  }
  
  if (token) {
  headers.append('Authorization', `Bearer ${token}`);
  }
  
  return headers;
}

async function get(endpoint) {
  console.log(`📤 GET ${endpoint}`);
  const response = await fetch(`${API_URL}${endpoint}`, {
  method: 'GET',
  headers: getAuthHeaders(),
  });
  const result = await handleResponse(response);
  console.log(`📥 GET ${endpoint} response:`, result);
  return result;
}

async function post(endpoint, body) {
  const response = await fetch(`${API_URL}${endpoint}`, {
  method: 'POST',
  headers: getAuthHeaders(),
  body: JSON.stringify(body),
  });
  return handleResponse(response);
}

async function patch(endpoint, body) {
  const response = await fetch(`${API_URL}${endpoint}`, {
  method: 'PATCH',
  headers: getAuthHeaders(),
  body: JSON.stringify(body),
  });
  return handleResponse(response);
}

async function postFormData(endpoint, formData) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    headers: getAuthHeaders(true),
    body: formData,
  });
  return handleResponse(response);
}

async function put(endpoint, body) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });
  return handleResponse(response);
}

async function del(endpoint) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
}

// Aulas (catálogo)
export async function listarAulas(search = "") {
  const query = search ? `?search=${encodeURIComponent(search)}` : "";
  return get(`/aulas${query}`);
}

export async function criarAula(data) {
  return post(`/aulas`, data);
}

export async function atualizarAula(id, data) {
  return put(`/aulas/${id}`, data);
}

export async function deletarAula(id, mode) {
  const suffix = mode ? `?mode=${mode}` : "";
  return del(`/aulas/${id}${suffix}`);
}

// Horários (slots na grade)
const HORARIOS_AULAS_PATH = '/horarios-aulas';

function buildQuery(params = {}) {
  const query = new URLSearchParams();
  if (params.turmaId) query.append('turmaId', params.turmaId);
  if (params.diaSemana) query.append('diaSemana', params.diaSemana);
  const qs = query.toString();
  return qs ? `?${qs}` : '';
}

async function withFallback(primary, fallback) {
  try {
    return await primary();
  } catch (err) {
    if (!fallback) throw err;
    try {
      return await fallback();
    } catch {
      throw err;
    }
  }
}

export async function listarHorarios(params) {
  const query = buildQuery(params);
  return withFallback(
    () => get(`${HORARIOS_AULAS_PATH}${query}`),
    () => get(`/horarios${query}`)
  );
}

export async function criarHorario(data) {
  return withFallback(
    () => post(`${HORARIOS_AULAS_PATH}`, data),
    () => post(`/horarios`, data)
  );
}

export async function atualizarHorario(id, data) {
  return withFallback(
    () => put(`${HORARIOS_AULAS_PATH}/${id}`, data),
    () => put(`/horarios/${id}`, data)
  );
}

export async function deletarHorario(id) {
  return withFallback(
    () => del(`${HORARIOS_AULAS_PATH}/${id}`),
    () => del(`/horarios/${id}`)
  );
}

export async function validarHorario(data) {
  return withFallback(
    () => post(`${HORARIOS_AULAS_PATH}/validar`, data),
    () => post(`/horarios/validar`, data)
  );
}

function buildRelatorioQuery(params = {}) {
  const query = new URLSearchParams();

  if (params.grupo) query.append('grupo', params.grupo);
  if (params.tipo_funcionario) query.append('tipo_funcionario', params.tipo_funcionario);
  if (params.turma_id) query.append('turma_id', params.turma_id);
  if (params.periodo) query.append('periodo', params.periodo);
  if (params.data_inicio) query.append('data_inicio', params.data_inicio);
  if (params.data_fim) query.append('data_fim', params.data_fim);

  return query;
}

export async function getRelatorioAcessoResumo(params = {}) {
  const query = buildRelatorioQuery(params);
  const qs = query.toString();
  const suffix = qs ? `?${qs}` : '';

  return withFallback(
    () => get(`/api/relatorios/acesso/resumo${suffix}`),
    () => get(`/api/relatorios/acesso${suffix}`)
  );
}

export async function getRelatorioAcessoDetalhes(params = {}) {
  const query = buildRelatorioQuery(params);
  if (params.page) query.append('page', params.page);
  if (params.limit) query.append('limit', params.limit);

  const qs = query.toString();
  const suffix = qs ? `?${qs}` : '';

  return withFallback(
    () => get(`/api/relatorios/acesso/detalhes${suffix}`),
    () => get(`/api/relatorios/acesso${suffix}`)
  );
}

export async function getRelatorioTurmas() {
  return get('/api/relatorios/turmas');
}

// Acessos (entrada/saída)
export async function criarAcesso(data) {
  return post('/acessos', data);
}

export const api = {
  get,
  post,
  patch,
  put,
  delete: del,
  postFormData,
  listarAulas,
  criarAula,
  atualizarAula,
  deletarAula,
  listarHorarios,
  criarHorario,
  atualizarHorario,
  deletarHorario,
  validarHorario,
  getRelatorioAcessoResumo,
  getRelatorioAcessoDetalhes,
  getRelatorioTurmas,
  criarAcesso,
};