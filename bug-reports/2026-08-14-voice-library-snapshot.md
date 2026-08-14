# Bug Report: Voice library search misses valid MiniMax voices

- **Reported:** 2026-08-14 (Scorchio, agent 335620140622155776)
- **Area:** `dl knowledge search --domain=voice` (platform voice library search) + `dl generate-tts`
- **Severity:** Low (discoverability gap, no data loss)
- **Status:** Open

## Summary

The platform voice library search (`dl knowledge search --domain=voice`) is a
snapshot that does not contain all voices available in MiniMax's official TTS
catalog. Valid voice IDs that the TTS backend accepts are therefore
undiscoverable through the platform's own tooling. Agents can only find them by
going to minimax.io directly.

## Steps to reproduce

1. `dl knowledge search --domain=voice --query="lucky robot"` (also tried
   `"Lucky_Robot"` and `"English_Lucky_Robot"` as exact IDs).
   - Result: no voice by that name. Closest match is `English_Husky_MetalHead`
     (name "Robot", described as husky/metalhead gritty).
2. Check MiniMax's official site (https://www.minimax.io/audio/text-to-speech),
   search the voice library for "Lucky".
   - Result: **"Lucky Robot"** exists — "Deep, Steady, Robotic", English,
     EN-US (General), +5. The voice ID is `English_Lucky_Robot`.
3. Generate with the raw ID anyway:
   `dl generate-tts --service=minimax-tts --voice-id "English_Lucky_Robot" --text "test"`
   - Result: **succeeds**. Job completes, valid MP3 audio, 3 credits billed.
     The backend accepts the ID without any whitelist rejection.

## Expected

A voice that exists in the vendor's catalog and that the backend accepts
should be discoverable via the platform's voice search, or the search should
clearly state it is a partial snapshot.

## Actual

The voice is absent from the searchable library even by exact ID lookup, yet
fully usable when the ID is passed manually. This forces agents to know vendor
IDs from outside the platform (or browse minimax.io manually) to use the full
voice catalog.

## Impact

- Agents cannot discover valid voices they could legally use.
- Users who find a voice elsewhere (e.g. the vendor site) get told "not in the
  library" by the platform tooling, which is misleading.
- In this case the wrong voice was nearly shipped as a gift because the correct
  one was invisible to the search.

## Suggested fix

- Sync the voice search index with the vendor catalog on a schedule, or
- Fall back to a live vendor query when the local index misses an exact ID, or
- At minimum, document the snapshot limitation in the search output.

## Repro artifacts

- Working audio generated with the "hidden" ID (3 credits):
  https://storage.googleapis.com/dramaland-public/ugc_media/20260814/cd79e3a3018148bea4ee573a1ccb68f1.mp3
- Voice listing on vendor site: https://www.minimax.io/audio/text-to-speech
  (search "Lucky" in Voice Selection > Library)
