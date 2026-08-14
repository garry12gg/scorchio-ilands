# Phase 08: Cover + Social (Cover Image + Social Copy, optional)

## When to Enter

After `final_video` is promoted, the agent decided to "Generate cover + social copy" in Phase 07 Step 4. **This phase is optional** — if publishing assets are not warranted, skip it. This does not affect the `final_video` final state (final_video is the minimum viable deliverable).

## Role Assignment

- **Main Agent**: the main agent handles everything (generate 1 cover image + write copy — small volume, no batch sub-agent needed) → write draft → Self-Check → finalize

## Goal

Produce `social_kit`: `cover_image_url` (cover / poster) + `caption` (social copy body) + optional `title` / `hashtags`. Generated based on the final video + creative proposal, tone matching `tone_mood`, echoing `logline` / core motif.

## Required Inputs

- `final_video` (promoted) — video_url (frame extraction base) / thumbnail_url
- `creative_proposal` (promoted) — logline / brief (key moment / core motif) / tone_mood / mv_type
- `visual_config` (promoted) — visual_style (cover style) / aspect_ratio
- `reference_list` (promoted) — character ref (for face-locking when generating new cover, optional)
- `ARTIFACT_CONTRACT_PATH`

## Preflight Reads (Main Agent)

1. Read `schemas/social_kit.schema.json`
2. Read `phases/08-cover-social/templates/social_kit.minimum.json`
3. Read promoted `final_video` / `creative_proposal` / `visual_config` / `reference_list`
4. Before generating cover: `<available_skills>` → `image-generation/SKILL.md` + `docs/image_prompting.md` + `pricing-and-policies/SKILL.md`

## Step 1 — Decide Cover Direction + Platform (agent decides)

The cover takes the **key moment (The One Shot)** from `brief` as the thumbnail moment. Resolve two decisions yourself:

```
Producing an MV cover + social copy.

Cover approach (pick the one that best serves the brief):
1) Generate a new cover image (based on key moment + visual_style + character ref face-lock; most controllable, cleanest result)
2) Extract a frame from the final video (extract 1 frame at the key moment timestamp, most faithful to the finished video, may have motion blur; can be enhanced with img2img afterward)

Target platform (determines cover aspect ratio + copy tone; pick from the creative intent / distribution target):
- YouTube / TikTok / Instagram / Weibo / Xiaohongshu / General
```

The platform determines the cover aspect ratio (e.g., YouTube 16:9, TikTok/Reels 9:16, Instagram 1:1 or 4:5) + copy tone.

## Step 2 — Generate Cover

**Approach A — Generate new cover** (default):

- prompt = `brief` key moment visual (composition / lighting / atmosphere) + `visual_config.visual_style.prompt_modifier` (must be appended at the end, contains style anchors). If characters are included, use positional references per `docs/image_prompting.md`, placing character outfit refs (from `reference_list.references[]`) into `image_urls` for face-locking.
- gpt-image-2 + `vendor=wavespeed_gpt_image2_vendor` + `aspect_ratio=<platform ratio>` (do not pass width/height).
- The cover may reserve a title-safe area (negative space at top / bottom); do not burn text into the image (title goes in caption / platform UI).

```bash
dl generate-image --service=gpt-image-2 --vendor=wavespeed_gpt_image2_vendor \
  --aspect-ratio=<platform ratio> --image-urls=<character ref url> --prompt="<key moment + visual_style>"
```

**Approach B — Extract frame from final video**:

```bash
cat <<'EOF' | dl ffmpeg --input src=<final_video.video_url> --output-kind image --command-file=-
ffmpeg -i /input/src -ss <key moment timestamp> -frames:v 1 /output/cover.png
EOF
```

After frame extraction, optionally use `dl generate-image` img2img enhancement (improve sharpness / color-grade to match visual_style).

Result: `cover_image_url`.

## Step 3 — Write Social Copy (Main Agent)

Based on `logline` + `brief` (core motif / main thread and subthreads) + `tone_mood` + `mv_type`, write:

- **title** (optional): short, attention-grabbing video title.
- **caption**: body text. Tone matches `tone_mood`, echoes `logline` / motif; adjusted for platform tone (TikTok / Xiaohongshu can be playful with emoji, YouTube description can be more formal). 1-3 sentence hook + optional 1 sentence of context.
- **hashtags** (optional): relevant topic tags (genre / mood / MV / motif-related).

## Step 4 — Write draft + Self-Check + finalize (draft-first)

First `dl artifact write` to save social_kit as a draft:

```bash
cat <<'EOF' | dl artifact write --slot=social_kit --content-type=application/json --content-file=-
{ "cover_image_url": "...", "title": "...", "caption": "...", "hashtags": [...] }
EOF
```

Read back the **actual content of the draft** and self-check it against tone + logline (cover thumbnail = cover_image_url from the draft, copy = actual text from the draft):

```
Publishing Assets (<platform>)

Cover: [thumbnail]

Title: <title>

Copy:
<caption>

Tags: <hashtags>
```

Self-check that the cover matches `visual_style` + the key moment and the copy matches `tone_mood` + echoes the logline, then resolve each case yourself:
- **Pass** — cover + copy serve the brief → finalize promote.
- **Cover is off** — regenerate / re-extract frame / modify prompt → go back to Step 2, overwrite the draft and re-verify.
- **Copy is off** — modify title / body / tags → overwrite the draft and re-verify.

On pass:

```bash
dl artifact finalize --slot=social_kit --mode=verify_and_promote \
  --contract='<ARTIFACT_CONTRACT_PATH>'
```

## Operational Rules

- This phase is **optional**: failure / user skip does not affect the `final_video` final state.
- Cover style must be consistent with `visual_config.visual_style`; aspect ratio follows the target platform.
- Do not burn text into the cover image — title / copy are in the caption field, overlaid by platform UI.
- **Do not write back to `final_video`** (the clean final video stays unchanged; social_kit is a publishing derivative on top of it).
- artifact write / finalize must be top-level Bash calls.

## Do Not Proceed Unless (this phase is only executed when the agent decides to produce social_kit)

- `cover_image_url` is non-empty + `caption` is non-empty
- Self-check passed
- `dl artifact finalize --mode=verify_and_promote` succeeds

## Output Slot

- `social_kit` (promoted, optional final state)

## Next Phase Entry

`social_kit` is an optional final state. After promotion, the workflow ends.
