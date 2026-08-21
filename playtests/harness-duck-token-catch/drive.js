// CDP driver v5 for Duck's Token Catch — exact-state autoplayer, throttled for rAF headroom.
"use strict";
const http = require('http');
const fs = require('fs');
const path = require('path');

const OUT = '/workspace/playtests/duck-token-catch';
const FF_START = parseInt(process.env.FF_START || '0', 10);
const log = (...a) => { const s = a.map(x => typeof x === 'string' ? x : JSON.stringify(x)).join(' '); fs.appendFileSync(path.join(OUT, 'driver_out.log'), s + '\n'); console.log(s); };

function getJSON(url) {
  return new Promise((res, rej) => {
    http.get(url, r => { let d = ''; r.on('data', c => d += c); r.on('end', () => { try { res(JSON.parse(d)); } catch (e) { rej(e); } }); }).on('error', rej);
  });
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

const STATE_READ = `(() => {
  const g = window.__game;
  if (!g) return null;
  return {
    state: g.state, won: g.won,
    tokens: g.tokens, timeLeft: Math.round(g.timeLeft * 10) / 10,
    hearts: g.hearts, duckX: Math.round(g.duckX),
    items: g.items
  };
})()`;

(async () => {
  const watchdog = setTimeout(() => { log("WATCHDOG_KILL"); process.exit(2); }, 420000);

  const targets = await getJSON('http://127.0.0.1:9222/json/list');
  const page = targets.find(t => t.type === 'page');
  if (!page) { log('NO_PAGE_TARGET'); process.exit(1); }
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let idc = 0;
  const pending = new Map();
  const errors = [];
  ws.onmessage = ev => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
    else if (m.method) {
      if (m.method === 'Runtime.exceptionThrown') errors.push('EXC: ' + (m.params.exceptionDetails && (m.params.exceptionDetails.exception ? m.params.exceptionDetails.exception.description : m.params.exceptionDetails.text)));
      if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errors.push('CONSOLE.ERROR: ' + m.params.args.map(a => a.value || a.description || '').join(' '));
      if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') errors.push('LOG.ERROR: ' + m.params.entry.text);
    }
  };
  const rpc = (method, params = {}) => new Promise((res, rej) => {
    const id = ++idc;
    const t = setTimeout(() => { pending.delete(id); rej(new Error('RPC_TIMEOUT ' + method)); }, 8000);
    pending.set(id, m => { clearTimeout(t); res(m); });
    ws.send(JSON.stringify({ id, method, params }));
  });
  await new Promise(res => ws.onopen = res);

  const evalJS = async (expr) => {
    const r = await rpc('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    if (r.result && r.result.exceptionDetails) errors.push('EVAL_EXC: ' + JSON.stringify(r.result.exceptionDetails.exception));
    return r.result ? r.result.result.value : null;
  };

  await rpc('Page.enable'); await rpc('Runtime.enable'); await rpc('Log.enable');
  const tapSrc = fs.readFileSync(path.join(OUT, 'tap.js'), 'utf8');
  await rpc('Page.addScriptToEvaluateOnNewDocument', { source: tapSrc });

  let W_CSS = parseInt(process.env.WIN_W || '540', 10);
  let H_CSS = parseInt(process.env.WIN_H || '960', 10);
  let WATER_Y = 0.68 * H_CSS;
  let DUCK_CY = WATER_Y - 34;
  let BAND_TOP = DUCK_CY - 60;
  const attempts = [];

  for (let attempt = 1; attempt <= 8; attempt++) {
    const a = { n: attempt, events: [] };
    log('ATTEMPT_START', attempt);
    await rpc('Page.navigate', { url: 'http://127.0.0.1:8123/index.html' });
    await sleep(2200);
    log('NAV_DONE', attempt);
    // self-calibrate to the REAL viewport (chromium clamps minimum window width)
    const vp = await evalJS(`({ iw: window.innerWidth, ih: window.innerHeight })`);
    if (vp && vp.iw) {
      W_CSS = vp.iw; H_CSS = vp.ih;
      WATER_Y = 0.68 * H_CSS; DUCK_CY = WATER_Y - 34; BAND_TOP = DUCK_CY - 60;
      log('GEOMETRY', JSON.stringify(vp), 'W_CSS=' + W_CSS, 'DUCK_CY=' + DUCK_CY);
    }

    const rect = await evalJS(`(() => { const r = document.getElementById('startBtn').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
    if (!rect) { a.result = 'NO_START_BTN'; attempts.push(a); fs.appendFileSync(path.join(OUT, 'run_log.jsonl'), JSON.stringify(a) + '\n'); continue; }
    log('RECT', JSON.stringify(rect));
    a.clickT = Date.now();
    await rpc('Input.dispatchMouseEvent', { type: 'mouseMoved', x: rect.x, y: rect.y });
    await rpc('Input.dispatchMouseEvent', { type: 'mousePressed', x: rect.x, y: rect.y, button: 'left', clickCount: 1 });
    await rpc('Input.dispatchMouseEvent', { type: 'mouseReleased', x: rect.x, y: rect.y, button: 'left', clickCount: 1 });
    await rpc('Input.dispatchMouseEvent', { type: 'mousePressed', x: W_CSS / 2, y: H_CSS * 0.62, button: 'left', clickCount: 1 });
    await sleep(120);
    log('LOOP_START', attempt);

    let result = 'TIMEOUT';
    let duckX = W_CSS / 2;
    let commit = null;        // committed token {x}
    let dodgeUntil = 0, dodgeDir = 0;
    let lastTokens = 0, lastHearts = 3;
    let lastG = null;
    const tracks = new Map(); // identity "x|vy|token" -> last seen y (for spawn/miss metrics)
    const t0 = Date.now();
    let lastTlLog = 0;
    const trace = [];

    for (let i = 0; i < 90 * 10; i++) { // 90s at ~10Hz
      await sleep(100);
      const g = await evalJS(STATE_READ);
      if (!g) { await sleep(40); continue; }
      lastG = g;
      const now = Date.now();
      const tSec = (now - t0) / 1000;

      // --- bookkeeping ---
      if (g.tokens > lastTokens) { a.events.push({ t: Math.round(tSec * 10) / 10, e: 'catch', tokens: g.tokens }); }
      if (g.hearts < lastHearts) { a.events.push({ t: Math.round(tSec * 10) / 10, e: 'cake_hit', hearts: g.hearts }); }
      lastTokens = g.tokens; lastHearts = g.hearts;

      const nowIds = new Set();
      for (const it of g.items) {
        const id = it.x + '|' + it.vy + '|' + it.token; // x sways ±14 — tolerate below
        // collapse to a stable bucket: use rounded x in steps of 32 to absorb sway
        const bx = Math.round(it.x / 32) * 32;
        const bid = bx + '|' + it.vy + '|' + it.token;
        nowIds.add(bid);
        if (!tracks.has(bid)) {
          tracks.set(bid, it.y);
          a.events.push({ t: Math.round(tSec * 10) / 10, e: 'spawn', token: it.token, x: it.x });
        } else {
          tracks.set(bid, it.y);
        }
      }
      // items that vanished: caught (counter went up) or fell off (miss)
      for (const [bid, lastY] of tracks) {
        if (!nowIds.has(bid)) {
          tracks.delete(bid);
          // classify: if it was a token and the counter didn't rise at this tick, it fell past
          // (catches already logged above via counter delta)
        }
      }
      if (tSec - lastTlLog > 5) { lastTlLog = tSec; a.events.push({ t: Math.round(tSec * 10) / 10, e: 'tl', timeLeft: g.timeLeft }); }

      duckX = g.duckX;

      // --- steering ---
      const tokens = g.items.filter(it => it.token);
      const cakes = g.items.filter(it => !it.token);
      const danger = cakes.filter(c => {
        const timeToBand = (BAND_TOP - c.y) / c.vy;
        return timeToBand < 1.2 && timeToBand > -0.25 && Math.abs(c.x - duckX) < 66;
      });

      let tx = duckX;
      if (danger.length) {
        const d = danger[0];
        dodgeDir = d.x >= duckX ? -1 : 1;
        tx = duckX + dodgeDir * 200;
        const leftSpace = duckX - 60, rightSpace = (W_CSS - 60) - duckX;
        if (leftSpace < 50 && dodgeDir < 0) tx = duckX + 200;
        if (rightSpace < 50 && dodgeDir > 0) tx = duckX - 200;
        dodgeUntil = now + 400;
        commit = null;
      } else if (now < dodgeUntil) {
        tx = duckX + dodgeDir * 200;
      } else {
        // pick the token that can be caught SOONEST (arrival or duck travel)
        let best = null, bestCatch = Infinity;
        for (const tk of tokens) {
          if (tk.y > DUCK_CY + 40) continue; // already past the catch zone
          const timeToBand = Math.max(0, (BAND_TOP - tk.y) / tk.vy);
          const travel = Math.abs(tk.x - duckX) / 350;
          const catchTime = Math.max(timeToBand, travel);
          if (catchTime < bestCatch) { bestCatch = catchTime; best = tk; }
        }
        // keep the current commit only if it is still (near-)best; otherwise switch
        if (commit) {
          const live = tokens.find(t => Math.abs(t.x - commit.x) < 26 && t.y < DUCK_CY + 85);
          if (live) {
            const tB = Math.max(0, (BAND_TOP - live.y) / live.vy);
            const tr = Math.abs(live.x - duckX) / 350;
            const liveCatch = Math.max(tB, tr);
            if (best && bestCatch < liveCatch - 0.4) commit = { x: best.x, y: best.y };
            else if (!best) commit = null;
            else { commit.x = live.x; commit.y = live.y; }
          } else commit = null; // caught / fell past / despawned
        } else if (best) commit = { x: best.x, y: best.y };
        if (commit) tx = commit.x;
        else if (tokens.length) {
          // park under the token closest to the catch zone to cut transit
          const nearest = tokens.reduce((p, c) => (c.y > p.y ? c : p));
          tx = nearest.x;
        } else {
          // nothing on screen: park center to cut expected future transit
          tx = W_CSS / 2;
        }
      }
      tx = Math.max(60, Math.min(W_CSS - 60, tx));
      if (Math.abs(tx - duckX) > 8) {
        await rpc('Input.dispatchMouseEvent', { type: 'mouseMoved', x: tx, y: H_CSS * 0.62 });
      }

      // trace: first 15s of attempt 1, every 5th tick
      if (attempt === 1 && tSec < 15 && i % 5 === 0) {
        trace.push({ t: Math.round(tSec * 10) / 10, duck: duckX, tx: Math.round(tx), nT: tokens.length, nC: cakes.length, commit: commit ? commit.x : null, items: g.items.slice(0, 6).map(it => it.x + '/' + Math.round(it.y) + (it.token ? 'T' : 'C')) });
      }

      if (g.state === 'over') { result = g.won ? 'WIN' : 'LOSE'; a.endT = Date.now(); break; }
      if (now - t0 > 88000) break;
    }
    if (!a.endT) a.endT = Date.now();
    a.result = result;
    a.trace = trace;

    const spawns = a.events.filter(e => e.e === 'spawn');
    a.metrics = {
      tokenSpawns: spawns.filter(e => e.token).length,
      cakeSpawns: spawns.filter(e => !e.token).length,
      catches: a.events.filter(e => e.e === 'catch').length,
      cakeHits: a.events.filter(e => e.e === 'cake_hit').length,
      finalTl: lastG && lastG.timeLeft !== undefined ? lastG.timeLeft : null
    };
    attempts.push(a);
    fs.appendFileSync(path.join(OUT, 'run_log.jsonl'), JSON.stringify(a) + '\n');
    log('ATTEMPT', JSON.stringify({ n: a.n, result: a.result, dur: ((a.endT - a.clickT) / 1000).toFixed(1), metrics: a.metrics }));
    if (result === 'WIN') break;
  }

  // audio dump
  let audioInfo = null;
  try {
    audioInfo = await Promise.race([
      evalJS(`(async () => {
        if (!window.__duckTap || !window.__duckTap.started()) return { started: false };
        const b = await window.__duckTap.stop();
        if (!b) return { started: true, size: 0 };
        const fr = new FileReader();
        const p = new Promise(function (res) { fr.onloadend = function () { res(fr.result); }; });
        fr.readAsDataURL(b);
        const dataUrl = await p;
        return { started: true, size: b.size, dataUrl: dataUrl };
      })()`),
      sleep(15000).then(() => { log('AUDIO_TIMEOUT'); return null; })
    ]);
  } catch (e) { log('AUDIO_EVAL_FAIL', e.message); }
  if (audioInfo && audioInfo.dataUrl) {
    const buf = Buffer.from(audioInfo.dataUrl.split(',')[1], 'base64');
    fs.writeFileSync(path.join(OUT, 'audio.webm'), buf);
    log('AUDIO_SAVED', buf.length, 'bytes');
  } else {
    log('AUDIO_MISSING', JSON.stringify(audioInfo));
  }

  const summary = { ffStart: FF_START, attempts, errors };
  fs.writeFileSync(path.join(OUT, 'run_log.json'), JSON.stringify(summary, null, 2));
  log('RUN_SUMMARY', JSON.stringify(summary));
  clearTimeout(watchdog);
  ws.close();
  process.exit(0);
})().catch(e => { log('DRIVER_FAIL', e && e.stack || String(e)); process.exit(1); });
