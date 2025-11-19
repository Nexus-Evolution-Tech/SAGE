// src/services/api.js

const API_URL = 'http://localhost:3000'; // A URL base da sua API

/**
 * Pega o token salvo no localStorage.
 */
function getToken() {
  return localStorage.getItem('token');
}

/**
 * Cria os cabeçalhos (headers) padrões com o token de autorização.
 */
function getAuthHeaders() {
  const token = getToken();
  const headers = new Headers();
  
  headers.append('Content-Type', 'application/json');
  
  if (token) {
    // Adiciona o cabeçalho de autorização 'Bearer'
    headers.append('Authorization', `Bearer ${token}`);
  }
  
  return headers;
}

/**
 * Função 'get' reutilizável que já inclui o token.
 * @param {string} endpoint - O caminho da API (ex: '/acessos')
 */
async function get(endpoint) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (response.status === 401) {
    // Token inválido ou expirado!
    // Limpa o token e redireciona para o login.
    localStorage.removeItem('token');
    window.location.href = '/login'; // Redireciona
    throw new Error('Não autorizado. Redirecionando para o login.');
  }

  if (!response.ok) {
    throw new Error(`Erro na requisição: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Função 'post' reutilizável que já inclui o token.
 * @param {string} endpoint - O caminho da API (ex: '/acessos')
 * @param {object} body - O corpo (payload) da requisição
 */
async function post(endpoint, body) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });

  if (response.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    throw new Error('Não autorizado. Redirecionando para o login.');
  }

  if (!response.ok) {
    throw new Error(`Erro na requisição: ${response.statusText}`);
  }

  return response.json();
}

// Exporte as funções que você quer usar em outros lugares
export const api = {
  get,
  post,
  // Você pode adicionar put, delete, etc. aqui
};