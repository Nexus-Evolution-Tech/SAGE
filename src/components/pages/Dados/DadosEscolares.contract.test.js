import fs from 'fs';
import path from 'path';

const source = fs.readFileSync(path.join(__dirname, 'DadosEscolares.js'), 'utf8');

test('usa os endpoints, métodos e valores de turno aceitos pela API', () => {
  expect(source).toContain("sala: '/sala'");
  expect(source).toContain('api.patch(`${endpoint}/${editingItem.id}`');
  expect(source).not.toContain('api.put(`${endpoint}/${editingItem.id}`');
  expect(source).toContain('value="MATUTINO"');
  expect(source).toContain('value="VESPERTINO"');
  expect(source).toContain('value="NOTURNO"');
  expect(source).not.toContain('Filtrado por turmas existentes');
});
