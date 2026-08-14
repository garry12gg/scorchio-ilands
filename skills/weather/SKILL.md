---
name: weather
description: >-
  Fetch current weather and short-term forecast for a chosen location using
  public web sources. Use when an agent or developer needs grounded
  real-world weather context for planning, prompting, or narration. This skill
  returns a compact structured snapshot and may cache it in knowledge memory
  for short-lived reuse. Do NOT use for historical climate analysis,
  severe-weather alerting, or aviation / marine forecasts.
allowed-tools: Bash(dl fetch:*) Bash(ilands context-find:*) Bash(ilands context-write:*)
metadata:
  ilands:
    applicable-to: [full]
    priority: 2.0
    kind: atomic_skill
---

# Weather

This is a capability skill, not a product workflow. Its job is to fetch and
normalize a weather snapshot for a specific location, then optionally cache
that snapshot for short-term reuse.

## When to Use

Load this skill when weather context would materially improve the next step:

- grounding a prompt, scene, or outfit in real conditions
- adding factual environmental context to narration or copy
- checking current conditions in a target city before planning content
- looking up a short-term forecast to inform near-future decisions

Do not load this skill just to answer a vague mood question or to perform
historical / alert-grade weather analysis.

## Output Shape

This skill does not require an artifact contract. It returns a compact
working-memory snapshot and may also write a cache entry to knowledge memory.

Use this normalized shape:

```json
{
  "location": "Shanghai",
  "resolved_location": "Shanghai",
  "fetched_at": "2026-04-21T18:30:00+08:00",
  "provider": "wttr.in",
  "condition": "Partly cloudy",
  "temp_c": 18,
  "feels_like_c": 17,
  "wind_kph": 12,
  "humidity_pct": 62,
  "precip_mm": 0.0,
  "today_max_c": 21,
  "today_min_c": 14,
  "today_chance_of_rain_pct": 20,
  "sunset_local": "18:34"
}
```

## Recommended Flow

### 1. Normalize the location

Choose a concrete city or airport code. Prefer English city names or
URL-friendly tokens such as `Shanghai`, `New+York`, `Tokyo`, or `CDG`.
If the location is ambiguous, disambiguate it before fetching.

### 2. Check short-lived cache first

If repeated lookups are likely, check knowledge memory before hitting the
network:

```bash
ilands context-find --query="weather/{city}/{YYYY-MM-DD}" --top-k=1
```

If a recent cache entry is present and still fresh enough for the caller, reuse
it.

### 3. Fetch structured weather

Primary path:

```bash
dl fetch --url="https://wttr.in/{location}?format=j1"
```

Extract only the fields needed for downstream use:

- `current_condition[0].weatherDesc[0].value`
- `current_condition[0].temp_C`
- `current_condition[0].FeelsLikeC`
- `current_condition[0].windspeedKmph`
- `current_condition[0].humidity`
- `current_condition[0].precipMM`
- `weather[0].maxtempC`
- `weather[0].mintempC`
- `weather[0].astronomy[0].sunset`

Optional fallback when the primary source fails:

```bash
dl fetch --url="https://api.open-meteo.com/v1/forecast?latitude=<lat>&longitude=<lon>&current_weather=true&timezone=auto"
```

### 4. Cache for reuse

When the result is likely to be reused in the same day, write it to knowledge
memory:

```bash
ilands context-write --key="weather/{city}/{YYYY-MM-DD}" \
  --value='<normalized snapshot JSON>' \
  --type=memory
```

## Constraints

- Return a compact normalized snapshot, not the raw provider payload.
- Prefer one fetch per city per short window unless the caller explicitly needs
  a refresh.
- If the provider response is partial or fuzzy, surface that uncertainty in the
  snapshot instead of pretending the result is exact.
- Use weather as grounding context, not as a hard blocker for downstream work.

## Example Downstream Use

Instead of passing raw JSON forward, restate the weather in prompt-ready form:

- `"Rainy 12C evening in Tokyo; wet pavement, umbrellas, cool blue streetlight"`
- `"Hot 31C sunny afternoon in Los Angeles; harsh light, breathable fabrics"`
