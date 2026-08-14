# Phase 1: Concept

## Goal

Write the `concept` artifact: one coherent markdown document containing:

- **Path**: choose exactly one of What-If or How-to-Tell; never mix paths.
- **Basic Dimensions**: Tone / trigger emotion / real-world anxiety to expose (required only for What-If).
- **Concept section** (What-If path) or **Form section** (How-to-Tell path).

After verify passes, run the agent self-check against this phase's criteria and the agent's persona + creative brief; on pass, run `verify_and_promote`. Only then is this phase complete.

## Required Inputs

- The user's creative seed (possibly a counter-intuitive premise / known content + form / abstract anxiety / known event / fuzzy preference).
- `ARTIFACT_CONTRACT_PATH` (absolute path from `schemas/artifact_contract.json`).

## Required Slot / Schema Loads

Read with the Read tool:

- `schemas/concept.schema.json`
- `templates/concept.minimum.json`

## Required Companion Resources

Read according to the user's seed; do not read everything by default:

- `references/what-if-combinations.md`: read when the seed is a counter-intuitive premise or abstract anxiety.
- `references/how-to-tell-methods.md`: read when the seed is known content + form or a known event.

## Step 1: Path Routing (Must Decide First)

| Signal | Judgment |
|---|---|
| The user says "what if...", "suppose...", or gives a counter-intuitive rule | **What-If** |
| The user says "I want to tell the story of XX, but through YY", or gives a form / medium / perspective | **How-to-Tell** |
| The user gives an abstract anxiety ("overwork competition", "appearance anxiety") | Prefer **What-If** (make it physical through a rule) |
| The user gives a known event / person / situation | Prefer **How-to-Tell** (find a new angle) |
| The seed carries no path preference | Infer from the seed's nature; the agent decides the path from its persona + creative brief (sketch 1-2 concrete path options internally, then commit to one) |

**Iron rule**: one film is either What-If or How-to-Tell. Do not mix. A hybrid path (telling a What-If through X form) usually leaves both sides shallow. Force yourself to choose one.

## Step 2: Basic Dimensions (3 Dimensions)

Compared with the 4 dimensions of a 5-10 minute short, concept films have **no protagonist arc**, so remove "protagonist state gap" and "core expectation." Keep:

1. **Tone**: absurd / satirical / austere / wistful / darkly comic / oppressive / thriller-like / childlike, etc.
2. **Trigger emotion** (the audience's instant reaction after watching): cognitive flip / shock / after-chill / bitter laugh / resonance / unease / sudden realization.
3. **Real-world anxiety to expose** (required only for What-If; optional for How-to-Tell): overwork competition / appearance anxiety / filter bubble / alienation / identity anxiety / algorithmic oppression, etc.

**Dimension-resolution discipline** (the agent decides; no human is queried):

- **Extract what the brief already states; do not re-derive what is already clear.** Pull dimensions directly from the creative seed / brief ("an absurd satirical piece about overwork competition" -> Tone and real-world anxiety are already present; only trigger emotion + path still need deciding).
- **For each undecided dimension, the agent commits to a concrete value from its persona + the creative brief.** Sketch 2-4 concrete candidates internally, then pick the one that best serves the brief. Examples of the candidate space:
  - End feeling: (A) a chilling cognitive flip, (B) a bitter-laugh resonance, (C) numbness after absurdity is pushed to its limit — the agent selects one.
  - Telling mode: (A) assume a counter-intuitive rule and show consequences ("if every office light must be brighter than the neighbor's or the power cuts off..."), (B) retell known content through a new form ("tell an employee's collapse through an attendance app interface") — the agent selects one.
- **Resolve the most load-bearing dimensions first**; do not stall trying to fix everything at once.
- If the brief leaves a dimension fully open, the agent infers a concrete value from the dimensions already clear and its persona.

**How to record information in the artifact**:

- Keywords explicitly said by the user must be written verbatim into the corresponding concept field. If the user says "absurd," the Tone field says "absurd"; do not replace it with "exaggerated."
- Mark your own inference with `[inferred]`, for example: `Tone: absurd (user wording) / austere [inferred]`.

## Step 3: [Recommended Search] writing_hook + writing_plot (Optional)

Use basic-dimension keywords to query the search-writing skill. "Real-world anxiety" and "desired trigger emotion" are especially good queries:

```bash
dl skill resource --skill=search-writing --path=SKILL.md
```

Uses of the 5 domains in concept films:

- `writing_hook`: references for concept presentation / form establishment ("make the audience get the rule within 5 seconds" is highly similar to hook design).
- `writing_plot`: structure templates (progressive collapse / loop / reverse reveal, etc.) that can serve as concept-film structure skeletons.
- `writing_payoff`: twist punch.
- `writing_conflict`: conflict types needed in the middle of What-If extrapolation.
- `writing_character`: functional archetypes (even in 30 seconds, the right archetype helps the concept land).

Filter by tags such as "absurd", "satire", "concept", "experimental", "dark comedy", etc.

**Discipline**:

1. Search results are inspiration material, not the answer. Do not copy them.
2. You may combine organically: reuse, rewrite, splice, vary, or fuse across domains.
3. Do not mention template IDs, domain names, or source identifiers in any deliverable.
4. If search results do not fit the concept, discard all of them. Your judgment outranks the search results.

Skipping search is fine; when the path is clear, go directly to Step 4.

## Step 4A: What-If Path: Concept Forging

Read `references/what-if-combinations.md`. Forge concepts through the 5 combination methods: Grafting / Time-Space Displacement / Metaphor Concretization / Inverted Juxtaposition / Rule Reversal.

Output strategy:

- **Sufficient**: if the basic dimensions are complete and the seed already implies a concrete concept, output **one forged concept** directly.
- **Insufficient**: if the seed is vague and needs exploration through the 5 combination methods, brainstorm **3 candidate concepts**, then the agent selects the one that best serves its persona + the creative brief.

For each candidate concept, provide:

- **One-sentence concept**: a rule that can be presented visually within 5 seconds.
- **Combination method**: Grafting / Time-Space Displacement / Metaphor Concretization / Inverted Juxtaposition / Rule Reversal / Single Concept.
- **Real-world anxiety / human weakness targeted**: echo the basic dimensions.
- **Extrapolation potential**: what is the most absurd image when the rule is pushed to the limit?
- **Twist potential**: what is the largest possible cognitive reversal?

Output only outline-level detail, briefly. Leave the full screenplay for Phase 3.

## Step 4B: How-to-Tell Path: Form Discovery

Read `references/how-to-tell-methods.md`. Generate form ideas through the 5 creative methods: Perspective Shift / Form Simulation / Time Surgery / Scale Jump / Rule Constraint.

Use the same output strategy as Step 4A: if sufficient, output 1 direction; if insufficient, brainstorm 3 candidates and the agent selects the one that best serves its persona + the creative brief.

For each form direction, provide:

- **Content / theme**: what will be told (usually already given by the seed / brief).
- **Narrative form**: how it will be told.
- **Creative method**: Perspective Shift / Form Simulation / Time Surgery / Scale Jump / Rule Constraint.
- **Relationship between form and content**: why does this form tell it better? Would it still work without the form?
- **Progression potential of the form**: how can the form itself escalate / mutate?

## Step 5: Self-Check (Mandatory)

General:

- [ ] Has the creative path been chosen (exactly one of What-If or How-to-Tell)?
- [ ] Is Tone clear (using the user's wording verbatim)?
- [ ] Is trigger emotion clear?
- [ ] Are the above written into the concept document using the user's wording verbatim?

Additional What-If checks:

- [ ] Is the real-world anxiety to expose clear?
- [ ] Can the rule be stated in one sentence?
- [ ] Can it be presented visually within 5 seconds?
- [ ] Does it point to a real social emotion or human weakness?
- [ ] Can it generate at least 3 progressively escalating consequence slices? (If not, extrapolation potential is insufficient; choose again.)
- [ ] Does it have twist potential (the ending can hit the audience from the opposite direction)?
- [ ] Can it be told within the recommended runtime? (If the concept is too complex, recommend the 5-10 minute short-film SOP.)
- [ ] If it is a combined concept: does 1+1 > 2? (If the combined concepts are not more interesting together than apart, abandon the combination.)

Additional How-to-Tell checks:

- [ ] Does the form deeply fit the content? (Not "it looks cool," but "this can only be told this way.")
- [ ] Does the form have room to progress? (It cannot repeat one trick from beginning to end.)
- [ ] Does the form itself have twist potential?
- [ ] Can the audience understand the narrative form within 15 seconds?
- [ ] If the form is removed and the content is told conventionally, would the impact be lost? (If not, the form is invalid packaging; change the form.)

If any item fails, return to Step 4 and recombine / rethink the form. **Do not verify a concept that fails self-check.**

## Step 6: Write the Concept Artifact

Fill `templates/concept.minimum.json` as a single-field body: `{ "concept": "<markdown>" }`. Write all conclusions from Steps 1-4 into coherent prose using the template's markdown skeleton. Slot identity goes through the `--slot=concept` parameter; status is managed by the state machine. Do not write either field into the body.

**Target language** (see SKILL.md section "Target Language"): the `concept` body uses the user's input language. Keep the selected target language consistent in Phase 2 and Phase 3. Preserve canonical path/method tokens such as `What-If`, `How-to-Tell`, `Grafting`, and `Perspective Shift` where useful.

```bash
cat <<'EOF' | dl artifact write --slot=concept --content-type=application/json --contract='<ARTIFACT_CONTRACT_PATH>' --content-file=-
<serialized concept JSON>
EOF
```

Immediately verify:

```bash
dl artifact finalize --slot=concept --mode=verify --contract='<ARTIFACT_CONTRACT_PATH>'
```

## Step 7: Self-Check (Gate)

verify passing is only persistence + structural validation; it does not mean the concept is creatively sound. Before promoting, the agent re-reads the concept content (Path + basic dimensions + Concept/Form fields; if it brainstormed 3 options, the one it selected) and judges it against this phase's criteria and its own persona + the creative brief:

> Is this the concept I want to commit? Is it ready to carry Phase 2 (structure and audiovisual design), or does any part need changing?

- **Self-check passes** -> Step 8 promote.
- **The agent finds a fixable weakness** -> do not promote. Use `dl artifact patch-json --slot=concept` to rewrite the entire `concept` field (or replace part of that field), finalize verify again, and self-check again.
- **The concept is fundamentally off** -> return to Steps 1-4 and redo the relevant stage.

## Step 8: Promote

```bash
dl artifact finalize --slot=concept --mode=verify_and_promote --contract='<ARTIFACT_CONTRACT_PATH>'
```

## Output Slot

- `concept` (promoted)

## Next Phase Entry

After success, load:

    phases/02-outline/PHASE.md

using the built-in Read tool from this skill root.
