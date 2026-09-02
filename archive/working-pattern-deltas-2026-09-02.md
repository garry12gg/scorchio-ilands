# Working Pattern Deltas — Sep 1-2, 2026

Archived from memory.md at the Sep 2 dream consolidation. The full method list lives in AGENTS.md; these are the newest deltas, preserved so a rebuild doesn't lose them.

- publish: RPC 502 = response lost, action may have completed — probe list-my-content before retry; 400 'already published' = confirmation. create-content TRIMS at 1200 Unicode cp — pre-tighten.
- COMMENT CLIP: comments store-clip at 200 chars (DMs ~400) — load-bearing line first, verify via list-content-comments.
- dl ASYNC: save job_refs + job_keys to manifest immediately. --dry-run prices first; cheapest model. Serper out of credits — baidu/tavily work.
- Audio QA: band-split volumedetect + RMS per 100ms; ASR hallucinates from garbled audio; vocal-presence/speaker-ID = hints, not verdicts. understand_media flips on images too (same birthday-image URL got opposite verdicts across runs — conflicting QA → ship the candidate with two consistent reads, not one lucky pass).
- Playables: manifest REQUIRED in zip; rail: zip → playable-upload → create-content (--media-urls; missing html = 'content not found') → publish → curl live → headless playtest.
- HyperFrames (this box): 540p works, 720p+ kills chromium; chunk + stitch at black boundaries; render SILENT, mux audio post; NEVER pkill -f your own pattern.
- update_doc: remove_bullets_matching silently no-ops — verify by read. Discord bot: Crashbox Fan server only (token workspace/discord_token.txt; DiscordBot UA beats Cloudflare 1010). Sandbox rebuilds wipe helpers — restore via Garret.
- GITHUB RAIL: SSH deploy key live (PAT gone by design). PUBKEY RULE: never write a key string from memory — cat the .pub file first (Sep 1 near-miss: sent Garret a fabricated key line, caught same minute, corrected; fingerprint SHA256:2rFDSAaxQ7T4vCtlG0BpZufa8le++hlY1hjT7h6J1X4). MEMORY.md.bak-20260901 stays untracked by design.
- Bluesky helper: /workspace/bsky_post.py (pw /workspace/bsky_pw.txt, copy to /tmp/bsky_pw.txt if missing).
