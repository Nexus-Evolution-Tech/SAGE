# Exceção temporária — toolchain do frontend F8

**Registrada em:** 2026-07-29

**Escopo:** frontend estático do instalador alfa

**Validade:** somente homologação; revisar antes de release público

## Resultado observado

`npm audit` reporta 53 ocorrências: 11 baixas, 14 moderadas, 28 altas e zero críticas.

As correções compatíveis alcançáveis pelo cliente foram aplicadas:

- `engine.io-client` 6.6.6;
- `socket.io-parser` 4.2.7;
- `ws` 8.21.1 no Socket.IO e servidor de desenvolvimento;
- `ws` 7.5.13 no ambiente Jest;
- overrides seguros para `shell-quote` 1.10.0 e `websocket-driver` 0.7.5.

## Risco aceito

Das altas restantes, 27 pertencem à cadeia legada de build/teste do Create React App
(`react-scripts`, webpack, Jest, Workbox e dependências). Esses módulos não entram no instalador:
o runner Windows produz o build e o pacote contém apenas os arquivos estáticos resultantes.

A outra alta é `GHSA-qwww-vcr4-c8h2` no React Router 7.12+. Ela afeta execução de actions no modo
React Server Components. O SAGE usa somente `BrowserRouter`, não possui servidor RSC nem actions.
Voltar para 7.11 reintroduziria outra advisory; por isso a versão 7.18.2 permanece fixada.

## Mitigações e gates

- build somente em runner controlado, sem processar projeto ou configuração enviados por usuário;
- `npm ci` com lockfile versionado;
- somente `build/` entra no release Windows; `node_modules` do frontend fica fora;
- testes e build com `CI=true` precisam passar;
- scan do artefato reprova `localhost`, `/backend` e serviços externos removidos;
- migrar CRA/CRACO para uma toolchain mantida antes de promover o instalador a release público.

Esta exceção não cobre nova advisory no código executado pelo navegador. Se o audit voltar a
apontar Socket.IO, QR, React ou outra dependência de runtime alcançável, o build deve ser bloqueado.

## Onde isto pode dar errado

- Uma dependência hoje usada só no build pode passar a ser importada no bundle sem revisão.
- A advisory de React Router pode ampliar o escopo para `BrowserRouter`; nesse caso a exceção deixa
  de valer imediatamente.
- Runner controlado reduz exposição da toolchain, mas não elimina risco de supply chain no registry.
