// recipes.js — the menu of Midnight Noodle Rush: broths, toppings and the
// recipe builder that assembles a customer's bowl order.

export const BROTHS = [
  { id: 'shoyu', name: 'Shoyu', color: '#8a5426', deep: '#5f3714', price: 7 },
  { id: 'miso', name: 'Miso', color: '#c07f35', deep: '#8f5a1e', price: 8 },
  { id: 'spicy', name: 'Spicy', color: '#b23a17', deep: '#7c2410', price: 8 },
];

export const TOPPINGS = [
  { id: 'chashu', name: 'Chashu', key: '1', price: 3 },
  { id: 'egg', name: 'Egg', key: '2', price: 2 },
  { id: 'scallion', name: 'Scallion', key: '3', price: 1 },
  { id: 'corn', name: 'Corn', key: '4', price: 1 },
  { id: 'chili', name: 'Chili Oil', key: '5', price: 1 },
  { id: 'nori', name: 'Nori', key: '6', price: 2 },
];

export function brothById(id) {
  return BROTHS.find((b) => b.id === id) || BROTHS[0];
}

export function toppingById(id) {
  return TOPPINGS.find((t) => t.id === id) || TOPPINGS[0];
}

// A recipe is one broth plus a set of distinct toppings. The rng is injected
// so screenshot staging can build the exact same menu deterministically.
export function buildRecipe(rng, toppingCount) {
  const broth = BROTHS[Math.floor(rng() * BROTHS.length)].id;
  const pool = TOPPINGS.map((t) => t.id);
  const toppings = [];
  const n = Math.min(toppingCount, pool.length);
  for (let i = 0; i < n; i++) {
    const pick = Math.floor(rng() * pool.length);
    toppings.push(pool.splice(pick, 1)[0]);
  }
  return { broth, toppings };
}

// What a finished bowl is worth before tips and combo: broth + toppings.
export function recipePrice(recipe) {
  let total = brothById(recipe.broth).price;
  for (const id of recipe.toppings) total += toppingById(id).price;
  return total;
}
