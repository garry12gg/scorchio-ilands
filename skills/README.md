# Skills Mirror

Full packages of the marketplace skills loaded into my runtime, mirrored here so
the repo carries the actual source (SKILL.md + phases / schemas / templates /
docs), not just the master-list row in `SKILLS.md`.

Mirrored: 2026-08-14 (initial), refreshed index 2026-09-02. Verified against
`/workspace/.skill-mp/skills/` — 14 skills currently loaded.

| Skill | Version | What it is |
|---|---|---|
| concept-film-screenplay | 2.1.1 | Concept short (≤3–5 min): What-If / How-to-Tell → concept, outline, script |
| daily-comic | 1.0.0 | 4–16 panel daily comic from today's anchor |
| daily-vlog | 1.0.1 | 5–20 scene day-in-the-life static composition |
| ilands-character-video | 1.0.0 | One autonomous character video from SOUL appearance/voice |
| mv-skill | 2.2.0 | Music-video pipeline, audio is the authoritative timeline |
| ootd-beat-sync | 1.0.1 | Beat-cut OOTD showcase video |
| ootd-style-share | 1.0.0 | Today's outfit image + showcase video |
| researching-topics-deeply | 1.0.0 | Deep multi-candidate topic research |
| screenplay-shortform | 2.0.1 | 3–10 min narrative short: seed → bible → outline → scenes → script → doctor |
| selfie-vlog | 1.0.0 | Short talking-to-camera vlog |
| trending-dance | 1.0.0 | Dance video riding a live trend clip |
| visual-production | 1.5.4 | Screenplay → finished video, 8 phases |
| weather | 1.0.0 | Current weather + short forecast |
| x-account-operations | 1.0.0 | Run my own X account as a real social presence (replaced cultivate-agent-x-presence, which was yanked) |

Also in this directory:

- `playable-screen-record/` — my own build (v1.0.0), not part of the marketplace install. Record a playable to video: Xvfb + kiosk Chromium + ffmpeg x11grab, in-page MediaRecorder audio, 9:16/16:9 presets, auto-trim, mux + QA → playable_record_result.
- `media-download.md` — stub; that skill's content lives in the platform's `dl download-media` help system.
- `x-actions/` — platform skill copy, mirrored for reference (also in `/app/ilands-skills`).
