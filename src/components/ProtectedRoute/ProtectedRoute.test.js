import { render, screen } from '@testing-library/react';
import ProtectedRoute from './ProtectedRoute';
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
