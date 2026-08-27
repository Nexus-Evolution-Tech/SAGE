import { act, renderHook, waitFor } from "@testing-library/react";
import {
  getOnboarding,
  resumeOnboardingStep,
  useOnboarding,
} from "./useOnboarding";

const originalFetch = global.fetch;
const initial = {
  status: "NAO_INICIADO", current_step: null, completed_steps: [],
  next_step: "ESCOLA_CONTA_ADMINISTRADOR", version: 0,
};

function response(body, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: jest.fn().mockResolvedValue(body) };
}

beforeEach(() => {
  localStorage.setItem("token", "token-sintetico");
  global.fetch = jest.fn();
});

afterEach(() => {
  global.fetch = originalFetch;
  localStorage.clear();
});

test("GET usa somente a projeção pública normativa", async () => {
  global.fetch.mockResolvedValue(response({ ...initial, payload_privado: "ignorado" }));

  await expect(getOnboarding()).resolves.toEqual(initial);
  expect(global.fetch).toHaveBeenCalledWith("/onboarding", expect.objectContaining({ method: "GET" }));
  expect(global.fetch.mock.calls[0][1].headers.get("Authorization")).toBe("Bearer token-sintetico");
});

test("resume usa o passo normativo, If-Match da version e nenhum body", async () => {
  global.fetch.mockResolvedValue(response({ ...initial, status: "EM_ANDAMENTO", version: 37 }));

  await resumeOnboardingStep("area", 37);
  const [url, options] = global.fetch.mock.calls[0];
  expect(url).toBe("/onboarding/steps/area/resume");
  expect(options.method).toBe("POST");
  expect(options.headers.get("If-Match")).toBe('"37"');
  expect(options).not.toHaveProperty("body");
});

test("reabrir a tela faz nova leitura, sem fonte de verdade local", async () => {
  global.fetch.mockResolvedValue(response(initial));
  const first = renderHook(() => useOnboarding());
  await waitFor(() => expect(first.result.current.projection).toEqual(initial));
  first.unmount();

  const second = renderHook(() => useOnboarding());
  await waitFor(() => expect(second.result.current.projection).toEqual(initial));
  expect(global.fetch).toHaveBeenCalledTimes(2);
  second.unmount();
});

test("falha de rede ou 5xx preserva a projeção e permite retry", async () => {
  const refreshed = { ...initial, status: "EM_ANDAMENTO", version: 1 };
  global.fetch
    .mockResolvedValueOnce(response(initial))
    .mockResolvedValueOnce(response({}, 503))
    .mockResolvedValueOnce(response(refreshed));
  const { result } = renderHook(() => useOnboarding());
  await waitFor(() => expect(result.current.projection).toEqual(initial));

  await act(async () => { await result.current.resume(initial.next_step); });
  expect(result.current.projection).toEqual(initial);
  expect(result.current.error.status).toBe(503);
  await act(async () => { await result.current.load(); });
  expect(result.current.projection).toEqual(refreshed);
});

test("412 relê o estado e não repete cegamente o POST", async () => {
  const refreshed = { ...initial, status: "EM_ANDAMENTO", version: 9 };
  global.fetch
    .mockResolvedValueOnce(response(initial))
    .mockResolvedValueOnce(response({}, 412))
    .mockResolvedValueOnce(response(refreshed));
  const { result } = renderHook(() => useOnboarding());
  await waitFor(() => expect(result.current.projection).toEqual(initial));

  await act(async () => { await result.current.resume(initial.next_step); });
  expect(result.current.projection).toEqual(refreshed);
  expect(result.current.conflict).toBe(true);
  expect(global.fetch.mock.calls.map(([, options]) => options.method)).toEqual(["GET", "POST", "GET"]);
});

test("401 segue o evento de expiração; 403 preserva a sessão", async () => {
  const expired = jest.fn();
  window.addEventListener("auth-expired", expired);
  global.fetch.mockResolvedValueOnce(response({}, 401));
  await expect(getOnboarding()).rejects.toMatchObject({ status: 401 });
  expect(localStorage.getItem("token")).toBeNull();
  expect(expired).toHaveBeenCalledTimes(1);
  window.removeEventListener("auth-expired", expired);

  localStorage.setItem("token", "token-sintetico");
  global.fetch.mockResolvedValue(response({}, 403));
  await expect(getOnboarding()).rejects.toMatchObject({ status: 403, kind: "forbidden" });
  expect(localStorage.getItem("token")).toBe("token-sintetico");
});

test("sem token não inventa credencial no cabeçalho", async () => {
  localStorage.clear();
  global.fetch.mockResolvedValue(response({}, 401));
  await expect(getOnboarding()).rejects.toMatchObject({ status: 401 });
  expect(global.fetch.mock.calls[0][1].headers.has("Authorization")).toBe(false);
});
