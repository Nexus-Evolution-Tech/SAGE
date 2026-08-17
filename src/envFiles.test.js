const fs = require('fs');
const path = require('path');

describe('arquivos de ambiente distribuíveis', () => {
  it('mantém somente URLs same-origin vazias em REACT_APP_*', () => {
    const allowed = new Set(['REACT_APP_API_URL', 'REACT_APP_SOCKET_PATH']);
    for (const name of ['.env', '.env.example', '.env.production']) {
      const content = fs.readFileSync(path.join(__dirname, '..', name), 'utf8');
      const variables = [...content.matchAll(/^[ \t]*(REACT_APP_[A-Z0-9_]+)[ \t]*=[ \t]*([^\r\n]*)$/gmi)];
      for (const [, key, value] of variables) {
        expect(allowed.has(key)).toBe(true);
        expect(value.trim()).toBe('');
      }
    }
  });
});
