import { render } from '@testing-library/react';
import AuthInterceptor from './AuthInterceptor';
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({ useNavigate: () => mockNavigate })); jest.mock('../../contexts/NotificationContext', () => ({ useNotifications: () => ({ addNotification: jest.fn() }) })); jest.mock('../SessionExpiredModal/SessionExpiredModal', () => () => null);
afterEach(() => { mockNavigate.mockReset(); localStorage.clear(); });
test('auth-troca-senha leva à troca sem encerrar a sessão', () => {
  localStorage.setItem('token', 'token-ativo');
  render(<AuthInterceptor />);
  window.dispatchEvent(new Event('auth-troca-senha'));
  expect(mockNavigate).toHaveBeenCalledWith('/trocar-senha', { replace: true }); expect(localStorage.getItem('token')).toBe('token-ativo');
});
