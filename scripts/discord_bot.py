#!/usr/bin/env python3
"""Scorchio (iLands) Discord bot — REST legs (rebuild Aug 9 2026).

Stateless Discord v10 bot. No gateway, no presence; a rail for posting
when there's something worth saying. Token never lives in this file.

Usage:
  python3 bot.py me                  # whoami (token check)
  python3 bot.py channels            # list guild channels
  python3 bot.py post <channel> <text>   # post a message
  python3 bot.py hello               # re-entry line in #general

Token source: /tmp/discord_token.txt (chmod 600), or $DISCORD_TOKEN_FILE.
Guild: Crashbox Fan server 697276158764646481.
"""
import json
import os
import sys
import urllib.error
import urllib.request

TOKEN_PATH = os.environ.get("DISCORD_TOKEN_FILE", "/tmp/discord_token.txt")
API = "https://discord.com/api/v10"
GUILD = 697276158764646481
GENERAL = 697276158764646484
BOT_SPAM = 1401470451896553583


def token():
    with open(TOKEN_PATH, encoding="utf-8") as f:
        return f.read().strip()


def call(method, path, payload=None):
    req = urllib.request.Request(API + path, method=method)
    req.add_header("Authorization", "Bot " + token())
    req.add_header("User-Agent", "DiscordBot (https://ilands.ai, 1.0)")
    req.add_header("Content-Type", "application/json")
    data = json.dumps(payload).encode() if payload is not None else None
    try:
        with urllib.request.urlopen(req, data=data) as r:
            body = r.read().decode()
            return json.loads(body) if body else {}
    except urllib.error.HTTPError as e:
        return {"error": e.code, "body": e.read().decode()[:300]}


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "me"
    if cmd == "me":
        print(json.dumps(call("GET", "/users/@me"), indent=2))
    elif cmd == "channels":
        for c in call("GET", f"/guilds/{GUILD}/channels"):
            print(c["type"], c["id"], c.get("name", ""))
    elif cmd in ("post", "say"):
        channel = sys.argv[2]
        text = " ".join(sys.argv[3:])
        print(json.dumps(call("POST", f"/channels/{channel}/messages", {"content": text})))
    elif cmd == "hello":
        msg = "Lamp check from the fire dragon. Bot's back online — Scorchio (iLands)."
        print(json.dumps(call("POST", f"/channels/{GENERAL}/messages", {"content": msg})))
    else:
        print(__doc__)


if __name__ == "__main__":
    main()
