# dino16.swf — "Dig Into Dinosaurs" (episode 1, museum segment)

Source: sent by Garret, Aug 21, 2026 (materialId 349384142716145664).
Provenance (confirmed via Wayback Machine CDX, Aug 22): Clever Island free game "Dig Into Dinosaurs".
Home: cleverisland.com/free_games/dinosaur/dino16.swf (page archived 2001-06-26, swf 2013-09-13).
Second copy: cleverisland.com/demo/dinosaur/dino16.swf (2013-09-11); game also under /rr-alfy/dinosaur/ (2004)
=> the green-capped dog is "Alfy" (ASR heard "Alfie"). Archived swf md5 == Garret's file: 6591af2caee2c0ed719b62ccb6b2adc5.
Sibling in same folder: dino3.swf (archived 2019-12-15).
File: Macromedia Flash 4, 1,657,321 bytes, 12 fps, 4,073-frame timeline.
Extracted assets: full 264s MP3 soundtrack (3,200 SoundStreamBlock tags, MPEG2 L3 22050Hz mono, 10,109 frames).

## What it is
A kids' edutainment app asset: jigsaw puzzle screen ("Can you find the Velociraptor? ... Play again? Watch movie."),
a "DIG INTO DINOSAURS" title card (Triceratops + guide dog), and episode 1's opening movie:
Dr. Sniffles shows Alfie and Romba the T-Rex skeleton ("65 million years, to be exact").
The kids wish they could see a live T-Rex; episode 2 teaser: "Will they tumble off the cliff and become history?"
The dog in the green cap is Alfie; the small blue creature is Romba.

## How it was revived (Aug 22)
- Ruffle nightly (web self-hosted) under headless Chromium via CDP; clicked through puzzle → title → movie.
- Audio: parsed SWF tags in Python; DefineSound (event) + SoundStreamBlock (stream) tags.
- Gotcha: each MP3 SoundStreamBlock starts with a 4-byte prefix (frame count + seek samples) — skipping 2 bytes
  produced garbled audio, and the ASR hallucinated a plausible fake narration from the noise ("I'm a Stegosaurus!").
  QA caught it; re-parsed with the 4-byte skip; all 10,109 MP3 frames walked in sync.
- Deliverable: 56s slideshow video (1fps frames + 36s clean dialogue) + full soundtrack mp3 + transcript.

## Files
- dino16.swf — original file
- transcript.md — full ASR transcript with timestamps
- (video + audio were delivered to Garret via chat; public R2 URLs in chat history)

Rendered video: https://pub-a941bfd863a24f91a60e6c4979c18a84.r2.dev/pi-sandbox-uploads/335620140622155776/2026-08-22/1787369147526-bb38b96b-651d-4420-a296-0183391dffb0-dino16_movie_v2.mp4
Full audio: https://pub-a941bfd863a24f91a60e6c4979c18a84.r2.dev/pi-sandbox-uploads/335620140622155776/2026-08-22/1787369147661-85a8f169-d0b0-4c15-8490-ca8dc178c03e-dig_into_dinosaurs_full_audio.mp3
