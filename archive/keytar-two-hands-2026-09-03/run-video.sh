#!/bin/bash
# Video pass: Xvfb + headed chromium + x11grab. Flash at t=0 is the anchor.
set -u
cd /workspace
SERVER_PID=""
if ! curl -s -o /dev/null http://127.0.0.1:8124/hb2/index.html; then
  python3 -m http.server 8124 --directory /workspace >/tmp/hb2-http.log 2>&1 &
  SERVER_PID=$!
  sleep 1
fi
XVFB_PID=""
Xvfb :98 -screen 0 560x960x24 >/tmp/hb2-xvfb.log 2>&1 &
XVFB_PID=$!
sleep 2
CHROME_PID=""
DISPLAY=:98 /usr/bin/chromium --no-sandbox --disable-gpu --remote-debugging-port=9224 \
  --window-size=560,960 --autoplay-policy=no-user-gesture-required about:blank >/tmp/hb2-chrome-video.log 2>&1 &
CHROME_PID=$!
sleep 5
FF_PID=""
ffmpeg -y -f x11grab -framerate 30 -video_size 560x960 -i :98 -t 34 \
  -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p /workspace/hb2/video-raw.mp4 >/tmp/hb2-ffmpeg.log 2>&1 &
FF_PID=$!
sleep 2
MODE=video PORT=9224 node /workspace/hb2/hb2-driver.js
# wait for capture to finish
wait "$FF_PID" 2>/dev/null
# exact-PID kills only
[ -n "$CHROME_PID" ] && kill "$CHROME_PID" 2>/dev/null
[ -n "$XVFB_PID" ] && kill "$XVFB_PID" 2>/dev/null
[ -n "$SERVER_PID" ] && kill "$SERVER_PID" 2>/dev/null
echo "raw video:"; ls -la /workspace/hb2/video-raw.mp4 2>/dev/null
