# Evidência sanitizada — E2E R2-02

Data da verificação: 2026-08-27

Resultado: **E2E de navegador não executado**. A pré-condição do pacote está
reprovada porque este snapshot não dispõe de runner nem navegador real. Os
testes Jest/contrato executados abaixo são complementares e não são E2E.

## Snapshot integrado

Repositório verificado: `C:\SAGE-WS\SAGE`.

Após `git fetch origin --prune`, a branch foi criada da base integrada:

```text
branch: wp/r2-02-e2e-onboarding-integrated-2026082
base:   origin/wip/recuperacao-local-pre-auditoria
frontend integrado/base funcional: bf33451cd3294ba369d20decc49c69f4110fb5bf
```

O frontend integrado está presente em `bf33451` e foi verificado como ancestral
da base e da branch deste pacote.

O HEAD vigente e os commits documentais desta evidência são verificáveis no
histórico/PR #44; não há código de produção além da base funcional já integrada.

A API é uma dependência cross-repo referenciada por `6a69f43` no repositório
SAGE-API. Ela não foi tratada como objeto do banco de objetos do SAGE, e nenhum
arquivo fora deste repositório foi alterado ou necessário para esta evidência.

## Runner e runtime

O `package.json` integrado oferece os entrypoints `start`, `build`, `test` e
`eject`, usando `craco`. Não há dependência ou script de Playwright, Cypress ou
outro runner de navegador real.

Runtime observado no Windows:

```text
node v24.10.0
npm 11.6.1
npm ls @playwright/test playwright cypress --depth=0: (empty)
executável playwright/chrome/chromium/msedge/firefox: não detectado
```

Nenhuma dependência foi instalada, nenhum bootstrap foi criado e nenhum
backend, simulador, catraca ou hardware foi iniciado. Assim, não há entrypoint
executável para o requisito “navegador real + frontend real + API real”.

## Testes complementares — Windows

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

## Evidência complementar — Ubuntu

O CI Ubuntu existente executou a branch deste pacote no commit
`148acb3f62152419384fe971d1c5228a20fe5323`, no run `33045244541` (job
`test-and-build`, PR #44):

- E2E de navegador: **não executado** — o workflow não possui runner ou
  navegador real e nenhuma dependência desse tipo está no `package.json`;
- `npm ci`: passou;
- `npm test -- --watchAll=false`: passou;
- `npm run build`: passou;
- job completo: passou em 1m05s.

Os testes Jest/contrato do job são complementares e não E2E. Não há scripts de
lint ou type-check no `package.json`.

## E2E não executado

Sem runner e navegador reais, não foram simulados nem apresentados como E2E:

- abertura limpa de `/onboarding`, GET com exatamente os cinco campos e resume;
- retomada após fechar o navegador e reiniciar processo ou máquina;
- refresh/retry sem duplicação, falha/timeout, passo fora de ordem ou resultado
  desconhecido;
- respostas 401, 403 e 412;
- estados lógicos `PRONTO_LOGICO`/`CONCLUIDO`, sem confirmação física.

Não foram usados HTTP direto, mocks, intercepts, jsdom ou `skip` para maquiar
um E2E verde. Não houve consulta ou escrita de presença, catraca, hardware,
`RegistroPresenca`, `log_catraca_id` ou entidade de domínio.

## Escopo e desbloqueio

O único arquivo novo deste pacote é esta evidência documental. Nenhum código de
produção ou runtime foi alterado; não houve alteração em API, migrations,
installer, bootstrap ou workflows. O diff permanece restrito à documentação e
abaixo do limite aproximado de 300 linhas.

Para executar o E2E posteriormente, é necessário disponibilizar um runner e um
navegador real compatíveis com os entrypoints do projeto e repetir a execução
em snapshots limpos de Ubuntu e Windows, usando o frontend `bf33451` e a
referência cross-repo da API `6a69f43`, com evidência sanitizada.
