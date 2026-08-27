const { test: base, expect } = require('@playwright/test');
const API_URL = (process.env.E2E_API_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');
const API_ORIGIN = new URL(API_URL).origin;
const ADMIN_TOKEN = process.env.E2E_ADMIN_TOKEN, SECRETARIA_TOKEN = process.env.E2E_SECRETARIA_TOKEN;
const requireE2eEnvironment = () => { const missing = ['E2E_ADMIN_TOKEN', 'E2E_SECRETARIA_TOKEN'].filter((name) => !process.env[name]); if (missing.length) throw new Error(`INFRA_BLOCKED: variaveis ausentes (${missing.join(', ')})`); };
async function createAuthenticatedContext(browser, token) { const context = await browser.newContext(); await context.addInitScript((value) => { localStorage.setItem('token', value); localStorage.setItem('session', JSON.stringify({ token: value, precisa_trocar_senha: false })); }, token); return context; }
const isOnboarding = (response, method = 'GET') => { const url = new URL(response.url()); return url.origin === API_ORIGIN && url.pathname === '/onboarding' && response.request().method() === method; };
async function openOnboarding(page) { const pending = page.waitForResponse((response) => isOnboarding(response)); await page.goto('/onboarding'); const response = await pending; expect(response.status()).toBe(200); return response.json(); }
const assertLogicalCopy = (page) => expect(page.getByText(/estados exibidos/i)).toContainText(/efeito f.sico/i);
const test = base.extend({ adminPage: async ({ browser }, use) => { const context = await createAuthenticatedContext(browser, ADMIN_TOKEN); await use(await context.newPage()); await context.close(); } });
module.exports = { API_URL, ADMIN_TOKEN, SECRETARIA_TOKEN, assertLogicalCopy, createAuthenticatedContext, expect, openOnboarding, requireE2eEnvironment, test };
