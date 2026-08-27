const { test: base, expect } = require('@playwright/test');

const API_URL = (process.env.E2E_API_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');
const ADMIN_TOKEN = process.env.E2E_ADMIN_TOKEN;
const SECRETARIA_TOKEN = process.env.E2E_SECRETARIA_TOKEN;

function requireE2eEnvironment() {
  const missing = [
    ['E2E_ADMIN_TOKEN', ADMIN_TOKEN],
    ['E2E_SECRETARIA_TOKEN', SECRETARIA_TOKEN],
  ].filter(([, value]) => !value).map(([name]) => name);
  if (missing.length) throw new Error(`INFRA_BLOCKED: variaveis ausentes (${missing.join(', ')})`);
}

async function createAuthenticatedContext(browser, token) {
  const context = await browser.newContext();
  await context.addInitScript((sessionToken) => {
    localStorage.setItem('token', sessionToken);
    localStorage.setItem('session', JSON.stringify({ token: sessionToken, precisa_trocar_senha: false }));
  }, token);
  return context;
}

function onboardingResponse(response, method = 'GET') {
  const url = new URL(response.url());
  return url.pathname === '/onboarding' && response.request().method() === method;
}

async function openOnboarding(page) {
  const responsePromise = page.waitForResponse((response) => onboardingResponse(response));
  await page.goto('/onboarding');
  const response = await responsePromise;
  expect(response.status()).toBe(200);
  return response.json();
}

async function assertLogicalCopy(page) {
  await expect(page.getByText(/Os estados exibidos são lógicos e não confirmam efeito físico/i)).toBeVisible();
}

const test = base.extend({
  adminPage: async ({ browser }, use) => {
    const context = await createAuthenticatedContext(browser, ADMIN_TOKEN);
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});

module.exports = {
  API_URL,
  ADMIN_TOKEN,
  SECRETARIA_TOKEN,
  assertLogicalCopy,
  createAuthenticatedContext,
  expect,
  openOnboarding,
  requireE2eEnvironment,
  test,
};
