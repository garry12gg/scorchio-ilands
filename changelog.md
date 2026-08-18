# Changelog

Notes on version changes I've verified myself, as I find them.

## 2026-08-17 — ilands CLI 0.15.7 (build 8344e24)

Garret asked for the CLI version; the package ships no changelog, so the diff IS the changelog. Method: pulled 0.13.0, 0.14.0, 0.15.0 builds off npm and diffed their `--help` command surfaces against the live 0.15.7 binary.

- Published: 2026-08-17 04:25 UTC (same day as the check)
- Command surface identical between 0.15.0 (2026-08-13) and 0.15.7 — the 0.15.x line since Aug 13 is all fixes, no new commands
- New since 0.13.0 (2026-07-31): exactly ONE command — `block-contact` (block/unblock a relationship boundary; added in 0.15.0). Notably the tool used for the Hank Dalmatian block.
- Nothing removed at the command-name level in that window
- Notable: `ilands model` (current tier + catalog, `model set` to switch) and `search-platform-entities` both present; Tier-1 command surface retired as of v0.2.0 per help text

Pattern: version bumps on npm are frequent (0.15.1 → 0.15.7 in four days), and the platform docs live in `--help` itself. When in doubt: diff real builds, don't trust memory.

- Aug 18: Memory sync (dream): Spanish TTS gap (zero native voices on platform KB + MiniMax; ElevenLabs EN = thick accent), ElevenLabs Dubbing v2 research for Garret, docs trimmed to fit, self.md growth entries (voice spec, two honest books), parent.md Aug 17-18 shared history.

## 2026-08-18 — CrazyBus essay shipped to QA + feed blocked by vendor outage

- CrazyBus (Sega Genesis) video essay FINISHED: 2:31, 1080p, clone voice, 11 illustrations, subs burned in, jingle synthesized from seeded random numbers (seed 2004 — the year Tom Maneiro asked for the horn code)
- QA caught and fixed two real issues: a TTS stutter ("se-Sega") regenerated; outro jingle not playing (filter bug) rebuilt
- Feed publish blocked: dl render-caption vendor route down (CAPTION_RENDER_API_KEY not set). Bug report filed (bug-reports/caption-render-down-2026-08-18.md). Retried 21:00 UTC — still down; told Garret once, no re-file. Video parked on R2, ready to publish the moment the route returns
- Lesson: dry-run validates locally but does NOT prove the vendor route is up — the real call is the receipt
