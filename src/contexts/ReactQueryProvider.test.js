import { render, screen } from '@testing-library/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ReactQueryProvider, queryClient } from './ReactQueryProvider';

function IdentityData({ value, onClient }) {
  const client = useQueryClient();
  const { data } = useQuery({
    queryKey: ['identity-data'],
    queryFn: async () => value,
  });

  onClient(client);
  return <output>{data || 'carregando'}</output>;
}

afterEach(() => queryClient.clear());

test('limpa cache do singleton antes de consultar a nova identidade', async () => {
  const clients = [];
  const { rerender } = render(
    <ReactQueryProvider>
      <IdentityData value="A" onClient={(client) => clients.push(client)} />
    </ReactQueryProvider>,
  );

  expect(await screen.findByText('A')).toBeTruthy();
  expect(clients.at(-1)).toBe(queryClient);
  expect(queryClient.getQueryData(['identity-data'])).toBe('A');

  window.dispatchEvent(new Event('auth-changed'));
  expect(queryClient.getQueryData(['identity-data'])).toBeUndefined();

  rerender(
    <ReactQueryProvider>
      <IdentityData value="B" onClient={(client) => clients.push(client)} />
    </ReactQueryProvider>,
  );

  expect(await screen.findByText('B')).toBeTruthy();
  expect(queryClient.getQueryData(['identity-data'])).toBe('B');
  expect(clients.at(-1)).toBe(queryClient);
});

test('logout e expiração também limpam o cache do singleton', () => {
  const { unmount } = render(
    <ReactQueryProvider>
      <div />
    </ReactQueryProvider>,
  );

  queryClient.setQueryData(['identity-data'], 'A');
  window.dispatchEvent(new Event('auth-changed'));
  expect(queryClient.getQueryData(['identity-data'])).toBeUndefined();

  queryClient.setQueryData(['identity-data'], 'A');
  window.dispatchEvent(new Event('auth-expired'));
  expect(queryClient.getQueryData(['identity-data'])).toBeUndefined();

  unmount();
});
