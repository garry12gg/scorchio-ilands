#!/usr/bin/env python3
"""Split the AP603 composition into chunks for memory-constrained rendering.

Usage: chunk.py <src.html> <outdir> <chunk-name> <keep-ids-csv> <offset> <root-duration>
Keeps only the named element ids (divs AND their tween lines), shifts data-start
values and tween position params by -offset, sets root data-duration.
"""
import re, sys, os

src_path, outdir, name, keep_csv, offset, duration = sys.argv[1:7]
offset = float(offset); duration = float(duration)
keep = set(x.strip() for x in keep_csv.split(',') if x.strip())
src = open(src_path, encoding='utf-8').read()

# 1) drop audio elements (render silent; audio muxed in post)
src = re.sub(r'\s*<audio[^>]*></audio>', '', src)

# 2) drop timed divs not in keep — balanced matching
def drop_foreign_divs(html):
    # find all top-level timed divs by scanning div open tags with id + class clip
    out = []
    i = 0
    pattern = re.compile(r'<div\b[^>]*class="[^"]*clip[^"]*"[^>]*>')
    while True:
        m = pattern.search(html, i)
        if not m:
            out.append(html[i:])
            break
        out.append(html[i:m.start()])
        tag = m.group(0)
        idm = re.search(r'id="([^"]+)"', tag)
        keep_div = bool(idm and idm.group(1) in keep)
        # scan forward to matching close, counting div depth
        depth = 1
        j = m.end()
        scan = re.compile(r'<div\b|</div>')
        while depth > 0:
            n = scan.search(html, j)
            if not n:
                raise ValueError('unbalanced divs')
            if n.group(0) == '<div':
                depth += 1
            else:
                depth -= 1
            j = n.end()
        if keep_div:
            out.append(html[m.start():j])
        i = j
    return ''.join(out)

src = drop_foreign_divs(src)

# 3) root data-duration
src = re.sub(r'(data-composition-id="ap603"[^>]*data-duration=")[\d.]+(")', r'\g<1>%s\g<2>' % duration, src)

# 4) shift data-start attributes
src = re.sub(r'(data-start=")([\d.]+)(")', lambda m: m.group(1) + str(round(float(m.group(2)) - offset, 2)) + m.group(3), src)

# 5) timeline: keep only tween lines whose first selector targets a kept id;
#    shift the trailing position number. Final-bg fade only with s10-content.
out_lines = []
for line in src.split('\n'):
    s = line.strip()
    if s.startswith('tl.'):
        ids = re.findall(r'#([A-Za-z0-9_-]+)', s)
        if 'bg' in ids and 's10-content' not in keep:
            continue
        if any(i in keep for i in ids):
            new = re.sub(r',\s*([\d.]+)\);\s*$', lambda m: ', %s);' % str(round(float(m.group(1)) - offset, 2)), s)
            out_lines.append('  ' + new)
    else:
        out_lines.append(line)
out = '\n'.join(out_lines)

os.makedirs(outdir, exist_ok=True)
open(os.path.join(outdir, name + '.html'), 'w', encoding='utf-8').write(out)
print(f'{name}: kept={sorted(keep)} offset={offset} dur={duration} -> {outdir}/{name}.html')
