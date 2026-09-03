// Ember Keytar — Happy Birthday, TWO-HANDED, NO DRUMS (Sep 3, 2026)
// Left hand (sine): waltz oom-pah on a C/G bar grid, bars every 1500ms.
// Right hand (saw): the verified Aug 28 melody (F-major US standard),
//   phrase offsets 0/2500/5000/7500, pass length 10500ms, two passes,
//   ending C-major chord as QA'd. No REC, no loop, no percussion at all.
// MODE=audio: in-page MediaRecorder on the master gain, starts at t=0.
// MODE=video: white flash at t=0 as sync anchor; no recorder.
// Timeline runs INSIDE the page via its own timers calling noteDown/noteUp.
const PORT = process.env.PORT || '9223';
const URL = process.env.URL || 'http://127.0.0.1:8124/hb2/index.html';
const WS = `http://127.0.0.1:${PORT}/json`;
const MODE = process.env.MODE || 'audio';
const OUT = process.env.OUT || '/workspace/hb2/audio.webm';
const sleep = ms => new Promise(r => setTimeout(r, ms));

const TIMELINE = `(function(){
  var T = performance.now();
  function at(ms, fn){ setTimeout(fn, ms); }
  function key(k){ return NOTES.find(function(n){ return n.key === k; }); }
  // hnote: press key k at t, release at t+dur. wave applied right before
  // noteDown so each hand keeps its own timbre even when notes overlap.
  function hnote(k, t, dur, wave){
    var n = key(k);
    at(t, function(){ curWave = wave; noteDown(n); });
    at(t + dur, function(){ noteUp(n); });
  }
  if (window.__rec) at(0, function(){ try { window.__rec.start(); } catch(e){} });
  if (window.__flash) { at(0, function(){ window.__flash.style.display = 'block'; }); at(120, function(){ window.__flash.style.display = 'none'; }); }
  // headroom (mix clips at default 70), start on sine for the left hand
  at(100, function(){ volIn.value = '50'; onVol(); });
  // LEFT HAND (sine). Bars every 1500ms, C-bar (a g g) / G-bar (g g a)
  // alternating from t=1200. Root 420ms, pahs 250ms.
  function bar(s, C){ // C=true -> C-bar roots, false -> G-bar
    var root = C ? 'a' : 'g';
    var pah1 = C ? 'g' : 'g';
    var pah2 = C ? 'g' : 'a';
    hnote(root, s, 420, 'sine');
    hnote(pah1, s + 500, 250, 'sine');
    hnote(pah2, s + 1000, 250, 'sine');
  }
  var C = true;
  for (var bs = 1200; bs <= 23700; bs += 1500) { bar(bs, C); C = !C; }
  hnote('a', 25200, 420, 'sine'); // tail root under the ending chord
  // RIGHT HAND (saw) — melody enters at M=4200 on the C-bar.
  var M = 4200;
  var P1 = [['a',0,250],['a',250,250],['s',500,500],['a',1000,250],['f',1250,250],['d',1500,1000]];
  var P2 = [['a',0,250],['a',250,250],['s',500,500],['a',1000,250],['g',1250,250],['f',1500,1000]];
  var P3 = [['a',0,250],['a',250,250],['k',500,750],['h',1250,250],['f',1500,250],['d',1750,250],['s',2000,500]];
  var P4 = [['j',0,250],['j',250,250],['h',500,500],['f',1000,250],['g',1250,250],['f',1500,1500]];
  var PASS = P1.concat(P2.map(function(n){ return [n[0], n[1] + 2500, n[2]]; }))
    .concat(P3.map(function(n){ return [n[0], n[1] + 5000, n[2]]; }))
    .concat(P4.map(function(n){ return [n[0], n[1] + 7500, n[2]]; }));
  PASS.forEach(function(n){ hnote(n[0], M + n[1], n[2], 'sawtooth'); });
  PASS.forEach(function(n){ hnote(n[0], M + 10500 + n[1], n[2], 'sawtooth'); });
  // ending chord (as QA'd Aug 28): C-E-G at 25650, held 1200ms
  hnote('a', 25650, 1200, 'sawtooth'); hnote('d', 25650, 1200, 'sawtooth'); hnote('g', 25650, 1200, 'sawtooth');
  if (window.__rec) at(26950, function(){ try { window.__rec.stop(); } catch(e){} window.__done = true; });
  if (!window.__rec) at(26950, function(){ window.__done = true; });
  window.__schedEnd = 26950;
})();`;

async function main() {
  const list = await (await fetch(WS)).json();
  const page = list.find(t => t.type === 'page');
  if (!page) throw new Error('no page target on ' + WS);
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 0; const pending = new Map();
  const send = (m, p = {}) => new Promise((res, rej) => {
    const mid = ++id; pending.set(mid, { res, rej });
    ws.send(JSON.stringify({ id: mid, method: m, params: p }));
  });
  ws.onmessage = ev => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { res, rej } = pending.get(msg.id); pending.delete(msg.id);
      msg.error ? rej(new Error(msg.error.message)) : res(msg.result);
    } else if (msg.method === 'Runtime.exceptionThrown') {
      console.log('PAGE EXCEPTION:', (msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text).slice(0, 300));
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

  if (MODE === 'audio') {
    await evalJS(`(() => {
      getCtx();
      const dest = actx.createMediaStreamDestination();
      masterGain.connect(dest);
      window.__rec = new MediaRecorder(dest.stream, { mimeType: 'audio/webm;codecs=opus' });
      window.__chunks = [];
      window.__rec.ondataavailable = e => { if (e.data && e.data.size) window.__chunks.push(e.data); };
      window.__rec.onstop = () => {
        const blob = new Blob(window.__chunks, { type: 'audio/webm' });
        const fr = new FileReader();
        fr.onload = () => { window.__b64 = fr.result.split(',')[1]; window.__exported = true; };
        fr.readAsDataURL(blob);
      };
      return 'recorder ready:' + actx.state;
    })()`);
  } else {
    await evalJS(`(() => {
      const f = document.createElement('div');
      f.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:#fff;z-index:99999;display:none;';
      document.body.appendChild(f);
      window.__flash = f;
      // performance mode: hide the drum pads and transport (no drums, no loop)
      const s = document.createElement('style');
      s.textContent = '.drums,.transport{display:none!important}#keys{min-height:170px}';
      document.head.appendChild(s);
      return 'flash + perf css ready';
    })()`);
  }

  const pre = await evalJS(`JSON.stringify({keys:Object.keys(NOTES).length, recOn:recOn, curWave:curWave})`);
  await evalJS(`window.__ndlog = []; var _nd = noteDown, _nu = noteUp; var _T0 = performance.now();
    noteDown = function(n){ window.__ndlog.push('D:' + n.name + '@' + (performance.now()-_T0).toFixed(0)); return _nd(n); };
    noteUp = function(n){ window.__ndlog.push('U:' + n.name + '@' + (performance.now()-_T0).toFixed(0)); return _nu(n); }; 'wrapped'`);
  console.log('PREFLIGHT:', pre, 'MODE:', MODE);

  await evalJS(TIMELINE);
  console.log('timeline injected at', new Date().toISOString(), 'schedule end 26950ms');

  for (let i = 0; i < 100; i++) {
    await sleep(500);
    if (await evalJS(`window.__done === true`)) break;
  }
  const done = await evalJS(`window.__done === true`);
  console.log('done:', done);

  if (MODE === 'audio') {
    for (let i = 0; i < 40; i++) { await sleep(250); if (await evalJS(`window.__exported === true`)) break; }
    const len = await evalJS(`window.__b64.length`);
    const fs = require('fs');
    const parts = [];
    for (let i = 0; i < len; i += 400000) parts.push(await evalJS(`window.__b64.slice(${i}, ${i + 400000})`));
    fs.writeFileSync(OUT, Buffer.from(parts.join(''), 'base64'));
    console.log('AUDIO SAVED', OUT, 'b64 len', len);
    const nd = await evalJS(`window.__ndlog.length`);
    console.log('NDLOG count:', nd);
    const sample = await evalJS(`window.__ndlog.slice(0, 30).join('|')`);
    console.log('NDLOG head:', sample);
    const tail = await evalJS(`window.__ndlog.slice(-20).join('|')`);
    console.log('NDLOG tail:', tail);
  } else {
    const nd = await evalJS(`window.__ndlog.length`);
    console.log('NDLOG count:', nd);
    console.log('VIDEO PASS COMPLETE');
  }
  process.exit(0);
}

main().catch(e => { console.error('DRIVER FAIL:', e.message); process.exit(1); });
