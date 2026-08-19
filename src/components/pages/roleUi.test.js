import { cleanup, render, screen } from '@testing-library/react';
import Settings from './Settings/Settings';
import Departamentos from './Departamentos/Departamentos';

jest.mock('../../services/api', () => ({
  api: {
    get: jest.fn().mockResolvedValue({}),
    patch: jest.fn(),
    post: jest.fn(),
    postFormData: jest.fn(),
  },
}));
jest.mock('@tanstack/react-query', () => ({
  useQuery: () => ({
    data: {
      turmas: [{ id: 1, nome: 'Ana' }],
      professores: [],
      administracao: [],
      terceirizados: [],
      responsaveis: [],
    },
    isLoading: false,
    error: null,
  }),
}));
jest.mock('react-router-dom', () => ({ useNavigate: () => jest.fn() }));

function setRole(papel) {
  const payload = btoa(JSON.stringify({ papel })).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  localStorage.setItem('token', `header.${payload}.signature`);
}

afterEach(() => {
  cleanup();
  localStorage.clear();
});

test('secretaria mantém Settings e troca de senha, sem dados da unidade ou catraca', () => {
  setRole('SECRETARIA');

  render(<Settings />);

  expect(screen.getByRole('heading', { name: 'Configurações' })).not.toBeNull();
  expect(screen.getByRole('heading', { name: 'Segurança' })).not.toBeNull();
  expect(screen.getByRole('button', { name: /Trocar senha/ })).not.toBeNull();
  expect(screen.queryByText('Dados da Unidade')).toBeNull();
  expect(screen.queryByText('Ferramentas – Catraca')).toBeNull();
});

test('administrador vê dados da unidade e ferramentas de catraca', () => {
  setRole('ADMINISTRADOR');

  render(<Settings />);

  expect(screen.getByText('Dados da Unidade')).not.toBeNull();
  expect(screen.getByText('Ferramentas – Catraca')).not.toBeNull();
  expect(screen.queryByRole('heading', { name: 'Segurança' })).toBeNull();
});

test('secretaria vê a listagem de Departamentos sem importar/exportar', () => {
  setRole('SECRETARIA');

  render(<Departamentos />);

  expect(screen.getByText('Departamentos')).not.toBeNull();
  expect(screen.getByText('Ana')).not.toBeNull();
  expect(screen.queryByTitle('Adicionar pessoas')).toBeNull();
  expect(screen.queryByTitle('Baixar planilha-modelo')).toBeNull();
  expect(screen.queryByTitle('Exportar dados')).toBeNull();
});

test('administrador mantém ações de Departamentos', () => {
  setRole('ADMINISTRADOR');

  render(<Departamentos />);

  expect(screen.getByTitle('Adicionar pessoas')).not.toBeNull();
  expect(screen.getByTitle('Baixar planilha-modelo')).not.toBeNull();
  expect(screen.getByTitle('Exportar dados')).not.toBeNull();
});
