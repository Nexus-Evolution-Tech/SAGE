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

// Objeto centralizador para facilitar o uso em componentes antigos
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
  validarHorario
};

// ==========================================================
// --- SAGE RELATÓRIOS API (MOCKS PARA DESENVOLVIMENTO) ---
// ==========================================================

export const getRelatorioAcessoResumo = async (filtros) => {
  console.log('[API Mock] Buscando resumo com filtros:', filtros);
  return { 
    metricas: { 
      total: 101, 
      no_horario: 95, 
      atrasados: 5, 
      faltantes: 1,
      percentual_presenca: 94.05
    }, 
    dados_pizza: [
      { label: "No Horário", value: 95, color: "#4CAF50" },
      { label: "Atrasados", value: 5, color: "#FFC107" },
      { label: "Faltantes", value: 1, color: "#F44336" }
    ], 
    dados_linha: [
      { label: "07:30", no_horario: 40, atrasados: 2, faltantes: 1 },
      { label: "08:20", no_horario: 30, atrasados: 2, faltantes: 0 },
      { label: "09:10", no_horario: 25, atrasados: 1, faltantes: 0 }
    ] 
  };
};

export const getRelatorioAcessoDetalhes = async (filtros) => {
  return { 
    dados: [
      { id: 1, nome: "João Silva", status: "NO_HORARIO", horario_previsto: "07:30", horario_chegada: "07:25" },
      { id: 2, nome: "Maria Souza", status: "ATRASADO", horario_previsto: "07:30", horario_chegada: "07:45" }
    ] 
  };
};

export const getRelatorioTurmas = async () => {
  return [
    { id: 1, nome: "1º Ano A - Informática" },
    { id: 2, nome: "2º Ano A - Informática" },
    { id: 3, nome: "3º Ano A - Informática" }
  ];
};