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
  const report = { url: `http://127.0.0.1:${address.port}/index.html`, screenshots: [], grassModuleStatus: null, characterLoaded: false, hudCount: null, pageErrors: [], shaderErrors: [], failedRequests: [] };
  async function capture(viewport, filename) {
    const page = await browser.newPage({ viewport, deviceScaleFactor: 1, isMobile: viewport.width < 700, hasTouch: viewport.width < 700 });
    page.on('pageerror', error => report.pageErrors.push(String(error)));
    page.on('console', message => {
      if (message.type() === 'error' && /shader|compile|GL_INVALID|THREE\.WebGLProgram/i.test(message.text())) report.shaderErrors.push(message.text());
    });
    page.on('requestfailed', request => report.failedRequests.push({ url: request.url(), error: request.failure()?.errorText }));
    page.on('response', response => { if (new URL(response.url()).pathname.endsWith('/grass-system.js')) report.grassModuleStatus = response.status(); });
    await page.goto(report.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector('canvas', { timeout: 30000 });
    await page.waitForFunction(() => !!document.querySelector('canvas') && document.querySelectorAll('canvas').length === 1, undefined, { timeout: 10000 });
    await page.waitForTimeout(8000);
    report.characterLoaded = await page.evaluate(() => document.querySelector('canvas')?.width > 0 && performance.getEntriesByType('resource').some(r => r.name.includes('Knight_Male.glb')));
    report.hudCount = await page.locator('#hud, #caption, #touch-controls, [data-move], #explore, #reset, #motion, #cycle').count();
    assert.equal(report.grassModuleStatus, 200, 'grass-system.js must load');
    assert.equal(report.hudCount, 0, 'The visual showcase must not contain gameplay HUD/controls');
    await page.screenshot({ path: path.join(out, filename), fullPage: false });
    report.screenshots.push(`screenshots/${filename}`);
    await page.close();
  }
  try {
    try {
      await capture({ width: 1440, height: 900 }, 'wild-meadow-desktop.png');
      await capture({ width: 390, height: 844 }, 'wild-meadow-mobile.png');
      assert.deepEqual(report.pageErrors, [], 'Uncaught page errors were reported');
      assert.deepEqual(report.shaderErrors, [], 'Shader compilation errors were reported');
    } catch (error) {
      console.error('Browser evidence report:', JSON.stringify(report, null, 2));
      throw error;
    }
    console.log(JSON.stringify(report, null, 2));
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error('Browser capture failed:', error.stack || String(error)); process.exitCode = 1; });
