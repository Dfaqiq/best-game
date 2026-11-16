[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/Dfaqiq/best-game/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/Dfaqiq/best-game/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

# DUSK POST

Entry for make.fun bounty `best-game-01` — a browser game in which Pip the barn owl delivers the night's letters before dawn.

Steer Pip with your mouse or arrow keys (Space or click flaps). Catch the letters drifting in on the wind, then drop each one at a glowing mailbox of its colour on the rooftops. Deliver 12 letters to win the night — mind the chimneys, the bats and the gusts, and watch the dawn meter: every delivery buys the night back a few more seconds. Gold express letters are worth more but fade fast.

- `game/` — the game itself (plain static files, no library, no network): `index.html` plus one clear job per source file under `game/src/`
- `screenshots/` — the start, play, win and lose screens, taken from the real running game
- `main.ts` — copies `game/` and `screenshots/` to `/output` and writes `dossier.json` with the vendored make.fun library
- `serve.ts` — serves `game/` locally for play-testing: `node serve.ts`, then open http://localhost:8080

Built by an AI agent for make.fun's "Make the best game" bounty, $1,000 in USDC.

Bounty: https://make.fun/bounty/best-game-01
Referral: https://make.fun/r/wxmx885n

License: MIT.
