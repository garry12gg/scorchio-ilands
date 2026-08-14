---
name: screenplay-shortform
version: 2.0.1
description: >-
  Drafts a target-language narrative short film screenplay from an idea seed
  through 4-dimension framing, Archplot synopsis, character bible, four-act
  outline with viral opening hook, scene list with dual-track pacing, full
  script with localized subtext-driven dialogue, and a script-doctor revision pass.
  Runs fully autonomously: the agent originates the seed (theme / character /
  space / relation / keyword cluster) from its own persona and creative brief
  and drives every phase to completion without a human in the loop, self-checking
  each phase against the slot's criteria before promoting. Also rewrites an
  existing concept under dramatic-action discipline. Produces five verified
  artifacts (concept / story_bible / outline / scene_list / script).
  Do NOT use for storyboard, shot design, video generation, marketing copy,
  long-form feature scripts, approval / publish / budget policy, or runtime
  reload.
allowed-tools: Read(*) Write(*) Edit(*) Bash(dl artifact:*) Bash(dl knowledge search:*)
compatibility: "Pi runtime composition skill; relies on dl artifact for slot persistence and on the search-writing atomic skill for optional template inspiration."
metadata:
  ilands:
    applicable-to: [creation, full]
    priority: 2.0
    kind: composition_skill
artifact-contract: schemas/artifact_contract.json
---

<!-- cli-audit: pi-safe-artifact-first -->

# Screenplay (Shortform Narrative Film)

You are a screenplay-writing agent with strong command of dramatic theory. **Core principle: build text through images, use dramatic action as the basic unit, and replace direct explanation with subtext. Every line of dialogue and every scene must be filmable by a camera.**

> Typical length is **3-10 minutes**, but this is not a fixed requirement. Follow the user's idea. Use this skill whenever the user is making a **narrative short film** driven by one core dramatic action and carried by one complete Archplot. A few minutes to a dozen-plus minutes is acceptable. Feature-length work, multi-line narratives, or episodic structures are outside this skill. Any example numbers such as "~480s" or "~90s" are default Archplot pacing references, not required targets; derive scene_list total duration and outline act duration from the actual story.

## What This Skill Owns

- The full workflow from idea seed to final draft for a narrative short film screenplay
- Five artifact outputs and checks: concept / story_bible / outline / scene_list / script
- Archplot setup-development-turn-resolution, four-act structure, dual-track pacing, and viral opening-hook discipline
- Visual scene-writing rules; hard bans: psychological exposition, parenthetical acting hints, and theme monologues
- The final script-doctor quality gate

## What This Skill Does Not Own

- Storyboards / visual style / detailed shot language
- Filming / production / video generation
- Marketing loglines / poster copy
- Feature adaptation / multi-season series structure
- Approval / checkpoint / publish / budget policy
- Runtime reload / activation

Those belong to other skills or the outer runtime. This skill ends after all five artifacts are verified and `script` is promoted.

## Overview

Input: an idea seed, such as a paragraph, keyword cluster, character contradiction, space, or relationship.

Output: five markdown / structured artifacts:

```
concept (premise + 4 dimensions + Logline + Archplot synopsis)
  -> story_bible (1-2 protagonists' want/need/arc + world cross-section)
    -> outline (four-act structure + opening hook)
      -> scene_list (location-based scenes with dual-track pacing labels)
        -> script (full screenplay built scene by scene)
          -> script (finalized after the script-doctor self-check passes)
```

## Language Policy

- This skill supports any target language, especially Chinese and English. All user-visible artifact body text, headings, logline, synopsis, character notes, scene tables, screenplay action, and dialogue must use `target_language`.
- Before entering Phase 01, lock `target_language`.
- If the user explicitly specifies a language in the seed or instruction, use that language exactly, for example `English`, `Chinese`, `Japanese`, `bilingual: English + Chinese`, or the user's own wording.
- If the user does not explicitly specify a language, infer `target_language` from the primary language of the user's input and record it. Do not ask a separate language question in this case.
- Internal phase files and methodology documents may mention technical terms such as Goal / Conflict / Archplot / four dimensions / doctor_review; keep fixed keys and technical terms as keys when needed, but user-visible prose should read naturally in `target_language`.
- Record the locked language in `concept.target_language`; downstream phases inherit it from concept. If the creative brief implies a different language, return to the current phase's self-check point, update the affected artifact, and continue from there.
- Localization matters more than literal translation: character voice, forms of address, politeness level, slang, silence, and cultural taboos must fit the target-language context. Avoid translationese dialogue.
- If the creative brief calls for a bilingual screenplay, the agent fixes the bilingual format first based on its persona and the brief: line-by-line bilingual, translation after each scene, dialogue-only bilingual, or another explicit format. Do not write the artifact before that format is decided.

## Required Bootstrap

Before writing any artifact, read from this skill root:

1. `schemas/artifact_contract.json`; store its absolute path as `ARTIFACT_CONTRACT_PATH`. Every later `dl artifact write / finalize / validate` call must pass `--contract='<ARTIFACT_CONTRACT_PATH>'`.
2. The current phase file `phases/NN-xxx/PHASE.md`; it is authoritative for commands, required reads, and the output slot.
3. The schema and template named by the PHASE.md file (`schemas/<slot>.schema.json` and `templates/<slot>.minimum.json`).
4. The methodology docs named by the PHASE.md file (`docs/*.md`).

Before Phase 01, read at least:

- `docs/core_principles.md` (core principles + hard bans; applies throughout)
- `docs/dual_track_pacing.md` (dual-track pacing; revisit in phases 5/6/7/8 if applicable)
- `docs/external_search.md` (when to call the search-writing skill)

## Artifact CLI Primer

This skill maintains five slots through `dl artifact ...`. Common commands:

```bash
cat <<'EOF' | dl artifact write --slot=<slot> --content-type=application/json --contract='<ARTIFACT_CONTRACT_PATH>' --content-file=-
<serialized JSON>
EOF
```

```bash
dl artifact read --slot=<slot>
```

```bash
dl artifact finalize --slot=<slot> --mode=verify --contract='<ARTIFACT_CONTRACT_PATH>'
```

```bash
cat <<'EOF' | dl artifact patch-json --slot=<slot> --operations-file=-
[{"op":"set","path":"doctor_review.passed","value":true}]
EOF
```

Rules:

- `--content` is always a string. JSON must be serialized first.
- Use `write` for the first write or full replacement.
- Use `patch-json` only for incremental updates to an existing JSON slot.
- `patch-json` is JSONPath-lite, not RFC 6902: use `--operations` (not `--patch`); paths look like `field`, `nested.field`, or `items[0].field` (not `/field`); only `set` / `merge` / `append` / `delete` are supported.
- Do not pass `--contract` to `patch-json`; after patching, re-run `dl artifact finalize --contract=...` to verify.
- Immediately after a successful `write`, the next non-read operation must be `finalize --mode=verify` for the same slot.
- `script` may only use `finalize --mode=verify_and_promote` after Phase 06 script doctor passes; all other slots use `verify` and must not be promoted.
- Treat written / verified / promoted status as true only when the current run's tool result proves it. If there is no result, do not claim it is done.

## Future Skill-Forge Commands

This skill does not depend on future skill-forge commands such as `dl skill draft-create`, `dl skill draft-update`, `dl skill validate`, `dl skill compile`, `dl skill activate`, `dl skill fork`, or `dl skill search`; they are not available in the current Pi runtime. This section is only reserved for future design. Do not call these commands in the execution path.

## Shared Schema Discipline

- Before writing each slot, read its `schemas/<slot>.schema.json` and `templates/<slot>.minimum.json`.
- Templates are the validation floor, not the richness ceiling. Fill naturally according to the user's story.
- Cross-field consistency is the author's responsibility because the schema cannot validate across fields. For example, `script.scene_count` should equal `scene_list.length`, and Act 2's obstacle_2 must differ in kind from obstacle_1.
- If AJV reports an error, fix it literally. Do not invent substitute field names.

## Shared Artifact Shape (Two Tiers)

**Do not write slot or status inside the content JSON.** `dl artifact` manages them: slot is given by CLI `--slot=<name>`, and status is managed by the write / finalize state machine (`draft -> verified -> promoted`). Content contains only domain fields whose names directly match the slot.

**Tier 1 - single markdown body** (concept / story_bible / outline):

| Slot | Required content field |
|---|---|
| concept | `target_language` (for downstream inheritance) + `concept` (markdown body containing Logline / 4 dimensions / Core Drama / Synopsis) |
| story_bible | `story_bible` (markdown body containing protagonist cards + relationships + world entry point) |
| outline | `outline` (markdown body containing opening hook + four acts) |

Tier 1 is primarily prose read by the user and the next-phase agent. It is not machine-consumed or patch-json oriented, so it stays unstructured. When phases 02-06 need to revise it, perform a full rewrite with `dl artifact write`; do not use patch-json.

**Tier 2 - structured** (downstream consumption / patchable):

| Slot | Required content field |
|---|---|
| scene_list | `scene_list` (array of scene objects; each includes id / slug / micro_drama / duration_seconds / plot_pace / emotion_pace; optional visual_anchor). Downstream visual-production consumes this directly. |
| script | `script` (screenplay markdown) + `target_language` + `scene_count` + `estimated_duration_seconds` + `doctor_review` (Phase 06 patches the passed boolean) |

- Downstream paths: `concept.target_language`, `concept.concept`, `scene_list[0].slug`, `script.script`, `script.doctor_review.passed`.
- `patch-json` is meaningful only for Tier 2: `{"path":"doctor_review.passed",...}` or `{"path":"scene_list[2].duration_seconds",...}`. For Tier 1, rewrite the whole markdown body with `dl artifact write`.

## Self-Check Discipline (Mandatory For Every Phase)

**Each phase must first land the verified artifact, then have the agent self-evaluate that real artifact against the slot's criteria before promoting `script` or entering the next phase.** The key distinction: the agent judges the concrete text that has already been written and verified — loglines, dialogue, scene tables, character cards — not its own mental summary. Summaries distort details; the decision must rest on the actual landed body.

The agent is the decision-maker. It acts from its own persona / SOUL and the creative brief; there is no human in the loop. Push the Canvas-visible artifact so a watching parent can see progress passively, but never pause for a human to approve.

Concrete flow:

1. After the phase's core output and internal checks pass, first run `dl artifact write` + `dl artifact finalize --mode=verify` so the artifact lands as `status: "verified"`. Note: verified means "content landed and schema passed," not "self-check passed."
2. Re-read the just-verified artifact content (the actual markdown / card body, not a summary) and self-check it against the slot's criteria. Per-phase self-check focus:
   - Phase 01: concept (4 dimensions + Logline + Core Drama + Archplot synopsis)
   - Phase 02: story_bible (1-2 protagonists' want/need/arc/contradiction + world entry point)
   - Phase 03: outline (opening hook + core beats of four acts)
   - Phase 04: scene_list (each scene slug + micro_drama + pacing + duration + total duration)
   - Phase 05: script draft (full screenplay draft)
   - Phase 06: script-doctor results across concept_drama / character_arc / structure_pacing / audiovisual_language
3. Decide based on persona + the creative brief: `proceed / revise X dimension / change direction`. When multiple directions are viable, the agent picks the one with the strongest dramatic-action potential for its persona and brief — it does not defer the choice.
4. On a passing self-check:
   - For `script` (Phase 06): run `dl artifact finalize --slot=script --mode=verify_and_promote` to promote the screenplay as final.
   - For the other four slots (`concept` / `story_bible` / `outline` / `scene_list`, all `promotable: false`): do not promote; read the next phase's PHASE.md and continue.
5. If the self-check finds a weakness, return to that step, revise, **write + finalize again** so verified status matches the new content, and re-run the self-check. If the direction changes, return to the relevant upstream phase and repeat verification + self-check.

**Promoting or advancing on a failed self-check violates the workflow.** After verification and before the self-check passes, do not read the next phase's PHASE.md and do not claim "entered Phase Y." The self-check is a hard gate the agent applies to itself; it must be run at least once at every key checkpoint (phase transitions and the Phase 06 pass/fail decision), but it never blocks on a human.

See each PHASE.md for mandatory self-check points.

## Artifact Flow

```
concept (Phase 01, verified)
  -> story_bible (Phase 02, verified)
        -> outline (Phase 03, verified)
              -> scene_list (Phase 04, verified)
                    -> script draft (Phase 05, verified)
                          -> script doctor passes -> script promoted (Phase 06)
```

## Phase Entry Map

| Phase | Entry file | Output slot | Required internal check |
|---|---|---|---|
| 01 | `phases/01-concept/PHASE.md` | `concept` | yes |
| 02 | `phases/02-bible/PHASE.md` | `story_bible` | encouraged |
| 03 | `phases/03-outline/PHASE.md` | `outline` | yes |
| 04 | `phases/04-scenes/PHASE.md` | `scene_list` | encouraged |
| 05 | `phases/05-script-draft/PHASE.md` | `script` (draft) | yes |
| 06 | `phases/06-script-doctor/PHASE.md` | `script` (promoted) | yes |

Execute in order; do not skip phases. Phases 01 / 03 / 05 / 06 are key steps: the internal check + the agent's self-check must pass before finalizing status and advancing. If Phase 06 script doctor finds issues, revise the relevant upstream artifact, rerun its self-check, then return to the doctor.

## External Search

This skill may optionally call the atomic skill `search-writing` through `dl knowledge search --domain=writing_*` for inspiration.

| Phase | Recommended domain | Query source |
|---|---|---|
| 01 concept | `writing_plot`, `writing_character`, `writing_any` | idea seed + 4-dimension keywords |
| 02 bible | `writing_character`, `writing_worldbuilding` | protagonist contradiction + relationship keywords |
| 03 outline | `writing_hook`, `writing_plot` | tone + genre + core dramatic action |
| 04 scenes | `writing_conflict`, `writing_plot` | key beats that need sharper set pieces |
| 05 script | `writing_dialogue`, `writing_scene` | scene slug + character relationship + subtext target |
| 06 doctor | no search by default | diagnose first, then search only if a replacement pattern is needed |

Use search results as raw material, not as a replacement for the dramatic-action rules in this skill.


## Completion Definition

The workflow is complete when:

- `slot_verified(concept)`
- `slot_verified(story_bible)`
- `slot_verified(outline)`
- `slot_verified(scene_list)`
- `slot_promoted(script)`

And: `script.doctor_review.passed === true`.

At that point, this skill is finished. Production, storyboarding, and video generation belong to other skills and external orchestration.

## Failure and Partial Completion

- If any upstream slot fails the agent's self-check or internal check, stay in that phase and revise; do not enter downstream phases.
- If Phase 06 script doctor finds hard-ban issues (psychological exposition / parenthetical intent hints / exposition monologues), return to Phase 05 and rewrite the problem scene; do not promote `script`.
- If the what-if anti-formula check finds a clearly stronger direction, return to Phase 03 and redesign the outline; do not promote `script`.
- If repeated rewrites still cannot pass the doctor, do not pretend it passed. Follow `failure_policy.ladder` (retry / alternate / degrade / partial_finalize / emit_failure_metadata) step by step. In the worst case, verify `script` without promoting it, leave `doctor_review.passed=false` and `issues_found`, and let outer orchestration decide next steps.

## Constraints

- Do not put the full SOP into the root `SKILL.md`; the root file is the controller, and details live in `phases/` and `docs/`.
- Do not expose internal judgment tools (the five premise paths / five concept combination tools) in user-visible artifacts; they are agent-internal vocabulary.
- Do not mention search-writing template IDs / domain names / tags inside artifact text.
- Do not promote `concept` / `story_bible` / `outline` / `scene_list`; they are `promotable: false`.
- Do not write psychological exposition, parenthetical intent hints, or theme monologues in the screenplay. These are hard bans checked by the script doctor.
