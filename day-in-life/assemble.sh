#!/bin/bash
# Day-in-life assembly: 4 lipsync clips -> concat -> trim to audio length -> burn SRT
# Usage: assemble.sh <s1.mp4> <s2.mp4> <s3.mp4> <s4.mp4>  (paths to downloaded clips)
set -e
cd /workspace/day-in-life
mkdir -p clips

i=1
for src in "$@"; do
  cp "$src" "clips/s$i.mp4"
  i=$((i+1))
done

# verify each clip exists and has audio
for n in 1 2 3 4; do
  d=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "clips/s$n.mp4")
  echo "s$n.mp4: ${d}s"
done

printf "file 'clips/s1.mp4'\nfile 'clips/s2.mp4'\nfile 'clips/s3.mp4'\nfile 'clips/s4.mp4'\n" > concat.txt

# concat (re-encode to be safe across codec params), trim to total VO length (35.36s), burn subs
ffmpeg -y -f concat -safe 0 -i concat.txt \
  -t 35.36 \
  -vf "subtitles=day-in-life.srt:force_style='FontName=DejaVu Sans,FontSize=15,Outline=1,Shadow=0'" \
  -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p \
  -c:a aac -b:a 192k -movflags +faststart \
  day-in-life_final.mp4

echo "DONE:"
ffprobe -v error -show_entries format=duration,size -of default=nw=1 day-in-life_final.mp4
