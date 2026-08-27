import fs from "fs";
import path from "path";

const appSource = fs.readFileSync(path.join(__dirname, "App.js"), "utf8");
const loginSource = fs.readFileSync(path.join(__dirname, "components/pages/Login/Login.js"), "utf8");
const onboardingSource = ["hooks/useOnboarding.js", "components/pages/Onboarding/Onboarding.js"]
  .map((file) => fs.readFileSync(path.join(__dirname, file), "utf8")).join("\n");

test("/onboarding fica sob os guards existentes", () => expect(appSource).toMatch(
  /<Route element={<ProtectedRoute \/>}>[\s\S]*<Route element={<AdminOnlyRoute \/>}>[\s\S]*<Route path="\/onboarding" element={<Onboarding \/>} \/>/,
));
test("/setup legado permanece e o pacote não escreve negócio/hardware/PII", () => {
  expect(loginSource).toContain("/setup/initialize"); expect(loginSource).toContain("Configurar SAGE"); expect(appSource).not.toContain('path="/setup"');
  expect(onboardingSource).not.toMatch(/\/(?:setup|escolas|areas|pessoas|dispositivos|usuarios|catracas)(?:["'`/]|$)/i);
  expect(onboardingSource).not.toMatch(/liberar acesso|sincroniz|networkDiscovery|create_objects|patch\(|put\(|\b(?:cpf|rg|email|telefone|endereço|foto|qr_code|senha)\b/i);
});
