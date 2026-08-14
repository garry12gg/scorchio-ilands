---
name: concept-film-screenplay
version: 2.1.1
description: >-
  Produces a concept short film screenplay through one of two paths: a
  What-If premise that makes a hidden social tension visible, or a
  How-to-Tell form that reframes known content with an unexpected narrative
  device. Use when the user wants a concept / creative short, gives a
  counter-intuitive premise ("what if..."), proposes "tell Y using X form",
  or hands over an abstract anxiety (overwork competition / appearance anxiety
  / filter bubbles, etc.) to be made physical. Recommended length <= 3 minutes;
  longer creative pieces are allowed, but a film over ~5 minutes should switch
  to the screenplay-shortform skill (3-10 minute drama). Runs autonomously: the
  agent is the decision-maker, acting from its own persona / SOUL and the
  creative brief, with no human in the loop. Produces three promoted artifacts
  (single-field JSON body `{ "<slot>": "<markdown>" }`; slot identity from
  `--slot=` flag, status managed by the dl artifact state machine): concept,
  outline, script, with a verify -> self-check -> promote gate at each. After
  `script` is promoted, the agent decides whether to continue into visual
  production; on yes, hands off to the `visual-production` skill. Do NOT use for 3-10 minute drama shorts
  (use screenplay-shortform), knowledge explainers, feature scripts, ad films
  with brand / product anchors, or any downstream rendering / TTS / compose
  stage.
allowed-tools: Read(*) Bash(dl artifact:*) Bash(dl skill:*) Bash(skill-mp load:*)
compatibility: "Pi runtime composition skill; relies on dl artifact for slot persistence and on the optional search-writing atomic skill for inspiration retrieval."
metadata:
  ilands:
    applicable-to: [creation, full]
    priority: 3.0
    kind: composition_skill
    complexity: medium
    recommended-skills:
      - search-writing
artifact-contract: schemas/artifact_contract.json
---

<!-- cli-audit: pi-safe-artifact-first -->

# Concept Film Screenplay

Turn one idea seed into a 1-3 minute concept short screenplay. There is no hard runtime cap; when the film exceeds 5 minutes, use the 5-10 minute short-film SOP instead.

## What This Skill Owns

- Path routing: choose exactly one of What-If / How-to-Tell.
- Basic-dimension collection: Tone / trigger emotion / real-world anxiety.
- Concept forging (5 What-If combinations) or form discovery (5 How-to-Tell creative methods).
- Structure selection (5 What-If structures / universal three-part How-to-Tell structure).
- Audiovisual language design (5 weapon categories + progression and reversal).
- Full screenplay writing: radically concise, zero explanation, twist placed at the very end.
- Contract and phase routing for three user-visible markdown artifacts.

## What This Skill Does Not Own

- Approval density / checkpoint triggers / pause-resume behavior (all runtime-owned).
- Publishing / budget / quotas / skill reload (all runtime-owned).
- Ad-film-specific fields (product anchor / brand tone / CTA ending), which are out of scope for this version.
- 3-10 minute drama shorts (use screenplay-shortform) / feature films / knowledge explainers (each has its own skill).
- Downstream rendering / TTS / music / compositing.

## Core Theory (Foundation, Do Not Violate)

A concept film is not "a short narrative film." It uses 1-3 minutes of audiovisual impact to deliver a high concept. This means:

1. **Characters are functional archetypes.** They do not need depth or arcs. The film may have no characters.
2. **The world rule must be plug-and-play.** The audience must understand the rule within 5 seconds. A concept that needs "explain first, begin later" is too large for this format.
3. **Form is content.** Audiovisual language is not packaging; it is the narrative itself.
4. **The twist must arise from the concept's own logic.** It is not a forced turn; it is the natural reveal after the concept is pushed to its limit.
5. **No wasted shots.** Every frame must transmit information. Cut until nothing more can be removed.

## The Two Paths (Must Choose Before Creating)

| Path | Essence | Core Weapon | Best For |
|---|---|---|---|
| **What-If** | Assume a counter-intuitive premise, then show its consequences and extrapolation | Concept combination (grafting / time-space displacement / metaphor concretization / inverted juxtaposition / rule reversal) | Abstract anxieties, or amplifying a social phenomenon through a rule |
| **How-to-Tell** | The content is known, but the angle is new; form is content | Creativity of the form itself (perspective shift / form simulation / time surgery / scale jump / rule constraint) | Known events / people / situations that need to be retold through an unexpected form |

For routing signals, see `phases/01-concept/PHASE.md` section "Path Routing."

## Required Bootstrap

Before writing any artifact, read from this skill directory:

1. `schemas/artifact_contract.json`: remember its absolute path and use it as the `--contract` parameter for all later `dl artifact write / finalize / validate` calls. This document refers to it as `<ARTIFACT_CONTRACT_PATH>`.
2. The current phase file, `phases/<NN>-<name>/PHASE.md`, which is the command authority for that phase.
3. The target slot's `schemas/<slot>.schema.json` and `templates/<slot>.minimum.json`.

Re-read the relevant `PHASE.md` on every phase transition; do not rely on memory.

## Artifact CLI Primer

```bash
cat <<'EOF' | dl artifact write --slot=<slot> --content-type=application/json --contract='<ARTIFACT_CONTRACT_PATH>' --content-file=-
<serialized-json>
EOF
```

```bash
dl artifact read --slot=<slot>
```

```bash
cat <<'EOF' | dl artifact patch-json --slot=<slot> --operations-file=-
[{"op":"set","path":"<slot>","value":"..."}]
EOF
```

The body field name equals the slot name: the concept slot path is `concept`, the outline slot path is `outline`, and the script slot path is `script`.

```bash
dl artifact finalize --slot=<slot> --mode=verify --contract='<ARTIFACT_CONTRACT_PATH>'
```

```bash
dl artifact finalize --slot=<slot> --mode=verify_and_promote --contract='<ARTIFACT_CONTRACT_PATH>'
```

Rules:

- `--content` is always a string. Serialize JSON yourself before passing it.
- Use `write` for the initial write or full replacement; use `patch-json` for incremental structured updates.
- `patch-json` is JSONPath-lite: use `--operations` (not `--patch`), and write the top-level field name `<slot>` directly (concept/outline/script body field; no leading `/`). Supported ops are only `set` / `merge` / `append` / `delete`. This skill's artifacts have only one body field, so body revision is `set path=<slot>`.
- Do not pass `--contract` to `patch-json`; after patching, the slot returns to draft and must be finalized again with `--contract`.
- After `write`, the next non-read action must be `finalize --mode=verify` on the same slot.
- **CLI verify / promote is persistence and structural validation, not creative acceptance.** Every artifact must follow: verify passes -> agent self-checks the content against this skill's criteria and its persona + creative brief -> on pass, verify_and_promote. Do not skip the self-check in the middle.
- If this run's tool results do not prove a slot was written / verified / promoted, do not claim it is complete.

## Shared Artifact Protocol Discipline

Each of the three user-visible slot content bodies has exactly **1 top-level field**: a markdown body with the same name as the slot (`concept` for the concept slot, `outline` for the outline slot, `script` for the script slot). The value is a single markdown string. All domain content (Path / basic dimensions / Concept / Form / paragraph outline / scenes / twist, etc.) goes inside that one field.

- Slot identity is supplied by the command-line argument `dl artifact write --slot=<name>`; the server uses it to store under `slots/<name>/...`. Do **not** add a `slot` field to the body.
- `status` is entirely managed by the dl artifact state machine: `write` sets draft, `finalize --mode=verify` sets verified, and `verify_and_promote` promotes. Do **not** add a `status` field to the body.
- Schema `additionalProperties: false`: add no top-level fields beyond the same-name body field, and do not nest wrappers (no `display_name` / `version` / `content_layout` / `content[0].text` / `preview` / `rendererProps`).

`templates/*.minimum.json` is the source of the markdown skeleton; fill it directly according to the phase.

## Target Language

For every slot body field (`concept` / `outline` / `script`), write the markdown in the user's input language. Determine the primary language from the user's latest 2-3 messages. Once chosen, **all three artifacts in the same run must use that one target language** and must not switch mid-run.

- If the user is chatting in Chinese, write the artifact bodies in Chinese. Translate the English template labels naturally into Chinese while preserving technical tokens such as `What-If` and `How-to-Tell`.
- If the user is chatting in English, write the artifact bodies in English. Recommended section headers: `Concept` / `Outline & A/V Design` / `Screenplay`. Inner labels (`Path` / `Tone` / `Sections` / `Twist`, etc.) should also be in English.
- If the user mixes languages, choose the dominant language from the latest 2-3 messages.
- Keep path and method tokens in their canonical form when useful: `What-If` / `How-to-Tell` / `Grafting` / `Perspective Shift`, etc.

## Artifact Flow

```text
Phase 1: concept (What-If path fills the Concept section; How-to-Tell path fills the Form section)
   write -> finalize verify -> agent self-check -> pass? -> verify_and_promote
                                                       |
                                                       v
Phase 2: outline (structure + audiovisual design + paragraph outline + dual-track pacing)
   write -> finalize verify -> agent self-check -> pass? -> verify_and_promote
                                                       |
                                                       v
Phase 3: script (full screenplay + runtime + twist-strength self-review + alternatives)
   write -> finalize verify -> agent self-check -> pass? -> verify_and_promote
                                                       |
                                                       v
Post-completion decision: the agent decides "Continue into visual production?" from its persona + creative brief
   yes -> load `visual-production` skill and hand off
   no  -> end the skill
```

## Phase Entry Map

| Phase | Entry | Output slot |
|---|---|---|
| 1 | `phases/01-concept/PHASE.md` | `concept` |
| 2 | `phases/02-outline/PHASE.md` | `outline` |
| 3 | `phases/03-script/PHASE.md` | `script` |

Strict phase order: enter Phase 2 only after concept is promoted; enter Phase 3 only after outline is promoted.

## Completion Definition

Skill artifact completion predicate:

- `slot_promoted(concept)`
- `slot_promoted(outline)`
- `slot_promoted(script)`

After all three are promoted, you **must** make the post-completion decision (see next section). Do not skip it; the skill truly ends only after that decision.

## Post-Completion Decision: Visual Production

After `script` is promoted, this skill does not exit directly. The agent decides, from its persona / SOUL and the creative brief, whether the promoted three-piece set should continue into visual production:

> The concept short-film three-piece set is complete. Continue into visual production?

- **If the agent decides yes** (the creative intent calls for a finished video) -> call `skill-mp load visual-production` (if already installed, proceed), then read `~/.skill-mp/skills/visual-production/SKILL.md` (inside sandbox: `/workspace/.skill-mp/skills/visual-production/SKILL.md`) and follow its entry instructions. This skill ends the moment the handoff is complete.
- **If the agent decides no** (the screenplay is the intended deliverable for this run) -> end this skill directly and do not proactively call any downstream skill.
- This decision is the final step of Phase 3, not a separate phase. The concrete actions are implemented in the final step of `phases/03-script/PHASE.md`.

More specific downstream visual engineering questions (rendering / TTS / music / compositing, etc.) belong to the `visual-production` skill. This skill does not decide them.

## Failure and Partial Completion

Failure ladder: `retry -> alternate -> degrade -> partial_finalize -> emit_failure_metadata`.

Concrete rules (`schemas/artifact_contract.json` `failure_policy.partial_success_rules` is authoritative):

- A failed concept can be rewritten without affecting the existence of outline / script, but outline / script must be regenerated from the new concept or remain unpromoted.
- If outline self-check fails (extrapolation is not progressive / twist is forced / audiovisual tricks are piled up), do not advance to Phase 3; return to Phase 2 and rearrange.
- If script self-check hits a red line (dialogue explains the concept / internal description / unfilmable content), do not promote; rewrite the failing section.
- If an artifact fails the agent's self-check against this skill's criteria and its persona + creative brief, keep it unpromoted, return to the corresponding phase, revise, verify again, and self-check again.
