# Phase 01: Audio Analysis

## Goal

Produce a verified `audio_analysis` artifact from `music_url`.

## Required Inputs

- `music_url`
- `ARTIFACT_CONTRACT_PATH`

## Preflight Reads

The first non-`read` action must not be `transcribe` / `analyze_beats` / `artifact write` /
`artifact finalize`. Complete the following first:

1. Confirm `ARTIFACT_CONTRACT_PATH` came from a `read` of the root `schemas/artifact_contract.json`;
   if not, stop and read it first.
2. `schemas/audio_analysis.schema.json` (same skill root)
3. `phases/01-audio-analysis/templates/audio_analysis.minimum.json`
4. When beat-anchor selection is needed: `phases/01-audio-analysis/templates/beat_anchor_exec.md`
   (companion script `phases/01-audio-analysis/scripts/select_beat_anchors.py`)
5. When vocals are present or uncertain: the absolute path of `audio-transcription/SKILL.md`
   from `<available_skills>` (must be read before the first transcribe call)

Only after reading all of the above may you call transcribe / analyze_beats / write / finalize.

## Step 1 — Transcribe (when vocals are present or uncertain)

Each command in its own Bash call.

```bash
dl transcribe \
  --audio-url="<music_url>" \
  --language=auto \
  --word-timestamps
```

## Step 2 — Analyze beats (mandatory)

```bash
dl analyze-beats \
  --audio-url="<music_url>"
```

When beat-anchor selection is needed, run `scripts/select_beat_anchors.py` via `dl script exec`
following the template in `templates/beat_anchor_exec.md`.

## Step 3 — Write draft → Self-check lyrics table → Finalize (draft-first)

1. First `dl artifact write` to write audio_analysis as a draft (not yet promoted):

```bash
cat <<'EOF' | dl artifact write --slot=audio_analysis --content-type=application/json --contract='<ARTIFACT_CONTRACT_PATH>' --content-file=-
<audio analysis JSON>
EOF
```

2. Self-check the **line-by-line lyrics timetable from the draft** (read it back as a table — each row: index | start | end | lyric text) — what you verify is the actual persisted transcription, not a manually crafted table. Confirm every lyric line has a `text` + `start` + `end`, boundaries are monotonic, and the times track the audio structure. If something is off → `dl artifact write` to overwrite the draft, then re-verify.

3. Only promote after the self-check passes:

```bash
dl artifact finalize --slot=audio_analysis --mode=verify_and_promote \
  --contract='<ARTIFACT_CONTRACT_PATH>'
```

> After finalize promote succeeds, proceed to the next step: Phase 02 first resolves several creative decisions (MV type / tone-mood / video model / visual instructions) from the brief, then combines this song + lyrics to produce logline + brief + segment list.

## Operational Rules

- **`dl analyze-beats` is mandatory and must not be skipped**. It uses MADMOM under the hood, producing
  `beats.positions[]` (precise beat points) + `beats.bpm` + total duration (written to top-level `duration`).
  These beat points are critical anchors for downstream lyric-time snap calibration and Phase 02 segment boundary frame alignment.
- `transcribe` and `analyze_beats` are synchronous `dl <verb>` actions.
  They are synchronous — do not add `--no-wait` and do not follow them with `dl poll`.
- If the track contains vocals or vocals are uncertain, transcription is
  mandatory. Do not skip ASR just because the lyrics seem simple.
- In a vocal or uncertain-vocal track, do not call `transcribe` until both
  `audio_analysis.minimum.json` and `audio-transcription/SKILL.md` have been
  read in this phase.
- When transcribing, always request `word_timestamps:true`. If the provider
  still omits word timings after a real attempt, preserve the best available
  segment timings and carry that limitation forward explicitly.
- If ASR returns real `segments`, `words`, or equivalent timing arrays, persist
  those real arrays into `audio_analysis`. Do not collapse them to empty arrays
  or summary prose just to make the slot smaller.
- If beat analysis returns real beat locations or strength arrays, preserve the
  real beat positions needed downstream. Do not write `beats.positions: []`
  unless the tool truly returned no usable beat positions after a real attempt.
- Always include a lightweight `track` object with `title`, `genre`, `tags`,
  and `model`. This is the selected source-track metadata used by downstream
  music-list renderers, not a second music artifact.
- **emotional_arc**: When writing audio_analysis, fill in a one-sentence overall emotional trajectory for the entire piece (synthesizing song structure `beats.sections` + lyrics), e.g. `intro calm → verse restrained → chorus explosive → outro release`. Downstream Phase 02 creative intake uses this as the data starting point for the emotional north star. Schema optional but recommended.
- **ASR failure fallback chain (mandatory for vocal tracks, must not be skipped)**:
  1. ASR first failure → retry once (transient error)
  2. Still fails → **obtain lyrics text** (by priority):
     - Check if music generation results (Suno / music candidate) already returned lyrics → use directly
     - If lyrics are otherwise available in the creation context / brief → use them
  3. After obtaining lyrics, use `--transcript-text` for time alignment:
     ```bash
     dl transcribe \
       --audio-url="<music_url>" \
       --transcript-text="<lyrics from music-gen result / context>" \
       --word-timestamps
     ```
  4. `--transcript-text` also fails (returns single segment or word-level timestamps unusable) →
     Use `understand_media` to listen segment by segment, marking start/end times for each lyric line;
     results are likewise written into `audio_analysis.transcription.segments`
  5. Listening test also cannot be completed → mark as blocker, do not write empty transcription and continue
  **Prohibited**: After ASR failure, manually estimating segment boundaries or writing empty segments to continue to subsequent phases.
  Empty transcription is only legal when confirmed to be a purely instrumental track.
- If the track is instrumental, keep a schema-valid degraded transcription
  object such as empty `text`, empty `segments`, and a concrete language
  marker like `und`.
- If beat analysis fails, preserve the best available duration and rough tempo
  estimate rather than leaving required beat fields missing.
- Derive `track.title`, `track.genre`, `track.tags`, and `track.model` from the
  source metadata, provider response, filename, or user brief. If exact values
  are unavailable, use concise placeholders such as `track`, `unknown`, and an
  empty `tags` array instead of omitting the object.
- When ASR timestamps drift noticeably against the musical structure, reconcile
  obvious boundary issues before writing the slot. Phase 02 segment splitting uses
  word-level timestamps + beat positions + sections together for judgment; a separate
  `timing_audit` field is not needed.
- Artifact write and finalize commands must be direct top-level Bash commands.
  Never call them from Python subprocesses or shell wrappers.
- After audio_analysis is written as a draft (draft-first), self-check the line-by-line lyrics timetable
  from the draft (read it back and verify against the audio). Only after the self-check passes: `dl artifact finalize --slot=audio_analysis --mode=verify_and_promote`.
  Before finalize succeeds, audio_analysis is still a draft — do not proceed to Phase 02 based on it; to make changes → `dl artifact write` to overwrite the draft.
- Do not announce "Audio Analysis verified" or claim exact timing coverage
  unless the actual artifact finalize result succeeded and the persisted slot
  still contains the real timing data.
- If either artifact call fails, `audio_analysis` is not produced. Stop and
  surface the blocker; do not continue to Phase 02 by manually tracking the
  would-be artifact in memory or temp files.

## Do Not Proceed Unless

- `ARTIFACT_CONTRACT_PATH` came from an explicit `read` of the root
  `schemas/artifact_contract.json`, not from a guessed path string.
- `phases/01-audio-analysis/templates/audio_analysis.minimum.json` was read
  before the first `transcribe`, `analyze_beats`, or artifact call.
- `audio_analysis` has been written and `dl artifact finalize --mode=verify_and_promote`
  returns a promoted result.
- Top-level `music_url` and `duration` are both filled in.
- `beats.bpm` and `beats.positions[]` are both filled in.
- `track.title`, `track.genre`, `track.tags`, and `track.model` are present.
- For vocal or uncertain-vocal tracks, the transcription request used
  `word_timestamps:true`, and `audio-transcription/SKILL.md` was read before
  the transcription call.
- For tracks with vocals, `transcription.segments` **must not be empty**. If ASR fails,
  the `--transcript-text` fallback (using lyrics from the music-gen result / context) must be followed; empty segments
  cannot be used to pass.
- **Segment granularity = one segment per lyric line** (not one per section).
  Each segment must contain: the lyric text for that line + `start` + `end` timestamps.
  Section-level granularity (verse_1 / chorus_1) does not meet downstream Phase 02 segmentation needs.
  When using `understand_media` for listening tests, line-by-line annotation is likewise required —
  do not annotate only section boundaries.
- **Lyrics timetable must be written into the artifact**: Line-by-line lyric timestamps must be written into
  `audio_analysis.transcription.segments`, with each segment containing
  `text` (lyric text) / `start` / `end`. Instrumental passages / interludes must also be written as
  segments (`text` annotated as `[instrumental]` / `[interlude]` etc.).
  **Do not merely recite the timetable in conversation without persisting it to the artifact.**
- **Lyrics timetable self-check (draft-first)**: After `dl artifact write` creates the draft, before `finalize`,
  the agent **must** read back the complete line-by-line lyrics timetable from the draft as a table
  (each row: index | start | end | lyric text) and verify it against the audio (every line has text + start + end, boundaries monotonic, times track the structure).
  Only after the self-check passes may you finalize promote. Do not merely assert "N lines complete" and skip the read-back verification,
  and do not verify only after finalize.

## Output Slot

- `audio_analysis` (promoted)

## Next Phase Entry

After `audio_analysis` promote succeeds, read
`phases/02-creative-proposal/PHASE.md` from the same skill root.
