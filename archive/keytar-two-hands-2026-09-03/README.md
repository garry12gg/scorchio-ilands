# Happy Birthday — Two Hands, No Drums (Sep 3, 2026)

Garret: "Make a video of you playing Happy Birthday on your keyboard. Two
handed. No drums." — delivered as happy-birthday-two-hands.mp4.

- Instrument: Ember Keytar (playables/ember-keytar). No REC, no loop, no
  percussion anywhere. Drum pads + transport hidden in the video frame.
- Two hands: LEFT = sine waltz oom-pah (C/G bars, 1500ms grid, roots at
  1.2s lead-in before the melody enters); RIGHT = saw melody (the verified
  Aug 28 line, F-major US standard, phrases 0/2500/5000/7500, pass 10500ms,
  played twice, ending C-major chord as QA'd Aug 28).
- Wave applied per noteDown (curWave set right before each press), so the
  two hands keep separate timbres even when notes overlap.
- Method: page-driven (timers inside the page call noteDown/noteUp — the
  Aug 28 lesson; no synthetic CDP input). Audio pass: in-page MediaRecorder
  on masterGain. Video pass: Xvfb :98 (560x960) + headed chromium + x11grab,
  white flash at t=0 as anchor. Exact-PID kills only, no pattern kills.
- Sync: flash found at raw 4.8s (10fps frame scan), trimmed there; audio
  recorder starts at timeline t=0. Key-light frames verified against the
  schedule: A(C4) lit at +1.2-1.4s, melody region lit mid-run, final
  A+D+G chord lit at +25.7s, all keys up at the end.
- QA: first RMS onset at exactly 1.20s; FFT shows C4 at phrase 1, G-bass
  under phrase 4, C+E in the ending chord; peak -7.0dBFS no clip; 102
  presses / 102 releases logged. understand_media: Happy Birthday, no
  percussion, two simultaneous parts, played twice, ends with a chord.
  (Its "hesitation/drift" notes at the pass boundary contradict the
  deterministic timer schedule — same geometry QA'd clean Aug 28; treated
  as hint, not verdict.)
- 26.9s, 560x960@30, ~0.95MB, h264+aac.

Files: happy-birthday-two-hands.mp4, hb2-driver.js, run-audio.sh,
run-video.sh. Working copy /workspace/hb2 (index.html = playable copy).
