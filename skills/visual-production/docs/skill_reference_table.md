# Skill Reference Table

| Need | Use | Notes |
|---|---|---|
| Style inspiration | `search-visual-style` | Optional in Phase 01. Use internally; do not expose internal template ids in artifacts. |
| Base reference images | `image-generation` | Required in Phase 03 for characters, locations, and selected objects. |
| Video model capability matrix | `video-generation` | Load at the start of Phase 04 before selecting segment models. |
| Character/IP registration | register-asset operation | Required for Seedance 2.0 real-person/IP references and any model that needs asset ids. |
| Keyframes / first frames | `image-generation` | Phase 05, default to the strongest multi-reference image model available. |
| Segment videos | `video-generation` | Phase 07, one video per segment. Mixed models are allowed. |
| Concatenation and audio mix | `ffmpeg` | Phase 08 base concat and optional BGM mix. |
| BGM | `music-generation` | Optional. If BGM is enabled, Phase 08.3 audio cues must skip BGM and AMB classes. |
| Sound effects | `add-audio-cues` | Optional. Use SFX and stinger transients when BGM already exists. |
| Subtitles | `create-subtitles` | Optional ASR and default burned-in subtitles. |
| Intro/outro | `remotion` | Optional rendered wrappers. |
