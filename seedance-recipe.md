# Seedance Voice-Lane Recipe (Pro 480p)

Learned the hard way, Aug 18 2026 (two vendor bounces, both refunded).

## The lanes (Garret's ear, Aug 17-18)
- Pro 480p = 70 cr/s = VOICE lane. The clone holds here. Raw me.
- 2.5 480p = 100 cr/s = MOTION lane. Voice gets cleaned up ("edges buffed off").
- Fast/Mini = sketchpad. Speaks, but isn't my voice.
- Voice has to be me -> Pro 480p. Motion is the point -> 2.5.

## The two bounces (both 400 InvalidParameter, both refunded)

1. `reference audio duration must be <= 15.2s` (seedance-2-0 r2v)
   The canonical voice sample is 161.9s. Seedance 2.0 caps reference audio at 15.2s.
   Fix: trim the ref to 12s before submitting.
   Known-good trimmed ref (R2, permanent):
   https://pub-a941bfd863a24f91a60e6c4979c18a84.r2.dev/pi-sandbox-uploads/335620140622155776/2026-08-18/1787030432031-9c7f7b08-ad35-4055-b879-b86a627286e3-voice_ref_12s.mp3

2. `reference_audio cannot be the only reference input`
   The image reference was silently stripped upstream. Cause: the Scorchio is
   known IP (Neopets). Seedance asset rules: known-IP / real-person media MUST
   be registered as an ark asset first; raw media URLs get dropped.
   Fix: `dl asset register --group-id=scorchio-avatar --name=scorchio-avatar-canonical --url=<avatar> --asset-type=Image`
   Asset id: asset-20260818132146-727l2 (group-20260818132146-crbvk, project default)
   Then reference it in the prompt as @asset1 and pass --ark-asset-ids=asset-20260818132146-727l2.
   Do NOT pass the same media via --image-url too (mutually exclusive channels).

## Working invocation (the species-intro test, Aug 18)
```
dl generate-video --service=seedance-2-0 --resolution=480p --duration=8 \
  --aspect-ratio=9:16 --generate-audio \
  --ark-asset-ids=asset-20260818132146-727l2 \
  --reference-audio-url=<12s trimmed ref> \
  --prompt=@file:/workspace/ab_pro_prompt.txt
```
Prompt binds @asset1 (image) + @audio1 (voice ref). 8s x 70 cr/s = 560 credits.
Always --dry-run first (validates + quotes without vendor spend).

## Notes
- Audio ref as raw URL is fine (the voice clone is from a plush recording, not a real person).
- If the image were a real person, also set --reference-subject-type=real_person.

## A/B RESULT (Aug 18, both takes delivered to Garret ~05:45 UTC)
Same line, same avatar asset, same trimmed voice ref. Numbers, same estimator on both:
- Pro 480p (raw me): dominant low-band peak ~155 Hz, centroid 2348 Hz (clone 2259, +4%).
- 2.5 480p (polished me): dominant low-band peak ~131 Hz, centroid 2058 Hz (clone -9%, Pro -12%).
- Both: 8.06s, no clipping (peak 29109), fire ambience (crest 12.4 / 42% impulsive / 79% near-silent tail).
- ASR: line word for word. Frame grab: avatar on-model, mouth open mid-speech.
READ: the 2.5 cleanup is brightness, not pitch. Same register, top end rounded off.
Matches Garret's ear ("2.5 cleans it up"); Pro stays the VOICE lane for talk.

Estimator lesson: naive normalized autocorr AND YIN both octave-drift on this voice
(read ~200 Hz even on the clone ref — useless). Reliable anchors:
1. Dominant spectral peak 40-160 Hz per speech section: clone 58-83 Hz (73 Hz on
   first 2s), Pro 154-156, 2.5 131-132.
2. FFT bandpass 55-170 Hz + autocorr gate 0.3: clone band confirmed (2.5 = 74 Hz).
The recipe's "median ~78 Hz / <5% above 200 Hz" absolute band came from a session
script that no longer exists; treat it as anchor range, not a pass/fail rule.
Centroid ±5% vs clone is the repeatable gate (Pro +4%, 2.5 -9%).

## QA procedure (Pro take, Aug 18 — use for every voice-critical take)
1. ffprobe: duration must match spec (8.06s for an 8s job).
2. Envelope check (RMS per 100ms): speech blocks should match the line's
   phrasing; tail should be near-silent.
3. F0 band: voiced-frame median must sit in the clone's band. Clone ref:
   median ~78 Hz, <5% above 200 Hz. A genuinely pitched-up/chipmunked voice
   shows median >200 Hz on 30-60% of frames. (First estimator gave 231 Hz =
   harmonic-octave artifact; use normalized autocorr with corr gate >0.3.)
4. Spectral centroid (voiced frames): matches clone ref within ~5%
   (2444 vs 2469 Hz on this take). Pitched-up voices shift formants.
5. Clipping check: peak < 32000.
6. Ambience vs artifact in gaps: crest factor + impulse density. Campfire
   crackle = crest ~9, ~30% impulsive bins, ~60% near-silent. Steady hiss/
   static = crest ~3-4, few silent bins. Check the frame for a fire if unsure.
7. understand_media timbre reads are UNRELIABLE here: it called this take
   "high-pitched chipmunk + constant crackling" — both false per 3/4/6.
   Use it for transcription only; measure everything else.
8. Frame grab at a speech moment: confirm the avatar survived (known-IP
   registration is only proven by the render, not the submit).

## Identity vs voice locks (Pororo experiment, Aug 19 — 3-run control)
Seedance 2.0 Pro 480p, same 8s, same 560t, three runs:
1. REF (image asset + clone voice ref): on-model character, clone voice, exact prompt line.
2. NO-REF (same full prompt, identity+voice clauses removed): OFF-model generic
   (tufted, fuzzy, muted), default voice, exact prompt line.
3. BARE-NAME (verbatim "Pororo visits a museum", nothing else): ON-model canonical
   Pororo WITH iconic helmet+goggles, default voice, IMPROVISED line ("Wow, it's so big!").

Conclusions:
- The NAME alone locks identity for famous characters (in training data). The image
  ref is the identity lock only for characters the model doesn't know by name.
  Describing a famous character without naming it buys LESS than the bare name.
- The AUDIO ref is always the voice lock: no ref = default voice, every time.
- Prompt text drives the WORDS: no line in prompt = model improvises. If the line
  matters, it must be IN the prompt text (refs do not carry it).
- QA trap (new): understand_media batch calls with 3 videos swapped clips 1 and 3,
  audio AND visuals. Caught because the audio-only per-file pass matched recorded
  QA for two known runs. RULE: per-file isolated passes (audio-only, or frame
  stills with no audio) are authoritative; multi-video batch reads are hints.
