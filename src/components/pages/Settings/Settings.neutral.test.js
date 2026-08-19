import fs from "fs";
import path from "path";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import Settings from "./Settings";
import { api } from "../../../services/api";

jest.mock("../../../services/api", () => ({
  api: {
    get: jest.fn(),
    patch: jest.fn(),
    post: jest.fn(),
    postFormData: jest.fn(),
  },
}));
jest.mock("react-router-dom", () => ({ useNavigate: () => jest.fn() }));

function setAdmin() {
  const payload = btoa(JSON.stringify({ papel: "ADMINISTRADOR" }))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  localStorage.setItem("token", `header.${payload}.signature`);
}

afterEach(() => {
  cleanup();
  localStorage.clear();
  jest.clearAllMocks();
});

test("falha de /unidade mantém a tela neutra e ignora sage_unidade", async () => {
  setAdmin();
  localStorage.setItem("sage_unidade", JSON.stringify({ nome: "Escola armazenada" }));
  api.get.mockImplementation((endpoint) => {
    if (endpoint === "/unidade") return Promise.reject(new Error("indisponível"));
    if (endpoint === "/dispositivos") return Promise.resolve([]);
    return Promise.resolve({});
  });

  render(<Settings />);

  await waitFor(() => expect(api.get).toHaveBeenCalledWith("/unidade"));
  expect(screen.queryByText("Escola armazenada")).toBeNull();
  expect(screen.getAllByText("—").length).toBeGreaterThan(0);
});

test("resposta de /unidade preserva o carregamento ADMIN", async () => {
  setAdmin();
  api.get.mockImplementation((endpoint) => {
    if (endpoint === "/unidade") return Promise.resolve({ nome: "Escola da API", cnpj: "api-cnpj" });
    if (endpoint === "/dispositivos") return Promise.resolve([]);
    return Promise.resolve({});
  });

  render(<Settings />);

  expect(await screen.findByText("Escola da API")).not.toBeNull();
  expect(screen.getByText("api-cnpj")).not.toBeNull();
});

function productionSource() {
  const srcRoot = path.resolve(__dirname, "../../..");
  const files = [];
  const visit = (directory) => {
    fs.readdirSync(directory, { withFileTypes: true }).forEach((entry) => {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(file);
      else if (!/\.test\.[jt]sx?$/.test(entry.name)) files.push(fs.readFileSync(file, "utf8"));
    });
  };
  visit(srcRoot);
  return files.join("\n");
}

test("guard impede que os valores medidos da unidade voltem ao código de produção", () => {
  const valoresMedidos = [
    ["628232", "57000109"].join(""),
    ["62.823.", "257/0001-09"].join(""),
    ["Rua Pedro", " Bracale"].join(""),
    ["Rua Pedro Bracale, ", "79"].join(""),
    ["Jardim Maria", " Rosa"].join(""),
    ["06764", "230"].join(""),
    ["06764-", "230"].join(""),
    ["11478", "88150"].join(""),
    ["(11) 4788", "-8150"].join(""),
  ];
  const source = productionSource();

  valoresMedidos.forEach((valor) => expect(source).not.toContain(valor));
});
