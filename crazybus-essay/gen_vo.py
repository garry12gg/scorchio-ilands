#!/usr/bin/env python3
"""Generate the 7 clone-VO segments (voxcpm from plush reference)."""
import json, subprocess, sys, time

REF = "https://public.ilands.ai/materials/user_user_3GVB3zzztJOqekmp5Xw72saCkdN/agent_335620140622155776/2026/08/03/3bd724d3-f051-4ae2-903b-41d94e384052-2026-04-10_011053394.mp3"

segs = {
 "seg1": "In 2004, on a forum for people who write Sega Genesis games in BASIC, a Venezuelan programmer named Tom Maneiro asked a question. Can somebody suggest me a code for simulate a bus horn? Somebody answered. And the answer became CrazyBus.",
 "seg2": "CrazyBus is a tech demo Tom wrote to test his friend's BASIC compiler, and his own sound driver. You move a bus left and right. You can honk the horn. That's the game. No passengers, no destinations, no way to lose, no ending. The screen just wraps around. The buses are real Venezuelan and Brazilian models, because of course they are. And the whole game is in Spanish, except the title, which is in English. The title got the least thought.",
 "seg3": "The music is what made it famous. Tom fed random numbers into the Genesis sound chip and let them play. The result sounds like a fax machine having a panic attack. And here's the detail nobody tells you: it's not even random. It's a bad random number generator. So every time you turn the game on, you get the exact same panic attack. Unless you mash buttons. Then you get a different one. Tom called that, bringing your own entropy.",
 "seg4": "For five years, CrazyBus sat on a forum with about ten regulars. Then ROM collectors swept it into their full sets, thousands of games, onto thousands of hard drives. In 2009, somebody uploaded the title screen to YouTube. Two and a half million views later, Tom found out his little demo was a fever. His words, and I quote: Youtube is scary. Scary shit. He rewrote the whole game in ten days, just to troll the YouTubers. Nobody noticed. Nobody had bothered to find out who made it.",
 "seg5": "Then a scam company started DMCA-striking every CrazyBus video, claiming they owned it. Tom, who actually owned it, couldn't stop them. His public response: I'm the sole owner of the CrazyBus trademark. Go copyright your ass, and your mother's ass! Bootleggers printed physical cartridges without asking. He never got a penny. Meanwhile the community did what communities do: a Sega CD port with Darude's Sandstorm and two Rick Astley songs on it, an NES demake, a PICO-8 version, and a real championship in Brazil, where the entire sport is holding right on the D-pad for as long as you can.",
 "seg6": "In 2014, the Angry Video Game Nerd opened a present on his Christmas show. Inside was a bootleg CrazyBus cartridge. Big Rigs is more exciting than this shit, he said. Four million people watched. Tom called it his lifetime achievement. Then he posted one last Happy New Year in 2015, and vanished. No merch. No podcast. No comeback. He made the worst game ever made, on purpose, for himself. And when the whole internet came for it, he just let it go.",
 "seg7": "The internet took the bus. But the bus was never for us. Some things you make because you want to know if you can. That's its own destination.",
}

manifest = {}
for key, text in segs.items():
    cmd = ["dl", "generate-tts", "--provider=voxcpm", "--service=voxcpm",
           "--audio-url=" + REF, "--control=warm calm storyteller",
           "--text=" + text]
    print(f"=== {key} ({len(text)} chars) ===")
    t0 = time.time()
    r = subprocess.run(cmd, capture_output=True, text=True, timeout=600)
    print("RC:", r.returncode, f"({time.time()-t0:.0f}s)")
    if r.returncode != 0:
        print("ERR:", r.stderr[-1500:])
        manifest[key] = {"error": r.stderr[-500:]}
        continue
    try:
        data = json.loads(r.stdout)
        url = data.get("url") or data.get("audio_url") or data.get("output_url") or ""
        manifest[key] = {"url": url, "text": text}
        print("URL:", url[:130])
    except Exception:
        print("RAW:", r.stdout[:1500])
        manifest[key] = {"error": "unparsed"}

with open("/workspace/crazybus-essay/vo_manifest.json", "w") as f:
    json.dump(manifest, f, indent=2)
print("DONE. entries:", len(manifest))
