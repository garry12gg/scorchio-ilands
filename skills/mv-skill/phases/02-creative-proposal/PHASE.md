# Phase 02: Treatment (creative decisions + logline + brief + segment list)

## Role Division

- **Main Agent**: Step 0 resolves 4 creative decisions (mandatory, decided by the agent from its persona + brief) → feeds the decisions to the sub-agent (audio is read by sub-agent itself via `dl artifact read`) → receives sub-agent output `{logline, brief, segments}` → **assembles** complete creative_proposal (adds decision fields + music_url + total_duration) and writes draft (does not rewrite creative / planning content) → Self-Check → split audio tracks + **add** `audio_url` to each segment → finalize
- **Sub-agent** (role=writer + bash, model `litellm/gemini-3.1-pro-preview`, carries elite MV creative director persona): clean context reads `treatment_director.md` (logline + brief + segmentation methodology, all in this one file) + schema + template + `dl artifact read` upstream audio_analysis, then **one task** produces **`{logline, brief, segments[]}`** written to outputPath. **segments do not contain `audio_url` or `references`**; `mv_type` / `tone_mood` / `model_primary` / `visual_instructions` / `music_url` / `total_duration` are also **not produced by the sub-agent** (main agent adds them during assembly)

## Goal

Produce `creative_proposal` based on `audio_analysis` + Step 0's 4 creative decisions: decision fields (`mv_type` / `tone_mood` / `model_primary` / `visual_instructions`) + `music_url` / `total_duration` (added by main agent) + `logline` + `brief` + `segments[]` (written by sub-agent). creative_proposal is the unified creative source + spine — downstream Phase 03 extracts visual style from brief, Phase 04 extracts character/location/prop, Phase 05a writes prompts based on segments + maps references, Phase 05b generates lipsync keyframes. `audio_url` is added by the main agent to each segment after the self-check when splitting audio tracks. Self-check + audio splitting, then promote.

## Required Inputs

- `audio_analysis` (promoted)
- Creative brief / intent (optional; Step 0 decisions will proactively fill gaps from the agent's persona)
- `ARTIFACT_CONTRACT_PATH`

## Preflight Reads (Main Agent)

1. Read `schemas/creative_proposal.schema.json`
2. Read `phases/02-creative-proposal/templates/creative_proposal.minimum.json`
3. Read promoted `audio_analysis` (Step 0 conversation start: emotional_arc / duration / genre; Step 3 audio splitting needs music_url + segment boundaries; assembly needs music_url + total_duration)
4. Read the absolute `video-generation/SKILL.md` from `<available_skills>` — Step 0 decision 3 weighs current non-lipsync model candidates with duration range + default resolution; the choice selects the non-lipsync path (Seedance 2.0 = asset_reference, any other model = keyframe — see `docs/non_seedance_path.md`). **Model parameters are not inlined in this SOP; always refer to the skill documentation.**

> The main agent **does not read** `references/treatment_director.md` — that is the sub-agent's required reading. Song data (including full transcription / beats / sections) is read by the sub-agent itself via `dl artifact read`; the main agent does not relay audio for it. The main agent only handles Step 0 decisions + relaying decision results + assembly + self-check + audio splitting.

## Step 0 — Creative Decisions (4 decisions, must be resolved before spawning sub-agent)

Start from your own reading of the song. Form 1-2 sentences of your interpretation — the emotions + imagery evoked by the music (and lyrics, if any) (reference `audio_analysis.emotional_arc` as the emotional trajectory starting point, but do not copy it verbatim). Then, from your persona + creative intent, resolve 4 decisions yourself (if the creative brief already fixes a decision, honor it):

**Decision 1 — `mv_type`**: choose one of `narrative` / `performance` / `hybrid` / `concept` (definitions in `treatment_director.md`). Select the type that best fits your interpretation of the song.

**Decision 2 — `tone_mood`**: Overall tone and mood for the entire piece — serves the single emotional intent + character of the whole piece; is the north star for brief (tone / color / rhythm / arc all align to it). Form 3-4 candidate moods you could pursue (e.g. `melancholic restrained cool-blue` / `euphoric bold high-saturation` / `dreamy hazy soft-focus`), then commit to the one that fits your creative intent.

**Decision 3 — `model_primary`**: After reading `video-generation/SKILL.md`, weigh the current **non-lipsync model candidates** (**lipsync segments always use dlai2v_pro; not chosen here**). Each candidate's duration range + default resolution comes from the skill documentation. **The choice selects the non-lipsync generation path**: `seedance-2-0` / `seedance-2-0-fast` → the standard **asset_reference** path (a non-lipsync segment may span multiple scenes); **any other model** → the **keyframe** path (each non-lipsync segment is one image-to-video call seeded by its own keyframe(s), so scene changes must cut to a new segment — non-lipsync segments are then prepared per `docs/non_seedance_path.md`). Pick the model whose path + duration + resolution best serve the brief, and note in one line which path it implies. After selection, record `model_primary` + duration cap + default resolution.

**Decision 4 — `visual_instructions` (free text)**: Any additional visual instructions / visual references / must-have elements / footage to avoid / existing characters / actors / assets carried in the creative brief or implied by your concept. Leave empty if none.

Resolve the decisions in order; as soon as one is fixed, move to the next. After the 4th decision is fixed, **proceed directly to Step 1 to spawn the sub-agent**. If you later determine a decision needs to change during the Step 2 self-check, use its "option 4 → back to Step 0".

## Step 1 — Sub-agent writes logline + brief + segments

First determine `OUTPUT_LANGUAGE` from `audio_analysis.language` / transcription: when lyrics are present, match the lyrics language; for purely instrumental / no language, match the creation's working language. This value must be explicitly passed to the sub-agent.

Launch a clean-context sub-agent (**role=writer, model=`litellm/gemini-3.1-pro-preview`, tools explicitly include bash**: `["read","write","bash","grep","find","ls"]` — writer role has no bash by default; without it, `dl artifact read` for upstream data won't work), **one task** to produce `{logline, brief, segments[]}`, written to outputPath (a stable path under `/workspace`, e.g. `/workspace/creative_proposal.partial.json`):

```
You are an elite music video creative director. You receive a song's metadata + analysis and the agent's locked creative decisions, then write logline + brief + an ordered segment list.

Task: Write logline + brief following the treatment_director methodology, then segment the entire song into a complete segments[] based on brief + audio. Write {logline, brief, segments} to <outputPath>.

Required reading (from skill root):
1. phases/02-creative-proposal/references/treatment_director.md — logline + brief + segmentation methodology (all in this one file)
2. schemas/creative_proposal.schema.json — field contract (see segments shape)
3. phases/02-creative-proposal/templates/creative_proposal.minimum.json — example + output shape

Read promoted upstream (`dl artifact read --slot=audio_analysis`; read-only, do not invoke any generation / ffmpeg):
- audio_analysis — duration + bpm / energy + sections + emotional_arc + transcription (word-level timestamps, what each line sings, language) + beats.positions (downbeat grid for cut points) + music_url

Creative decisions locked by main agent (follow when segmenting / writing, but **do not write into output JSON** — main agent adds them during assembly):
- mv_type: <...>  /  tone_mood: <...>  /  visual_instructions: <...>
- model_primary: <Step 0 selected value> (non-lipsync segment model)
- non-lipsync generation path: <asset_reference if model_primary is seedance-2-0/seedance-2-0-fast, else keyframe> (asset_reference → a non-lipsync segment may span multiple scenes; keyframe → each scene change must cut to a new segment — see docs/non_seedance_path.md Phase 02)
- model_primary non-lipsync duration cap: <cap>s (<=15)
- music_url / total_duration: <from audio_analysis; used for segmentation timing reference, but not written into output>
- OUTPUT_LANGUAGE: <English / Chinese / ...>. All prose fields (`logline`, `brief`, `segments[].description`) must be written in this language; `segments[].lyrics` preserves the original lyric text.

Output (**only these three keys**): { "logline": "...", "brief": "...", "segments": [...] } written to <outputPath>.
- Each segment = { id, start_time, end_time, duration, lipsync, model, lyrics, description }.
- **segments do not contain audio_url or references**; do not output mv_type / tone_mood / model_primary / visual_instructions / music_url / total_duration (main agent adds these).
- Language mismatch (e.g. OUTPUT_LANGUAGE=English but treatment / description written in Chinese) = failing; rewrite before submitting.
- Follow all treatment_director DoD: full-track coverage (first segment start=0, last segment end=total_duration, no gap/overlap, frame-aligned, 2 decimal places); duration in [4, cap]; cut points fall on lyric onset or downbeat; on the keyframe path (model_primary not Seedance 2.0), each scene change must cut to a new segment; on the asset_reference path (Seedance 2.0), cross-scene segments must list details in description; non-lipsync model=model_primary, lipsync model=dlai2v_pro; description rich with actions, no shot breakdown; only use people/places/props already named in brief.
- final reply should only report outputPath + one-sentence summary + Open Issues (if any); do not repeat the full text.
```

> **Single complex generation**: The sub-agent completes logline + brief + entire song's segments in one task. Creative craft and segmentation methodology are all in treatment_director.md; the main agent does not reiterate, preset, or review content.

## Step 2 — Main Agent assembly + inject draft + Self-Check (draft-first)

After sub-agent returns, the main agent **does not rewrite creative / planning content**; it takes the sub-agent's `{logline, brief, segments}` and the Step 0 decision fields + audio_analysis's `music_url` / `total_duration` to **assemble** the complete creative_proposal (segments at this point **do not yet have audio_url**), then writes the draft:

> Before assembly, perform a lightweight language check: `logline` / `brief` / `segments[].description` must match Step 1's `OUTPUT_LANGUAGE`; if not, return the outputPath to the sub-agent for rewriting — the main agent does not translate or edit on its behalf.

```bash
jq --arg mv "<mv_type>" --arg tm "<tone_mood>" --arg mp "<model_primary>" \
   --arg vi "<visual_instructions>" --arg mu "<music_url>" --argjson td <total_duration> \
   '. + {mv_type:$mv, tone_mood:$tm, model_primary:$mp, visual_instructions:$vi, music_url:$mu, total_duration:$td}' \
   <sub-agent outputPath> > /workspace/creative_proposal.draft.json
```

```bash
dl artifact write --slot=creative_proposal --content-type=application/json --contract='<ARTIFACT_CONTRACT_PATH>' --content-file=/workspace/creative_proposal.draft.json
```

> `audio_url` is schema optional; during draft stage each segment can pass validation without it (added after Step 3 splitting). If write reports errors (missing decision field / segment duration out of bounds / non-contiguous boundaries / invalid mv_type enum etc.) → segment-related issues: return the error to the sub-agent to fix outputPath, then re-assemble and re-write; decision-field-related issues: main agent self-checks the assembly command. **Main agent does not manually craft creative / planning content**.

Then read back the **actual draft content** and self-check it (what you verify is the creative_proposal just written). Treatment first, then segment list, **must verify lipsync ratio**; note that audio tracks are pending split:

```
Treatment (<mv_type> · tone: <tone_mood>)

Logline: <logline>

<brief markdown — actual draft content>

─────────────────────────────────
Segment List (<N> segments, total duration <T>s, primary model: <model_primary>)
Lipsync ratio: approx <ratio>%

seg_01 · 0.00-9.00s · 9.00s · non-lipsync · <model_primary>
  <actual draft description content>
  lyrics: -
seg_02 · 9.00-13.50s · 4.50s · lipsync · dlai2v_pro
  <actual draft description content>
  lyrics: At the edge of the city
...

(Audio tracks: segments do not yet have audio_url; after the self-check passes the main agent will batch-split + add; references are mapped in Phase 05)
```

Self-check (resolve each yourself from your creative intent + the brief, then take the matching action):
- **Pass** — creative direction + segment breakdown serve the brief and meet the criteria → proceed to Step 3 (split audio tracks + finalize).
- **Brief needs work** — a part of the brief (logline / core motif / visuals / characters / lines & sublines ...) is off → pass the specific feedback + original outputPath back to the sub-agent for revision.
- **A segment needs work** — a segment (seg_NN: description / boundary / lipsync) or the overall lipsync ratio is off → pass the specific feedback + original outputPath back to the sub-agent for revision.
- **A decision needs to change** — `mv_type` / `tone_mood` / `model` / `visual_instructions` no longer fits → back to Step 0 to re-resolve the decision, then Step 1 to re-spawn the sub-agent.

After a "brief needs work" / "a segment needs work" revision (minor changes only modify specified parts; structural / segmentation overhauls go back to methodology for rewrite), once the sub-agent rewrites outputPath, return to the beginning of this step to **re-assemble + re-write** overwriting the draft, then re-verify.

## Step 3 — Split audio tracks + add audio_url + finalize (Main Agent)

After the Step 2 self-check passes, the skeleton is locked; the main agent directly batch-splits (fixed commands, no sub-agent needed):

1. Read draft to get `music_url` + each segment's `[start_time, end_time]`.
2. **Split audio for every segment** (split all uniformly, regardless of lipsync), submit in batch via `dl ffmpeg`:

```bash
cat <<'EOF' | dl ffmpeg --input src=<music_url> --output-kind transformed_audio --command-file=-
ffmpeg -i /input/src -ss <start> -to <end> -c:a libmp3lame -q:a 2 /output/seg_NN.mp3
EOF
```

3. **Add** `audio_url` field to each segment = the real URL of that segment's split audio, then `dl artifact write --contract` to overwrite the draft (now every segment has audio_url).
4. Finalize promote:

```bash
dl artifact finalize --slot=creative_proposal --mode=verify_and_promote \
  --contract='<ARTIFACT_CONTRACT_PATH>'
```

> Add audio_url first, then finalize — **only finalize once throughout**. If audio splitting reveals boundary issues → go back to Step 2 to have sub-agent adjust, then re-split.
> After finalize promote succeeds, proceed to the next step: Phase 03 selects visual style + aspect ratio.

## Operational Rules

- Step 0's 4 decisions are resolved by the main agent from its persona + brief, **not** delegated to the sub-agent; decisions already fixed by the creative brief are honored — only fill gaps
- Sub-agent only produces `{logline, brief, segments}`; **segments do not contain audio_url / references**, and decision fields / music_url / total_duration are not produced by it either. Main agent adds decision fields + music_url + total_duration during assembly; audio_url is added after Step 3 splitting
- Main agent does not write / rewrite creative / planning content — only assembles + runs its own self-check for quality control
- Do not invoke any image / video / music generation in this phase — Phase 04 is the first image-generation phase. The only generation call in this phase is Step 3's `dl ffmpeg` for audio splitting (after the self-check passes)
- `dl artifact write` failure (schema validation fails) → segment-related: return error to sub-agent to fix; decision-field-related: main agent self-checks assembly; do not have main agent manually craft content or fabricate artifacts
- Sequence: 4 decisions → spawn sub-agent → assemble → `dl artifact write` (draft) → self-check → split audio + add audio_url → `finalize`; the self-check is after write, before audio splitting

## Do Not Proceed Unless

- Step 0's 4 decisions (mv_type / tone_mood / model_primary / visual_instructions) have all been resolved by the agent
- Sub-agent output (logline + brief + segments) has been assembled with decision fields + music_url + total_duration + `dl artifact write --contract` succeeded (schema validation passed; segments without audio_url is legal at this stage)
- Self-check passed
- All segments have had `audio_url` **added** (real split URLs)
- `dl artifact finalize --mode=verify_and_promote` succeeded

> Creative quality (brief's two disciplines, complete skeleton, >=1 character, covers full track duration) + segmentation quality (frame-aligned boundaries / falls on lyric onset or downbeat / full-track coverage / duration range / cross-scene strategy matches model capability / description rich without shot breakdown) is the **sub-agent task's DoD** (see `references/treatment_director.md`), enforced by `dl artifact write --contract` schema validation + the main agent's self-check against these criteria; the main agent **does not micro-edit content item by item**.

## Output Slot

- `creative_proposal` (promoted)

## Next Phase Entry

Read `phases/03-visual-config/PHASE.md` from the same skill root.
