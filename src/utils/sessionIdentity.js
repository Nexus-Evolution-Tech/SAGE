const EMPTY_IDENTITY = Object.freeze({ papel: undefined, usuario_id: undefined });

/**
 * Lê identidade do JWT somente para apresentação da UI.
 * Autorização continua sendo responsabilidade exclusiva do servidor.
 */
export function getSessionIdentity(token = localStorage.getItem('token')) {
  if (typeof token !== 'string') return EMPTY_IDENTITY;

  try {
    const parts = token.split('.');
    if (parts.length !== 3 || !parts[1]) return EMPTY_IDENTITY;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')));

    return {
      papel: typeof payload.papel === 'string' ? payload.papel : undefined,
      usuario_id: payload.usuario_id ?? undefined
    };
  } catch (error) {
    return EMPTY_IDENTITY;
  }
}
