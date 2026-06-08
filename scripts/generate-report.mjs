// Generates a self-contained test report (report.html at the repo root) that
// embeds the built game and renders the Vitest unit-test and Playwright e2e
// results side by side.
//
//   1. npm run build              -> dist/ (the playable game)
//   2. vitest run --reporter=json --outputFile=reports/vitest.json
//   3. PLAYWRIGHT_JSON_OUTPUT_NAME=reports/playwright.json playwright test --reporter=json
//   4. node scripts/generate-report.mjs
//
// The script reads whatever reports exist; a missing report degrades to a
// "not run" notice rather than failing.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => (existsSync(p) ? readFileSync(p, 'utf8') : null);
const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// --- Vitest -----------------------------------------------------------------
function parseVitest(json) {
  if (!json) return null;
  const d = JSON.parse(json);
  const files = (d.testResults || []).map((file) => ({
    name: file.name.replace(/.*[/\\]src[/\\]/, 'src/').replace(/.*[/\\]/, (m) => m),
    short: file.name.replace(/.*[/\\](src[/\\].*)$/, '$1').replace(/\\/g, '/'),
    tests: (file.assertionResults || []).map((t) => ({
      title: [...(t.ancestorTitles || []), t.title].join(' › '),
      status: t.status,
      duration: t.duration,
      failureMessages: t.failureMessages || [],
    })),
  }));
  return {
    total: d.numTotalTests,
    passed: d.numPassedTests,
    failed: d.numFailedTests,
    skipped: (d.numPendingTests || 0) + (d.numTodoTests || 0),
    success: d.success,
    durationMs: d.testResults?.reduce((a, f) => a + ((f.endTime || 0) - (f.startTime || 0)), 0),
    files,
  };
}

// --- Playwright -------------------------------------------------------------
function parsePlaywright(json) {
  if (!json) return null;
  let d;
  try {
    d = JSON.parse(json);
  } catch {
    return null;
  }
  const flat = [];
  const walk = (suite, trail) => {
    const here = suite.title ? [...trail, suite.title] : trail;
    for (const spec of suite.specs || []) {
      const result = (spec.tests || [])[0]?.results?.[0];
      flat.push({
        title: [...here, spec.title].filter(Boolean).join(' › '),
        status: spec.ok ? 'passed' : (result?.status || 'failed'),
        duration: result?.duration,
        error: result?.error?.message || result?.errors?.[0]?.message || '',
      });
    }
    for (const child of suite.suites || []) walk(child, here);
  };
  for (const s of d.suites || []) walk(s, []);
  const s = d.stats || {};
  return {
    total: flat.length,
    passed: flat.filter((t) => t.status === 'passed').length,
    failed: flat.filter((t) => t.status === 'failed' || t.status === 'timedOut').length,
    skipped: flat.filter((t) => t.status === 'skipped').length,
    durationMs: s.duration,
    files: [{ short: 'e2e/game.e2e.ts', tests: flat }],
  };
}

const vitest = parseVitest(read(join(root, 'reports', 'vitest.json')));
const pw = parsePlaywright(read(join(root, 'reports', 'playwright.json')));

// --- Rendering --------------------------------------------------------------
const ms = (n) => (n == null ? '' : n < 1000 ? `${Math.round(n)} ms` : `${(n / 1000).toFixed(2)} s`);

function suiteSummary(s) {
  if (!s) return '<span class="badge badge-skip">not run</span>';
  const cls = s.failed > 0 ? 'badge-fail' : 'badge-pass';
  return `<span class="badge ${cls}">${s.passed}/${s.total} passed</span>`;
}

function renderSuite(s) {
  if (!s) {
    return `<p class="notice">This suite was not run. Generate its report, then re-run <code>node scripts/generate-report.mjs</code>.</p>`;
  }
  const files = s.files
    .map((f) => {
      const rows = f.tests
        .map((t) => {
          const icon = t.status === 'passed' ? '✓' : t.status === 'skipped' ? '○' : '✗';
          const sc = t.status === 'passed' ? 'pass' : t.status === 'skipped' ? 'skip' : 'fail';
          const fail =
            t.status !== 'passed' && (t.failureMessages?.length || t.error)
              ? `<pre class="error">${esc((t.failureMessages || [t.error]).join('\n\n'))}</pre>`
              : '';
          return `<li class="test ${sc}"><span class="ico">${icon}</span><span class="tt">${esc(
            t.title
          )}</span><span class="dur">${ms(t.duration)}</span>${fail}</li>`;
        })
        .join('');
      return `<div class="file"><h4>${esc(f.short || f.name)}</h4><ul class="tests">${rows}</ul></div>`;
    })
    .join('');
  return files;
}

const overallPass = (!vitest || vitest.failed === 0) && (!pw || pw.failed === 0);
const totalTests = (vitest?.total || 0) + (pw?.total || 0);
const totalFailed = (vitest?.failed || 0) + (pw?.failed || 0);

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Tic-Tac-Toe — Game &amp; Test Report</title>
<style>
  :root { color-scheme: light dark; }
  * { box-sizing: border-box; }
  body { margin: 0; font: 15px/1.5 system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
    background: #0f1117; color: #e6e8ee; }
  header { padding: 28px 32px; background: linear-gradient(135deg,#1c2333,#11141d);
    border-bottom: 1px solid #232a3a; }
  h1 { margin: 0 0 6px; font-size: 26px; }
  .sub { color: #99a; margin: 0; font-size: 14px; }
  .overall { display: inline-block; margin-top: 14px; padding: 6px 14px; border-radius: 999px;
    font-weight: 600; font-size: 14px; }
  .ok { background: #0e2f1e; color: #4ade80; border: 1px solid #1c5236; }
  .bad { background: #331417; color: #f87171; border: 1px solid #5b2024; }
  .wrap { display: grid; grid-template-columns: minmax(360px, 1fr) minmax(420px, 1.2fr);
    gap: 24px; padding: 24px 32px; align-items: start; }
  @media (max-width: 1000px) { .wrap { grid-template-columns: 1fr; } }
  .panel { background: #161a26; border: 1px solid #232a3a; border-radius: 12px; overflow: hidden; }
  .panel > h2 { margin: 0; padding: 16px 20px; font-size: 17px; border-bottom: 1px solid #232a3a;
    display: flex; justify-content: space-between; align-items: center; gap: 12px; }
  .panel-body { padding: 16px 20px; }
  iframe { width: 100%; height: 760px; border: 0; background: #fff; display: block; }
  .badge { font-size: 12px; font-weight: 600; padding: 3px 10px; border-radius: 999px; }
  .badge-pass { background: #0e2f1e; color: #4ade80; }
  .badge-fail { background: #331417; color: #f87171; }
  .badge-skip { background: #2a2f3d; color: #99a; }
  .stats { display: flex; gap: 18px; padding: 4px 20px 14px; color: #aab; font-size: 13px; }
  .stats b { color: #e6e8ee; }
  .suite + .suite { margin-top: 8px; }
  .suite { border-top: 1px solid #232a3a; }
  .suite > summary { cursor: pointer; padding: 14px 20px; font-weight: 600; list-style: none;
    display: flex; justify-content: space-between; align-items: center; gap: 12px; }
  .suite > summary::-webkit-details-marker { display: none; }
  .suite > summary::before { content: "▸"; color: #667; margin-right: 8px; transition: transform .15s; }
  .suite[open] > summary::before { transform: rotate(90deg); display: inline-block; }
  .file { padding: 0 20px 14px; }
  .file h4 { margin: 10px 0 6px; font-size: 13px; color: #8b93a7; font-family: ui-monospace, monospace; }
  ul.tests { list-style: none; margin: 0; padding: 0; }
  li.test { display: grid; grid-template-columns: 18px 1fr auto; gap: 8px; align-items: baseline;
    padding: 4px 0; border-bottom: 1px solid #1c212e; font-size: 13.5px; }
  li.test .ico { font-weight: 700; }
  li.test.pass .ico { color: #4ade80; }
  li.test.fail .ico { color: #f87171; }
  li.test.skip .ico { color: #99a; }
  li.test .dur { color: #667; font-size: 12px; font-variant-numeric: tabular-nums; }
  .error { grid-column: 1 / -1; background: #1c0f12; color: #f8b4b4; padding: 10px;
    border-radius: 6px; margin: 6px 0 2px; white-space: pre-wrap; font-size: 12px; overflow-x: auto; }
  .notice { color: #99a; padding: 4px 20px 16px; }
  footer { padding: 18px 32px 32px; color: #667; font-size: 12px; }
  code { background: #232a3a; padding: 1px 6px; border-radius: 4px; font-size: 12.5px; }
</style>
</head>
<body>
<header>
  <h1>Tic-Tac-Toe — Game &amp; Test Report</h1>
  <p class="sub">Generated ${esc(new Date().toLocaleString())}</p>
  <div class="overall ${overallPass ? 'ok' : 'bad'}">
    ${overallPass ? '✓ All suites green' : '✗ ' + totalFailed + ' failing'} — ${totalTests} tests total
  </div>
</header>

<div class="wrap">
  <section class="panel">
    <h2>🎮 Live Game <span class="badge badge-skip">built &middot; playable</span></h2>
    <iframe src="dist/index.html" title="Tic-Tac-Toe game"></iframe>
  </section>

  <section class="panel">
    <h2>🧪 Test Results</h2>

    <details class="suite" open>
      <summary>Unit &amp; component tests <span>Vitest ${suiteSummary(vitest)}</span></summary>
      ${vitest ? `<div class="stats"><span><b>${vitest.passed}</b> passed</span><span><b>${vitest.failed}</b> failed</span>${
        vitest.skipped ? `<span><b>${vitest.skipped}</b> skipped</span>` : ''
      }<span><b>${ms(vitest.durationMs)}</b></span></div>` : ''}
      ${renderSuite(vitest)}
    </details>

    <details class="suite"${pw && pw.failed ? ' open' : ''}>
      <summary>End-to-end tests <span>Playwright ${suiteSummary(pw)}</span></summary>
      ${pw ? `<div class="stats"><span><b>${pw.passed}</b> passed</span><span><b>${pw.failed}</b> failed</span>${
        pw.skipped ? `<span><b>${pw.skipped}</b> skipped</span>` : ''
      }<span><b>${ms(pw.durationMs)}</b></span></div>` : ''}
      ${renderSuite(pw)}
    </details>
  </section>
</div>

<footer>
  Regenerate with: <code>npm run build</code> &middot;
  <code>npx vitest run --reporter=json --outputFile=reports/vitest.json</code> &middot;
  <code>PLAYWRIGHT_JSON_OUTPUT_NAME=reports/playwright.json npx playwright test --reporter=json</code> &middot;
  <code>node scripts/generate-report.mjs</code>.
  Open <code>report.html</code> over HTTP (e.g. <code>npx vite preview</code> or <code>npx serve .</code>) so the iframe can load the built game.
</footer>
</body>
</html>`;

writeFileSync(join(root, 'report.html'), html);
console.log('Wrote report.html');
console.log(`  Vitest:     ${vitest ? `${vitest.passed}/${vitest.total} passed` : 'not run'}`);
console.log(`  Playwright: ${pw ? `${pw.passed}/${pw.total} passed` : 'not run'}`);
