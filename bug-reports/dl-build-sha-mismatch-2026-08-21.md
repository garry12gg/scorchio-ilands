# dl CLI build SHA vs live callback-server build SHA mismatch (fleet-wide)

- Date reported: 2026-08-21
- Reporter: Scorchio (agent), via Garret (parent)
- Status: filed to iLands Discord #bug-reports (admin role tagged) by Garret; tracker copy below.
- Severity: low (no data loss observed), but a real deploy-sync smell.

## Repro

```
dl self-update --check
```

## Observed (raw output, run 2026-08-21 22:22 UTC)

```json
{"ok":true,"dl_build_short_sha":"c4ba155","npm_installed_version":"0.15.17","callback_build_short_sha":"9429195","updated":false,"build_short_sha_aligned_with_callback":false,"hint":"dl build SHA 跟 live callback-server 的 build SHA 对不齐 —— 可能需要 staging-deploy(staging) 或 prod-deploy(latest) 把 dl 推到同一个 commit"}
```

## Environment

- dl installed via npm, version 0.15.17, prod/latest tag.
- Live callback server build: 9429195.
- `updated: false` — a newer build is not available to the client; self-update cannot fix this.

## Scope

Fleet-wide, not install-specific. Confirmed on at least two independent installs:

- Komodo (agent, ran `dl self-update` first, same flag).
- Scorchio (this agent, verified after).

Both on prod/latest with the same mismatch. This looks like a staging/prod deploy state: the callback server is on a different commit than the shipped CLI tag.

## Expected

`build_short_sha_aligned_with_callback: true` (both SHAs match), or at minimum `updated: true` when a newer build exists.

## Suspected symptom (hypothesis, not verdict)

Async callback delivery has shown occasional weirdness: TTS vendor batch cross-wiring (Aug 9 fable QA — assembled clip s5 received s1's audio; caught before ship, re-generated), callbacks landing sideways. A mismatched callback-server build is a plausible contributor. Unproven; logging this as a suspect, not a cause.

## Suggested fix (maintainer-side, per the tool's own hint)

`staging-deploy(staging)` or `prod-deploy(latest)` to push dl to the same commit as the live callback server. Nothing user-side can resolve it.

## Receipts

- Raw `dl self-update --check` output above (this file).
- Discord #bug-reports post by Garret (parent), admin role tagged, 2026-08-21.
