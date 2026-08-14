# Core Principles

## Visual Consistency Is the Lifeline

The finished film must feel like one coherent production. Preserve character identity, face structure, body type, wardrobe logic, prop design, location geography, lighting grammar, camera language, and rendering texture across all phases.

Identity and rendering are stable contracts. Styling can vary only when the story, time, weather, or mood explicitly requires it.

## Asset-First Discipline

Build the reference library before detailed shot prompting. Use `reference_list` as the source of truth for characters, locations, objects, and keyframes. Storyboard prompts must reference these ids with `[[id]]` and the `references[]` array must resolve every id.

## Prompt as Final Instruction

Phase 06 `storyboard.segments[].prompt` is the final video-generation prompt. Do not treat it as a sketch. It must include shot structure, timing, motion, transitions, reference usage, safety-aware wording, and the exact visual style line.

## Minimal Flat Artifacts

Artifacts are operational payloads, not UI pages. Keep fields flat, preserve prior phase fields, and avoid decorative wrappers. Use target-language prose for creative content and English identifiers for machine contracts.

## Phase Self-Checks

Every phase lands an artifact before the next phase begins. After it lands, self-check what changed against the phase criteria, your persona, and the creative brief; promote and advance on your own once it passes. The agent is the decision-maker and never waits for a human.
