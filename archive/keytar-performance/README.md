# Ember Keytar — Ode to Joy (Aug 28, 2026)

Garret asked: "Play a song on your keyboard playable." — delivered as a real
performance video, one take.

- Instrument: Ember Keytar (playables/ember-keytar), the Scorchio-edition
  tribute to Plex's Pocket Keytar, built Aug 22 from my playtest notes on
  Plex's original (no ghost notes, drums recorded into loop, QWERTY map).
- Performance (120 BPM): REC a 4s bass loop (C-A-F-G roots, sine wave) with
  kick/snare/hat, loop it, then play Ode to Joy melody live (saw wave) over it.
- Method: headless chromium + CDP input events (real keydowns/mouse), audio via
  in-page MediaRecorder tap on the AudioContext graph, video via Xvfb + x11grab.
- Sync: measured the video/audio offset by aligning the first key-light frame
  (5fps pixel scan) with the first RMS attack; adelay=4350. Verified: C4 sound
  and C4 key-light both at ~5.2s in the final file.
- QA: RMS envelope + note-frequency map (loopBuf ground truth: 14 hits),
  pixel-forensics key-light timeline, one understand_media listen pass
  (identified Ode to Joy, no clipping, keys lit in sync).

## Happy Birthday — practice for the 4th (Aug 28, 2026)

Garret: "Now that you know about the pkill situation, make another video of
you playing your ember Keytar." — delivered as happy-birthday-final.mp4.

- Song: Happy Birthday (US standard, F# version), transposed to C, played
  twice, ending on a C major chord. Melody in sawtooth, waltz bass in sine.
- Waltz: bpm 160 → loopLen 3.0s = exactly two bars of 3/4 at 120bpm; the
  melody enters on loop cycle 1, so melody grid and waltz grid are locked
  (verified: all 25 notes per pass at their scheduled FFT frequencies).
- Harmony fix: bar 1 C-G-G, bar 2 G-G-C — puts the C5 phrase-3 note on the
  octave and the B4 phrase-4 note on the major 3rd (the first waltz version
  had B over F = tritone; the 4/4 loop version had a drifting polyrhythm).
- Method (page-driven, no synthetic input): the timeline runs INSIDE the
  page via its own timers, calling noteDown/noteUp/hitDrum/startRec/stopRec/
  onWave directly. CDP input synthesis proved unreliable in this rig: zero-gap
  releases got dropped under load and setPointerCapture from key presses
  hijacked subsequent drum clicks. Two passes: audio (MediaRecorder, no
  capture) + video (x11grab + white flash at T0 as the sync anchor). Both
  trimmed to their script-T; first light (0.5s) == first attack (0.50s).
- pkill lesson applied: the 15:29 orphaned ffmpeg (296933, capturing to a
  deleted file) was killed by exact PID; no pattern kills anywhere in the run.
- QA: FFT attack check on all 25 notes ×2 passes + chord (C4/E4/G4 all
  present), peak 20353 (no clip), C5 key light frame-exact in the final,
  understand_media listen: "Happy Birthday played two times, in tune, on the
  beat, ending chord resolves" (its B-flat note is the international variant;
  kept the US standard for Texas).
