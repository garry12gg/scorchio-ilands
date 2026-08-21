#!/bin/bash
# Duck's Token Catch — capture rig v3 (self-contained, verified startup)
cd /workspace/playtests/duck-token-catch
exec > rig_out.log 2>&1
echo "RIG_START $(date +%s%3N)"

pkill -f "Xvfb :99" 2>/dev/null || true
pkill -f "remote-debugging-port=9222" 2>/dev/null || true
pkill -f "http.server 8123" 2>/dev/null || true
sleep 1
rm -f /tmp/.X99-lock /tmp/.X99 raw_video.mkv audio.webm run_log.json run_log.jsonl driver_out.log ff_start.txt
rm -rf /tmp/duck-chrome

WIN_W=${WIN_W:-500}
WIN_H=${WIN_H:-720}
XVFB_W=$((WIN_W * 2))
XVFB_H=$((WIN_H * 2))
Xvfb :99 -screen 0 ${XVFB_W}x${XVFB_H}x24 -nolisten tcp >/tmp/xvfb.log 2>&1 &
XVFB_PID=$!
for i in $(seq 1 20); do
  [ -S /tmp/.X11-unix/X99 ] && break
  sleep 0.5
done
if [ ! -S /tmp/.X11-unix/X99 ]; then echo "XVFB_FAILED"; cat /tmp/xvfb.log; exit 1; fi
echo "XVFB_UP"

python3 -m http.server 8123 --directory /workspace/playtests/duck-token-catch/game >/tmp/http.log 2>&1 &
sleep 1

DISPLAY=:99 chromium --no-sandbox --disable-dev-shm-usage --kiosk \
  --window-size=${WIN_W},${WIN_H} --force-device-scale-factor=2 --use-gl=swiftshader \
  --autoplay-policy=no-user-gesture-required \
  --remote-debugging-port=9222 --user-data-dir=/tmp/duck-chrome \
  about:blank >/tmp/duck_chromium.log 2>&1 &
CHROME_PID=$!

for i in $(seq 1 24); do
  curl -s http://127.0.0.1:9222/json/version >/dev/null 2>&1 && break
  sleep 0.5
done
if ! curl -s http://127.0.0.1:9222/json/version >/dev/null 2>&1; then echo "CHROME_FAILED"; tail -5 /tmp/duck_chromium.log; exit 1; fi
echo "CHROME_UP"

FF_START=$(date +%s%3N)
echo "FF_START=$FF_START" > ff_start.txt

DISPLAY=:99 ffmpeg -y -loglevel error -f x11grab -framerate 30 -video_size ${XVFB_W}x${XVFB_H} \
  -i :99 -c:v libx264 -preset veryfast -crf 20 -pix_fmt yuv420p \
  /workspace/playtests/duck-token-catch/raw_video.mkv >/tmp/ffmpeg.log 2>&1 &
FFPID=$!
sleep 1
echo "FFMPEG_UP pid=$FFPID"

WIN_W=$WIN_W WIN_H=$WIN_H FF_START=$FF_START node drive.js >> driver_out.log 2>&1
DRIVER_RC=$?
echo "DRIVER_RC=$DRIVER_RC"

kill -INT $FFPID 2>/dev/null || true
sleep 2
kill -9 $FFPID 2>/dev/null || true

pkill -f "remote-debugging-port=9222" 2>/dev/null || true
pkill -f "http.server 8123" 2>/dev/null || true
pkill -f "Xvfb :99" 2>/dev/null || true
sleep 1

echo "--- files ---"
ls -la raw_video.mkv audio.webm run_log.json driver_out.log 2>&1
echo "RIG_DONE"
