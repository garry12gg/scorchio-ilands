# Changelog

Every version is a **patch after a production failure**. This document records: (1) the failure symptom that triggered the version; (2) the root cause; (3) what was changed. For anyone picking this up next -- avoid stepping on the same mines.

Format: the `(v1.0.X)` tag on each rule corresponds to a production trigger in this changelog. Check the background before deleting any rule.

---

## 2.2.0 (non-Seedance non-lipsync segments use the keyframe path, isolated in a doc)

**Production failure**: Non-lipsync segments were prepared with the Seedance 2.0 asset-reference mechanism (ARK registration -> `ark_asset_ids` + `@assetN`) across Phases 04 / 05a / 06 even when `model_primary` was not a Seedance variant. ARK asset-reference is Seedance-only, so non-Seedance models received `@assetN` placeholders and ARK assets they cannot consume -> the refs were silently stripped and the model hallucinated / produced identity-broken video. Two ways in: (1) a non-Seedance model was chosen up front; (2) Seedance 2.0 was chosen but the model was changed at generation time, leaving Seedance-style prep behind.

**Root cause**: There was no keyframe (image-to-video) preparation path for non-Seedance models, and the whole pipeline implicitly assumed the Seedance asset-reference mechanism for every non-lipsync segment.

**Changes**:

- Added `docs/non_seedance_path.md` — a single cross-phase document holding the entire keyframe path for non-lipsync segments (Phase 02 per-scene segmentation, Phase 04 no-ARK source refs, Phase 05a no-`@assetN` prompts + empty keyframes, Phase 05b keyframe generation with shot-composition framing, Phase 06 image-to-video request + path guard + late model change). The standard (Seedance asset_reference) path text is unchanged; each phase only gains a one-line fork-pointer + scope. Trigger: `model_primary` is not `seedance-2-0` / `seedance-2-0-fast`.
- Phase 05b now runs when there are lipsync segments OR on the keyframe path, processing both with the same machinery (framing branches on `segment_kind`: lipsync = face/mouth visible; non-lipsync = shot composition). Phase 05a routes keyframe-path projects to 05b even with zero lipsync segments.
- Phase 06 added a path guard: a non-Seedance job must carry no `ark_asset_ids` / `@assetN`; a Seedance job uses the asset-reference path; a mismatch (model changed) stops the submit and routes to the doc's late-model-change handling, reusing Phase 04 refs to backfill keyframes via Phase 05b. Keyframe count = shot-composition count (model-agnostic); Phase 06 maps it onto the chosen model's i2v frame protocol, so the specific non-Seedance model can be confirmed / swapped at request time.
- Replaced `cli_translation.md`'s old "ARK -> plain-image downgrade" fallback (it fed character URLs as plain images — the forbidden third path) with a path-switch STOP. The skill stays billing-agnostic: no premium / paid-membership reasoning; the model choice alone selects the path.
- SKILL.md scopes the ARK / `@assetN` / single-path invariants to the asset_reference path via one note (invariant bodies unchanged); `creative_proposal.schema.json` segmentation-coupling descriptions reworded to the path form. No schema field added — the path derives from `model_primary`.

---

## 2.1.10 (Phase 02 Step 0 anti-recap gate-loop fix + full zh->en translation)

**Production failure**: In Phase 02 Step 0, the 4 Creative Gates (`mv_type` / `tone_mood` / `model_primary` / `visual_instructions`) were collapsed by the LLM into a single recap / combined confirmation card. User selections never wrote back into gate state, so the same card was re-emitted every turn -- Step 0 dead-looped and never advanced to spawning the sub-agent.

**Root cause**: Step 0 did not forbid merging the gates into a recap, so the LLM defaulted to summarizing all 4 gates in one confirmation card. A combined card has no per-gate write-back path, so each answer was dropped and the stage could not progress.

**Changes**:

- Phase 02 Step 0: added a hard constraint -- each gate is its own single conversation turn (one ChoiceCard / one free-text input); as soon as the user answers, immediately proceed to the next gate. After the 4th gate is answered, go straight to Step 1 (spawn sub-agent) -- no recap / combined confirmation card / re-confirm. To change a gate later, use Step 2 user gate "option 4 -> back to Step 0".
- Refactor (not a failure patch): translated all 15 skill `.md` files from Chinese to English (skill instructions are LLM-facing; English reduces ambiguity). Code blocks / JSON examples / CLI commands / field names / enum values unchanged; line / heading / code-block counts preserved against the originals, 0 residual Chinese.

---

## 2.1.9 (reference placeholder + Phase 06 assembly clip)

**Production failure**: The `@imageN` / `@assetN` numbering in seedance prompts was interpreted using global reference or mixed visual slot numbering, causing prompts to point to non-existent inputs; some segments also passed the same real-person ref to both `ark_asset_ids` and `image_urls`. Phase 07 also redundantly trimmed segments that Phase 06 had already processed, creating unclear responsibility boundaries.

**Root cause**: `dl generate-video` placeholders use per-channel independent numbering (`@imageN = image_urls[N-1]`, `@assetN = ark_asset_ids[N-1]`), but the skill docs did not clearly document this rule; Phase 06 lacked a pre-submission manifest / preflight; both Phase 06/07 assumed responsibility for segment-level trimming.

**Changes**:

- Phase 05a / 06: clarified per-channel independent placeholder rules; Seedance real-person character source refs must be asset-only, location / prop remain image-only.
- Phase 06: added lightweight preflight before submission -- placeholder numbering, duplicate refs, dual asset/url submission, jobs params underscore field names, lipsync `audio_url + duration` conflicts.
- `video_segments` now outputs `raw_video_url` + `assembly_video_url` per segment; Phase 06 produces precisely trimmed, audio-free, uniform-spec assembly clips.
- Phase 07 no longer trims / normalizes per-segment; it only validates `assembly_video_url` then concats + overlays the original audio track.

---

## 2.1.8 (lipsync CLI field de-inlining -> check `dl lipsync -h` at runtime)

> This version is a **proactive adjustment** (not a failure patch): lipsync service / single-frame vs multi-frame fields / frame protocol are authoritative from the CLI; the skill does not inline field tables.

**Changes**:

- **Phase 06 (PHASE.md + cli_translation.md) + SKILL.md**: dlai2v_pro single/multi-frame field names, frame counts, sizes, and frame protocol now point to `dl lipsync -h` + `lipsync/SKILL.md` for runtime lookup; retained stable discipline (underscore `params` field names, `image_url` and `keyframes` are mutually exclusive, role -> segment mapping, precise trim, fallback).
- **cli_translation.md section 4**: "Batch Envelope JSON template" changed to "role -> fed to whom" mapping; no longer pasting concrete field JSON.

## 2.1.7 (Phase 04 main-agent-owned + 2-panel character reference sheet + single-look skips portrait)

> This version is a **proactive adjustment** (not a failure patch): converging character reference format and Phase 04 execution method, plus tightening Phase 05a prompting.

**Changes**:

- **Phase 04 changed to main agent full execution**: Entity extraction / deriving references plan / submitting `dl generate-image` / ARK registration / validation all done by the main agent, no longer handing the entire phase to a batch sub-agent; at most, spawn a sub-agent that **only writes image generation prompts**.
- **Character reference = single 2-panel character reference sheet** (aspect 4:3, left = upper body with head / face clearly visible, right = full body): one image provides both a clear face + complete physique, replacing the old portrait face anchor + outfit two-image pairing. Downstream 05a / 05b / 06 `character_asset` is this character reference sheet.
- **Single-look characters skip portrait**: Single-look characters directly generate a 2-panel character reference sheet without a portrait; multi-look characters first generate a portrait (only for img2img face-locking anchor, not for video gen) -> PORTRAIT GATE to confirm face -> then img2img to generate each look's 2-panel character reference sheet.
- **Phase 05a lipsync prompting tightened**: Each shot must include `sings/speaks with perfect lip synchronization` (N shots = written N times); fixed prefix `Follow the character and visual style from the input image. All shots should continue in motion\n\nsync motion and lips to the audio.`; no cuts / transitions, no visual style pasted (framing changes rely on keyframe interpolation).
- **Phase 05a non-lipsync prompting**: visual style <= 15 words; non-character references (scene / prop) being fed must be named in the prompt via `@imageN`, with URLs taken from the latest `reference_list`; non-real-person images do not register ARK (`@imageN`), real-person character reference sheets go through ARK (`@assetN`).

---

## 2.1.6 (Seedance source ref single-path rule)

**Production failure**: The agent passed the same character reference simultaneously as both `ark_asset_ids` and `image_urls` to seedance, causing the same asset to appear twice in the reference list and potentially triggering count limits / upstream policy issues.

**Root cause**: Although the CLI / skill documented that seedance real-person refs should be asset-only, Phase 06's translation examples were ambiguous, easily leading the agent to submit both the registered character's `url` and `ark_asset_id` together.

**Changes**:

- `dl generate-video -h` / seedance model help / preflight help clarified: if the same source ref goes through `ark_asset_ids`, it must not also go through `image_urls`.
- `mv-skill` Phase 06 translation rules and examples changed to single-path: registered characters only go into `ark_asset_ids`, location / prop go into `image_urls`.

---

## 2.1.5 (Phase 05b black-edge cleanup + ref completeness)

**Production failure**: After 05b splitting, individual keyframes could still have residual black borders / divider edges; some multi-panel generations also lacked clear shot variation or were missing location / prop references.

**Root cause**: 2.1.4 only excluded divider lines based on detected real dividers without adding a safety crop margin inward from the panel edge; prompts / requests also did not make panel variation and segment-scoped location / prop refs a hard checkpoint.

**Changes**:

- `split_keyframe_grid.py` now adds a small guard crop beyond detected dividers and performs a near-black edge cleanup pass on the final output; allows sacrificing a small amount of edge content for black-border-free keyframes, while adjusting the default ratio tolerance to 20% to accommodate 05b's approximate outer ratios.
- `panel_layout_description` now requires multi-panel images to show different key moments within the same segment, with variation in framing / angle / expression / pose / action state.
- 05b request validation now requires including face anchor, outfit, and the segment's location / prop source refs (if applicable).

---

## 2.1.4 (Phase 05b divider-aware split)

**Production failure**: gpt-image-2 generated grid panel divider lines sometimes not at mathematically equal positions; equal-split cropping would bring the bottom content of the previous cell and the black divider line into the next keyframe.

**Root cause**: The split helper only cropped by `cols/rows` equal division without using the black dividers (requested by prompt) as real boundaries.

**Changes**:

- `split_keyframe_grid.py` now detects full-width / full-height black divider bands near expected boundaries, preferring to crop along real dividers and excluding the divider lines.
- Manifest adds `split_mode` and `detected_dividers` diagnostics; falls back to equal division with a warning when no complete divider is found.
- `panel_layout_description` adds straight full-length black divider / no content crossing dividers requirement.

---

## 2.1.3 (Skill routing description)

**Changes**:

- Updated `SKILL.md` description: when users mention 30s+ singing / vocalist-led / lip sync / lipsync / MV requests, prefer routing to mv-skill rather than a generic video skill.
- 05b current framing rules further simplified: only require face clearly identifiable, mouth visible; removed extra pose / eye requirements.

---

## 2.1.2 (Phase 05b 3-panel grid prompt/layout)

**Production failure**: The raw grid content for 3-keyframe lipsync was incorrect. 16:9 target segments still used a 2x2 grid; gpt-image-2 would fill the fourth cell; prompts also did not clearly require each internal panel to match the target video ratio -- the model would draw square / portrait panels based on the outer `aspect_ratio`.

**Root cause**: 05b only passed the generation outer ratio to gpt-image-2 without making "internal panel count, arrangement, per-cell ratio, and no extra panels" a prompt input; simultaneously, the 3-panel default of 2x2 wasted one cell.

**Changes**:

- `split_keyframe_grid.py --plan-only` now outputs `panel_layout_description`, requiring the agent to inject it verbatim into the prompt.
- 3 keyframes now prefer a linear layout with exactly 3 cells: common 16:9 -> 1x3 vertical stack + `generation_aspect_ratio=9:16`; only falls back to 2x2 when a linear layout would cause significant distortion.
- 05b validation removed fixed face percentage threshold, changed to: face clearly identifiable, mouth visible, at least one eye visible, 3/4+ facing camera.

---

## 2.1.1 (Phase 05b gpt-image-2 grid aspect routing)

**Production failure**: Phase 05b passed `--size=<W>*<H>` to gpt-image-2 attempting precise grid size control, but the actual returned size did not follow this pixel size, resulting in unstable 2-panel grid ratios.

**Root cause**: What 05b actually needs to stabilize is the generation's standard ratio and the video ratio of each keyframe after splitting, not exact pixel dimensions. `--size` and `--aspect-ratio` are different routes; exact pixel size cannot be treated as a 05b invariant.

**Changes**:

- Phase 05b default changed to `--aspect-ratio=<helper generation_aspect_ratio> --image-size=2K`; no longer defaults to `--size`.
- `split_keyframe_grid.py --plan-only` outputs `ideal_grid_aspect_ratio`, `generation_aspect_ratio`, `generation_image_size`; validates against the generation ratio during split, then cover-crops each keyframe to `visual_config.aspect_ratio`.
- Prompt adds safety margin requirement to prevent approximate-ratio cropping from cutting off face, mouth, or eyes.

---

## 2.0.1 (Phase 07 assembly: strip segment audio + tiered drift compensation)

**Production failure**: Phase 06 per-segment trim retained / re-encoded AAC audio; AAC frame granularity caused each segment container duration to be 0.02-0.054s too long; across 21 segments the cumulative drift was ~+0.785s, causing the final cut's lipsync lip movements to gradually lead. The live hotfix was stretching the original audio track to match the concat video length using `atempo=audio_duration/video_duration`, which restored lip sync.

**Root cause**: Phase 07 assembly treated audio-containing segment container durations as the authoritative timeline. Phase 06 segment audio is only for single-segment preview / lipsync QA and should never enter the final concat chain.

**Changes**:

- Phase 06 retains single-segment preview experience, but clarifies that segment audio does not enter the final cut.
- Phase 07 normalization now must re-extract `-an` audio-free normalized segments per `creative_proposal.segments[i].duration` before concat.
- Phase 07 drift check changed to tiered post-concat strategy: <=0.1s direct overlay; 0.1-1.0s uses `atempo = audio_analysis.duration / concat_video_duration` for slight compensation; >1.0s STOP and go back to Phase 06 to find the drifting segment.
- Audit trail adds `normalized_segment_durations` / `concat_video_duration` / `drift_policy` / `audio_adjustment_ran` / `atempo_factor`.

---

## 2.0.0 (mv-production -> mv-skill, 9 -> 8 artifact restructuring, Phase 05 split into 05a/05b)

> This version is a **proactive restructuring** (not a failure patch): merge artifacts, move gates earlier, lipsync keyframes changed to Phase 05b per-segment independent generation and split-upload, new release materials phase added.

**Background**: 1.1.x was 9-phase with creative_proposal (treatment) / segment_plan / reference_list / keyframe_list each as independent phases. Model selection happened only in Phase 05, meaning segment cutting lacked access to model capabilities; keyframes and references were generated in separate phases.

**Restructuring**:

- **Skill renamed mv-production -> mv-skill**, version 1.1.3 -> 2.0.0.
- **8 artifacts** (including new social_kit), phase steps: 01 / 02 / 03 / 04 / 05a / 05b / 06 / 07 / 08 (**05a and 05b are two independent phases, loaded sequentially by the agent, co-producing video_prep**):
  - `segment_plan` merged into `creative_proposal` -- Phase 02 is a single artifact containing logline + brief + segments[] ("one creative_proposal blob").
  - `keyframe_list` **deleted** -- lipsync keyframes are no longer stored in a separate artifact; Phase 05b generates per-segment, splits, uploads, then fills directly into video_prep; `reference_list` only contains references[] (character/location/prop).
  - Downstream renumbered: old 07 video-prep -> 05a, old 08 video-production -> 06, old 09 final-assembly -> 07.
- **Phase 02 Treatment gates moved earlier with 4 gates** (locked before spawning gemini): `mv_type` / `tone_mood` (multiple choice) / `model_primary` / `visual_instructions`. Model selection moved here so gemini knows model multi-image reference capabilities when cutting segments. gemini (`litellm/gemini-3.1-pro-preview`) produces logline + brief + segments in one task; main agent cuts audio track and backfills audio_url.
- **brief structure** (replaces old treatment): core motif / visual world and tone / character table / memorable moments / **thread and subthreads** / additional info by mv_type.
- **Segment cutting rules changed**: Both lipsync and non-lipsync can have multiple shots within a segment, enveloping 4-15s; when `model_primary` does not support multi-image references, scene transitions must start a new segment; when supported, segments can span scenes (description lists all scenes); lipsync ratio no longer has a separate user gate -- gemini decides based on mv_type / tone_mood, segment review shows the ratio. Segments in Phase 02 do not contain ref_id (reference mapping deferred to Phase 05a).
- **Phase 03**: Visual style candidate display no longer judges match quality / does not show scores / does not say "not close enough" (neutral listing of directions); `resolution` moved into visual_config (model already selected in Phase 02, can be inferred).
- **Phase 04**: Only generates references[] (character/location/prop, **no keyframes**); **ARK registration happens in this phase** (model already selected in Phase 02; when model_primary is seedance variant, registers real-person character refs immediately, not deferred).
- **Phase 05a (old 07 video-prep)**: Only produces per-segment video prompts + assigns model (**lipsync always uses `dlai2v_pro`; both single-frame image_url and multi-frame keyframes use dlai2v_pro, not dlai2v**) + maps character/location/prop references for non-lipsync segments. Writes video_prep draft; if no lipsync segments, this phase finalizes directly.
- **Phase 05b added (runs only when lipsync segments exist)**: One independent sub-agent per lipsync segment, using `dl generate-image --service=gpt-image-2` to generate a single image or up to a four-panel grid (05b does not pass vendor; size/ratio strategy continues to be refined in subsequent versions) -> helper splits and auto-removes black borders -> uploads individual keyframes -> runs `understand_media` on each split image to verify completeness (framing / black borders / split-screen / text / watermarks / anomalies -> retry) -> fills into video_prep for that segment's references (single-frame image_url / multi-frame with frame_position) -> finalizes video_prep.
- **Phase 06 / 07 (old 08 / 09)**: Trim / concat / original audio overlay logic unchanged, only renumbered + changed upstream slot references (segment_plan -> creative_proposal); cli_translation.md adds section 4 Batch Envelope (dlai2v_pro single-frame image_url / multi-frame keyframes template).
- **Phase 08 added (optional)**: `social_kit` -- cover + social copy (title / caption / hashtags), generated based on final_video + creative_proposal; skipping does not affect final_video's final state.

---

## 1.0.0 (vs 2.5.0 full rewrite)

**Background**: 2.5.0 had a monolithic `storyboard` artifact with all segments / shots / keyframes / prompts in one blob; patch-json on one segment contaminated downstream.

**Restructuring**:

- Storyboard split into 5 independent artifacts: `segment_plan` / `keyframe_list` / `video_prep` / `video_segments` / `final_video`
- 9 phases with linear numbering (replacing 2.5.0's duplicated numbering 06/06, 07/07)
- Sub-agent batch execution (Phase 04/06/07/08) -- main agent context not polluted by detailed documents
- Per-phase user gate (Phase 02-09, 8 gates total), not a single storyboard gate
- Original audio track full overlay vs 2.5.0's BGM mix
- Subtitles separated to atomic skill `create-subtitles`
- Strict array index alignment across slots, no global IDs

**What was done wrong at the time** (later reverted):

- 0509 wrapper (slot / display_name / status / version / content_layout / content[]) -- v1.0.1 rollback

---

## 1.0.1 (rollback wrapper)

**Production failure**: During user testing, artifact writing was found to be overly complex -- the agent had to nest two layers of structure.

**Root cause**: `dl artifact write` already auto-injects `slot` / `status`; the wrapper was redundant.

**Changes**:

- 9 schemas + 9 minimum.json stripped of the wrapper, returning to flat domain JSON
- Phase 04 defaults to generating only 1 image per entry (no pre-generating alternates)
- Phase 05 Lipsync three-tier determination (<40% force seedance / 40-60% flexible / >=60% recommend lipsync)
- Phase 05 Step 0.5 MV style user gate

---

## 1.0.2 (gpt-image-2 character face-locking)

**Production failure**: All 6 keyframes had black hair, but Christine's reference image had silver-white hair -- the character was completely unlocked.

**Root cause** (two issues):

1. **Batch jobs-file field name error**: The agent wrote `"image-urls"` (hyphen) instead of `"image_urls"` (underscore) -> the field was silently ignored by schema -> ref was not passed to gpt-image-2 at all
2. **Prompt used vague references**: `"as the original portrait reference"` / `"Same face"` -> gpt-image-2 is an instruction-driven model and does not recognize such vague wording; it treated the ref as a style reference without locking identity

**Changes**:

- Batch JSON `params` field name footgun warning (**underscore + singular vs plural** varies by model)
- gpt-image-2 must use positional references like `"image 1"` / `"image 2"`
- Prompt must not describe character features (hair / skin color / age / specific clothing) -- these are inherited from img_url
- Multi-character segments must pass all character refs into the image_urls array

---

## 1.0.3 (Full flatten + ARK enforcement + anti-pushback)

**Production failure (3 issues)**:

1. Multi-keyframe interpolation within lipsync segments produced "melting" transitions -- seg_03 / seg_06 url=null total failure
2. seg_04 / seg_05 rejected by Byteplus ARK content moderation -- seedance requires `ark_asset_ids`, agent passed `image_urls`
3. GLM agent pushed back: "This is AI-generated, not a real person, no need to register"

**Root cause**:

1. dlai2v_pro multi-frame mode is **continuous interpolation**; cross-location / cross-framing will morph, not hard-cut
2. Seedance requires ARK for human-face refs; the agent did not know
3. GLM separated "AI-generated" and "real person" conceptually, but the ARK classifier does not distinguish

**Changes**:

- Full flatten architecture: shot becomes the sole rendering unit (**partially reverted in v1.0.6**)
- ARK conditional required: `kind == "character"` -> `ark_asset_id` schema if/then enforcement
- Phase 04/06 SOP binds "image generation + registration" as an inseparable two-step
- SKILL.md adds 4 anti-reasoning guardrails (explicitly listing 4 typical GLM pushback arguments: "AI-generated doesn't count / cartoon doesn't need it / location has no people / skip to save cost")
- Phase 08 CLI prioritizes `--ark-asset-ids` over `--image-urls`

---

## 1.0.4 (Trim precision + Drift check)

**Production failure**: Final cut had 2.22s cumulative drift; audio-video sync lost from seg_07 onward.

**Root cause**: Agent used `ffmpeg -c copy` for trimming (no re-encoding) -> can only snap at keyframes -> each segment drifts 0.02-0.5s -> 18 segments accumulate 2.22s. The 1.0.3 docs only said "trim to precise duration" without giving specific commands.

**Changes**:

- Phase 08 trim enforces `-c:v libx264` re-encoding (**`-c copy` is forbidden**)
- Post-trim must `ffprobe` verify actual duration (tolerance 0.05s)
- Phase 09 pre-concat cumulative drift hard check (sum(ffprobe) vs audio_duration > 0.1s -> STOP)
- Final cut spot-check must check mid-to-late segments (cumulative drift only manifests in later segments)

---

## 1.0.5 (gpt-image-2 vendor + hands)

**Production failure (2 issues)**:

1. Keyframe output was 2:3 portrait; the agent passed `width=1280 height=720` but it had no effect
2. Keyframes showed 6 fingers / reversed hands / extra hands / palms facing outward

**Root cause**:

1. Correct: **gpt-image-2 default `kieai_gpt_image2_vendor` ignores all size parameters**, inferring dimensions from prompt text
2. Wrong: I attributed it to "gpt-image-2 hand generation is unstable" -> defaulted to seedream-4.5 -- **wrong, reverted in v1.0.7**

**Changes** (partially correct, partially wrong):

- Correct: gpt-image-2 vendor enforcement rule: to control aspect, must pass `vendor=wavespeed_gpt_image2_vendor` + `aspect_ratio`
- Wrong: "Default to seedream-4.5 for hand-containing keyframes" routing -- deleted in v1.0.7
- Phase 06 QA adds aspect ratio check + 4-point hand check

---

## 1.0.6 (Hybrid architecture)

**Production failure**: After 1.0.3 full-flatten, a 3-minute MV required 35-65 keyframes; the agent took 5-8 hours to complete, completely missing Judy's 3-hour benchmark.

**Root cause**: Lipsync per-shot rendering is necessary (dlai2v_pro limitations + multi-frame instability), but **seedance per-shot is wasteful** -- seedance natively supports 5-15s segments + prompt-described internal multi-shot. Forcibly splitting into 2-5s shots doubles the call count.

**Changes**:

- Hybrid architecture: lipsync segments 3-8s (1 dlai2v_pro call + 1 keyframe per segment) / seedance segments 5-15s (1 call + 1 keyframe + prompt describes internal multi-shot per segment)
- Unified segment concept (**abolished shot nesting**)
- Slot rename: `shot_plan` -> `segment_plan` (reverting 1.0.3 rename)
- Keyframe pool minimized: only top-level unique pool remains
- Reuse rules reduced from 6 to 3
- **Lipsync keyframe MCU hard rule** (must be medium close-up, 3/4+ facing, mouth + eyes visible) -- addresses the root cause of dlai2v_pro drive failures
- `additional_keyframe_refs[]` field (optional multi-reference for non-lipsync) -- renamed to `additional_refs[]` in v1.0.7

---

## 1.0.7 (additional_refs refactor + understand-media + delete reuse hard rules + hand attribution correction)

**Production feedback**:

- additional_keyframe_refs field semantics were unclear -- could only store keyframe IDs, but seedance actually needs various ref types like character outfit / location
- Keyframe reuse rules were too rigid (<=4 + callback >=3) -- the agent should decide based on narrative
- v1.0.5's attribution of hand deformities to "gpt-image-2 model limitation" was wrong; the real cause was prompt over-description

**Changes**:

- `additional_keyframe_refs[]: string[]` -> `additional_refs[]: {role, ref_id}[]` (role in character / location / prop / keyframe)
- Phase 06/08 adds understand-media batch verification (4 images per batch) + marks needs_review
- Deleted keyframe reuse hard rules 2/3; retained the sole hard rule "adjacent lipsync segments must differ"
- Added `keyframe_callback_intent` field to record narrative reuse intent
- **Hand attribution correction**:
  - Reverted v1.0.5 "default to seedream-4.5 for hand-containing scenes" routing
  - Changed to prompt minimalism principle (trust ref / don't count fingers / no negations / don't write "anatomically correct")
  - Root cause: prompt over-description -> token conflicts -> erroneous fusion

---

## 1.0.8 (D/E/G'/H backlog completion)

**Backlog**: Work deferred from 1.0.7 (the user was rushing to test at the time).

**Changes**:

- D: Seedance prompt library expansion: section 2.5 audio reference disclaimer + section 2.6 transition vocabulary + section 2.7 multi-character techniques + section 2.8 MV example library
- E: Phase 05 narrative-first cutting + `segments[i].narrative_beat` field (linked to creative_proposal.narrative_arc)
- G': Phase 07 FINALIZE GATE changed to knowledge-video Card protocol
- H: `video_prep.references[].role` changed to enum + added `prop_asset`

---

## 1.0.9 / 1.0.10 (Phase 03 filter + unauthorized override + revert)

**Production failure**: Style library search returned all cartoon / anime results, completely mismatched with the dark realistic MV. The user asked "don't you know how to change the filter?", and only then did the agent discover `dl knowledge search --filters-file` was supported.

**Root cause**: Phase 03 PHASE.md contained outdated text saying "CLI does not support filter"; the agent followed it literally.

**1.0.9 changes**:

- Step 1 enforces type filter (`Realistic/Live` / `3D Render` / `Animation` / `Illustration`)
- Type mapping inferred from `creative_proposal.visual_style_hint`
- Aspect ratio recommendation required (cinematic -> 16:9 / TikTok -> 9:16)

**1.0.9 unauthorized override**: I unilaterally added "skip candidate display for low scores, go directly to out-of-library custom" -- violating the user's previously established hard rule of "always show 5+1 options".

**1.0.10 revert**: Restored "low scores -> split terms + change filter and re-search -> always display 5 candidates + 6th option for out-of-library custom. Agent is not allowed to skip candidate display."

---

## 1.0.11 (Lipsync ratio range-based)

**Production failure**: During narrative MV segment cutting, the agent spent excessive time thinking, getting stuck on the 40% target.

**Root cause**:

1. Display format induced precision optimization: `Lipsync ratio: 40.2% (target 40%, deviation +0.2%)` -> agent felt it "should be closer to 40.0%"
2. The +/-10% tolerance did not clearly state "pass = STOP"
3. The narrative 30% floor + lipsync target dual constraints caused repeated deliberation

**Changes**:

- `lipsync_target_ratio: number` -> `lipsync_target_range: [low, high]` (range replaces point value)
- Step 0.5 user selects range (30%-50% / 55%-75% / 75%-95% / custom)
- STOP rule: commit immediately the first time a result falls within range; hard limit of <=1 adjustment
- Display changed to `approx 40% (target range 30%-50%) check-mark within range`
- **Deleted 30% floor constraint**

---

## 1.0.12 (Seedance with characters + ARK must include character ref + Batch field footgun upgrade)

**Production failure**: When seedance used mid/long-shot keyframes (back view / small face / side view) without character outfit ref -> video character identity was completely unlocked.

**Root cause**: Phase 05 did not enforce `additional_refs[]` containing `{role: "character"}`. Phase 07 sub-agent relied on implicit inference to add character_asset, which was unreliable. When keyframe character recognizability is low, seedance cannot lock identity.

**Changes**:

- Phase 05 hard rule: non-lipsync segments containing characters **must explicitly** include `{role: "character", ref_id: "<look_id>"}` in additional_refs[], even if the keyframe already contains that character
- artifact_contract.cross_artifact hard rule synchronized
- SKILL.md non-negotiable adds this rule
- Lipsync batch JSON field name footgun **complete template added**: cli_translation.md section 4 previously only had seedance examples; added dlai2v_pro complete batch envelope example + correct/incorrect comparison table
- Cross-atomic-skill universal footgun rule elevated to SKILL.md non-negotiable

---

## 1.0.13 (Reverted v1.0.5-1.0.12 lipsync prompt wrong rules)

**Production failure**: Large number of lipsync segments had no lip movement / silent mouth (video generation succeeded + audio present but mouth did not move).

**Two misdiagnoses**:

1. I first guessed keyframe did not meet MCU -> user verified keyframes were fine
2. I then guessed batch field name error -> user said video came out with audio, parameters were passed correctly
3. **The user had already stated it was a prompt problem; I rejected this twice** -- assuming the agent followed my rules correctly

**Root cause**: My v1.0.5-1.0.12 `prompt_authoring.md section 1` lipsync rules were backwards:

- Wrong: I wrote: forbid camera movement, "dlai2v_pro IGNORES camera movement"
- Wrong: I wrote: forbid meta instructions (including "perfect lip synchronization")
- Wrong: I wrote: <= 2 sentences max

**Production-validated template** (provided by the user):

```
A person sings with perfect lip synchronization, swaying gently with the rhythm,
subtle head nods and tilts, slight shoulder roll, natural breathing motion,
high quality, natural lighting, slow dolly in
```

**Changes**:

- Template changed to 5-part structure: (1) `"A person sings/speaks with perfect lip synchronization"` required / (2) body motion 1-3 items / (3) `high quality` / (4) lighting tag / (5) camera movement at the end
- Length 2-4 sentences
- `with perfect lip synchronization` is an allowed meta exception
- Subtle camera movements (dolly in / push-in) now allowed
- Reverted "dlai2v_pro IGNORES camera movement" incorrect claim

---

## 1.0.14 (Seedance shot continuity + transition enforcement)

**Production failure**: Seedance intra-segment multi-shot transitions looked like sudden breaks; shot descriptions were identical to keyframes, causing the model to "repeatedly enforce the static image" during Shot 1 and then suddenly jump to Shot 2.

**Root cause**:

1. v1.0.8 D added sections 2.5-2.8 with transition vocabulary + MV examples, **but the main template in section 2 B did not enforce transitions** -- the agent copied the main template as-is
2. Shot descriptions identical to keyframe static images -> model "repeatedly enforces static image" during Shot 1 segment -> no motion

**Changes**:

- `Section 2 Template B` adds hard rule: seedance prompts with duration > 5s must include `At Ys: <transition>.` lines
- Shot description hard rule: write **action progression / camera movement / environment evolution**, **do not write static imagery that duplicates the keyframe**
- Before/after comparison (broken vs continuous) placed inline in the main template
- Phase 07 Step 2 QA adds transition + dynamic description hard check

---

## 1.0.18 (Deleted callback_intent + reuse suggestions)

**Production failure**: A narrative MV (lipsync 30-50%) after segment cutting showed "many repetitive similar keyframes + shots clustered together" -- v1.0.7/v1.0.8's `keyframe_callback_intent` field + "chorus should callback to the same keyframe" motif suggestion pushed the agent toward unnecessary reuse, which was counterproductive for scene-transitioning narratives.

**Root cause**:

- v1.0.7's `keyframe_callback_intent` field induced the agent to proactively reuse keyframes
- keyframe_count_rules.md's "theme motif allows multiple reuse" suggestion suited vocal-dominant MVs but was counterproductive for narrative MVs (each chorus should progress to a new scene)
- Identical `narrative_beat` names (e.g., `chorus_1.hit` vs `chorus_2.hit`) caused the agent to naturally lean toward reusing the same keyframe

**Changes**:

- **Deleted `keyframe_callback_intent` field** (segment_plan.schema.json)
- **Deleted all motif reuse suggestions** (keyframe_count_rules.md / Phase 06 PHASE.md / artifact_contract.json)
- Retained the sole hard rule: **adjacent lipsync segment keyframe_refs must differ**
- All other reuse decisions are entirely left to the agent based on song rhythm -- the skill provides no field guidance or suggestions

---

## Recurring Failure Patterns (Lessons Learned)

1. **Adding rules based on "it should theoretically work like X"** -> inconsistent with actual model behavior -> production failure (typical: v1.0.5 hand attribution / v1.0.13 lipsync prompt rules)
2. **Unauthorized decisions** (v1.0.9 unilaterally skipping candidate display / v1.0.13 repeatedly rejecting that prompts were the issue) -> wasted time with back-and-forth user clarification
3. **Changing rules without looking at real data** -- multiple rounds of guessing; should have had the agent paste the actual prompt + failed callback before judging
4. **Main template vs reference section disconnect** (v1.0.14: D added section 2.6 transition vocab but main template section 2.B did not enforce usage; agent copies the main template as-is)

## Handoff Advice

- **Do not add rules based on "it should theoretically"** -- only ship what has been production-validated
- **For any attribution of "agent didn't read document X"** -- first check whether the main template already covers that information; agents do not proactively look through reference sections
- **When production feedback = prompt problem** -- first look at the actual prompt the agent wrote + compare against the latest prompt_authoring.md; **do not immediately suspect batch fields / models / keyframes**
