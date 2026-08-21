// probe4: does the duck follow scripted mouse moves at 405x720? (reads exact duckX via __game)
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
  const evalJS = async (expr) => (await rpc('Runtime.evaluate', { expression: expr, returnByValue: true })).result.result.value;

  const rect = await evalJS(`(() => { const r = document.getElementById('startBtn').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
  await rpc('Input.dispatchMouseEvent', { type: 'mousePressed', x: rect.x, y: rect.y, button: 'left', clickCount: 1 });
  await rpc('Input.dispatchMouseEvent', { type: 'mouseReleased', x: rect.x, y: rect.y, button: 'left', clickCount: 1 });
  await sleep(300);
  // press canvas to arm pointer
  await rpc('Input.dispatchMouseEvent', { type: 'mousePressed', x: 200, y: 450, button: 'left', clickCount: 1 });
  await sleep(200);

  const duckX = () => evalJS(`window.__game ? Math.round(window.__game.duckX) : 'no-tap'`);

  console.log('start duckX:', await duckX());
  await rpc('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 330, y: 450 });
  await sleep(900);
  console.log('after move to 330:', await duckX());
  await rpc('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 80, y: 450 });
  await sleep(900);
  console.log('after move to 80:', await duckX());
  await rpc('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 200, y: 450 });
  await sleep(900);
  console.log('after move to 200:', await duckX());
  // synthetic fallback check
  await evalJS(`document.getElementById('game').dispatchEvent(new PointerEvent('pointermove', { clientX: 300, bubbles: true }))`);
  await sleep(700);
  console.log('after synthetic 300:', await duckX());
  ws.close(); process.exit(0);
})().catch(e => { console.error('PROBE_FAIL', e); process.exit(1); });
