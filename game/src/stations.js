// stations.js — the counter: where every station sits on the 1280x800
// canvas, and what each click on a station does to the bowl in progress.

import { BROTHS, TOPPINGS, recipePrice } from './recipes.js';

export const BOIL_SECONDS = 4;
export const TRASH_TIME_COST = 3; // seconds of shift lost per dumped bowl
export const PASS_DISPLAY_SECONDS = 1.4; // how long a served bowl sits on the pass

// Fixed counter geometry. Input hit-tests against these shapes and the
// renderer draws them, so the two can never drift apart.
export const LAYOUT = {
  pot: { x: 168, y: 398, r: 88 },
  brothPots: BROTHS.map((b, i) => ({ broth: b.id, x: 402, y: 268 + i * 128, r: 46 })),
  bowl: { x: 668, y: 402, r: 106 },
  pass: { x: 972, y: 268, w: 272, h: 196, bowlX: 1108, bowlY: 372, bowlR: 62 },
  trash: { x: 1052, y: 500, w: 136, h: 62 },
  bins: TOPPINGS.map((t, i) => ({ topping: t.id, x: 24 + i * 160, y: 566, w: 148, h: 82 })),
  serveButton: { x: 972, y: 500, w: 66, h: 62 },
};

export function emptyBowl() {
  return { noodles: false, broth: null, toppings: [] };
}

export function bowlIsEmpty(bowl) {
  return !bowl.noodles && !bowl.broth && bowl.toppings.length === 0;
}

// A bowl matches a ticket when the noodles are in, the broth is the same,
// and the topping sets are identical (order on the bowl does not matter).
export function bowlMatchesTicket(bowl, ticket) {
  if (!bowl.noodles || bowl.broth !== ticket.broth) return false;
  if (bowl.toppings.length !== ticket.toppings.length) return false;
  const mine = [...bowl.toppings].sort();
  const theirs = [...ticket.toppings].sort();
  return mine.every((id, i) => id === theirs[i]);
}

export function findMatchingTicket(state) {
  return state.tickets.find((t) => bowlMatchesTicket(state.bowl, t)) || null;
}

// --- Station actions. Each returns a short outcome string the game uses for
// --- sound and hint text; the renderer reads state, not these strings.

export function clickPot(state) {
  const pot = state.pot;
  if (pot.state === 'idle') {
    pot.state = 'boiling';
    pot.t = 0;
    return 'boil-start';
  }
  if (pot.state === 'done') {
    if (state.bowl.noodles) return 'bowl-has-noodles';
    state.bowl.noodles = true;
    pot.state = 'idle';
    pot.t = 0;
    return 'noodles-in';
  }
  return 'still-boiling';
}

export function updatePot(state, dt) {
  if (state.pot.state === 'boiling') {
    state.pot.t += dt;
    if (state.pot.t >= BOIL_SECONDS) {
      state.pot.state = 'done';
      state.pot.t = BOIL_SECONDS;
      return true; // just finished: the game dings
    }
  }
  return false;
}

export function pourBroth(state, brothId) {
  if (!state.bowl.noodles) return 'needs-noodles';
  if (state.bowl.broth) return 'broth-already-in';
  state.bowl.broth = brothId;
  return 'broth-in';
}

export function addTopping(state, toppingId) {
  if (!state.bowl.broth) return 'needs-broth';
  if (state.bowl.toppings.includes(toppingId)) return 'topping-already-in';
  if (state.bowl.toppings.length >= 6) return 'bowl-full';
  state.bowl.toppings.push(toppingId);
  return 'topping-in';
}

// Serving: the bowl must match a live ticket exactly. A good serve moves the
// bowl onto the pass with its READY tag, banks coins and feeds the combo.
export function serveBowl(state) {
  if (bowlIsEmpty(state.bowl)) return 'nothing-to-serve';
  const ticket = findMatchingTicket(state);
  if (!ticket) return 'no-match';
  const patienceFrac = Math.max(ticket.patience, 0) / ticket.patienceMax;
  const tip = Math.round(6 * patienceFrac);
  state.streak += 1;
  state.bestStreak = Math.max(state.bestStreak, state.streak);
  const mult = Math.min(1 + 0.25 * (state.streak - 1), 3);
  const coins = Math.round((recipePrice(ticket) + tip) * mult);
  state.coins += coins;
  state.score += coins * 10 + Math.round(40 * patienceFrac);
  state.served += 1;
  state.tickets = state.tickets.filter((t) => t.id !== ticket.id);
  state.passBowl = { broth: state.bowl.broth, toppings: [...state.bowl.toppings], t: PASS_DISPLAY_SECONDS };
  state.bowl = emptyBowl();
  return { served: true, coins, x: LAYOUT.pass.bowlX, y: LAYOUT.pass.bowlY - 70 };
}

export function trashBowl(state) {
  if (bowlIsEmpty(state.bowl)) return 'nothing-to-trash';
  state.bowl = emptyBowl();
  state.timeLeft = Math.max(0, state.timeLeft - TRASH_TIME_COST);
  state.streak = 0;
  return 'trashed';
}
