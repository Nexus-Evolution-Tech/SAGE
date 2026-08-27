import React from "react";
import { ONBOARDING_STEPS, useOnboarding } from "../../../hooks/useOnboarding";

const pageStyle = { maxWidth: 840, margin: "0 auto", padding: "2rem 1rem", width: "100%" };
const listStyle = { display: "grid", gap: "0.75rem", padding: 0, listStyle: "none" };
const cardStyle = { display: "flex", alignItems: "center", gap: "1rem", padding: "1rem", border: "1px solid #e1e5ea", borderRadius: 8, background: "#fff" };

function stepStatus(step, projection) {
  if (!projection) return "Aguardando leitura";
  if (projection.completed_steps.includes(step.value)) return "Concluído";
  if (projection.current_step === step.value) return "Em andamento";
  if (projection.next_step === step.value) return "Próximo";
  return "Bloqueado";
}

function errorMessage(error) {
  if (error?.status === 401) return "Sua sessão expirou. Faça login novamente.";
  if (error?.status === 403) return "Acesso negado para esta configuração.";
  return "Não foi possível consultar o estado do onboarding.";
}

export default function Onboarding() {
  const { projection, loading, submitting, error, conflict, load, resume } = useOnboarding();
  const canRetry = error && error.status !== 401 && error.status !== 403;

  return (
    <main style={pageStyle} aria-labelledby="onboarding-title">
      <header style={{ marginBottom: "1.5rem" }}>
        <h1 id="onboarding-title">Configuração inicial</h1>
        <p style={{ marginTop: "0.5rem", color: "#586174" }}>
          Retome cada etapa na ordem indicada. Os estados exibidos são lógicos e não confirmam efeito físico.
        </p>
      </header>

      {loading && <p role="status">Lendo o estado salvo…</p>}
      {projection && <p>Estado lógico: <strong>{projection.status}</strong></p>}
      {conflict && (
        <div role="alert" style={{ margin: "1rem 0", color: "#7a4b00" }}>
          O estado mudou no servidor. A leitura foi atualizada; confirme a nova ação para retomar.
        </div>
      )}
      {error && (
        <div role="alert" style={{ margin: "1rem 0", color: "#a32121" }}>
          <span>{errorMessage(error)}</span>
          {canRetry && <button type="button" onClick={() => void load()} style={{ marginLeft: "0.75rem" }}>
            Tentar novamente
          </button>}
        </div>
      )}

      <ol style={listStyle} aria-label="Etapas do onboarding">
        {ONBOARDING_STEPS.map((step, index) => {
          const status = stepStatus(step, projection);
          const completed = status === "Concluído";
          const actionable = projection && !completed
            && (projection.current_step === step.value || projection.next_step === step.value);
          return (
            <li key={step.id} style={cardStyle}>
              <span aria-hidden="true" style={{ fontWeight: 700, minWidth: 24 }}>{index + 1}.</span>
              <span style={{ flex: 1 }}>
                <strong>{step.label}</strong>
                <span style={{ display: "block", color: "#586174", marginTop: "0.25rem" }}>{status}</span>
              </span>
              {actionable && (
                <button type="button" disabled={submitting} onClick={() => void resume(step.id)}>
                  {submitting ? "Enviando…" : "Retomar"}
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </main>
  );
}
