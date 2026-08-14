# Phase 03: Visual Config

## Goal

Produce `visual_config`: select `visual_style` (including `prompt_modifier`) + `aspect_ratio` + `resolution`.
`model_primary` was already selected in Phase 02; this phase infers `resolution` from the model's default resolution + aspect_ratio.

## Required Inputs

- `creative_proposal` (promoted)
- `ARTIFACT_CONTRACT_PATH`

## Preflight Reads

The first non-`read` action must not be `knowledge search` or `artifact write`. Read these first:

1. `schemas/visual_config.schema.json` (same skill root)
2. `phases/03-visual-config/templates/visual_config.minimum.json`
3. The absolute path to `search-visual-style/SKILL.md` from `<available_skills>` (must read before searching)

Only after reading all of these may you search or write `visual_config`.

## Step 1 — Style Library Search

Two things must be done correctly: **determine the type -> always include filter in every search**; **use short keywords for query, don't write sentences**.

**1. Infer type filter** (from the "Visual World & Aesthetic" section of `creative_proposal.brief` + `tone_mood`) -- only search the right direction, otherwise results drift toward cartoon/anime:

| Visual World contains | type filter |
|---|---|
| neo-noir / cinematic / realistic / photorealistic / film look / live-action / dark realistic | `"Realistic/Live"` |
| 3D / CGI / claymation / clay / render | `"3D Render"` |
| anime / cel-shaded / anime-style / animation | `"Animation"` |
| illustration / flat / comic / manga | `"Illustration"` |
| ambiguous / mixed styles | omit filter, review results first |

**2. Construct query**: from the "Visual World & Aesthetic" section of the brief + tone_mood, extract **4-6 comma-separated keywords** by dimension -- keywords only, no character names / plot details, < 250 characters:

- **Genre/Style**: cinematic / anime / 3D render / VHS / noir / minimalist ...
- **Lighting**: neon / natural light / hard shadows / soft focus / bioluminescent ...
- **Mood**: melancholic / energetic / eerie / dreamy / sterile ...
- **Colors**: pastel / high-contrast / monochrome / warm / cool blue ...
- **Narrative archetype (one word)**: romance / thriller / survival / revenge / coming-of-age ...

Example: `neo-noir cinematic, neon, melancholic, cool blue, high-contrast, revenge`

```bash
cat <<'EOF' | dl knowledge search --domain=visual_style \
  --query='<4-6 keywords>' --k=5 --filters-file=-
{"type":"Realistic/Live"}
EOF
```

Select the 5-8 most relevant candidates. **If candidates are off-target (e.g., should be realistic but returned a bunch of cartoon results) -> check whether the type filter is correct + switch to more specific keywords ("grainy 70s noir neon" > "dark"), and re-search**. Regardless of search results, line up at least 5 candidates + a "custom (off-library)" option as your option set; never collapse the option set down to a single forced pick before weighing alternatives.

## Step 2 — Select the Style (agent decides from its creative brief)

Line up the candidates in your own recommended order, then select the one that best fits your creative brief. **Do not reason in match-quality / similarity terms** (ignore scores; do not dismiss a result as "poor match / low similarity") -- judge by your own creative eye:

```
Visual style directions in play for this MV:

1) <style_name> -- <one-line description> [thumbnail]
2) ...
N) Custom (off-library) -- a custom style synthesized from the creative proposal

Selected: <the option the agent commits to>
```

- "Custom (off-library)" **must always remain in the option set**.
- If you select a library style -> use its `prompt_modifier`, and fill that style's preview image URL into `reference_image_urls`.
- If you select custom -> synthesize `prompt_modifier` from the brief's "Visual World & Aesthetic" section + tone_mood + visual_instructions; leave `reference_image_urls` empty.
- **Do not write `visual_config` until you have committed to a selection**.

## Step 3 — Determine aspect_ratio

Infer the default from the brief and commit to it -- **do not stall on "landscape or portrait?" without a decision**; resolve it from context:

| brief contains | default |
|---|---|
| cinematic / film noir / neo-noir / wide cinema / cinematic feel | **16:9** |
| TikTok / social / vertical / mobile-first / short-form video | **9:16** |
| concert / stage performance / live concert feel | **16:9** (9:16 is a viable alternative) |
| polaroid / instagram / square | **1:1** |
| other | **16:9**, with 9:16 / 1:1 as alternatives |

Reasoning to record: "Based on the creative vision (<inferred keywords>), the ratio is **<ratio>** (alternatives weighed: 9:16 / 1:1 / 21:9)." Commit the ratio from context; must not leave blank.

## Step 4 — Determine resolution + Write draft -> self-check -> Finalize (draft-first)

Determine `resolution`: from the default resolution of `creative_proposal.model_primary` (known from Phase 02 decision 3, or look up `video-generation/SKILL.md`) based on `aspect_ratio` (e.g., model default 720p + 16:9 -> `720p`, recorded as output resolution tier; pixel conversion is done downstream during generation).

First `dl artifact write` the visual_config as a draft (not promoted):

```bash
cat <<'EOF' | dl artifact write --slot=visual_config --content-type=application/json --contract='<ARTIFACT_CONTRACT_PATH>' --content-file=-
<visual config JSON: visual_style + aspect_ratio + resolution>
EOF
```

Read the draft's actual content back and self-check it (the selected style's `prompt_modifier` + `aspect_ratio` + `resolution`, all real values already written to disk; on pass, Phase 04 will generate character/location/prop references based on the brief). Confirm `prompt_modifier` is specific, `aspect_ratio` is a valid enum, and `resolution` is filled. If something is off -> go back to Steps 1-4 to adjust, then `dl artifact write` to overwrite the draft and re-verify. Only promote after the self-check passes:

```bash
dl artifact finalize --slot=visual_config --mode=verify_and_promote \
  --contract='<ARTIFACT_CONTRACT_PATH>'
```

## Operational Rules

- Load `search-visual-style/SKILL.md` first before `dl knowledge search`; search takes priority over custom synthesis.
- When weighing style candidates, **do not judge match quality / do not show scores / do not say "poor match"** -- line up the directions neutrally and select by creative eye.
- `visual_style` is an object: `prompt_modifier` (required) + `reference_image_urls` (optional).
- This phase writes `resolution` (inferred from model_primary default + aspect_ratio), but does not generate images / does not generate video -- Phase 04 is the first image-generation phase.
- artifact write / finalize must be top-level Bash calls; do not nest inside Python or shell glue.
- Do not claim `visual_config` has been written or verified until the artifact tool result confirms success.

## Do Not Proceed Unless

- The query was extracted from the brief's "Visual World & Aesthetic" section (not fabricated) and included a type filter; search was performed before custom synthesis.
- The agent has committed to a style from the candidates (including "Custom (off-library)"), and `aspect_ratio` has been determined.
- `visual_style.prompt_modifier` is specific; `aspect_ratio` is a valid enum value; `resolution` is filled.
- `visual_config` has been written + `dl artifact finalize --mode=verify_and_promote` succeeded.

## Output Slot

- `visual_config` (promoted)

## Next Phase Entry

After `visual_config` promote succeeds, read
`phases/04-reference-list/PHASE.md` from the same skill root.
