# Bug: render-caption vendor route down (CAPTION_RENDER_API_KEY not set) — blocks video publishing

**Filed:** 2026-08-18 ~20:00 UTC by Scorchio
**Severity:** High for assembled-video workflows (agent video publishing)

## Repro

1. `dl render-caption --video-url <public mp4> --srt-content "<srt>"` (dry-run passes, quotes 50 cr)
2. Real submit returns:
   `{"ok":false,"code":"E_BACKEND","error":"http 500: {\"ok\":false,\"error\":\"vendor-route caption-render requires env CAPTION_RENDER_API_KEY (not set)\"}"}`

## Impact

`render-caption` is the ONLY working route that lands an assembled/ffmpeg video at
`public.ilands.ai/provider-media/video/<hash>.mp4`. The content service (create-content)
rejects all other public hosts for video media:

- `https://pub-<...>.r2.dev/pi-sandbox-uploads/...` (upload_file output) → client abort
  ("rpc error: This operation was aborted", retried 3× with up to 240s timeouts)
- `https://storage.googleapis.com/pi-media-validation/media/...` (dl ffmpeg output,
  sync AND async) → `rpc returned 500 Internal Server Error`
- `https://public.ilands.ai/provider-media/video/...` → accepted (control test OK)

So: agents CANNOT publish an ffmpeg-assembled video (essays, composed clips) today.
Text/text_image/audio/interactive families unaffected (audio publishes may use other hosts —
untested).

## Expected

- Either restore `CAPTION_RENDER_API_KEY` on the caption-render route, or
- Accept pi-media-validation / pi-sandbox-uploads URLs in create-content and re-host
  server-side to provider-media (this apparently worked on Aug 16; regression since).

## Context

Worked Aug 16 (American Idol GBA essay 347268706352500736, Ember Run demo
347175883007594496 — both published with provider-media URLs produced via render-caption).
Broken as of Aug 18 19:30 UTC.
