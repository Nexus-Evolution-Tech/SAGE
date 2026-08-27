const {
  API_URL,
  ADMIN_TOKEN,
  SECRETARIA_TOKEN,
  createAuthenticatedContext,
  expect,
  openOnboarding,
  requireE2eEnvironment,
  test,
} = require('./fixtures');

function tokenWithAdminClaim() {
  const payload = Buffer.from(JSON.stringify({ papel: 'ADMINISTRADOR' })).toString('base64url');
  return `header.${payload}.invalid-signature`;
}

test.describe('contratos de autenticação observados no navegador', () => {
  test('sem token não entra na rota administrativa', async ({ browser }) => {
    requireE2eEnvironment();
    const context = await browser.newContext();
    try {
      const page = await context.newPage();
      await page.goto('/onboarding');
      await expect(page).toHaveURL(/\/$/);
    } finally {
      await context.close();
    }
  });

  test('token inválido produz 401 real e sessão expirada visível', async ({ browser }) => {
    requireE2eEnvironment();
    const context = await createAuthenticatedContext(browser, tokenWithAdminClaim());
    try {
      const page = await context.newPage();
      const pending = page.waitForResponse((response) => response.request().method() === 'GET'
        && new URL(response.url()).pathname === '/onboarding');
      await page.goto('/onboarding');
      expect((await pending).status()).toBe(401);
      await expect(page.getByText('Sessão Expirada')).toBeVisible();
    } finally {
      await context.close();
    }
  });

  test('SECRETARIA recebe 403 real e não abre onboarding', async ({ browser }) => {
    requireE2eEnvironment();
    const context = await createAuthenticatedContext(browser, SECRETARIA_TOKEN);
    try {
      const page = await context.newPage();
      await page.goto('/');
      const result = await page.evaluate(async (apiUrl) => {
        const response = await fetch(`${apiUrl}/onboarding`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        return { status: response.status };
      }, API_URL);
      expect(result.status).toBe(403);
      await page.goto('/onboarding');
      await expect(page).toHaveURL(/\/inicio$/);
    } finally {
      await context.close();
    }
  });

  test('passo fora de ordem é rejeitado sem alterar a projeção', async ({ adminPage }) => {
    requireE2eEnvironment();
    const before = await openOnboarding(adminPage);
    const result = await adminPage.evaluate(async ({ apiUrl, version }) => {
      const response = await fetch(`${apiUrl}/onboarding/steps/area/resume`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'If-Match': `"${version}"`,
        },
      });
      return { status: response.status };
    }, { apiUrl: API_URL, version: before.version });
    expect(result.status).toBe(409);
    const after = await openOnboarding(adminPage);
    expect(after).toEqual(before);
  });
});
