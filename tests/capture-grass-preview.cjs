const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const root = path.join(__dirname, '..');
const out = path.join(root, 'screenshots');
fs.mkdirSync(out, { recursive: true });
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.md': 'text/markdown; charset=utf-8' };

const server = http.createServer((req, res) => {
  const pathname = new URL(req.url, 'http://127.0.0.1').pathname;
  const relative = pathname === '/' ? 'index.html' : decodeURIComponent(pathname.slice(1));
  const file = path.resolve(root, relative);
  if (!file.startsWith(root + path.sep) && file !== path.join(root, 'index.html')) {
    res.writeHead(403).end('Forbidden'); return;
  }
  fs.readFile(file, (error, data) => {
    if (error) { res.writeHead(404).end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(data);
  });
});

(async () => {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  const browser = await chromium.launch({ headless: true, args: ['--enable-webgl', '--ignore-gpu-blocklist', '--use-gl=angle', '--use-angle=swiftshader'] });
  const report = { url: `http://127.0.0.1:${address.port}/index.html`, screenshots: [], grassModuleStatus: null, characterStatus: null, moveControlCount: null, exploreEnabled: false, pageErrors: [], shaderErrors: [], failedRequests: [] };

  async function openPage(viewport, name) {
    const page = await browser.newPage({ viewport, deviceScaleFactor: 1, isMobile: viewport.width < 700, hasTouch: viewport.width < 700 });
    page.on('pageerror', error => report.pageErrors.push(String(error)));
    page.on('console', message => {
      if (message.type() === 'error') {
        const value = message.text();
        if (/shader|compile|GL_INVALID|THREE\.WebGLProgram/i.test(value)) report.shaderErrors.push(value);
      }
    });
    page.on('requestfailed', request => report.failedRequests.push({ url: request.url(), error: request.failure()?.errorText }));
    page.on('response', response => {
      if (new URL(response.url()).pathname.endsWith('/grass-system.js')) report.grassModuleStatus = response.status();
    });
    await page.goto(report.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector('canvas', { timeout: 30000 });
    await page.waitForFunction(() => {
      const status = document.querySelector('#status')?.textContent || '';
      return status.includes('Both external CC0 GLB characters loaded') || !!document.querySelector('#error')?.textContent;
    }, { timeout: 45000 });
    report.characterStatus = await page.locator('#status').innerText();
    assert.equal(await page.locator('#error').isVisible(), false, 'The page displayed its asset/runtime error UI');
    assert.equal(report.grassModuleStatus, 200, 'grass-system.js must be served successfully');
    return page;
  }

  try {
    const desktop = await openPage({ width: 1440, height: 900 }, 'desktop');
    report.moveControlCount = await desktop.locator('[data-move]').count();
    assert.equal(report.moveControlCount, 5, 'Expected four directional buttons and Jump');
    await desktop.screenshot({ path: path.join(out, 'grass-desktop-cinematic.png'), fullPage: false });
    report.screenshots.push('screenshots/grass-desktop-cinematic.png');

    await desktop.locator('#explore').click();
    await desktop.waitForFunction(() => document.body.classList.contains('exploring'));
    report.exploreEnabled = true;
    await desktop.keyboard.down('w');
    await desktop.waitForTimeout(800);
    await desktop.keyboard.up('w');
    await desktop.waitForTimeout(700);
    await desktop.screenshot({ path: path.join(out, 'grass-desktop-explore.png'), fullPage: false });
    report.screenshots.push('screenshots/grass-desktop-explore.png');
    await desktop.close();

    const mobile = await openPage({ width: 390, height: 844 }, 'mobile');
    await mobile.locator('#explore').click();
    await mobile.waitForFunction(() => document.body.classList.contains('exploring'));
    await mobile.waitForTimeout(1200);
    await mobile.screenshot({ path: path.join(out, 'grass-mobile-explore.png'), fullPage: false });
    report.screenshots.push('screenshots/grass-mobile-explore.png');
    await mobile.close();

    assert.deepEqual(report.pageErrors, [], 'Uncaught page errors were reported');
    assert.deepEqual(report.shaderErrors, [], 'Shader compilation errors were reported');
    console.log(JSON.stringify(report, null, 2));
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
})().catch(error => {
  console.error(error.stack || String(error));
  process.exitCode = 1;
});
