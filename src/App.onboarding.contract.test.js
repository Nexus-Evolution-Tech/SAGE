import fs from "fs";
import path from "path";

const appSource = fs.readFileSync(path.join(__dirname, "App.js"), "utf8");
const loginSource = fs.readFileSync(path.join(__dirname, "components/pages/Login/Login.js"), "utf8");
const onboardingSource = [
  fs.readFileSync(path.join(__dirname, "hooks/useOnboarding.js"), "utf8"),
  fs.readFileSync(path.join(__dirname, "components/pages/Onboarding/Onboarding.js"), "utf8"),
].join("\n");

test("/onboarding fica sob autenticação e ACL administrativa existentes", () => {
  expect(appSource).toMatch(
    /<Route element={<ProtectedRoute \/>}>[\s\S]*<Route element={<AdminOnlyRoute \/>}>[\s\S]*<Route path="\/onboarding" element={<Onboarding \/>} \/>/,
  );
});

test("regressão preserva o fluxo legado /setup", () => {
  expect(loginSource).toContain("/setup/initialize");
  expect(loginSource).toContain("Configurar SAGE");
  expect(appSource).not.toContain('path="/setup"');
});

test("o pacote não adiciona escrita de entidades, hardware ou anúncio físico", () => {
  expect(onboardingSource).not.toMatch(/\/(?:setup|escolas|areas|pessoas|dispositivos|usuarios|catracas)(?:["'`/]|$)/i);
  expect(onboardingSource).not.toMatch(/liberar acesso|sincroniz|networkDiscovery|create_objects|patch\(|put\(/i);
});
