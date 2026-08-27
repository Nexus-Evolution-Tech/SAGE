import { act, renderHook, waitFor } from "@testing-library/react";
import { getOnboarding, resumeOnboardingStep, useOnboarding } from "./useOnboarding";

const originalFetch = global.fetch;
const initial = { status: "NAO_INICIADO", current_step: null, completed_steps: [], next_step: "ESCOLA_CONTA_ADMINISTRADOR", version: 0 };
const response = (body, status = 200) => ({ ok: status >= 200 && status < 300, status, json: jest.fn().mockResolvedValue(body) });

beforeEach(() => { localStorage.setItem("token", "token-sintetico"); global.fetch = jest.fn(); });
afterEach(() => { global.fetch = originalFetch; localStorage.clear(); });

test("GET usa somente os cinco nomes normativos", async () => {
  global.fetch.mockResolvedValue(response({ ...initial, payload_privado: "ignorado" }));
  const data = await getOnboarding();
  expect(data).toEqual(initial);
  expect(Object.keys(data)).toEqual(["status", "current_step", "completed_steps", "next_step", "version"]);
  expect(global.fetch.mock.calls[0][1].method).toBe("GET");
});

test("resume usa passo/If-Match normativos e POST sem corpo", async () => {
  global.fetch.mockResolvedValue(response({ ...initial, status: "EM_ANDAMENTO", version: 37 }));
  await resumeOnboardingStep("area", 37);
  const [url, options] = global.fetch.mock.calls[0];
  expect(url).toBe("/onboarding/steps/area/resume"); expect(options).toMatchObject({ method: "POST" });
  expect(options.headers.get("If-Match")).toBe('"37"'); expect(options).not.toHaveProperty("body");
});

test("reabrir relê o servidor", async () => {
  global.fetch.mockResolvedValue(response(initial));
  const first = renderHook(() => useOnboarding());
  await waitFor(() => expect(first.result.current.projection).toEqual(initial)); first.unmount();
  const second = renderHook(() => useOnboarding());
  await waitFor(() => expect(second.result.current.projection).toEqual(initial)); second.unmount();
  expect(global.fetch).toHaveBeenCalledTimes(2);
});

test("rede/5xx preserva projeção e permite retry", async () => {
  const refreshed = { ...initial, status: "EM_ANDAMENTO", version: 1 };
  global.fetch.mockResolvedValueOnce(response(initial)).mockRejectedValueOnce(new Error("rede"))
    .mockResolvedValueOnce(response({}, 503)).mockResolvedValueOnce(response(refreshed));
  const { result } = renderHook(() => useOnboarding());
  await waitFor(() => expect(result.current.projection).toEqual(initial));
  await act(async () => { await result.current.resume(initial.next_step); });
  expect(result.current.projection).toEqual(initial); expect(result.current.error.kind).toBe("network");
  await act(async () => { await result.current.resume(initial.next_step); });
  expect(result.current.projection).toEqual(initial); expect(result.current.error.status).toBe(503);
  await act(async () => { await result.current.load(); }); expect(result.current.projection).toEqual(refreshed);
});

test("412 relê versão nova sem repetir POST", async () => {
  const refreshed = { ...initial, status: "EM_ANDAMENTO", version: 9 };
  global.fetch.mockResolvedValueOnce(response(initial)).mockResolvedValueOnce(response({}, 412)).mockResolvedValueOnce(response(refreshed));
  const { result } = renderHook(() => useOnboarding());
  await waitFor(() => expect(result.current.projection).toEqual(initial));
  await act(async () => { await result.current.resume(initial.next_step); });
  expect(result.current.projection).toEqual(refreshed); expect(result.current.conflict).toBe(true);
  expect(global.fetch.mock.calls.map(([, options]) => options.method)).toEqual(["GET", "POST", "GET"]);
});

test("sem token, 401 e 403 seguem a autenticação existente", async () => {
  const expired = jest.fn(); window.addEventListener("auth-expired", expired);
  global.fetch.mockResolvedValueOnce(response({}, 401));
  await expect(getOnboarding()).rejects.toMatchObject({ status: 401 });
  expect(localStorage.getItem("token")).toBeNull(); expect(expired).toHaveBeenCalledTimes(1);
  localStorage.setItem("token", "token-sintetico"); global.fetch.mockResolvedValueOnce(response({}, 403));
  await expect(getOnboarding()).rejects.toMatchObject({ status: 403, kind: "forbidden" });
  expect(localStorage.getItem("token")).toBe("token-sintetico"); window.removeEventListener("auth-expired", expired);
  localStorage.clear(); global.fetch.mockResolvedValueOnce(response({}, 401));
  await expect(getOnboarding()).rejects.toMatchObject({ status: 401 });
  expect(global.fetch.mock.calls[2][1].headers.has("Authorization")).toBe(false);
});
