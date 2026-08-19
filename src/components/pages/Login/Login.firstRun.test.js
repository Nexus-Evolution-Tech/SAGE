import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Login from './Login';

jest.mock('react-router-dom', () => ({
  Link: ({ children }) => children,
  useNavigate: () => jest.fn()
}));

test('configura a unidade na tela inicial antes de mostrar o login', async () => {
  const fetchMock = jest.spyOn(global, 'fetch')
    .mockResolvedValueOnce({ ok: true, json: async () => ({ required: true }) })
    .mockResolvedValueOnce({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({ initialized: true, recoveryKey: 'recovery-key' })
    })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ data: [{ id: 1, nome: 'Escola', login: 'admin' }] }) });

  render(<Login />);
  expect(await screen.findByText('Configurar SAGE')).toBeTruthy();
  await userEvent.type(screen.getByPlaceholderText('Nome da unidade'), 'Escola');
  await userEvent.type(screen.getByPlaceholderText('Crie seu login'), 'admin');
  await userEvent.type(screen.getByPlaceholderText('Crie sua senha'), 'senha123');
  await userEvent.type(screen.getByPlaceholderText('Confirme sua senha'), 'senha123');
  await userEvent.click(screen.getByRole('button', { name: 'CRIAR ACESSO' }));

  await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/setup/initialize', expect.objectContaining({ method: 'POST' })));
  expect(await screen.findByText('Salve sua chave de recuperação')).toBeTruthy();
  await userEvent.click(screen.getByRole('checkbox', { name: /confirme que salvou a chave/i }));
  await userEvent.click(screen.getByRole('button', { name: 'CONCLUIR' }));
  expect(await screen.findByText('Login')).toBeTruthy();
  fetchMock.mockRestore();
});
