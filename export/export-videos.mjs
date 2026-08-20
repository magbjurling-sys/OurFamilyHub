#!/usr/bin/env node
/**
 * OurFamilyHub — export the 9 how-to scenes × 2 languages to MP4 + poster JPG.
 *
 *   npm i playwright && npx playwright install chromium     (ffmpeg must be on PATH)
 *   node export/export-videos.mjs                    # all 18
 *   node export/export-videos.mjs loop morning       # only these topics
 *
 * Renders the real scenes from animations.jsx + howto-scenes.jsx, stepping the
 * timeline with the engine's own data-om-seek-to-time-frame event — one
 * screenshot per frame at 1920×1080 (deviceScaleFactor 1.5 over the 1280×720
 * stage, so text stays vector-crisp), piped straight into libx264.
 *
 * Output: videos/howto-<tema>-<sprak>.mp4  and  videos/howto-<tema>-<sprak>.jpg
 */
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { readFile, mkdir, writeFile, stat, rm } from 'node:fs/promises';
import { extname, join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'videos');
const TMP = join(ROOT, '.export-tmp-' + (process.env.EXPORT_ID || '0'));
const FPS = 30, W = 1920, H = 1080;
const MAX_MP4 = 4 * 1024 * 1024, MAX_JPG = 250 * 1024;
const BUDGET = 3.7 * 1024 * 1024;  // aim under the 4 MB ceiling

const CHAPTERS = [
  { id: 'setup',     dur: 34 },
  { id: 'loop',      dur: 24 },
  { id: 'blocks',    dur: 24 },
  { id: 'ladder',    dur: 23.5 },
  { id: 'cashout',   dur: 25 },
  { id: 'allowance', dur: 20.5 },
  { id: 'morning',   dur: 17.5 },
  { id: 'widgets',   dur: 20 },
  { id: 'ownphone',  dur: 20 },
];

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.jsx': 'text/plain', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg' };
const mb = b => (b / 1048576).toFixed(2) + ' MB';

function serve(port) {
  const server = createServer(async (req, res) => {
    try {
      const p = join(ROOT, decodeURIComponent(req.url.split('?')[0]));
      const body = await readFile(p);
      res.writeHead(200, { 'content-type': MIME[extname(p)] || 'application/octet-stream' });
      res.end(body);
    } catch { res.writeHead(404).end('nope'); }
  });
  return new Promise(r => server.listen(port, () => r(server)));
}

function ffmpeg(args) {
  const p = spawn('ffmpeg', args, { stdio: ['pipe', 'ignore', 'pipe'] });
  let err = '';
  p.stderr.on('data', d => { err += d; });
  p.done = new Promise((res, rej) => p.on('close', c => c === 0 ? res() : rej(new Error(err.slice(-1400)))));
  return p;
}

async function psnr(a, b) {
  const p = spawn('ffmpeg', ['-y', '-i', a, '-i', b, '-lavfi', 'psnr', '-f', 'null', '-'], { stdio: ['ignore', 'ignore', 'pipe'] });
  let err = '';
  p.stderr.on('data', d => { err += d; });
  await new Promise(r => p.on('close', r));
  const m = err.match(/average:([0-9.]+|inf)/);
  return m ? m[1] : '?';
}

async function exportOne(page, ch, lang, port) {
  const base = `howto-${ch.id}-${lang}`;
  const frames = Math.round(ch.dur * FPS);
  const bitrate = Math.min(2_300_000, Math.floor(BUDGET * 8 / ch.dur));
  const mp4 = join(OUT, base + '.mp4');

  await page.goto(`http://localhost:${port}/export/export-frame.html?tema=${ch.id}&sprak=${lang}`, { waitUntil: 'load' });
  try {
    await page.waitForFunction('window.__ready && window.__ready()', null, { timeout: 45_000 });
  } catch (e) {
    const why = await page.evaluate(() => ({ err: window.__err, embed: typeof window.HowToEmbed, react: typeof window.React, babel: typeof window.Babel }));
    throw new Error('scenen ble aldri klar — ' + JSON.stringify(why));
  }
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(600);
  const svg = page.locator('svg[data-om-exportable-video-with-duration-secs]');

  const enc = ffmpeg(['-y', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
    '-vf', `scale=${W}:${H}:flags=lanczos`, '-r', String(FPS),
    '-c:v', 'libx264', '-profile:v', 'main', '-level', '4.0', '-pix_fmt', 'yuv420p',
    '-b:v', String(bitrate), '-maxrate', String(Math.round(bitrate * 1.5)), '-bufsize', String(bitrate * 3),
    '-g', String(FPS * 2), '-keyint_min', String(FPS), '-sc_threshold', '0',
    '-movflags', '+faststart', '-an', mp4]);

  const posterAt = Math.round(frames * 0.15);
  let firstPng = null, lastPng = null, posterPng = null;

  for (let i = 0; i < frames; i++) {
    // mid-frame sampling; frame 0 nudged past the fade-in so it is never blank
    let t = Math.min((i + 0.5) / FPS, ch.dur - 0.001);
    if (i === 0) t = Math.min(0.55, ch.dur * 0.03);
    await page.evaluate(x => window.__seek(x), t);
    const png = await svg.screenshot({ type: 'png' });
    if (i === 0) firstPng = png;
    if (i === frames - 1) lastPng = png;
    if (i === posterAt) posterPng = png;
    if (!enc.stdin.write(png)) await new Promise(r => enc.stdin.once('drain', r));
    if (i % 60 === 0) process.stdout.write(`\r  ${base}  ${String(Math.round(i / frames * 100)).padStart(3)}%`);
  }
  enc.stdin.end();
  await enc.done;

  // poster: JPG at ~82, stepped down until it fits 250 kB
  const posterSrc = join(TMP, base + '-poster.png');
  await writeFile(posterSrc, posterPng);
  const jpg = join(OUT, base + '.jpg');
  for (const q of [3, 5, 7, 9, 12]) {
    const p = ffmpeg(['-y', '-i', posterSrc, '-q:v', String(q), jpg]);
    p.stdin.end();
    await p.done;
    if ((await stat(jpg)).size <= MAX_JPG) break;
  }

  let loopNote = '';
  if (ch.id === 'loop') {
    const a = join(TMP, base + '-first.png'), b = join(TMP, base + '-last.png');
    await writeFile(a, firstPng);
    await writeFile(b, lastPng);
    loopNote = `   loop-sjekk: PSNR første↔siste ramme = ${await psnr(a, b)} dB`;
  }

  const vSize = (await stat(mp4)).size, pSize = (await stat(jpg)).size;
  console.log(`\r  ${base}  ${mb(vSize)}${vSize > MAX_MP4 ? ' ⚠ over 4 MB' : ''} · poster ${(pSize / 1024).toFixed(0)} kB${pSize > MAX_JPG ? ' ⚠' : ''} · ${frames} rammer · ${Math.round(bitrate / 1000)} kbps${loopNote}`);
  return vSize + pSize;
}

const only = process.argv.slice(2);
const list = only.length ? CHAPTERS.filter(c => only.includes(c.id)) : CHAPTERS;
await mkdir(OUT, { recursive: true });
await mkdir(TMP, { recursive: true });
const port = Number(process.env.EXPORT_PORT || 8765);
const server = await serve(port);
const browser = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args:['--no-sandbox','--disable-dev-shm-usage'] });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 }, deviceScaleFactor: W / 1280 });
page.on('pageerror', e => console.log('  [side-feil] ' + e.message));
page.on('console', m => { if (m.type() === 'error') console.log('  [konsoll] ' + m.text()); });
page.on('requestfailed', r => console.log('  [nettverk] ' + r.url() + ' — ' + (r.failure() && r.failure().errorText)));

let total = 0;
for (const ch of list) for (const lang of ['en', 'no']) total += await exportOne(page, ch, lang, port);

await browser.close();
server.close();
await rm(TMP, { recursive: true, force: true });
console.log(`\nFerdig — ${list.length * 2} videoer + ${list.length * 2} postere i videos/ · totalt ${mb(total)}`);
console.log('Lyd: scenene er stumme — filene er eksportert uten lydspor.');
