# Phase 03: Outline (Four-Act Structure + Opening Hook)

## Goal

Build the short film's skeleton. **Only one core event is allowed**: no subplots, no scattered focus. Every scene must serve the same dramatic action. Design the first 15 seconds as the opening hook, the most carefully engineered passage of the film. The final output is a verified `outline`.

## Required Inputs

- verified `concept`
- verified `story_bible`
- `concept.target_language`
- `ARTIFACT_CONTRACT_PATH`

## Required Slot / Schema Loads

Read:

- `schemas/outline.schema.json`
- `templates/outline.minimum.json`

## Required Companion Resources

- `docs/viral_hooks.md` (seven viral opening formulas)
- `docs/dual_track_pacing.md` (act duration proportions)
- `docs/core_principles.md`

## Workflow

### Step 3.1 - [Recommended] Search Hook + Plot

```bash
dl knowledge search --domain=writing_hook --query="<tone> <genre> <protagonist situation keywords>"
```

```bash
dl knowledge search --domain=writing_plot --query="<core dramatic action keywords>"
```

Opening hook and reversal points are the highest-value places to search; strong hook templates are more reliable than inventing from nothing.

### Step 3.2 - Design The Opening Hook (First 15 Seconds)

Follow `docs/viral_hooks.md`:

- Choose one formula (`identity_flip` / `outcome_first` / `in_medias_res` / `taboo_break` / `ticking_clock` / `surreal_shock` / `emotional_impact`) or `custom`
- Write 3-4 concrete visual sentences; the first sentence must be action or image
- Show, don't tell; create a specific question within 30 words

In the outline markdown, include the formula name and first-15-second visual description in the opening-hook section.

### Step 3.3 - Fill The Four Acts

| Act | Required fields | Suggested share (8-minute reference) |
|---|---|---|
| **act_1** (cause) | setup + inciting_incident + duration_seconds | 15-20% |
| **act_2** (development) | obstacle_1 + obstacle_2 (**different in kind**, not a bigger version of the same obstacle) + midpoint + all_is_lost + duration_seconds | 40-50% |
| **act_3** (climax) | climax + key_choice (irreversible choice revealing Need) + duration_seconds | ~25% |
| **act_4** (resolution) | new_normal (**one image that lets the audience feel the change; do not explain what the protagonist learned**) + duration_seconds | 15-20% |

> Note: `obstacle_2` must differ in kind from `obstacle_1`. For example, if `obstacle_1` is physical, `obstacle_2` should be relational / moral / time-based. The schema cannot validate this across fields, so the author must check it.

### Step 3.4 - Self-Check (Mandatory)

Internal agent check before Step 3.5:

- [ ] Opening image has visual impact or suspense
- [ ] The audience has a concrete question within the first 30 seconds
- [ ] The opening creates tension while establishing state
- [ ] All four acts are clear
- [ ] obstacle_2 differs in kind from obstacle_1
- [ ] Climax is explicit
- [ ] No removable dead plot beats
- [ ] Duration proportions are reasonable

If any item fails, revise within this phase.

### Step 3.5 - Write Verified + Self-Check (Mandatory Before Phase 04)

First land verified `outline`, then self-check it. Verified is not a passing self-check.

**Step 3.5a - Write + Verify**

Use the command template in Write & Verify.

**Step 3.5b - Self-Check The Verified Outline**

Re-read the verified outline in full (opening hook + four-act skeleton), then judge it against the slot's criteria and the creative brief. Push the artifact for passive Canvas visibility, but do not pause for a human. Decide:

```
Verified outline (opening hook + four-act skeleton) re-read. Decide:
1. Proceed - outline holds; enter Phase 04 (scene breakdown)
2. Revise opening hook (change formula or rewrite visuals) -> return to Step 3.2
3. Revise an act -> return to Step 3.3
4. Rebuild direction (return to Phase 02 for character adjustment / Phase 01 for concept direction)
```

**Until the self-check passes, do not read `phases/04-scenes/PHASE.md` and do not claim "entered Phase 04."** If the self-check finds a weakness, rerun Step 3.5a + 3.5b after revising.

## Output Slot

`outline`

## Write & Verify

`outline` is Tier 1 (single markdown body): content has one field, `outline`. Slot and status are managed by `dl artifact`. The `outline` field can freely contain opening hook (with formula) + Act 1 (setup + inciting_incident) + Act 2 (obstacle_1 + obstacle_2 + midpoint + all_is_lost) + Act 3 (climax + key_choice) + Act 4 (new_normal), with estimated duration per act.

Minimum JSON shape:

```json
{
  "outline": "# Four-Act Outline\n\n## Opening Hook (First 15 Seconds)\n- Formula: ...\n- Visuals: ...\n\n## Act 1 (Cause, about X seconds)\n- Setup: ...\n- Inciting incident: ...\n\n## Act 2 (Development, about X seconds)\n- Obstacle 1: ...\n- Obstacle 2 (different in kind from obstacle 1): ...\n- Midpoint: ...\n- All is lost: ...\n\n## Act 3 (Turn, about X seconds)\n- Climax: ...\n- Key choice: ...\n\n## Act 4 (Resolution, about X seconds)\n- New normal: ..."
}
```

Command template:

```bash
cat <<'EOF' | dl artifact write --slot=outline --content-type=application/json --contract='<ARTIFACT_CONTRACT_PATH>' --content-file=-
{"outline":"# ..."}
EOF

dl artifact finalize --slot=outline --mode=verify --contract='<ARTIFACT_CONTRACT_PATH>'
```


## Next Phase Entry

    phases/04-scenes/PHASE.md
