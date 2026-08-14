# Phase 2: Outline

## Goal

Write the `outline` artifact: one coherent markdown document containing:

- **Structure**: type + total runtime (recommended <= 3 minutes, not mandatory).
- **Audiovisual techniques**: 1-2 core techniques + their progression / mutation / reversal.
- **Paragraph outline**: each paragraph's runtime + content + audiovisual technique + dual-track pacing (plot + emotion).
- **Logical validity of the twist**: one sentence explaining why the twist extends the concept's logic.

After verify passes, run the agent self-check against this phase's criteria and the agent's persona + creative brief; on pass, run `verify_and_promote`. Only then is this phase complete.

## Required Inputs

- The promoted `concept` artifact (read it back with `dl artifact read --slot=concept`).
- `ARTIFACT_CONTRACT_PATH`.

## Required Slot / Schema Loads

- `schemas/outline.schema.json`
- `templates/outline.minimum.json`

## Required Companion Resources

Read according to the concept's path:

- **What-If path**: `references/what-if-structures.md`
- **How-to-Tell path**: `references/how-to-tell-structure.md`

Both paths read audiovisual language:

- `references/av-language.md`: 5 weapon categories + progression and reversal.

## Step 1: [Recommended Search] writing_plot + writing_payoff (Optional)

Query with the selected structure type + twist direction. Follow the search discipline in Phase 1 Step 3: inspiration material, not something to copy.

## Step 2: Choose Structure (According to the Concept Path)

### 2A. What-If Structures (Choose 1 of 5)

Read `references/what-if-structures.md` and choose one according to the concept's traits:

| Structure | Best For |
|---|---|
| **A Classic Three-Act** | Most What-If concepts |
| **B Progressive Collapse** | A rule keeps escalating until collapse |
| **C Dual-Line Juxtaposition** | Inverted juxtaposition combination method |
| **D Loop** | A trap that cannot be escaped / history repeating |
| **E Reverse Reveal** | The truth was visible all along but the audience did not see it |

### 2B. How-to-Tell Structure

Read `references/how-to-tell-structure.md`. Form is structure; the structure is determined by the narrative form itself. Universal three parts: form establishment -> form deepening -> convergence of form and content.

## Step 3: Choose Audiovisual Language (Focus on 1-2 Techniques)

Read `references/av-language.md`. From the 5 weapon categories (camera / editing-time / composition / sound / interface-media), **focus on 1-2 and push them to the limit**.

Iron rules (from SOP section 6.5):

1. **Form serves content.** Decide the concept first, then choose audiovisual techniques. Do not start from "I want split screen" and then find a concept to fit it.
2. **Focus on 1-2 core techniques and push them to the limit.** Cramming 5 techniques into 3 minutes creates a showreel, not a short film.

## Step 4: Technique Progression and Reversal

Audiovisual techniques **must not remain unchanged from beginning to end**. Make the technique evolve in one of these ways:

- **Upgrade**: a single split screen becomes a four-way split screen.
- **Mutate**: forward playback becomes reverse playback.
- **Break at the ending**: the whole film uses a locked-off camera, then the final shot suddenly moves.
- **Highest-level use**: the technique itself completes the twist. The film is color, then turns black-and-white after the twist; the film runs at normal speed, then the entire world rushes past in the final second.

## Step 5: Write the Paragraph Outline (Runtime + Dual-Track Pacing)

Each paragraph marks:

- **Paragraph number** + runtime estimate.
- **Content** (what happens in this paragraph).
- **Audiovisual technique** (what core technique this paragraph uses).
- **Plot pacing** (loose / medium / tight: event density).
- **Emotional pacing** (light / medium / heavy: emotional weight).

Recommended total runtime is <= 3 minutes. If the user's explicit scenario requires longer (for example, commission work or a creative experiment), follow the user's requirement. If it exceeds 5 minutes, add a note recommending the 5-10 minute short-film SOP.

## Step 6: Self-Check (Mandatory)

General:

- [ ] Does the concept presentation / form establishment let the audience get the rule / form within 15 seconds (within 5 seconds for What-If)?
- [ ] Is total runtime within the recommended range (<= 3 minutes), or is there a good reason for exceeding it?
- [ ] Are audiovisual techniques focused on 1-2 techniques, with no pileup?
- [ ] Do the audiovisual techniques match the concept and strengthen the content?
- [ ] Do the audiovisual techniques progress / mutate / reverse in the film rather than staying unchanged?

Additional What-If checks:

- [ ] Do the extrapolation slices progress layer by layer rather than sitting side by side?
- [ ] Does the twist work within the concept's logic (not a forced turn)?
- [ ] Does the twist make the audience want to rewatch from the beginning?

Additional How-to-Tell checks:

- [ ] Do form and content converge at the end so that the form itself becomes part of the content?
- [ ] Does the form change / upgrade / mutate from beginning to end?

If any item fails, return to Step 2 to choose a new structure / Step 3 to choose new techniques / Step 5 to rearrange the outline.

## Step 7: Write the Outline Artifact

Fill `templates/outline.minimum.json` as a single-field body: `{ "outline": "<markdown>" }`. Write the structure, audiovisual techniques, paragraph list, twist, and its logical validity from Steps 2-5 into coherent prose using the template markdown skeleton. Slot identity goes through the `--slot=outline` parameter; status is managed by the state machine. Do not write either field into the body.

**Target language** (see SKILL.md section "Target Language"): the `outline` body uses the same target language as the Phase 1 concept. Do not switch languages within one run.

```bash
cat <<'EOF' | dl artifact write --slot=outline --content-type=application/json --contract='<ARTIFACT_CONTRACT_PATH>' --content-file=-
<serialized outline JSON>
EOF
```

```bash
dl artifact finalize --slot=outline --mode=verify --contract='<ARTIFACT_CONTRACT_PATH>'
```

## Step 8: Self-Check (Gate)

The agent re-reads the outline content (structure type / audiovisual techniques / paragraph list / twist and logical validity) and judges it against this phase's criteria and its own persona + the creative brief:

> Is this outline ready to carry Phase 3 (writing the full screenplay), or does the structure / audiovisual design / any paragraph need changing?

- **Self-check passes** -> Step 9 promote.
- **The agent finds a fixable weakness** -> do not promote. Use `dl artifact patch-json --slot=outline` to rewrite the `outline` field (or replace part of that field), finalize verify again, and self-check again.
- **The outline is fundamentally off** -> return to Steps 2-5 and redo the relevant stage.

## Step 9: Promote

```bash
dl artifact finalize --slot=outline --mode=verify_and_promote --contract='<ARTIFACT_CONTRACT_PATH>'
```

## Output Slot

- `outline` (promoted)

## Next Phase Entry

After success, load:

    phases/03-script/PHASE.md

using the built-in Read tool from this skill root.
