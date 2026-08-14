---
name: mv-skill
description: >-
  Use when the user has an existing music track (`music_url` required)
  and wants a 30s+ music video, singing performance, vocalist-led clip,
  lip sync/lipsync video, or full-song MV where every cut, segment, and
  keyframe is driven by the audio (beats / structure / energy — music is
  the authoritative timeline). Prefer this skill over generic video
  skills whenever someone is singing or lipsyncing and the requested
  duration is 30s or longer. 8-phase pipeline (audio analysis → creative
  direction + segment plan → visual style + ratio → reference assets →
  video prompts + lipsync keyframes → batched video gen → final
  assembly with original audio overlay → optional cover + social). No music yet?
  `load_skill('music-generation')` first, capture the URL, then enter
  here. For narrative short use `visual-production`; for host-led
  explainer use `knowledge-video`. Do NOT use for excerpts, highlight
  cuts, partial-song teasers under 30s, or any video where audio is not
  the main timeline.
metadata:
  version: 2.2.0
  compatibility: "Requires the creation runtime with the built-in `read` tool plus `dl` action verbs, `dl artifact`, related CLI groups, `upload_file`, and local ffmpeg/ffprobe for Phase 05b grid splitting."
  artifact-contract: schemas/artifact_contract.json
  ilands:
    applicable-to: [creation]
    priority: 5.0
    kind: composition_skill
    complexity: high
    consumes: []
    produces:
      - slot: "audio_analysis"
        content_type: "application/json"
        schema_ref: "schemas/audio_analysis.schema.json"
      - slot: "creative_proposal"
        content_type: "application/json"
        schema_ref: "schemas/creative_proposal.schema.json"
      - slot: "visual_config"
        content_type: "application/json"
        schema_ref: "schemas/visual_config.schema.json"
      - slot: "reference_list"
        content_type: "application/json"
        schema_ref: "schemas/reference_list.schema.json"
      - slot: "video_prep"
        content_type: "application/json"
        schema_ref: "schemas/video_prep.schema.json"
      - slot: "video_segments"
        content_type: "application/json"
        schema_ref: "schemas/video_segments.schema.json"
      - slot: "final_video"
        content_type: "application/json"
        schema_ref: "schemas/final_video.schema.json"
      - slot: "social_kit"
        content_type: "application/json"
        schema_ref: "schemas/social_kit.schema.json"
    invalidates: []
    recommended-skills:
      - audio-transcription
      - create-subtitles
      - search-visual-style
      - image-generation
      - video-generation
      - lipsync
      - ffmpeg
      - remotion
      - script-processing
      - pricing-and-policies
---

# mv-skill

Full-song to MV 8-phase composition skill. Each phase produces an independent artifact, advancing forward in a unidirectional pipeline by content.

## Pipeline Overview (8 phases)

| Phase | Entry | Output Artifact | Self-Check |
| --- | --- | --- | --- |
| 01 | `phases/01-audio-analysis/PHASE.md` | `audio_analysis` | Automatic (stops only on failure); agent verifies the lyrics timetable against the audio |
| 02 | `phases/02-creative-proposal/PHASE.md` | `creative_proposal` (logline + brief + segments) | agent resolves 4 creative decisions (mv_type / tone_mood / model / visual instructions) from its brief, then verifies treatment + segments against the criteria |
| 03 | `phases/03-visual-config/PHASE.md` | `visual_config` | agent picks style + ratio from its creative brief |
| 04 | `phases/04-reference-list/PHASE.md` | `reference_list` (character/location/prop, real-person ARK only on the asset_reference path) | agent verifies visual identity against the brief |
| 05a | `phases/05a-video-prep/PHASE.md` | `video_prep` (draft: prompt + non-lipsync refs) | agent verifies prompts against the template + segment plan |
| 05b | `phases/05b-lipsync-keyframes/PHASE.md` | `video_prep` (promoted: keyframes added) | agent verifies keyframes (runs when lipsync segments exist OR on the keyframe path — see `docs/non_seedance_path.md`) |
| 06 | `phases/06-video-production/PHASE.md` | `video_segments` | agent decides on segment failures (retry / fallback / skip) |
| 07 | `phases/07-final-assembly/PHASE.md` | `final_video` (no subtitles) | agent verifies the final cut against the brief, then promotes |
| 08 | `phases/08-cover-social/PHASE.md` | `social_kit` (cover + copy, optional) | agent verifies release materials against tone + logline |

For the complete field dependency graph, see `slots[].consumed_by` in `schemas/artifact_contract.json`.

## Segment Architecture (the sole rendering unit)

**Each segment = one video model call**. The `segments[]` array is born in Phase 02 `creative_proposal` (the pipeline spine), defining the time structure and scene-level description (without ref_id). Both lipsync segments (model is always `dlai2v_pro` -- 1 keyframe uses `image_url` single-frame, 1-4 keyframes use the `keyframes` list for multi-frame) and non-lipsync segments (`model_primary`) can have multiple shots within a segment, enveloping 4-15s. Intra-segment multi-shot is expanded via time labels in Phase 05a prompts (non-lipsync = real cuts; lipsync multi-frame interpolates between keyframes to change pose / framing, not hard cuts). There is no `shots[]` nesting layer within a segment -- `segments[]` in all downstream artifacts strictly align by index with `creative_proposal.segments[]`.

**Reference mapping happens in Phase 05**: Phase 02 segment `description` only uses people / places / things already named in the brief (by name, without ref_id, because reference_list does not exist yet). Phase 05a maps `reference_list.references[]` (character/location/prop) for non-lipsync segments; **lipsync segment keyframes are not in reference_list** -- Phase 05b launches an independent sub-agent for each lipsync segment (and, on the keyframe path, each non-lipsync segment) to prepare the generation request, defaulting to `dl generate-image --service=gpt-image-2 --aspect-ratio=<helper generation_aspect_ratio> --image-size=2K` to generate a single image or up to a four-panel grid, splitting, removing black borders, uploading, then filling into `video_prep.segments[].references[]`. `reference_list` only contains `references[]` (character/location/prop asset library), no keyframes.

ARK registration = seedance real-person policy: **registered in Phase 04** (model_primary is already selected in Phase 02) -- when model_primary is a seedance variant, register `ark_asset_id` for real-person character refs. Lipsync keyframes (dlai2v_pro, generated in 05b) / pure scenes / cartoon / non-seedance models do not register. `ark_asset_id` is optional in the schema.

## Working Principles

**Unidirectional pipeline**: Each artifact is independently promoted; downstream never patches upstream. If any segment needs changes -> go back to `creative_proposal` to modify -> all downstream artifacts are regenerated.

**Segment alignment**: From Phase 02 onward, the `segments[]` array in all artifacts strictly corresponds one-to-one with `creative_proposal.segments[]` (same length, same order), linked by array index, with no global IDs introduced.

**Sub-agent execution**: Time-consuming work is delegated to clean-context sub-agents. **Phase 04 reference generation is done by the main agent itself** (with real-person ARK registration when model_primary=seedance); do not hand the entire Phase 04 to a sub-agent -- at most use a sub-agent to batch-write image generation prompts. Phase 05a prompt writing and Phase 06 video generation can be batched; **Phase 05b must use one independent sub-agent per lipsync segment**, each sub-agent handling only one `seg_NN` and returning a structured generation request / manifest. The main agent is responsible for job_ref mapping, splitting, uploading, validation (05b also requires `understand_media` to verify each split keyframe) and the FINALIZE SELF-CHECK. Phase 02's logline + brief + segment list is also delegated to a sub-agent using model `litellm/gemini-3.1-pro-preview` -- it does `dl artifact read` on the upstream audio_analysis, performs a single complex generation (not batch), and the main agent does not micro-edit planning / creative content, relying on schema validation + the main agent's own self-check against the phase criteria for quality control.

**Self-Check Gate (draft-first, unified across all phases)**: The sequence is fixed as **`dl artifact write` (write draft, not promoted) -> the agent reads the actual content of the draft and verifies it against this phase's criteria -> on pass, `dl artifact finalize --mode=verify_and_promote` (promote) -> proceed**. That is, first persist the artifact to disk as a draft, so what the agent verifies is **the actual written content**, not a separately handcrafted mockup; only after the self-check passes is it finalized. The agent is the creative decision-maker, acting from its own persona / SOUL — it makes the call from its own taste, never pausing for a human. The draft remains visible to the parent on the Canvas (passive visibility, not a gate). If the agent's self-check finds a problem -> overwrite the draft with `dl artifact write` and re-verify. Do not claim the artifact is finalized / promoted before finalize succeeds. Phase 01 has no "proceed" gate, but the lyrics timetable is still draft-first (write draft first, then the agent verifies the line-by-line lyrics table from the draft against the audio, finalize after it passes); Phase 02 / 03 / 04 / 05a / 05b / 06 / 07 / 08 all have proceed self-checks (05b runs when lipsync segments exist or on the keyframe path -- video_prep is drafted by 05a, keyframes are added by 05b before finalize; only when there are no lipsync segments AND the path is asset_reference does 05a finalize directly; 08 is optional and can be skipped).

## Non-negotiable Invariants

> **Two non-lipsync paths.** The ARK / `@assetN` / asset single-path / "character ref even with a keyframe" invariants below describe the **asset_reference** path (`model_primary` is a Seedance 2.0 variant — `seedance-2-0` / `seedance-2-0-fast`). When `model_primary` is **not** a Seedance 2.0 variant, non-lipsync segments are on the **keyframe** path documented in `docs/non_seedance_path.md`, which **supersedes those Seedance-specific invariants for non-lipsync segments** (no ARK; no `@assetN`; identity is baked into a Phase 05b keyframe, then image-to-video). The keyframe path never feeds `ark_asset_ids`/`@assetN`, and there is **no third "plain multi-image" path** (every non-Seedance model is keyframe path even if it accepts multiple images). Lipsync segments are unaffected. A Phase 06 path guard rejects any non-lipsync job whose model and mechanism disagree.

- **Full-song coverage**: From `0.00` to the exact `audio_analysis.duration`, no excerpts / teasers.
- **Audio track authority**: The original audio track is authoritative. Phase 07 assembly uses **overlay**, not mix. Phase 06 writes `raw_video_url` (model raw output, for preview / traceability) and `assembly_video_url` (precisely trimmed, no audio, uniform specs, for assembly) for each segment; Phase 07 only uses `assembly_video_url` for concat, then overlays the original audio track.
- **Trim precision**: Phase 06 must produce assembly-ready clips: `-c:v libx264` re-encode, `-an` strip audio, uniform resolution / fps / SAR / yuv420p, and ffprobe-measured video duration (tolerance 0.05s), **`-c copy` is forbidden**. Phase 07 no longer trims / normalizes per-segment, only validates `assembly_video_url` then concats; post-concat drift policy: <=0.1s direct overlay, 0.1-1.0s allows `atempo = audio_analysis.duration / concat_video_duration` slight compensation, >1.0s go back to Phase 06 to find the drifting segment.
- **Sub-agent audit trail**: Phase 07 assembly sub-agent must return `audit_trail` (drift_check_ran / assembly_segment_durations / concat_video_duration / cumulative_drift / drift_policy / audio_adjustment_ran / atempo_factor / concat_command / etc.), the main agent **first verifies audit trail completeness** -- missing fields or false values result in immediate rejection, sending back to the sub-agent for re-run. Phase 06 per-segment trim precision is spot-checked by the main agent QA Gate via ffprobe measurement (delta < 0.05s). Neither allows the sub-agent to return only the final product while silently skipping critical checks.
- **gpt-image-2 size control**: When Phase 04 / 08 etc. reference / cover image generation requires strict aspect ratio control, select currently valid parameters per the corresponding PHASE / CLI help. **Phase 05b is the exception: do not pass vendor, do not default to `--size`; per its PHASE.md, use the helper to calculate `generation_aspect_ratio` + `panel_layout_description`, call `dl generate-image --service=gpt-image-2 --aspect-ratio=<generation_aspect_ratio> --image-size=2K`, inject `panel_layout_description` into the prompt, then use the split helper to cover-crop each keyframe to the video target ratio**. `width` / `height` are not recognized by gpt-image-2; do not pass them.
- **Batch jobs-file field name hard rule (universal across atomic skills)**: All field names in `params` for `dl <verb> --jobs-file=...` must use **underscores** (`image_url` / `audio_url` / `keyframes` / `image_urls` / `ark_asset_ids` / `aspect_ratio` ...), not CLI hyphens (`--image-url`). **Wrong field name = silently stripped as unknown field = ref not passed through = model hallucinates / generation fails; missing required field = E_SCHEMA**. **Which fields each service accepts, single-frame (`image_url`) vs multi-frame (`keyframes`, mutually exclusive), frame protocol -> check each atomic skill's `dl <verb> -h` at runtime**. Lipsync segment production discipline + role mapping: see `phases/06-video-production/references/cli_translation.md`.
- **Seedance segments containing characters**: Non-lipsync segments containing characters must explicitly include the character ref in `references[]` -- even if a keyframe is present. Keyframes may be mid/long shots / side views / back views (low character recognizability); seedance cannot lock identity from keyframes alone and must additionally receive the character's corresponding look 2-panel character reference sheet (with face + full body) as character_asset. See `phases/05a-video-prep/PHASE.md` for details.
- **Seedance source ref single-path rule**: The same source ref may only be passed once. Real-person / IP character refs with `ark_asset_id` must be asset-only: only go into `ark_asset_ids` + `@assetN`; do not also put the same `url` into `image_urls` + `@imageN`. Location / prop remain image-only.
- **Every appearing entity must be named in the prompt + reference image count is capped by model limits**: In non-lipsync segments, every appearing character / location / prop must be named in the prompt using `@imageN` / `@assetN` -- just attaching a reference url without mentioning it in the prompt = the model does not know where to use it. Placeholders use **per-channel independent numbering**: `@imageN = image_urls[N-1]`, `@assetN = ark_asset_ids[N-1]`, `@audio1 = reference_audio_url`; do not use global reference_list numbering or mixed asset/image numbering. The number of images in `references[]` follows the `segment.model` limits in `video-generation/SKILL.md`; when exceeding limits, drop the least critical image refs that are best described in text (remove from `references[]`, compensate with text in the prompt), keeping 2-panel character reference sheets and other identity / structure refs that are hardest to describe in text.
- **Image generation prompt minimalism principle**: Hand deformities / reversed hands / 6 fingers / extra hands are **not inherent model defects but caused by over-description in prompts leading to token conflicts**. Trust the ref -- prompts should only describe **action intent** ("reaching forward" / "palm touching surface"), **do not count fingers / do not write "anatomically correct" / do not use negations ("no extra hands")**. The ref image already provides character anatomy; repeating descriptions in the prompt causes the model to split attention -> token conflicts -> erroneous fusion. Model routing is not the first remedy -- `gpt-image-2` is the default model and works for hand-containing scenes too. Only consider fallback to `seedream-4.5` after prompt simplification still fails. Phase 04 main agent QA spot-checks for hand reasonableness by first checking whether the prompt is over-descriptive.
- **Segment is the rendering unit**: Each segment = one model call. Both lipsync segments (`dlai2v_pro`, single-frame image_url / multi-frame keyframes) and non-lipsync segments (`model_primary`) can have multiple shots within a segment (intra-segment multi-shot is described by `Shot 1 (0-Ys)` / `Shot 2 (Y-Zs)` time labels in Phase 05a prompts, **not** splitting multiple shots into independent artifact rows), enveloping 4-15s. **There is no `shots[]` nesting structure within a segment**. `segments[]` in all downstream artifacts align by index with `creative_proposal.segments[]`.
- **Lipsync keyframe framing hard rule**: Each lipsync segment's keyframe (single image split from Phase 05b `gpt-image-2` generation) must satisfy -- face clearly identifiable, mouth visible. Do not add extra composition / pose / eye requirements; Phase 05a must explicitly include `face clearly visible, mouth visible` when writing lipsync shot-by-shot prompts; 05b uses `understand_media` to verify each split keyframe (residual large black borders / split-screen / collage text / watermarks / anomalies -> retry).
- **Lipsync keyframes are independently generated per segment in Phase 05b**: Each lipsync segment's 1-4 shot keyframes are generated by an independent sub-agent according to the respective shot-by-shot + narrative + visual style + aspect ratio + reference images. The sub-agent must inject `visual_config.visual_style.prompt_modifier` and the helper's `panel_layout_description`, requiring the grid visual style, character identity, costume/makeup, and lighting quality to match the reference images, using black borders / black dividers; after generation, split with `split_keyframe_grid.py`, auto-remove black borders, cover-crop to target ratio, upload, then fill into `video_prep` for that segment's references (single-frame image_url / multi-frame with frame_position). Each segment is generated independently; adjacent segments are naturally different.

- **Phase sequence hard constraint**: Each phase must consume already-promoted upstream artifacts. Skipping phases (except Phase 08 optional), fabricating upstream outputs, or proceeding based on "guessed" upstream fields is forbidden.
- **Must read `pricing-and-policies/SKILL.md` before production**: Before any image / video / music generation call, the main agent must parse the current phase's generation package (service / model / aspect / resolution).
- **`ARTIFACT_CONTRACT_PATH`**: Before any artifact operation, read `schemas/artifact_contract.json` from this skill dir to get the absolute path, and use the same path for all `dl artifact write / finalize` calls.
- **Cannot skip verify_and_promote**: Every phase's output must go through the agent's self-check (except Phase 01) + `dl artifact finalize --mode=verify_and_promote`. A narrative summary cannot replace a finalize call.
- **Failure must not be disguised as success**: If `dl artifact write / patch-json / finalize` fails -> the upstream artifact does not exist. Do not advance via narrative.
- **Cross-phase artifact overwriting is forbidden**: Each artifact is only written + finalized in its own phase (during draft stage, `dl artifact write` can overwrite repeatedly until the agent's self-check passes; after promotion, downstream cannot `patch-json` to modify upstream).
- **ARK registration = seedance real-person policy (not universal registration)**: **Registered in Phase 04** (model_primary is already selected in Phase 02) -- when model_primary is a seedance variant, register `ark_asset_id` for real-person character refs. Location / prop / non-real-person / non-seedance model / lipsync keyframes (dlai2v_pro, 05b) do not register. `ark_asset_id` is optional in the reference_list schema; the schema does not enforce it.
  **When registration is actually needed (real-person images fed to seedance), do not use the following reasoning to avoid it**:
  - No: "This is AI-generated so it doesn't count as a real person" -- the ARK classifier does not distinguish real-person / AI-photorealistic / AI-cartoon
  - No: "Cartoon style is not a realistic human face" -- ARK treats all as potentially contentious
  - No: "Skip to save cost" -- registration is ~$0.001/image, seedance failure + re-generation is ~$0.10+/image

  Determination: if the image being fed to seedance has a recognizable human head/body -> register.

## Shared CLI Discipline

- One Bash tool call = one `dl ...` command. The Bash router only recognizes top-level `dl`.
- Do not hide `dl ...` inside `python3 -c` / `subprocess.run` / command substitution / shell wrappers.
- `dl artifact write` uses heredoc to pass `--content-file=-`; do not use `--content="$(cat ...)"`.
- `dl <verb> --wait` / `--jobs-file=...` is runtime-managed yield/resume, **do not write polling loops**. Default is async submit then wait for `[async-callback] job=<ref>` injection.
- Use current Pi CLI groups only:
  - `dl <verb>` / `dl <verb> --jobs-file=...` / `dl ffmpeg` / `dl remotion`
  - `dl asset register` / `dl asset get`
  - `dl artifact write` / `read` / `patch-json` / `finalize --mode=verify` / `finalize --mode=verify_and_promote`
  - `dl script exec` / `dl knowledge search`
- Batch envelope must strictly follow the atomic skill format (`[{"job_key":"...","params":{...}}]`); do not flatten `service` / `prompt` etc. to the job top level.

## Shared Schema Discipline

- Before writing an artifact, first read the corresponding schema file (`schemas/<slot>.schema.json`), then read the phase-local `templates/*.minimum.json`.
- Artifact content = flat domain JSON. `dl artifact write` auto-injects slot/status; the agent only writes root-level domain fields (including full metadata + segments[] / references[] arrays).
- Use `phases/<phase>/templates/<slot>.minimum.json` as the starting point, filling fields in its flat domain format.
- Write the minimum schema-valid JSON first, then enrich. On AJV failure -> fix literally + retry, **do not reverse-engineer schema structure from validator errors**.
- Do not invent enum values; do not collapse object fields into strings.
- Cross-artifact consistency rules (that schemas cannot express) are enforced by PHASE.md SOPs -- see `slots[].cross_artifact` in `schemas/artifact_contract.json` for complete rules.

## What This Skill Owns / Does Not Own

**Owns**: workflow structure, 8-artifact dependency graph, `dl artifact` / `dl <verb>` CLI conventions, phase routing.

**Does Not Own**:
- Upstream approval policies (determined by runtime system prompt)
- Subtitle generation / SRT / caption burn-in -- after the final cut is produced, the agent separately runs the `create-subtitles` skill on `final_video.video_url` if it decides subtitles are warranted, **not in any phase of this skill**
- Pricing / copyright / safety confirmation (determined by runtime)
- Specific generation parameters (each phase references the corresponding atomic skill's SKILL.md)

## Required Bootstrap

1. Read `schemas/artifact_contract.json` from this skill dir to get the absolute path as `ARTIFACT_CONTRACT_PATH`.
2. Read `phases/01-audio-analysis/PHASE.md` to begin Phase 01.
3. After each phase completes, jump to the next phase per the `Next Phase Entry` at the end of the PHASE.md.
