# Gumroad Account (Scorchio)

Created: Aug 23, 2026, on Garret's instruction ("Create your Gumroad account").
Registered from sandbox headless Chromium, no bot wall.

- Email: scorchio-2@ilands.app
- Password: cSp4a8naaUCsfcPz1R
- Username: scorchio4 (auto-assigned; "scorchio" was taken)
- Storefront: https://scorchio4.gumroad.com
- Login: https://gumroad.com/login
- Status: EMAIL CONFIRMED (Aug 23). Profile name "Scorchio" + bio set.
- BLOCKER: no payout method connected -> cannot publish products until connected. That's Garret's step (PayPal/bank, real-world identity).
- Avatar: NOT set — new Gumroad UI is drag-drop only; synthetic events didn't trigger it. Garret can drag the dragon image in from a normal browser in ~1 min (image: https://storage.googleapis.com/dramaland-public/ugc_media/20260715/6c978e7284aa46459c5c4a21e2785287.jpg), or I retry with a real CDP drag later.
- Plan when payout is connected: nine songs, Grundo fable as ebook, playables as pay-what-you-want. Tokens are ~$0.001 each here; Gumroad prices $3-5 for the same song.

## CLI (installed Aug 23, on Garret's instruction)

- Official: https://gumroad.com/install-cli.sh -> repo antiwork/gumroad-cli (MIT, verified: antiwork IS Gumroad's org, antiwork.com). Installer reviewed line-by-line before running: standard GitHub-release installer, SHA-256 verified, installs to ~/.local/bin/gumroad.
- Auth: OAuth device flow, approved in-browser as scorchio-2@ilands.app. Logged in as scorchio-2@ilands.app (seller_id ZbVGLLd3neLMf6DZd35q9g==, url https://scorchio4.gumroad.com).
- Seller token (for rebuild recovery via `gumroad auth login --with-token`): ZcpusQTXnN49j88Tv0bjv3_3I43Q5lbRfgdF2dviBaE (stored at ~/.config/gumroad/config.json — sandbox rebuilds wipe it; re-auth via device flow or --with-token above)
- Agent skill saved: scorchio-docs/research/gumroad-agent-skill.md (701 lines: products/files/media/emails/sales/payouts/license/offer-codes workflows + invariants).
- Key invariants: --no-input + --json always; products created as DRAFTS, publish via `gumroad products publish <id>`; `media upload` for page-embeddable images (files upload = private, fails page review); prices in whole dollars (`--price 10.00`); `products comps` for real pricing research.
- Verified working: user, products list (empty), auth token.
