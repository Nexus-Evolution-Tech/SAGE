# Evidencia sanitizada — E2E R2-02 (#45, relacionada #42)

Data: 2026-08-27

Resultado verificado: a infraestrutura do runner esta instalada; o E2E de navegador
real nao foi executado no Windows local. A ausencia do ambiente de aplicacao e das
credenciais transitórias foi registrada como **INFRA_BLOCKED**. Nenhum teste foi
convertido em `skip`, e os testes Jest/contrato continuam sendo complementares.

## Base e dependencias

- Repositorio: `C:\SAGE-WS\SAGE`
- Branch: `wp/r2-02-e2e-infra-20260827`
- Base: `origin/wip/recuperacao-local-pre-auditoria` em `c6acace3d2b46c1c7f3cf12eaa6091a5e3b35382`
- Frontend integrado: `bf33451`
- API cross-repo: `6a69f438cbd5b1cc17ec6083edb87c4d08a08e90`
- Contrato: ADR-0016, addendum E2E integrado em `40e995f`

A API nao foi alterada. O workflow apenas a confere em checkout descartavel no commit
exato informado; o processo da API deve ser fornecido pelo ambiente E2E, sem seed,
bootstrap ou simulador criado por este pacote.

## Runner e Chromium

`package.json` adiciona somente o comando `test:e2e` e `@playwright/test` fixado em
`1.62.1`. O lockfile fixa tambem `playwright` e `playwright-core` em `1.62.1`.

Bring-up local Windows verificado:

```text
node=v24.10.0
npm=11.6.1
playwright=1.62.1
chromium=151.0.7922.34 (Playwright revision 1234)
comando de instalacao=npx.cmd playwright install chromium
resultado=Chromium real instalado em %LOCALAPPDATA%\ms-playwright\chromium-1234
```

A configuracao usa o entrypoint frontend existente `npm start` somente quando uma URL
externa nao e fornecida. Em CI, URLs e credenciais sao obrigatorias; sem elas o preflight
falha antes de qualquer caso.

## INFRA_BLOCKED local

O comando oficial foi executado em Windows:

```text
npm.cmd run test:e2e
```

A primeira tentativa iniciou o frontend em `3001`, mas o listener nao respondeu a tempo:
`Timed out waiting 120000ms from config.webServer.`. O segundo ensaio, em modo CI para
produzir o artefato sanitizado, terminou com:

```text
Error: INFRA_BLOCKED: variaveis ausentes (E2E_FRONTEND_URL, E2E_API_URL,
E2E_ADMIN_TOKEN, E2E_SECRETARIA_TOKEN)
```

Artefato gerado em falha: `test-results/INFRA_BLOCKED.txt`. Conteudo verificado:

```text
INFRA_BLOCKED
commit=c6acace3d2b46c1c7f3cf12eaa6091a5e3b35382
os=win32/10.0.26200
node=v24.10.0
playwright=1.62.1
chromium=151.0.7922.34
comando=npm run test:e2e
etapa=credenciais-do-ambiente
erro=variaveis_ausentes=E2E_FRONTEND_URL,E2E_API_URL,E2E_ADMIN_TOKEN,E2E_SECRETARIA_TOKEN
```

O arquivo nao contem URL interna, token, senha, payload ou dado pessoal. Trace fica
desativado porque o trafego autenticado poderia registrar headers de sessao; screenshot,
JUnit e o marcador `INFRA_BLOCKED` so sao publicados pelo workflow quando ha falha.

## Suite descoberta

`npx.cmd playwright test --list` encontrou 8 casos em 2 arquivos no projeto Chromium:

- abertura de `/onboarding` por ADMINISTRADOR e resposta com exatamente os cinco campos;
- retry de falha transitoria causada por offline real do contexto;
- resume via `POST` sem corpo e `If-Match` derivado de `version`;
- fechamento/reabertura e leitura do estado persistido;
- concorrencia com um sucesso e um `412`;
- ausencia de token, `401`, `403` real para SECRETARIA e passo fora de ordem;
- texto que identifica `PRONTO_LOGICO`/`CONCLUIDO` como estado logico, nunca efeito fisico.

Os testes usam somente tokens sinteticos fornecidos pelo ambiente e observam a rede real
do navegador. Nao ha `page.route`, mock, servidor fake, seed, chamada a `/setup`, escrita
de escola/conta/entidade, PII, credencial ou RegistroPresenca.

## Evidencia complementar

```text
npm.cmd test -- --watchAll=false
Test Suites: 21 passed, 21 total
Tests:       67 passed, 67 total
```

Esses 21/67 testes sao Jest/jsdom/contrato e nao contam como E2E. O build local foi
iniciado pelo entrypoint existente, ficou sem exit observavel em mais de tres minutos e
foi encerrado; portanto nao e reportado como sucesso. Nao existem scripts de lint ou
type-check no `package.json`.

## CI Ubuntu e Windows

O workflow `Frontend CI` preserva o job existente de testes/build e acrescenta uma matriz
`ubuntu-latest`/`windows-latest` com a mesma suite `npm run test:e2e`, Node 24, Chromium
instalado pelo Playwright e checkout verificavel da API `6a69f43`. Os artefatos recebem o
ID do run no nome e sao enviados somente com `if: failure()`.

Os runs desta branch ainda precisam ser publicados apos o push; seus IDs e eventuais
artefatos serao registrados aqui sem colar log cru. Sem `SAGE_E2E_FRONTEND_URL`,
`SAGE_E2E_API_URL`, `SAGE_E2E_ADMIN_TOKEN` e `SAGE_E2E_SECRETARIA_TOKEN` fornecidos por
um ambiente descartavel, ambos os jobs devem permanecer explicitamente
`INFRA_BLOCKED`, nao aprovados por inferencia.
