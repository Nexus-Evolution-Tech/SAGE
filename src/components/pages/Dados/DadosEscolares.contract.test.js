import fs from 'fs';
import path from 'path';

const source = fs.readFileSync(path.join(__dirname, 'DadosEscolares.js'), 'utf8');
const settingsSource = fs.readFileSync(path.join(__dirname, '..', 'Settings', 'Settings.js'), 'utf8');

test('usa os endpoints, métodos e valores de turno aceitos pela API', () => {
  expect(source).toContain("sala: '/sala'");
  expect(source).toContain('api.patch(`${endpoint}/${editingItem.id}`');
  expect(source).not.toContain('api.put(`${endpoint}/${editingItem.id}`');
  expect(source).toContain('value="MATUTINO"');
  expect(source).toContain('value="VESPERTINO"');
  expect(source).toContain('value="NOTURNO"');
  expect(source).not.toContain('Filtrado por turmas existentes');
});

test('corpos de escrita nao espalham objetos lidos da API', () => {
  expect(source).not.toMatch(/api\.(post|patch)\([\s\S]{0,240}\.\.\.(item|formData)\b/);
  expect(settingsSource).not.toMatch(/api\.(post|patch)\([\s\S]{0,240}\.\.\.unidade\b/);
  expect(settingsSource).not.toContain('const payload = { ...unidade }');
  expect(source).not.toContain('const payload = { ...formData }');
});
