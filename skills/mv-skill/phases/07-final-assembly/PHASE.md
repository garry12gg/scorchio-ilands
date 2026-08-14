# Phase 07: Final Assembly (Concat + Original Audio Track Overlay)

## Role Assignment

- **Main Agent**: Pre-flight check → launch sub-agent → verify final video → FINALIZE SELF-CHECK
- **Sub-agent**: in clean context, read `ffmpeg/SKILL.md` then ffprobe-validate assembly clips + concat + audio overlay

## Goal

Validate all `video_segments.segments[].assembly_video_url` in timeline order, concat them → overlay the entire audio track using `audio_analysis.music_url` → output `final_video`.

**An MV is visuals set to a song — the original audio track is overlaid in full, no mixing.** No BGM mixing, no volume adjustment, no fade-in/fade-out.

Phase 06 has already produced precisely trimmed, audio-free, uniformly formatted `assembly_video_url` clips. Phase 07 does not re-trim or re-normalize individual segments; if an assembly clip is non-conforming, go back to Phase 06 to fix it.

This phase produces a **clean visual version** of the final video (no subtitles). After the final video is locked, Step 4 lets the agent **decide whether to add subtitles** — if it judges them warranted, read the `create-subtitles` skill to proceed (subtitles are layered on top of `final_video`, the clean final video is not modified). See Step 4.

## Required Inputs

- `video_segments` (promoted) — contains segments[]
- `audio_analysis` (promoted) — provides music_url + duration
- `visual_config` (promoted) — provides aspect_ratio
- `creative_proposal` (promoted) — provides per-segment duration (for validation)
- `ARTIFACT_CONTRACT_PATH`

## Preflight Reads (Main Agent)

1. Read `schemas/final_video.schema.json`
2. Read `phases/07-final-assembly/templates/final_video.minimum.json`
3. Read promoted `video_segments` / `audio_analysis` / `visual_config` / `creative_proposal`

## Pre-flight Check (Main Agent)

- If any segment has `video_segments.segments[i].status == "failed"` → **STOP**, go back to Phase 06 to handle it. Phase 07 does not accept failed segments.
- `video_segments.segments.length == creative_proposal.segments.length`
- Every segment's `assembly_video_url` is non-null

## Step 1 — Launch Sub-agent (ffprobe + concat + overlay)

Main agent launches a clean-context sub-agent task:

```
Task: Concat the assembly_video_url entries from video_segments into final_video.

Required reading:
1. ffmpeg/SKILL.md from <available_skills>
2. promoted video_segments / audio_analysis / visual_config / creative_proposal

Execution steps:

A. ffprobe each `assembly_video_url`:
   Probe video_segments.segments[i].assembly_video_url one by one for width / height / fps / SAR /
   codec / video stream duration / audio stream.

   Must satisfy:
   - No audio stream
   - Video duration differs from creative_proposal.segments[i].duration by < 0.05s
   - resolution == visual_config.resolution
   - codec / fps / SAR / pixel format are uniform across all segments (SAR=1, yuv420p)

   Any failure → STOP, return to main agent, request going back to Phase 06 to regenerate / reprocess that segment.

B. Concat video:
   Generate concat list file:
     file '<seg_01_assembly.mp4>'
     file '<seg_02_assembly.mp4>'
     ...
   Use dl ffmpeg:
     ffmpeg -f concat -safe 0 -i list.txt -c copy concat_video.mp4
   (All assembly clips have been unified to the same codec/fps/SAR by Phase 06, so -c copy lossless concat is possible)

C. Post-concat drift policy:
   ffprobe concat_video.mp4 duration:
   - concat_video_duration = ffprobe(concat_video.mp4)
   - target_audio_duration = audio_analysis.duration
   - drift = concat_video_duration - target_audio_duration

   Tiered handling:
   - |drift| ≤ 0.1s → overlay original audio track directly, `audio_adjustment_ran=false`
   - 0.1s < |drift| ≤ 1.0s → allow minor linear compensation:
     `atempo_factor = target_audio_duration / concat_video_duration`
     Apply `-filter:a "atempo=<factor>"` to the original audio track during overlay
   - |drift| > 1.0s → STOP, do not overlay. Return to main agent, identify the segment with the largest deviation between assembly duration and creative_proposal.segments[i].duration, request going back to Phase 06 to check the source video

   `atempo_factor` must be within ffmpeg atempo's supported range (0.5-2.0); if out of range, STOP.

D. Original audio track overlay:
   When atempo is not needed:

   ffmpeg -i concat_video.mp4 -i <audio_analysis.music_url> \
     -map 0:v -map 1:a \
     -c:v copy -c:a aac -b:a 192k \
     -shortest \
     final_video.mp4

   When atempo is needed:

   ffmpeg -i concat_video.mp4 -i <audio_analysis.music_url> \
     -map 0:v -map 1:a \
     -c:v copy -filter:a "atempo=<atempo_factor>" -c:a aac -b:a 192k \
     -shortest \
     final_video.mp4

   Notes:
   - -map 0:v takes only the concat video stream
   - -map 1:a takes only the original audio track
   - -shortest uses the shorter of video and audio (handles 0.1s-level frame jitter)
   - atempo is only enabled for 0.1s-1.0s minor drift, used to compensate for cumulative segment frame-granularity drift
   - No mixing / no fade / no volume adjustment

E. Return to main agent **must include audit trail**:

   ```json
   {
     "video_url": "https://.../final_video.mp4",
     "duration": 132.40,
     "audit_trail": {
       "drift_check_ran": true,
       "assembly_segment_durations": [5.88, 4.55, 5.97, ...],
       "sum_segments_duration": 132.40,
       "concat_video_duration": 132.40,
       "audio_analysis_duration": 132.40,
       "cumulative_drift": 0.03,
       "drift_within_tolerance": true,
       "drift_policy": "direct_overlay | atempo_overlay",
       "audio_adjustment_ran": false,
       "atempo_factor": null,
       "assembly_validation_ran": true,
       "concat_command": "ffmpeg -f concat ...",
       "audio_overlay_command": "ffmpeg ... -map 0:v -map 1:a -shortest ..."
     }
   }
   ```

   Any missing field in audit_trail → main agent rejects the output.
```

> Phase 07 does not perform per-segment ffmpeg normalization / trimming. Concat and overlay are each a single ffmpeg call.

## Step 2 — Main Agent Verifies Final Video

After the sub-agent completes, the main agent checks:

0. **[v1.0.17] Audit trail completeness (must verify first)**: the `audit_trail` object returned by the sub-agent must contain all fields:
   - `drift_check_ran: true` (must be true; false = immediate rejection)
   - `assembly_segment_durations: [N numeric values]` (length == segment count)
   - `sum_segments_duration: <numeric value>`
   - `concat_video_duration: <numeric value>`
   - `audio_analysis_duration: <numeric value>`
   - `cumulative_drift: <numeric value>` (== concat_video_duration - audio_analysis_duration)
   - `drift_within_tolerance: true` (≤0.1s direct or ≤1.0s atempo handled; false = reject, go back to Phase 06)
   - `drift_policy` (direct_overlay / atempo_overlay)
   - `audio_adjustment_ran: true|false`
   - `atempo_factor: number|null`
   - `assembly_validation_ran: true` / `concat_command` / `audio_overlay_command`

   Any missing field or false → **reject sub-agent output**, do not proceed to subsequent checks 1-7. Force the sub-agent to run the complete flow and attach the audit trail.

   Rationale for audit trail enforcement: every check the sub-agent ran + result values must be explicitly reported; the main agent cannot assume "the sub-agent should have run it". Phase 06 assembly validation / Phase 07 cumulative drift check must be surfaced to the main agent and cannot remain invisible inside the sub-agent.

1. `final_video.duration` aligns with audit trail: for direct overlay ≈ `audio_analysis.duration` (tolerance < 0.1s); for atempo overlay ≈ `concat_video_duration` (tolerance < 0.1s)
2. `final_video.aspect_ratio == visual_config.aspect_ratio`
3. `final_video.resolution == visual_config.resolution`
4. `final_video.audio_track_url == audio_analysis.music_url` (audio track source matches; if `audio_adjustment_ran=true`, audit trail must record the atempo factor)
5. `final_video.total_segments == video_segments.segments.length` (field name kept for compatibility, value = total segment count)
6. `assembly_segment_durations.length == video_segments.segments.length`, and each segment's assembly duration differs from creative_proposal duration by < 0.05s
7. **Spot check (≤3 time points)**: final video is playable, audio-visual sync is correct (especially lipsync segments), aspect ratio is correct
8. **Sync integrity check (added in v1.0.4)**: besides the first and last points, must spot-check **middle + later segments** (e.g., 50% / 75% time points). Cumulative drift typically only manifests in the middle-to-late segments — checking only the beginning and end will miss it. Lip shape vs. word timing offset > 0.1s in lipsync segments is considered out of sync

Any failure → have the sub-agent fix it, do not proceed to FINALIZE with known issues.

## Step 3 — FINALIZE SELF-CHECK

First `dl artifact write` to save final_video as a draft (not yet promoted):

```bash
cat <<'EOF' | dl artifact write --slot=final_video --content-type=application/json --content-file=-
{ ... }
EOF
```

Then read back the **actual content of the draft** and self-check it against the brief (the URL / duration / poster below all come from the draft — draft-first):

```
Final Video generated:

URL: https://.../final_video.mp4
Duration: 67.84s (direct overlay: == audio duration; atempo overlay: == concat video duration)
Aspect: 16:9
Resolution: 720p
Total segments: 28 (all confirmed / degraded)
Audio: original audio track overlaid in full (no BGM mix)
Timing: direct overlay / atempo 0.99546 (shown only when minor drift compensation is applied)

Preview: [poster thumbnail]
```

Self-check the final cut against the brief (plays cleanly, audio-visual sync correct especially on lipsync segments, aspect / resolution match), then decide:
- **Pass** — the final cut serves the brief and meets the criteria → finalize promote (draft is already written).
- **A segment's video is unsatisfactory** → go back to Phase 06 to regenerate that segment, this phase restarts.

> After the final video is locked, the agent decides in Step 4 whether to add subtitles.

On pass → finalize promote (draft is already written):

```bash
dl artifact finalize --slot=final_video --mode=verify_and_promote \
  --contract='<ARTIFACT_CONTRACT_PATH>'
```

## Step 4 — Wrap-up: Subtitles (optional) + Publishing Assets (optional Phase 08)

After `final_video` is promoted (clean visual version locked), the agent decides what to do next (all optional, can choose any combination, from its creative intent):

```
Final video is locked (clean version, no subtitles): <final_video.video_url>

Wrap-up options (all optional):
- Add subtitles → proceed with create-subtitles skill
- Generate cover + social copy → proceed to Phase 08
- Nothing further → workflow ends
```

- Subtitles warranted → **read `create-subtitles` skill**, input `final_video.video_url`, it handles subtitles on top of the final video. All subtitle logic lives in that skill; this phase does not inline it or write back to `final_video` (the clean version stays unchanged; subtitles are a derivative on top of it).
- Cover + social copy warranted → proceed to `phases/08-cover-social/PHASE.md` (produces social_kit: cover image + social copy).
- Nothing further → workflow ends (final_video is already the minimum viable deliverable).

## Operational Rules

- **This phase handles concat + original audio track overlay + subtitle handoff inquiry.** Subtitles themselves / intros & outros / BGM mixing are all out of scope.
- **Subtitles = work for an independent atomic skill**: after the final video is locked, the agent decides whether to add subtitles; if warranted, read the `create-subtitles` skill to proceed (input `final_video.video_url`). All subtitle logic lives in that skill; this phase does not inline it or implement a v1/v2 dual-layer within the phase.
- **Clean final video is promoted once and done**: `final_video` is always the subtitle-free clean version; subtitles are produced by create-subtitles on top of it, and are not written back to this phase's final_video.

## Do Not Proceed Unless

- All `video_segments.segments[i].status != "failed"`
- Final video duration / aspect / resolution / audio_track are all cross-artifact consistent
- Final video spot-check confirms playability + audio-visual sync
- FINALIZE SELF-CHECK passed
- `dl artifact finalize --mode=verify_and_promote` succeeds

## Output Slot

- `final_video` (promoted, final state)

## Next Phase Entry

`final_video` is the minimum viable deliverable. Step 4 wrap-up: want subtitles → read `create-subtitles` skill to proceed; want cover + social copy → read `phases/08-cover-social/PHASE.md` (optional); want neither → workflow ends.
