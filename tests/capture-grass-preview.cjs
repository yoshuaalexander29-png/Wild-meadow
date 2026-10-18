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
  if (!file.startsWith(root + path.sep) && file !== path.join(root, 'index.html')) return res.writeHead(403).end('Forbidden');
  fs.readFile(file, (error, data) => {
    if (error) return res.writeHead(404).end('Not found');
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(data);
  });
});

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  const browser = await chromium.launch({ headless: true, args: ['--enable-webgl', '--ignore-gpu-blocklist', '--use-gl=angle', '--use-angle=swiftshader'] });
  const report = {
    url: `http://127.0.0.1:${address.port}/index.html`,
    screenshots: [],
    grassModuleStatus: null,
    characterAssetStatus: null,
    moveControlCount: null,
    exploreEnabled: false,
    pageErrors: [],
    consoleErrors: [],
    shaderErrors: [],
    failedRequests: [],
  };

  async function openPage(viewport) {
    const page = await browser.newPage({ viewport, deviceScaleFactor: 1, isMobile: viewport.width < 700, hasTouch: viewport.width < 700 });
    page.on('pageerror', error => report.pageErrors.push(String(error)));
    page.on('console', message => {
      if (message.type() === 'error') {
        report.consoleErrors.push(message.text());
        if (/shader|compile|GL_INVALID|THREE\\.WebGLProgram/i.test(message.text())) report.shaderErrors.push(message.text());
      }
    });
    page.on('requestfailed', request => report.failedRequests.push({ url: request.url(), error: request.failure()?.errorText }));
    page.on('response', response => {
      const url = response.url();
      if (new URL(url).pathname.endsWith('/grass-system.js')) report.grassModuleStatus = response.status();
      if (url.includes('Knight_Male.glb')) report.characterAssetStatus = response.status();
    });
    await page.goto(report.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector('canvas', { timeout: 30000 });
    await page.waitForFunction(() => document.querySelector('canvas')?.width > 0, undefined, { timeout: 15000 });
    await page.waitForTimeout(5000);
    assert.equal(report.grassModuleStatus, 200, 'grass-system.js must load');
    assert.equal(report.characterAssetStatus, 200, 'The warrior GLB must load');
    assert.equal(await page.locator('#explore-toggle').count(), 1, 'Explore toggle must exist');
    report.moveControlCount = await page.locator('[data-move]').count();
    assert.equal(report.moveControlCount, 5, 'Expected four directions and Jump');
    return page;
  }

  try {
    const desktop = await openPage({ width: 1440, height: 900 });
    await desktop.screenshot({ path: path.join(out, 'wild-meadow-desktop-cinematic.png'), fullPage: false, timeout: 60000 });
    report.screenshots.push('screenshots/wild-meadow-desktop-cinematic.png');

    await desktop.locator('#explore-toggle').click();
    await desktop.waitForFunction(() => document.body.classList.contains('exploring'), undefined, { timeout: 5000 });
    report.exploreEnabled = true;
    await desktop.keyboard.down('w');
    await desktop.waitForTimeout(600);
    await desktop.keyboard.up('w');
    await desktop.waitForTimeout(800);
    await desktop.screenshot({ path: path.join(out, 'wild-meadow-desktop-explore.png'), fullPage: false });
    report.screenshots.push('screenshots/wild-meadow-desktop-explore.png');
    await desktop.close();

    const mobile = await openPage({ width: 390, height: 844 });
    await mobile.locator('#explore-toggle').click();
    await mobile.waitForFunction(() => document.body.classList.contains('exploring'), undefined, { timeout: 5000 });
    assert.equal(await mobile.locator('[data-move]').count(), 5);
    await mobile.waitForTimeout(800);
    await mobile.screenshot({ path: path.join(out, 'wild-meadow-mobile-explore.png'), fullPage: false });
    report.screenshots.push('screenshots/wild-meadow-mobile-explore.png');
    await mobile.close();

    assert.deepEqual(report.pageErrors, [], 'Uncaught page errors were reported');
    assert.deepEqual(report.shaderErrors, [], 'Shader compilation errors were reported');
    console.log(JSON.stringify(report, null, 2));
  } catch (error) {
    console.error('Browser evidence report:', JSON.stringify(report, null, 2));
    throw error;
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error('Browser capture failed:', error.stack || String(error)); process.exitCode = 1; });
