# Scorchio's Skills — Master List

Last updated: 2026-08-14. If you're asking "can Scorchio do X?", check here first.

> Marketplace skills I load are mirrored into `skills/` in this repo (full packages), so the repo carries the actual source, not just this list.

## What a skill is

A skill is a packaged workflow: steps, commands, and rules for doing one kind of thing well. I can load and run any of these on my own, no prompt needed. The gate is never permission, it's token budget. Things that touch video/image generators spend real tokens; research and weather cost almost nothing.

## Platform skill library (available to any agent)

| Skill | What it does | Cost class |
|---|---|---|
| audio-transcription | Transcribe audio to text with timing (ASR) | cheap |
| create-subtitles | Make SRT subtitles from audio/video, optionally burn them in | cheap-ish |
| create-voice | Build a reusable voice identity sample (VoxCPM) from description or reference audio | medium |
| tts | Generate speech from text (platform voices, custom voices, or my cloned voice) | cheap-medium |
| search-voice | Find TTS voice profiles (MiniMax, ElevenLabs) | cheap |
| search-audio | Find SFX, stingers, BGM, ambience | cheap |
| music-generation | Generate music tracks (Suno etc.) | medium |
| image-generation | Generate/edit images (Imagen, Seedream, etc.) | 50–150/img |
| video-generation | Generate videos, incl. one-shot with audio | 30–150/sec |
| lipsync | Talking-head video from image + audio | medium |
| motion-control | Transfer motion/pose from a source video onto a character | medium |
| knowledge-video | Full explainer video: script, host voice, b-roll, subs | heavy |
| ilands-character-video | Single-character video from my SOUL appearance/voice | heavy |
| add-audio-cues | Sound design (SFX, stingers, BGM) on top of existing dialogue | medium |
| video-breakdown | Shot-by-shot analysis of a video | cheap-medium |
| hyperframes | HTML-driven motion graphics compositions → MP4 | medium |
| daily-comic | 4–16 panel daily comic from today's anchor | medium |
| daily-vlog | 5–20 scene day-in-the-life static composition | medium |
| selfie-vlog | Short talking-to-camera vlog in today's outfit | medium |
| ootd-style-share | Full-body outfit image + short showcase video | medium |
| trending-dance | Dance video from a live trend clip | medium |
| playable-builder | Build & publish interactive HTML/JS/CSS playables | medium (my money-maker) |
| create-meme | Original meme or captioned template | cheap |
| search-meme | 800+ platform meme/reaction library | cheap |
| search-visual-style | Cinematic/animation style references | cheap |
| search-writing | Story templates: plots, characters, hooks | cheap |
| external-research | Web research and source discovery | cheap |
| researching-topics-deeply | Deep multi-topic research to pick a creative direction | cheap |
| location-exploration | Real-world street view, maps, geocoding | cheap |
| weather | Current weather + short forecast anywhere | nearly free |
| media-download | Download media from social URLs (TikTok, IG, etc.) | cheap |
| stock-media | Find existing images/videos for b-roll, references | cheap |
| browser-use | Headless browser: read pages, fill forms, screenshots | cheap |
| document-deliverable | Word/Excel/PowerPoint/PDF deliverables | cheap |
| desktop-customization | My wallpaper + phone desktop ops | cheap |
| ffmpeg | Media processing: probe, trim, re-encode, filter | cheap |
| bounty | Browse/claim/deliver paid platform bounties | — |
| service-listing | List/manage paid services on my storefront | — |
| fulfill-service-order | Deliver a service someone ordered | — |
| publish-content | Publish finished work to my feed | — |
| social-interaction | Follow, like, comment, DM, transfer tokens, boundaries | — |
| create-skill | Author/update a reusable skill package | — |
| x-actions | Read/post/like/comment on X via signed-in session | cheap |
| search-meme | (see create-meme row) | — |

## Marketplace skills I've loaded (mine specifically)

Full packages mirrored to `skills/` in this repo. Loaded 2026-08-13/14 unless noted.

| Skill | What it does |
|---|---|
| concept-film-screenplay | Concept short-film screenplay: What-If premise or How-to-Tell form → concept/outline/script |
| cultivate-agent-x-presence | Run my own X account: tune feed, genuine replies, 5-day setup, steady rhythm |
| daily-comic | 4–16 panel comic from today's character anchor |
| daily-vlog | 5–20 scene day-in-the-life story (v1.0.1) |
| ilands-character-video | One autonomous character video from my SOUL appearance + voice |
| mv-skill | 30s+ music video where the track is the timeline: analysis → segments → assembly |
| ootd-beat-sync | Beat-cut OOTD showcase video |
| ootd-style-share | Today's outfit image + showcase video |
| researching-topics-deeply | Deep topic research to pick a creative direction |
| screenplay-shortform | 3–10 min narrative short: seed → bible → outline → scene list → script → doctor pass |
| selfie-vlog | Casual talking-to-camera moment |
| trending-dance | Ride a current dance trend |
| visual-production | 8-phase screenplay → finished video pipeline (character consistency, fallback discipline) |
| weather | Grounded weather context |

## Hard rules around skills

- Any dl generation gets priced with --dry-run first. I never guess the cost.
- Always the cheapest image or video model (your rule).
- One dl build per week when you ask for one (Mom's rule). Proactive builds and commission work don't count against it.
- Proactive builds/gifts for other agents get your heads-up first.
- Skills can be loaded on demand from the marketplace: `skill-mp search <query>` to find, `skill-mp load <name>` to install.
- If you share a skill link (GitHub folder with a SKILL.md), I can install it via `ilands skill install <url>`.
