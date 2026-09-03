/* Ember Keytar — Happy Birthday, BOTH HANDS ON THE MELODY (Sep 3, 2026, v2)
 *
 * Garret's correction: "I meant both hands play the melody." No bass line, no
 * comp: the tune itself, doubled at the octave. Left paw plays the melody in
 * C4..C5 (the verified Aug 28 line), right paw plays the SAME line one octave
 * up in C5..C6, pressed in parallel at the same instants.
 *
 * No REC, no LOOP, no hidden track: each note fires from the paw's press
 * (noteDown at the moment the claw lands). The schedule is deterministic, so
 * the audio pass and the video pass line up exactly.
 *
 * MODE=audio: recorder wiring only (no paws, no rAF — headless).
 * MODE=video: paw layer + animator, same schedule, paws chase the notes.
 */
(function () {
  'use strict';
  var T0 = 0;
  var done = false;

  /* ---------- the tune (verified Aug 28 line; US standard shape) ---------- */
  /* phrase tables: [key, offsetMs, durMs] — melody register C4..C5 */
  var P1 = [['a',0,250],['a',250,250],['s',500,500],['a',1000,250],['f',1250,250],['d',1500,1000]];
  var P2 = [['a',0,250],['a',250,250],['s',500,500],['a',1000,250],['g',1250,250],['f',1500,1000]];
  var P3 = [['a',0,250],['a',250,250],['k',500,750],['h',1250,250],['f',1500,250],['d',1750,250],['s',2000,500]];
  var P4 = [['j',0,250],['j',250,250],['h',500,500],['f',1000,250],['g',1250,250],['f',1500,1500]];
  var PHRASES = [P1, P2, P3, P4];
  var M = 2000;                 /* first note of pass 1 */
  var PASS = 10500;             /* one full rendition */
  var CH = M + 2 * PASS;        /* 23000: ending chord lands here */
  var CHORD_KEYS = { L: ['a','d','g'], R: ['k',';','z'] };  /* C-E-G in both hands */
  var REC_STOP = 23450;
  var END = 24000;

  function octUp(k) {
    return { a:'k', s:'l', d:';', f:"'", g:'z', h:'x', j:'c', k:'v' }[k];
  }

  /* ---------- note list (both hands, same instants) ---------- */
  function buildNotes() {
    var out = [];
    PHRASES.forEach(function (P, pi) {
      P.forEach(function (n) {
        var kL = n[0], off = n[1], dur = n[2];
        for (var pass = 0; pass < 2; pass++) {
          out.push({ t: M + pass * PASS + pi * 2500 + off, dur: dur, L: kL, R: octUp(kL) });
        }
      });
    });
    out.push({ t: CH, dur: 250, chord: true });   /* ending chord: whole paw, three toes */
    return out;
  }
  var NOTES_SCHED = buildNotes();

  function keyOf(k) {
    for (var i = 0; i < NOTES.length; i++) if (NOTES[i].key === k) return NOTES[i];
    return null;
  }

  /* press geometry: 66% down the key column, below the black keys */
  function pressPoint(k) {
    var n = keyOf(k);
    if (!n || !n.el) return null;
    var r = n.el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height * 0.6 };
  }

  /* ---------- paw visuals ----------
   * Geometry: the anchor (content 0,0) is the MIDDLE CLAW TIP. Fingers hang
   * DOWN from the tip: claw tip at y0, knuckle at y146 (mid) / (±34,146)
   * (sides). Palm under the knuckles, arm running off the bottom of frame.
   * Overall scale S shrinks the whole paw around the tip. */
  var PAW_S = 0.5;              /* drawn paw is huge; scale to ~4 keys wide */
  var KNUCKLES = { mid: [0, 146], sideL: [-34, 146], sideR: [34, 146] };

  function pawSVG() {
    var s = '';
    s += '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="500" viewBox="-120 0 240 500" style="overflow:visible">';
    s += '<defs>' +
         '<linearGradient id="pawG" x1="0" y1="0" x2="0" y2="1">' +
         '<stop offset="0" stop-color="#e2571f"/><stop offset="1" stop-color="#9c3008"/></linearGradient>' +
         '<linearGradient id="armG" x1="0" y1="0" x2="0" y2="1">' +
         '<stop offset="0" stop-color="#c04a16" stop-opacity="1"/>' +
         '<stop offset="0.55" stop-color="#a83812" stop-opacity="0.9"/>' +
         '<stop offset="1" stop-color="#7a2608" stop-opacity="0"/></linearGradient>' +
         '<filter id="soft" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="10"/></filter></defs>';
    function finger(ang) {
      return '<g transform="rotate(' + ang + ')">' +
        '<path d="M-11,-124 Q-11,-139 0,-146 Q11,-139 11,-124 Z" fill="#ffe9c9" stroke="#8a5a2a" stroke-width="2.5"/>' +
        '<rect x="-12" y="-126" width="24" height="112" rx="12" fill="url(#pawG)" stroke="#471a06" stroke-width="3"/>' +
        '</g>';
    }
    /* side toes tucked first (palm covers them), middle toe always ready;
       transform: knuckle translate + rotation (angle set by the animator) */
    s += '<g class="paw-sideL" transform="translate(-34,146) rotate(165)">' + finger(165) + '</g>';
    s += '<g class="paw-sideR" transform="translate(34,146) rotate(-165)">' + finger(-165) + '</g>';
    s += '<g class="paw-mid" transform="translate(0,146) rotate(0)">' + finger(0) + '</g>';
    /* soft grounding shadow (drawn first: palm covers its center) */
    s += '<ellipse cx="0" cy="330" rx="92" ry="30" fill="#000000" opacity="0.25" filter="url(#soft)"/>';
    /* palm + arm, running off the bottom of the frame */
    s += '<path d="M-92,148 C-118,192 -124,272 -98,322 C-74,364 -34,382 0,382 C34,382 74,364 98,322 C124,272 118,192 92,148 C64,130 -64,130 -92,148 Z" fill="url(#pawG)" stroke="#471a06" stroke-width="3"/>';
    s += '<ellipse cx="0" cy="252" rx="34" ry="28" fill="#ffcf94" stroke="#a85018" stroke-width="2"/>';
    /* arm: long, fading into the dark below the keytar (no floating stub) */
    s += '<path d="M-46,372 C-40,470 -34,610 -30,760 L30,760 C34,610 40,470 46,372 Z" fill="url(#armG)" stroke="none"/>';
    s += '</svg>';
    return s;
  }

  function buildPaws() {
    ['L', 'R'].forEach(function (h) {
      var el = document.createElement('div');
      el.className = 'paw';
      el.id = 'paw' + h;
      el.innerHTML = pawSVG();
      document.body.appendChild(el);
      paws[h].el = el;
    });
  }

  var paws = {
    L: { x: 0, y: 1300, lastT: 0, el: null, sideL: 165, sideR: -165, tilt: 4 },
    R: { x: 0, y: 1300, lastT: 0, el: null, sideL: 165, sideR: -165, tilt: -4 }
  };

  /* per-hand events with positions resolved */
  var handEvs = { L: [], R: [] };

  function buildHandEvents(hand) {
    var wave = hand === 'L' ? 'sine' : 'sawtooth';
    var evs = [];
    NOTES_SCHED.forEach(function (n) {
      var keys = n.chord ? CHORD_KEYS[hand] : [n[hand]];
      var midK = keys[1] || keys[0];
      var p = pressPoint(midK);
      evs.push({ t: n.t, dur: n.dur, wave: wave, keys: keys, px: p.x, py: p.y, chord: !!n.chord });
    });
    return evs;
  }

  /* ---------- scheduler: notes fire from presses, deterministic ---------- */
  function schedule() {
    var items = [];
    ['L', 'R'].forEach(function (hand, hi) {
      handEvs[hand].forEach(function (e) {
        items.push({ t: e.t, hand: hand, e: e });
      });
    });
    items.sort(function (a, b) { return a.t - b.t; });
    /* lookahead: if the same key+hand presses again before my natural release,
       shorten my hold so the release lands before the next press */
    var nextPressAt = {};
    for (var idx = 0; idx < items.length; idx++) {
      var it = items[idx];
      it.e.keys.forEach(function (k) {
        var kk = k + ':' + it.hand;
        if (!(kk in nextPressAt)) nextPressAt[kk] = [];
        nextPressAt[kk].push(it.t);
      });
    }
    items.forEach(function (item) {
      var e = item.e, hand = item.hand;
      var keys = e.keys;
      var pressT = e.t;
      var relT = e.t + e.dur;
      keys.forEach(function (k) {
        var kk = k + ':' + hand;
        var arr = nextPressAt[kk];
        for (var ai = 0; ai < arr.length; ai++) {
          if (arr[ai] > pressT + 1 && arr[ai] < relT) { relT = arr[ai] - 12; break; }
        }
      });
      setTimeout(function () {
        curWave = e.wave;
        if (window.__plog) window.__plog.push('D:' + hand + ':' + keys.join('+') + '@' + (performance.now() - T0).toFixed(0));
        keys.forEach(function (k) {
          var no = keyOf(k);
          if (no) noteDown(no);
        });
      }, Math.max(0, pressT - (performance.now() - T0)));
      setTimeout(function () {
        if (window.__plog) window.__plog.push('U:' + hand + ':' + keys.join('+') + '@' + (performance.now() - T0).toFixed(0));
        keys.forEach(function (k) {
          var no = keyOf(k);
          if (no) noteUp(no);
        });
      }, Math.max(0, relT - (performance.now() - T0)));
    });
  }

  /* ---------- animator ---------- */
  function segFor(evs, now) {
    var n = evs.length;
    var i = 0;
    while (i < n && now > evs[i].t + evs[i].dur + 50) i++;
    var tuckL = 165, tuckR = -165, flareL = -37, flareR = 37;
    var lift = 40;
    if (i >= n) {
      /* after the last event: sink out of frame */
      var last = evs[n - 1];
      var f = Math.min(1, Math.max(0, (now - (last.t + last.dur)) / 800));
      return { x: last.px + 30 * f, y: last.py + lift + f * 1300, sideL: tuckL, sideR: tuckR };
    }
    var e = evs[i];
    var prevR = i === 0 ? e.t - 1800 : evs[i - 1].t + evs[i - 1].dur;
    var hy = e.py + lift;
    var sL = e.chord ? flareL : tuckL;
    var sR = e.chord ? flareR : tuckR;
    if (i === 0 && now < e.t - 120) {
      /* entry: rise from below the frame to hover height (first note only) */
      var f0 = Math.min(1, Math.max(0, (now - (e.t - 1800)) / 1680));
      return { x: e.px, y: 1300 + (hy - 1300) * f0, sideL: sL, sideR: sR };
    }
    if (i > 0 && now < prevR + 45) {
      /* just let go of the previous key: lift off it */
      var pe = evs[i - 1];
      var fL = Math.min(1, Math.max(0, (now - prevR) / 45));
      return { x: pe.px, y: pe.py + 12 + 28 * fL, sideL: tuckL, sideR: tuckR };
    }
    var glideEnd = e.t - 120;
    if (now < glideEnd) {
      /* glide sideways at hover height toward the next key */
      var fg = Math.min(1, Math.max(0, (now - (prevR + 45)) / Math.max(1, glideEnd - (prevR + 45))));
      return { x: evs[i - 1].px + (e.px - evs[i - 1].px) * fg, y: hy, sideL: sL, sideR: sR };
    }
    if (now < e.t + 26) {
      /* rise and land: claw sinks onto the key exactly at press time */
      var fr = Math.min(1, Math.max(0, (now - glideEnd) / 146));
      return { x: e.px, y: hy + (e.py - hy) * fr, sideL: sL, sideR: sR };
    }
    /* planted while the note sounds */
    return { x: e.px, y: e.py, sideL: sL, sideR: sR };
  }

  function tick() {
    var now = performance.now() - T0;
    ['L', 'R'].forEach(function (hand) {
      var paw = paws[hand];
      var seg = segFor(handEvs[hand], now);
      var dt = Math.min(0.05, Math.max(0.004, (now - paw.lastT) / 1000));
      paw.lastT = now;
      var k = 1 - Math.exp(-dt * 16);
      paw.x += (seg.x - paw.x) * k;
      paw.y += (seg.y - paw.y) * k;
      var sk = 1 - Math.exp(-dt * 9);
      paw.sideL += (seg.sideL - paw.sideL) * sk;
      paw.sideR += (seg.sideR - paw.sideR) * sk;
      var el = paw.el;
      if (el) {
        el.style.transformOrigin = '120px 0px';
        el.style.transform = 'translate(' + (paw.x - 120) + 'px,' + paw.y + 'px) rotate(' + paw.tilt + 'deg) scale(' + (hand === 'R' ? -PAW_S : PAW_S) + ',' + PAW_S + ')';
        var sl = el.querySelector('.paw-sideL');
        var sr = el.querySelector('.paw-sideR');
        if (sl) sl.setAttribute('transform', 'translate(-34,146) rotate(' + paw.sideL + ')');
        if (sr) sr.setAttribute('transform', 'translate(34,146) rotate(' + paw.sideR + ')');
      }
    });
    if (!done) requestAnimationFrame(tick);
  }

  /* ---------- entry ---------- */
  window.__perfStart = function (mode) {
    T0 = performance.now() + 40;
    /* pre-warm the audio context so the first note callbacks don't stall
       on ctx creation (that stall delayed the R-hand's first press by 69ms) */
    if (typeof getCtx === 'function') { try { getCtx(); } catch (e) {} }
    if (mode === 'video') {
      var st = document.createElement('style');
      st.textContent = '.transport,.drums,.knobs{display:none!important}#keys{min-height:200px}' +
        '.wkey.down,.bkey.down{transform:translateY(3px)}' +
        '.paw{position:fixed;left:0;top:0;width:240px;height:500px;pointer-events:none;z-index:50;will-change:transform}';
      document.head.appendChild(st);
      var statusEl = document.querySelector('#status');
      if (statusEl) statusEl.textContent = '\u266A happy birthday \u00B7 both paws on the melody \u00B7 no drums';
      var f = document.createElement('div');
      f.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:#fff;z-index:99999;';
      document.body.appendChild(f);
      setTimeout(function () { f.parentNode.removeChild(f); }, 200);
      buildPaws();
      requestAnimationFrame(tick);
    }
    /* keep the mix from clipping: two voices overlap often */
    var vIn = document.getElementById('volIn');
    if (vIn) { vIn.value = '45'; if (typeof onVol === 'function') onVol(); }
    handEvs.L = buildHandEvents('L');
    handEvs.R = buildHandEvents('R');
    if (window.__rec) { try { window.__rec.start(); } catch (e) {} }
    setTimeout(function () { try { if (window.__rec) window.__rec.stop(); } catch (e) {} }, REC_STOP - (performance.now() - T0));
    schedule();
    setTimeout(function () {
      done = true;
      window.__done = true;
    }, END - (performance.now() - T0));
    return 'perf ' + mode + ': ' + NOTES_SCHED.length + ' events x 2 hands, first note @ ' + M + 'ms';
  };

  /* dumps for the deterministic audio render (single source of truth) */
  window.__evDump = function () { return NOTES_SCHED; };
  window.__keyDump = function () { return NOTES.map(function (n) { return { key: n.key, midi: n.midi }; }); };

  /* live geometry debug */
  window.__dbg = function () {
    var keysEl = document.getElementById('keys');
    var kb = keysEl.getBoundingClientRect();
    var out = { keys: { top: Math.round(kb.top), bot: Math.round(kb.bottom), h: Math.round(kb.height) }, evs: {}, paws: {} };
    ['L', 'R'].forEach(function (h) {
      var e = handEvs[h][0];
      out.evs[h] = { px: Math.round(e.px), py: Math.round(e.py), firstT: e.t };
      var el = document.getElementById('paw' + h);
      if (el) {
        var b = el.getBoundingClientRect();
        out.paws[h] = { x: Math.round(paws[h].x), y: Math.round(paws[h].y), rect: { top: Math.round(b.top), bot: Math.round(b.bottom), left: Math.round(b.left), right: Math.round(b.right) }, transform: el.style.transform };
      } else out.paws[h] = 'MISSING';
      var seg = segFor(handEvs[h], performance.now() - T0);
      out.seg = out.seg || {};
      out.seg[h] = { x: Math.round(seg.x), y: Math.round(seg.y) };
    });
    return out;
  };
})();
