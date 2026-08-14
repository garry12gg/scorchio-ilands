# Phase 06: Script Doctor (Final Quality Gate)

## Goal

Read the whole film and diagnose it as a script doctor. This is the final quality gate: **if a problem is found, return to the corresponding phase artifact, revise it, and rerun the self-check. Only after the doctor passes is the script considered final and promoted.**

## Required Inputs

- All five upstream artifacts (concept / story_bible / outline / scene_list / script) verified
- `ARTIFACT_CONTRACT_PATH`

## Required Slot / Schema Loads

- `schemas/script.schema.json`
- `templates/script.minimum.json`

```bash
dl artifact read --slot=concept
dl artifact read --slot=story_bible
dl artifact read --slot=outline
dl artifact read --slot=scene_list
dl artifact read --slot=script
```

## Required Companion Resources

- `docs/core_principles.md` (hard bans + visualization and subtext)
- `docs/dual_track_pacing.md`
- `docs/duration_estimation.md`
- `docs/external_search.md`

## Workflow

### Step 6.1 - Diagnostic Dimensions (Read The Whole Film)

Check each dimension one by one:

#### Pacing Problems (structure_pacing)

- Does dual-track pacing rise and fall reasonably?
- Is there any single emotional state lasting more than about three minutes?
- Is there enough breathing room between two high-emotion scenes?
- Does the all-is-lost beat before the climax give the audience an emotional low point?

#### Duration Problems (structure_pacing)

- Which scenes are much longer or shorter than expected (deviation > 20%)?
- Is the climax long enough?
- Is setup (act_1) too long and weakening the hook?
- Is the difference between `script.estimated_duration_seconds` and `sum(scene_list[].duration_seconds)` within 10%?

#### Logic Gaps (concept_drama / character_arc)

- Does the causal chain hold?
- Are character motivations reasonable?
- Are Want and Need clearly fulfilled, denied, or revealed at the ending?

#### Dialogue Problems (audiovisual_language)

- **Hard-ban check**: psychological exposition, parenthetical intent hints, or exposition monologues. Any hit -> hard-ban Fail; return to Phase 05 and rewrite the scene.
- Does any direct dialogue need to become subtext?
- Is any information both sides already know forced into dialogue?
- Are character voices distinct (different ways of speaking)?

#### Structural Reflection (concept_drama / structure_pacing)

- Does the opening hook truly hook? Would the first 15 seconds keep the audience from looking away?
- Does `obstacle_2` truly differ in kind from `obstacle_1`?
- Does the reversal work, rather than existing only for reversal's sake?
- Is `new_normal` felt in one image, without explanation or preaching?

### Step 6.2 - What-if Anti-Formula Check

For the ending or key turn, propose 1-2 anti-formula alternatives privately:

> "What if X does not win, but keeps the Need?"
> "What if the antagonist wins, but that victory frees the protagonist?"
> "What if neither protagonist reaches the Want, but the relationship itself completes the arc?"

Write the conclusion to `script.doctor_review.what_if_check`.

If an anti-formula idea is clearly stronger than the current version, **do not promote `script`**. Return to Phase 03, redesign the outline, then redo phases 04 / 05 / 06.

### Step 6.3 - Upstream Revision If Needed

If Step 6.1 finds a problem whose source is upstream:

| Finding | Return to phase | Revision |
|---|---|---|
| Logline does not reveal the ending / Goal is vague | Phase 01 | Rewrite the markdown Logline and Core Drama sections, then rerun self-check |
| Protagonist arc unclear / contradiction weak | Phase 02 | Refill want / need / arc |
| Hook lacks tension / obstacles are same-kind / new_normal is didactic | Phase 03 | Revise outline and rerun self-check |
| Scene continuity issue / duration imbalance / monotone pacing | Phase 04 | Revise scene_list and rerun dual-track pacing check |
| Psychological exposition / parenthetical intent hints / direct dialogue | Phase 05 | Rewrite the problem scene |

Revision method by tier:

- **Tier 1 (concept / story_bible / outline) = single markdown body**: there are no structured fields to patch. Use full rewrite through `dl artifact write` with the complete new same-name field body, then finalize again to verify.
- **Tier 2 (scene_list / script) = structured**: use `dl artifact patch-json` with content-field paths, for example:

```bash
cat <<'EOF' | dl artifact patch-json --slot=scene_list --operations-file=-
[
  {"op":"set","path":"scene_list[2].duration_seconds","value":45},
  {"op":"set","path":"scene_list[2].plot_pace","value":"medium"}
]
EOF
```

> Note: `patch-json` must **not** pass `--contract`. After revising, finalize again to verify.

```bash
dl artifact finalize --slot=outline --mode=verify --contract='<ARTIFACT_CONTRACT_PATH>'
```

After upstream revision, rerun that phase's self-check, then return to this phase.

### Step 6.4 - Comprehensive Self-Check (Mandatory; All Four Blocks Must Pass For Final Draft)

Write into `script.doctor_review.categories`:

| Block | Passing condition | pass / fail |
|---|---|---|
| `concept_drama` | Logline is clear in one sentence and reveals the ending; core drama is truly fulfilled in the script | |
| `character_arc` | Want / Need are both clear at the ending; contradiction is supported by concrete behavior | |
| `structure_pacing` | Four-act structure is clear; hook works; duration deviation <= 10%; dual-track pacing has at least one misalignment; no three consecutive scenes share the same pacing state | |
| `audiovisual_language` | No hard bans (psychological exposition / parentheticals / exposition monologues); subtext works; dialogue is conversational and voices are distinct | |

If any block fails, return to the corresponding phase and revise. **Do not promote `script`.**

### Step 6.5 - Final Self-Check (Mandatory; Final Gate Before Promote)

Hold two things together: (1) the full verified script body from Phase 05, re-read one last time, and (2) this doctor's four-block conclusion + what-if anti-formula result. The doctor conclusion is still an internal agent decision at this point and has **not** been written to the artifact. The agent decides; push the artifact for passive Canvas visibility but do not pause for a human. On a pass, Step 6.6 patches + promotes in one pass.

```
verified script (Phase 05 landed body, unchanged):

[re-read full script.script]

---

Phase 06 script-doctor conclusion:
- concept_drama: pass / fail ([reason])
- character_arc: pass / fail
- structure_pacing: pass / fail
- audiovisual_language: pass / fail
- What-if anti-formula check: retain / pivot

[issues_found list]

Promote decision:
1. All four blocks pass + retain -> patch doctor_review.passed=true + promote (Step 6.6)
2. A block fails -> return to the corresponding phase and redo
3. Anti-formula pivot is clearly stronger -> return to Phase 03 and revise outline
```

**Until the final self-check passes, do not execute Step 6.6 patch + promote.** The verified script body itself does not change; Step 6.6 only patches the top-level `doctor_review` field and then runs `finalize --mode=verify_and_promote`.

### Step 6.6 - Passed -> Patch + Promote

If all four blocks are `pass` and `what_if_check` decides retain, use patch-json to set `doctor_review` to pass. **Use top-level paths `doctor_review.xxx`:**

```bash
cat <<'EOF' | dl artifact patch-json --slot=script --operations-file=-
[
  {"op":"set","path":"doctor_review.passed","value":true},
  {"op":"set","path":"doctor_review.categories.concept_drama","value":"pass"},
  {"op":"set","path":"doctor_review.categories.character_arc","value":"pass"},
  {"op":"set","path":"doctor_review.categories.structure_pacing","value":"pass"},
  {"op":"set","path":"doctor_review.categories.audiovisual_language","value":"pass"},
  {"op":"set","path":"doctor_review.issues_found","value":[]}
]
EOF
```

Then promote:

```bash
dl artifact finalize --slot=script --mode=verify_and_promote --contract='<ARTIFACT_CONTRACT_PATH>'
```

## Output Slot

`script` (promoted)

## Workflow End

At this point, the skill is finished. Workflow completion condition:

- `slot_verified(concept) && slot_verified(story_bible) && slot_verified(outline) && slot_verified(scene_list)`
- `slot_promoted(script) && script.doctor_review.passed === true`

Production, storyboarding, and video generation belong to other skills and external orchestration.
