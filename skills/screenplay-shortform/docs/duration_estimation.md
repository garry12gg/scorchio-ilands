# Duration Estimation

## 1. Principles

Duration is story-derived, not a fixed quota. Estimate by combining:

- Action density
- Dialogue density
- Pauses and silence
- Location transitions
- Emotional weight

A script with sparse dialogue and heavy silence can take longer than its word count suggests. A rapid argument can be shorter than it looks on the page.

## 2. Reference Budget For An 8-Minute Short

| Part | Share | Seconds |
|---|---:|---:|
| Opening hook | 0-5% | 0-25 |
| Act 1 setup + inciting incident | 15-20% | 70-95 |
| Act 2 development / obstacles | 40-50% | 190-240 |
| Act 3 climax | ~25% | ~120 |
| Act 4 resolution | 15-20% | 70-95 |

These are references, not mandatory numbers.

## 3. Scene-Level Heuristics

- One short visual beat: 3-8 seconds
- One object-handling action with emotional weight: 8-20 seconds
- Short exchange (4-8 lines): 20-45 seconds
- Heavy silent confrontation: 30-90 seconds
- Movement across a location: 10-40 seconds
- A twist reveal with reaction: 15-45 seconds

## 4. When To Split Scenes

Split when:

- The location changes
- The goal changes
- The obstacle changes type
- The time jump is meaningful
- A new visual reference is required for downstream production

Do not split only because the emotional beat changes if the location and dramatic action stay continuous.

## 5. Duration Consistency

- `scene_list` total duration should align with the user's requested duration within about 10% when the user gave one.
- `script.estimated_duration_seconds` should align with the final draft, not blindly copy scene_list if dialogue density changed.
- If final script duration differs significantly from scene_list, revise scene_list or explain the changed estimate before final promotion.
