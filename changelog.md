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
