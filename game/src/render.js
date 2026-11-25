// render.js — every pixel of Midnight Noodle Rush is drawn here in code:
// the diner, the order board, the pot, the bowl and the food inside it.
// No images, no fonts to load, nothing external.

import { BROTHS, TOPPINGS, brothById, toppingById } from './recipes.js';
import { LAYOUT, BOIL_SECONDS } from './stations.js';

export const W = 1280;
export const H = 800;

const CREAM = '#ffe9c4';
const INK = '#2a1608';
const LANTERN = '#ffb347';
const RED = '#d84a2f';
const WOOD = '#7a4a24';
const WOOD_DARK = '#5d3717';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// A stable pseudo-random in [0,1) from a string seed, so toppings always
// scatter to the same spots in the bowl and screenshots stay deterministic.
function hash01(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000) / 1000;
}

// ---------------------------------------------------------------- toppings

// One topping, drawn as food. Used in the bins, on tickets, and in the bowl.
export function drawToppingIcon(ctx, id, x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  if (id === 'chashu') {
    for (const dx of [-0.32, 0.32]) {
      ctx.beginPath();
      ctx.arc(dx * s, 0, s * 0.34, 0, Math.PI * 2);
      ctx.fillStyle = '#b06a44';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(dx * s, 0, s * 0.2, 0, Math.PI * 2);
      ctx.fillStyle = '#e8a58c';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(dx * s, 0, s * 0.1, 0, Math.PI * 2);
      ctx.fillStyle = '#c97e5d';
      ctx.fill();
    }
  } else if (id === 'egg') {
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.52, s * 0.4, -0.3, 0, Math.PI * 2);
    ctx.fillStyle = '#fff6e8';
    ctx.fill();
    ctx.strokeStyle = 'rgba(120,72,20,0.35)';
    ctx.lineWidth = Math.max(1, s * 0.04);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(s * 0.08, 0, s * 0.2, 0, Math.PI * 2);
    ctx.fillStyle = '#f59b23';
    ctx.fill();
  } else if (id === 'scallion') {
    ctx.strokeStyle = '#3f9e4d';
    ctx.lineWidth = s * 0.13;
    for (let i = 0; i < 5; i++) {
      const a = hash01('sc' + i) * Math.PI * 2;
      const px = Math.cos(a) * s * 0.3;
      const py = Math.sin(a) * s * 0.22;
      ctx.beginPath();
      ctx.arc(px, py, s * 0.11, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else if (id === 'corn') {
    // a little cob: golden kernels in neat rows on a tilted ear
    ctx.save();
    ctx.rotate(-0.35);
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.3, s * 0.48, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#f7b733';
    ctx.fill();
    ctx.fillStyle = '#ffd83d';
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 3; c++) {
        ctx.beginPath();
        ctx.arc((c - 1) * s * 0.17, (r - 1.5) * s * 0.2, s * 0.075, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
    // husk leaves at the base
    ctx.fillStyle = '#4c9a4c';
    ctx.beginPath();
    ctx.moveTo(-s * 0.3, s * 0.42);
    ctx.lineTo(0, s * 0.18);
    ctx.lineTo(s * 0.05, s * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(s * 0.32, s * 0.4);
    ctx.lineTo(s * 0.05, s * 0.16);
    ctx.lineTo(-s * 0.02, s * 0.5);
    ctx.closePath();
    ctx.fill();
  } else if (id === 'chili') {
    ctx.strokeStyle = '#d43a1e';
    ctx.lineWidth = s * 0.12;
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.34, 0.4, Math.PI * 1.7);
    ctx.stroke();
    ctx.fillStyle = '#e8532f';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc((hash01('ch' + i) - 0.5) * s * 0.6, (hash01('chy' + i) - 0.5) * s * 0.4, s * 0.08, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (id === 'nori') {
    for (const dx of [-0.26, 0.1]) {
      ctx.save();
      ctx.translate(dx * s, -s * 0.08);
      ctx.rotate(dx * 0.5);
      ctx.fillStyle = '#24402e';
      ctx.fillRect(-s * 0.2, -s * 0.42, s * 0.4, s * 0.72);
      ctx.fillStyle = 'rgba(140,220,160,0.35)';
      ctx.fillRect(-s * 0.2, -s * 0.42, s * 0.4, s * 0.07);
      ctx.fillRect(-s * 0.13, -s * 0.42, s * 0.05, s * 0.72);
      ctx.restore();
    }
  }
  ctx.restore();
}

// ---------------------------------------------------------------- the bowl

// A bowl of ramen from above-ish: rim, broth, noodle swirls, then each
// topping scattered at its hashed spot. Shared by the assembly bowl and the
// finished bowl waiting on the pass.
export function drawBowl(ctx, bowl, x, y, r) {
  // bowl body
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = '#274b73';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x, y, r * 0.94, 0, Math.PI * 2);
  ctx.fillStyle = '#f3ede2';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x, y, r * 0.84, 0, Math.PI * 2);
  if (bowl.broth) {
    ctx.fillStyle = brothById(bowl.broth).color;
  } else if (bowl.noodles) {
    ctx.fillStyle = '#e9d9ae';
  } else {
    ctx.fillStyle = '#ddd5c6';
  }
  ctx.fill();

  if (bowl.noodles) {
    // noodle swirls peeking through the broth
    ctx.strokeStyle = bowl.broth ? '#f2d98c' : '#d9bd76';
    ctx.lineWidth = r * 0.045;
    for (let i = 0; i < 6; i++) {
      const a = hash01('nd' + i) * Math.PI * 2;
      const px = x + Math.cos(a) * r * 0.42;
      const py = y + Math.sin(a) * r * 0.34;
      ctx.beginPath();
      ctx.arc(px, py, r * 0.13, 0.3, Math.PI * 1.5);
      ctx.stroke();
    }
  }
  if (bowl.broth && bowl.noodles) {
    // broth sheen
    ctx.beginPath();
    ctx.ellipse(x - r * 0.3, y - r * 0.38, r * 0.3, r * 0.12, -0.5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fill();
  }

  bowl.toppings.forEach((id, i) => {
    const a = hash01(id + ':a') * Math.PI * 2 + i * 0.7;
    const dist = r * (0.18 + hash01(id + ':d') * 0.42);
    const px = x + Math.cos(a) * dist;
    const py = y + Math.sin(a) * dist * 0.82;
    drawToppingIcon(ctx, id, px, py, r * 0.42);
  });

  // rim highlight
  ctx.beginPath();
  ctx.arc(x, y, r * 0.97, Math.PI * 1.05, Math.PI * 1.55);
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = r * 0.05;
  ctx.stroke();
}

// ---------------------------------------------------------------- backdrop

function drawBackdrop(ctx, state) {
  // wall
  const wall = ctx.createLinearGradient(0, 0, 0, 660);
  wall.addColorStop(0, '#3a2013');
  wall.addColorStop(1, '#54301b');
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, W, 664);

  // hanging lanterns
  for (const lx of [120, 640, 1160]) {
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(lx, 150);
    ctx.lineTo(lx, 178);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(lx, 196, 26, 19, 0, 0, Math.PI * 2);
    ctx.fillStyle = LANTERN;
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(lx, 196, 26, 19, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,120,40,0.25)';
    ctx.fill();
  }

  // counter top
  const wood = ctx.createLinearGradient(0, 168, 0, 664);
  wood.addColorStop(0, '#8a5a2e');
  wood.addColorStop(1, WOOD);
  ctx.fillStyle = wood;
  ctx.fillRect(0, 168, W, 496);
  ctx.strokeStyle = 'rgba(60,32,10,0.35)';
  ctx.lineWidth = 2;
  for (const py of [290, 470]) {
    ctx.beginPath();
    ctx.moveTo(0, py);
    ctx.lineTo(W, py);
    ctx.stroke();
  }
  ctx.fillStyle = WOOD_DARK;
  ctx.fillRect(0, 160, W, 10);

  // steam from the pot
  for (const p of state.steam) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,250,240,${0.16 * (1 - p.life / p.maxLife)})`;
    ctx.fill();
  }
}

// ---------------------------------------------------------------- tickets

function drawTickets(ctx, state) {
  for (let i = 0; i < 4; i++) {
    const x = 16 + i * 312;
    const y = 14;
    const w = 296;
    const h = 132;
    const ticket = state.tickets[i];
    ctx.save();
    if (!ticket) {
      ctx.globalAlpha = 0.35;
      rr(ctx, x, y, w, h, 10);
      ctx.fillStyle = '#241407';
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = 'rgba(255,233,196,0.5)';
      ctx.font = '600 17px Verdana, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('— waiting for orders —', x + w / 2, y + 72);
      ctx.restore();
      continue;
    }
    rr(ctx, x, y, w, h, 10);
    ctx.fillStyle = '#fdf6e3';
    ctx.fill();
    ctx.strokeStyle = '#c9b083';
    ctx.lineWidth = 2;
    ctx.stroke();

    // header: order number + broth chip
    ctx.fillStyle = INK;
    ctx.font = '700 17px Verdana, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('ORDER #' + ticket.id, x + 14, y + 28);
    const broth = brothById(ticket.broth);
    rr(ctx, x + w - 108, y + 10, 94, 26, 13);
    ctx.fillStyle = broth.color;
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '700 14px Verdana, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(broth.name.toUpperCase() + ' ×1', x + w - 61, y + 28);

    // noodle + topping checklist; items already in a matching bowl light up
    const inBowl = state.bowl.broth === ticket.broth && state.bowl.noodles;
    ctx.font = '600 13px Verdana, sans-serif';
    ctx.textAlign = 'left';
    const items = [{ id: 'noodles', name: 'Noodles' }, ...ticket.toppings.map((id) => ({ id, name: toppingById(id).name }))];
    items.forEach((item, j) => {
      const ix = x + 16 + (j % 3) * 96;
      const iy = y + 58 + Math.floor(j / 3) * 34;
      const done = item.id === 'noodles' ? inBowl : inBowl && state.bowl.toppings.includes(item.id);
      if (item.id !== 'noodles') drawToppingIcon(ctx, item.id, ix + 10, iy - 4, 17);
      else {
        ctx.strokeStyle = '#d9bd76';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(ix + 10, iy - 4, 8, 0.4, Math.PI * 1.6);
        ctx.stroke();
      }
      ctx.fillStyle = done ? '#2e7d32' : INK;
      ctx.fillText((done ? '✓ ' : '') + item.name, ix + 24, iy);
    });

    // patience bar
    const frac = Math.max(ticket.patience, 0) / ticket.patienceMax;
    rr(ctx, x + 14, y + h - 20, w - 28, 9, 4);
    ctx.fillStyle = '#e3d5b8';
    ctx.fill();
    rr(ctx, x + 14, y + h - 20, (w - 28) * frac, 9, 4);
    ctx.fillStyle = frac > 0.5 ? '#58a34c' : frac > 0.25 ? '#e8a13a' : RED;
    ctx.fill();
    ctx.restore();
  }
}

// ---------------------------------------------------------------- stations

function drawPot(ctx, state) {
  const { x, y, r } = LAYOUT.pot;
  // burner
  ctx.beginPath();
  ctx.ellipse(x, y + r * 0.82, r * 0.92, r * 0.22, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#33231a';
  ctx.fill();
  if (state.pot.state !== 'idle') {
    ctx.beginPath();
    ctx.ellipse(x, y + r * 0.8, r * 0.6, r * 0.13, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,110,40,0.75)';
    ctx.fill();
  }
  // pot body
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = '#3d4450';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x, y, r * 0.86, 0, Math.PI * 2);
  ctx.fillStyle = state.pot.state === 'idle' ? '#20262e' : '#9fc6d8';
  ctx.fill();
  if (state.pot.state !== 'idle') {
    // bubbling water + noodle mound when ready
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    for (let i = 0; i < 5; i++) {
      const a = hash01('bub' + i + Math.floor(state.time * 2)) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(x + Math.cos(a) * r * 0.5, y + Math.sin(a) * r * 0.4, r * 0.07, 0, Math.PI * 2);
      ctx.fill();
    }
    if (state.pot.state === 'done') {
      ctx.strokeStyle = '#f2d98c';
      ctx.lineWidth = 5;
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.arc(x - 30 + i * 20, y - 6 + (i % 2) * 12, 11, 0.3, Math.PI * 1.5);
        ctx.stroke();
      }
    }
  }
  // progress ring
  if (state.pot.state === 'boiling') {
    ctx.beginPath();
    ctx.arc(x, y, r + 9, -Math.PI / 2, -Math.PI / 2 + (state.pot.t / BOIL_SECONDS) * Math.PI * 2);
    ctx.strokeStyle = '#ffb347';
    ctx.lineWidth = 7;
    ctx.stroke();
  } else if (state.pot.state === 'done') {
    ctx.beginPath();
    ctx.arc(x, y, r + 9, 0, Math.PI * 2);
    ctx.strokeStyle = '#7ed37e';
    ctx.lineWidth = 5;
    ctx.stroke();
  }
  // label
  ctx.fillStyle = CREAM;
  ctx.font = '700 16px Verdana, sans-serif';
  ctx.textAlign = 'center';
  const label = state.pot.state === 'idle' ? 'NOODLE POT · click to boil' : state.pot.state === 'boiling' ? 'BOILING…' : 'DONE · click to lift noodles';
  ctx.fillText(label, x, y + r + 34);
}

function drawBrothPots(ctx) {
  for (const bp of LAYOUT.brothPots) {
    const broth = brothById(bp.broth);
    ctx.beginPath();
    ctx.arc(bp.x, bp.y, bp.r, 0, Math.PI * 2);
    ctx.fillStyle = '#3d4450';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(bp.x, bp.y, bp.r * 0.82, 0, Math.PI * 2);
    ctx.fillStyle = broth.color;
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(bp.x - bp.r * 0.3, bp.y - bp.r * 0.35, bp.r * 0.28, bp.r * 0.1, -0.5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fill();
    ctx.fillStyle = CREAM;
    ctx.font = '700 15px Verdana, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(broth.name.toUpperCase(), bp.x + bp.r + 10, bp.y + 5);
  }
  ctx.fillStyle = 'rgba(255,233,196,0.75)';
  ctx.font = '600 13px Verdana, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('BROTH LADLES', LAYOUT.brothPots[0].x - 40, LAYOUT.brothPots[0].y - 66);
}

function drawBins(ctx) {
  for (const bin of LAYOUT.bins) {
    const topping = toppingById(bin.topping);
    rr(ctx, bin.x, bin.y, bin.w, bin.h, 10);
    ctx.fillStyle = '#4a2c14';
    ctx.fill();
    ctx.strokeStyle = '#8a5a2e';
    ctx.lineWidth = 2;
    ctx.stroke();
    drawToppingIcon(ctx, bin.topping, bin.x + 34, bin.y + 40, 44);
    ctx.fillStyle = CREAM;
    ctx.font = '700 15px Verdana, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(topping.name, bin.x + 62, bin.y + 36);
    ctx.fillStyle = 'rgba(255,233,196,0.65)';
    ctx.font = '600 12px Verdana, sans-serif';
    ctx.fillText('key ' + topping.key, bin.x + 62, bin.y + 58);
  }
}

function drawPassAndTrash(ctx, state) {
  const p = LAYOUT.pass;
  rr(ctx, p.x, p.y, p.w, p.h, 12);
  ctx.fillStyle = '#5d3a1c';
  ctx.fill();
  ctx.strokeStyle = '#a8763e';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,233,196,0.8)';
  ctx.font = '700 15px Verdana, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SERVING PASS', p.x + p.w / 2, p.y + 26);

  if (state.passBowl) {
    drawBowl(ctx, state.passBowl, p.bowlX, p.bowlY, p.bowlR);
    // READY tag
    ctx.save();
    ctx.translate(p.bowlX + 52, p.bowlY - 58);
    ctx.rotate(-0.18);
    rr(ctx, -42, -16, 84, 32, 6);
    ctx.fillStyle = RED;
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '800 19px Verdana, sans-serif';
    ctx.fillText('READY', 0, 7);
    ctx.restore();
  } else {
    ctx.fillStyle = 'rgba(255,233,196,0.4)';
    ctx.font = '600 14px Verdana, sans-serif';
    ctx.fillText('serve a matching bowl →', p.x + p.w / 2, p.bowlY + 5);
  }

  // serve button
  const sb = LAYOUT.serveButton;
  rr(ctx, sb.x, sb.y, sb.w, sb.h, 10);
  ctx.fillStyle = '#2e7d32';
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = '800 13px Verdana, sans-serif';
  ctx.fillText('SERVE', sb.x + sb.w / 2, sb.y + 28);
  ctx.font = '600 10px Verdana, sans-serif';
  ctx.fillText('SPACE', sb.x + sb.w / 2, sb.y + 46);

  // trash bin
  const t = LAYOUT.trash;
  rr(ctx, t.x, t.y, t.w, t.h, 10);
  ctx.fillStyle = '#37474f';
  ctx.fill();
  ctx.strokeStyle = '#607d8b';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#eceff1';
  ctx.font = '800 14px Verdana, sans-serif';
  ctx.fillText('🗑 TRASH', t.x + t.w / 2, t.y + 30);
  ctx.font = '600 10px Verdana, sans-serif';
  ctx.fillStyle = 'rgba(236,239,241,0.7)';
  ctx.fillText('key T · −3s', t.x + t.w / 2, t.y + 48);
}

// ---------------------------------------------------------------- HUD

function drawHUD(ctx, state) {
  ctx.fillStyle = '#1d0f06';
  ctx.fillRect(0, 664, W, 136);
  ctx.fillStyle = '#0f0703';
  ctx.fillRect(0, 664, W, 4);

  // shift timer
  const frac = Math.max(state.timeLeft, 0) / 150;
  ctx.fillStyle = CREAM;
  ctx.font = '700 17px Verdana, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('SHIFT  ' + Math.ceil(Math.max(state.timeLeft, 0)) + 's', 24, 700);
  rr(ctx, 24, 712, 430, 16, 8);
  ctx.fillStyle = '#3a2410';
  ctx.fill();
  rr(ctx, 24, 712, 430 * frac, 16, 8);
  ctx.fillStyle = frac > 0.25 ? '#ffb347' : RED;
  ctx.fill();

  // score / coins / combo
  ctx.font = '700 24px Verdana, sans-serif';
  ctx.fillStyle = CREAM;
  ctx.fillText('SCORE ' + state.score, 500, 716);
  ctx.fillStyle = '#ffd83d';
  ctx.fillText('◉ ' + state.coins + ' coins', 760, 716);
  if (state.streak >= 2) {
    const mult = Math.min(1 + 0.25 * (state.streak - 1), 3);
    ctx.fillStyle = '#ff8a5c';
    ctx.fillText('COMBO ×' + mult.toFixed(2).replace(/\.?0+$/, '') + '  (' + state.streak + ' in a row)', 500, 756);
  } else {
    ctx.fillStyle = 'rgba(255,233,196,0.55)';
    ctx.font = '600 16px Verdana, sans-serif';
    ctx.fillText('serve bowls back-to-back to build a combo', 500, 752);
  }
  ctx.fillStyle = 'rgba(255,233,196,0.55)';
  ctx.font = '600 14px Verdana, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('served ' + state.served + ' · lost ' + state.lost + ' · M mute', W - 24, 756);

  // transient hint line
  if (state.hint && state.hint.t > 0) {
    ctx.globalAlpha = Math.min(1, state.hint.t);
    ctx.fillStyle = '#ffe9c4';
    ctx.font = '700 19px Verdana, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(state.hint.text, W / 2, 190);
    ctx.globalAlpha = 1;
  }

  // floating popups (+coins and friends)
  for (const pop of state.popups) {
    ctx.globalAlpha = Math.max(0, 1 - pop.t / pop.maxT);
    ctx.fillStyle = pop.color;
    ctx.font = '800 24px Verdana, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(pop.text, pop.x, pop.y - pop.t * 34);
    ctx.globalAlpha = 1;
  }
}

// ---------------------------------------------------------------- screens

function drawTitle(ctx, state) {
  ctx.fillStyle = '#221206';
  ctx.fillRect(0, 0, W, H);
  for (const lx of [180, 640, 1100]) {
    ctx.strokeStyle = 'rgba(255,233,196,0.35)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(lx, 0);
    ctx.lineTo(lx, 52);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(lx, 76, 34, 24, 0, 0, Math.PI * 2);
    ctx.fillStyle = LANTERN;
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(lx, 76, 34, 24, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,120,40,0.22)';
    ctx.fill();
  }
  drawBowl(ctx, { noodles: true, broth: 'spicy', toppings: ['chashu', 'egg', 'nori', 'scallion'] }, W / 2, 336, 92);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffb347';
  ctx.font = '800 64px Georgia, serif';
  ctx.fillText('MIDNIGHT NOODLE RUSH', W / 2, 208);
  ctx.fillStyle = CREAM;
  ctx.font = '600 21px Verdana, sans-serif';
  ctx.fillText('a tiny ramen counter, open till late', W / 2, 478);
  ctx.font = '500 19px Verdana, sans-serif';
  ctx.fillStyle = 'rgba(255,233,196,0.9)';
  const lines = [
    'Read the tickets on the board. Click the pot to boil noodles (4s), click it again to lift them out.',
    'Ladle in the right broth, click the topping bins (or keys 1–6) to match the ticket exactly,',
    'then hit the SERVING PASS (or Space) before patience runs out. Wrong bowl? Trash it (T) — it costs 3s.',
    'Chain serves to grow your combo multiplier. You have 150 seconds. Good luck, chef.',
  ];
  lines.forEach((line, i) => ctx.fillText(line, W / 2, 528 + i * 30));
  ctx.fillStyle = RED;
  rr(ctx, W / 2 - 130, 676, 260, 56, 12);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = '800 22px Verdana, sans-serif';
  ctx.fillText('OPEN THE SHOP', W / 2, 712);
  ctx.fillStyle = 'rgba(255,233,196,0.6)';
  ctx.font = '600 15px Verdana, sans-serif';
  ctx.fillText('click anywhere or press Enter', W / 2, 762);
}

function drawGameOver(ctx, state) {
  drawBackdrop(ctx, state);
  ctx.fillStyle = 'rgba(20,9,3,0.82)';
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffb347';
  ctx.font = '800 54px Georgia, serif';
  ctx.fillText('SHIFT OVER', W / 2, 250);
  drawBowl(ctx, { noodles: true, broth: 'miso', toppings: ['egg', 'corn', 'scallion'] }, W / 2, 360, 64);
  ctx.fillStyle = CREAM;
  ctx.font = '700 26px Verdana, sans-serif';
  ctx.fillText('You earned ◉ ' + state.coins + ' coins', W / 2, 486);
  ctx.font = '500 20px Verdana, sans-serif';
  ctx.fillText('score ' + state.score + ' · bowls served ' + state.served + ' · customers lost ' + state.lost + ' · best combo streak ' + state.bestStreak, W / 2, 526);
  ctx.fillStyle = RED;
  rr(ctx, W / 2 - 120, 576, 240, 54, 12);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = '800 21px Verdana, sans-serif';
  ctx.fillText('WORK ANOTHER SHIFT', W / 2, 611);
  ctx.fillStyle = 'rgba(255,233,196,0.6)';
  ctx.font = '600 15px Verdana, sans-serif';
  ctx.fillText('click or press Enter', W / 2, 662);
}

// ---------------------------------------------------------------- entry

export function drawGame(ctx, state) {
  if (state.screen === 'title') {
    drawTitle(ctx, state);
    return;
  }
  if (state.screen === 'over') {
    drawGameOver(ctx, state);
    return;
  }
  drawBackdrop(ctx, state);
  drawTickets(ctx, state);
  drawPot(ctx, state);
  drawBrothPots(ctx);
  // assembly bowl + its stand label
  drawBowl(ctx, state.bowl, LAYOUT.bowl.x, LAYOUT.bowl.y, LAYOUT.bowl.r);
  ctx.fillStyle = CREAM;
  ctx.font = '700 16px Verdana, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('ASSEMBLY BOWL', LAYOUT.bowl.x, LAYOUT.bowl.y + LAYOUT.bowl.r + 34);
  drawBins(ctx);
  drawPassAndTrash(ctx, state);
  drawHUD(ctx, state);
}
