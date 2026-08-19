import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Login from './Login';
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({ Link: ({ children }) => children, useNavigate: () => mockNavigate }));
afterEach(() => { localStorage.clear(); jest.restoreAllMocks(); mockNavigate.mockReset(); });
test('login com troca obrigatória guarda sessão e não vai para início', async () => {
  const authChanged = jest.fn(); window.addEventListener('auth-changed', authChanged);
  jest.spyOn(global, 'fetch')
    .mockResolvedValueOnce({ ok: true, json: async () => ({ required: false }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ data: [{ id: 1, nome: 'Escola', login: 'admin' }] }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ token: 'token-ativo', precisa_trocar_senha: true }) });
  render(<Login />);
  await userEvent.type(await screen.findByPlaceholderText('Senha'), 'senha-atual');
  await userEvent.click(screen.getByRole('button', { name: 'ENTRAR' }));
  await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/trocar-senha'));
  expect(mockNavigate).not.toHaveBeenCalledWith('/inicio');
  expect(JSON.parse(localStorage.getItem('session'))).toMatchObject({ token: 'token-ativo', precisa_trocar_senha: true });
  expect(authChanged).toHaveBeenCalledTimes(1); window.removeEventListener('auth-changed', authChanged);
});
