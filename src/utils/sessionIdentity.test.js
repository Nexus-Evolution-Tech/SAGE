import { getSessionIdentity } from './sessionIdentity';

function jwt(payload) {
  const encoded = btoa(JSON.stringify(payload))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  return `header.${encoded}.signature`;
}

afterEach(() => localStorage.clear());

test('lê papel e usuario_id para identidade cosmética', () => {
  localStorage.setItem('token', jwt({ papel: 'secretaria', usuario_id: 42 }));

  expect(getSessionIdentity()).toEqual({ papel: 'secretaria', usuario_id: 42 });
});

test.each([null, '', 'invalido', 'a.@@@.c'])('token %p resulta em UI mínima', (token) => {
  if (token !== null) localStorage.setItem('token', token);

  expect(getSessionIdentity()).toEqual({ papel: undefined, usuario_id: undefined });
});
