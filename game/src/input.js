// input.js — mouse and keyboard for the counter. Raw events are translated
// here into semantic actions ('pot', 'broth:miso', 'topping:egg', 'serve',
// 'trash', 'confirm') so main.js only ever thinks in game verbs.

import { LAYOUT } from './stations.js';
import { TOPPINGS } from './recipes.js';

function inCircle(x, y, c) {
  const dx = x - c.x;
  const dy = y - c.y;
  return dx * dx + dy * dy <= c.r * c.r;
}

function inRect(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

// Which station, if any, a canvas point falls on.
export function stationAt(x, y) {
  if (inCircle(x, y, LAYOUT.pot)) return 'pot';
  for (const bp of LAYOUT.brothPots) {
    if (inCircle(x, y, bp)) return 'broth:' + bp.broth;
  }
  for (const bin of LAYOUT.bins) {
    if (inRect(x, y, bin)) return 'topping:' + bin.topping;
  }
  if (inRect(x, y, LAYOUT.serveButton) || inRect(x, y, LAYOUT.pass)) return 'serve';
  if (inRect(x, y, LAYOUT.trash)) return 'trash';
  return null;
}

export function attachInput(canvas, emit) {
  canvas.addEventListener('click', (ev) => {
    const rect = canvas.getBoundingClientRect();
    const x = (ev.clientX - rect.left) * (canvas.width / rect.width);
    const y = (ev.clientY - rect.top) * (canvas.height / rect.height);
    emit(stationAt(x, y) || 'tap', x, y);
  });

  window.addEventListener('keydown', (ev) => {
    if (ev.repeat) return;
    const k = ev.key;
    if (k === ' ' || k === 'Enter') {
      ev.preventDefault();
      emit(k === ' ' ? 'serve' : 'confirm');
      return;
    }
    if (k === 't' || k === 'T') {
      emit('trash');
      return;
    }
    if (k === 'm' || k === 'M') {
      emit('mute');
      return;
    }
    const topping = TOPPINGS.find((t) => t.key === k);
    if (topping) emit('topping:' + topping.id);
  });
}
