# Evidência sanitizada — E2E R2-02

Data da verificação: 2026-08-27
Resultado: **E2E de navegador não executado**. A pré-condição do pacote está
reprovada neste snapshot e neste ambiente; nenhum smoke de HTTP/Jest é
apresentado como E2E verde.

## Escopo preservado

Esta entrega contém somente esta documentação de evidência. Não foram
alterados `src/`, `/setup`, API, migrations, instalador, bootstrap ou workflows.
Não foram criados simulador de catraca, dados de presença, entidades de
negócio, credenciais, tokens, payloads, logs de runtime ou screenshots.

## Snapshot comum

Repositório verificado: `C:\SAGE-WS\SAGE`.

Após `git fetch origin --prune`, a branch foi criada de `origin/main`:

```text
branch: wp/r2-02-e2e-onboarding-20260827
base:   origin/main 51cf468f5ff94bbe20b5fe3e4e69aaeebd856d90
HEAD:   51cf468f5ff94bbe20b5fe3e4e69aaeebd856d90
```

Os commits fixos informados para o pacote não formam a dupla disponível neste
snapshot:

```text
frontend bf33451cd3294ba369d20decc49c69f4110fb5bf: existe no remoto, mas não é ancestral de origin/main
API      6a69f43: não existe no banco de objetos deste repositório
```

Não foi feita incorporação de nenhum desses commits, pois isso alteraria código
de produção ou exigiria outro repositório, ambos fora do escopo autorizado.

## Runner e runtime

O `package.json` do snapshot oferece somente os entrypoints `start`, `build`,
`test` e `eject`, usando `react-scripts`. Não há dependência ou script de
Playwright, Cypress ou outro runner de navegador real.

Runtime observado no Windows:

```text
node v24.10.0
npm 11.6.1
npm ls @playwright/test playwright cypress --depth=0: (empty)
executável playwright/chrome/chromium/msedge/firefox: não detectado
```

Não foi instalada dependência, criado bootstrap, iniciado backend alternativo
ou introduzido comando novo. Portanto, não existe entrypoint executável para o
critério “navegador real + frontend real + API real”.

## Evidência Ubuntu

- E2E de navegador: **não executado** — não há runtime Ubuntu disponível para
  este operador Windows e o snapshot não possui runner de navegador.
- Contrato HTTP/Jest complementar: **não executado** — não há testes no
  snapshot nem API integrada disponível neste repositório.
- Build/lint/type-check: **não executados** neste ambiente Ubuntu.

## Evidência Windows

- E2E de navegador: **não executado** — runner e navegador real ausentes.
- `npm.cmd test -- --watchAll=false`: **falhou**, exit 1; `react-scripts`
  informou `No tests found` (0 arquivos correspondentes).
- `npm.cmd run build`: **tentado, sem conclusão verificável** no runtime
  disponível; não foi produzido `build/index.html` antes da interrupção da
  tentativa. Nenhum erro foi convertido em sucesso.
- Lint/type-check: não há script correspondente no `package.json`.

## Cobertura não executada

Por causa da pré-condição reprovada, os seguintes cenários permanecem sem
evidência E2E e não foram simulados:

- abertura limpa de `/onboarding`, `GET /onboarding` e os cinco campos exatos;
- `POST /onboarding/steps/{step}/resume` sem corpo de negócio e `If-Match`;
- retomada após fechar o navegador e reiniciar processo ou máquina;
- refresh/retry sem duplicação;
- falha/timeout, passo fora de ordem e resultado desconhecido;
- respostas 401, 403 e 412;
- estados lógicos `PRONTO_LOGICO`/`CONCLUIDO`, sem confirmação física;
- ausência de consulta ou escrita de presença, catraca, hardware e entidades de
  negócio.

Não foram usados `skip` indiscriminados, mocks, intercepts, jsdom ou chamadas
HTTP diretas para maquiar a cobertura.

## Desbloqueio necessário

Para uma nova execução, o revisor precisa disponibilizar um snapshot que
contenha a integração frontend `bf33451` e a API `6a69f43`, além de um runner e
navegador real compatíveis com os entrypoints documentados. A execução deverá
repetir a mesma dupla de commits em snapshots limpos de Ubuntu e Windows e
anexar apenas evidência sanitizada.
