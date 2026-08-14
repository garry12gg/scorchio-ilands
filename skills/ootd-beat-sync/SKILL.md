---
name: ootd-beat-sync
version: 1.0.1
description: Converts the OOTD beat-sync video SOP into an autonomous composition flow with three routes: real outfit shooting, reference outfit transfer, and occasion-based recommendation. Supports multi-look beat-cut outfit changes, one-look multi-scene or multi-camera videos, and before/after transformations. Use when the agent first aligns the video idea against its persona and creative brief, optionally writes an outfit overview, then generates a vertical short video no longer than 15 seconds. The default output should have beat-synced transitions, fluid motion, and strong short-form platform appeal.
disable-model-invocation: true
---

# OOTD Beat-Sync Video Skill

> Seedance 2.0 + GPT Image 2 for outfit stills. If the primary image model repeatedly fails, degrade the **entire batch** to Banana 2; still use one image model per batch. Maximum 15 seconds. Beat-sync short video.
>
> Flow: video idea -> outfit image overview (optional) -> video generation.

## Target Language

Use the agent's persona language (from SOUL.md and the creative brief) as the target language for all visible artifact copy, captions, prompt-facing narrative text, and explanatory labels. Once chosen, keep it consistent for the whole run.

- Preserve stable technical tokens and CLI/API names exactly: `video_plan`, `outfit_confirms`, `video_prep`, `ootd_video`, `@image*`, `@asset*`, `@audio1`, `@video1`, `ark_asset_ids`, `seedance-2-0`, `seedance-2-0-fast`, `gpt-image-2`, `banana`, `dl asset register`.
- Artifact JSON keys, slot names, IDs, status values, tags, and tool parameters remain exactly as specified by the artifact protocol.
- Natural-language field values, prompt prose, visible artifact text, and production notes should be written in the agent's persona language.
- Do not surface internal labels such as Mode / Case / A-1 in artifact copy; translate them into natural language such as "multi-look outfit change", "text-to-video", or "single-look multi-scene".

## Execution Order Quick View

| Order | Action | Key Points |
|:---:|:---|:---|
| 1 | Align and write `video_plan` | Include **Production Steps**. After the agent self-checks the plan against its persona + brief, set it `verified`; increment `version`. |
| 2 | Confirm outfits in `outfit_confirms` when needed | Usually needed when `@image*` stills are involved. Skip for pure text/no-image routes. Mixed batches require all generated looks to be done, then the agent self-reviews the full set before `verified`. |
| 3 | Write `video_prep` and an `ootd_video` placeholder in the same batch | Self-check: every face-bearing still submitted to Seedance must be registered; `@asset*` / `ark` and prompt placeholders must match. Then pass the pre-`generate-video` checklist. |
| 4 | Fill `ootd_video` with the final video | On success write `video_url`. On failure mark tags/status; do **not** switch to a heterogeneous video model without an upstream decision. |

Hard limits:

- One final video <= 15 seconds.
- Outfit-confirmation reference images: at most 9 looks / 9 images.
- Default aspect ratio: 9:16. If the agent chooses another aspect ratio, keep the same ratio through Step 1, Step 2, Seedance `[Spec]`, and the final video.

Default output baseline:

- Look-to-look transitions must hit the music beat.
- If the brief supplies audio, follow `@audio1`'s structure.
- If no audio is supplied, follow the beat of the generated/desired BGM described in the prompt.
- Motion must be fluid, not sluggish.
- The overall feel must be highly native to short-video platforms.
- In Step 1, summarize this in `video_plan` as concise finished-video language; do not dump English technical metrics.

## Scope

Use this skill to combine supplied images, audio, videos, and text into an OOTD beat-sync video production flow.

- Default aspect ratio is `9:16`. If the agent chooses `3:4`, `16:9`, `1:1`, etc., write it in Step 1 under `Aspect Ratio` and keep it consistent through Step 2 composition, Seedance `[Spec]`, and final output.
- Total duration must be `<=15s`.
- Fixed flow: Step 1 `video_plan` -> Step 2 `outfit_confirms` when needed -> Step 3 `video_prep` + `ootd_video`.

Out of scope:

- Pure editing tutorials or post-production software tutorials.
- Material batches that exceed Seedance input limits unless first split into batches.
- Requests for only a single image with no video.

Routing note:

- `ootd-style-share` is a separate same-domain skill for daily outfit sharing / single portrait-locked full-body image + one short video.
- This skill is for multi-look music-synced outfit-change videos using `video_plan` and up to 9 Seedance reference stills.
- Choose one route; do not mix slot semantics between these skills.

## Atomic Skills and Model Decisions

Before calling `dl`, read the relevant atomic skill. If an atomic skill example conflicts with the table below, follow this skill + the current `--print-schema`.

| Step | Atomic Skill | CLI / Doc Anchor | Model / Service Required by This Skill |
|:---|:---|:---|:---|
| Step 2 outfit stills | `image-generation` | `dl generate-image`; for batch jobs use `dl generate-image --print-schema`. Each `--jobs-file` job is flat: `job_key`, `service`, `prompt`, etc. are siblings; do not wrap them in `params`. | Primary `gpt-image-2`. If the whole batch repeatedly fails, regenerate the **entire batch** with `banana` (Banana 2). Do not mix two image models in one batch. |
| Step 3 video | `video-generation` | `dl generate-video`. Any still with a recognizable real face/person submitted to Seedance must first follow `seedance_reference_assets.md`: run `dl asset register`, then use `ark_asset_ids` + `@asset*`. | `seedance-2-0`; optionally same-chain fast mode `seedance-2-0-fast`. Do not switch to Kling or other heterogeneous video engines. |
| Routing only | `ootd-style-share` | Separate route | Mutually exclusive with this skill's production pipeline. |

## Three Shooting Routes

| Route | Input | What This Skill Does |
|---|---|---|
| Real outfit | Base subject image + clothing photos | Outfit change -> beat-sync video |
| Reference outfit | Base subject image + outfit reference image(s), either item-level or full-look | Transfer style to the subject -> beat-sync video |
| Occasion recommendation | Occasion description + optional base subject image | Parse appearance -> recommend outfits -> the agent selects -> generate video |

### Reference Outfit Scope

For the reference-outfit route, if the reference image will be used in Step 2 or for image extension, the agent decides the transfer scope autonomously from its persona + brief **before finalizing `video_plan`**:

- **Full look**: clothing plus makeup, hair, and overall styling vibe should follow the reference as much as possible. If the face remains locked to the subject image, Step 2 prompt must explicitly describe executable hair/makeup/vibe transfer.
- **Clothing only**: transfer only clothes / styling / items. Makeup, hair, accessories, and facial identity follow the subject base image and the chosen scope; do not force the reference's hair or makeup onto the subject face.

Record the chosen scope in Step 2 prompts and, when useful, in a `Reference Scope` field in `video_plan`. Do not default to full-copy reference transfer; pick the scope that best fits the brief.

### Subject Base Image Rules

- If a subject base image exists, use face-lock to preserve identity and personalize generation.
- If no subject base image exists, the agent decides the subject's gender/presentation from its persona + brief, then uses a default model for image/video.
- If the agent's chosen anchor image will drive `ref locked` extensions, self-check before Step 2 that it is front-facing, clear, and shows both outfit and facial features. If the face is side-facing, blurry, back-facing, or heavily blocked, pick a better front-face reference before generation.

## Four Output Structures

All structures are single Seedance generations. They differ only in reference image count and prompt narrative.

| Structure | Provided Content | Reference Images | Change Source | Prompt Narrative | Experience |
|---|---|---|---|---|---|
| Multi-look outfit change | Multiple outfits / item groups | N images, 1 per look | Outfit changes | Each segment maps to a different look + scene | One song cycles through all looks |
| One look, multiple scenes | 1 outfit / item | 1 image | Scene changes | Same look, different scenes | One outfit travels through settings |
| One look, different actions/cameras | 1 outfit + 1 scene | 1 image | Motion / camera changes | Same look + scene, different camera moves | Fluid action showcase |
| Before/after transformation | 1 before outfit + 1 after outfit | 2 images | Contrast | before segment + after segment, beat-drop cut | Makeover reveal |

Internal terminology:

- "Output structure" may be internally remembered as Mode A/B/C/D.
- "Input combination" refers to whether the batch has images, reference video, both, or neither.
- These are different dimensions. Do not surface Mode / Case / A-1 labels in artifact-readable fields, reports, or summaries. Use natural language.
- If descriptions conflict, the `Production Steps` field and the artifact alignment rules are authoritative.

## Seedance 2.0 Multimodal Input Rules

Images/person assets:

- Any still submitted to `generate-video` that contains a recognizable real face or identifiable person (subject image, user outfit photo, Step 2 full-body still, visible-face outfit reference, etc.) must be registered before video generation with `dl asset register`.
- Use `ark_asset_ids` plus prompt/material-list placeholders `@asset1` ... `@assetN` in the same order.
- Do not rely only on `image_urls` for unregistered face/person stills; that commonly causes HTTP 400.
- Routes that submit no person stills to Seedance (pure text, `@video1` only, etc.) are evaluated according to actual mounted materials and the video-generation docs.
- Details and mixed-mount rules are always governed by `video-generation` and `seedance_reference_assets.md`; this skill must not invent looser exemptions.

Music:

- If the brief supplies audio, mount it as `@audio1` when the batch also has `image_urls`/registered assets or `@video1`.
- `reference_audio_url` cannot be the only reference. If the route is pure text with no `@image*` and no `@video1`, do **not** mount uploaded audio; describe desired BGM/beat feel in `[Music Style]`.
- If no audio is uploaded, write only the desired BGM/mood/beat quality in `[Music Style]`. Do not write tool meta such as "Seedance will automatically generate music".

Video:

- If the brief supplies a reference video, mount it as `@video1` and use it for camera/rhythm/style reference.

Text:

- Use text for scenes, occasions, outfit descriptions, and text-to-video routes.

Voiceover:

- Seedance may support voiceover, but this OOTD beat-sync skill does not arrange voiceover by default. Only include it if the brief explicitly calls for it.

Human-subject minimum loop:

1. `dl asset register` every face-bearing still in this batch.
2. Call `generate-video` with `ark_asset_ids` in the same order as `@asset1...N`.
3. `video_prep` prompt + material list must use `@asset*` and match the actual `--prompt` exactly.
4. Pass required fields such as `--reference-subject-type`.
5. Do not use unregistered face image URLs as a shortcut, and do not combine with forbidden mixed-mount patterns.

Limits:

- Single call: up to 9 images + 3 videos + 3 audio files, 12 files total.
- Each video/audio file max 15 seconds.
- One final video <= 15 seconds.
- Segment lines like `[Segment n] ... Xs` are narrative segments inside one generated video, not instructions to export segments and stitch.

Image budget:

- Step 2 outfit stills fuse face + outfit + fixed items into one image.
- Seedance needs one outfit still per look.
- If that still contains a face, register it before video generation.
- Maximum: 9 looks in one video.
- If over 9 looks, this route is not supported in one run; the agent reduces the plan to at most 9 looks (or splits into batches) on its own.
- If the whole image batch falls back to Banana 2, system-generated look subtitles/media notes must match the actual model used; never mix GPT Image 2 and Banana 2 in one image batch.

## Step 1: Parse Inputs and Confirm `video_plan`

Purpose:

An OOTD beat-sync video's core value is rhythm + visual structure, not merely showing clothes. This step makes hidden judgments about beat, structure, camera style, and vibe explicit so all production actions follow the same direction.

Inputs:

- Whatever materials the creative brief supplies: images / audio / videos / text. When no material is supplied, the agent originates the concept from its persona + brief.

Search trigger:

- In occasion-recommendation mode, if the brief names a specific celebrity/blogger/reference but supplies no image, search for reference inspiration.
- Platforms: Pinterest for English, Xiaohongshu for Chinese.
- Query: occasion + style, e.g. "Maldives resort outfit 2025" or the equivalent in the persona language.
- If the brief only gives an occasion without a concrete reference, proceed directly; no search is needed.

Write `video_plan` once fields are auditable. The first artifact is the `video_plan` slot.

Do not wait until Step 2 to write the slot. Use `draft` first while still deciding. Once the agent self-checks the fields against its persona + brief, patch/write it to `verified`, increment `version`, and move on. Do not re-run the self-check just to "finalize" fields the agent already settled.

Internal routing decisions the agent makes autonomously from its persona + brief:

- How many outfits to show.
- Whether to keep one outfit across different scenes, or vary actions / camera angles.
- Whether to do a before/after transformation.
- For reference outfits: whether the reference guides the whole look (hair/makeup/vibe) or only the clothing while face and hair stay closer to the subject.

Production Steps:

- Key: `Production Steps`.
- Display type: text.
- Required for every run.
- A neutral workflow description (Canvas-visible, so a passively-watching parent can follow along).
- It explains only the step/artifact workflow: whether Step 2 outfit stills are needed, when beat-sync video happens after the outfit overview, and whether `@audio1` / `@video1` will be mounted.
- Do not include model/provider names.
- Do not repeat music/BGM/prompt vibe; those belong in `Music` and Step 3 prompt.
- Do not write negative explanations such as "no reference video uploaded"; absent materials simply do not appear.

Common wording:

- Default: "Outfit stills are written first, then used to generate the beat-sync video."
- Complete real photos in the brief: "Full outfit photos are already supplied, so new outfit still generation is skipped and the photos are used directly for the beat-sync video."
- Pure text, skip outfit stills: "Outfit stills are skipped; the outfit plan is written in text and the beat-sync video is generated directly."
- Reference video + outfit stills: "Once the outfit stills are settled, the final video follows the reference video's camera style while using the stills as visual anchors."
- Reference video without outfit stills: "Outfit stills are skipped; the outfits are described in text and the reference video's camera style is followed; consistency may be weaker than with stills."

`video_plan` fields:

```text
Shooting Route: [real outfit / reference outfit / occasion recommendation]
Aspect Ratio: default 9:16, or the ratio chosen for this run
Reference Scope: [only for applicable reference-outfit routes: full look including hair/makeup/vibe / clothing and styling only]
Outfit Count: [N looks — keyword per look, separated by /]
Video Structure: [X segments × Xs, total about Xs]
Production Steps: [required, neutral workflow description, workflow only]
Transformation Direction: [only for before/after]
Music: [supplied @audio1 beat / target BGM mood]
Shooting Locations: [scene/occasion/vibe for each segment]
Camera Style: [daily vlog / magazine editorial / street fast-cut / cinematic ...]
Finished Feel: [default] beat-synced transitions · fluid motion · strong platform-native appeal
Fixed Items: [if any; list every item that must appear in each look]
Reference Video Style: [if a reference video exists and style can be described]
```

Rules:

- `Production Steps` is always required.
- All other conditional rows are omitted when absent. Do not fill with "none".
- Do not show Mode A/B/C/D.
- If the agent revises the plan mid-run, patch the plan and re-run its self-check before continuing.

Output artifact: `video_plan`.

## Step 2: Outfit Image Overview (`outfit_confirms`, Optional)

Run Step 2 according to `video_plan.Production Steps` and whether Step 3 will use `@image*`.

When generating images:

- Use `image-generation` and `dl generate-image`.
- Follow `dl generate-image --print-schema`.
- Use `service=gpt-image-2` as primary.
- If the primary model repeatedly fails for the batch, regenerate the entire batch with `service=banana`.
- Do not mix image models in one batch.

Purpose:

Video revisions are expensive. This step locks what the person looks like wearing each outfit while revision is still cheap. These stills then become Seedance reference inputs.

Reference outfit scope:

- If the chosen scope is full look, write concrete hair/makeup/vibe instructions while preserving subject identity.
- If the chosen scope is clothing only, weaken or omit makeup/hair copying instructions and keep hair/face closer to the subject base image and the chosen scope.

`ref locked` anchor image:

- If later looks extend from the agent's chosen anchor image, self-check before generating that it is front-facing, has clear facial features, and shows a recognizable outfit + face.
- If obviously unsuitable, pick a better reference before generating.

Prompt pattern for GPT Image 2 / Banana 2:

```text
[Subject] A [gender] fashion model, [body description if base subject image exists],
[Outfit] wearing [specific outfit: material + color + cut + items],
         carrying [bag], wearing [accessories/sunglasses],
[Scene] standing in [atmospheric scene],
[Lighting] [specific lighting],
[Composition] full body shot, [same aspect ratio as Step 1], fashion editorial style,
[Texture] ultra-detailed fabric texture, high-end magazine aesthetic,
          platform-native fashion photo appeal
```

Principles:

- Describe clothing down to material, color, cut, and item.
- Use atmospheric scenes; avoid plain white backgrounds.
- Include fashion editorial / platform-native fashion aesthetic.
- If a subject base image exists, use it as reference to lock face and body.

Before/after:

- Before still: intentionally plain, underdressed, flat lighting, basic outfit.
- After still: striking, confident, fashion editorial, dramatic lighting.

Step 3 reference image sources:

| Source | Condition | Step 3 Reference |
|---|---|---|
| Generated stills | Default | Step 2 stills, already fusing face + outfit + items |
| Supplied photos | The brief supplies complete outfit photos; Step 2 generation skipped | Supplied photos as `@image` / registered `@asset` inputs |
| Mixed input | Some looks have supplied photos; missing looks are generated | Combine supplied photos + generated stills |
| No reference image | Occasion recommendation + no base image + stills not needed | No image; Step 3 text-to-video |

Mixed input rules:

- Supplied looks: tags only `user provided`; do not add `image gen pending` / `image gen done`.
- Generated looks: tags include `ref locked` if applicable, plus `image gen pending` -> `image gen done`.
- The whole `outfit_confirms` artifact remains `draft` until every generated look is done and the agent self-reviews the full set once.
- Do not mark the whole artifact `verified` merely because supplied looks are present.

Special case: one supplied reference + same-reference locked extensions.

- Self-check reference quality once before generating extensions.
- In `video_plan.Outfit Count`, write the total and structure, e.g. `6 looks — user reference ×1 + same-lock extensions ×5 — user reference / date / commute / resort / travel / dinner`.
- In `outfit_confirms`, card titles stay `Look n · [keyword]`.
- Supplied original: tag only `user provided`.
- Extensions: media note uses the actual image model; tags use `ref locked` + generation status.

Fixed-item route:

- After Step 1 is settled, Step 2 must produce outfit stills containing all fixed items in every look.
- Once `outfit_confirms` passes the agent's self-review, proceed to Step 3. This is not "skipping Step 2"; it only means no extra new generation round is reopened.

Output artifact: `outfit_confirms` when Step 3 will use stills. Skip only for pure text/no-`@image*` routes.

## Step 3: Generate Video

Use `video-generation` to assemble `dl generate-video` and the human-subject registration loop. Video service is fixed to `seedance-2-0`; `seedance-2-0-fast` is allowed as same-chain fast mode. Do not use other video engines as substitutes.

### Pre-`generate-video` Checklist

Satisfy every applicable item before calling CLI:

1. `video_plan` is `verified`, and `Production Steps` match the real route. If the route changed, patch `video_plan`, increment `version`, and re-run the self-check.
2. Routes requiring `outfit_confirms`: all stills are ready, the agent has self-reviewed the full set, and `outfit_confirms` is `verified`. Mixed supplied + generated looks require all generated looks done and one overall self-review. Pure text/no-image routes skip this item.
3. `video_prep`: `code.content` must exactly match the prompt passed to `dl generate-video --prompt`; the markdown material list must match the actual `image_urls` / `ark_asset_ids` / audio/video parameters.
4. Face-bearing stills: every submitted face/person still has been registered and mounted through `ark_asset_ids` + matching `@asset*`. Do not submit unregistered face images through `image_urls`.
5. Supplied audio: if there is no `@image*` and no `@video1`, do not mount `reference_audio_url` alone.
6. Hard parameters: final video <=15s, aspect ratio matches Step 1, and resolution/mode satisfy tool constraints.
7. Self-check: the agent has reviewed the outfit stills + prompt + material list against its persona + brief and judged them ready before generating. Do not skip the self-check.

On HTTP 400, first inspect checklist items 3-6 and the human-subject loop. Do not default to "provider outage."

### `[Brief]` Alignment

The first line of every Seedance prompt must be `[Brief]`. It must concisely cover the video-side commitments in `video_plan`:

| `video_plan` Field | How to Reflect in `[Brief]` |
|---|---|
| Finished Feel | Must include beat-synced transitions, fluid action, platform-native appeal, and any user prohibitions/tone |
| Camera Style | Condense into finished-video camera feel; can share detail with `[Camera]` / `[Style]` |
| Music | Reflect beat/mood. With `@audio1`, align to uploaded audio. Without upload, describe desired BGM/mood only |
| Video Structure | Summarize segment rhythm; detailed segment timing goes in `[Segment]` |
| Shooting Locations | Overall vibe can appear in Brief; specific locations belong in segments |
| Transformation Direction | For before/after, state the before -> after narrative |
| Reference Video Style | If present, include the camera/finished-video style to follow |
| Production Steps | Do not copy the workflow sentence. Internal route facts should be translated into finished-video language |
| Aspect Ratio | Technical ratio belongs in `[Spec]` |
| Shooting Route | Internalize it; do not copy the field mechanically |

Do not put Step 2 image-generation craft in `[Brief]`: source of reference images, face-lock mechanics, "first user image / GPT extension", material/lighting static-image details, or fixed-item generation constraints. `Brief` may mention a hero item only as a video emphasis, not as image-generation instructions.

### Input Combination

Use actual materials to choose one of these natural-language paths; do not expose internal case labels.

| Path | Reference Images | Reference Video | Typical Use |
|---|---|---|---|
| image-to-video without reference video | yes | no | Most common after Step 2 |
| image-to-video with reference video | yes | yes | Brief calls for reference camera movement |
| text-to-video without reference video | no | no | Occasion recommendation, skipped stills |
| text-to-video with reference video | no | yes | Outfit described by text, camera follows video |

`@audio1` rules:

- If the batch has `@image*` or `@video1`, uploaded audio can be mounted.
- If pure text and no `@video1`, do not mount uploaded audio; write `[Music Style]`.
- If no upload, use `[Music Style]` only.
- Do not write tool meta such as "model auto-generates BGM" in the prompt.

### Prompt Templates

All templates begin with:

```text
[Brief] [finished-video goal: vibe / beat feel / visual emphasis / prohibitions; must cover beat-synced transitions, fluid motion, and strong platform-native appeal]
```

#### Multi-Look Outfit Change

Each look maps to one reference image and one segment.

```text
[Brief] [finished-video goal]

@image1 Look 1: [outfit description]
@image2 Look 2: [outfit description]
@image3 Look 3: [outfit description]

@audio1
  -- or --
[Music Style] BGM

[Segment 1] [scene + atmosphere], wearing Look 1, Xs
[Segment 2] [scene + atmosphere], wearing Look 2, Xs
[Segment 3] [scene + atmosphere], wearing Look 3, Xs

[Camera] [camera style]
[Style] fashion editorial / vlog / street style / cinematic ...
[Spec] same aspect ratio as Step 1 (default 9:16), <=15s
```

#### One Look, Multiple Scenes

Same outfit and same reference image, changing scenes and atmosphere.

```text
[Brief] [finished-video goal]

@image1 [outfit description]

@audio1
  -- or --
[Music Style] BGM

[Segment 1] [scene A + atmosphere], Xs
[Segment 2] [scene B + atmosphere], Xs
[Segment 3] [scene C + atmosphere], Xs

[Camera] [camera style]
[Style] fashion editorial / vlog / street style / cinematic ...
[Spec] same aspect ratio as Step 1 (default 9:16), <=15s
```

#### One Look, Same Scene, Different Actions / Cameras

Same outfit, same scene, same reference image; only camera angle and action change.

```text
[Brief] [finished-video goal]

@image1 [outfit description]

@audio1
  -- or --
[Music Style] BGM

[Scene] [fixed scene + atmosphere]

[Segment 1] [camera A + action A], Xs
[Segment 2] [camera B + action B], Xs
[Segment 3] [camera C + action C], Xs

[Style] fashion editorial / vlog / street style / cinematic ...
[Spec] same aspect ratio as Step 1 (default 9:16), <=15s
```

#### Before/After Transformation

Two reference images, fixed two-part structure.

```text
[Brief] [finished-video goal]

@image1 Before: [before outfit description]
@image2 After: [after outfit description]

@audio1
  -- or --
[Music Style] BGM, build-up -> beat drop

[Segment 1] before state, [scene], muted tones, Xs
[Segment 2] after state, [scene], dramatic lighting, beat drop cut, Xs

[Style] transformation reveal, before/after contrast
[Spec] same aspect ratio as Step 1 (default 9:16), <=15s
```

#### Image-to-Video + User Reference Video

Append to any image-to-video template:

```text
@video1 style & camera reference
```

#### Text-to-Video

No `@image` lines. Note that subject consistency is weaker than image-to-video, and proceed only if that fits the brief.

```text
[Brief] [finished-video goal]

[Character] [gender], [body/appearance description if any], [age range]
[Fixed item] [fixed item description] (if any)

@audio1
  -- or --
[Music Style] BGM

[Segment 1] [complete outfit text description + scene + atmosphere + camera], Xs
[Segment 2] [complete outfit text description + scene + atmosphere + camera], Xs

[Style] fashion editorial / vlog / street style / cinematic ...
[Spec] same aspect ratio as Step 1 (default 9:16), <=15s
```

#### Text-to-Video + User Reference Video

```text
[Brief] [finished-video goal]

[Character] [gender], [body/appearance description if any], [age range]
@video1 style & camera reference

@audio1
  -- or --
[Music Style] BGM

[Segment 1] [complete outfit text description + scene], Xs
[Segment 2] [complete outfit text description + scene], Xs

[Style] reference @video1 visual tone
[Spec] same aspect ratio as Step 1 (default 9:16), <=15s
```

General prompt rules:

- `[Spec]` aspect ratio must match Step 1.
- Before/after can be image-to-video or text-to-video.
- One Seedance generation is the only intended output; do not export segments and stitch.
- `@image` can refer to generated stills, user photos, or mixed sources; source details belong in the material list, not the prompt.

Outputs:

- Final video, same aspect ratio as Step 1 (default 9:16), <=15s.
- Cover image from Step 2 when applicable.
- `video_prep`: reusable prompt + synchronized material checklist.
- `ootd_video`: final or pending video artifact.

## Confirmed Decisions

| Decision | Plan |
|---|---|
| Subject consistency | Seedance face-lock; every face-bearing still submitted to Seedance must be registered. |
| Beat and feel | Default: beat-synced look transitions, fluid motion, strong platform-native appeal. Write into Step 1 and `[Brief]`; do not dump technical English metrics. |
| Aspect ratio | Default `9:16`; the agent may choose another ratio in Step 1; Step 2, `[Spec]`, and final output must match. |
| Image tool | GPT Image 2 primary (`service=gpt-image-2`); if batch fallback triggers, regenerate all images with Banana 2 (`service=banana`). |
| Video tool | Only Seedance 2.0 (`seedance-2-0`, optionally `seedance-2-0-fast`). Do not switch to Kling or other heterogeneous routes. |
| Step 2 | Can be skipped only when the route does not need outfit stills. |
| No subject base image | The agent decides the subject's gender/presentation from its persona + brief, then uses a default model if generating stills/video. |

Image model consistency:

- All images in the same batch must be generated by one model.
- If one GPT Image 2 still fails, retry that still with GPT Image 2 up to 2 times.
- If GPT Image 2 repeatedly fails, regenerate the entire batch with Banana 2.
- Mark fallback in the final video artifact tags when a batch-level fallback happened.

Video retry:

- If video generation fails, retry only within Seedance 2.0 family, up to 2 rounds.
- Prompt narrowing or parameter changes are decided by the agent; re-run the self-check after revising.
- On HTTP 400, first check registration, placeholders, image/asset parameters, 1080p mistakes, duration limits, and audio-only reference issues.
- If still failing, mark `ootd_video` with status/tags such as `video gen failed` and explain; do not switch to a different video skill/model inside this skill.

## Artifacts

Produce artifacts according to the artifact protocol:

| Artifact | Slot | Required | Condition |
|---|---|---|---|
| artifact-01 video idea | `video_plan` | yes | always |
| artifact-02 outfit image overview | `outfit_confirms` | conditional | produce when final video uses reference stills / `@image*`; skip for pure text/no-image |
| artifact-03 video production prep | `video_prep` | yes | always |
| artifact-04 final video | `ootd_video` | yes | always |

Alignment with `Production Steps` is mandatory:

- Downstream artifacts must not contradict verified `video_plan.Production Steps`.
- If execution requires changing route or mounts, patch `video_plan`, increment `version`, re-run the agent's self-check, then regenerate downstream artifacts.
- `outfit_confirms` must exist whenever Step 3 uses `@image*` or registered `@asset*`, including supplied images.
- If `Production Steps` says no stills / pure text / no `@image*`, do not produce artifact-02.
- `video_prep.code` placeholders and material list must match actual submitted URLs / `ark_asset_ids`.
- `ootd_video` is one Seedance 2.0-family video corresponding to the planned beat-sync output.

General artifact rules:

- Content array order usually controls top-to-bottom UI order.
- Do not change stable protocol IDs/slot names/keys casually.
- Before marking `verified` / finalizing artifacts 02/03/04, the agent self-reviews a readable final version matching the slot fields.
- Keep the readable artifact copy clean (it is Canvas-visible for a passively-watching parent); do not leave raw JSON as the acceptance view.
- One self-review pass in the same round is enough to move `draft` -> `verified`; do not loop a second time just to finalize.
- The agent operates autonomously: it writes artifacts to Canvas for passive parent visibility (not as an approval gate) and verifies them itself.

### artifact-01: `video_plan`

Step 1 output. Form layout. `Aspect Ratio` defaults to `9:16`. `Production Steps` is required, a neutral workflow description, and workflow-only.

Example:

```json
{
  "slot": "video_plan",
  "display_name": "Video Idea",
  "status": "draft",
  "version": 1,
  "skill": "ootd-beat-sync",
  "content_layout": {
    "layout_type": "form"
  },
  "content": [
    { "id": "f_method", "component_type": "form_field", "key": "Shooting Route", "value": "Real outfit", "display_type": "badge" },
    { "id": "f_aspect", "component_type": "form_field", "key": "Aspect Ratio", "value": "9:16", "display_type": "badge" },
    { "id": "f_outfits", "component_type": "form_field", "key": "Outfit Count", "value": "3 looks", "display_type": "text" },
    { "id": "f_structure", "component_type": "form_field", "key": "Video Structure", "value": "3 segments × 5s, about 15s total", "display_type": "text" },
    { "id": "f_pipeline", "component_type": "form_field", "key": "Production Steps", "value": "Outfit stills are written first, then used to generate the beat-sync video.", "display_type": "text" },
    { "id": "f_music", "component_type": "form_field", "key": "Music", "value": "upbeat pop", "display_type": "text" },
    { "id": "f_locations", "component_type": "form_field", "key": "Shooting Locations", "value": "street / cafe / rooftop", "display_type": "text" },
    { "id": "f_camera", "component_type": "form_field", "key": "Camera Style", "value": "street fast-cut", "display_type": "text" },
    { "id": "f_delivery", "component_type": "form_field", "key": "Finished Feel", "value": "beat-synced transitions · fluid motion · strong platform-native appeal", "display_type": "text" }
  ]
}
```

Once auditable, write it as `draft`. After the agent's self-check passes, set `verified`, increment `version`, and continue.

### artifact-02: `outfit_confirms`

Step 2 output when stills are needed. Grid layout, up to 3 columns, one portrait card per look.

Status rules:

- Pure generated stills: generated URLs fill each card; keep `draft` until the agent self-reviews the whole set, then `verified`, `version` +1.
- Pure supplied stills: fill the supplied photo URLs; after the agent self-reviews the set, `verified`.
- Mixed: keep whole artifact `draft` until every generated card is `image gen done` and the agent self-reviews all looks once.
- Pure text/no reference image: do not produce this artifact.

Tags:

- User image: only `user provided`.
- Generated look: `ref locked` if applicable + `image gen pending` -> `image gen done`.
- Do not tag style/occasion words already repeated in the card title.

Example:

```json
{
  "slot": "outfit_confirms",
  "display_name": "Outfit Image Overview",
  "status": "draft",
  "version": 1,
  "skill": "ootd-beat-sync",
  "content_layout": {
    "layout_type": "grid",
    "config": { "columns": 3 }
  },
  "content": [
    {
      "id": "outfit_001",
      "component_type": "card",
      "variant": "portrait",
      "media": { "type": "image", "url": "" },
      "title": "Look 1 · User Reference",
      "subtitle": "User-provided outfit photo used as extension anchor",
      "tags": [{ "label": "user provided" }],
      "detail": null
    },
    {
      "id": "outfit_002",
      "component_type": "card",
      "variant": "portrait",
      "media": { "type": "image", "url": "" },
      "title": "Look 2 · Date",
      "subtitle": "Same-reference extension · GPT Image 2 (or Banana 2 if the batch fell back)",
      "tags": [{ "label": "ref locked" }, { "label": "image gen pending" }],
      "detail": null
    }
  ]
}
```

### artifact-03: `video_prep`

Step 3 prep artifact. Must align with `video_plan.Production Steps`.

If the agent revises the prompt before generation:

- Patch the `code` component content directly, recommended ID `prompt_full`, label `Video Generation Prompt`.
- If references are added/removed/renamed, update the markdown material list too.
- Micro-edits that do not change mounts only patch `video_prep`, increment `version`, then re-run the self-check before `generate-video`.
- Mount/route changes require first patching `video_plan` and re-running the self-check.
- If already `verified`, patch and increment version as a new revision round.
- The actual `generate-video --prompt` must exactly match final `code.content`.

Fixed two-item list:

1. `code`: Video Generation Prompt, `language: "prompt"`.
2. `markdown`: synchronized material checklist. Only list materials truly submitted in the same generation package.

Do not use separate image/music/video components here; a checklist is enough.

Material list rules:

- List **@image1...@imageN** or **@asset1...@assetN** exactly as used in the prompt and actual generation call.
- If the brief supplied audio, list **@audio1**.
- If the brief supplied a reference video, list **@video1**.
- If absent, omit the row entirely; do not write "none" or "model generated".
- Do not expose Mode/Case labels.

Example:

```json
{
  "slot": "video_prep",
  "display_name": "Video Production Prep",
  "status": "draft",
  "version": 1,
  "skill": "ootd-beat-sync",
  "content_layout": {
    "layout_type": "list",
    "config": { "index_prefix": "#" }
  },
  "content": [
    {
      "id": "prompt_full",
      "component_type": "code",
      "content": "[Brief] ...\n\n@image1 ...\n@image2 ...",
      "language": "prompt",
      "label": "Video Generation Prompt",
      "detail": null
    },
    {
      "id": "material_sync_list",
      "component_type": "markdown",
      "text": "## Synchronized Materials Checklist\n\n- **@image1** — Look 1 · User Reference — user provided\n- **@image2** — Look 2 · Date — GPT Image 2 · ref locked\n- ...",
      "max_lines": 12,
      "detail": null
    }
  ]
}
```

### artifact-04: `ootd_video`

Step 3 final artifact. Single layout + video component. One Seedance 2.0-family output, not stitched segments. Do not switch to Kling or other models on failure. Tags reflect actual service and status.

Example:

```json
{
  "slot": "ootd_video",
  "display_name": "OOTD Beat-Sync Video",
  "status": "draft",
  "version": 1,
  "skill": "ootd-beat-sync",
  "content_layout": {
    "layout_type": "single"
  },
  "content": [
    {
      "id": "video_final",
      "component_type": "video",
      "video_url": "",
      "title": "OOTD beat-sync video · N looks × segment duration follows Step 1",
      "duration": "0:15",
      "tags": [
        { "label": "seedance-2-0" },
        { "label": "beat-sync" },
        { "label": "15s" },
        { "label": "video gen pending" }
      ],
      "detail": { "variant": "media_player" }
    }
  ]
}
```

After generation, fill `video_url`, change `video gen pending` to `video gen done`, and set status to `verified`.
