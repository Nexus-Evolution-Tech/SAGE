const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { chromium } = require('@playwright/test');

const FRONTEND_URL = (process.env.E2E_FRONTEND_URL || 'http://127.0.0.1:3001').replace(/\/$/, '');
const API_URL = (process.env.E2E_API_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');
const REQUIRED_ENV = [
  ...(process.env.CI ? ['E2E_FRONTEND_URL', 'E2E_API_URL'] : []),
  'E2E_ADMIN_TOKEN', 'E2E_SECRETARIA_TOKEN',
];
let detectedChromiumVersion = 'nao-disponivel';

function commitAtual() {
  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  } catch (error) {
    return `desconhecido_${error?.code || 'git'}`;
  }
}

function runtimeInfo() {
  return [
    `commit=${commitAtual()}`,
    `os=${process.platform}/${os.release()}`,
    `node=${process.version}`,
    `playwright=${require('@playwright/test/package.json').version}`,
    'chromium=nao-inicializado',
    'comando=npm run test:e2e',
  ];
}

function registrarBloqueio(etapa, erro, chromiumVersion = 'nao-disponivel') {
  const linhas = [
    'INFRA_BLOCKED',
    ...runtimeInfo().map((linha) => linha.replace('chromium=nao-inicializado', `chromium=${chromiumVersion}`)),
    `etapa=${etapa}`,
    `erro=${erro}`,
    'artefatos=test-results/ (somente em falha; sem trace por conter credenciais de sessao)',
  ];
  fs.mkdirSync(path.resolve('test-results'), { recursive: true });
  fs.writeFileSync(path.resolve('test-results/INFRA_BLOCKED.txt'), `${linhas.join('\n')}\n`, 'utf8');
}

async function verificarDisponibilidade(url, rota, etapa) {
  try {
    const response = await fetch(`${url}${rota}`, { signal: AbortSignal.timeout(5_000) });
    if (!response.ok) throw new Error(`http_${response.status}`);
  } catch (error) {
    const codigo = error?.message?.startsWith('http_') ? error.message : 'fetch_failed';
    registrarBloqueio(etapa, codigo, detectedChromiumVersion);
    throw new Error(`INFRA_BLOCKED: ${etapa} indisponivel (${codigo})`);
  }
}

module.exports = async function globalSetup() {
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    detectedChromiumVersion = browser.version();
    await browser.close();
    browser = undefined;
    const ausentes = REQUIRED_ENV.filter((nome) => !process.env[nome]);
    if (ausentes.length) {
      registrarBloqueio('credenciais-do-ambiente', `variaveis_ausentes=${ausentes.join(',')}`, detectedChromiumVersion);
      throw new Error(`INFRA_BLOCKED: variaveis ausentes (${ausentes.join(', ')})`);
    }
    await verificarDisponibilidade(FRONTEND_URL, '/', 'frontend');
    await verificarDisponibilidade(API_URL, '/ready', 'api');
    return;
  } catch (error) {
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        registrarBloqueio('runner-cleanup', 'chromium_close_failed', detectedChromiumVersion);
      }
    }
    if (error.message.startsWith('INFRA_BLOCKED:')) throw error;
    registrarBloqueio('runner-chromium', 'chromium_launch_failed');
    throw new Error('INFRA_BLOCKED: Chromium real nao iniciou');
  }
};
