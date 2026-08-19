export const SESSION_STORAGE_KEY = "session";
export function getSession() {
  try {
    const stored = JSON.parse(localStorage.getItem(SESSION_STORAGE_KEY) || "{}");
    return { ...stored, token: localStorage.getItem("token") || stored.token,
      precisa_trocar_senha: Boolean(stored.precisa_trocar_senha) };
  } catch {
    return { token: localStorage.getItem("token"), precisa_trocar_senha: false };
  }
}
export function saveSession(data) {
  const session = { ...data, precisa_trocar_senha: Boolean(data?.precisa_trocar_senha) };
  localStorage.setItem("token", session.token);
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}
export function setPasswordChangeRequired(required) { localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ ...getSession(), precisa_trocar_senha: Boolean(required) })); }
