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

  test("busca a foto da pessoa pelo endpoint autenticado e usa fallback neutro", async () => {
    process.env.REACT_APP_API_URL = "https://sage.test";
    localStorage.setItem("token", "token-de-teste");
    const blob = new Blob(["foto"], { type: "image/png" });
    global.fetch = jest.fn().mockResolvedValue({
      status: 200,
      ok: true,
      blob: jest.fn().mockResolvedValue(blob),
    });
    global.URL.createObjectURL = jest.fn().mockReturnValue("blob:foto-pessoa");
    const { getPessoaFotoUrl } = require("./api");

    await expect(getPessoaFotoUrl(42)).resolves.toBe("blob:foto-pessoa");
    expect(global.fetch).toHaveBeenCalledWith(
      "https://sage.test/pessoas/42/foto",
      expect.objectContaining({
        method: "GET",
        headers: expect.any(Headers),
      }),
    );
    expect(global.fetch.mock.calls[0][1].headers.get("Authorization")).toBe(
      "Bearer token-de-teste",
    );
  });

  test.each([401, 403, 404])("foto %i vira fallback sem URL pública", async (status) => {
    process.env.REACT_APP_API_URL = "";
    global.fetch = jest.fn().mockResolvedValue({
      status,
      ok: false,
      json: jest.fn().mockResolvedValue({}),
    });
    const { getPessoaFotoUrl } = require("./api");

    await expect(getPessoaFotoUrl(42)).resolves.toBeNull();
    expect(global.URL.createObjectURL).not.toHaveBeenCalled();
  });

  test("revoga somente blob URLs de fotos", () => {
    global.URL.revokeObjectURL = jest.fn();
    const { revokePessoaFotoUrl } = require("./api");

    revokePessoaFotoUrl("blob:foto-pessoa");
    revokePessoaFotoUrl("/img/user.png");
    revokePessoaFotoUrl(null);

    expect(global.URL.revokeObjectURL).toHaveBeenCalledTimes(1);
    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith("blob:foto-pessoa");
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
