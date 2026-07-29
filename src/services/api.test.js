describe("API no mesmo origin", () => {
  const originalApiUrl = process.env.REACT_APP_API_URL;
  const originalFetch = global.fetch;

  afterEach(() => {
    if (originalApiUrl === undefined) {
      delete process.env.REACT_APP_API_URL;
    } else {
      process.env.REACT_APP_API_URL = originalApiUrl;
    }
    global.fetch = originalFetch;
    jest.resetModules();
  });

  test("usa caminhos relativos quando a URL não é configurada", () => {
    process.env.REACT_APP_API_URL = "";
    jest.resetModules();

    const { API_URL, getAreaPhotoUrl } = require("./api");

    expect(API_URL).toBe("");
    expect(getAreaPhotoUrl("/areas/foto.jpg")).toBe("/uploads/areas/foto.jpg");
  });

  test("agenda usa somente o contrato canônico", async () => {
    process.env.REACT_APP_API_URL = "";
    global.fetch = jest.fn().mockResolvedValue({ status: 204 });
    const api = require("./api");

    await api.listarHorarios({ turmaId: 7, diaSemana: "TERCA" });
    await api.criarHorario({ aulaId: 1 });
    await api.atualizarHorario(2, { aulaId: 1 });
    await api.deletarHorario(3);
    await api.validarHorario({ aulaId: 1 });

    expect(global.fetch.mock.calls.map(([url, options]) => [url, options.method])).toEqual([
      ["/horarios-aulas?turmaId=7&diaSemana=TERCA", "GET"],
      ["/horarios-aulas", "POST"],
      ["/horarios-aulas/2", "PUT"],
      ["/horarios-aulas/3", "DELETE"],
      ["/horarios-aulas/validar", "POST"],
    ]);
  });

  test("erro canônico não dispara chamada ao contrato descontinuado", async () => {
    process.env.REACT_APP_API_URL = "";
    global.fetch = jest.fn().mockResolvedValue({
      status: 500,
      statusText: "Internal Server Error",
      ok: false,
      clone() { return this; },
      json: jest.fn().mockResolvedValue({ message: "falha canônica" }),
    });
    const { listarHorarios } = require("./api");

    await expect(listarHorarios()).rejects.toThrow("falha canônica");
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith("/horarios-aulas", expect.any(Object));
  });
});
