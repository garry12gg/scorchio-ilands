# Phase 05b: Keyframes (lipsync + keyframe-path non-lipsync)

## When to Run

Run after Phase 05a when the `video_prep` draft has lipsync segments (`model=dlai2v_pro`) **OR when the project is on the keyframe path** (`creative_proposal.model_primary` is not a Seedance 2.0 variant — then non-lipsync segments also need keyframes; see `docs/non_seedance_path.md`). Skip this phase only when there are no lipsync segments **AND** the path is asset_reference (Seedance 2.0).

Phase 05a drafts `video_prep`; Phase 05b completes and promotes it.

## What This Phase Does

- Builds 1-N keyframes for each lipsync segment **and each keyframe-path non-lipsync segment** (per `docs/non_seedance_path.md`). The framing rule differs by `segment_kind` (lipsync = face/mouth visible; non-lipsync = shot composition); all other machinery (grid → split → upload → write back) is identical.
- Uses one segment-scoped sub-agent to prepare each generation request.
- Parent agent submits image jobs, tracks async results, splits grids, uploads keyframes, validates, writes back, and finalizes `video_prep`.
- Existing `{ "role": "audio_slice", "url": ... }` references are preserved.

## Required Inputs

- `video_prep` draft from Phase 05a
- promoted `creative_proposal`
- promoted `reference_list`
- promoted `visual_config`
- `ARTIFACT_CONTRACT_PATH`

## Preflight

1. Read `schemas/video_prep.schema.json`.
2. Read `video_prep`, `creative_proposal`, `reference_list`, and `visual_config`.
3. Read `phases/05b-lipsync-keyframes/scripts/split_keyframe_grid.py`.
4. Inspect current CLI help before image generation:

```bash
dl generate-image -h
dl generate-image model -h
dl generate-image model gpt-image-2
```

CLI help is the source of truth for flags, result shape, and fallback service behavior.

## Count and Grid Plan

`target_keyframe_count` = `video_prep.segments[i].shot_count` (read it directly — do **not** re-judge from the prompt). Phase 05a already decided it as the number of distinct keyframes this lipsync segment needs (`1` for a continuous single-framing performance; `2-4` only when framing / composition / camera angle / visual state changes — body motion, gesture, hair, and emotion alone do not add a keyframe).

Allowed counts are `1`, `2`, `3`, and `4`. If `shot_count` is missing or outside `[1,4]` for a lipsync segment, treat it as a Phase 05a defect: fix it upstream (re-run 05a for that segment), do not guess.

Layout rules:

- `1`: single image.
- `2`: landscape or square target -> top/bottom; portrait target -> left/right.
- `3`: use the helper plan. For common 16:9 targets this is a 1x3 vertical stack with `generation_aspect_ratio=9:16`; portrait targets may use 3x1. The helper falls back to 2x2 only when a three-panel line would distort panels too much.
- `4`: 2x2 grid.

Panel order is left to right, then top to bottom. Use the helper output as source of truth:

```text
grid_ratio = (panel_width_ratio * cols) : (panel_height_ratio * rows)
```

Use the helper to compute the layout, ideal grid ratio, closest standard generation ratio, and prompt-ready `panel_layout_description`:

```bash
python3 phases/05b-lipsync-keyframes/scripts/split_keyframe_grid.py \
  --plan-only \
  --target-keyframe-count=<1|2|3|4> \
  --aspect-ratio="<visual_config.aspect_ratio>" \
  --resolution="2K"
```

For `gpt-image-2`, use the returned `generation_aspect_ratio` with `--image-size=2K`. Do not use `--size` by default: pixel `size` is a separate exact-size route and is not reliable for 05b grid planning.

## Image Generation

Default service:

```bash
dl generate-image --service=gpt-image-2 \
  --aspect-ratio="<generation_aspect_ratio from helper>" \
  --image-size=2K
```

Do not pass a vendor for Phase 05b.

Fallback is allowed, but only after checking that service's help and adapting the reference-image and size/aspect flags to that service. Do not reuse `gpt-image-2` flags for another service without checking `-h`.

For every submitted job, parent agent records a structured state file such as `phase05b_job_map.json`:

```json
{
  "job_ref": {
    "segment_id": "seg_04",
    "target_keyframe_count": 2,
    "service": "gpt-image-2",
    "ideal_grid_aspect_ratio": "8:9",
    "generation_aspect_ratio": "1:1",
    "generation_image_size": "2K",
    "panel_layout_description": "...",
    "reference_urls": ["..."],
    "attempt": 1
  }
}
```

If a sub-agent submits the job directly, it must write a structured manifest with `segment_id`, actual service/flags, reference arguments, generation aspect fields, and `job_ref` before exiting. Natural-language status text is not an acceptable manifest.

## Sub-agent Request

Pass each segment-scoped sub-agent only the data needed to prepare the request:

- `segment_id`
- `segment_kind`: `lipsync` or `non_lipsync_keyframe` (selects the framing rule in Prompt Requirements below — see `docs/non_seedance_path.md` for the non-lipsync rule)
- `segment_narrative`: `creative_proposal.segments[i].description`
- `video_prompt_05a`: `video_prep.segments[i].prompt`
- `visual_style`: `visual_config.visual_style.prompt_modifier`
- `aspect_ratio`
- helper grid plan, especially `panel_layout_description`
- character reference URL from the segment's Phase 05a source refs (`video_prep.segments[i].references` with `role=character_asset`): **the 2-panel character reference sheet (left = upper-body with clear face, right = full-body) — one image that carries both the identity face and the full outfit/body** — declare it at the prompt start (`image 1` is the character reference) and lock that face and outfit
- location/prop reference URLs from the segment's Phase 05a source refs (`role=location_asset` / `role=prop_asset`) when present

The sub-agent returns structured request JSON. Parent validates it before submission: the request must include the character 2-panel character reference sheet and every segment-scoped location/prop source ref when present. If any required source ref is missing, fix the request before submitting the image job.

## Prompt Requirements

The image prompt must:

- Inject `visual_config.visual_style.prompt_modifier`, adapted so the face, eyes, and mouth stay clean, sharp, and well-lit.
- Include the helper's `panel_layout_description` verbatim so the image model knows the exact panel count, arrangement, internal panel ratio, borders, and no-extra-panel rule.
- Refer to each reference image by position (`image 1`, `image 2`, etc.) when the selected service supports positional image references.
- Preserve reference identity, outfit, lighting quality, and material quality; include a few concise identity anchors when useful.
- **Framing depends on `segment_kind`**: for `lipsync`, require lipsync-safe framing — face clearly visible and recognizable, mouth visible. For `non_lipsync_keyframe`, compose each keyframe as the shot's opening composition per the Phase 05a shot design + segment narrative (correct framing / angle / subject / action-state); the character need not face camera and the mouth need not be visible (it is an image-to-video seed frame), and **do not inject any lip-sync language** — see `docs/non_seedance_path.md`.
- Ask the image model to design meaningful panel variation from the segment narrative and Phase 05a shot design: each panel should be a distinct key moment with visible framing, angle, expression, pose, or action-state change while remaining one coherent lipsync segment.
- Keep the face and mouth centered with safe margins inside each panel, because the split helper may trim edges and cover-crop each panel to the final video aspect ratio.
- Use black outer borders and black divider lines for grids.
- Forbid white borders, titles, panel numbers, explanatory text, watermarks, logos, and subtitles.

## Split, Upload, Validate

Split the returned grid or single image:

```bash
python3 phases/05b-lipsync-keyframes/scripts/split_keyframe_grid.py \
  --grid-image-url="<result image URL>" \
  --target-keyframe-count=<1|2|3|4> \
  --aspect-ratio="<visual_config.aspect_ratio>" \
  --resolution="2K" \
  --segment-id="<seg_NN>" \
  --output-dir="<local output dir>"
```

The helper checks the returned image against the planned generation aspect ratio, detects real black divider lines near expected grid boundaries, crops inside detected dividers with a small guard margin, trims near-black outer edges, then cover-crops each panel to the target video aspect ratio. This may sacrifice a little edge content to avoid black borders. If dividers cannot be detected, it falls back to equal-grid splitting and records `split_mode` / `detected_dividers` diagnostics in the manifest. It blocks obvious mismatches instead of silently stretching distorted panels.

Upload every manifest image with `upload_file`. If upload is unavailable, block the segment; never fabricate URLs.

Run `dl understand_media` on uploaded split keyframes, not on the raw grid. Keep validation concise:

- character identity matches the references
- **(`lipsync` only)** face clearly visible and recognizable; mouth visible
- **(`non_lipsync_keyframe`)** the scene / subject / composition match the Phase 05a shot design (no mouth-visible requirement)
- no residual large black border, split-screen remnant, collage text, watermark, severe blur, blank output, or obvious distortion

If a keyframe fails, regenerate that segment once. If it still fails, mark a blocker in the self-check and resolve it (re-generate again, or fall back per `cli_translation.md`) before finalizing.

## Write Back

Preserve the segment's existing references — the `audio_slice` **and** the Phase 05a source refs (`character_asset` 2-panel character reference sheet, `location_asset`, `prop_asset`). They stay as the record of what generated the keyframes; Phase 06 ignores them for lipsync (passes only prompt + keyframes + audio — see `cli_translation.md`).

Append the accepted keyframes in shot order, each with a **sequential `ref_id` (`keyframe1`, `keyframe2`, … `keyframeN`)** + `frame_position`:

| Count | Appended keyframe references (in order) |
| --- | --- |
| `1` | `{ "role": "keyframe", "ref_id": "keyframe1", "url": "<u1>" }` |
| `2` | `keyframe1`(first), `keyframe2`(last) |
| `3` | `keyframe1`(first), `keyframe2`(middle), `keyframe3`(last) |
| `4` | `keyframe1`(first), `keyframe2`(middle), `keyframe3`(middle), `keyframe4`(last) |

`ref_id` must follow shot chronological order `keyframe1 → keyframeN` (corresponding to Shot 1→N in the 05a prompt); Phase 06 feeds keyframes to dlai2v_pro in this order.

## Self-Check and Finalize

Write the updated `video_prep` draft, read back the actual draft content, and self-check it. Resolve each case yourself:

- **A specific `seg_NN` keyframe is off** -> regenerate that segment.
- **A segment prompt is off** -> return to Phase 05a to change it.
- **Pass** -> all keyframes serve their segments and passed validation -> finalize and start Phase 06.

On pass:

```bash
dl artifact finalize --slot=video_prep --mode=verify_and_promote \
  --contract='<ARTIFACT_CONTRACT_PATH>'
```

## Do Not Proceed Unless

- Every lipsync segment **and every keyframe-path non-lipsync segment** has uploaded split keyframes.
- Every keyframe passed validation.
- `audio_slice` references are preserved.
- Async job mapping is recorded for every image job.
- The agent's self-check on the draft passed.
- `video_prep` was finalized successfully.

## Output Slot

- `video_prep` promoted

## Next Phase Entry

Read `phases/06-video-production/PHASE.md` from the same skill root.
