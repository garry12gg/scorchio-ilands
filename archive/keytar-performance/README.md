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
