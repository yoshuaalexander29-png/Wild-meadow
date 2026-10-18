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
  const baseUrl = `http://127.0.0.1:${address.port}/index.html`;
  const browser = await chromium.launch({ headless: true, args: ['--enable-webgl', '--ignore-gpu-blocklist', '--use-gl=angle', '--use-angle=swiftshader'] });
  const report = { url: baseUrl, screenshots: [], views: [], pageErrors: [], consoleErrors: [], shaderErrors: [], failedRequests: [] };
  async function capture(viewport, label, shot) {
    const page = await browser.newPage({ viewport, deviceScaleFactor: 1, isMobile: viewport.width < 700, hasTouch: viewport.width < 700 });
    const localErrors = [];
    page.on('pageerror', error => { report.pageErrors.push(String(error)); localErrors.push(String(error)); });
    page.on('console', message => {
      if (message.type() === 'error') {
        report.consoleErrors.push(message.text());
        if (/shader|compile|GL_INVALID|THREE\\.WebGLProgram|WebGLRenderer/i.test(message.text())) report.shaderErrors.push(message.text());
      }
    });
    page.on('requestfailed', request => report.failedRequests.push({ url: request.url(), error: request.failure()?.errorText }));
    const assetStatuses = {};
    page.on('response', response => {
      const url = response.url();
      for (const [key, suffix] of Object.entries({ grass: '/grass-system.js', warrior: 'Knight_Male.glb', sword: 'Sword_Gold.glb' })) {
        if (url.includes(suffix)) assetStatuses[key] = response.status();
      }
    });
    await page.goto(`${baseUrl}?test=1&shot=${shot}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector('canvas', { timeout: 30000 });
    await page.waitForFunction(() => window.__wildMeadowDiagnostics?.frames > 30, undefined, { timeout: 30000 });
    await page.waitForTimeout(1800);
    const diag = await page.evaluate(() => window.__wildMeadowDiagnostics || null);
    assert.ok(diag, 'browser diagnostics object must exist');
    assert.ok(diag.frames > 30, 'animation loop must render frames');
    assert.equal(diag.grassReady, true, 'grass system must initialize');
    assert.ok((assetStatuses.grass || 0) === 200, 'grass module must load with HTTP 200');
    assert.ok((assetStatuses.warrior || 0) === 200, 'warrior GLB must load with HTTP 200');
    assert.ok(diag.loadedAssets.includes('Silverland knight'), 'warrior GLB must finish loading');
    assert.equal(await page.locator('#explore-ui').count(), 0, 'visual-only scene must not expose prototype UI');
    const screenshot = `screenshots/${label}.png`;
    await page.screenshot({ path: path.join(root, screenshot), fullPage: false, timeout: 60000 });
    report.screenshots.push(screenshot);
    report.views.push({ label, viewport, shot, diagnostics: diag, assetStatuses, pageErrors: localErrors });
    await page.close();
  }
  try {
    await capture({ width: 1440, height: 900 }, 'wild-meadow-establishing-desktop', 0);
    await capture({ width: 1440, height: 900 }, 'wild-meadow-midland-desktop', 6.5);
    await capture({ width: 1440, height: 900 }, 'wild-meadow-character-desktop', 15.5);
    await capture({ width: 390, height: 844 }, 'wild-meadow-mobile', 0);
    assert.deepEqual(report.pageErrors, [], 'uncaught page errors were reported');
    assert.deepEqual(report.shaderErrors, [], 'shader/WebGL compilation errors were reported');
    assert.deepEqual(report.failedRequests, [], 'network requests failed');
    fs.writeFileSync(path.join(out, 'browser-report.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
  } catch (error) {
    fs.writeFileSync(path.join(out, 'browser-report.json'), JSON.stringify(report, null, 2));
    console.error('Browser evidence report:', JSON.stringify(report, null, 2));
    throw error;
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error('Browser capture failed:', error.stack || String(error)); process.exitCode = 1; });
