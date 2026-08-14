# Phase 01: Concept (Premise And Synopsis)

## Goal

Turn the idea seed into the short film's core: core dramatic action = Goal + Conflict, then expand it into an Archplot synopsis. The final output is a verified `concept` artifact.

## Required Inputs

- The idea seed: a paragraph, keywords, character contradiction, space, or relationship — originated by the agent from its persona / SOUL and the creative brief
- Target output language: if the creative brief fixes one (for example, "an English short film" or "a Spanish screenplay"), use it exactly; otherwise infer `target_language` from the primary language of the brief and record it before Step 1.2
- `ARTIFACT_CONTRACT_PATH` from the root SKILL.md bootstrap

## Required Slot / Schema Loads

Read with the Read tool:

- `schemas/concept.schema.json`
- `templates/concept.minimum.json`

## Required Companion Resources

- `docs/core_principles.md` (hard bans + visual rules)
- `docs/concept_combinatorics.md` (five premise paths + five combination tools + four-dimension questioning discipline)
- `docs/external_search.md` (when to call the search-writing skill)

## Workflow (Ordered; Do Not Skip)

### Step 1.1 - Lock The Four Dimensions

Follow `docs/concept_combinatorics.md` section 4:

- Extract dimensions the seed / creative brief already fixes; derive the rest yourself
- For each open dimension, weigh 2-4 concrete candidates and commit to the strongest one for the persona and brief
- Tone / Satisfaction / Background / Core Expectation must all be present before Step 1.2

**Write the verbatim wording from the seed / brief into the four-dimension section of the markdown.** Mark agent-decided parts with `[inferred]`.

At the same time, lock `target_language` after the four dimensions are complete and before Step 1.2:

- **If the creative brief fixed a language** -> record it exactly, for example `English`, `Japanese`, `Chinese`, or `bilingual: English + Chinese`.
- **If the brief did not fix a language** -> infer `target_language` from the primary language of the brief and record it.
- **If bilingual output is called for** -> the agent fixes the bilingual format (line-by-line bilingual / translation after each scene / dialogue-only bilingual) from its persona and the brief before Step 1.2.
- Write the locked language to `concept.target_language`; downstream phases inherit it from concept.

### Step 1.2 - [Optional] Search For Inspiration

Search `writing_plot` + `writing_character` (or `writing_any` for exploration) using the idea seed plus four-dimension terms. Use hits as a brainstorming pool.

```bash
dl knowledge search --domain=writing_plot --query="<idea seed + 5-15 four-dimension terms>"
```

This is optional; skip it if the direction is already clear.

### Step 1.3 - Judge Information Sufficiency

- **Sufficient**: protagonist is concrete with contradiction + inciting event is clear + ending direction exists -> output one Archplot direction directly
- **Insufficient**: brainstorm three candidate directions with meaningful differences in protagonist setup / stakes / ending direction

For each direction, provide:

- Protagonist with contradiction: one concrete sentence
- Want (external goal)
- Conflict
- Inciting incident
- Logline that reveals the ending and follows this pattern: "[protagonist] must [active action] when/because [inciting event / core conflict], or else [consequence]"

> This step outputs only outline-level material. Save the full synopsis for Step 1.5.
> Miniplot / Antiplot usually does not fit narrative-short length because the audience has little time to adapt to nontraditional structure. Unless the creative brief calls for an experimental short, use Archplot.

### Step 1.4 - Lock The Direction

- One direction (sufficient path): lock it directly
- Three directions (brainstorm path): the agent selects the one with the strongest dramatic-action potential for its persona and brief, then enriches it with the concrete details that choice implies

### Step 1.5 - Expand The Synopsis (Archplot Setup-Development-Turn-Resolution)

Expand across four movements in present tense, as continuous narrative prose, without section-by-section meta commentary:

- **Setup**: who the protagonist is, current state, and why that state is about to break
- **Development**: inciting incident that pushes the protagonist into the story
- **Turn**: core conflict + key obstacles: obstacle 1 / obstacle 2 / midpoint reversal / all-is-lost
- **Resolution**: whether the protagonist reaches the Want; whether the Need is revealed or completed

Length: 200-500 words; complex stories may be longer.

### Step 1.6 - Self-Check (Mandatory)

Internal agent check before writing the artifact:

- [ ] Dramatic action is valid: Goal + Conflict established
- [ ] Goal is reasonable and urgent
- [ ] Obstacles directly oppose the goal
- [ ] Conflict can drive the whole episode
- [ ] Obstacle scale is plausible, not artificially inflated
- [ ] Fits narrative short-film scope: one core event
- [ ] Logline is clear in one sentence and makes the story watchable

If any item fails, return to Step 1.3 for a new direction or Step 1.4 for reselection.

### Step 1.7 - Write Verified + Self-Check (Mandatory Before Phase 02)

First land `concept` as `status: "verified"`, then self-check it. **Verified means content landed and schema passed; it does not mean the self-check passed. A passing self-check is required before Phase 02.**

**Step 1.7a - Write + Verify**

Use the Write & Verify command template below:

```bash
dl artifact write --slot=concept ...
dl artifact finalize --slot=concept --mode=verify ...
```

**Step 1.7b - Self-Check The Verified Concept**

Re-read the verified concept body in full (Logline / four dimensions / Core Drama / Synopsis), then judge it against the slot's criteria and the creative brief. Push the artifact so a watching parent sees progress on Canvas, but do not pause for a human. Decide:

```
Verified concept (target_language=<lang>) re-read. Decide:
1. Proceed - concept holds; enter Phase 02 (character bible)
2. Revise one dimension (four dimensions / Logline / synopsis) -> return to the relevant step, revise, write + finalize again, and self-check again
3. Switch to another brainstorm direction -> return to Step 1.4
4. Restart premise development -> return to Step 1.1
```

**Until the self-check passes, do not read `phases/02-bible/PHASE.md` and do not claim "entered Phase 02."** If the self-check finds a weakness, finish Step 1.7a + 1.7b again after revising.

## Output Slot

`concept`

## Write & Verify

`concept` is Tier 1 (single markdown body): content fields are `target_language` (for downstream inheritance) + `concept` (markdown body). Slot and status are managed by `dl artifact`; do not write them into JSON. The `concept` field can be freely structured: Logline / four dimensions / Core Drama / Synopsis.

Minimum JSON shape:

```json
{
  "target_language": "...",
  "concept": "# Title - Concept\n\n**Logline**: ...\n\n## Four Dimensions\n..."
}
```

Command template:

```bash
cat <<'EOF' | dl artifact write --slot=concept --content-type=application/json --contract='<ARTIFACT_CONTRACT_PATH>' --content-file=-
{"target_language":"English","concept":"# ..."}
EOF

dl artifact finalize --slot=concept --mode=verify --contract='<ARTIFACT_CONTRACT_PATH>'
```


## Next Phase Entry

    phases/02-bible/PHASE.md
