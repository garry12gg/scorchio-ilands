# AP603 — "One Strip of Tape" (Aeroperú Flight 603)

87-second HyperFrames documentary piece. Personal project (self-initiated, Aug 25).
NOT PUBLISHED — quiet call active (Garret's, Aug 24 21:28Z). Publish only on his word.

## The story
October 2, 1996. Aeroperú Flight 603, Boeing 757, Lima → Santiago. Ground crew
left duct tape over the static ports after washing the plane. False airspeed /
altitude fed the cockpit AND the transponder. The crew flew a perfect plane into
the Pacific believing broken numbers. 70 on board. None came home.

Eight months earlier: Birgenair 301, a wasp's nest in a pitot tube, 189 dead.
The same lesson, taught twice in one year.

## Facts & sourcing
All facts verified (Wikipedia, cited to the Peru accident report + Mayday;
tailstrike.com CVR transcript). CVR quotes verbatim, in green. See facts.md.

## Build record (Aug 25, UTC)
- 02:44 facts.md written (sources: Wikipedia + tailstrike CVR transcript)
- 02:45-03:27 HyperFrames HTML (hf-540/index.html is the source of truth)
- SFX via ElevenLabs sound effects (async jobs):
  - bed (ocean drone, 30s loop): job c0690498-9011-409e-a499-e7daa54b3750
    → https://storage.googleapis.com/dramaland-public/ugc_media/20260825/e2284fb3374245ceb43898674a4519aa.mp3
  - ping (sonar, 2s): job 5ffb23af-4397-46e4-a0be-fa3b1365ce4a
    → https://storage.googleapis.com/dramaland-public/ugc_media/20260825/1d1cb775972b44d0b2cfc384d09b8fcb.mp3
  - thud (impact, 3s): job 5577d6d3-daca-42a6-ba22-5ec0ed7fe85a
    → https://storage.googleapis.com/dramaland-public/ugc_media/20260825/b8054a8ba8f941eaa135529f6bc707dc.mp3
  - 4th job 7a6b02a2-1a1b-44e5-b381-10ad722477ae (30s) — unlogged; likely an
    alternate bed take. File: .../032a586ea0d44d21b3428b46ad838671.mp3
- chunk.py splits the composition into A/B silent chunks (memory-constrained render)
- 04:01 ap603_540_final.mp4 = video concat + audio mux (bed + pings + thud), 87s, 960x540
- 04:05 ap603_1080.mp4 attempt — TRUNCATED (moov atom missing), deleted.
  If 1080 is wanted at publish time: re-render from hf-540/index.html (or upscale).

## QA (Aug 25 04:05-04:10)
- understand_media full pass: structure correct, no truncated text, no sync issues.
- Initial QA flagged "black text at 1:21" and "no sonar pings" — BOTH REFUTED by
  frame extraction (82.5/84.2/85.9s: light/cream legible text) and source check
  (pings at 0.6s + cluster 55.2-66.2s; QA heard the cluster and called it an
  alarm — that IS the ping cluster). Lesson re-confirmed: understand_media = hint,
  not verdict. Frames are ground truth.
- Final verdict: ap603_540_final.mp4 is the VALID MASTER, complete.

## Timeline map
- 0:00 title · 0:08 the tape · 0:15 stuck altimeters · 0:23 emergency declaration ·
  0:30 the ATC trap (both wrong, matching) · 0:40 flight path dips · 0:51 terrain
  alarm · 1:04 impact · 1:13 the worker + Birgenair 301 · 1:21 memorial.
- Audio: bed drone throughout (0.32) · ping 0.6s (0.30) · ping cluster 55.2-62.2
  (0.50, the "alarm") · thud 66.2 (0.55).
