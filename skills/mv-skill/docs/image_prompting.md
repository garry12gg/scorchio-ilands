# Image / Video Prompting Guide

This guide only records mv-skill prompt rules that are not discoverable from CLI help. For current service selection, model flags, result shape, async behavior, and fallback details, inspect the runtime docs before calling:

```bash
dl generate-image --help
dl generate-image model -h
dl generate-image model gpt-image-2
dl generate-video --help
dl lipsync --help
```

Do not copy stale flag lists from this file. The CLI help is the source of truth for generation parameters.

## Global Rules

- Always inject `visual_config.visual_style.prompt_modifier` into image and video prompts. Adapt it to the asset, but do not collapse it into one or two keywords.
- Style anchors (directors, photographers, painters, film or studio names) stay verbatim — they read as visual shorthand and do not trip gpt-image-2's safety filter. Rewrite or drop only the words in the Safety Filter Risk Words table below.
- Do not invent URLs. Use only URLs from upstream artifacts or actual tool outputs.
- For image references, refer to each input by position: `image 1`, `image 2`, etc. Keep `image_urls` order aligned with the prompt.
- In Phase 05 video / lipsync prompts, do not redefine facial features, age, skin tone, or hair color. Identity is carried by refs and keyframes.
- Keep hand/action prompts simple. Write action intent, not anatomy: `reaching forward`, not finger counts or "anatomically correct" language.

## visual_style Format (gpt-image-2, 15-20 words)

Phase 03's `visual_style.prompt_modifier` follows a formula by style type, kept to 15-20 words, used directly by gpt-image-2:

- **Director style**: `[director + era + color attributes]: shot on [film stock], [lighting quality]`
  - Example: `David Lynch, 1977, desaturated cool blue with amber sodium-vapor accents: shot on 35mm film, low-key chiaroscuro`
- **Genre style** (no specific director): replace the director slot with a genre, emphasize atmosphere, still include era + film stock + lighting quality
  - Example: `neo-noir, 1980s, high-contrast teal and amber haze: shot on grainy 35mm, hard neon practical light`
- **Anime style**: `[work title]: [proportion description] + [style description]. [Character Style]: [genre-common facial features]`
  - Proportion description = character / drawing proportions (head-to-body ratio, realistic / stylized proportions), not aspect ratio
  - Example: `Studio Ghibli: near-realistic proportions + hand-painted watercolor backgrounds, soft cel-shading. Character Style: large round eyes, small nose, soft rounded jaw`

## Safety Filter Risk Words (gpt-image-2)

Avoid the following risk words and similar expressions; rewrite per the right column or remove:

| Risk word / combination | Alternative phrasing |
| --- | --- |
| `18-year-old` | `woman in her early twenties` / `young adult` |
| `young` + `female` + anime style | `woman in her early twenties` |
| `Horror` | Remove |
| `anatomy` | Remove |
| `realistic human` | Remove |
| `delicate` | `slender build` |

## Phase 04 Reference Images

Phase 04 creates the reusable `reference_list` library: character, location, and prop images. Before generation, read the relevant `dl generate-image` help topics and choose the current best service/flags there.

Asset-level prompt guidance:

| Asset | Required intent |
| --- | --- |
| character portrait | **Multi-look only** face anchor (img2img source for each look's character reference sheet; not fed to video gen). Chest-up, front-facing, neutral expression, plain light-gray / solid studio background, no props. Single-look characters get no portrait — just the character reference sheet. |
| character reference sheet | **Two-panel, side by side, thin neutral divider, identical person / outfit / lighting in both halves. LEFT: upper-body (chest-up), head & face clearly visible, front-facing. RIGHT: full-body, head-to-toe, neutral standing pose.** Use a clean plain light-gray / solid studio background, not a story location. Concrete wardrobe/materials/accessories; same identity/rendering style as the portrait ref (multi-look only). **Aspect `4:3`** (each half ≈ 2:3 — full-body fits on the right). This single image is the character reference downstream (face + body in one); no separate portrait is fed to video gen. |
| three-view | Only when needed. FRONT / SIDE / BACK, same outfit and proportions, neutral standing pose. |
| location | Empty scene, no characters, specific materials, physical light sources, permanent structures. |
| prop | Optional. Only for important props that repeat across multiple segments and need stable identity/materials. Isolated object, specific material/scale/finish, simple background, no characters. |

Phase 04 may use its gpt-image-2 vendor rule where that phase requires it; do not apply it to Phase 05b.

## Phase 05a Video Prompts

Use `phases/05a-video-prep/references/prompt_authoring.md` as the template source.

For lipsync segments:

- Model is always `dlai2v_pro`.
- Prompt should focus on singing/speaking performance and body motion.
- Include `with perfect lip synchronization`.
- Include MCU-or-closer framing intent when the prompt implies multiple keyframes.

For non-lipsync segments:

- Use segment narrative + brief + references to write dynamic video actions.
- For Seedance-like multi-shot prompts, include explicit shot timing and transitions when duration requires it.
- Do not use model placeholders unless the target model docs say to.

## Phase 05b Lipsync Keyframes

Phase 05b is special and is defined in `phases/05b-lipsync-keyframes/PHASE.md`.

Key rules:

- One independent sub-agent per lipsync segment.
- Use `dl generate-image --service=gpt-image-2`.
- Do not pass `--vendor`.
- Use the Phase 05b split helper in `--plan-only` mode. For `gpt-image-2`, pass its `generation_aspect_ratio` via `--aspect-ratio` plus `--image-size=2K`; do not use `--size` by default.
- Generate 1-4 keyframes only.
- For 2 keyframes: landscape/square target -> top/bottom; portrait target -> left/right.
- For 3 keyframes: use the helper layout; common 16:9 becomes a 1x3 vertical stack with `generation_aspect_ratio=9:16`.
- For 4 keyframes: 2x2 grid, ordered left to right, then top to bottom.
- Inject the helper's `panel_layout_description` into the prompt; it requires distinct panel key moments plus straight full-length black dividers so the split helper can crop by the real divider lines.
- Use black outer borders and black dividers in multi-panel grids so the helper can trim them.
- Forbid white borders, titles, panel numbers, explanatory text, watermarks, logos, and subtitles.
- Prompt must require visual style, identity, outfit, location, props, lighting, and material quality to match the provided reference images.
- Include every segment-scoped character, location, and prop source ref in `image_urls`; keep the order aligned with `image 1`, `image 2`, etc.
- Keep face and mouth centered with safe margins; the split helper may trim edges and cover-crop panels to the final video aspect ratio.

Every split keyframe must be lipsync-safe:

- Face clearly visible and recognizable
- Mouth visible
- No residual large black border, split-screen layout, collage text, panel number, watermark, severe blur, or broken face

## Camera Language

Use varied camera language across segments, but keep lipsync frames MCU-or-closer.

Useful terms:

- Distance: ECU, CU, MCU, MS, MLS, WS, EWS
- Angle: eye-level, low angle, high angle, dutch angle, over-the-shoulder, three-quarter profile
- Composition: centered, left third, right third, negative space, leading lines, frame within frame
- Motion: slow dolly push-in, slow dolly pull-back, slow pan, slow tilt, tracking shot, handheld drift, whip pan, match cut, smash cut
- Light: rim light, practical lights, low-key lighting, high-key lighting, chiaroscuro, volumetric light

Avoid static-output words in video prompts unless used as a camera term like `static medium shot`: `frozen`, `fixed`, `paused`, `still`, `rigid`, `locked`.

## Related Files

- `phases/05a-video-prep/references/prompt_authoring.md`
- `phases/05b-lipsync-keyframes/PHASE.md`
- `phases/06-video-production/references/cli_translation.md`
- `phases/04-reference-list/PHASE.md`
