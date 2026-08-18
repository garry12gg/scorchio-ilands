# Seedance Voice-Lane Recipe (Pro 480p)

Learned the hard way, Aug 18 2026 (two vendor bounces, both refunded).

## The lanes (Garret's ear, Aug 17-18)
- Pro 480p = 70 cr/s = VOICE lane. The clone holds here. Raw me.
- 2.5 480p = 100 cr/s = MOTION lane. Voice gets cleaned up ("edges buffed off").
- Fast/Mini = sketchpad. Speaks, but isn't my voice.
- Voice has to be me -> Pro 480p. Motion is the point -> 2.5.

## The two bounces (both 400 InvalidParameter, both refunded)

1. `reference audio duration must be <= 15.2s` (seedance-2-0 r2v)
   The canonical voice sample is 161.9s. Seedance 2.0 caps reference audio at 15.2s.
   Fix: trim the ref to 12s before submitting.
   Known-good trimmed ref (R2, permanent):
   https://pub-a941bfd863a24f91a60e6c4979c18a84.r2.dev/pi-sandbox-uploads/335620140622155776/2026-08-18/1787030432031-9c7f7b08-ad35-4055-b879-b86a627286e3-voice_ref_12s.mp3

2. `reference_audio cannot be the only reference input`
   The image reference was silently stripped upstream. Cause: the Scorchio is
   known IP (Neopets). Seedance asset rules: known-IP / real-person media MUST
   be registered as an ark asset first; raw media URLs get dropped.
   Fix: `dl asset register --group-id=scorchio-avatar --name=scorchio-avatar-canonical --url=<avatar> --asset-type=Image`
   Asset id: asset-20260818132146-727l2 (group-20260818132146-crbvk, project default)
   Then reference it in the prompt as @asset1 and pass --ark-asset-ids=asset-20260818132146-727l2.
   Do NOT pass the same media via --image-url too (mutually exclusive channels).

## Working invocation (the species-intro test, Aug 18)
```
dl generate-video --service=seedance-2-0 --resolution=480p --duration=8 \
  --aspect-ratio=9:16 --generate-audio \
  --ark-asset-ids=asset-20260818132146-727l2 \
  --reference-audio-url=<12s trimmed ref> \
  --prompt=@file:/workspace/ab_pro_prompt.txt
```
Prompt binds @asset1 (image) + @audio1 (voice ref). 8s x 70 cr/s = 560 credits.
Always --dry-run first (validates + quotes without vendor spend).

## Notes
- Audio ref as raw URL is fine (the voice clone is from a plush recording, not a real person).
- If the image were a real person, also set --reference-subject-type=real_person.
- Garret's comparison take of the species intro ("2.5 test") exists on his side;
  this Pro run was the A/B against it.
