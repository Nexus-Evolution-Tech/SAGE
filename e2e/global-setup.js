const fs = require('fs'); const os = require('os'); const path = require('path');
const { execFileSync } = require('child_process'); const { chromium } = require('@playwright/test');
const frontendUrl = (process.env.E2E_FRONTEND_URL || 'http://127.0.0.1:3001').replace(/\/$/, '');
const apiUrl = (process.env.E2E_API_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');
const command = process.platform === 'win32' ? 'npm.cmd run test:e2e' : 'npm run test:e2e';
const commit = () => { try { return execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(); } catch { return 'unknown'; } };
function blocked(stage, error, browserVersion) {
  const detail = String(error).replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').slice(0, 240);
  const lines = ['INFRA_BLOCKED', `commit=${commit()}`, `os=${process.platform}/${os.release()}`, `node=${process.version}`, `playwright=${require('@playwright/test/package.json').version}`, `chromium=${browserVersion}`, `comando=${command}`, `etapa=${stage}`, `erro=${detail}`, 'artefatos=test-results/ (somente em falha; sem trace)'];
  fs.mkdirSync(path.resolve('test-results'), { recursive: true }); fs.writeFileSync(path.resolve('test-results/INFRA_BLOCKED.txt'), `${lines.join('\n')}\n`);
}

module.exports = async function globalSetup() {
  let browser; let browserVersion = 'nao-disponivel'; let stage = 'runner-chromium';
  try {
    browser = await chromium.launch({ headless: true });
    browserVersion = browser.version();
    stage = 'credenciais-do-ambiente';
    const missing = ['E2E_ADMIN_TOKEN', 'E2E_SECRETARIA_TOKEN'].filter((name) => !process.env[name]);
    if (missing.length) throw new Error(`variaveis_ausentes=${missing.join(',')}`);
    const page = await browser.newPage();
    stage = 'frontend-api-readiness';
    await page.goto(`${frontendUrl}/robots.txt`, { waitUntil: 'domcontentloaded' });
    const result = await page.evaluate(async ({ url, admin, secretaria }) => {
      try {
        const auth = (token) => ({ headers: { Authorization: `Bearer ${token}` } });
        const [ready, adminResponse, secretariaResponse] = await Promise.all([
          fetch(`${url}/ready`), fetch(`${url}/onboarding`, auth(admin)),
          fetch(`${url}/onboarding`, auth(secretaria)),
        ]);
        return { ready: ready.status, admin: adminResponse.status, secretaria: secretariaResponse.status };
      } catch { return { error: 'browser_api_request_failed' }; }
    }, { url: apiUrl, admin: process.env.E2E_ADMIN_TOKEN, secretaria: process.env.E2E_SECRETARIA_TOKEN });
    if (result.error) throw new Error(result.error);
    if (result.ready !== 200 || result.admin !== 200 || result.secretaria !== 403) {
      throw new Error(`status_ready=${result.ready};status_admin=${result.admin};status_secretaria=${result.secretaria}`);
    }
    await page.close();
  } catch (error) {
    blocked(stage, error.message || error, browserVersion);
    throw new Error(`INFRA_BLOCKED: ${stage}`);
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
};
