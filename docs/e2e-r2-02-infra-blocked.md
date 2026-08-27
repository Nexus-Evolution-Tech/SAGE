# R2-02 E2E-INFRA — INFRA_BLOCKED

Data da verificacao: 2026-08-27

## Resultado

O pacote #45 nao foi concluido. O E2E real de navegador nao foi executado e esta
evidencia nao o substitui por um resultado verde.

## Referencias

- Branch: `wp/r2-02-e2e-infra-20260827`
- Base: `c6acace3d2b46c1c7f3cf12eaa6091a5e3b35382`
- Candidato revisado: `df43cea`
- API de referencia: `6a69f438cbd5b1cc17ec6083edb87c4d08a08e90`

## Bloqueio verificado

Playwright Test e Chromium real foram instalados/tentados no Windows. O workflow
candidato falhou na verificacao de commits antes de iniciar qualquer caso E2E.
O candidato tambem dependia de URLs e tokens externos, portanto nao e uma
pre-condicao valida para este pacote.

Os entrypoints documentados `npm start` do frontend e da API iniciam os
respectivos servidores. `npm run setup:db` provisiona schema pelo caminho
documentado, mas nenhum desses comandos inicia o servidor MySQL.
Nao existe, dentro deste pacote, entrypoint documentado para iniciar MySQL nas
duas plataformas.

## Pre-condicao para retomada

Antes de qualquer nova implementacao, deve existir mecanismo operacional
documentado e local para iniciar MySQL 8.4 e provisionar o schema descartavel em
Ubuntu e Windows, com cleanup verificavel de processos, banco, logs e diretorios.

Nao usar URL ou secret externo, mock, servidor fake, intercept, HTTP isolado ou
Jest como substituto de navegador real, frontend real e API real.

As issues #42 e #45 permanecem abertas. `/setup`, producao e a API nao foram
alterados por este saneamento.
