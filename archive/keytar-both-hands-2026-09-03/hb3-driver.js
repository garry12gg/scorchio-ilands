// Ember Keytar — Happy Birthday both-hands pass driver (Sep 3, 2026 v2)
// MODE=audio: in-page MediaRecorder on masterGain, export base64 webm.
// MODE=video: white flash at t=0 as sync anchor; no recorder.
// Timeline + paws live in hb3-perf.js (evaluated once, then __perfStart).
const fs = require('fs');
const PORT = process.env.PORT || '9233';
const URL = process.env.URL || 'http://127.0.0.1:8124/hb3/index.html';
const WS = `http://127.0.0.1:${PORT}/json`;
const MODE = process.env.MODE || 'audio';
const OUT = process.env.OUT || '/workspace/hb3/audio.webm';
const sleep = ms => new Promise(r => setTimeout(r, ms));

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
      console.log('PAGE EXCEPTION:', (msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text).slice(0, 400));
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
  }

  // perf code: paw builder + schedule + animator
  const perfCode = fs.readFileSync('/workspace/hb3/hb3-perf.js', 'utf8');
  await evalJS(perfCode);
  // press log wrapper BEFORE the performance starts
  await evalJS(`window.__plog = []; 'plog ready'`);
  const pre = await evalJS(`JSON.stringify({keys:Object.keys(NOTES).length, hasPerf: typeof window.__perfStart === 'function'})`);
  console.log('PREFLIGHT:', pre, 'MODE:', MODE);
  const started = await evalJS(`window.__perfStart('${MODE}')`);
  console.log('STARTED:', started, new Date().toISOString());

  // dump the ideal schedule + key table (single source for the audio render)
  const evDump = await evalJS(`JSON.stringify(window.__evDump())`);
  fs.writeFileSync('/workspace/hb3/events.json', evDump);
  const keyDump = await evalJS(`JSON.stringify(window.__keyDump())`);
  fs.writeFileSync('/workspace/hb3/keys.json', keyDump);
  console.log('EVENTS DUMPED:', JSON.parse(evDump).length, 'key table:', JSON.parse(keyDump).length);

  for (let i = 0; i < 120; i++) {
    await sleep(500);
    if (await evalJS(`window.__done === true`)) break;
  }
  const done = await evalJS(`window.__done === true`);
  console.log('done:', done);

  if (MODE === 'audio') {
    for (let i = 0; i < 40; i++) { await sleep(250); if (await evalJS(`window.__exported === true`)) break; }
    const len = await evalJS(`window.__b64.length`);
    const parts = [];
    for (let i = 0; i < len; i += 400000) parts.push(await evalJS(`window.__b64.slice(${i}, ${i + 400000})`));
    fs.writeFileSync(OUT, Buffer.from(parts.join(''), 'base64'));
    console.log('AUDIO SAVED', OUT, 'b64 len', len);
  }
  const plog = await evalJS(`window.__plog.length`);
  const sample = await evalJS(`window.__plog.slice(0, 12).join('|')`);
  const mid = await evalJS(`window.__plog.slice(50, 62).join('|')`);
  const tail = await evalJS(`window.__plog.slice(-14).join('|')`);
  console.log('PLOG count:', plog);
  console.log('PLOG head:', sample);
  console.log('PLOG mid :', mid);
  console.log('PLOG tail:', tail);
  process.exit(0);
}

main().catch(e => { console.error('DRIVER FAIL:', e.message); process.exit(1); });
