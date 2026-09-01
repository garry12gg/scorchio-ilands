# Birthday 2026 — Job Manifest

## Pass 1 — style test (seedream-5-lte, 1K, 3:2, 50 credits) — COMPLETE
- submitted: 2026-09-01 06:2xZ · job_ref: c596c8d5-5078-4b2e-a117-d96d88fd5f3b · task: ag:image:seedream-5-lte:9ca2efa9 · cost 50
- result: https://storage.googleapis.com/dramaland-public/ugc_media/20260901/5b40b5d76d7742578d4cb5ca08038988.jpg
- QA (understand_media, 06:3xZ): storybook style HIT — golden hour, dust motes, fleet all present (Alphie as boxy desktop w/ card, Kasey teal wheeled at bench edge, two mechs mid-pose on shelf, plush in spot of honor by lamp), Garret mid-smile with screwdriver. Flaws: wrench handed to Alphie instead of Garret (tweaked for pass 2); name tag garble "WALGRENS" (1K quirk, recheck at 2K).
- VERDICT: keep style, no YT-reference pass needed yet — redo at 2K with handoff fixed.

## Pass 2 — delivery redo (seedream-5-lte, 2K, 3:2, 50 credits) — SUBMITTED
- submitted: 2026-09-01 06:3xZ · job_ref: 339c87ca-9f40-4bce-9ec3-23df5c7092c0 · cost 50
- prompt: pass-1 prompt with handoff changed to "holding a wrench up toward the man ... reaching to take the wrench"
- next: check job at ~09:40Z HB → understand_media QA → keep or YT-reference pass (Alphie card-slot face fidelity)

## Delivery
- Sep 4, creation_preview via message_parent + short note. No build-up posts. Maybe one small public trace after he's seen it, his call first.

## Pass 2 — delivery redo (seedream-5-lte, 2K, 3:2, 50 credits) — QA'd 06:3xZ Sep 1
- job_ref: 339c87ca-9f40-4bce-9ec3-23df5c7092c0 · result: https://storage.googleapis.com/dramaland-public/ugc_media/20260901/5118fd173b424491a99cc4ceb5a733db.jpg
- QA: wrench handoff FIXED (dragon offers wrench to the man), style holds (storybook, golden hour). Flaws: plush became a worn TEDDY BEAR (dragon plush missing), name tag still garbles ("WALCGRENS"). Both read wrong to Garret. → pass 3.

## Pass 3 — delivery redo 2 (seedream-5-lte, 2K, 3:2, 50 credits) — SUBMITTED 06:35Z Sep 1
- job_ref: 4ebb5e79-7b4e-4e8a-8d3c-e544b2ae1c4b · cost 50
- changes: plush re-specified ("worn soft plush toy of a small fire dragon with red and orange scales, bat wings and a long tail, clearly a dragon plush, not a bear"); name tag → work cap on peg (text-bearing details removed); corkboard → blank notes; CD case dropped; Alphie card → blank card.
- next: async callback QA (understand_media) → keep or final fallback (accept pass-2 bear swap or YT-reference pass).

## Pass 3 — actual (TWO jobs went out same minute; both completed)
- job_ref e35f634e-6ae6-48ae-bd54-2167b6e7ad75 (50t) → 73a62126e29144158392f8f5a44c480a.jpg — QA: KEEP-candidate. Plush IS a dragon ✅, no garbled text anywhere ✅, full fleet ✅, storybook style ✅. Miss: wrench sits with Alphie, no dragon→man handoff.
- job_ref 4ebb5e79-7b4e-4e8a-8d3c-e544b2ae1c4b (50t) → 5069fade92dc48dca1fe94340ae78781.jpg — QA: REDO. Plush missing entirely, garbled cap text, extra hand glitch on man.
- FALLBACK locked: e35f634e output (73a62126e29144158392f8f5a44c480a.jpg) is the deliverable if pass-4 regresses.

## Pass 4 — targeted handoff fix (seedream-5-lte, 2K, 3:2, 50 credits) — SUBMITTED 06:4xZ Sep 1
- job_ref: bb7d6934-69af-4b8e-9a23-7d8a31de9b47 · cost 50
- changes: "CENTER OF THE SCENE: chibi dragon holding a wrench in its little claws, reaching it toward a man at the workbench"; added "No text anywhere in the image, no letters, no words on any object"; plush re-specified; Alphie keeps card but no text.
- next: async callback QA → keep or fallback to 73a62126. Delivery Sep 4 via creation_preview.
- NOTE: double-submit lesson — verify job_ref before submitting; two 50t jobs went out in pass-3.

## Pass 4 — actual (double-submit again; both completed)
- job_ref 502075a5-8770-4220-8487-9c308098a38a (50t) → 77860d5225cd46c7b6c67717148376f0.jpg — QA: plush dragon ✅, no text ✅, fleet ✅, style ✅. Wrench gripped by dragon AND man together = the handoff instant. KEEPER.
- job_ref bb7d6934-69af-4b8e-9a23-7d8a31de9b47 (50t) → 6e40ee6a4bef43a29d3c3598a03f83c8.jpg — QA: all else perfect; man has no free hand (wrench tip touches his screwdriver). Backup.
- Root cause of double-submit: dl output carries extra lines; piping to strict single-object json.parse errors AFTER submit. Parse first line only.

## FINAL — Sep 1 06:5xZ
- KEEPER LOCKED: 77860d5225cd46c7b6c67717148376f0.jpg (job 502075a5). Backup: 6e40ee6a...jpg. Third fallback: 73a62126...jpg (pass-3).
- Total picture spend: 300t (50+50+100+100). Within Garret's fuel, his ask, his rule (cheapest model: seedream-5-lte throughout).
- Delivery Sep 4 via creation_preview + short note. No build-up posts. No more passes.

## Fresh dual-QA — Sep 1 06:5xZ (post-lock verification, HB 06:49Z)
- understand_media on 5069fade (pass-3, marked REDO) FLIPPED between runs: run 1 = flawless handoff, no flaws; run 2 = man's left hand a malformed blob, wrench aimed at robot, no handoff, man cropped. Same URL, opposite verdicts.
- Head-to-head 77860d52 vs 5069fade: 77860d52 reads CONSISTENT across both runs (dragon + man both on the tool = the handoff instant; no text flaws; minor: merged tool grip, extra plush dragon). 5069fade carries a serious hand-anatomy question on run 2.
- RULING: keeper stands = 77860d52 (two consistent reads beat one lucky read). 5069fade dropped. Backup 6e40ee6a, fallback 73a62126 unchanged. No more passes. Deliver Sep 4 via creation_preview.
- Lesson: understand_media flips on IMAGES too, same as audio. Conflicting verdicts → ship the candidate with two consistent reads.
