const KEY = 'quest-save-v1';

export const state = {
  map: 'ville',
  x: 30.5,
  y: 33.5,
  clues: [],
  flags: {},
  solved: false,
};

export function hasClue(id) {
  return state.clues.includes(id);
}

export function addClue(id) {
  if (hasClue(id)) { return false; }
  state.clues.push(id);
  save();
  return true;
}

export function flag(k) {
  return !!state.flags[k];
}

export function setFlag(k) {
  state.flags[k] = true;
  save();
}

export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* stockage indisponible */ }
}

export function load() {
  try {
    const d = JSON.parse(localStorage.getItem(KEY));
    if (d && typeof d === 'object') {
      Object.assign(state, d);
      return true;
    }
  } catch (e) { /* sauvegarde illisible */ }
  return false;
}

export function hasSave() {
  try { return !!localStorage.getItem(KEY); } catch (e) { return false; }
}

export function reset() {
  try { localStorage.removeItem(KEY); } catch (e) { /* rien */ }
  state.map = 'ville';
  state.x = 30.5;
  state.y = 33.5;
  state.clues = [];
  state.flags = {};
  state.solved = false;
}
