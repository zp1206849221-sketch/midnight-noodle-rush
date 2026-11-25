// shots.js — deterministic scenes for the entry screenshots. The page reads
// ?shot=cover|rush|start and ?seed=N from its URL: a seed makes the order
// generator reproducible, and a shot name stages a frozen mid-game moment
// so the captures always show the same, deliberate scene.

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function readShotParams() {
  const q = new URLSearchParams(window.location.search);
  const seedRaw = q.get('seed');
  return {
    shot: q.get('shot'),
    seed: seedRaw === null ? null : Number.parseInt(seedRaw, 10) || 0,
  };
}

function ticket(id, broth, toppings, patience, patienceMax) {
  return { id, broth, toppings, patience, patienceMax };
}

function seedSteam(state, count) {
  state.steam = [];
  for (let i = 0; i < count; i++) {
    state.steam.push({
      x: 168 + (state.rng() - 0.5) * 90,
      y: 330 - state.rng() * 90,
      r: 10 + state.rng() * 16,
      life: state.rng() * 1.6,
      maxLife: 1.6,
    });
  }
}

// Freeze a staged scene: timers hold still, but steam keeps drifting so the
// shot still feels alive.
export function stageScene(state, shot) {
  if (shot === 'start') {
    state.screen = 'title';
    state.frozen = true;
    return true;
  }
  if (shot === 'cover') {
    state.screen = 'play';
    state.frozen = true;
    state.elapsed = 54;
    state.timeLeft = 96;
    state.score = 1240;
    state.coins = 86;
    state.streak = 3;
    state.bestStreak = 4;
    state.served = 6;
    state.lost = 0;
    state.tickets = [
      ticket(7, 'shoyu', ['chashu', 'egg'], 22, 30),
      ticket(8, 'miso', ['corn', 'scallion', 'nori'], 26, 32),
      ticket(9, 'spicy', ['chashu', 'chili', 'egg'], 15, 28),
    ];
    state.bowl = { noodles: true, broth: 'shoyu', toppings: ['chashu'] };
    state.pot = { state: 'boiling', t: 2.4 };
    state.passBowl = { broth: 'miso', toppings: ['egg', 'corn'], t: 99 };
    seedSteam(state, 9);
    return true;
  }
  if (shot === 'rush') {
    state.screen = 'play';
    state.frozen = true;
    state.elapsed = 118;
    state.timeLeft = 41;
    state.score = 3120;
    state.coins = 214;
    state.streak = 6;
    state.bestStreak = 7;
    state.served = 13;
    state.lost = 1;
    state.tickets = [
      ticket(21, 'spicy', ['chili', 'nori', 'chashu', 'egg'], 12, 24),
      ticket(22, 'shoyu', ['egg', 'scallion', 'corn', 'nori', 'chashu'], 19, 26),
      ticket(23, 'miso', ['corn', 'chashu', 'scallion'], 8, 22),
      ticket(24, 'spicy', ['chashu', 'egg', 'chili', 'scallion'], 21, 25),
    ];
    state.bowl = { noodles: true, broth: 'spicy', toppings: ['chili', 'nori'] };
    state.pot = { state: 'done', t: 4 };
    state.passBowl = { broth: 'shoyu', toppings: ['chashu', 'egg', 'scallion'], t: 99 };
    seedSteam(state, 12);
    return true;
  }
  return false;
}
