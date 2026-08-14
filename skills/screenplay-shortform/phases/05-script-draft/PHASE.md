# Phase 05: Script Draft (Scene Writing)

## Goal

Fill the verified scene_list with dramatic flesh and produce the screenplay draft. **This is a critical phase: if any hard ban appears (psychological exposition / parenthetical intent hints / theme monologue), that scene fails.** The final output is verified `script` (draft, not promoted).

## Required Inputs

- `concept`, `story_bible`, `outline`, and `scene_list` (all verified)
- `ARTIFACT_CONTRACT_PATH`

## Required Slot / Schema Loads

- `schemas/script.schema.json`
- `templates/script.minimum.json`

```bash
dl artifact read --slot=concept
dl artifact read --slot=story_bible
dl artifact read --slot=outline
dl artifact read --slot=scene_list
```

## Required Companion Resources

- `docs/core_principles.md` (hard bans and quick reference for visualization + subtext)
- `docs/dual_track_pacing.md` (stretch and snapback inside scenes)
- `docs/duration_estimation.md`

## Workflow

### Step 5.1 - Single-Pass vs Batched Writing

- <= 8 scenes or <= 8 minutes -> write the full episode in one pass
- > 8 scenes or > 8 minutes -> write in batches at breathing points from `dual_track_pacing.md`. Between batches, keep an internal snapshot of character state / active clues / pacing direction to prevent contradictions.

### Step 5.2 - [Optional] Search Difficult Scenes

If a scene's core conflict is hard to write (unclear character motivation / no sharp entry into confrontation), search for that scene only:

```bash
dl knowledge search --domain=writing_conflict --query="<scene core situation>"
dl knowledge search --domain=writing_payoff --query="<satisfaction keywords>"
```

**Do not search every scene.** Too many fragments will pull the draft away from a consistent character voice.

### Step 5.3 - Standard Screenplay Format

The screenplay body uses `concept.target_language`. The following is a format example, not a language restriction; actual scene headings, action lines, character labels, and dialogue must read naturally in the target language.

```text
[Scene X: Location - INT/EXT - Time] (about X minutes X seconds)

Action / visual description goes directly between dialogue lines. Do not label it; write only what the camera can see or the microphone can hear.

Character A: xxxxxxxxx.
Character B: xxxxxxxxx.

Character A does not answer. He turns toward the window, fingers tapping the frame without noticing.

Character A: xxxxxxxxx.
```

Format rules:

- Scene labels may use the target language's screenplay convention; the slug must correspond to `scene_list[*].slug`.
- Put dialogue directly after the character name. Choose colon, full-width colon, dash, or another convention according to the target-language screenplay norm, but keep it consistent within the script.
- Use OS / V.O. / voice-over markers according to the target-language industry convention; short films rarely need them, so use carefully.
- Action / visual description is written directly between dialogue lines, without extra labels.
- Character names must exactly match the names in `story_bible.story_bible`.

### Step 5.4 - Writing Requirements

#### Visual Writing (Hard Ban)

Psychological exposition is forbidden. **Write only visible actions and audible sounds.**

> Wrong: He finally understands his father's pain.
> Correct: He stands there for a moment, then takes off his coat and lays it over his father.

#### Subtext

Dialogue is an iceberg; only the tip is spoken. Avoid on-the-nose lines.

> On-the-nose (wrong): I am afraid of losing you.
> Subtext (better): Take that coat when you leave. ...It's cold outside.

#### Dialogue Style

- Conversational, like real people speaking
- Different characters speak differently (word choice / sentence length / habitual phrasing)
- Avoid metaphors, analogies, and AI-ish phrasing
- Do not make characters state information both already know
- Localize the voice for the target language: forms of address, politeness level, slang, pauses, and avoidance patterns must sound like local real people, not translated dialogue

#### Micro Dramatic Action Inside Each Scene

Each scene should have clear goal -> obstacle -> result. **McKee test**: is the core value of the scene (trust / fear / power / love / loneliness) different at the end than at the beginning? If not, consider deleting the scene.

#### Stretch And Snapback

- **Stretch**: use repeated action, slower speech, and static image to build expectation
- **Snapback**: break the balance suddenly with a very short audiovisual action

### Step 5.5 - Self-Check (Mandatory; Every Scene Must Pass)

Check scene by scene:

- [ ] Is there psychological exposition? (hard ban; if hit, fail and rewrite the scene)
- [ ] Are there parenthetical intent hints? (hard ban; if hit, fail)
- [ ] Is the scene told through images?
- [ ] Is the dialogue too on-the-nose?
- [ ] Does it use subtext and body language?
- [ ] Is the dialogue conversational?
- [ ] Is any character explaining the setting instead of responding to it?
- [ ] Is the core value at the end of the scene different from the beginning?

If a hard-ban item hits, rewrite the scene. If other items fail, revise the scene or leave it for the Phase 06 script doctor to handle in one pass.

### Step 5.6 - Duration Estimate

Estimate `estimated_duration_seconds` using `docs/duration_estimation.md` section 1.

- One page of standard screenplay format is roughly one minute; for different languages, use the language coefficients in `docs/duration_estimation.md` if present
- Include visible duration for silence and emotional scenes
- Include 2-5 seconds for transitions

### Step 5.7 - Write Verified + Self-Check (Mandatory Before Phase 06)

First land the verified `script` draft (`doctor_review.passed: false`; this phase does not promote), then self-check it. Verified is not a passing self-check; a passing self-check is required before Phase 06.

**Step 5.7a - Write + Verify (draft)**

Use the Write & Verify command template below to run `dl artifact write --slot=script ...` (`doctor_review.passed: false`) and `dl artifact finalize --slot=script --mode=verify ...`. **This phase uses `--mode=verify`; do not use `verify_and_promote`.** Promotion belongs to Phase 06.

**Step 5.7b - Self-Check The Verified Draft**

Re-read the verified script draft in full (every scene's dialogue and action, not a summary), then run the Step 5.5 scene-by-scene self-check across the whole draft. Push the artifact for passive Canvas visibility, but do not pause for a human. Decide:

```
Verified script draft re-read (doctor_review.passed=false; Phase 06 doctor check pending). N scenes, estimated duration T seconds. Decide:
1. Proceed - draft holds; enter Phase 06 (script doctor)
2. Revise dialogue / action in a specific scene -> return to Step 5.4
3. Add / remove scenes (affects scene_list) -> return to Phase 04
4. Rewrite overall draft -> return to Step 5.1
```

**Until the self-check passes, do not read `phases/06-script-doctor/PHASE.md` and do not claim "entered Phase 06."** If the self-check finds a weakness, rerun Step 5.7a + 5.7b after revising.

## Output Slot

`script` (draft; this phase does not promote)

## Write & Verify

`script` is Tier 2 (structured): content fields are `script` (full screenplay markdown) + `target_language` + `scene_count` + `estimated_duration_seconds` + `doctor_review`. Slot and status are managed by `dl artifact`; do not write them into JSON. When writing, set `doctor_review.passed: false`; Phase 06 script doctor flips it to true only after passing.

```bash
cat <<'EOF' | dl artifact write --slot=script --content-type=application/json --contract='<ARTIFACT_CONTRACT_PATH>' --content-file=-
{
  "script": "# {Working Title} - Script\n\n[Scene 1: ...] (about X seconds)\n...\n",
  "target_language": "...",
  "scene_count": 8,
  "estimated_duration_seconds": 480,
  "doctor_review": {
    "passed": false,
    "categories": {
      "concept_drama": "fail",
      "character_arc": "fail",
      "structure_pacing": "fail",
      "audiovisual_language": "fail"
    },
    "issues_found": []
  }
}
EOF
```

```bash
dl artifact finalize --slot=script --mode=verify --contract='<ARTIFACT_CONTRACT_PATH>'
```

> Note: this phase uses `--mode=verify`; **do not use `verify_and_promote`**. Promotion belongs to Phase 06.

## Next Phase Entry

    phases/06-script-doctor/PHASE.md
