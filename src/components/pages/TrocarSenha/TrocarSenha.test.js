import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { api } from '../../../services/api';
import { TrocarSenhaForm } from './TrocarSenha';
jest.mock('../../../services/api', () => ({ api: { patch: jest.fn() } }));
jest.mock('react-router-dom', () => ({ useNavigate: () => jest.fn() }));
const fillForm = async (password) => {
  await userEvent.type(screen.getByLabelText('Senha atual'), 'senha-atual');
  await userEvent.type(screen.getByLabelText('Nova senha'), password);
  await userEvent.type(screen.getByLabelText('Confirmar nova senha'), password);
  fireEvent.submit(screen.getByRole('form', { name: 'Troca de senha' }));
};
afterEach(() => { localStorage.clear(); jest.clearAllMocks(); });
test.each(['123456', '1234567'])('recusa senha nova com %i caracteres no cliente', async (password) => {
  render(<TrocarSenhaForm />); await fillForm(password);
  expect(await screen.findByText('A nova senha deve ter no mínimo 8 caracteres.')).toBeTruthy();
  expect(api.patch).not.toHaveBeenCalled();
});
test('sucesso baixa flag, mantém token e libera sem relogin', async () => {
  localStorage.setItem('token', 'token-ativo');
  localStorage.setItem('session', JSON.stringify({ token: 'token-ativo', precisa_trocar_senha: true }));
  api.patch.mockResolvedValue({});
  const authChanged = jest.fn(); const onSuccess = jest.fn(); window.addEventListener('auth-changed', authChanged);
  render(<TrocarSenhaForm onSuccess={onSuccess} />); await fillForm('senha-nova');
  await waitFor(() => expect(api.patch).toHaveBeenCalledWith('/unidade/trocar-senha', { senha_atual: 'senha-atual', nova_senha: 'senha-nova' }));
  expect(JSON.parse(localStorage.getItem('session'))).toMatchObject({ token: 'token-ativo', precisa_trocar_senha: false });
  expect(localStorage.getItem('token')).toBe('token-ativo'); expect(authChanged).toHaveBeenCalledTimes(1); expect(onSuccess).toHaveBeenCalledTimes(1);
  window.removeEventListener('auth-changed', authChanged);
});
