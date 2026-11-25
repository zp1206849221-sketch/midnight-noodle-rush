// main.js — Midnight Noodle Rush: boot, the game loop, and the rules that
// turn station actions into a working shift. Rendering lives in render.js,
// the menu in recipes.js, tickets in orders.js, the counter in stations.js.

import { drawGame } from './render.js';
import { attachInput } from './input.js';
import { sfx, toggleMute } from './audio.js';
import { updateSpawner, updateTickets, spawnTicket } from './orders.js';
import {
  clickPot,
  updatePot,
  pourBroth,
  addTopping,
  serveBowl,
  trashBowl,
  emptyBowl,
} from './stations.js';
import { readShotParams, mulberry32, stageScene } from './shots.js';

const SHIFT_SECONDS = 150;

function freshState(rng) {
  return {
    screen: 'title',
    frozen: false,
    rng,
    time: 0,
    elapsed: 0,
    timeLeft: SHIFT_SECONDS,
    score: 0,
    coins: 0,
    streak: 0,
    bestStreak: 0,
    served: 0,
    lost: 0,
    tickets: [],
    bowl: emptyBowl(),
    pot: { state: 'idle', t: 0 },
    passBowl: null,
    spawnIn: 0.4,
    steam: [],
    popups: [],
    hint: null,
  };
}

const { shot, seed } = readShotParams();
const rng = seed === null ? Math.random : mulberry32(seed);
let state = freshState(rng);

function startShift() {
  const keepRng = state.rng;
  state = freshState(keepRng);
  state.screen = 'play';
  spawnTicket(state);
  state.spawnIn = 2.2;
  spawnTicket(state);
}

function sayHint(text) {
  state.hint = { text, t: 1.6 };
}

function popup(x, y, text, color) {
  state.popups.push({ x, y, text, color, t: 0, maxT: 1.15 });
}

const HINTS = {
  'bowl-has-noodles': 'The bowl already has noodles — trash it (T) to start over',
  'still-boiling': 'The noodles are still boiling…',
  'needs-noodles': 'Noodles first: boil the pot, then lift them into the bowl',
  'broth-already-in': 'That bowl already has a broth',
  'needs-broth': 'Ladle a broth in before the toppings',
  'topping-already-in': 'That topping is already in the bowl',
  'bowl-full': 'That bowl is full!',
  'nothing-to-serve': 'There is nothing in the bowl to serve',
  'no-match': 'No ticket matches that bowl — check broth and toppings, or trash it (T)',
  'nothing-to-trash': 'The bowl is already empty',
};

function handleAction(action) {
  if (action === 'mute') {
    toggleMute();
    return;
  }
  if (state.screen === 'title') {
    if (action === 'tap' || action === 'confirm' || action === 'serve') startShift();
    return;
  }
  if (state.screen === 'over') {
    if (action === 'tap' || action === 'confirm' || action === 'serve') startShift();
    return;
  }
  if (state.frozen) return; // staged screenshot scene: look, don't touch

  if (action === 'pot') {
    const out = clickPot(state);
    if (out === 'boil-start' || out === 'noodles-in') sfx.pop();
    else if (HINTS[out]) sayHint(HINTS[out]);
    return;
  }
  if (action.startsWith('broth:')) {
    const out = pourBroth(state, action.slice(6));
    if (out === 'broth-in') sfx.pour();
    else if (HINTS[out]) sayHint(HINTS[out]);
    return;
  }
  if (action.startsWith('topping:')) {
    const out = addTopping(state, action.slice(8));
    if (out === 'topping-in') sfx.click();
    else if (HINTS[out]) sayHint(HINTS[out]);
    return;
  }
  if (action === 'serve') {
    const out = serveBowl(state);
    if (typeof out === 'object') {
      sfx.serve();
      popup(out.x, out.y, '+' + out.coins + ' coins', '#ffd83d');
    } else if (HINTS[out]) {
      sayHint(HINTS[out]);
      sfx.error();
    }
    return;
  }
  if (action === 'trash') {
    const out = trashBowl(state);
    if (out === 'trashed') {
      sfx.trash();
      sayHint('Bowl trashed — the shift clock lost 3s');
    } else if (HINTS[out]) sayHint(HINTS[out]);
  }
}

function updateSteam(dt) {
  const boiling = state.pot.state !== 'idle';
  if (boiling && state.steam.length < 26 && Math.random() < 0.35) {
    state.steam.push({
      x: 168 + (Math.random() - 0.5) * 80,
      y: 322,
      r: 8 + Math.random() * 12,
      life: 0,
      maxLife: 1.4 + Math.random() * 0.8,
    });
  }
  for (const p of state.steam) {
    p.life += dt;
    p.y -= 34 * dt;
    p.x += Math.sin((p.life + p.r) * 2.4) * 9 * dt;
    p.r += 5 * dt;
  }
  state.steam = state.steam.filter((p) => p.life < p.maxLife);
}

function update(dt) {
  state.time += dt;
  updateSteam(dt);
  for (const pop of state.popups) pop.t += dt;
  state.popups = state.popups.filter((p) => p.t < p.maxT);
  if (state.hint) state.hint.t -= dt;

  if (state.screen !== 'play' || state.frozen) return;

  state.elapsed += dt;
  state.timeLeft -= dt;
  if (state.timeLeft <= 0) {
    state.timeLeft = 0;
    state.screen = 'over';
    sfx.lose();
    return;
  }
  if (updatePot(state, dt)) sfx.ding();
  if (state.passBowl) {
    state.passBowl.t -= dt;
    if (state.passBowl.t <= 0) state.passBowl = null;
  }
  updateSpawner(state, dt);
  const expired = updateTickets(state, dt);
  if (expired.length) {
    sfx.lose();
    popup(640, 210, 'a customer walked out!', '#ff8a5c');
  }
}

function boot() {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  if (shot) stageScene(state, shot);
  attachInput(canvas, handleAction);
  let last = performance.now();
  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    update(dt);
    drawGame(ctx, state);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

boot();
