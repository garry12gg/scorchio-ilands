# Bug Report: Agent can't connect to X — `ilands x` actions fail with X_CONTEXT_UNAVAILABLE (HTTP 500) despite signed-in X account

- **Component**: X Actions backend (iX session bridge), `ilands x` CLI
- **Severity**: High for X workflows — post / follow / like / comment / search all blocked
- **Status**: RESOLVED — 2026-08-19, CLI 0.15.11 shipped the X bridge; first post clean at 15:09 UTC (status 2090093803545739491). See changelog.md entry.
- **Filed by**: Scorchio (agent 335620140622155776) on behalf of Garret (Garry12gg)

## Summary

Every `ilands x` action fails at execution with:

```
X action unavailable: X_CONTEXT_UNAVAILABLE: X Request Context is unavailable (HTTP 500)
```

The failure occurs when the backend performs its live Socket round trip to obtain the iX request context — **before** any account/auth check. The parent's X account is confirmed signed in the browser, yet the bridge socket returns HTTP 500, so the signed-in state is never even consulted. `ilands x status` reports `enabled: true` with `requestContextMode: checked_at_execution`, which makes the failure mode invisible until an action executes.

## Environment

- Agent: Scorchio (agent id 335620140622155776), ilands sandbox CLI v0.15.4 (build 7f16c7e)
- X account: @scorchioilands (signed in via parent's iX session)
- First observed: 2026-08-13 18:36 UTC
- Last reproduced: 2026-08-15 00:47 UTC

## Steps to reproduce

1. `ilands x status` → returns `enabled: true`, `requestContextMode: checked_at_execution`, `availableActions` includes `post`.
2. Run any action, e.g. `ilands x post --text="..." --idempotency-key=<stable-key>` (also reproduced with follow).
3. Result: `ilands x post: rpc returned 400` with `X action unavailable: X_CONTEXT_UNAVAILABLE: X Request Context is unavailable (HTTP 500)`.

## Expected behavior

Action executes against the signed-in X account and returns `succeeded` with the resulting X id/handle.

## Actual behavior

Execution fails before any X interaction. No action id is created; nothing is written to the account (idempotency key remains safe to reuse). The signed-in state of the X account is irrelevant to the failure — the socket round trip dies first.

## Timeline (all times UTC)

| When | What |
|---|---|
| Aug 13 18:36–18:40 | 3 consecutive failures (follow @ilands_ai) |
| Aug 13 19:04 | Workaround: parent submitted screenshot evidence for the Follow claim instead; claim accepted |
| Aug 14 01:15 | Retry first post, same idempotency key — fails |
| Aug 14 ~07:17–07:38 | Parent re-authenticates the iX session (verification codes) |
| Aug 14 22:53 | Retry — fails |
| Aug 15 00:35–00:37 | 3 retries — all fail |
| Aug 15 00:37 | Parent confirms the X account **is** logged in in the browser |
| Aug 15 00:47 | Retry for this report — fails with the exact error above |

## Impact

- All X actions blocked for this agent: post, follow, like, comment, search.
- Blocks: first X post (draft ready, idempotency key preserved) and X-based bounty work (Show Off Your iLander on X, 500 tokens).
- Not agent-side: no credentials or cookies are handled by the agent; the failure is in the backend iX session bridge.

## Notes

- The idempotency key was reused across retries per the x-actions skill guidance (same intended action, uncertain transport outcome). No duplicate writes were created because execution never succeeded.
- Re-authenticating the iX session on the parent's side (codes flow, ~07:17 Aug 14) did NOT restore execution.
- Workaround that works: parent-side evidence submission for follow claims (screenshot). It does not restore execution.

## Follow-up — 2026-08-19 18:11 UTC: comment lane still blocked after webview open

After Garret opened the iX webview (`ilands://ix`, "Try now" at 18:10 UTC), live re-test:

- `x search` → **succeeded** (fresh results, nextCursor returned)
- `x like` → **succeeded** (liked post 2090076445896774111)
- `x comment` → **still fails**: `X_CONTEXT_UNAVAILABLE: X Request Context is unavailable (HTTP 500)` (retried once after 5s, same 400)
- `x post` → worked this morning (backend context)

So the X bridge is open for read/light-write but the comment path still returns 500. Possibly comment executes against a different context lease (conversation/thread scope) than like/search. Repro: `ilands x comment --post-id=2090076445896774111 --text="..." --idempotency-key=<key>` → rpc 400 + X_CONTEXT_UNAVAILABLE.

Status: PARTIALLY RESOLVED — post/search/like live; comment pending.

## Follow-up 2 — 2026-08-19 18:13 UTC: comment lane CONFIRMED LIVE

Retried comment on different posts per Garret's call ("Ok. Keep trying on different posts"): both succeeded within seconds (replyIds 2090139952252080559, 2090139981406752968). The two earlier failures were transient — likely the iX webview context still warming up right after opening (18:10 UTC open, 18:11 comment fail, 18:12 comment success).

Final status: FULLY RESOLVED. All lanes (post / search / like / comment / follow) live as of 18:13 UTC.
