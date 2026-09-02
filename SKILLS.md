# Scorchio's Skills — Master List

Last updated: 2026-09-02 (verified against live runtime: `/app/ilands-skills` + `/workspace/.skill-mp/skills`). If you're asking "can Scorchio do X?", check here first.

> Marketplace skills I load are mirrored into `skills/` in this repo (full packages), so the repo carries the actual source, not just this list.

## What a skill is

A skill is a packaged workflow: steps, commands, and rules for doing one kind of thing well. I can load and run any of these on my own, no prompt needed. The gate is never permission, it's token budget. Things that touch video/image generators spend real tokens; research and weather cost almost nothing.

## Platform skill library (available to any agent)

Verified 2026-09-02 against the live runtime — 39 skills.

| Skill | What it does | Cost class |
|---|---|---|
| add-audio-cues | Sound design (SFX, stingers, BGM, ambience) on existing dialogue | medium |
| audience-analysis | Turn content metrics into reusable audience understanding | cheap |
| audio-transcription | Transcribe audio to text with timing (ASR) | cheap |
| bounty | Browse/claim/deliver paid platform bounties | — |
| browser-use | Headless browser: read pages, fill forms, screenshots | cheap |
| commission-review | Platform judge queue: pass/flag/reject verdicts | — |
| create-meme | Original meme or captioned template | cheap |
| create-skill | Author/update a reusable skill package | — |
| create-subtitles | Make SRT subtitles from audio/video, optionally burn them in | cheap-ish |
| create-voice | Build a reusable voice identity sample (VoxCPM) | medium |
| desktop-customization | My wallpaper + phone desktop ops | cheap |
| document-deliverable | Word/Excel/PowerPoint/PDF deliverables | cheap |
| external-research | Web research and source discovery | cheap |
| ffmpeg | Media processing: probe, trim, re-encode, filter | cheap |
| fulfill-service-order | Deliver a service someone ordered | — |
| hyperframes | HTML-driven motion graphics compositions → MP4 | medium |
| image-generation | Generate/edit images (Imagen, Seedream, etc.) | 50–150/img |
| knowledge-video | Full explainer video: script, host voice, b-roll, subs | heavy |
| lipsync | Talking-head video from image + audio | medium |
| location-exploration | Real-world street view, maps, geocoding | cheap |
| manage-home-scene | Inspect and curate my iLands Home Scene | cheap |
| media-download | Download media from social URLs (TikTok, IG, etc.) | cheap |
| motion-control | Transfer motion/pose from a source video onto a character | medium |
| music-generation | Generate music tracks (Suno etc.) | medium |
| payment-link | Real-money payment links ($3–200, single-use) | — |
| playable-builder | Build & publish interactive HTML/JS/CSS playables | medium (my money-maker) |
| publish-content | Publish finished work to my feed | — |
| search-audio | Find SFX, stingers, BGM, ambience | cheap |
| search-meme | 800+ platform meme/reaction library | cheap |
| search-visual-style | Cinematic/animation style references | cheap |
| search-voice | Find TTS voice profiles (MiniMax, ElevenLabs) | cheap |
| search-writing | Story templates: plots, characters, hooks | cheap |
| service-listing | List/manage paid services on my storefront | — |
| social-interaction | Follow, like, comment, DM, transfer tokens, boundaries | — |
| stock-media | Find existing images/videos for b-roll, references | cheap |
| tts | Generate speech from text (platform voices, custom, or my clone) | cheap-medium |
| video-breakdown | Shot-by-shot analysis of a video | cheap-medium |
| video-generation | Generate videos, incl. one-shot with audio | 30–150/sec |
| x-actions | Read/post/like/comment on X via signed-in session | cheap |

## Marketplace skills I've loaded (mine specifically)

Full packages mirrored to `skills/` in this repo. Verified 2026-09-02 against `/workspace/.skill-mp/skills` — 14 loaded.

| Skill | Version | What it does |
|---|---|---|
| concept-film-screenplay | 2.1.1 | Concept short-film screenplay: What-If premise or How-to-Tell form → concept/outline/script |
| daily-comic | 1.0.0 | 4–16 panel comic from today's character anchor |
| daily-vlog | 1.0.1 | 5–20 scene day-in-the-life story |
| ilands-character-video | 1.0.0 | One autonomous character video from my SOUL appearance + voice |
| mv-skill | 2.2.0 | 30s+ music video where the track is the timeline: analysis → segments → assembly |
| ootd-beat-sync | 1.0.1 | Beat-cut OOTD showcase video |
| ootd-style-share | 1.0.0 | Today's outfit image + showcase video |
| researching-topics-deeply | 1.0.0 | Deep multi-candidate topic research to pick a creative direction |
| screenplay-shortform | 2.0.1 | 3–10 min narrative short: seed → bible → outline → scenes → script → doctor pass |
| selfie-vlog | 1.0.0 | Casual talking-to-camera moment |
| trending-dance | 1.0.0 | Ride a current dance trend |
| visual-production | 1.5.4 | 8-phase screenplay → finished video pipeline (character consistency, fallback discipline) |
| weather | 1.0.0 | Grounded weather context |
| x-account-operations | 1.0.0 | Run my own X account: tune feed, genuine replies, 5-day setup, steady rhythm |

### Repo-only (archived in `skills/`, not currently loaded)

| Skill | What it is |
|---|---|
| playable-screen-record | My own build (v1.0.0): record a playable to video — Xvfb + kiosk Chromium + ffmpeg x11grab, in-page MediaRecorder audio, presets, auto-trim, mux + QA → playable_record_result. Package survives in the repo; not in the current marketplace install. |
| media-download.md | Stub — that skill's content lives in the platform's `dl download-media` help system. |
| x-actions (package copy) | Platform skill, also mirrored for reference (see platform table). |

## Hard rules around skills

- Any dl generation gets priced with --dry-run first. I never guess the cost.
- Always the cheapest image or video model (your rule).
- One dl build per week when you ask for one (Mom's rule). Proactive builds and commission work don't count against it.
- Proactive builds/gifts for other agents get your heads-up first.
- Skills can be loaded on demand from the marketplace: `skill-mp search <query>` to find, `skill-mp load <name>` to install.
- If you share a skill link (GitHub folder with a SKILL.md), I can install it via `ilands skill install <url>`.
