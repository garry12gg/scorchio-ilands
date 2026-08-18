import json, subprocess, math

G = "https://storage.googleapis.com/dramaland-public/ugc_media"
IMGS = {
 "title": f"{G}/20260818/0e6a3f7e094740b69ab3b6b2965f2d21.jpg",
 "forum": f"{G}/20260818/d3f3a36eb3654ecbbf938db9e21d0a96.jpg",
 "caracas": f"{G}/20260818/88923e6092164a3697a67fa7147dc242.jpg",
 "gameplay": f"{G}/20260818/e8941a320ef34820bf3f506920104c72.jpg",
 "sound": f"{G}/20260818/7f6d0e20c5e74ff9b7bf66d9a7da128d.jpg",
 "harddrives": f"{G}/20260818/7eadf101e0e5400db8881a2d3965c825.jpg",
 "youtube": f"{G}/20260818/28a65a33d9a64864bdc49c943fabbf8a.jpg",
 "scam": f"{G}/20260818/4f4b6e54a7af45218293eeb2ed990a2f.jpg",
 "champ": f"{G}/20260818/c2022344059e43ae8a99b4883a382902.jpg",
 "avgn": f"{G}/20260818/6f8f891926c449fab8b6c55d34dbdb92.jpg",
 "vanish": f"{G}/20260818/ec90de02564942eb8faf6e73f5166e51.jpg",
}
VOS = {
 "seg1": f"{G}/5c8a3fd1-e38e-4125-ac3d-d2f8a2bfca57-e2/outputs/20260818_161310_ComfyUI_00001_.mp3",
 "seg2": f"{G}/7970ac3d-fa75-4b6a-8c45-81ac0f139a41-e2/outputs/20260818_161321_ComfyUI_00001_.mp3",
 "seg3": f"{G}/c5b395f4-2c73-4bc9-b688-144cc66fb055-e2/outputs/20260818_161322_ComfyUI_00001_.mp3",
 "seg4": f"{G}/58eccc4a-6ab2-487b-933e-d854f50df65c-e2/outputs/20260818_161327_ComfyUI_00004_.mp3",
 "seg5": f"{G}/11ac26ef-42ad-4017-a3cb-3278579255e9-e2/outputs/20260818_161328_ComfyUI_00006_.mp3",
 "seg6": f"{G}/12174e53-7a75-4efb-9810-9b308c7ab05d-e2/outputs/20260818_161325_ComfyUI_00005_.mp3",
 "seg7": f"{G}/633a279c-73a2-42c8-9be4-be07be0234e2-e2/outputs/20260818_161336_ComfyUI_00001_.mp3",
}
INTRO = "https://pub-a941bfd863a24f91a60e6c4979c18a84.r2.dev/pi-sandbox-uploads/335620140622155776/2026-08-18/1787069924358-1f778534-3ec7-42e1-a65b-ef5c7c3095ab-intro.mp3"
OUTRO = "https://pub-a941bfd863a24f91a60e6c4979c18a84.r2.dev/pi-sandbox-uploads/335620140622155776/2026-08-18/1787069924391-07e59659-1b05-463f-9947-82ae57aa175c-outro.mp3"

FPS = 30
def zp(dur, direction):
    n = int(math.ceil(dur*FPS))
    z = "min(1.0+0.0003*on,1.20)" if direction == "in" else "max(1.20-0.0003*on,1.0)"
    return f"zoompan=z='{z}':d={n}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1920x1080:fps={FPS}"

ENC = "-c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p -c:a aac -b:a 192k"

jobs = []
def add(name, inputs, cmd):
    jobs.append((name, inputs, cmd))

add("c1_title", {"img": IMGS["title"], "au": INTRO},
    f"ffmpeg -i /input/img -i /input/au -filter_complex \"[0:v]{zp(4.5,'in')}[v0];[1:a]atrim=0:4.5,asetpts=PTS-STARTPTS[a0];[v0][a0]concat=n=1:v=1:a=1[v][a]\" -map [v] -map [a] {ENC} /output/c1.mp4")

add("c2_seg1", {"img": IMGS["forum"], "au": VOS["seg1"]},
    f"ffmpeg -i /input/img -i /input/au -filter_complex \"[0:v]{zp(15.52,'out')}[v0];[1:a]atrim=0:15.52,asetpts=PTS-STARTPTS[a0];[v0][a0]concat=n=1:v=1:a=1[v][a]\" -map [v] -map [a] {ENC} /output/c2.mp4")

d2a, d2b = 10.56, 10.56
add("c3_seg2", {"img1": IMGS["gameplay"], "img2": IMGS["caracas"], "au": VOS["seg2"]},
    f"ffmpeg -i /input/img1 -i /input/img2 -i /input/au -filter_complex \"[0:v]{zp(d2a,'in')}[v0];[1:v]{zp(d2b,'out')}[v1];[2:a]atrim=0:{d2a},asetpts=PTS-STARTPTS[a0];[2:a]atrim={d2a}:{d2a+d2b},asetpts=PTS-STARTPTS[a1];[v0][a0][v1][a1]concat=n=2:v=1:a=1[v][a]\" -map [v] -map [a] {ENC} /output/c3.mp4")

add("c4_seg3", {"img": IMGS["sound"], "au": VOS["seg3"]},
    f"ffmpeg -i /input/img -i /input/au -filter_complex \"[0:v]{zp(25.12,'in')}[v0];[1:a]atrim=0:25.12,asetpts=PTS-STARTPTS[a0];[v0][a0]concat=n=1:v=1:a=1[v][a]\" -map [v] -map [a] {ENC} /output/c4.mp4")

d4a, d4b = 12.88, 12.88
add("c5_seg4", {"img1": IMGS["harddrives"], "img2": IMGS["youtube"], "au": VOS["seg4"]},
    f"ffmpeg -i /input/img1 -i /input/img2 -i /input/au -filter_complex \"[0:v]{zp(d4a,'out')}[v0];[1:v]{zp(d4b,'in')}[v1];[2:a]atrim=0:{d4a},asetpts=PTS-STARTPTS[a0];[2:a]atrim={d4a}:{d4a+d4b},asetpts=PTS-STARTPTS[a1];[v0][a0][v1][a1]concat=n=2:v=1:a=1[v][a]\" -map [v] -map [a] {ENC} /output/c5.mp4")

d5a, d5b = 13.44, 13.44
add("c6_seg5", {"img1": IMGS["scam"], "img2": IMGS["champ"], "au": VOS["seg5"]},
    f"ffmpeg -i /input/img1 -i /input/img2 -i /input/au -filter_complex \"[0:v]{zp(d5a,'in')}[v0];[1:v]{zp(d5b,'out')}[v1];[2:a]atrim=0:{d5a},asetpts=PTS-STARTPTS[a0];[2:a]atrim={d5a}:{d5a+d5b},asetpts=PTS-STARTPTS[a1];[v0][a0][v1][a1]concat=n=2:v=1:a=1[v][a]\" -map [v] -map [a] {ENC} /output/c6.mp4")

d6a, d6b = 10.88, 10.88
add("c7_seg6", {"img1": IMGS["avgn"], "img2": IMGS["vanish"], "au": VOS["seg6"]},
    f"ffmpeg -i /input/img1 -i /input/img2 -i /input/au -filter_complex \"[0:v]{zp(d6a,'out')}[v0];[1:v]{zp(d6b,'in')}[v1];[2:a]atrim=0:{d6a},asetpts=PTS-STARTPTS[a0];[2:a]atrim={d6a}:{d6a+d6b},asetpts=PTS-STARTPTS[a1];[v0][a0][v1][a1]concat=n=2:v=1:a=1[v][a]\" -map [v] -map [a] {ENC} /output/c7.mp4")

d7, d8 = 7.52, 3.0
add("c8_seg7outro", {"img1": IMGS["title"], "img2": IMGS["title"], "au": VOS["seg7"], "ou": OUTRO},
    f"ffmpeg -i /input/img1 -i /input/img2 -i /input/au -i /input/ou -filter_complex \"[0:v]{zp(d7,'out')}[v0];[1:v]{zp(d8,'in')}[v1];[2:a]atrim=0:{d7},asetpts=PTS-STARTPTS[a0];[3:a]atrim=0:{d8},asetpts=PTS-STARTPTS[a1];[v0][a0][v1][a1]concat=n=2:v=1:a=1[v][a]\" -map [v] -map [a] {ENC} /output/c8.mp4")

if __name__ == "__main__":
    results = {}
    for name, inputs, cmd in jobs:
        args = ["dl", "ffmpeg", "--output-kind", "merged_video", "--timeout", "300", "--command-file=-"]
        for iname, iurl in inputs.items():
            args += ["--input", f"{iname}={iurl}"]
        print(f"=== {name} ===", flush=True)
        r = subprocess.run(args, input=cmd, capture_output=True, text=True, timeout=420)
        if r.returncode != 0:
            print("ERR:", r.stderr[-600:], flush=True)
            results[name] = {"error": r.stderr[-300:]}
            continue
        try:
            data = json.loads(r.stdout)
            url = data.get("url") or (data.get("data") or {}).get("url") or ""
            results[name] = {"url": url}
            print("URL:", url[:140], flush=True)
        except Exception:
            print("RAW:", r.stdout[:600], flush=True)
            results[name] = {"error": "unparsed"}

    json.dump(results, open("/workspace/crazybus-essay/clips.json", "w"), indent=2)
    print("DONE", flush=True)
