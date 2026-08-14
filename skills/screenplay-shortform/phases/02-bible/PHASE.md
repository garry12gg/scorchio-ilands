# Phase 02: Story Bible (Characters And Backstory)

## Goal

Build the character engine and world entry point from the verified `concept`: 1-2 protagonist/antagonist cards, want/need/arc, contradiction, and world cross-section. The final output is a verified `story_bible` artifact.

## Required Inputs

- verified `concept` artifact
- `concept.target_language` inherited from Phase 01
- `ARTIFACT_CONTRACT_PATH`

## Required Slot / Schema Loads

Read:

- `schemas/story_bible.schema.json`
- `templates/story_bible.minimum.json`

## Required Companion Resources

- `docs/core_principles.md` (character action and subtext rules)
- `docs/concept_combinatorics.md` (when character or relationship is the premise path)

## Workflow

### Step 2.1 - Read Upstream Concept

Read `concept` and extract:

- target_language
- Logline
- four dimensions
- Core Drama: Goal + Conflict
- Synopsis

Do not reinterpret the concept into a different genre or ending unless the creative brief calls for it.

### Step 2.2 - Build Character Cards

For 1-2 key characters, write:

- `basic_info`: age range / social position / visual anchor
- `Want`: external goal that can be filmed
- `Need`: internal transformation or truth the story tests
- `Arc`: start -> pressure -> final irreversible state
- `Contradiction`: visible contradiction that creates tension
- `Ghost-Lie-Flaw`: wound / false belief / active flaw, when useful
- `Backstory key event`: only if it drives present action

Avoid pure personality labels. A useful character card should imply actions and choices.

### Step 2.3 - Define Relationship Axis

If two characters matter, define their axis:

- Power / intimacy / debt / shame / rivalry / obligation / desire
- What each one wants from the other
- Why both cannot get what they want at the same time

### Step 2.4 - Define World Cross-Section

Write the narrow slice of the world that the short film uses:

- Entry point: the specific day, place, or pressure window where the story begins
- Rules: what constraints make choices costly
- Stakes: what is lost if the protagonist fails

Do not build broad world lore that the camera will never use.

### Step 2.5 - Optional Internal Check

- [ ] Characters have filmable wants, not abstract desires
- [ ] Need connects to the final choice
- [ ] Contradiction can generate scenes
- [ ] Relationship axis creates pressure
- [ ] World rules constrain action

If weak, revise before writing.

### Step 2.6 - Write Verified + Self-Check (Mandatory Before Phase 03)

First land verified `story_bible`, then self-check it. Verified is not a passing self-check.

**Step 2.6a - Write + Verify**

Use the command template in Write & Verify.

**Step 2.6b - Self-Check The Verified Bible**

Re-read the verified `story_bible.story_bible` markdown in full, then judge it against the slot's criteria and the creative brief. Push the artifact for passive Canvas visibility, but do not pause for a human. Decide:

```
Verified story_bible (protagonist cards / relationship / world entry point) re-read. Decide:
1. Proceed - bible holds; enter Phase 03 (four-act outline)
2. Revise one character (want / need / arc / contradiction) -> return to Step 2.2
3. Revise world entry point -> return to Step 2.4
4. Return to concept direction -> Phase 01 revision
```

**Until the self-check passes, do not read `phases/03-outline/PHASE.md` and do not claim "entered Phase 03."** If the self-check finds a weakness, rerun Step 2.6a + 2.6b after revising.

## Output Slot

`story_bible`

## Write & Verify

`story_bible` is Tier 1 (single markdown body). Content has one field: `story_bible`. Slot and status are managed by `dl artifact`.

Minimum JSON shape:

```json
{
  "story_bible": "# Character Bible\n\n## Protagonist\n..."
}
```

Command template:

```bash
cat <<'EOF' | dl artifact write --slot=story_bible --content-type=application/json --contract='<ARTIFACT_CONTRACT_PATH>' --content-file=-
{"story_bible":"# ..."}
EOF

dl artifact finalize --slot=story_bible --mode=verify --contract='<ARTIFACT_CONTRACT_PATH>'
```


## Next Phase Entry

    phases/03-outline/PHASE.md
