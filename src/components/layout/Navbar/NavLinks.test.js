import { getVisibleNavLinks } from './NavLinks';

test.each([
  ['SECRETARIA', false],
  [undefined, false],
  ['ADMINISTRADOR', true],
])('visibilidade do menu para %s', (papel, isAdmin) => {
  const labels = getVisibleNavLinks(papel).map((link) => link.label);

  expect(labels.includes('Monitoramento')).toBe(isAdmin);
  expect(labels.includes('Dispositivos')).toBe(isAdmin);
  expect(labels).toContain('Departamentos');
});
