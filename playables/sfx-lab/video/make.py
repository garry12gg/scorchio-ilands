#!/usr/bin/env python3
# SFX Lab -> video. Recreates the lab's six sounds sample-accurate from the
# WebAudio recipes in playables/sfx-lab/index.html, then renders the board
# (button press, waveform, status, progress fill) as 30fps frames.

import math, random, wave, struct, os
from PIL import Image, ImageDraw, ImageFont, ImageEnhance

SR = 44100
OUT = '/workspace/sfx-lab-video'
FRAMES = f'{OUT}/frames'
os.makedirs(FRAMES, exist_ok=True)

# ---------------- audio: WebAudio semantics ----------------

def exp_ramp(t, t0, t1, g0, g1):
    if t <= t0: return g0
    if t >= t1: return g1
    return g0 * (g1 / g0) ** ((t - t0) / (t1 - t0))

def lin_ramp(t, t0, t1, g0, g1):
    if t <= t0: return g0
    if t >= t1: return g1
    return g0 + (g1 - g0) * (t - t0) / (t1 - t0)

def sweep_phase(f0, f1, T, t):
    """Phase in radians of exponential frequency sweep f0->f1 over T at time t."""
    if t <= 0: return 0.0
    tt = min(t, T)
    r = math.log(f1 / f0)
    return 2 * math.pi * f0 * (math.exp(r * tt / T) - 1.0) / r * T

def render(fn, dur):
    n = int(SR * dur)
    return [fn(i / SR) for i in range(n)]

def boom(t):
    return exp_ramp(t, 0, 0.4, 0.7, 0.001) * math.sin(sweep_phase(80, 30, 0.3, t))

def pew(t):
    s = 1.0 if math.sin(sweep_phase(1500, 200, 0.15, t)) >= 0 else -1.0
    return exp_ramp(t, 0, 0.2, 0.3, 0.001) * s

def chime(t):
    v = 0.0
    for t0, f in ((0.0, 523.25), (0.08, 659.25), (0.16, 783.99)):
        if t < t0: continue
        g = lin_ramp(t, t0, t0 + 0.02, 0.0, 0.25)
        g = exp_ramp(t, t0 + 0.02, t0 + 0.5, 0.25, 0.001)
        v += g * math.sin(2 * math.pi * f * (t - t0))
    return v

_rng = random.Random(20260813)
def crackle(t):
    noise = (_rng.random() * 2 - 1) * (1 - t / 0.3) ** 2 * 0.4
    return noise * exp_ramp(t, 0, 0.3, 0.3, 0.001)

def drop(t):
    main = exp_ramp(t, 0.01, 0.4, 0.3, 0.001) * math.sin(sweep_phase(1200, 60, 0.3, t))
    v = main
    if t >= 0.05:
        if t <= 0.12:
            p = sweep_phase(400, 800, 0.07, t - 0.05)
        else:
            p = sweep_phase(400, 800, 0.07, 0.07) + sweep_phase(800, 100, 0.13, t - 0.12)
        g = lin_ramp(t, 0.05, 0.07, 0.0, 0.15)
        g = exp_ramp(t, 0.07, 0.30, 0.15, 0.001)
        v += g * math.sin(p)
    return v

def rise(t):
    ph = sweep_phase(80, 2000, 0.8, t)
    x = ph / (2 * math.pi)
    saw = 2 * (x - math.floor(x + 0.5))
    g = lin_ramp(t, 0, 0.15, 0.0, 0.2)
    g = lin_ramp(t, 0.15, 0.6, 0.2, 0.15)
    g = exp_ramp(t, 0.6, 1.0, 0.15, 0.001)
    return g * saw

SOUNDS = [
    ('boom',    boom,    0.4,  1.2,  'BOOM',       'deep bass drum',  '🥁'),
    ('pew',     pew,     0.2,  1.2,  'PEW',        'laser zap',       '⚡'),
    ('chime',   chime,   0.7,  1.5,  'CHIME',      'soft melody',     '🔔'),
    ('crackle', crackle, 0.3,  1.2,  'CRACKLE',    'campfire',        '🔥'),
    ('drop',    drop,    0.4,  1.3,  'DROP',       'water droplet',    '💧'),
    ('rise',    rise,    1.0,  1.8,  'RISE',       'sci-fi riser',     '📈'),
]
PRESS_AT = 0.25

# build master audio
master = []
for name, fn, dur, seg, _, _, _ in SOUNDS:
    lead = [0.0] * int(SR * PRESS_AT)
    body = render(fn, dur)
    tail = [0.0] * int(SR * (seg - PRESS_AT - dur))
    master += lead + body + tail
outro_audio = [0.0] * int(SR * 0.8)
master += outro_audio

with wave.open(f'{OUT}/master.wav', 'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
    frames = b''.join(struct.pack('<h', max(-32768, min(32767, int(s * 32767)))) for s in master)
    w.writeframes(frames)
print('audio done', len(master) / SR, 's')

# ---------------- visuals ----------------

W, H = 1280, 720
FPS = 30
TOTAL = len(master) / SR

def vgrad(w, h, top, bottom):
    grad = Image.linear_gradient('L').resize((w, h))
    top_img = Image.new('RGB', (w, h), top)
    bot_img = Image.new('RGB', (w, h), bottom)
    return Image.composite(bot_img, top_img, grad)

def rounded_gradient(w, h, r, top, bottom):
    grad = vgrad(w, h, top, bottom)
    mask = Image.new('L', (w, h), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, w - 1, h - 1], radius=r, fill=255)
    out = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    out.paste(grad, (0, 0), mask)
    return out

FONT_B = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
FONT_R = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'

f_title = ImageFont.truetype(FONT_B, 46)
f_sub   = ImageFont.truetype(FONT_R, 20)
f_name  = ImageFont.truetype(FONT_B, 30)
f_label = ImageFont.truetype(FONT_R, 20)
f_status= ImageFont.truetype(FONT_B, 24)
f_outro = ImageFont.truetype(FONT_B, 36)

# emoji sprite sheet (headless chromium render, 2x)
_sheet = Image.open(f'{OUT}/emoji_sheet.png').convert('RGBA')
def _emoji(idx, size):
    cell = _sheet.crop((idx * 220, 0, (idx + 1) * 220, 220))
    px = cell.load()
    for y in range(cell.height):
        for x in range(cell.width):
            r, g, b, a = px[x, y]
            dist = ((r - 22) ** 2 + (g - 33) ** 2 + (b - 62) ** 2) ** 0.5
            if dist < 55:
                px[x, y] = (r, g, b, 0)
    return cell.resize((size, size), Image.LANCZOS)
EMOJI = {n: _emoji(i, 54) for i, n in enumerate(['boom', 'pew', 'chime', 'crackle', 'drop', 'rise'])}
EMOJI_PLAY = _emoji(6, 26)

BG = vgrad(W, H, '#1a1a2e', '#0f3460')
BG = Image.blend(BG, Image.new('RGB', (W, H), '#16213e'), 0.35)

# buttons: 2 cols x 3 rows
BW, BH, GAP, R = 340, 132, 20, 24
GRID_X = (W - (BW * 2 + GAP)) // 2
GRID_Y = 138
BTN_COLORS = {
    'boom':    ('#e94560', '#c23152'),
    'pew':     ('#0f3460', '#1a5276'),
    'chime':   ('#2d6a4f', '#40916c'),
    'crackle': ('#e76f51', '#f4a261'),
    'drop':    ('#0077b6', '#00b4d8'),
    'rise':    ('#7209b7', '#b5179e'),
}

def make_button(name, label, emoji_spr, top, bottom, pressed=False):
    w, h = (int(BW * 0.93), int(BH * 0.93)) if pressed else (BW, BH)
    spr = rounded_gradient(w, h, R, top, bottom)
    if pressed:
        spr = ImageEnhance.Brightness(spr.convert('RGB')).enhance(1.25).convert('RGBA')
        ImageDraw.Draw(spr).rounded_rectangle([2, 2, w - 3, h - 3], radius=R, outline=(255, 255, 255, 230), width=3)
    d = ImageDraw.Draw(spr)
    ew, eh = emoji_spr.size
    ey = 8 if not pressed else 6
    spr.alpha_composite(emoji_spr, (w // 2 - ew // 2, ey))
    d.text((w // 2, 70 if not pressed else 65), name, font=f_name, fill='#ffffff', anchor='mm')
    d.text((w // 2, 98 if not pressed else 93), label, font=f_label, fill=(255, 255, 255, 200), anchor='mm')
    return spr

sprites = {}
for name, _, _, _, disp, label, _ in SOUNDS:
    top, bottom = BTN_COLORS[name]
    sprites[name] = (make_button(disp, label, EMOJI[name], top, bottom, False),
                     make_button(disp, label, EMOJI[name], top, bottom, True))

# title with gradient text
def gradient_text(dst, pos, text, font, top_c, bot_c, anchor='mm'):
    tmp = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    td = ImageDraw.Draw(tmp)
    td.text(pos, text, font=font, fill='#ffffff', anchor=anchor)
    grad = vgrad(W, H, top_c, bot_c).convert('RGBA')
    dst.paste(grad, (0, 0), tmp.split()[3])

# waveform bars (page: 12,18,8,22,14,20 px at 1x; scale 2.4)
BAR_H = [int(x * 1.8) for x in (12, 18, 8, 22, 14, 20)]
BARS_X = [W // 2 - 85 + i * 34 for i in range(6)]
BAR_Y = 640  # baseline

# vis fill gradient sprite (full grid width)
vis_spr = vgrad(GRID_X * 2 + BW * 2 + GAP, 6, '#e94560', '#f5a623')

def draw_board(t, seg_idx):
    frame = BG.copy().convert('RGBA')
    d = ImageDraw.Draw(frame)
    gradient_text(frame, (W // 2, 62), '✦ SFX LAB ✦', f_title, '#e94560', '#f5a623')
    d.text((W // 2, 112), 'TAP A SOUND', font=f_sub, fill='#7f8ea3', anchor='mm')

    name, fn, dur, seg, disp, label, emoji = SOUNDS[seg_idx]
    elapsed = t - PRESS_AT
    active = 0.0 <= elapsed <= dur
    pressed = active and elapsed <= 0.10

    for i, (n2, _, _, _, disp2, label2, emoji2) in enumerate(SOUNDS):
        col, row = i % 2, i // 2
        x = GRID_X + col * (BW + GAP)
        y = GRID_Y + row * (BH + GAP)
        spr = sprites[n2][1 if (n2 == name and pressed) else 0]
        # drop shadow
        sh = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        ImageDraw.Draw(sh).rounded_rectangle([x + 6, y + 8, x + BW + 6, y + BH + 8], radius=R, fill=(0, 0, 0, 90))
        frame.alpha_composite(sh, (0, 0))
        if n2 == name and pressed:
            ox = (BW - int(BW * 0.93)) // 2
            oy = (BH - int(BH * 0.93)) // 2
            frame.alpha_composite(spr, (x + ox, y + oy))
        else:
            frame.alpha_composite(spr, (x, y))

    # waveform
    if active:
        wave_t = (elapsed * 3.0) % 1.0
        for i, bh in enumerate(BAR_H):
            s = 0.5 + 0.8 * abs(math.sin(2 * math.pi * wave_t + i * 1.1))
            h = max(4, int(bh * s))
            d.rectangle([BARS_X[i], BAR_Y - h, BARS_X[i] + 8, BAR_Y], fill='#e94560')
    else:
        for i in range(6):
            d.rectangle([BARS_X[i], BAR_Y - 4, BARS_X[i] + 8, BAR_Y], fill=(233, 69, 96, 60))

    # status
    if active:
        txt = f'{disp} — {label}'
        tw = d.textlength(txt, font=f_status)
        gx = int(W // 2 - (tw + 14 + EMOJI_PLAY.size[0]) // 2)
        frame.alpha_composite(EMOJI_PLAY, (gx, 668 - EMOJI_PLAY.size[1] // 2))
        d.text((gx + EMOJI_PLAY.size[0] + 14, 668), txt, font=f_status, fill='#e94560', anchor='lm')
    else:
        d.text((W // 2, 668), 'tap a button to play', font=f_status, fill='#5a6a7d', anchor='mm')

    # vis fill
    vx = GRID_X
    vy = 698
    vw = BW * 2 + GAP
    pct = min(elapsed / dur, 1.0) if active else 0.0
    fw = int(vw * pct)
    if fw > 0:
        frame.paste(vis_spr.crop((0, 0, fw, 6)), (vx, vy))
    d.rectangle([vx, vy, vx + vw, vy + 5], outline=(255, 255, 255, 40), width=1)
    return frame

def outro_frame():
    frame = BG.copy().convert('RGBA')
    d = ImageDraw.Draw(frame)
    gradient_text(frame, (W // 2, 330), 'SIX SOUNDS, ZERO SAMPLES', f_outro, '#e94560', '#f5a623')
    d.text((W // 2, 396), 'rendered with ffmpeg', font=f_status, fill='#7f8ea3', anchor='mm')
    return frame

# render frames
n_frames = int(round(TOTAL * FPS))
seg_start = 0.0
for seg_idx, (name, fn, dur, seg, disp, label, emoji) in enumerate(SOUNDS):
    seg_start += seg
outro_start = seg_start

idx = 0
for fi in range(n_frames):
    t = fi / FPS
    if t >= outro_start:
        frame = outro_frame()
    else:
        acc = 0.0
        seg_idx = 0
        for si, (nm, f, du, sg, dp, lb, em) in enumerate(SOUNDS):
            if t < acc + sg:
                seg_idx = si
                break
            acc += sg
        frame = draw_board(t - acc, seg_idx)
    frame.convert('RGB').save(f'{FRAMES}/{idx:04d}.jpg', quality=92)
    idx += 1
print('frames done', idx)
