// Ember Keytar live performance driver — plays a real song via CDP input events.
// Timeline: REC a 4s bass+drums loop (sine), loop it, then play Ode to Joy live (saw).
// Audio captured via in-page MediaRecorder tap on the AudioContext graph.
const URL = 'http://127.0.0.1:8124/ember-keytar/index.html';
const WS = 'http://127.0.0.1:9223/json';
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  const list = await (await fetch(WS)).json();
  const page = list.find(t => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 0; const pending = new Map();
  const send = (method, params = {}) => new Promise((res, rej) => {
    const mid = ++id; pending.set(mid, { res, rej });
    ws.send(JSON.stringify({ id: mid, method, params }));
  });
  ws.onmessage = ev => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { res, rej } = pending.get(msg.id); pending.delete(msg.id);
      msg.error ? rej(new Error(msg.error.message)) : res(msg.result);
    } else if (msg.method === 'Runtime.exceptionThrown') {
      console.log('PAGE EXCEPTION:', (msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text).slice(0, 200));
    }
  };
  await new Promise(r => ws.onopen = r);
  await send('Page.enable'); await send('Runtime.enable');
  await send('Page.navigate', { url: URL });
  await sleep(2500);

  const evalJS = async (expr, awaitPromise = false) => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise });
    if (r.exceptionDetails) throw new Error('eval failed: ' + (r.exceptionDetails.exception?.description || r.exceptionDetails.text));
    return r.result.value;
  };

  // --- setup: create ctx, tap audio graph, start recorder ---
  const recState = await evalJS(`(async () => {
    getCtx();
    try {
      const dest = actx.createMediaStreamDestination();
      masterGain.connect(dest);
      window.__rec = new MediaRecorder(dest.stream, { mimeType: 'audio/webm;codecs=opus' });
      window.__chunks = [];
      window.__rec.ondataavailable = e => { if (e.data && e.data.size) window.__chunks.push(e.data); };
      window.__rec.start();
      return 'running:' + actx.state + ':wave=' + curWave + ':ctx=' + (actx.currentTime.toFixed(2));
    } catch (err) { return 'ERR:' + err.message; }
  })()`, true);
  console.log('REC SETUP:', recState);

  // --- element geometry (CSS px) ---
  const geo = await evalJS(`(() => {
    const c = s => { const r = document.querySelector(s).getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; };
    return {
      rec: c('#recBtn'), wave: c('#waveBtn'),
      kick: c('#padKick'), snare: c('#padSnare'), hat: c('#padHat'),
      keys: NOTES.map(n => { const r = n.el.getBoundingClientRect(); return { key: n.key, x: r.x + r.width / 2, y: r.y + r.height / 2 }; })
    };
  })()`);
  const keyXY = {}; geo.keys.forEach(k => keyXY[k.key] = { x: k.x, y: k.y });
  console.log('GEO ok, keys:', geo.keys.length, 'window:', await evalJS(`[innerWidth, innerHeight].join('x')`));

  // --- input helpers ---
  const key = (k, type) => {
    const code = 'Key' + k.toUpperCase();
    const vk = k.toUpperCase().charCodeAt(0);
    return send('Input.dispatchKeyEvent', { type, key: k, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk });
  };
  const press = (k, t, dur) => { at(t, () => key(k, 'keyDown')); at(t + dur, () => key(k, 'keyUp')); };
  const clickXY = (p, t) => at(t, async () => {
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: p.x, y: p.y, button: 'left', clickCount: 1 });
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: p.x, y: p.y, button: 'left', clickCount: 1 });
  });

  // --- timeline scheduler ---
  const T0 = performance.now();
  const events = [];
  const at = (t, fn) => events.push({ t, fn });
  const run = () => {
    events.sort((a, b) => a.t - b.t);
    for (const e of events) setTimeout(() => e.fn(), Math.max(0, T0 + e.t * 1000 - performance.now()));
  };

  // --- the performance ---
  // wave to SINE for the bass
  clickXY(geo.wave, 0.15); clickXY(geo.wave, 0.30);
  // REC on
  clickXY(geo.rec, 0.60);
  // bass roots (C4 a, A4 h, F4 f, G4 g) — one per beat-pair, 0.9s holds
  press('a', 0.9, 0.9); press('h', 1.9, 0.9); press('f', 2.9, 0.9); press('g', 3.9, 0.9);
  // drums: kick 1,3,5,7 · snare 2,6 · hat 2,4,6,8
  clickXY(geo.kick, 0.9); clickXY(geo.kick, 1.9); clickXY(geo.kick, 2.9); clickXY(geo.kick, 3.9);
  clickXY(geo.snare, 1.4); clickXY(geo.snare, 3.4);
  clickXY(geo.hat, 1.4); clickXY(geo.hat, 2.4); clickXY(geo.hat, 3.4); clickXY(geo.hat, 4.4);
  // REC off -> auto loop
  clickXY(geo.rec, 5.0);
  // wave back to SAW for the melody
  clickXY(geo.wave, 5.3); clickXY(geo.wave, 5.6);

  // Ode to Joy, melody live (saw) — quarters 0.4s, dotted 0.65s, final hold 1.0s
  const M = 9.0;
  const notes = [
    ['d', 0, .4], ['d', .5, .4], ['f', 1.0, .4], ['g', 1.5, .4],
    ['g', 2.0, .4], ['f', 2.5, .4], ['d', 3.0, .4], ['s', 3.5, .4],
    ['a', 4.0, .4], ['a', 4.5, .4], ['s', 5.0, .4], ['d', 5.5, .4],
    ['d', 6.0, .65], ['s', 6.75, .4], ['s', 7.25, .65],
    ['d', 8.0, .4], ['d', 8.5, .4], ['f', 9.0, .4], ['g', 9.5, .4],
    ['g', 10.0, .4], ['f', 10.5, .4], ['d', 11.0, .4], ['s', 11.5, .4],
    ['a', 12.0, .4], ['a', 12.5, .4], ['s', 13.0, .4], ['d', 13.5, .4],
    ['s', 14.0, .65], ['a', 14.75, .4], ['a', 15.25, 1.0]
  ];
  for (const [k, off, dur] of notes) press(k, M + off, dur);

  run();
  console.log('performance scheduled:', events.length, 'events, ends at', (Math.max(...events.map(e => e.t))).toFixed(1), 's');

  // --- wait, then export audio ---
  await sleep((Math.max(...events.map(e => e.t)) + 1.6) * 1000);
  const stopRes = await evalJS(`(async () => {
    if (window.__rec && window.__rec.state !== 'inactive') window.__rec.stop();
    window.__recDone = false;
    window.__rec.onstop = () => {
      const blob = new Blob(window.__chunks, { type: 'audio/webm' });
      const fr = new FileReader();
      fr.onload = () => { window.__b64 = fr.result.split(',')[1]; window.__recDone = true; };
      fr.readAsDataURL(blob);
    };
    return 'stop issued';
  })()`, true);
  console.log('STOP:', stopRes);
  for (let i = 0; i < 40; i++) { await sleep(250); if (await evalJS(`window.__recDone`)) break; }
  const len = await evalJS(`window.__b64.length`);
  console.log('b64 length:', len);
  const fs = require('fs');
  const parts = [];
  for (let i = 0; i < len; i += 400000) parts.push(await evalJS(`window.__b64.slice(${i}, ${i + 400000})`));
  fs.writeFileSync('/workspace/keytar-audio.webm', Buffer.from(parts.join(''), 'base64'));
  console.log('AUDIO SAVED');

  // final status readout
  console.log('STATUS:', await evalJS(`document.getElementById('status').textContent`));
  console.log('LOOP:', await evalJS(`loopOn`), 'loopBuf:', await evalJS(`loopBuf.length`));
  process.exit(0);
}

main().catch(e => { console.error('DRIVER FAIL:', e.message); process.exit(1); });
