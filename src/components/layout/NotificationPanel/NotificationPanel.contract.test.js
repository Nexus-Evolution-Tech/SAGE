import fs from 'fs';
import path from 'path';

const panel = fs.readFileSync(path.join(__dirname, 'NotificationPanel.js'), 'utf8');
const context = fs.readFileSync(path.join(__dirname, '..', '..', '..', 'contexts', 'NotificationContext.js'), 'utf8');

test('oferece ler todas e limpar todas as notificações', () => {
  expect(panel).toContain('Ler todas');
  expect(panel).toContain('Limpar');
  expect(panel).toContain('window.confirm');
  expect(context).toContain('clearNotifications');
  expect(context).toContain('setNotifications([])');
});
