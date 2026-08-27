# Evidência sanitizada — E2E R2-02

Data da verificação: 2026-08-27

Resultado: **INFRA_BLOCKED; E2E real Windows 11 x64 ainda não concluído**. O
runner está implementado, mas a execução de aceite depende dos serviços reais e
das sessões sintéticas do ambiente. Os testes Jest/contrato abaixo são
complementares e não são E2E.

## Snapshot integrado

Repositório verificado: `C:\SAGE-WS\SAGE`.

Após `git fetch origin --prune`, a branch foi criada da base integrada:

```text
branch: wp/r2-02-e2e-infra-windows11-20260827
base:   origin/wip/recuperacao-local-pre-auditoria @ 5d23c1714e14c695e35b2556e41321847e720b13
frontend integrado/base funcional: bf33451cd3294ba369d20decc49c69f4110fb5bf
API + fixture KeepAlive: 10371f0012d92f302a5c467fbc8245e69d2ffea3
```

O frontend integrado está presente em `bf33451` e foi verificado como ancestral
da base e da branch deste pacote.

Não há alteração em `src/` de produção. Esta branch adiciona somente runner,
E2E, workflow Windows, dependência Playwright e documentação; a API é somente
checkout cross-repo da referência fixa acima.

A API é uma dependência cross-repo referenciada pela fixture `10371f0` no repositório
SAGE-API. Ela não foi tratada como objeto do banco de objetos do SAGE, e nenhum
arquivo fora deste repositório foi alterado ou necessário para esta evidência.

## Ambiente de aceite e runtime

O único ambiente de aceite é **Windows 11 x64**. O E2E exige Chromium real,
frontend e API locais, MySQL/schema local e documentado, readiness verificável
e cleanup estrito.

O `package.json` adiciona somente `test:e2e`; `@playwright/test`,
`playwright` e `playwright-core` ficam fixados em `1.62.1` no lockfile.

Runtime observado no Windows 11 x64:

```text
node v24.10.0
npm 11.6.1
@playwright/test/playwright/playwright-core 1.62.1
Chromium real: 151.0.7922.34
```

A execução do runner usa Chromium real, `npm start` no frontend via
`webServer`, `npm start` na API e a fixture API `KeepAlive`/`Cleanup`. Não há
seed, bootstrap paralelo, simulador ou hardware neste pacote.

## Runner E2E e fronteira

`npm.cmd run test:e2e` descobre 8 casos no projeto Chromium e observa a rede
real do navegador. A suite cobre `/onboarding`, GET com exatamente os cinco
campos, POST sem corpo, `If-Match`, reload, retry, 401, 403 e 412. A fixture
KeepAlive mantém MySQL/schema real durante API e frontend; `Cleanup` verifica
processo, listener e diretórios ausentes.

Nenhum caso escreve escola, conta, entidade, PII, credencial ou `/setup`.
`PRONTO_LOGICO`/`CONCLUIDO` são verificados como estados lógicos e nunca como
confirmação física.

## Testes complementares — Windows 11 x64 (não E2E)

O comando existente foi executado sem alterar a configuração:

```text
npm.cmd test -- --watchAll=false
Resultado: exit 0
Test Suites: 21 passed, 21 total
Tests:       67 passed, 67 total
```

Os contratos do onboarding presentes no snapshot foram executados e passaram:

- `src/hooks/useOnboarding.contract.test.js`;
- `src/components/pages/Onboarding/Onboarding.contract.test.js`;
- `src/App.onboarding.contract.test.js`.

Eles cobrem, como contrato complementar, os cinco campos do GET, autorização,
POST sem corpo, `If-Match`, releitura após reabertura, retry de rede/5xx,
conflito 412, 401/403, guards de `/onboarding`, preservação de `/setup` e a
ausência de confirmação de hardware. A inspeção dos arquivos não encontrou
`skip` nem `only`.

Uma execução diagnóstica serial com `--runInBand --ci --forceExit` também foi
realizada; ela terminou com 20 suítes e 66 testes aprovados e um timeout em
`src/components/pages/Login/Login.firstRun.test.js`. O comando solicitado,
executado sem essas flags adicionais, passou integralmente conforme acima.

O build foi tentado com o entrypoint existente:

```text
CI=true npm.cmd run build
```

Após aproximadamente 90 segundos, o processo permaneceu em
`Creating an optimized production build...`, sem produzir `build/index.html`.
Os processos específicos dessa tentativa foram encerrados após a verificação;
o resultado é **build travado/não concluído**, não sucesso.

Não há scripts de lint ou type-check no `package.json` integrado.

## Ubuntu — N/A neste ciclo

Ubuntu é **N/A neste ciclo**: não é executado, não é sucesso, falha, cobertura
parcial nem evidência.

Para preservar o registro factual sem reclassificá-lo como aceite, o job de CI
anteriormente registrado no commit `148acb3f62152419384fe971d1c5228a20fe5323`,
run `33045244541` (job `test-and-build`, PR #44), apresentou:

- `npm ci`: passou;
- `npm test -- --watchAll=false`: passou;
- `npm run build`: passou;
- job completo: passou em 1m05s.

Esse registro é CI complementar, não execução E2E nem evidência do ambiente de
aceite. Os testes Jest/contrato do job são complementares e não E2E. Não há
scripts de lint ou type-check no `package.json`.

## Execução real atual

O comando oficial produziu `INFRA_BLOCKED`: `commit=5d23c17...`,
`os=win32/10.0.26200`, `node=v24.10.0`, `playwright=1.62.1`,
`chromium=151.0.7922.34`, etapa de credenciais e erro com as duas variáveis de
sessão ausentes. Nenhum segredo foi impresso ou publicado.

## E2E não executado

A suíte acima não foi apresentada como executada: a execução real foi bloqueada
antes dos casos por pré-condições ambientais.

- abertura limpa de `/onboarding`, GET com exatamente os cinco campos e resume;
- POST de `/onboarding/steps/{step}/resume` com fronteira de onboarding lógico;
- retomada após fechar o navegador e reiniciar processo ou máquina;
- refresh/retry sem duplicação, falha/timeout, passo fora de ordem ou resultado
  desconhecido;
- respostas 401, 403 e 412;
- estados lógicos `PRONTO_LOGICO`/`CONCLUIDO`, sem confirmação física.

Não foram usadas URLs externas, secrets reais, HTTP direto, mocks, intercepts,
jsdom, Jest ou `skip` como substitutos para maquiar um E2E verde. A fronteira
é o onboarding lógico (`GET /onboarding` e
`POST /onboarding/steps/{step}/resume`); `/setup` permanece inalterado. O E2E
não abrange RegistroPresenca, presença, catraca, hardware, escola, conta,
entidades ou PII.

## Escopo e desbloqueio

Este pacote altera somente os arquivos permitidos: dependência/comando Playwright,
configuração, E2E/fixtures, workflow Windows e documentação. Não altera produção,
API, migrations, installer, bootstrap de produto, `/setup` ou dados reais.

Para executar o E2E posteriormente, é necessário disponibilizar no Windows 11
x64 um runner Chromium real e mecanismo local/documentado para MySQL/schema,
com frontend e API locais, readiness verificável e cleanup estrito. A execução
deve usar o frontend `bf33451` e a referência cross-repo completa da API
`10371f0012d92f302a5c467fbc8245e69d2ffea3`, cuja fixture KeepAlive é consumida
pelo workflow com Cleanup explícito. A evidência é sanitizada e sem PII ou
secrets.
