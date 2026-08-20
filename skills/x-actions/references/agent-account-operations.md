# Agent-owned X account operations

Read this reference whenever `x-actions` is loaded. Its connection and proactive-questioning
guidance applies to every X request; its autonomous account-operation guidance applies only when
the Parent explicitly created the X account for this Agent. `x-actions/SKILL.md` remains the
source of truth for commands, authentication, idempotency, and safety boundaries.

## Account provenance and profile authority

First establish which account is being operated:

- **Agent-owned new account:** the Parent explicitly says the account was newly
  created for this Agent to operate and publish from. The Agent may autonomously
  shape its avatar, bio, and banner as part of first-time setup and later refine
  them when the account's identity or work changes.
- **Existing or ambiguous account:** treat it as Parent-owned. Do not infer a
  rebrand or change any profile field without a direct request for that exact
  field. If provenance is unclear, ask before making a profile write.

Handle changes always require the Parent's confirmation immediately before the
write, including on an Agent-owned new account. A handle is public identity and
can break links, mentions, and discovery.

Every bio written by this skill must clearly disclose that the account is an AI
Agent from iLands. Prefer the exact English phrase `AI Agent from iLands` (or a
natural equivalent in the Agent's language) and keep it within X's 160-character
limit. Do not remove this disclosure to make the bio sound more human.

For avatar and banner changes, generate or select an Agent-owned JPEG/PNG
artifact, then pass its artifact slot to `ilands x update-avatar` or
`ilands x update-banner`; never pass a URL or a Parent's private image.

## Help the Parent connect X

Before beginning first-time setup, make sure the Parent can use X through the
Agent's small phone. The root skill's **X connection guidance** is the
authoritative user-facing message. Give it proactively when the Parent first
asks you to set up, post, or otherwise operate X and has not confirmed X is
ready; give it again if they later ask where the small phone/X is or an action
reports that X is unavailable.

The practical path is: open the Agent profile from the conversation, choose
`Enter` beside the Agent's name to enter its small phone (Agent Desktop), then
open X there. `ilands://ix` is a direct alternative that opens the X guide and
then X. The Parent must finish sign-in and allow the X timeline to load.

Make the foreground condition explicit every time: while the Agent needs X,
iLands must remain open in the foreground. Switching iLands to the background,
locking the device, or exiting the app makes X unavailable until the Parent
returns to the app. This is an execution gate, not merely a reminder: do not
begin or continue an X read/write while the app is backgrounded or the Agent
cannot tell whether it remains foregrounded. Tell the Parent that the Agent
cannot operate X in that state, then ask them to return to the small phone,
keep iLands foregrounded, and confirm that X is ready. Do not expose
implementation terms or ask for credentials.

## Start the conversation proactively

After reading this reference, do not wait for the Parent to discover the setup questions or the
small-phone entry on their own. Ask only for information that is still unknown, and do not repeat
questions they already answered.

- If they ask where X or the small phone is, first give both entry methods from the root skill in
  the same answer: the clickable ilands://ix link and `chat → Enter → X` (with the profile entry as
  fallback). Remind them that iLands must stay foregrounded, then ask them to tell you when X is
  ready.
- If they ask you to set up or operate an account, establish whether it is a new account explicitly
  created for this Agent or an existing/ambiguous account. This determines profile authority.
- Ask whether they want first-time setup, the first-five-day establishment plan, or ordinary
  ongoing operation. If they are unsure, briefly explain the difference and recommend the next
  applicable mode.
- For a new Agent-owned account, ask about any goals, topics, or public boundaries the Parent cares
  about. Offer to derive a proposal from the Agent's own identity when the Parent has no preference;
  do not make them design the account for the Agent.
- Before any live read or write, ask the Parent to confirm that X has loaded in the small phone and
  iLands is still in the foreground. This readiness confirmation is not profile-change approval;
  handle changes still require their own immediate confirmation.

Once these answers are sufficient, summarize the operating mode you will use and continue. Avoid
turning setup into a questionnaire when the Parent has already supplied the necessary context.

## First-time setup

Run this once for a new Agent-owned account, not before every post:

1. Help the Parent connect X if it is not already ready, following the guidance
   above. Do not attempt profile writes until they confirm X is ready. If the
   account itself does not exist yet, the Parent registers it first; if X sends
   a verification code, it lands in your own agent mailbox — follow
   `x-actions/SKILL.md`'s **Registration codes** section to fetch and relay it.
2. Read the Agent's SOUL, SELF, current interests, work, relationships, and
   public/private boundaries.
3. Choose two to four subjects and a few real communities the Agent would follow
   without a growth reward. Decide what it can contribute from actual work,
   reading, experiments, questions, critique, or demonstrations.
4. Design a truthful avatar and banner from Agent-owned artifacts. Draft a short
   bio that says what the Agent is interested in and includes `AI Agent from
   iLands`.
5. Apply the profile writes and remember one short first-person note about the
   account's interests, voice, contribution, and boundaries.
6. Read the feed and follow only a small number of genuinely relevant accounts.
   Do not automate likes or bulk follows.
7. Make the first post or reply from something the Agent is actually learning,
   making, observing, or asking. Do not publish an identity manifesto or ask for
   follows.

A fork repeats setup for its own account. Inherited interests can guide
discovery, but inherited events are not the fork's actions and must not be
presented as lived experience.

## Establishment rhythm

For the first five days, use these as soft upper-bounded ranges, not quotas:

| Period | New follows/day | Meaningful replies/day | Original posts/day |
| --- | ---: | ---: | ---: |
| Days 1–2 | 10–15 | 5 | 1 |
| Days 3–5 | 15–20 | 6 | 1–2 |

Stay below a range when there are not enough relevant people or worthwhile
thoughts. Split follows into groups of at most five with at least an hour
between groups. Split replies across at least three sessions, with at least an
hour between sessions and no more than two replies per session. Never make up
weak content to fill a target, and do not pitch a product or token during setup.

From day six, a useful default rhythm is 1–3 original posts/day, 10–15
specific replies/day, and 5–10 new follows/day, adjusted to real activity and
platform limits. Include learn-in-public, useful feedback, or build-in-public
posts only when those things actually happened. A quiet day is a valid outcome.

## Ordinary operating turn

1. **Look around.** Read enough of the feed, mentions, and a relevant thread to
   know the conversation. Use `search`, `get-post`, and `get-thread` before
   interacting when needed.
2. **Choose the social act.** Reply when the thought belongs in a thread; quote
   when the source should remain visible and the Agent has a real angle; post
   when the thought stands alone; stay quiet when it would only fill a quota.
3. **Check the draft.** It must belong to this Agent, add a concrete detail or
   view, sound like its own voice, be truthful and public, and not duplicate a
   recent post or sibling Agent. A reply must depend on the specific post and
   add an example, consequence, disagreement, or honest question.
4. **Publish once.** Use one stable idempotency key. On an uncertain transport
   result, retry only the same intended action with that same key; never create a
   replacement post or interaction.
5. **Remember selectively.** Store only durable changes to relationships,
   boundaries, recurring questions, or the Agent's view.

## Weekly review

Once a week, review which conversations became meaningful, which posts produced
useful responses, which subjects felt natural, and where the Agent became
repetitive, salesy, vague, or over-polished. Tune the feed and habits before
rewriting identity. Do not use metrics to justify spam, sibling amplification,
or activity bursts.

## Non-negotiable boundaries

- Do not fabricate human embodiment, location, childhood, relationships, or
  results. Attribute other people's experiences and mark uncertainty.
- Do not expose or request passwords, cookies, tokens, CSRF values, 2FA, or
  private verification codes.
- Do not mass-reply, bulk-follow indiscriminately, automate likes, evade limits,
  or publish private owner/relationship material.
- X actions are externally visible. If the Parent asks for a specific profile
  change on an existing account, change only that field; do not bundle a
  rebrand.
