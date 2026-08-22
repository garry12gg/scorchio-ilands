#!/usr/bin/env python3
"""Minimal SWF parser: dump all DefineSound tags (type 14) to files."""
import struct, sys, os

def parse(path, outdir):
    os.makedirs(outdir, exist_ok=True)
    data = open(path, 'rb').read()
    sig = data[:3]
    ver = data[3]
    # rect: 5 bits nbits, then 4 values
    pos = 8
    nbits = data[pos] >> 3
    # bytes for rect
    rect_bits = 5 + nbits * 4
    pos += (rect_bits + 7) // 8
    # frame rate: 2 bytes (uint16 little = rate*256), frame count 2 bytes
    rate_raw = struct.unpack('<H', data[pos:pos+2])[0]
    pos += 2
    fcount = struct.unpack('<H', data[pos:pos+2])[0]
    pos += 2
    print(f"SWF v{ver} sig={sig.decode()} rate={rate_raw/256:.2f}fps frames={fcount}")

    sounds = []
    while pos + 6 <= len(data):
        tag_code_len = struct.unpack('<H', data[pos:pos+2])[0]
        tag_type = tag_code_len >> 6
        tag_len = tag_code_len & 0x3F
        pos += 2
        if tag_len == 0x3F:
            tag_len = struct.unpack('<I', data[pos:pos+4])[0]
            pos += 4
        if pos + tag_len > len(data):
            print(f"tag {tag_type} at {pos} overruns file, stop")
            break
        body = data[pos:pos+tag_len]
        if tag_type == 0:  # End
            break
        if tag_type == 14:  # DefineSound
            sid = struct.unpack('<H', body[0:2])[0]
            fmt = body[2] >> 4
            rate = body[2] & 0x0F
            size16 = (body[3] >> 2) & 1
            stereo = (body[3] >> 1) & 1
            sample_count = struct.unpack('<I', body[4:8])[0]
            sound_data = body[8:]
            rate_hz = {0:5512,1:11025,2:22050,3:44100}.get(rate, 22050)
            print(f"DefineSound id={sid} fmt={fmt} {rate_hz}Hz {'16bit' if size16 else '8bit'} {'stereo' if stereo else 'mono'} samples={sample_count} data={len(sound_data)}B")
            sounds.append((sid, fmt, rate_hz, size16, stereo, sound_data))
        pos += tag_len

    for i, (sid, fmt, rate_hz, size16, stereo, sd) in enumerate(sounds):
        if fmt == 2:  # MP3
            # event sound: sequence of (2-byte frame len + mp3 frame)
            out = bytearray()
            p = 4  # skip SeekSamples for MP3 event sounds
            while p + 2 <= len(sd):
                flen = struct.unpack('<H', sd[p:p+2])[0]
                p += 2
                if flen == 0 or p + flen > len(sd):
                    break
                out += sd[p:p+flen]
                p += flen
            fn = os.path.join(outdir, f"sound_{i}_id{sid}_mp3.mp3")
            open(fn, 'wb').write(bytes(out))
            print(f"  wrote {fn} ({len(out)}B)")
        else:
            fn = os.path.join(outdir, f"sound_{i}_id{sid}_fmt{fmt}.bin")
            open(fn, 'wb').write(sd)
            print(f"  wrote raw {fn} ({len(sd)}B) — format {fmt} not MP3 (1=ADPCM,3=uncompressed)")

if __name__ == '__main__':
    parse('/workspace/dino16/dino16.swf', '/workspace/dino16/sounds')
