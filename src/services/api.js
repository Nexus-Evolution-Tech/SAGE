// src/services/api.js

const API_URL = 'http://localhost:3000';

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
  
  // Tenta parsear JSON
  const data = await response.json();

  if (!response.ok) {
  // Joga um erro com a mensagem da API
  throw new Error(data.message || `Erro na requisição: ${response.statusText}`);
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
  const response = await fetch(`${API_URL}${endpoint}`, {
  method: 'GET',
  headers: getAuthHeaders(),
  });
  return handleResponse(response);
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

export const api = {
  get,
  post,
  patch,
  postFormData,
};