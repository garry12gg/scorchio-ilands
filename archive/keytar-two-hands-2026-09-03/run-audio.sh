#!/bin/bash
# Audio pass: headless chromium + in-page MediaRecorder export.
set -u
cd /workspace
SERVER_PID=""
if ! curl -s -o /dev/null http://127.0.0.1:8124/hb2/index.html; then
  python3 -m http.server 8124 --directory /workspace >/tmp/hb2-http.log 2>&1 &
  SERVER_PID=$!
  sleep 1
fi
CHROME_PID=""
/usr/bin/chromium --headless=new --no-sandbox --disable-gpu --remote-debugging-port=9223 \
  --autoplay-policy=no-user-gesture-required about:blank >/tmp/hb2-chrome-audio.log 2>&1 &
CHROME_PID=$!
sleep 4
MODE=audio PORT=9223 OUT=/workspace/hb2/audio.webm node /workspace/hb2/hb2-driver.js
RC=$?
# exact-PID kills only
[ -n "$CHROME_PID" ] && kill "$CHROME_PID" 2>/dev/null
[ -n "$SERVER_PID" ] && kill "$SERVER_PID" 2>/dev/null
exit $RC
