// rAF rate + game-time measurement
"use strict";
const http = require('http');
const fs = require('fs');

function getJSON(url) {
  return new Promise((res, rej) => {
    http.get(url, r => { let d = ''; r.on('data', c => d += c); r.on('end', () => { try { res(JSON.parse(d)); } catch (e) { rej(e); } }); }).on('error', rej);
  });
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const targets = await getJSON('http://127.0.0.1:9222/json/list');
  const page = targets.find(t => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let idc = 0; const pending = new Map();
  ws.onmessage = ev => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
  const rpc = (method, params = {}) => new Promise((res) => { const id = ++idc; pending.set(id, res); ws.send(JSON.stringify({ id, method, params })); });
  await new Promise(res => ws.onopen = res);
  await rpc('Page.enable'); await rpc('Runtime.enable');
  await rpc('Page.navigate', { url: 'http://127.0.0.1:8123/index.html' });
  await sleep(2500);

  const evalJS = async (expr) => (await rpc('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })).result.result.value;

  // measure rAF rate over 3s
  const raf = await evalJS(`new Promise(function (res) {
    let n = 0;
    const t0 = performance.now();
    function cb() { n++; if (performance.now() - t0 < 3000) requestAnimationFrame(cb); else res({ frames: n, ms: Math.round(performance.now() - t0), fps: Math.round(n / 3) }); }
    requestAnimationFrame(cb);
  })`);
  console.log('RAF', JSON.stringify(raf));

  // start game, measure game-time vs real-time over 5s
  const rect = await evalJS(`(() => { const r = document.getElementById('startBtn').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
  await rpc('Input.dispatchMouseEvent', { type: 'mousePressed', x: rect.x, y: rect.y, button: 'left', clickCount: 1 });
  await rpc('Input.dispatchMouseEvent', { type: 'mouseReleased', x: rect.x, y: rect.y, button: 'left', clickCount: 1 });
  await sleep(500);
  const t0 = Date.now();
  const tl0 = await evalJS(`window.__game ? window.__game.timeLeft : -1`);
  await sleep(5000);
  const tl1 = await evalJS(`window.__game ? window.__game.timeLeft : -1`);
  console.log('GAMETIME', JSON.stringify({ tl0, tl1, realSec: 5, gameSec: Math.round((tl0 - tl1) * 10) / 10 }));
  ws.close(); process.exit(0);
})().catch(e => { console.error('PROBE_FAIL', e); process.exit(1); });
