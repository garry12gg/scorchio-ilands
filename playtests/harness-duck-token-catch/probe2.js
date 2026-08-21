// interaction probe: does CDP mouse input generate pointer events the game listens to?
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

  const evalJS = async (expr) => {
    const r = await rpc('Runtime.evaluate', { expression: expr, returnByValue: true });
    return r.result ? r.result.result.value : null;
  };

  // instrument pointer events
  await evalJS(`(() => {
    window.__pm = [];
    const c = document.getElementById('game');
    c.addEventListener('pointermove', e => window.__pm.push({ t: 'pointermove', x: e.clientX }));
    c.addEventListener('pointerdown', e => window.__pm.push({ t: 'pointerdown', x: e.clientX }));
    window.addEventListener('pointerup', e => window.__pm.push({ t: 'pointerup', x: e.clientX }));
  })()`);

  // click start (real gesture)
  const rect = await evalJS(`(() => { const r = document.getElementById('startBtn').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
  await rpc('Input.dispatchMouseEvent', { type: 'mouseMoved', x: rect.x, y: rect.y });
  await rpc('Input.dispatchMouseEvent', { type: 'mousePressed', x: rect.x, y: rect.y, button: 'left', clickCount: 1 });
  await rpc('Input.dispatchMouseEvent', { type: 'mouseReleased', x: rect.x, y: rect.y, button: 'left', clickCount: 1 });
  await sleep(300);

  // CDP mouse press + move on canvas
  await rpc('Input.dispatchMouseEvent', { type: 'mousePressed', x: 300, y: 600, button: 'left', clickCount: 1 });
  await rpc('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 400, y: 600, button: 'left' });
  await sleep(300);
  await rpc('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 120, y: 600, button: 'left' });
  await sleep(300);

  const a = await evalJS(`JSON.stringify(window.__pm)`);
  console.log('POINTER_EVENTS', a);

  // synthetic pointer event fallback test
  await evalJS(`document.getElementById('game').dispatchEvent(new PointerEvent('pointermove', { clientX: 350, bubbles: true }))`);
  await sleep(200);
  const b = await evalJS(`JSON.stringify(window.__pm.slice(-3))`);
  console.log('AFTER_SYNTHETIC', b);

  // screenshot for visual confirmation
  const shot = await rpc('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('/workspace/playtests/duck-token-catch/shots/probe-interaction.png', Buffer.from(shot.result.data, 'base64'));
  console.log('SHOT_SAVED');
  ws.close(); process.exit(0);
})().catch(e => { console.error('PROBE_FAIL', e); process.exit(1); });
