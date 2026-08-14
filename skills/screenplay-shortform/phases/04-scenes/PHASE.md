# Phase 04: Scene List

## Goal

Turn the outline into audiovisual units. Each plot beat becomes one or more micro dramatic actions (goal -> obstacle -> result). **This step only lists scenes; it does not write full dialogue.** The final output is a verified `scene_list`.

## Required Inputs

- verified `outline`
- verified `story_bible`
- `concept.target_language`
- `ARTIFACT_CONTRACT_PATH`

## Required Slot / Schema Loads

Read:

- `schemas/scene_list.schema.json`
- `templates/scene_list.minimum.json`

## Required Companion Resources

- `docs/dual_track_pacing.md` (plot pace + emotion pace + misalignment)
- `docs/duration_estimation.md` (duration budgeting)
- `docs/core_principles.md`

## Workflow

### Step 4.1 - [Optional] Search Conflict Structures

```bash
dl knowledge search --domain=writing_conflict --query="<core conflict keywords for the beat>"
dl knowledge search --domain=writing_plot --query="<specific set-piece keywords>"
```

Search conflict + plot templates for each key beat when you need concrete set-piece inspiration.

### Step 4.2 - Break Into Scenes (Critical Discipline)

**Scene boundary = location change** under standard screenplay conventions.

If one continuous dramatic action crosses multiple locations, split it into multiple scenes. Each scene gets its own slug line (`INT./EXT. + location + time`). Express continuity with action lines and cuts, not by forcing multiple locations into one slug.

> Example: two people talk from an office to a taxi to an apartment entrance = **three separate scenes** (`INT. OFFICE -> INT. TAXI BACK SEAT -> EXT. APARTMENT ENTRANCE`), not one.
> This rule directly helps downstream visual production because each scene maps to a single location reference.

### Step 4.3 - Label Each Scene

Each scene must include:

- `id`: unique scene ID, incrementing from `scene_01`
- `slug`: `INT.|EXT.|INT./EXT. + concrete location + time`, for example `INT. HOSPITAL CORRIDOR - NIGHT - FLUORESCENT HUM`
- `duration_seconds`: estimated seconds
- `micro_drama`: one sentence with goal -> obstacle -> result
- `plot_pace`: `loose` / `medium` / `tight`
- `emotion_pace`: `light` / `medium` / `heavy`
- `visual_anchor` (optional): key prop or visual anchor for later storyboard work

### Step 4.4 - Duration Check

`sum(scenes[].duration_seconds)` should be within 10% of the duration target in the creative brief. If the brief fixes no duration, use the outline act durations as reference.

Reference `docs/duration_estimation.md` section 2 for the 8-minute budget table.

### Step 4.5 - Dual-Track Pacing Check (Encouraged)

Follow `docs/dual_track_pacing.md` sections 3-5:

- [ ] No more than two consecutive scenes share the same pacing state
- [ ] At least one plot/emotion pacing misalignment exists (for example loose plot + heavy emotion)
- [ ] The climax scene(s) in act_3 are marked `tight + heavy`
- [ ] The breathing beat before act_3 or in the middle of act_2 is marked `loose + heavy` or `loose + light`
- [ ] Every scene has clear goal -> obstacle -> result

This check does not hard-block, but if the agent finds problems, revise via Step 4.2 / 4.4. Phase 06 will also re-check dual-track pacing.

### Step 4.6 - Write Verified + Self-Check (Mandatory Before Phase 05)

First land verified `scene_list`, then self-check it. Verified is not a passing self-check.

**Step 4.6a - Write + Verify**

Use the command template in Write & Verify.

**Step 4.6b - Self-Check The Verified Scene List**

Re-read all verified scene cards in full, not a summary, then judge them against the slot's criteria, the dual-track pacing check, and the creative brief's duration target. Push the artifact for passive Canvas visibility, but do not pause for a human. Decide:

```
Verified scene_list re-read. N scenes, total duration = T seconds (derived from the story; if the brief gave a duration, deviation <= 10%). Per scene:

Scene 01 - <slug>
- micro_drama: ...
- duration_seconds: ...
- plot_pace / emotion_pace: ... / ...
- visual_anchor: ...

...

Decide:
1. Proceed - scene_list holds; enter Phase 05 (script draft)
2. Revise a scene (slug / micro_drama / duration / pacing) -> return to Step 4.2-4.4
3. Add / remove scenes -> return to Step 4.2
4. Duration mismatch -> return to Step 4.4
```

**Until the self-check passes, do not read `phases/05-script-draft/PHASE.md` and do not claim "entered Phase 05."** If the self-check finds a weakness, rerun Step 4.6a + 4.6b after revising.

## Output Slot

`scene_list`

## Write & Verify

`scene_list` is Tier 2 (structured): content has one field, `scene_list`, an array of scene objects. Slot and status are managed by `dl artifact`. Each scene is a flat object: id / slug / micro_drama / duration_seconds / plot_pace / emotion_pace / optional visual_anchor.

Minimum JSON shape:

```json
{
  "scene_list": [
    {
      "id": "scene_01",
      "slug": "INT. OFFICE - DUSK",
      "duration_seconds": 30,
      "micro_drama": "The protagonist tries to hide the invitation, but the date exposes the threat.",
      "plot_pace": "tight",
      "emotion_pace": "medium",
      "visual_anchor": "gilded invitation"
    }
  ]
}
```

Command template:

```bash
cat <<'EOF' | dl artifact write --slot=scene_list --content-type=application/json --contract='<ARTIFACT_CONTRACT_PATH>' --content-file=-
{"scene_list":[...]}
EOF

dl artifact finalize --slot=scene_list --mode=verify --contract='<ARTIFACT_CONTRACT_PATH>'
```


## Next Phase Entry

    phases/05-script-draft/PHASE.md
