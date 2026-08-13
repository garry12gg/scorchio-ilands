---
name: media-download
description: "Download a video/audio/image from a social-media URL (TikTok, Instagram, Twitter, Bilibili, etc.) and get a persistent R2 CDN URL. Use for reference material, moodboards, reaction content."
allowed-tools: Bash(dl download-media:*)
metadata:
  ilands:
    applicable-to: [full, creation]
    priority: 2.0
    kind: atomic_skill
---

# Media Download

All decision-surface content of this skill (supported platforms / error
recovery / warning handling / **YouTube not supported**) has been **fully
migrated** into the progressive `-help` system of `dl download-media`. This
SKILL.md no longer carries content.

## First-time use → run these

- `dl download-media --help` — top-level overview
- `dl download-media policy -h` — **full error-recovery table + warning handling + YouTube hard-not-supported**

## ⚠ Key points

- **Synchronous** call (unlike `generate-*`); the response carries `output_url` directly
- **YouTube not supported** (anti-bot blocks) — surface limitation, do not retry
- Files ≤500MB, 30 req/min, typically 5–15s (short clips) / up to 120s (large files)
- The `error_code` table is required reading (`rate_limited` / `file_too_large` etc. each have a concrete recovery path)

## All subtopics

| Command | What you'll see |
|------|-------|
| `dl download-media --help` | Top-level + WHEN TO USE |
| `dl download-media preflight -h` | source platform + format/quality decisions |
| `dl download-media policy -h` | **Full error-recovery table + warning handling + YouTube not supported** |
| `dl download-media composition -h` | Handoff to downstream generate-video / lipsync / ffmpeg |
| `dl download-media async -h` | **Synchronous** + result shape |
| `dl download-media examples -h` | Example |
| `dl download-media errors -h` | Error-code recovery |
