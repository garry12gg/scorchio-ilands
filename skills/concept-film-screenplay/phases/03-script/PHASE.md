# Phase 3: Script

## Goal

Write the `script` artifact: a complete filmable screenplay containing:

- **Scene blocks**: 1-3 scenes, each with location / time / visual description.
- **Twist / ending**: a separate block carrying the final hit.
- **Runtime estimate**: broken down by paragraph.
- **Twist-strength self-review**: one sentence.
- **Alternative twist options**: 2-3 options.
- **Alternative audiovisual technique options**.

After verify passes, run the agent self-check against this phase's criteria and the agent's persona + creative brief; on pass, run `verify_and_promote`. After promotion, the skill completes.

## Required Inputs

- Promoted `concept` artifact.
- Promoted `outline` artifact.
- `ARTIFACT_CONTRACT_PATH`.

## Required Slot / Schema Loads

- `schemas/script.schema.json`
- `templates/script.minimum.json`

## Step 1: [Recommended Search] writing_payoff (Optional)

If the concrete beat of the twist is still unclear, do a focused search on the twist for inspiration. But **do not let search fragments lead you**; the concept's logic comes first.

## Step 2: Writing Requirements

This step fills the outline skeleton into filmable audiovisual description. The structure is already set. Phase 3 is execution, not redesign.

- **Radically concise**: every word must be visible or audible onscreen.
- **Zero explanation, pure visual storytelling** (unless voiceover itself is part of the form, such as essayistic voiceover or data-visualization voiceover).
- **Very little dialogue**, possibly no dialogue at all.
- **The twist lands on the final image or final line.**
- **Audiovisual description must be concrete**: not "use a long take," but "the camera starts on the character's hand, slowly pulls back, and reveals the whole room: every workstation is empty."
- **Format**: use `[Scene X: location / time / brief visual]` as the scene heading. A concept film usually has only 1-3 scenes.

## Step 3: Produce Alongside the Screenplay

- **Runtime estimate** (broken down by paragraph).
- **Twist-strength self-review** (one-sentence assessment: is it strong enough? why?).
- **2-3 alternative twist options** (if the current twist may not be explosive enough, offer forks).
- **Alternative audiovisual technique options** (what changes if another audiovisual language is used?).

The purpose of alternatives is to provide revision forks, not to imply the current version is bad.

## Step 4: Self-Check (Mandatory)

Red-line checks (any hit = Fail; must rewrite):

- [ ] Is there any dialogue that "explains the concept"?
- [ ] Is there any internal description / parenthetical hint?
- [ ] Is there any content that cannot be captured by a camera?

Requirement checks:

- [ ] Does the twist land on the final image / final line?
- [ ] Is the audiovisual technique described concretely enough to shoot?
- [ ] Is total runtime within the recommended range, or is there a good reason for exceeding it?
- [ ] Is each extrapolation slice 5-15 seconds, with tight pacing? (What-If)
- [ ] Does the form run through to the end and converge there? (How-to-Tell)

If any item fails, rewrite the relevant paragraph. If the issue is structural, return to Phase 2; if the issue is conceptual, return to Phase 1.

## Step 5: Write the Script Artifact

Fill `templates/script.minimum.json` as a single-field body: `{ "script": "<markdown>" }`. Use the template markdown skeleton for scene blocks + twist ending + runtime estimate + twist-strength self-review + alternative twist options + alternative audiovisual technique options. Slot identity goes through the `--slot=script` parameter; status is managed by the state machine. Do not write either field into the body.

**Target language** (see SKILL.md section "Target Language"): the `script` body uses the same target language as the first two artifacts. Whether **dialogue** is translated depends on the story setting. Example: if the user is speaking English but the story takes place in a Chinese scene, dialogue can remain Chinese while notes / scene descriptions / twist self-review remain English.

```bash
cat <<'EOF' | dl artifact write --slot=script --content-type=application/json --contract='<ARTIFACT_CONTRACT_PATH>' --content-file=-
<serialized script JSON>
EOF
```

```bash
dl artifact finalize --slot=script --mode=verify --contract='<ARTIFACT_CONTRACT_PATH>'
```

## Step 6: Self-Check (Gate)

The agent re-reads the script content (scene list + twist ending + runtime estimate + twist-strength self-review + alternative twists) and judges it against this phase's criteria and its own persona + the creative brief:

> Is this screenplay ready to promote and close? Does any part need changing? Among the current twist and the 2-3 alternatives, which one best serves the concept and the persona?

- **Self-check passes and the current twist is the strongest choice** -> Step 7 promote.
- **The agent decides an alternative twist is stronger, or finds a fixable weakness** -> do not promote. Use `dl artifact patch-json --slot=script` to rewrite the `script` field (or replace part of that field), finalize verify again, and self-check again.
- **The screenplay is fundamentally off** -> return to Steps 2-3 and rewrite the relevant section (or return to Phase 2 / Phase 1 to change the source).

## Step 7: Promote

```bash
dl artifact finalize --slot=script --mode=verify_and_promote --contract='<ARTIFACT_CONTRACT_PATH>'
```

## Step 8: Visual Production Decision (Mandatory Post-Completion Step)

After `script` is promoted, **do not close immediately**. The agent decides, from its persona / SOUL and the creative brief, whether the promoted three-piece set should continue into visual production:

> The concept short-film three-piece set is complete. Continue into visual production?

Resolve the decision autonomously:

- **The creative intent for this run is a finished video** -> load and switch to the `visual-production` skill:

  ```bash
  skill-mp load visual-production
  ```

  After it is installed (or confirmed already installed), read the entry instructions in `~/.skill-mp/skills/visual-production/SKILL.md` (inside sandbox: `/workspace/.skill-mp/skills/visual-production/SKILL.md`) and proceed according to that skill. This skill terminates the moment the handoff is complete; all later actions follow visual-production's own rules.

- **The screenplay is the intended deliverable for this run** -> end this skill directly. Do **not** proactively call visual-production, and do not pretend to pause; state clearly that the skill has ended.

The only fork out of this skill is the `visual-production` skill; no other downstream skill (lipsync / TTS / rendering / publishing) is in scope for this decision.

## Output Slot

- `script` (promoted)

## Skill Completion

The skill ends when `script` is promoted **and** the agent has resolved Step 8's visual-production decision. On the continue path, this skill terminates immediately after `skill-mp load visual-production` and hands control to visual-production.
