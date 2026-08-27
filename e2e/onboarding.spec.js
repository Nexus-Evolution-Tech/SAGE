const {
  ADMIN_TOKEN,
  assertLogicalCopy,
  createAuthenticatedContext,
  expect,
  openOnboarding,
  requireE2eEnvironment,
  test,
} = require('./fixtures');

test.describe.configure({ mode: 'serial' });

test.describe('R2-02 E2E de navegador real', () => {
  test('ADMINISTRADOR abre onboarding e recebe a projeção exata', async ({ adminPage }) => {
    requireE2eEnvironment();
    const requests = [];
    adminPage.on('request', (request) => {
      const url = new URL(request.url());
      if (url.pathname === '/setup' || url.pathname.startsWith('/setup/')) requests.push(request);
    });
    const projection = await openOnboarding(adminPage);
    expect(Object.keys(projection)).toEqual([
      'status', 'current_step', 'completed_steps', 'next_step', 'version',
    ]);
    expect(projection).toMatchObject({
      status: 'NAO_INICIADO',
      current_step: null,
      completed_steps: [],
      next_step: 'ESCOLA_CONTA_ADMINISTRADOR',
      version: 0,
    });
    await expect(adminPage).toHaveURL(/\/onboarding$/);
    await expect(adminPage.getByRole('heading', { name: 'Configuração inicial' })).toBeVisible();
    await assertLogicalCopy(adminPage);
    expect(requests).toHaveLength(0);
  });

  test('falha transitória de rede fica visível e permite retry real', async ({ adminPage }) => {
    requireE2eEnvironment();
    await openOnboarding(adminPage);
    await adminPage.context().setOffline(true);
    await adminPage.getByRole('button', { name: 'Retomar' }).first().click();
    await expect(adminPage.getByRole('alert')).toContainText('Não foi possível consultar');
    await adminPage.context().setOffline(false);
    const retryResponse = adminPage.waitForResponse((response) => response.request().method() === 'GET'
      && new URL(response.url()).pathname === '/onboarding');
    await adminPage.getByRole('button', { name: 'Tentar novamente' }).click();
    expect((await retryResponse).status()).toBe(200);
    await expect(adminPage.getByRole('alert')).toHaveCount(0);
  });

  test('resume envia If-Match sem corpo e sobrevive a reabertura', async ({ adminPage, browser }) => {
    requireE2eEnvironment();
    const before = await openOnboarding(adminPage);
    const postResponse = adminPage.waitForResponse((response) => response.request().method() === 'POST'
      && new URL(response.url()).pathname.endsWith('/resume'));
    await adminPage.getByRole('button', { name: 'Retomar' }).first().click();
    const response = await postResponse;
    expect(response.status()).toBe(200);
    expect(response.request().postData()).toBeNull();
    expect(response.request().headers()['if-match']).toBe(`"${before.version}"`);
    expect(await response.json()).toMatchObject({
      status: 'EM_ANDAMENTO',
      current_step: 'ESCOLA_CONTA_ADMINISTRADOR',
      version: 1,
    });

    const reopenedContext = await createAuthenticatedContext(browser, ADMIN_TOKEN);
    try {
      const reopened = await reopenedContext.newPage();
      const after = await openOnboarding(reopened);
      expect(after).toMatchObject({
        status: 'EM_ANDAMENTO',
        current_step: 'ESCOLA_CONTA_ADMINISTRADOR',
        version: 1,
      });
      await assertLogicalCopy(reopened);
    } finally {
      await reopenedContext.close();
    }
  });

  test('duas retomadas concorrentes deixam um sucesso e um 412', async ({ browser }) => {
    requireE2eEnvironment();
    const firstContext = await createAuthenticatedContext(browser, ADMIN_TOKEN);
    const secondContext = await createAuthenticatedContext(browser, ADMIN_TOKEN);
    try {
      const first = await firstContext.newPage();
      const second = await secondContext.newPage();
      const [firstState, secondState] = await Promise.all([
        openOnboarding(first), openOnboarding(second),
      ]);
      expect(firstState.version).toBe(1);
      expect(secondState.version).toBe(1);
      const resume = (page) => {
        const pending = page.waitForResponse((response) => response.request().method() === 'POST'
          && new URL(response.url()).pathname.endsWith('/resume'));
        return page.getByRole('listitem').nth(1).getByRole('button', { name: 'Retomar' })
          .click().then(() => pending);
      };
      const responses = await Promise.all([resume(first), resume(second)]);
      expect(responses.map((response) => response.status()).sort()).toEqual([200, 412]);
      await Promise.all([first.reload(), second.reload()]);
      await expect(first.getByText('Estado lógico: EM_ANDAMENTO')).toBeVisible();
      await expect(second.getByText('Estado lógico: EM_ANDAMENTO')).toBeVisible();
    } finally {
      await Promise.all([firstContext.close(), secondContext.close()]);
    }
  });
});
