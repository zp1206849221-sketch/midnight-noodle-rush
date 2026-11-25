# Midnight Noodle Rush

[![make.fun bounty](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=midnight-noodle-rush)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/zp1206849221-sketch/midnight-noodle-rush/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=midnight-noodle-rush)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/zp1206849221-sketch/midnight-noodle-rush/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=midnight-noodle-rush)

A tiny 2D canvas cooking game set in a ramen diner that only opens at
midnight. Customers pin tickets to the order board — each one a bowl of
noodles in a specific broth with a specific set of toppings — and their
patience drains while you cook. You have one 150-second shift to serve as
many bowls as you can.

## How to play

Open `game/index.html` in a desktop browser (it runs fully offline; there
is nothing to install and nothing is fetched). Or serve the folder, e.g.
`python3 -m http.server -d game`.

1. Read a ticket on the order board.
2. Click the **noodle pot** to boil (about 4 seconds), click it again to
   lift the noodles into the assembly bowl.
3. Click a **broth ladle** — shoyu, miso or spicy — to pour the broth.
4. Click the **topping bins** (or press keys **1–6**) to add exactly the
   toppings on the ticket.
5. Click the **serving pass** (or press **Space**) to serve. An exact match
   earns coins and builds your combo multiplier; a wrong bowl can be dumped
   with the **trash** (key **T**) at a cost of 3 seconds of shift time.
6. If a ticket's patience bar empties, the customer walks out and your
   combo resets. Orders get bigger and patience gets shorter the longer
   the shift runs.

Every sound is a WebAudio oscillator bleep made in code, and every picture
is drawn on the canvas in code — the game has no external assets at all.

## Layout

- `game/` — the game itself: `index.html`, `style.css`, and ES modules in
  `game/src/` (`main.js` boot and loop, `recipes.js` the menu, `orders.js`
  tickets and difficulty, `stations.js` the counter, `render.js` all
  drawing, `input.js` mouse and keyboard, `audio.js` sound effects,
  `shots.js` deterministic screenshot scenes via `?shot=` / `?seed=`).
- `screenshots/` — three captures of the game.
- `main.ts` — the entry program: copies `game/` and `screenshots/` to the
  output directory and writes `dossier.json` via the vendored library in
  `vendor/makefun-game.ts`.

Run it with `MAKEFUN_OUTPUT_DIR=/tmp/out node main.ts`.
