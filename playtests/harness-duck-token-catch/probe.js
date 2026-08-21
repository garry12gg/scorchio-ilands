// geometry probe — dump real page metrics via CDP
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
  const r = await rpc('Runtime.evaluate', { expression: `({
    iw: window.innerWidth, ih: window.innerHeight,
    dpr: window.devicePixelRatio,
    cw: document.getElementById('game').width,
    ch: document.getElementById('game').height,
    screenW: screen.width, screenH: screen.height,
    startBtn: (() => { const b = document.getElementById('startBtn').getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height }; })(),
    bodyScroll: { sw: document.body.scrollWidth, sh: document.body.scrollHeight }
  })`, returnByValue: true });
  console.log(JSON.stringify(r.result.result.value, null, 2));
  ws.close(); process.exit(0);
})().catch(e => { console.error('PROBE_FAIL', e); process.exit(1); });
