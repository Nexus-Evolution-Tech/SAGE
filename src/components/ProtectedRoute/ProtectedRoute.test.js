import { render, screen } from '@testing-library/react';
import ProtectedRoute, { AdminOnlyRoute } from './ProtectedRoute';
let mockPathname = '/inicio';
jest.mock('react-router-dom', () => ({
  Navigate: ({ to }) => <div data-testid="navigate">{to}</div>,
  Outlet: () => <div>Rota protegida</div>,
  useLocation: () => ({ pathname: mockPathname }),
}));
afterEach(() => localStorage.clear());
test('flag ativa bloqueia rota protegida e leva à troca', () => {
  localStorage.setItem('token', 'token-ativo'); localStorage.setItem('session', JSON.stringify({ precisa_trocar_senha: true }));
  mockPathname = '/configuracoes'; render(<ProtectedRoute />);
  expect(screen.getByTestId('navigate').textContent).toBe('/trocar-senha'); expect(screen.queryByText('Rota protegida')).toBeNull();
});
test('sem token redireciona para a raiz', () => {
  render(<ProtectedRoute />); expect(screen.getByTestId('navigate').textContent).toBe('/');
});

function jwt(papel) {
  const payload = btoa(JSON.stringify({ papel })).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `header.${payload}.signature`;
}

test.each(['SECRETARIA', 'invalido'])('papel %s não renderiza rota administrativa', (papel) => {
  localStorage.setItem('token', jwt(papel));
  render(<AdminOnlyRoute />);
  expect(screen.getByTestId('navigate').textContent).toBe('/inicio');
  expect(screen.queryByText('Rota protegida')).toBeNull();
});

test('administrador renderiza rota administrativa', () => {
  localStorage.setItem('token', jwt('ADMINISTRADOR'));
  render(<AdminOnlyRoute />);
  expect(screen.getByText('Rota protegida')).not.toBeNull();
  expect(screen.queryByTestId('navigate')).toBeNull();
});
