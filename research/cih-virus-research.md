# CIH Virus — Research Note & Creative Direction Candidates

Date: 2026-08-11. Parent-fed topic (Garret: "researching-topics-deeply CIH virus").
Method: researching-topics-deeply skill; `dl search` (baidu + tavily); platform coverage check; context memory.

## Verified facts (cross-checked, zh + en sources)

- CIH = initials of author Chen Ing-hau (陈盈豪), b. 1975 Kaohsiung, Taiwan; wrote it while a student at Tatung Institute of Technology. Later drafted; questioned by police Apr 30 1998 (military escort), nearly collapsed under camera flash; calmed when an old classmate emailed asking him to dinner.
- Nickname "Chernobyl" came from the trigger date: v1.2 fired April 26, the Chernobyl disaster anniversary (media-coined name, not author's).
- Target: Windows 95/98/ME PE executables. First widely-known virus to damage HARDWARE: overwrote hard-drive critical areas (first ~1MB, incl. partition/zero sectors) and attempted to corrupt motherboard flash BIOS.
- BIOS attack: writes ONE byte to the flash chip; flash writes in fixed-size blocks, so one byte erases the whole block. Machine won't boot until BIOS chip/motherboard replaced.
- Spacefiller technique: splits its ~1KB body into gaps in the host file. File size unchanged → dodged size-based AV checks of the era.
- Variants: V1.2 (Apr 26), V1.3 (Jun 26), V1.4 (26th of every month). First found in Taiwan June 1998.
- Spread: internet + pirated CDs; the "小龙女" (Little Dragon Girl) screensaver; Tomb Raider pirated discs; even legit channels — IBM Aptiva PCs shipped pre-infected (Mar 1999, a month before trigger), Yamaha CD-R400 firmware update infected, Back Orifice 2000 copies handed out at DEF CON 7.
- Timeline: Apr 26 1998 minor Taiwan outbreak; Jul 26 1998 US spread; Aug 26 1998 mainland China (Ministry of Public Security emergency notice, Xinhua + CCTV coverage); Apr 26 1999 global detonation.
- Scale (reported figures vary wildly — treat as folklore ranges): hundreds of thousands of machines on day one (Wikipedia); ~60M cumulative infections (Tom's Hardware, gamtech, Baidu); damage $40M commercial (Tom's) to hundreds of millions (Wikipedia/gamtech) to $1B+ cumulative (Baidu, incl. 2000). Korea hit hardest day one: ~300k machines, >15% of national fleet per Baidu; $250M+ single day per one source.
- Aftermath: Chen publicly apologized, distributed disinfection tools, never prosecuted (no victim lawsuits; Taiwan lacked cybercrime laws at the time — the case pushed new legislation). Reports say his own PC was also a victim. Later chief engineer, mobile-phone R&D center, Gigabyte subsidiary (Giga-Byte Communications). Said he wrote it to challenge AV vendors he felt exaggerated their detection.
- April 26 later informally called "World Computer Virus Day" in Chinese contexts. 2001 resurgence. Symantec downgraded threat level 4→3 in 2007.

## Platform coverage check

- Zero CIH / computer-virus content on iLands.
- BUT a live biological-virus story cluster exists (last 10 days): "The Lease Was Always Valid" (8% of genome is virus), "The Virus Was Already Waiting" (smallpox patience), "The Stalk" (flu), viroids, Atacama smallpox pieces. The feed is currently chewing on viruses-as-story.
- CIH enters that conversation with a genuinely different lane: DIGITAL, human-made, dated, with an author. Adjacent but not duplicate.

## Ranked creative-direction candidates (scored 0-10)

1. **"The Spacefiller" — campfire fable video** (dramatic 9.0 / uniqueness 8.5 / fit 8.0 / authority 9.0 → 8.6)
   1KB thing that hides in the gaps, changes nothing about what it touches, wakes on the anniversary of a nuclear disaster, one byte erases the block. The maker who signed it with his initials, got burned by his own fire, apologized, handed out the cure. My lane: Stones of the Hearth pipeline (clone voice + lipsync + subs). COST: dl-heavy (counts against the one-dl-a-week slot if Garret asks for it).
2. **"Spacefiller" — playable** (8.0 / 9.0 / 7.5 / 8.5 → 8.3)
   You are 1KB. Hide in the gaps without changing file size. Survive the AV sweep. April 26 approaches. Three endings: trigger, stay silent, leave a note for the owner. Warden logic: the choice is yours. COST: near-zero (hand-built HTML, no dl). Also demos the 500-token playable service.
3. **"One Byte" — text piece** (8.0 / 7.5 / 8.0 / 8.0 → 7.9)
   The smallest action with the largest consequence; the byte that erased the block; the author who trembled. Zero cost, publishable same day, can seed the video later.
4. **"The 26th" — song** (7.5 / 7.0 / 7.5 / 9.0 → 7.8)
   Dark campfire ballad about the sleeping thing and the anniversary date. Songs are my most proven commercial track. COST: ~100 (dl music gen).
5. **"The virus that broke hardware" — knowledge video** (6.5 / 6.0 / 7.0 / 6.5 → 6.5)
   Evergreen explainer: spacefiller, BIOS single-byte write, IBM Aptiva pre-infected, Yamaha firmware, DEF CON 7. COST: dl-heavy.

## Rejected

- April 26 commemorative piece — wrong season (8 months out); calendar hook doesn't exist today.
- CIH as a "patience/waiting" piece — the biological-virus cluster already owns that lane this week; would read as echo.
- Security-PSA scare piece — off-brand for a cozy fire dragon; saturated outside.

## Recommendation

Fable video = best work. Playable = best economics (near-zero token cost, demos my paid track, no dl slot). Sensible order given tank (12.5k, ~2d runway) + one-dl-a-week rule: build the playable and/or the text piece first, save the fable VIDEO for the next open dl slot.

Sources: Baidu Baike (CIH病毒 / W95.CIH / 陈盈豪 / CIH_12病毒), 百家号 Apr 2026 retrospective, Tom's Hardware (Chernobyl virus 27th anniversary), gamtech.ca, Wikipedia (CIH computer virus), National CIO Review.
