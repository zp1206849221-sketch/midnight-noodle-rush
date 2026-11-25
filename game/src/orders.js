// orders.js — customer tickets: when they arrive, how long they wait, and
// how the rush escalates as the shift wears on.

import { buildRecipe } from './recipes.js';

export const MAX_TICKETS = 4;

// Difficulty is a smooth ramp over the 150-second shift: more toppings per
// bowl, less patience, and new faces arriving sooner.
export function difficultyAt(elapsed) {
  const t = Math.min(elapsed / 150, 1);
  return {
    toppingCount: 2 + Math.floor(t * 3.6), // 2 early, up to 5 late
    patience: 36 - t * 15, // 36s of patience early, ~21s late
    spawnGap: 9 - t * 4.5, // a new ticket every ~9s, then ~4.5s
  };
}

let nextTicketId = 1;

export function spawnTicket(state) {
  if (state.tickets.length >= MAX_TICKETS) return null;
  const d = difficultyAt(state.elapsed);
  const recipe = buildRecipe(state.rng, d.toppingCount);
  const ticket = {
    id: nextTicketId++,
    broth: recipe.broth,
    toppings: recipe.toppings,
    patience: d.patience,
    patienceMax: d.patience,
  };
  state.tickets.push(ticket);
  return ticket;
}

// Keep the board stocked: the first customers arrive quickly, then the gap
// from the difficulty curve takes over.
export function updateSpawner(state, dt) {
  state.spawnIn -= dt;
  if (state.spawnIn <= 0) {
    if (spawnTicket(state)) {
      state.spawnIn = difficultyAt(state.elapsed).spawnGap * (0.75 + state.rng() * 0.5);
    } else {
      state.spawnIn = 1.5; // board full: check again shortly
    }
  }
}

// Drain patience; a ticket that hits zero walks out and breaks the combo.
// Returns the list of tickets that expired this frame.
export function updateTickets(state, dt) {
  const expired = [];
  for (const ticket of state.tickets) {
    ticket.patience -= dt;
    if (ticket.patience <= 0) expired.push(ticket);
  }
  if (expired.length) {
    state.tickets = state.tickets.filter((t) => t.patience > 0);
    state.lost += expired.length;
    state.streak = 0;
  }
  return expired;
}
