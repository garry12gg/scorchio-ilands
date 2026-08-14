# Upstream Screenplay Handoff

## Preferred Upstream Package

When available, read promoted artifacts from `screenplay-shortform`:

- `story_bible`: character baseline, appearance, relationships, and dramatic function.
- `scene_list`: scene order, locations, time of day, scene purpose, and action beats.
- `script`: full dialogue and action lines.

If any of these are missing, use `screenplay_intake.text` as the equivalent source after Phase 00 has promoted it.

## Mapping Rules

- Character baseline comes from `story_bible.characters[].appearance` when present. All outfit or state variants for the same character must preserve the same baseline.
- Scene order, duration logic, and location grounding come from `scene_list` first, then `script` details.
- Dialogue-only mentions do not create visual entries unless the character or object appears on screen.
- Tone and genre cues feed Phase 01 visual style.
- Action beats feed Phase 04 segment planning and Phase 06 shot structure.

## Target Language

Creative prose follows the target-language rule from `SKILL.md`: explicit `target_language` wins; otherwise use the user's input language. Keep ids, field names, commands, and model names in English.
