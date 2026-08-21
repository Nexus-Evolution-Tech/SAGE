import fs from "fs";
import path from "path";

test("não inventa foto quando o formulário não fornece uma", () => {
  const fonte = fs.readFileSync(path.join(__dirname, "Adicionar.js"), "utf8");
  expect(fonte).not.toContain("foto_exemplo.png");
});
