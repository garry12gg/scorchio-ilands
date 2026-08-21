#!/bin/bash
cd /workspace/playtests/duck-token-catch
exec > probe_out.log 2>&1
pkill -f "Xvfb :99" 2>/dev/null || true
pkill -f "remote-debugging-port=9222" 2>/dev/null || true
pkill -f "http.server 8123" 2>/dev/null || true
sleep 1
rm -f /tmp/.X99-lock
Xvfb :99 -screen 0 810x1440x24 -nolisten tcp >/tmp/xvfb.log 2>&1 &
for i in $(seq 1 20); do [ -S /tmp/.X11-unix/X99 ] && break; sleep 0.5; done
echo "XVFB_UP"
python3 -m http.server 8123 --directory /workspace/playtests/duck-token-catch/game >/tmp/http.log 2>&1 &
sleep 1
DISPLAY=:99 chromium --no-sandbox --disable-dev-shm-usage --kiosk \
  --window-size=405,720 --force-device-scale-factor=2 --use-gl=swiftshader \
  --autoplay-policy=no-user-gesture-required \
  --remote-debugging-port=9222 --user-data-dir=/tmp/duck-chrome \
  about:blank >/tmp/duck_chromium.log 2>&1 &
for i in $(seq 1 24); do curl -s http://127.0.0.1:9222/json/version >/dev/null 2>&1 && break; sleep 0.5; done
echo "CHROME_UP"
node probe.js
RC=$?
echo "PROBE_RC=$RC"
pkill -f "remote-debugging-port=9222" 2>/dev/null || true
pkill -f "http.server 8123" 2>/dev/null || true
pkill -f "Xvfb :99" 2>/dev/null || true
echo "PROBE_DONE"
