# External Search Guidance

This skill may use `dl knowledge search --domain=writing_*` for inspiration. Search is optional and should support the writing decision; it should not replace the skill's dramatic-action discipline.

## 1. When To Search

Search when:

- The seed is vague and needs premise directions
- The opening hook feels generic
- The conflict beat lacks concrete set-piece shape
- Dialogue needs a clearer subtext pattern
- The script doctor identifies a specific weakness and a replacement pattern would help

Do not search when:

- The user's direction is already clear and specific
- Search would delay a phase that already has enough material
- The problem is structural and must be solved by returning to an upstream phase

## 2. Domains

| Domain | Best Use |
|---|---|
| `writing_any` | broad exploration |
| `writing_plot` | conflict structures, reversals, set pieces |
| `writing_character` | contradictions, wants, arcs |
| `writing_worldbuilding` | rules of a narrow story world |
| `writing_hook` | first 15 seconds, opening image, curiosity gap |
| `writing_conflict` | goal-obstacle-result pressure |
| `writing_dialogue` | subtext and dialogue strategy |
| `writing_scene` | scene mechanics and action beats |

## 3. Query Shape

Good queries are concrete:

```bash
dl knowledge search --domain=writing_hook --query="quiet thriller widow wedding invitation death anniversary opening image"
```

Avoid broad queries:

```bash
dl knowledge search --domain=writing_plot --query="love story"
```

## 4. Using Results

- Treat results as ingredients, not answers.
- Preserve the user's seed and four dimensions.
- Do not copy a template wholesale.
- Translate any useful pattern into the target language and story context.

## 5. Citation And Provenance

This skill's artifacts do not need to cite search results. If a searched pattern influenced a major direction, the agent may note it briefly in its own self-check reasoning when it helps justify the direction; it is not surfaced as a gate or a question.
