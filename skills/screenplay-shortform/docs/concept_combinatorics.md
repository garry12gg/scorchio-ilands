# Concept Combination Tools And Premise Paths (Phase 01 Internal Vocabulary)

> This file is an internal agent tool. Do **not** expose path names directly in user-visible artifacts.
> Use it when the idea seed is too vague or under-specified.

## 1. Five Premise Paths

Judge the seed's shape and sharpen it with the matching method.

### 1.1 Theme-First

If the seed is an abstract theme such as "memory," "loss," or "loneliness," convert the abstraction into **concrete dramatic action**.

> "memory" -> "A mother with amnesia writes a letter to her daughter every day, but the daughter's address changed long ago."

### 1.2 Character-First

If the seed is a contradictory character, such as "a colorblind painter," "a pilot afraid of heights," or "a kind killer," the contradiction itself is the conflict seed. Derive the inciting incident from that contradiction.

> "a colorblind painter" -> "A colorblind painter is hired to restore a priceless full-color painting."

### 1.3 Space-First

If the seed is a concrete space, such as "an old teahouse," "a vertically stratified tower," or "the last subway train," the space creates rules.

> "the last subway train" -> "After everyone else exits the last train, two strangers remain with a child who does not belong on that train."

### 1.4 Relationship-First

If the seed is tension between two people, clarify why their Wants cannot both be satisfied.

> "ex-husband and ex-wife" -> "Ex-spouses must care together for their comatose daughter after an accident, though they have not spoken in three years."

### 1.5 Tag-Collision

If the seed is a keyword cluster such as "wealthy family / revenge / twins," use the five combination tools below.

## 2. Five Combination Tools

### 2.1 Concept Grafting

Mechanism from A + setting from B.

> "auction" + "funeral" -> a funeral where the dead person's belongings are auctioned.

### 2.2 Time-Space Displacement

Put A in an era or place where it does not belong.

> "palace eunuch" + "internet company" -> palace-intrigue dynamics inside a tech company.

### 2.3 Metaphor Literalization

Turn abstract anxiety into a physical rule.

> "social anxiety" -> whenever the protagonist sees strangers, all sound becomes a piercing noise.

### 2.4 Reversal Juxtaposition

Place two things that look similar but are essentially contradictory in the same scene.

> Wedding + funeral on the same day, in the same room, for the same couple's two invitations.

### 2.5 Rule Reversal

Take a real-world rule and invert it.

> Real world: people tell the truth while alive. Inversion: people can only lie after death, and the protagonist is a professional "medium" who lies for the dead.

## 3. When To Stop Generating Concepts

- If you already have a concrete protagonist with contradiction + clear inciting incident + ending direction, move directly to four-dimension alignment and output one direction. Do not keep multiplying concepts.
- Too many concepts dilute the story. Choose the one with the strongest dramatic-action potential.

## 4. Four-Dimension Derivation Discipline (Important)

The agent derives the four dimensions itself from its persona / SOUL and the creative brief. There is no human to question; the agent is the decision-maker.

### 4.1 Extract First, Then Decide The Rest

- **Extract what the seed already fixes.** If the seed (the agent's own idea or the creative brief) already gives a dimension, take it directly and do not re-derive it.
  - For "funny wish-fulfillment drama / homeless man rises to CEO," Tone (funny + wish fulfillment), Satisfaction (comeback / face-slap), and Background (homeless -> CEO) are already fixed; only Core Expectations remains to decide.
  - For "warm and healing, grandmother and granddaughter," Tone is fixed and the relationship group is basically fixed; decide the remaining dimensions around that direction.
- If all four dimensions are already present in the seed, move directly to search + output direction. Do not re-derive just to satisfy process.
- If dimensions are missing, the agent fills them itself, one or two at a time, keeping each choice coherent with the ones already fixed.

### 4.2 How To Decide A Missing Dimension

For each open dimension, the agent privately weighs 2-4 concrete candidates and picks the one with the strongest dramatic-action potential for its persona and brief. It commits to a choice rather than leaving the dimension open:

> Ending feeling — candidates: (A) satisfaction from the protagonist's comeback, (B) warmth from someone keeping their values under pressure, (C) shock from the antagonist's downfall. Pick the one that best fits the persona and the locked Tone.

> Protagonist start -> end — archetypes: (A) bottom rung -> hidden wealthy identity revealed, (B) high status -> bankrupt and starts over, (C) ordinary person -> pulled into a major event, (D) a sharper custom arc. Pick the one with the strongest dramatic engine for this story.

When a dimension is genuinely open, derive 2-3 concrete candidates from the dimensions already fixed and choose decisively. **Do not stall on abstract reflection like "what should this express?" — convert it into a concrete dramatic choice and commit.**

### 4.3 How To Record Information In The Artifact

- Keywords fixed by the seed / creative brief must be written verbatim into the four-dimension section of the `concept` body. If the brief says "funny," Tone should include "funny" rather than silently replacing it with "light comedy."
- This lets downstream phases read the style anchors directly, without reverse-engineering them from the synopsis.
- Mark agent-decided dimensions with `[inferred]`. Example: `Tone: funny (from brief) / fast-paced [inferred]`.
