# Phase 06: Video Production (batch generation + trim)

> **Non-lipsync generation path**: this PHASE.md + `cli_translation.md` describe the **asset_reference** path (Seedance 2.0 — `ark_asset_ids`/`@assetN`). If `creative_proposal.model_primary` is **not** a Seedance 2.0 variant, non-lipsync segments are on the **keyframe** path — read `docs/non_seedance_path.md` (Phase 06): feed each segment's `role=keyframe` refs via the model's image-to-video contract (`dl generate-video model <model>`), no ARK / `@assetN`. A **path guard** (Step 1.B) stops any job whose model and mechanism disagree.

## Role Division

- **Main Agent**: spawn sub-agent -> QA Gate -> write draft -> FINALIZE SELF-CHECK (including failed segment decisions) -> finalize
- **Sub-agent**: in a clean context, read model documentation + `cli_translation.md`, then **batch** submit video generation for all segments; after receiving raw video, produce both raw + assembly URLs and assemble `video_segments`

## Goal

Batch-generate all segment videos according to `video_prep`, outputting `video_segments`. Each segment = one model call; each segment records `raw_video_url` (model's raw output, for preview / rollback) and `assembly_video_url` (precisely trimmed, no audio, uniform specs, for Phase 07 concatenation).

## When to Trim (the key step)

`video_prep.duration` is a rounded-up whole number of seconds (e.g., 7s); the model generates at that length -> **this step immediately produces the assembly clip**: precisely trimmed to the target duration using `creative_proposal.segments[i].duration`, `-an` to strip audio, and uniform resolution / fps / SAR / codec. ffprobe verifies that `assembly_video_url`'s video duration differs from the target by < 0.05s. Phase 07 no longer trims per-segment; it only verifies these assembly clips before concat.

## Required Inputs

- `video_prep` (promoted)
- `creative_proposal` (promoted) -- provides each segment's exact duration (trim target) / model
- `visual_config` (promoted) -- provides resolution / aspect_ratio
- `ARTIFACT_CONTRACT_PATH`

## Preflight Reads (Main Agent)

1. Read `schemas/video_segments.schema.json`
2. Read `phases/06-video-production/templates/video_segments.minimum.json`
3. Read promoted `video_prep` / `creative_proposal` / `visual_config`

> The main agent does not read `cli_translation.md` -- CLI translation + failure fallback is the sub-agent's job.

## Step 1 -- Sub-agent Batch Generate + Trim

Launch a clean-context sub-agent task:

```
Task: Batch-generate all segment videos according to video_prep, and produce raw_video_url + assembly_video_url for each segment.

Required reads:
1. video-generation/SKILL.md -- CLI parameters / fields / capabilities for each model
2. lipsync/SKILL.md + `dl lipsync -h` (and `dl generate-video -h` when needed) -- which command dlai2v_pro single / multi-frame uses, which fields it accepts (image_url / keyframes / frame protocol / dimensions / audio); consult these two sources directly
3. ffmpeg/SKILL.md -- trim
4. pricing-and-policies/SKILL.md
5. phases/06-video-production/references/cli_translation.md -- references[] -> CLI translation per model + ARK priority + failure fallback order
6. promoted video_prep / creative_proposal / visual_config
7. **If model_primary is not a Seedance 2.0 variant**: docs/non_seedance_path.md (Phase 06) -- keyframe-path request assembly + path guard + late model change

Execution:
A. Translate video_prep's prompt + references[] + duration + aspect_ratio into the CLI for each segment.model (see cli_translation.md + video-generation skill). Group by model and batch submit (dl lipsync / dl generate-video --jobs-file); submit all at once, do not loop segment by segment.
   - Seedance placeholders: `@imageN = image_urls[N-1]`, `@assetN = ark_asset_ids[N-1]`, `@audio1 = reference_audio_url`. Do not use global reference numbering / mixed visual numbering.
   - Seedance live-action character source refs must be asset-only: if there is an `ark_asset_id`, only attach it to `ark_asset_ids` + prompt `@assetN`; **do not also put the same image's URL into `image_urls`**; location / prop remain image-only.
   - Lipsync / dlai2v_pro: only pass prompt + keyframes + `audio_url`; **do not pass source character/location refs, do not pass `duration`**.
   - **Keyframe-path non-lipsync (model_primary not Seedance 2.0)**: feed the segment's `role=keyframe` refs via the model's image-to-video contract (`dl generate-video model <model>` — `image_url` / `keyframes` / `last_frame_url`), mapping the keyframe count onto the model's frame protocol; **do not pass `ark_asset_ids` / `@assetN` or the character/location/prop source refs** (baked into keyframes). See `docs/non_seedance_path.md` (Phase 06).
B. Before submitting, write a structured jobs manifest (`job_key -> segment_id -> service -> params -> source refs`) and perform a lightweight preflight: placeholder numbering does not exceed bounds; the same source ref is not passed in both channels; the same URL / asset is not duplicated; batch params field names use underscores; lipsync jobs do not contain both `audio_url` and `duration`; **path guard — a non-Seedance model job carries no `ark_asset_ids`/`@assetN` (it feeds keyframes), a Seedance model job uses the asset-reference path; a model/mechanism mismatch means the model was changed → resolve per `docs/non_seedance_path.md` (Phase 06, late model change), do not submit a broken request**. Any failure -> STOP, go back to Phase 05a / 05b to fix; do not silently patch the prompt.
C. After receiving raw video -> write `raw_video_url`. If raw video stream duration + 0.05s < creative_proposal.segments[i].duration -> status=failed (cannot be salvaged). Otherwise generate `assembly_video_url`:
   `ffmpeg -i raw.mp4 -t <creative_proposal.segments[i].duration> -map 0:v:0 -vf "scale=<target_w>:<target_h>,setsar=1,fps=<target_fps>,format=yuv420p" -c:v libx264 -preset fast -crf 18 -an assembly.mp4`
   target_fps uses the most common fps in this batch; default 30; `-c copy` is prohibited. ffprobe verifies assembly video duration; difference > 0.05s -> re-trim; still fails -> status=failed.
D. Failure fallback (see cli_translation.md failure handling section): model error -> retry once -> fallback model (status=degraded + model_used records the actual model used) -> still fails: status=failed + error.
   **Lipsync failure first-check**: (1) batch JSON `params` field names must always use **underscores** (CLI flags use hyphens, but writing hyphens in jobs-file -> treated as unknown fields and stripped -> refs not passed through -> model hallucinates faces / null output); (2) single-frame uses `image_url`, multi-frame uses `keyframes` (mutually exclusive); which service to use, frame count, each frame's fields -- **consult `dl lipsync -h` directly**. **This is the most common cause of lipsync batch-wide failures**; verify fields before retrying.
E. Assemble video_segments: each segment { id, raw_video_url, assembly_video_url, status, model_used?, error? }; segments[] strictly index-aligned with creative_proposal. Successfully generated segments get status=generated (fallback ones get degraded).
```

> **Batch execution**: one task runs all segments; do not loop the main agent segment by segment.

## Step 2 -- Main Agent QA Gate

1. **Count alignment**: `video_segments.segments.length == creative_proposal.segments.length`
2. **Assembly precision**: spot-check `assembly_video_url` video stream duration approximately equals `creative_proposal.duration` (difference < 0.05s); no audio stream; resolution / SAR / fps are uniform; if `-c copy` was used / drift exceeds threshold -> send back to Phase 06 for reprocessing
3. **Spot-check (up to 5 segments)**: `raw_video_url` / `assembly_video_url` are both playable, aspect ratio is correct, no black screen / frozen frames. Lipsync segments: use raw to check lip movement + audio sync; asset_reference segments >5s: verify internal shot transitions are actually rendered (not just animating one segment); keyframe-path non-lipsync segments: verify the clip actually animates from the keyframe (not a frozen still) and matches the seeded composition
4. **Automated verification (optional)**: `dl understand-media` batch-checks characters / scenes / artifacts; if anomalies found -> mark `status=needs_review`; the FINALIZE SELF-CHECK reviews the actual video to decide

## Step 3 -- FINALIZE SELF-CHECK

> **Audio track boundary (this phase does not mix music)**: the final audio track is Phase 07's job -- the next step will use `audio_analysis.music_url` as a full overlay. This phase's `raw_video_url` is only for single-segment preview / lipsync QA; `assembly_video_url` is already stripped of audio, exclusively for concatenation. Hold this in mind during the self-check: "This step is mainly for reviewing visuals and per-segment lip sync; do not judge the final audio by what is heard here."

First, `dl artifact write` to save video_segments as a draft (each segment with status=generated / degraded / failed / needs_review), then read back the **actual content of the draft** -- the status table below + playable URLs per segment all come from the draft (draft-first):

```
Video Production results (<N> segments; generated=<X> / degraded=<Y> / needs_review=<W> / failed=<Z>):

Note: This step is mainly for reviewing visuals and per-segment lip sync. Each segment's raw_video_url carries the model's original audio / lipsync driving audio; assembly_video_url is the silent input for concatenation. The final audio track in Phase 07 uses the original track as a full overlay -- do not send back a segment just because the music in the raw video sounds wrong.

seg_01  - generated    - seedance-2-0                              - pass
seg_02  - generated    - dlai2v_pro                                - pass
seg_04  - degraded     - seedance-2-0-fast (fallback)              - pass
seg_05  - needs_review - seedance-2-0 - automated check suspects only partial animation - review video
seg_08  - failed       - dlai2v_pro - null output (suspected keyframe issue) - fail
```

Self-check the segments and decide the disposition yourself:
- **Accept** (generated / degraded / reviewed needs_review that you judge acceptable) -> mark accepted segments confirmed, proceed to Phase 07 (concat + original audio track full overlay).
- **Retry** failed / needs_review segments (decide whether to switch model) -> sub-agent retries specified segments -> return to Step 2 for re-check.
- **Lipsync failed** -> go back to Phase 05b to regenerate that segment's keyframes (MCU+ framing) -> return to this phase.
- **Skip failed segments** (Phase 07 concat skips them) -- only when fallback still fails and the shorter duration is acceptable to the creative intent; failed segments get raw_video_url / assembly_video_url = null + status=failed, handed to Phase 07 to skip.
- **Abandon all** -> go back to Phase 05 to revise prompts, restart this phase.

On accept -> change accepted segments' `status` to `confirmed` -> `dl artifact write` to overwrite the draft (writing segments with confirmed status) -> finalize promote:

```bash
cat <<'EOF' | dl artifact write --slot=video_segments --content-type=application/json --content-file=-
{ ... accepted segments with status=confirmed ... }
EOF
```

```bash
dl artifact finalize --slot=video_segments --mode=verify_and_promote \
  --contract='<ARTIFACT_CONTRACT_PATH>'
```

## Do Not Proceed Unless

- `segments.length == creative_proposal.segments.length`
- Every segment `status` is determined
- `confirmed` / `degraded` segments have non-null `raw_video_url` / `assembly_video_url`; `assembly_video_url` has no audio + ffprobe video duration difference < 0.05s
- FINALIZE SELF-CHECK passed (including accepting degraded segments, and skipping failed segments when the shorter duration is acceptable)

## Output Slot

- `video_segments` (promoted)

## Next Phase Entry

Read `phases/07-final-assembly/PHASE.md` from the same skill root.
