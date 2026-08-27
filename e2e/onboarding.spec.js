const { API_URL, ADMIN_TOKEN, SECRETARIA_TOKEN, assertLogicalCopy, createAuthenticatedContext, expect, openOnboarding, requireE2eEnvironment, test } = require('./fixtures');
test.describe.configure({ mode: 'serial' });
const invalidToken = () => `header.${Buffer.from(JSON.stringify({ papel: 'ADMINISTRADOR' })).toString('base64url')}.invalid-signature`;
const isOnboarding = (r, method = 'GET') => new URL(r.url()).pathname === '/onboarding' && r.request().method() === method;

test.describe('R2-02 - navegador Chromium real', () => {
  test('ausencia de token fica na barreira da rota', async ({ browser }) => { const c = await browser.newContext(); try { const p = await c.newPage(); await p.goto('/onboarding'); await expect(p).toHaveURL(/\/$/); } finally { await c.close(); } });
  test('token invalido produz 401 real e sessao expirada', async ({ browser }) => {
    requireE2eEnvironment(); const c = await createAuthenticatedContext(browser, invalidToken());
    try { const p = await c.newPage(); const r = p.waitForResponse((x) => isOnboarding(x)); await p.goto('/onboarding'); expect((await r).status()).toBe(401); await expect(p.getByRole('heading', { name: /Sess/ })).toBeVisible(); } finally { await c.close(); }
  });
  test('SECRETARIA recebe 403 real e nao abre onboarding', async ({ browser }) => {
    requireE2eEnvironment(); const c = await createAuthenticatedContext(browser, SECRETARIA_TOKEN);
    try { const p = await c.newPage(); await p.goto('/inicio'); const s = await p.evaluate(async (url) => (await fetch(`${url}/onboarding`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })).status, API_URL); expect(s).toBe(403); await p.goto('/onboarding'); await expect(p).toHaveURL(/\/inicio$/); } finally { await c.close(); }
  });
  test('passo fora de ordem mantem a projecao', async ({ adminPage }) => {
    requireE2eEnvironment(); const before = await openOnboarding(adminPage); const s = await adminPage.evaluate(async ({ url, version }) => (await fetch(`${url}/onboarding/steps/area/resume`, { method: 'POST', headers: { Authorization: `Bearer ${localStorage.getItem('token')}`, 'If-Match': `"${version}"` } })).status, { url: API_URL, version: before.version }); expect(s).toBe(409); expect(await openOnboarding(adminPage)).toEqual(before);
  });
  test('ADMINISTRADOR abre onboarding com os cinco campos exatos', async ({ adminPage }) => {
    requireE2eEnvironment(); const setup = []; adminPage.on('request', (r) => { if (new URL(r.url()).pathname.startsWith('/setup')) setup.push(r); }); const p = await openOnboarding(adminPage); expect(Object.keys(p)).toEqual(['status', 'current_step', 'completed_steps', 'next_step', 'version']); expect(p).toEqual({ status: 'NAO_INICIADO', current_step: null, completed_steps: [], next_step: 'ESCOLA_CONTA_ADMINISTRADOR', version: 0 }); await expect(adminPage).toHaveURL(/\/onboarding$/); await expect(adminPage.getByRole('heading', { name: /Configura/ })).toBeVisible(); await assertLogicalCopy(adminPage); expect(setup).toHaveLength(0);
  });
  test('falha transitoria real permite retry', async ({ adminPage }) => {
    requireE2eEnvironment(); await openOnboarding(adminPage); await adminPage.context().setOffline(true); await adminPage.getByRole('button', { name: /Retomar/ }).first().click(); await expect(adminPage.getByRole('alert')).toBeVisible(); await adminPage.context().setOffline(false); const r = adminPage.waitForResponse((x) => isOnboarding(x)); await adminPage.getByRole('button', { name: /Tentar/ }).click(); expect((await r).status()).toBe(200);
  });
  test('resume envia POST sem corpo, If-Match e recupera apos reabertura', async ({ adminPage, browser }) => {
    requireE2eEnvironment(); const before = await openOnboarding(adminPage); const p = adminPage.waitForResponse((r) => isOnboarding(r, 'POST')); await adminPage.getByRole('button', { name: /Retomar/ }).first().click(); const r = await p; expect(r.status()).toBe(200); expect(r.request().postData()).toBeNull(); expect(r.request().headers()['if-match']).toBe(`"${before.version}"`); const c = await createAuthenticatedContext(browser, ADMIN_TOKEN); try { const after = await openOnboarding(await c.newPage()); expect(after).toMatchObject({ status: 'EM_ANDAMENTO', current_step: 'ESCOLA_CONTA_ADMINISTRADOR', version: 1 }); await assertLogicalCopy(adminPage); } finally { await c.close(); }
  });
  test('retomadas concorrentes deixam um sucesso e um 412', async ({ browser }) => {
    requireE2eEnvironment(); const oneContext = await createAuthenticatedContext(browser, ADMIN_TOKEN); const twoContext = await createAuthenticatedContext(browser, ADMIN_TOKEN);
    try { const onePage = await oneContext.newPage(), twoPage = await twoContext.newPage(); const [one, two] = await Promise.all([openOnboarding(onePage), openOnboarding(twoPage)]); const resume = (page) => { const r = page.waitForResponse((x) => isOnboarding(x, 'POST')); return page.getByRole('listitem').nth(1).getByRole('button', { name: /Retomar/ }).click().then(() => r); }; const rs = await Promise.all([resume(onePage), resume(twoPage)]); expect(rs.map((r) => r.status()).sort()).toEqual([200, 412]); await Promise.all([onePage.reload(), twoPage.reload()]); await expect(onePage.getByText(/Estado l.gico: EM_ANDAMENTO/i)).toBeVisible(); await expect(twoPage.getByText(/Estado l.gico: EM_ANDAMENTO/i)).toBeVisible(); expect(one.version).toBe(1); expect(two.version).toBe(1); } finally { await Promise.all([oneContext.close(), twoContext.close()]); }
  });
});
