import { fireEvent, render, screen } from "@testing-library/react";
import Onboarding from "./Onboarding";
import { useOnboarding } from "../../../hooks/useOnboarding";

jest.mock("../../../hooks/useOnboarding", () => ({ ...jest.requireActual("../../../hooks/useOnboarding"), useOnboarding: jest.fn() }));
const projection = { status: "EM_ANDAMENTO", current_step: "CATRACA", completed_steps: ["ESCOLA_CONTA_ADMINISTRADOR", "AREA"], next_step: "CATRACA", version: 2 };
afterEach(() => jest.clearAllMocks());

test("mostra oito passos, concluídos, atual acionável e demais bloqueados", () => {
  const resume = jest.fn();
  useOnboarding.mockReturnValue({ projection, loading: false, submitting: false, error: null, conflict: false, load: jest.fn(), resume });
  render(<Onboarding />);
  expect(screen.getAllByRole("listitem")).toHaveLength(8); expect(screen.getAllByRole("button", { name: "Retomar" })).toHaveLength(1);
  expect(screen.getAllByText("Concluído")).toHaveLength(2); expect(screen.getByText("Em andamento")).toBeTruthy(); expect(screen.getAllByText("Bloqueado")).toHaveLength(5);
  fireEvent.click(screen.getByRole("button", { name: "Retomar" })); expect(resume).toHaveBeenCalledWith("catraca");
});

test("403 não faz loop, rede oferece retry e 412 não anuncia hardware", () => {
  const load = jest.fn();
  useOnboarding.mockReturnValue({ projection: null, loading: false, submitting: false, error: { status: 403 }, conflict: false, load, resume: jest.fn() });
  const view = render(<Onboarding />);
  expect(screen.getByText("Acesso negado para esta configuração.")).toBeTruthy(); expect(screen.queryByRole("button", { name: "Tentar novamente" })).toBeNull();
  useOnboarding.mockReturnValue({ projection, loading: false, submitting: false, error: { kind: "network" }, conflict: true, load, resume: jest.fn() }); view.rerender(<Onboarding />);
  fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" })); expect(load).toHaveBeenCalledTimes(1); expect(screen.getByText(/estado mudou no servidor/i)).toBeTruthy();
  expect(screen.queryByRole("button", { name: /liberar acesso/i })).toBeNull();
});
