// Ember Keytar — Happy Birthday, page-driven (no synthetic input at all).
// MODE=audio: MediaRecorder captures the performance (recorder starts at t=0).
// MODE=video: white flash at t=0 as the sync anchor + pad flashes; no recorder.
// The whole timeline runs INSIDE the page via its own timers, calling the
// page's own functions (noteDown/noteUp/hitDrum/startRec/stopRec/onWave) —
// nothing to drop, nothing to hijack.
const URL = 'http://127.0.0.1:8124/ember-keytar/index.html';
const WS = 'http://127.0.0.1:9223/json';
const MODE = process.env.MODE || 'audio';
const sleep = ms => new Promise(r => setTimeout(r, ms));

const TIMELINE = `(function(){
  var T = performance.now();
  function at(ms, fn){ setTimeout(fn, ms); }
  function key(k){ return NOTES.find(function(n){ return n.key === k; }); }
  function note(k, t, dur){ at(t, function(){ noteDown(key(k)); }); at(t + dur, function(){ noteUp(key(k)); }); }
  function drum(kind, t){ at(t, function(){
    hitDrum(kind);
    var el = document.getElementById('pad' + kind.charAt(0).toUpperCase() + kind.slice(1));
    if (el) { el.classList.add('down'); setTimeout(clearPads, 120); }
  }); }
  if (window.__rec) at(0, function(){ try { window.__rec.start(); } catch(e){} });
  if (window.__flash) { at(0, function(){ window.__flash.style.display = 'block'; }); at(100, function(){ window.__flash.style.display = 'none'; }); }
  // volume headroom (mix clips at default 70), then wave to SINE for the waltz bass
  at(100, function(){ volIn.value = '50'; onVol(); });
  at(200, onWave); at(400, onWave);
  // waltz loop: bpm 160 -> loopLen 3.0s == exactly two bars of 3/4 at 120
  at(300, function(){ bpmIn.value = '160'; onBpm(); });
  at(600, startRec);
  // record the waltz: bar1 C-G-G, bar2 G-G-C, oom-pah-pah, 0.5s grid
  // (G bar under phrase 4 so the B4 melody sits on the 3rd, not the tritone)
  note('a', 600, 450); drum('kick', 600);
  note('g', 1100, 450); drum('hat', 1100);
  note('g', 1600, 450); drum('hat', 1600);
  note('g', 2100, 450); drum('kick', 2100);
  note('g', 2600, 450); drum('hat', 2600);
  note('a', 3100, 450); drum('hat', 3100);
  at(5000, stopRec);          // loop starts ~5.06, cycle 1 at ~8.06
  at(5300, onWave); at(5600, onWave);  // back to SAW for the melody
  var M = 8060;               // melody enters exactly on loop cycle 1
  var P1 = [['a',0,250],['a',250,250],['s',500,500],['a',1000,250],['f',1250,250],['d',1500,1000]];
  var P2 = [['a',0,250],['a',250,250],['s',500,500],['a',1000,250],['g',1250,250],['f',1500,1000]];
  var P3 = [['a',0,250],['a',250,250],['k',500,750],['h',1250,250],['f',1500,250],['d',1750,250],['s',2000,500]];
  var P4 = [['j',0,250],['j',250,250],['h',500,500],['f',1000,250],['g',1250,250],['f',1500,1500]];
  // phrase start offsets: P1@0, P2@2500, P3@5000, P4@7500 (each 2.5s, P4 3.0s -> pass = 10.5s)
  var PASS = P1.map(function(n){ return [n[0], n[1] + 0, n[2]]; })
    .concat(P2.map(function(n){ return [n[0], n[1] + 2500, n[2]]; }))
    .concat(P3.map(function(n){ return [n[0], n[1] + 5000, n[2]]; }))
    .concat(P4.map(function(n){ return [n[0], n[1] + 7500, n[2]]; }));
  PASS.forEach(function(n){ note(n[0], M + n[1], n[2]); });
  PASS.forEach(function(n){ note(n[0], M + 10500 + n[1], n[2]); });
  note('a', 29060, 1200); note('d', 29060, 1200); note('g', 29060, 1200);
  if (window.__rec) at(30600, function(){ try { window.__rec.stop(); } catch(e){} window.__done = true; });
  if (!window.__rec) at(30600, function(){ window.__done = true; });
  window.__schedEnd = 30600;
})();`;

async function main() {
  const list = await (await fetch(WS)).json();
  const page = list.find(t => t.type === 'page');
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

  // mode-specific setup
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
      return 'flash ready';
    })()`);
  }

  const pre = await evalJS(`JSON.stringify({keys:Object.keys(keysDown).length, recOn:recOn, wave:curWave})`);
  await evalJS(`window.__ndlog = []; var _nd = noteDown, _nu = noteUp; var _T0 = performance.now();
    noteDown = function(n){ window.__ndlog.push('D:' + n.name + '@' + (performance.now()-_T0).toFixed(0)); return _nd(n); };
    noteUp = function(n){ window.__ndlog.push('U:' + n.name + '@' + (performance.now()-_T0).toFixed(0)); return _nu(n); }; 'wrapped'`);
  console.log('PREFLIGHT:', pre, 'MODE:', MODE);

  await evalJS(TIMELINE);
  console.log('timeline injected at', new Date().toISOString());

  // wait for completion
  for (let i = 0; i < 80; i++) {
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
    fs.writeFileSync('/workspace/keytar-birthday-audio.webm', Buffer.from(parts.join(''), 'base64'));
    console.log('AUDIO SAVED, b64 len', len);
    const nd = await evalJS(`window.__ndlog.slice(0, 200).join('|')`);
    console.log('NDLOG:', nd);
    console.log('FINAL:', await evalJS(`JSON.stringify({loopOn:loopOn, loopBuf:loopBuf.length, held:Object.values(keysDown).filter(v=>v).length, wave:curWave})`));
  } else {
    const nd = await evalJS(`window.__ndlog.slice(0, 200).join('|')`);
    console.log('NDLOG:', nd);
    console.log('VIDEO PASS COMPLETE');
  }
  process.exit(0);
}

main().catch(e => { console.error('DRIVER FAIL:', e.message); process.exit(1); });
