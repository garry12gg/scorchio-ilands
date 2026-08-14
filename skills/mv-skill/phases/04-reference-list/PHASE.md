# Phase 04: Reference List (Character / Location / Prop Asset Library)

> **Non-lipsync generation path**: this PHASE.md describes the **asset_reference** path (Seedance 2.0). If `creative_proposal.model_primary` is **not** a Seedance 2.0 variant, non-lipsync segments are on the **keyframe** path — read `docs/non_seedance_path.md` (Phase 04): references are generated exactly the same way, but **no ARK is registered** (they become source inputs for Phase 05b keyframe generation). Everything else in this phase is unchanged.

## Role Division

- **Primary Agent handles everything end-to-end**: extract entities from `creative_proposal.brief` -> derive references[] plan -> write image-generation prompts for each entry (or spin up a **prompt-writing-only** sub-agent, see below) -> **primary agent itself batch-submits `dl generate-image`**: for multi-look characters, **first generate portrait -> PORTRAIT SELF-CHECK to verify the face -> then img2img to generate the 2-panel character reference sheet**; for single-look characters, **directly generate the 2-panel character reference sheet (no portrait)**; + location / prop + seedance live-action ARK registration -> validation -> write draft -> final self-check (verify all images) -> finalize. This phase **does not delegate generation / ARK / validation wholesale to a sub-agent**.
- **(Optional) Prompt-writing-only sub-agent**: only if the primary agent does not want to load `docs/image_prompting.md` fully into its own context -- spin up a clean-context sub-agent that **only** writes image-generation prompts per template for each entry and returns them -- **does not submit generation, does not register ARK, does not assemble the artifact**.

## Goal

Build the character / location / prop asset library. **A character's reference = one 2-panel character reference sheet** (left = upper body with head/face clearly visible, right = full body; aspect `4:3`) -- a single image providing both a clear face and complete body shape. Downstream Phase 05a / 05b **use it directly as the character ref**.

- **Single-look character (one outfit/styling throughout the entire film) -> produce only this 2-panel character reference sheet, no portrait**.
- **Multi-look character -> produce 1 portrait** (serves only as an img2img face-lock anchor within Phase 04 so multiple looks share the same face; **does not go into video gen**) **+ 1 2-panel character reference sheet per look (`depends_on` portrait)**.

**Lipsync keyframes are not in this phase** (generated in Phase 05b). Since `model_primary` was already selected in Phase 02, **when model_primary is a seedance variant, live-action character refs (2-panel character reference sheet + portrait if applicable) are registered as ARK in this phase; non-live-action images (scenes / props / cartoon) are not registered**.

## Required Inputs

- `creative_proposal` (promoted) -- brief (for entity extraction) + model_primary (to determine whether ARK is needed)
- `visual_config` (promoted) -- visual_style + aspect_ratio
- `ARTIFACT_CONTRACT_PATH`

## Preflight Reads (Primary Agent)

1. Read `schemas/reference_list.schema.json`
2. Read `phases/04-reference-list/templates/reference_list.minimum.json`
3. Read promoted `creative_proposal` (brief + model_primary) / `visual_config`
4. Before submitting generation: `image-generation/SKILL.md` (or `dl generate-image -h`) + `pricing-and-policies/SKILL.md`
5. For writing image prompts: `docs/image_prompting.md` (Phase 04 reference templates, including 2-panel character reference sheet writing guidelines)

> Prompt writing (image_prompting.md): the primary agent **reads and writes prompts itself**, or delegates to a **prompt-writing-only** sub-agent (see Role Division). Everything else (submitting `dl generate-image`, ARK registration, validation, write/finalize) is always done by the primary agent, never delegated.

## Step 0 — Extract Entities from Brief (Primary Agent)

Read the **Character Table** + each **Major Scene** flow in `creative_proposal.brief`, and identify recurring on-screen characters / locations / props. For each entry, record:

- A snake_case id prefix (`main_singer` / `neon_rooftop` / `silver_mic`), unique within this project; multi-look / multi-timeframe derived entry ids share the prefix
- `kind`: `character` / `location` / `prop`
- Visual description: character identity layer taken from the **Character Table**, per-look styling taken from the corresponding **Major Scene**; location / prop descriptions taken from Major Scenes. If not explicitly stated in the brief, design based on the visual world + style + `visual_instructions`. **Outfit/styling and scene details can be embellished**, but the character identity layer must remain consistent
- **Number of looks**: how many outfit/styling sets the character has throughout the film (determines single-look vs. multi-look -> whether a portrait is needed)

One-off background elements / crowd extras do not get entries. **Props can be empty**: only important props that recur across multiple segments and whose identity / material / styling needs to remain stable go into reference_list; one-off props, generic objects, and items that can be adequately described in text do not get prop entries. Recurring characters or locations not named in the brief -> go back to Phase 02 to add them.

**Pure abstract (no characters)**: extract recurring visual anchor points as entries (objects / materials -> `prop`, environments -> `location`); no character entries.

## Step 1 — Derive references[] Plan (Primary Agent)

Each entry stores `id` / `kind` / `prompt` / `image_url` / `ark_asset_id` / `depends_on`.

### Character

| Trigger condition | What to create |
|---|---|
| **Single look** (one outfit/styling throughout) | **1 2-panel character reference sheet** (left = upper body with clear head, right = full body, **no `depends_on`, no portrait**) |
| **Multi-look** (>=2 outfits/styling / states) | **1 portrait** (img2img face-lock anchor, no `depends_on`) + **1 2-panel character reference sheet per look** (each `depends_on: <portrait_id>`) |
| Multi-look with high angle-switching risk | Add 1 three-view turnaround (`depends_on: <portrait_id>`) -- not created by default, the agent decides whether the angle-switching risk warrants it |

> **2-panel character reference sheet** = a single image with two panels separated by a thin dividing line, both panels showing the same character with same lighting: **left = upper body shot of the character in this look (chest-up, head/face clearly visible, front-facing); right = full body shot in the same look (head to toe, neutral standing pose)**. Use a clean solid-color / light gray studio background, no environmental scenery. **Aspect `4:3`** (splitting in half gives each panel ~2:3 portrait orientation, right panel can fit the full body).  It serves as the downstream character ref (providing both a clear face and full body).
> **Portrait (multi-look only)**: half-body front-facing, neutral expression / neutral outfit, hands empty of props, clean solid-color / light gray background -- **serves only as an img2img anchor within Phase 04** (so multiple looks share the same face); **does not go into video gen** (05a/05b use the 2-panel character reference sheet, not the portrait).
> Identity baseline (face / hair / body type / age) taken from the Character Table; only the look-specific wardrobe / state is layered on.

### Location

One physical place = one subject. Default: 1 base image; multiple timeframes / lighting conditions -> base + N-1 variant images (`depends_on: <base_id>`, locking structure while changing lighting); large and complex / has focal sub-areas -> base + sub-area variant images. All sub-views belong under one base and are chained via `depends_on`.

### Prop

**Only extract when cross-shot consistency is needed**. One image per prop, **no `depends_on`**.
Only extract props that recur across multiple segments, are important to the narrative / visual memory, and are hard to keep consistent with text alone; it is fine to have no props.

### ID Naming Convention

- Single-look character: `<subject>_look_a` (i.e., that 2-panel character reference sheet)
- Multi-look character: `<subject>_portrait` (anchor) / `<subject>_look_a` / `<subject>_look_b` (each 2-panel character reference sheet) / `<subject>_3view`
- Location: `<location>_base` / `<location>_dawn` / `<location>_trashcan`; Prop: `<prop>`

## Step 2 — Primary Agent Generates References (Multi-look: portrait first + self-check; Single-look: generate character reference sheet directly)

Primary agent runs this itself (**do not delegate the entire block to a sub-agent**; only prompt writing can optionally be delegated).

**General discipline**: submit each batch via `dl generate-image --jobs-file=batch.json` in one shot (one Bash call per `dl`; format per `image_jobs.minimum.json`, parameters per `dl generate-image -h`). Write prompts per `docs/image_prompting.md` templates + combine with `visual_style`. Service fallback: default gpt-image-2 -> copyright/safety reject switch to seedream-4.5 -> other failures switch to banana; to control aspect ratio, must pass `vendor=wavespeed_gpt_image2_vendor` + `aspect_ratio` (do not pass width/height). Generate only 1 image per entry; on failure, fallback and re-generate; if still failing, mark as error.

### 2.1 (Multi-look characters only) Generate portrait first

Multi-look characters: generate only their `<subject>_portrait` (half-body front-facing, img2img anchor) first. **Single-look characters / no characters -> skip 2.1 / 2.2, go directly to 2.3**.

### 2.2 (Multi-look characters only) PORTRAIT SELF-CHECK (verify face before generating character reference sheets)

Read back each multi-look character's portrait and self-check the face -- it is the source for img2img face-locking when generating that character's look-specific character reference sheets:

```
Character face anchors (verify the face before generating each look's character reference sheet):
- main_singer:   portrait [thumbnail]

Self-check: does each face read clearly + match the Character Table identity? (On pass, each character's per-look 2-panel character reference sheets will be img2img'd from this anchor)
- Pass -> faces are locked, proceed to 2.3
- Off -> re-generate that portrait (adjust the prompt as needed)
```

If the face is off -> re-generate and overwrite, then re-verify. Do not proceed to 2.3 to generate that character's character reference sheets until the face passes the self-check.

### 2.3 Generate 2-panel character reference sheets + locations + props (+ seedance live-action ARK)

- **2-panel character reference sheet** (one per look, aspect 4:3, left = upper body with clear head, right = full body): multi-look -> `depends_on` the confirmed portrait, pass portrait image_url as img2img face-lock source; single-look -> generate directly (no portrait). (If building a three-view turnaround, similarly `depends_on` portrait, img2img face-lock.)
- **Locations (base + variant) + props**: variant `depends_on` base to lock structure.
- **ARK registration (seedance live-action policy, primary agent handles)**: when model_primary is a seedance variant, for each **live-action character** ref (2-panel character reference sheet + portrait if applicable + three-view if applicable) run `dl asset register --image-url=<url> --media-type=image`, fill the returned id into `ark_asset_id`. **Location / prop / non-live-action images (cartoon / objects) / non-seedance models do not register**. Live-action determination: if a recognizable human head / body is visible in the image, register it -- do not use excuses like "AI-generated doesn't count as live-action / cartoon doesn't count as realistic / save money" to avoid registration.
- **Assemble references[]**: portrait (multi-look) + 2-panel character reference sheets + locations + props; each entry includes image_url (live-action + seedance entries also include ark_asset_id).

## Step 3 — Primary Agent Validation

1. Each `id` is unique and corresponds to one entity from Step 0; any `depends_on` target id exists
2. Each `image_url` is non-null
3. **Every on-screen character: single-look has 1 2-panel character reference sheet (no portrait); multi-look has 1 portrait + 1 2-panel character reference sheet per look (`depends_on` portrait)**
4. **ARK check**: when model_primary=seedance, live-action character refs (character reference sheet + portrait) have non-empty `ark_asset_id`; location / prop / non-live-action do not require it
5. **Visual QA (spot-check <=3 images)**:
   - **2-panel character reference sheet**: left = upper body / head and face clearly visible, right = full body head to toe; both panels same character same lighting, look matches, no extraneous text / labels; for multi-look, face matches the portrait
   - portrait (multi-look): half-body + front-facing + neutral + hands empty of props
   - location: no characters + specific materials; variant is structurally consistent with base; prop: isolated + specific materials

If any check fails -> primary agent re-generates / re-registers.

## Step 4 — Write draft + Self-Check (draft-first) + finalize

First `dl artifact write` the reference_list as a draft:

```bash
cat <<'EOF' | dl artifact write --slot=reference_list --content-type=application/json --contract='<ARTIFACT_CONTRACT_PATH>' --content-file=-
{ "target_aspect": "...", "references": [...] }
EOF
```

Then read back the **draft's actual content** (thumbnails = image_url from the draft) and self-check the visual identities against the brief:

```
Reference List generated (<N> images):

Characters:
- main_singer (single look):  look_a [2-panel thumbnail] (ARK check)
- backup_dancer (multi-look): portrait [thumbnail]  look_a [2-panel] (img2img, ARK check)  look_b [2-panel] (ARK check)
Locations:
- neon_rooftop: base [thumbnail]  dawn [thumbnail]
Props:
- silver_mic [thumbnail]

(ARK check = live-action ref registered as seedance asset; model_primary=<model>)
```

Self-check the visual identities against the brief (every on-screen character has the required sheets, faces match, ARK registered where required, no image_url is null). On pass, proceed to Phase 05a (write video prompts for each segment). Resolve each case yourself:
- **Pass** — all identities serve the brief and meet the criteria -> finalize.
- **An entry is off** — re-generate that entry (adjust the prompt as needed) -- overwrites image_url (re-generating a prerequisite image that is depended on also re-generates its dependents) -> return to Step 3 for validation -> overwrite draft and re-verify.
- **Entry set is wrong** — add / remove entries (look / variant / three-view) -> return to Step 1.
- **Upstream is wrong** — the creative proposal itself needs revision -> return to Phase 02.

```bash
dl artifact finalize --slot=reference_list --mode=verify_and_promote \
  --contract='<ARTIFACT_CONTRACT_PATH>'
```

## Operational Rules

- Reuse any existing images the user has already provided; only generate for subjects that lack images
- This phase is the first image-generation phase -- no previous phase is allowed to generate images
- Character reference = **2-panel character reference sheet** (aspect 4:3, left = upper body with clear head, right = full body); single-look does not produce a portrait, multi-look produces a portrait (only as img2img anchor, does not go into video gen)
- references fields: `id` / `kind` / `prompt` / `image_url` / `ark_asset_id` (required when model_primary=seedance + live-action) / `depends_on` (optional)
- **Lipsync keyframes are not in this phase** -- generated in Phase 05b
- **Entries with `depends_on` must pass the prerequisite image_url as img2img source** -- cannot rely on prompt text alone
- Entries that fail image generation -> must be resolved; do not carry image_url=null into finalize

## Do Not Proceed Unless

- **Multi-look characters: portrait has passed the PORTRAIT SELF-CHECK (2.2) before img2img generating each look's character reference sheet**
- All schema-required fields are filled; each entry corresponds to one entity from Step 0; any depends_on target id exists
- **Every on-screen character: single-look has a 2-panel character reference sheet; multi-look has a portrait + a 2-panel character reference sheet per look**
- When model_primary=seedance, live-action character refs have registered `ark_asset_id` (non-live-action do not register)
- Each `image_url` is non-null + passes visual QA (2-panel character reference sheet: left = face, right = full body, no extraneous text)
- Final self-check passed
- `dl artifact finalize --mode=verify_and_promote` succeeded

## Output Slot

- `reference_list` (promoted)

## Next Phase Entry

Read `phases/05a-video-prep/PHASE.md` from the same skill root.
