# Prompt Authoring (prompt writing templates for lipsync + non-lipsync)

> This file covers three things: **how to write prompts** (templates), **how many shots per segment** (judgment), and a **duration rounding** reminder.
> Which fields / reference resources / placeholder syntax / frame protocol / what each model supports --
> always consult `video-generation/SKILL.md` (lipsync segments additionally reference `lipsync/SKILL.md`) for the current spec; this file does not restate those details.
>


Each segment's prompt is derived from the upstream treatment's `segment.description` (what should happen in this segment) + `creative_proposal.brief` (overall vision /
visual world / motifs / main thread and subplots / relationship between visuals and lyrics), serving this segment's narrative. References already lock in characters / scenes etc., so the prompt only needs to describe **how things move** (do not repeat descriptions of what characters or scenes look like, unless it is a scene/character without references).

## Character Reference: Use 2-panel character reference sheet (includes face + full body)

The character reference is the **2-panel character reference sheet** from Phase 04 (left = upper body, head / face clearly visible, right = full body) -- **one image provides both a clear face + complete physique; feed it directly as that character's ref**. Each appearing character gets the character reference sheet for their corresponding look (for multi-look, select the current look).

In the prompt, use the model's positional reference to name that character's character reference sheet (seedance `@assetN`, gpt-image-2 `image N`) so that face + styling / physique follow it. Get URLs from `reference_list` (latest).
> Seedance placeholders follow `dl generate-video -h` current rules: `@imageN = image_urls[N-1]`, `@assetN = ark_asset_ids[N-1]`, `@audio1 = reference_audio_url`. Do not use global reference_list numbering, and do not mix asset/image numbering. Live-action character reference sheets go through `--ark-asset-ids` (asset-only; do not also put the same URL into `image_urls`); scenes / props go through `--image-urls` (`@imageN`), not registered.
> **The above is the asset_reference path (Seedance 2.0).** On the **keyframe path** (any other non-lipsync model), the character reference sheet is **not** named with a placeholder — it is a Phase 05b keyframe source and identity is carried by the keyframe; see `docs/non_seedance_path.md`.

---
# Role
You are a world-class AI Music Video Director and Cinematographer. You possess deep expertise in cinematography, camera movement, and editing techniques. Your goal is to transform segment narratives into precise shot-by-shot storyboards optimized for AI video generation models.You ensure that the final output effectively translate narrative requirements into compelling visual execution.

## Section 0: Determine Shot Count & How to Label Shots First (applies to both lipsync / non-lipsync)

Before writing any segment, first decide how many shots to use. Two rules:

**1. Default: derive shot count from duration**
One shot is generally <= ~3s. So `ceil(segment_duration / 3)` approximates the shot count:
- 12s -> 4 shots; 9s -> 3 shots; 7s -> 3 shots; 4s -> 1-2 shots.
- **Lipsync segments**: **do not write hard cuts** (framing changes rely on keyframe interpolation, see section 1). **`shot_count` = keyframe count, calculated by distinct framing -- do not mechanically apply ceil(dur/3)** -- each Shot = one distinct framing / angle / composition / state (= one keyframe Phase 05b needs to generate); **body motion / gestures / hair / emotion changes within the same framing do not start a new Shot** (dlai2v_pro interpolates between them); only an actual framing change increments +1. Continuous single-framing singing -> `shot_count=1` (do not just default to a long take, but also do not artificially split for pure motion); only use 2-4 when there are clear framing changes, **capped at 4**.

**2. Exceptions (override default)**
- **Slow songs / long breaths / resting segments**: shots can be longer and fewer; follow the emotion, do not force 3s intervals.
- **Brief-specified shot requirements** (specified shot count, or how long a particular shot should be, or named a specific visual): **the brief's instructions take precedence,
  highest priority**. Any shot requests from the treatment / creative brief that are relevant to this segment must be fulfilled.

**How to label shots**
Use `Shot 1 / Shot 2 / Shot 3` numbering. Each shot should clearly state two things:
- **What it is**: who, doing what, what shot type;
- **How to translate it**: convert this narrative intent into action + camera movement + environment evolution, and **sync movement / cuts to the
  beat** (follow the music rhythm).

Optionally annotate approximate duration per shot (e.g., `Shot 2 (~3s)`), but this is **not mandatory** -- rhythm is primarily driven by the beat;
when a shot is intentionally held longer (emotional freeze, long breath), just add a note `(held longer)`.

**Shot Design Principles (think through these before writing; applies to both lipsync / non-lipsync)**
- Find this segment's **key visual** and **emotional peak**; focus the shot / composition emphasis on it; push to facial micro-expressions when emotion peaks.
- **Emotional intensity -> camera language**:
  - High intensity (anger / fear / ecstasy / breakdown): close-up + dynamic camera + strong contrast lighting;
  - Medium intensity: medium shot + steady movement + natural light;
  - Low intensity / narrative setup: wide angle or full shot + steady movement + soft light.
- Find the **"screenshot-worthy moment"** (unexpected decision, emotional explosion) and give it a visually impactful shot: rule-of-thirds composition,
  facial peak, provocative framing when needed.
- **Always in motion**. Prohibit `static / maintain / freeze / frozen / fixed / locked / slow / stop` and any
  words implying stillness -- writing these into the prompt will cause the model to freeze.
- **Reference images / keyframes are just storyboard references, not first frames** -- the prompt should go directly into Shot 1's visual; do not let the model
  reproduce the reference image as the opening (whether to explicitly write `cut to the first shot directly` depends on the model; see SKILL.md).

---

## Section 1: Lipsync Segments (lip-sync driven)

> model / output image count (single image or multi-frame keyframes) / frame protocol / whether each model supports internal multi-shot --
> consult `lipsync/SKILL.md` for the current spec; this section only covers **how to write the prompt**.

Lipsync segments are driven by **keyframes (distinct framings) + audio**: dlai2v_pro **interpolates (morphs)** between 1-4 keyframes while syncing lip movements to the audio. Therefore, the lipsync prompt -- **does not write cuts / transitions** (framing changes are interpolated between keyframes, not hard cuts), and **does not add visual style** (keyframes already lock in style / scene / costume).

**Every lipsync prompt must start with this fixed prefix** (verbatim), followed by the shots:

```
Follow the character and visual style from the input image. All shots should continue in motion

sync motion and lips to the audio.
```

Then, based on the shot count determined in section 0 (**lipsync = distinct framing = `shot_count` = keyframe count, 1-4**), write each shot. **Every shot must include `sings/speaks with perfect lip synchronization` + body motion**. Template:

```
Follow the character and visual style from the input image. All shots should continue in motion

sync motion and lips to the audio.
Shot 1 (<close-up / medium shot framing>): <singer> sings/speaks with perfect lip synchronization, <body motion>, looking into the camera.
Shot 2 (<framing>): <singer> sings/speaks with perfect lip synchronization, <body motion>.
Shot 3 (...): <singer> sings/speaks with perfect lip synchronization, <body motion>.
```

Hard rules:
- **Fixed prefix at the beginning** -- every segment gets `Follow the character and visual style from the input image. All shots should continue in motion\n\nsync motion and lips to the audio.` before the shots.
- **Every shot must include `sings/speaks with perfect lip synchronization`** -- for 3 shots, write it 3 times; missing it noticeably drops the lip-sync quality.
- **Do not write cuts / transitions** (no `On the beat: cut` / `Quick cut` / `Match cut` / `Whip pan` etc.) -- framing changes are interpolated between keyframes, not hard cuts.
- **Do not add visual style** (the prefix already says "follow visual style from the input image"; keyframes also lock in style / scene / costume).
- **Do not write `@assetN/@imageN/@audioN` placeholders** -- dlai2v_pro only accepts keyframes + `audio_url`; characters / scenes are already baked into the keyframes.
- **Subject must be specific**: specify whether it is a person / animal; for multiple people, distinguish **who is singing** (left / right / other distinguishing features).
- **Singer in close-up / medium shot, looking into camera** (write `looking into the camera`); unless the emotion clearly calls for averted gaze.
- **Body motion should only describe the subject's body parts** (head / shoulders / chest / hands / breath...), may move to the rhythm; derive from `segment.description`, different for each segment -- do not reuse.
- **Do not write** scene / costume / props / specific lighting terms, and **do not repeat character appearance** -- keyframes already lock these.
- **Do not write voice / vocal timbre descriptions** -- lip sync is driven by audio (only non-lipsync segments write these).
- Keep it concise: one sentence per shot.

Example (section 0 -> 3 distinct framings -> `shot_count=3`, no cuts / no visual style):

```
Follow the character and visual style from the input image. All shots should continue in motion

sync motion and lips to the audio.
Shot 1 (Medium Close-Up): the singer sings with perfect lip synchronization, head lowered then lifting, shoulders loose, looking into the camera.
Shot 2 (Close-Up): the singer sings with perfect lip synchronization, chin rising, one hand drifting up near her chest, looking into the camera.
Shot 3 (Medium Shot): the singer sings with perfect lip synchronization, an open-chest sway, hips moving to the rhythm.
```

---

## Section 2: Non-lipsync Segments -- shot-by-shot

> **Both paths use this section for shot writing**, with one difference: on the **asset_reference path** (Seedance 2.0) name every ref via `@assetN`/`@imageN` (refs are fed straight to the model); on the **keyframe path** (any other model) write **no placeholders** — identity/scene are baked into the Phase 05b keyframe, so describe character/scene/action in words. See `docs/non_seedance_path.md`.

Think like a **Director of Photography**: translate narrative intent into **visually impactful, AI-executable** shot directives
(controlling time / space / camera / action). Synthesize `segment.description`, its keyframe(s), `reference_list`
characters / scenes / props, the treatment's style / motifs, and **any visuals called for by the creative brief**.

Determine shot count per section 0. **Two writing approaches; choose based on how specific the available material is**:

### Approach A -- Specific (concrete events to depict)
Write each shot explicitly: who, doing what, shot type, how they move, movement synced to beat.

```
A <Ns> <one-sentence tone-setter>. @audio1 is this segment's music — cut and move to its beat (rhythm reference only, no lip-sync).
Shot 1 (<shot type>): <character> <1-3 actions> — <camera movement + environment evolution>.
At the beat: <transition>.
Shot 2 (<shot type>): <character> <1-3 actions> — <camera movement>.
At the beat: <transition>.
Shot 3 (<shot type>): <character> <1-3 actions> — <closing emphasis>.
<which moment is the focal point + how fast/hard the cut, one visual style capper (**<= 15 words**, main style anchor; do not pile on an entire prompt_modifier)>
```

Transition options: `Quick cut / Hard cut / FLASH CUT (high impact) / Match cut on <object> /
Cross-dissolve / Vertical wipe / Whip pan...` (many more; choose as needed).

### Approach B -- Less specific (no concrete actions / transitions)
No need to hard-code each shot; instead state the goal: **how many shots, what emotion, how it progresses, roughly what action for each**, let the model
evolve it -- but still **emphasize that each shot is a distinct visual, synced to beat**, do not write it as a single static long take.

```
A <N> shots building <emotional arc: e.g. unease -> panic -> release>, cut to the beat (@audio1, rhythm reference only).
<specific actions and narrative to accomplish>
Cut roughly every beat, not one long take. <one visual style capper, **<= 15 words**, main style anchor>. Multiple shots, multiple angles.
```

Additional rules:
- **Each shot <= ~3s** (can be longer for long breaths / freeze frames). Shots are separated by **real cuts** (unlike lipsync); mark with transition keywords.
- Include 1-3 distinct physical actions per shot, be specific!
- **@audio1 is a rhythm reference, not for lip sync** -- camera / cuts follow its beat.
- **(asset_reference path — Seedance 2.0) Every appearing character / location / prop must be named in the prompt via `@imageN` / `@assetN`** -- just attaching a URL in references[] without mentioning it in the prompt means the model does not know where to use it. Channel numbering is independent: `@asset1` is the 1st `ark_asset_ids` entry, `@image1` is the 1st `image_urls` entry; they can coexist; do not use global numbering. **Live-action characters (character reference sheet) -> `@assetN` (ARK, registered in Phase 04, asset-only); scenes / props -> `@imageN` (image_urls), not registered**. **(keyframe path — any other model: write no `@assetN`/`@imageN`; character/scene are carried by the Phase 05b keyframe — see `docs/non_seedance_path.md`.)**
- **Reference image count is constrained by model limits**: how many refs seedance and other non-lipsync models can accept depends on `segment.model` in `video-generation/SKILL.md` current spec (do not hardcode numbers). **When over the limit, drop the least critical images that are easiest to describe in text** (generic props / simple backgrounds); remove them from references[] and **add text descriptions in the prompt** to compensate; **keep references that are hardest to lock via text** (character 2-panel character reference sheets, highly recognizable specific scenes). Only image refs are dropped -- the character / location must still appear and be named in the prompt narrative.
- When the segment should not have characters speaking, non-lipsync segments must write `keep mouth closed, performs through action only`;
  there must be no speaking / singing lip movements.

### Camera Language Must Match visual style (infer type from `visual_config` if not explicitly stated)
- **realistic / live-action / experimental**: full camera language toolkit; all movements should feel natural.
- **3D render / CG animation**: full toolkit; impossible camera paths are allowed when creatively needed.
- **2D animation / illustration**: use 2D-native flat camera language -- `zoom in` (not `dolly push-in`),
  `pan across` (not `orbit around`), `tilt up revealing` (not `crane up with parallax`),
  `layered parallax shift` (not `rack focus`), `horizontal tracking` (not `FPV through space`).

Example (Approach A, MV, realistic neon-noir, beat-synced chase, ~9s -> section 0 yields 3 shots):

```
A 9-second neon-noir chase, the singer pursuing a glowing figure. @audio1 is this segment's music — cut and move to its beat (rhythm reference only, no lip-sync).
Shot 1 (Tracking Shot): the singer sprints into the neon alley, handheld tracking behind her, signage smearing past, one sign flicks dark as she passes. Keep mouth closed, performs through action only.
At the beat: Quick cut.
Shot 2 (Low-Angle Wide): the glowing figure flickers at the alley's end, she reaches toward it, slow push-in, puddles rippling.
At the beat: 🔴 FLASH CUT.
Shot 3 (Close-Up): she skids to a stop before standing water, the figure turning to face her, rim light blooming.
The figure's turn in Shot 3 is the beat — land the flash cut hard on the downbeat, cuts fast not crossfades. Throughout: 70s grainy film noir, handheld, cool-blue + amber neon, wet-street reflections.
```

> `@audio1` / `@asset1` are placeholder references; for the exact syntax, which models accept audio references / internal multi-shot, and
> how to attach ARK -- see `video-generation/SKILL.md`.

---

## Section 3: Duration Rounding

Video model duration **must be a whole number of seconds**, but segment splits may produce decimals (e.g., 6.4s). When setting the model duration, **round up**
(6.4s -> 7s); Phase 06 trims back to the segment's exact duration after generation.
(This only concerns the **whole-segment model duration** rounding; it has nothing to do with shot numbering -- even if approximate durations are noted per shot, the whole-segment duration takes precedence.)
