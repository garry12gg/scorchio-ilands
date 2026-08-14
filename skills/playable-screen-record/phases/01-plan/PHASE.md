# Phase 01: Plan

## Goal

Decide the capture parameters and write the internal `record_plan` slot.

## Required Inputs

- the playable to record: local HTML file, zip, or http(s) URL
- orientation preference (default **9:16** for feed showcases; 16:9 for wider
  game boards)
- target duration (seconds of gameplay after play starts; 15–30s is typical)
- whether the page creates its `AudioContext` lazily on first play (true for
  most games; affects trim — lazy audio needs no extra audio trim)

## Required Slot / Schema Loads

Read `schemas/record_plan.schema.json` and `schemas/artifact_contract.json`
from this skill root with the built-in `read` tool. Set
`ARTIFACT_CONTRACT_PATH` to the absolute contract path.

## Decision Rules

1. **Orientation presets** (everything else derives from this):

   | param | 9:16 portrait | 16:9 landscape |
   |---|---|---|
   | `x11_size` (Xvfb) | `1080x1920` | `1920x1080` |
   | `window_size` (chromium, dpr 2) | `540,960` | `960,540` |
   | `crop_geometry` (recenter) | `1040:1920:20:0` | `1900:1060:20:20` |
   | `pad_geometry` (recenter, decoded bg) | `1080:1920:20:0:color=0x1a0f0a` | `1920:1080:10:10:color=0x180d08` |

   Kiosk windows land a few px off-center; crop+pad with the *decoded*
   background color (not `0x1a0f0a` on landscape — a 2-unit seam showed as a
   faint line; landscape bg decodes to `24,13,8`).

2. **Audio mode**: `tap` whenever the playable has sound; `none` only if the
   page is silent by design.

3. **Trim strategy**: `play_ts` (recorded wall-clock of the play action —
   preferred, always available via CDP) or `pixel_detect` (fallback: find the
   first frame where the play button fills orange; needs
   `play_button_selector`).

## Output Slot

- `record_plan` — write then finalize (`--mode=verify`), both with
  `--contract='<ARTIFACT_CONTRACT_PATH>'`, run from this skill root:

```bash
cd <this skill root>
cat <<'EOF' | dl artifact write --slot=record_plan --content-type=application/json --content-file=- --contract='<ARTIFACT_CONTRACT_PATH>'
{"playable_source":"...","orientation":"9:16","target_duration":20,"audio_mode":"tap","fps":30,"display":":99","x11_size":"1080x1920","window_size":"540,960","trim_strategy":"play_ts","crop_geometry":"1040:1920:20:0","pad_geometry":"1080:1920:20:0:color=0x1a0f0a","upload_port":8787,"output_dir":"/workspace/recordings/<slug>"}
EOF
dl artifact finalize --slot=record_plan --mode=verify --contract='<ARTIFACT_CONTRACT_PATH>'
```

`grab_start_ts` and `play_ts` are filled in during Phase 02 (patch-json with
supported ops, then a contract-backed finalize).

## Self-Check

- [ ] orientation preset values match the orientation
- [ ] `output_dir` exists (mkdir) and is empty
- [ ] `record_plan` verified
