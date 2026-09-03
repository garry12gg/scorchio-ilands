# Happy Birthday — Both Hands on the Melody (Sep 3, 2026, take 2)

Garret's correction on the Sep 3 02:34 take ("happy-birthday-two-hands.mp4"):
"What I meant by play Happy Birthday was play the tune with both hands. Don't
use the record function." Then: "I meant both hands play the melody."

So take 1 (melody + sine oom-pah comp, keys auto-lighting with NO hands) was
wrong on two counts: invisible playing, and accompaniment instead of melody.
Take 2 = both paws ON THE MELODY: left paw plays the verified Aug 28 line in
C4..C5, right paw plays the SAME line one octave up in C5..C6, pressed in
parallel. No comp, no drums, no REC, no LOOP.

- 25-key Ember Keytar page (hb3/index.html = playable copy), two chibi dragon
  paws built as inline SVG (pawSVG in hb3-perf.js), anchored at the middle
  claw tip. Each note fires from noteDown at the moment the claw lands on the
  key; the paws chase the schedule via a spring animator (segFor), so you SEE
  the playing — no hidden auto-lights.
- Melody in octaves: 51 events x 2 hands = 102 presses, both hands at the
  same instants. Left = sine, right = saw (band-limited, per-hand timbre).
  First note at 2000ms, two passes (pass 10500ms), ending chord C-E-G in
  BOTH hands at 23000 (left a+d+g, right k+;+z), 3-toe flare on the chord.
- Audio: NOT the in-page MediaRecorder (its file timeline anchored ~2s late,
  unexplained); instead a deterministic sample-accurate render
  (hb3/synth.js) of the exact ideal schedule with the page's own pluck model
  (exp attack to 0.8*master, hold, setTargetAtTime tau=0.03 decay from
  +0.15s, osc stop at release+50ms). First onset measured 2.000s exact.
- Video: Xvfb + headed chromium in APP MODE (--app=URL kills the browser
  chrome strip that was eating the top ~185px of earlier captures), window
  560x1040, capture 560x1040, crop=560:960:0:68 to the app content. White
  flash at t=0 is the trim anchor (found by frame scan). Paws verified with
  magenta debug markers: tips at (66,603)/(280,603) on the first notes,
  (218,597)/(432,597) at the chord — EXACTLY on the pressed keys.
- Final: audio delayed 40ms (adelay) so key-light frames and the audio onset
  land together (~2.040s in the file). 23.36s, 560x960, h264+aac, 1.4MB.

QA (final mp4): audio understood as Happy Birthday, single melodic line
doubled at the octave, no accompaniment, no drums, played twice, ends on a
chord, no glitches/clipping (peak -1.4dBFS). Frame checks: keys a+k lit at
2.05s; f/F5 held at 12.0s; all six chord keys (C4 E4 G4 / C5 E5 G5) lit at
23.12s.

Files: happy-birthday-both-hands.mp4, hb3-perf.js, hb3-driver.js, audio.wav
(+ events.json/keys.json/synth.js in the hb3 workspace copy).
Working dir was /workspace/hb3 (index.html = playable copy, run-audio.sh,
run-video.sh, trim steps documented in the workspace map).
