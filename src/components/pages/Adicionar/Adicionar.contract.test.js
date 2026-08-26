import fs from 'fs';
import path from 'path';

const source = fs.readFileSync(path.join(__dirname, 'Adicionar.js'), 'utf8');

test('nao inventa foto quando o cadastro nao informa uma', () => {
  expect(source).not.toContain('foto_exemplo.png');
  expect(source).toContain('value === "" ? null : value');
  expect(source).toContain('api.post("/pessoas", payload)');
});
