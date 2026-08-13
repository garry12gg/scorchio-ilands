# Pokémon Diamond & Jade — Bootleg Research Notes

Date: 2026-08-13 · For Garret, follow-up to the Vietnamese Crystal rabbit hole.

## The Big Reveal
"Pokémon Diamond" and "Pokémon Jade" are NOT Pokémon games. They are bootleg
hacks of **Keitai Denjū Telefang** (携帯電獣テレファング), a Japanese GBC RPG by
Smilesoft where monsters ("Denjuu") live inside your phone and you dial their
numbers to call them into battle.

- Diamond = hack of Telefang 1 **Power Version**
- Jade = hack of Telefang 1 **Speed Version**
- Chinese-made English translations, sold in the West (and Taiwan/China)
  pretending to be Pokémon games.

## Translation Chaos
- Translated Japanese → Chinese → English (chain translation; same pirate
  ecosystem as Vietnamese Crystal — the Fandom wiki lists "Pocket Monsters
  Crystal Version" in the same family).
- Denjuu names mangled: Crypto → **Kuribute**, Easydog → **Hat**,
  Chameraid → **Ice Cream**, Fungmachine → **Game Boy**. T-Fanger (Denjuu
  user) → **T-Mildew**.
- One character (Kai) called **Boundary, Ken, and Kate** interchangeably.
- Hero always named **"Bek"** — name input removed because it was built for
  Japanese characters and the pirates couldn't rework it. No nicknaming either.
- Famous line: **"Well, have you had curry?"**
- Swear words present; Engrish mostly grammatically correct but
  incomprehensible in context.

## Box Art (the best part)
- Mascots on the boxes are neither Pokémon nor Denjuu:
  - Diamond: a mysterious blue snake creature of unknown origin.
  - Jade: a modified **Princess Mononoke forest spirit** (Ghibli!).
- Backs copied from legitimate Pokémon Gold/Silver boxes, screenshots edited
  to include the fake mascots and even Dragon Quest monsters.
- Many box variants; "GAME" / "GAME COLOR" text instead of "Nintendo GAME BOY™".
- Jade carts sometimes green translucent casing; one Diamond variant white.

## Glitches
- A+B+Select+Start **crashes** instead of soft reset (reset routine damaged in
  translation).
- Dialing secret numbers crashes. Selecting "Prop" with no items crashes.
  Pressing any button after Game Over crashes. Rapid B in phone menu crashes.
- Opening palette broken (removed logos). Custom tunes screech.
- RTC removed: clock runs on game frames (50/sec instead of 60), pauses when
  emulator pauses. Bootlegs don't track real time.

## Anti-Piracy (the twist)
The save "bug" is deliberate: carts use custom hardware with RTC-like
registers. The game refuses to load saves on standard MBC3 hardware or most
ROMs/emulators (freeze or glitched reset). Bootleggers protecting themselves
from other bootleggers. Emulator that supports them: **hhugboy**. Save files
load fine in the original Power/Speed versions (names glitch).
Jade also falsifies its ROM-size header to foil dumping (overdump to fix).

**Correction (Aug 13, per Garret):** Gordon (real cart owner) dumped his
actual Diamond cartridge and the dump saves fine in a standard emulator.
So the circulating "broken save" ROMs were likely bad dumps, and the
anti-piracy hardware story varies by cart revision. Real cartridge beats
theory.

## Marketplace History
- Sold on eBay in the early 2000s as "rare Pokémon games" until banned for
  infringing Nintendo trademarks. Harder to find now, still crops up.

## Sequel Line (bootleg of a bootleg)
- Telefang 2 hacks: **Pokémon Diamond 2** (Arcanine on title screen, three
  diamonds) and **Pokémon Jade 2** (a dragon from Shrek + Pokémon characters!).
- English bootleg of Telefang 2 sold as **Pokémon Ruby** (Groudon title screen).
- A Waixing Famicom port, loosely based, with Ruby/Sapphire Pokémon
  (Mightyena, Zigzagoon, Marshtomp) → dated 2002 or later.
- The name "Pokémon Jade" was also reused for an edited pirated Sonic game
  ("Sonic Adventures 7") — bootleggers recycle names.

## Sources
- Wikifang (Telefang.net wiki): https://wiki.telefang.net/Pokémon_Diamond_and_Jade
- BootlegGames Wiki (Fandom): https://bootleggames.fandom.com/wiki/Pokémon_Diamond_and_Jade
- ResetEra thread (2023): https://www.resetera.com/threads/anyone-remembers-pokemon-diamond-jade-for-gbc-keitai-denjuu-telefang.751282
- Bulbagarden (2007): https://bulbagarden.net/threads/pokemond-jade.22442
- Did You Know Gaming video: https://www.youtube.com/watch?v=XzlJwflmE3Y
- "THE MOST BOOTLEG POKEMON GAME - Pokémon Jade": https://www.youtube.com/watch?v=BFvRbQBFJcg
- Reddit r/retrogaming: https://www.reddit.com/r/retrogaming/comments/1v48y1p/

## One-Line Summary
The Game Boy's most beloved fake Pokémon is actually a Japanese game about
phone monsters, with a Ghibli forest spirit on the box and a save system that
refuses to work on purpose.
