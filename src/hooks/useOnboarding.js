import { useCallback, useEffect, useState } from "react";

const API_URL = (process.env.REACT_APP_API_URL || "").replace(/\/$/, "");
const stepData = [
  ["escola-conta-administrador", "ESCOLA_CONTA_ADMINISTRADOR", "Escola e conta ADMINISTRADOR"],
  ["area", "AREA", "Área"], ["catraca", "CATRACA", "Catraca"], ["curso", "CURSO", "Curso"],
  ["turma", "TURMA", "Turma"], ["empresa", "EMPRESA", "Empresa"], ["sala", "SALA", "Sala"],
  ["pessoas", "PESSOAS", "Pessoas"],
];
export const ONBOARDING_STEPS = Object.freeze(stepData.map(([id, value, label]) => ({ id, value, label })));

export class OnboardingRequestError extends Error {
  constructor(kind, status) { super(kind); this.name = "OnboardingRequestError"; this.kind = kind; this.status = status; }
}

/** A projeção pública não permite que campos auxiliares virem estado da tela. */
export function selectOnboardingProjection(payload) {
  if (!payload || typeof payload !== "object" || !Array.isArray(payload.completed_steps)
    || !Number.isInteger(payload.version)) throw new OnboardingRequestError("invalid-response");
  const { status, current_step, completed_steps, next_step, version } = payload;
  return { status, current_step, completed_steps, next_step, version };
}

const safeError = (error) => error instanceof OnboardingRequestError
  ? error : new OnboardingRequestError("network");

function authHeaders(extra = {}) {
  const headers = new Headers();
  const token = localStorage.getItem("token");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  Object.entries(extra).forEach(([name, value]) => headers.set(name, value));
  return headers;
}

async function requestOnboarding(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, { ...options, headers: authHeaders(options.headers) });
  if (response.status === 401) {
    localStorage.removeItem("token");
    window.dispatchEvent(new CustomEvent("auth-expired", {
      detail: { message: "Sua sessão expirou. Faça login novamente." },
    }));
    throw new OnboardingRequestError("unauthorized", 401);
  }
  if (!response.ok) {
    throw new OnboardingRequestError(response.status === 412 ? "conflict" : response.status === 403 ? "forbidden" : "request", response.status);
  }
  return selectOnboardingProjection(await response.json());
}

export const getOnboarding = () => requestOnboarding("/onboarding", { method: "GET" });
export const resumeOnboardingStep = (step, version) => requestOnboarding(
  `/onboarding/steps/${encodeURIComponent(step)}/resume`,
  // Apenas a serialização HTTP normativa do valor de version: "version".
  { method: "POST", headers: { "If-Match": `"${version}"` } },
);

export function useOnboarding() {
  const [projection, setProjection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [conflict, setConflict] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { const data = await getOnboarding(); setProjection(data); return data; }
    catch (requestError) { setError(safeError(requestError)); return null; }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const resume = useCallback(async (step) => {
    if (!projection) return null;
    setSubmitting(true); setError(null); setConflict(false);
    try { const data = await resumeOnboardingStep(step, projection.version); setProjection(data); return data; }
    catch (requestError) {
      if (requestError.status === 412) { setConflict(true); await load(); }
      else setError(safeError(requestError));
      return null;
    } finally { setSubmitting(false); }
  }, [load, projection]);

  return { projection, loading, submitting, error, conflict, load, resume };
}
