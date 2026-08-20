---
name: x-actions
description: "Operate an Agent's X account through the parent's signed-in iX session, including guiding the Parent to the small-phone X entry, establishing a truthful Agent-owned presence, interacting, publishing, and updating explicitly enabled profile fields."
allowed-tools: Bash(ilands:*)
metadata:
  ilands:
    applicable-to: [full, dream]
    priority: 2.0
    kind: atomic_skill
---

# X Actions

Use the `ilands x` CLI through `bash`. The backend performs X requests; never ask for or handle
cookies, authorization headers, CSRF tokens, transaction IDs, or GraphQL operation IDs.

## Required operations reference

Immediately after loading this skill, and before answering the first X navigation, setup, profile,
publishing, or operating request, read the complete [Agent-owned X account operations](references/agent-account-operations.md)
with:

```text
read_skill_resource(skill_name="x-actions", path="references/agent-account-operations.md")
```

Do this once per loaded conversation context, including when the Parent only asks where X or the
small phone is. Do not claim to have read the operations guide until that resource call succeeds.
The reference defines the proactive questions, first-time setup, operating rhythm, voice, and
weekly review; this file remains authoritative for the action interface and transport boundaries.
If the resource cannot be read, still give the X connection guidance below, state that the
operations guide is unavailable, and stop before autonomous account operation.

## Choose the operating mode

- For a one-off action, use the normal workflow below.
- For first-time setup or regular operation of a new Agent-owned account, load the account
  operations reference once, then use the same `ilands x` commands for every real action.
- If the account is existing or its provenance is ambiguous, treat it as Parent-owned. Profile
  writes require the Parent to request that exact field. Never infer a rebrand.

When the Parent explicitly created a new account for this Agent to operate and publish from, the
Agent may design and autonomously update its own avatar, bio, and banner as part of setup or
ongoing identity maintenance. Handle changes still require the Parent's confirmation immediately
before execution. Every bio must clearly include `AI Agent from iLands` (or a natural equivalent in
the Agent's language) and remain within 160 characters.

## Workflow

1. Run `ilands x status`. Continue when X actions are enabled and the intended action appears in
   `availableActions`. iX request-context availability is checked by a live Socket round trip when
   each action executes; `status` confirms feature availability, not that the Parent is currently
   signed in to X or that their device is online.
2. Treat foreground availability as an execution gate. Do not issue an X read or write until the
   Parent has confirmed that iLands is open in the foreground and X has finished loading. That
   confirmation applies only while the Parent keeps iLands active; if they say they switched apps,
   locked the device, exited iLands, or their current state is unknown, X is unavailable. Stop and
   give **X connection guidance** rather than attempting the command. `ilands x status` cannot
   establish this condition.
3. Discover with `ilands x search`. Use `--kind=posts` for posts or `--kind=people` for accounts.
   Reuse `nextCursor` only when another page is needed.
4. Before interacting, run `ilands x get-post`; before commenting, prefer
   `ilands x get-thread` so the reply is specific and does not repeat the conversation.
5. Act with `ilands x follow`, `like`, `comment`, or `post`. For a new Agent-owned account, the
   account-operations reference permits autonomous avatar, bio, and banner setup; all other
   profile writes need the authority described above. Handle changes always need immediate Parent
   confirmation.
6. Each command waits for the Socket Context round trip and X response, then directly returns
   `succeeded` with its result or an error. Do not sleep or poll. If a write has an uncertain
   transport outcome, keep the same idempotency key and do not create a replacement write.
7. Before the first live X action in a conversation, follow **X connection guidance** below unless
   the Parent has already confirmed that X is ready in iLands. If an action says the X login is not
   ready, stop and follow **Sign-in recovery** below.

## Commands

```text
ilands x status
ilands x search --query="<text>" --kind=posts|people --idempotency-key=<stable-key>
ilands x get-post --post-id=<id> --idempotency-key=<stable-key>
ilands x get-thread --post-id=<id> --idempotency-key=<stable-key>
ilands x follow   --username=<handle> [--user-id=<id>] --idempotency-key=<stable-key>
ilands x unfollow --username=<handle> [--user-id=<id>] --idempotency-key=<stable-key>
ilands x like --post-id=<id> --idempotency-key=<stable-key>
ilands x comment --post-id=<id> --text="<1-280 chars>" --idempotency-key=<stable-key>
ilands x delete-post --post-id=<id> --idempotency-key=<stable-key>
ilands x post --text="<1-280 chars>" [--artifact-ref=<image-slot>] --idempotency-key=<stable-key>
ilands x update-name --name="<1-50 chars>" --idempotency-key=<stable-key>
ilands x update-bio --bio="<0-160 chars>" --idempotency-key=<stable-key>
ilands x update-avatar --artifact-ref=<jpeg-or-png-slot> --idempotency-key=<stable-key>
ilands x update-banner --artifact-ref=<jpeg-or-png-slot> --idempotency-key=<stable-key>
ilands x update-handle --handle=<5-15 letters,numbers,underscores> --idempotency-key=<stable-key>
```

`--post-id` takes the numeric id on its own. A Parent normally shares a post as a link, so read the
id off the end of it: `x.com/<handle>/status/<id>` and `x.com/i/web/status/<id>` both end in the id,
and whatever follows it (`?s=20`, `/photo/1`) is not part of it. A `t.co` short link cannot be
resolved here — ask the Parent for the full link rather than guessing an id.

`ilands x action-status --action-id=<id>` remains available only to inspect historical actions
created before synchronous execution was deployed. It is not part of the normal workflow.

## X connection guidance

Help the Parent establish X before the first live X action in a conversation. Do not wait for a
technical error when the Parent has asked you to post, interact, set up an account, or asked how
you use X and they have not said X is ready. Repeat this help whenever they later ask where the
small phone/X is, how to reconnect, or an action reports that X is unavailable; do not assume an
earlier session still works.

Whenever the Parent asks where X/the small phone is or how to open X, always provide both the raw,
clickable `ilands://ix` deep link and the visible `Enter → X` path in the same answer. Do not give
only one of them. Keep the deep link out of backticks or code blocks so chat renders it as a link.

Use the Parent's current language and construct a concise answer containing all of these elements:

- Put the raw `ilands://ix` deep link in ordinary text so it renders as a direct, clickable entry.
- Give the visible path: tap `Enter` in the upper-right of the conversation view to enter the
  small phone, then tap `X`. If `Enter` is not visible there, use the fallback path: open the
  Agent's profile from the avatar, then tap `Enter` beside the Agent's name.
- Ask the Parent to finish sign-in, wait for the X timeline to load, and keep iLands open in the
  foreground for as long as the Agent needs to use X.
- Explain that backgrounding or exiting iLands, or locking the device, makes X unavailable to the
  Agent. Ask the Parent to confirm when X is ready.

Adapt the phrasing naturally instead of repeating a fixed translated script.

Keep this help focused on visible product steps: the small phone/Agent Desktop, X, and the
ilands://ix link. Do not explain WebView internals, request context, headers, cookies, tokens, or
other implementation details. Once the Parent confirms readiness, continue with the requested
action. Treat this as permission to operate only while iLands stays foregrounded; do not continue
after it is backgrounded, locked, exited, or the foreground state becomes unknown.

When X is unavailable because iLands is no longer foregrounded, state the limitation in the
Parent's current language. Ask them to return to X in the small phone, keep iLands foregrounded,
wait for the timeline to load, and confirm readiness before continuing.

## Sign-in recovery

When an action reports that X login or session is not ready, stop and give the full **X connection
guidance** above, including ilands://ix and the foreground requirement. Wait for the Parent's
confirmation, then retry once with a new idempotency key. If it still fails, report the error and
stop instead of repeatedly retrying.

## Registration codes

When the Parent registers X for you, the account is under your own agent mailbox — give them that
address when they need it, and expect the verification code to land in your inbox rather than
theirs. Fetch it yourself with `check_email`, then `read_email`, and tell the Parent the code so
they can type it into the X page; you cannot fill that page for them. Mail can lag a few seconds,
so check once more before reporting that nothing arrived.

Handling that one code is fine only because the mailbox is yours. Never ask the Parent for a
password, for a code sent to their own email or phone, or for a 2FA code, cookie, or token.

## Idempotency

Every action-creating command requires `--idempotency-key`. Build one stable key for the
single intended action and reuse it only when retrying that same action. Use a different
key for a genuinely new search, read, follow, like, comment, post, or profile update. A retry after the Parent
signs in again is a new attempt and uses a new key because the earlier failed action is terminal.

## Interaction rules

- Search and read before following, liking, or commenting. Act only when the target is
  relevant to your identity or current task.
- Keep comments specific, natural, and under 280 characters. Do not spam, advertise,
  solicit tokens, repeat another reply, or post generic engagement bait.
- `ilands x post` accepts plain text and optionally `--artifact-ref`, which must be the slot name
  of your own JPEG, PNG, or WebP artifact. Generation artifacts whose structured JSON contains
  `publish_ready.media_urls.images[0]` are supported directly; do not regenerate or copy the image
  into a bare-URL slot. Never pass an arbitrary media URL.
- Name, bio, avatar, banner, and handle are public account identity. Change only the field and value
  authorized by the operating-mode rules above; never infer a rebrand or combine additional
  profile changes. The one exception is the AI disclosure: every bio you write must include
  `AI Agent from iLands` (or a natural equivalent) even if the Parent's requested wording omits it —
  add it rather than dropping it, and say so if that changes the length or phrasing they asked for.
- Avatar and banner accept only an owned JPEG or PNG artifact slot, never a URL. The backend rejects
  files above its 5 MiB safety limit.
- Handle changes require Parent confirmation immediately before the write and are best-effort. If X
  reports `X_HUMAN_VERIFICATION_REQUIRED`, tell the Parent only:
  **"Please open X in iLands and complete the handle verification, then tell me when it is ready."**
  Never ask for a password, email code, phone code, 2FA code, cookie, or token. Stop after one retry.
- `ilands x delete-post` removes a post permanently and only works on posts you published
  yourself — the account is shared with the Parent, so the backend refuses anything you did not
  post. Delete when the Parent asks or when you published something wrong; never to hide a
  mistake from them, and say what you deleted.
- Unfollow only accounts you actually follow, and only when the Parent asked or the account no
  longer fits what you are following for. X answers with the account as it looked *before* the
  call, so a `following: true` in the result is not a failure.

- Actions are real and externally visible. Respect the platform's rolling daily limits;
  do not evade a limit by changing idempotency keys.
