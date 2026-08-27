import { useCallback, useEffect, useState } from "react";

const API_URL = (process.env.REACT_APP_API_URL || "").replace(/\/$/, "");

export const ONBOARDING_STEPS = Object.freeze([
  { id: "escola-conta-administrador", value: "ESCOLA_CONTA_ADMINISTRADOR", label: "Escola e conta ADMINISTRADOR" },
  { id: "area", value: "AREA", label: "Área" },
  { id: "catraca", value: "CATRACA", label: "Catraca" },
  { id: "curso", value: "CURSO", label: "Curso" },
  { id: "turma", value: "TURMA", label: "Turma" },
  { id: "empresa", value: "EMPRESA", label: "Empresa" },
  { id: "sala", value: "SALA", label: "Sala" },
  { id: "pessoas", value: "PESSOAS", label: "Pessoas" },
]);

export class OnboardingRequestError extends Error {
  constructor(kind, status) {
    super(kind);
    this.name = "OnboardingRequestError";
    this.kind = kind;
    this.status = status;
  }
}

/** Seleciona somente a projeção pública; nenhum campo auxiliar vira estado da tela. */
export function selectOnboardingProjection(payload) {
  if (!payload || typeof payload !== "object" || !Array.isArray(payload.completed_steps)
    || !Number.isInteger(payload.version)) {
    throw new OnboardingRequestError("invalid-response");
  }

  return {
    status: payload.status,
    current_step: payload.current_step,
    completed_steps: payload.completed_steps,
    next_step: payload.next_step,
    version: payload.version,
  };
}

function authHeaders(extra = {}) {
  const headers = new Headers();
  const token = localStorage.getItem("token");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  Object.entries(extra).forEach(([name, value]) => headers.set(name, value));
  return headers;
}

async function requestOnboarding(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: authHeaders(options.headers),
  });

  if (response.status === 401) {
    localStorage.removeItem("token");
    window.dispatchEvent(new CustomEvent("auth-expired", {
      detail: { message: "Sua sessão expirou. Faça login novamente." },
    }));
    throw new OnboardingRequestError("unauthorized", 401);
  }

  if (!response.ok) {
    throw new OnboardingRequestError(
      response.status === 412 ? "conflict" : response.status === 403 ? "forbidden" : "request",
      response.status,
    );
  }

  return selectOnboardingProjection(await response.json());
}

export const getOnboarding = () => requestOnboarding("/onboarding", { method: "GET" });

export const resumeOnboardingStep = (step, version) => requestOnboarding(
  `/onboarding/steps/${encodeURIComponent(step)}/resume`,
  // O valor da versão é apenas serializado para o formato HTTP normativo: "version".
  { method: "POST", headers: { "If-Match": `"${version}"` } },
);

export function useOnboarding() {
  const [projection, setProjection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [conflict, setConflict] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const nextProjection = await getOnboarding();
      setProjection(nextProjection);
      return nextProjection;
    } catch (requestError) {
      setError(requestError instanceof OnboardingRequestError
        ? requestError : new OnboardingRequestError("network"));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const resume = useCallback(async (step) => {
    if (!projection) return null;
    setSubmitting(true);
    setError(null);
    setConflict(false);
    try {
      const nextProjection = await resumeOnboardingStep(step, projection.version);
      setProjection(nextProjection);
      return nextProjection;
    } catch (requestError) {
      if (requestError.status === 412) {
        setConflict(true);
        await load();
      } else {
        setError(requestError instanceof OnboardingRequestError
          ? requestError : new OnboardingRequestError("network"));
      }
      return null;
    } finally {
      setSubmitting(false);
    }
  }, [load, projection]);

  return { projection, loading, submitting, error, conflict, load, resume };
}
