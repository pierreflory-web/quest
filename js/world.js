export const TILE = 32;

export const T = {
  GRASS: 0,
  PATH: 1,
  SAND: 2,
  PAVE: 3,
  FLOOR: 4,
  WALL: 5,
  DARK: 6,
  MALL: 7,
  ROAD: 8,
};

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeMap(id, w, h, seed) {
  return {
    id, w, h, seed,
    ground: new Uint8Array(w * h),
    solid: new Uint8Array(w * h),
    props: [],
    npcs: [],
    interactables: [],
    portals: [],
    movers: [],
    _canvas: null,
  };
}

function setGround(m, x, y, t) { m.ground[y * m.w + x] = t; }
function getGround(m, x, y) { return m.ground[y * m.w + x]; }
function setSolid(m, x, y, v = 1) {
  if (x >= 0 && y >= 0 && x < m.w && y < m.h) { m.solid[y * m.w + x] = v; }
}

export function isSolid(m, x, y) {
  const tx = Math.floor(x), ty = Math.floor(y);
  if (tx < 0 || ty < 0 || tx >= m.w || ty >= m.h) { return true; }
  return m.solid[ty * m.w + tx] === 1;
}

function fillGround(m, x0, y0, x1, y1, t) {
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) { setGround(m, x, y, t); }
  }
}

function solidRect(m, x0, y0, x1, y1) {
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) { setSolid(m, x, y); }
  }
}

function prop(m, type, x, y, opts = {}) {
  m.props.push({ type, x, y, ...opts });
}

function npc(m, id, name, x, y, style) {
  m.npcs.push({ id, name, x, y, ...style });
}

function poi(m, id, x, y, r = 1.6) {
  m.interactables.push({ id, x, y, r });
}

/* ================= VILLE ================= */

function buildVille() {
  const m = makeMap('ville', 60, 60, 42);
  const rng = mulberry32(7);

  for (let y = 0; y < 60; y++) {
    for (let x = 0; x < 60; x++) {
      let g = T.GRASS;
      if (y >= 42) { g = T.SAND; }
      if (x <= 19 && y >= 42 && y <= 47) { g = T.GRASS; }
      if (x >= 20 && x <= 40 && y >= 20 && y <= 40) { g = T.PAVE; }
      if (x >= 41 && y >= 18 && y <= 42) { g = T.PAVE; }
      setGround(m, x, y, g);
    }
  }

  for (let y = 0; y < 60; y++) {
    for (let x = 29; x <= 31; x++) {
      if (getGround(m, x, y) !== T.PAVE) { setGround(m, x, y, T.ROAD); }
    }
  }
  for (let x = 0; x < 60; x++) {
    for (let y = 29; y <= 31; y++) {
      if (getGround(m, x, y) !== T.PAVE) { setGround(m, x, y, T.ROAD); }
    }
  }
  /* Une allée ne recouvre jamais la route lumineuse ni la place. */
  const setPath = (x, y) => {
    const g = getGround(m, x, y);
    if (g !== T.ROAD && g !== T.PAVE) { setGround(m, x, y, T.PATH); }
  };

  for (let x = 3; x <= 56; x++) { setPath(x, 8); }

  /* Réseau d'allées : chaque lieu rejoint le carrefour central. */
  for (let y = 2; y <= 8; y++) { setPath(12, y); setPath(45, y); }
  for (let y = 16; y <= 28; y++) { setPath(13, y); }
  for (let y = 9; y <= 16; y++) { setPath(17, y); }
  for (let x = 14; x <= 16; x++) { setPath(x, 16); }
  for (let y = 25; y <= 28; y++) { setPath(8, y); }
  for (let y = 32; y <= 49; y++) { setPath(12, y); }
  for (let x = 13; x <= 17; x++) { setPath(x, 34); }
  for (let x = 5; x <= 11; x++) { setPath(x, 38); }
  for (let x = 5; x <= 12; x++) { setPath(x, 44); }
  for (let x = 32; x <= 35; x++) { setPath(x, 50); }
  for (let x = 26; x <= 28; x++) { setPath(x, 53); }

  for (let i = 0; i < 60; i++) {
    setSolid(m, i, 0); setSolid(m, i, 59); setSolid(m, 0, i); setSolid(m, 59, i);
  }

  /* --- Usine centrale (RoboCorp) --- */
  solidRect(m, 24, 21, 36, 27);
  prop(m, 'usine', 24, 21, { w: 13, h: 7, door: 30 });
  setSolid(m, 30, 27, 0);
  m.portals.push({ x: 30, y: 27, to: 'usine', tx: 11.5, ty: 12.2 });
  prop(m, 'fontaine', 24, 34);
  solidRect(m, 24, 34, 25, 35);
  poi(m, 'fontaine', 25, 35, 2);
  prop(m, 'lamp', 21, 21); prop(m, 'lamp', 39, 21);
  prop(m, 'lamp', 21, 39); prop(m, 'lamp', 39, 39);
  prop(m, 'lamp', 28, 4); prop(m, 'lamp', 32, 14);
  prop(m, 'lamp', 28, 46); prop(m, 'lamp', 32, 56);
  prop(m, 'lamp', 8, 32); prop(m, 'lamp', 16, 28);
  prop(m, 'statue', 36, 34);
  solidRect(m, 36, 34, 37, 35);
  poi(m, 'statue', 37, 36.2, 1.8);
  prop(m, 'billboard', 21, 23);
  solidRect(m, 21, 23, 22, 23);
  poi(m, 'affiche', 22, 24.2, 1.6);
  prop(m, 'vending', 22, 32);
  setSolid(m, 22, 32);
  poi(m, 'distributeur', 22.5, 33.2, 1.2);
  prop(m, 'vending', 38, 27);
  setSolid(m, 38, 27);
  poi(m, 'distributeur', 38.5, 28.2, 1.2);
  prop(m, 'bin', 23, 36); setSolid(m, 23, 36);
  prop(m, 'bin', 37, 36); setSolid(m, 37, 36);
  poi(m, 'poubelle', 23.5, 37, 1.1);
  poi(m, 'poubelle', 37.5, 37, 1.1);

  /* Écran géant d'informations (texte défilant animé). */
  prop(m, 'bigscreen', 25, 38);
  solidRect(m, 25, 38, 28, 39);
  m.movers.push({ type: 'ticker', x: 25, y: 38, w: 4 });

  /* Café-terrasse « Le Circuit Court ». */
  prop(m, 'cafe', 37, 22);
  solidRect(m, 37, 22, 39, 23);
  prop(m, 'parasol', 37, 25); setSolid(m, 37, 25);
  prop(m, 'parasol', 39, 25); setSolid(m, 39, 25);
  poi(m, 'cafe', 38, 26.6, 1.4);

  /* Horloge holographique (heure réelle). */
  prop(m, 'clockbase', 33, 36);
  setSolid(m, 33, 36);
  poi(m, 'horloge', 33.5, 37.2, 1.3);
  m.movers.push({ type: 'clock', x: 33, y: 36 });

  /* Food-truck « Wok-È-Watt ». */
  prop(m, 'foodtruck', 20, 27);
  solidRect(m, 20, 27, 22, 28);
  poi(m, 'foodtruck', 23.3, 28, 1.4);

  m.movers.push(
    { type: 'bird', x: 26, y: 33, hx: 26, hy: 33, mode: 'ground', mech: true },
    { type: 'bird', x: 35, y: 37.5, hx: 35, hy: 37.5, mode: 'ground', mech: true },
  );

  /* --- Nord : grand jardin --- */
  prop(m, 'swing', 10, 3); solidRect(m, 10, 3, 11, 4);
  prop(m, 'swing', 14, 3); solidRect(m, 14, 3, 15, 4);
  poi(m, 'balancoires', 13, 4.5, 2.4);
  for (let i = 0; i < 26; i++) {
    const x = 44 + Math.floor(rng() * 13);
    const y = 2 + Math.floor(rng() * 5);
    if (getGround(m, x, y) === T.GRASS && !m.solid[y * 60 + x]) {
      prop(m, 'bamboo', x, y);
      setSolid(m, x, y);
    }
  }
  poi(m, 'bambous', 50, 8, 2.4);
  for (const bx of [20, 26, 34]) {
    prop(m, 'bench', bx, 7);
    setSolid(m, bx, 7);
    poi(m, 'banc', bx + 0.5, 8, 1.2);
  }
  prop(m, 'birdbath', 42, 12);
  setSolid(m, 42, 12);
  poi(m, 'oiseaux', 42.5, 13.4, 1.3);

  /* Étang aux nénuphars traversé par un pont de bois (colonne x5-x6). */
  prop(m, 'gpond', 3, 2);
  solidRect(m, 3, 2, 8, 5);
  for (let y = 2; y <= 5; y++) { setSolid(m, 5, y, 0); setSolid(m, 6, y, 0); }
  poi(m, 'etang', 4, 6.4, 1.6);

  /* Kiosque à musique. */
  prop(m, 'gazebo', 34, 4);
  solidRect(m, 34, 4, 36, 6);
  poi(m, 'kiosque', 35.5, 7.2, 1.6);

  /* Labyrinthe de haies, topiaire au centre. */
  const maze = [];
  for (let x = 37; x <= 43; x++) { maze.push([x, 1]); }
  for (const y of [2, 3, 4, 5, 6]) { maze.push([37, y]); maze.push([43, y]); }
  for (const x of [39, 40, 41]) { maze.push([x, 3]); }
  for (const y of [4, 5, 6]) { maze.push([39, y]); maze.push([41, y]); }
  for (const x of [37, 38, 39, 41, 42, 43]) { maze.push([x, 7]); }
  for (const [hx, hy] of maze) {
    prop(m, 'hedge', hx, hy);
    setSolid(m, hx, hy);
  }
  prop(m, 'topiary', 40, 4);
  setSolid(m, 40, 4);
  poi(m, 'topiaire', 40.5, 5.5, 1.2);
  poi(m, 'labyrinthe', 40.5, 8.4, 1.3);

  /* Statues du jardin. */
  prop(m, 'gstatue', 18, 11);
  setSolid(m, 18, 11);
  poi(m, 'statuerobot', 18.5, 12.4, 1.3);
  prop(m, 'gstatue', 33, 12, { kind: 'chat' });
  setSolid(m, 33, 12);
  poi(m, 'statuechat', 33.5, 13.4, 1.3);

  m.movers.push(
    { type: 'butterfly', cx: 24, cy: 10, rx: 2.2, ry: 1.4, hue: 330, ph: 0 },
    { type: 'butterfly', cx: 33.5, cy: 10.5, rx: 1.8, ry: 1.2, hue: 50, ph: 2.1 },
    { type: 'butterfly', cx: 9, cy: 7, rx: 1.6, ry: 1.1, hue: 210, ph: 4.4 },
    { type: 'bird', x: 26, y: 11, hx: 26, hy: 11, mode: 'ground' },
    { type: 'bird', x: 36, y: 13, hx: 36, hy: 13, mode: 'ground' },
    { type: 'squirrel', x0: 20, x1: 27, y0: 14, ph: 0.3 },
  );

  for (let i = 0; i < 55; i++) {
    const x = 2 + Math.floor(rng() * 56);
    const y = 1 + Math.floor(rng() * 16);
    if (y >= 7 && y <= 9) { continue; }
    if (x >= 28 && x <= 32) { continue; }
    if (x >= 9 && x <= 16 && y <= 5) { continue; }
    if (x >= 37 && x <= 43 && y <= 7) { continue; }
    if (x >= 3 && x <= 8 && y >= 2 && y <= 5) { continue; }
    if (getGround(m, x, y) === T.GRASS && !m.solid[y * 60 + x]) {
      prop(m, 'tree', x, y);
      setSolid(m, x, y);
    }
  }
  for (let i = 0; i < 40; i++) {
    const x = 2 + Math.floor(rng() * 56);
    const y = 1 + Math.floor(rng() * 17);
    if (getGround(m, x, y) === T.GRASS && !m.solid[y * 60 + x]) {
      prop(m, 'flower', x, y, { hue: Math.floor(rng() * 360) });
    }
  }

  /* --- Ouest : parc d'attractions --- */
  solidRect(m, 4, 19, 12, 24);
  prop(m, 'hante', 4, 19, { w: 9, h: 6, door: 8 });
  setSolid(m, 8, 24, 0);
  m.portals.push({ x: 8, y: 24, to: 'hante', tx: 8.5, ty: 9.2, lockedFlag: 'aveux' });

  for (let x = 3; x <= 16; x += 2) { prop(m, 'coaster', x, 15); }
  solidRect(m, 3, 15, 16, 15);
  poi(m, 'comete', 9, 16.5, 3);

  prop(m, 'carousel', 8, 34);
  for (let y = 33; y <= 36; y++) {
    for (let x = 7; x <= 10; x++) { setSolid(m, x, y); }
  }
  poi(m, 'carrousel', 9, 37, 2.2);

  prop(m, 'pond', 4, 39);
  solidRect(m, 4, 39, 7, 41);
  poi(m, 'canards', 5.5, 42, 2.2);

  prop(m, 'stand', 14, 33);
  solidRect(m, 14, 33, 15, 33);

  prop(m, 'archery', 3, 45);
  solidRect(m, 3, 45, 6, 45);
  poi(m, 'tir', 2.8, 46.3, 1.3);

  prop(m, 'bunting', 2, 27, { w: 15 });
  prop(m, 'stand', 13, 40, { label: 'BARBE À PAPA', pink: true });
  solidRect(m, 13, 40, 14, 40);
  poi(m, 'confiserie', 15.6, 41.0, 1.2);
  prop(m, 'pot', 1, 33); setSolid(m, 1, 33);
  prop(m, 'pot', 2, 22); setSolid(m, 2, 22);
  prop(m, 'pot', 17, 38); setSolid(m, 17, 38);

  prop(m, 'droptower', 2, 32);
  solidRect(m, 2, 35, 3, 37);
  poi(m, 'chute', 3.5, 38.4, 1.6);
  m.movers.push({ type: 'dropcab', x0: 2, y0: 32.4 });

  prop(m, 'wheelbase', 15.5, 39.2);
  solidRect(m, 16, 43, 19, 44);
  poi(m, 'roue', 17.5, 45.4, 1.8);
  m.movers.push({ type: 'wheel', cx: 17.5, cy: 41.6, r: 1.9 });

  prop(m, 'bumper', 14, 17);
  solidRect(m, 14, 17, 17, 19);
  poi(m, 'tamponneuses', 13.5, 18.5, 1.3);

  /* Enceinte du parc : clôture festive, portail sur la route, ouverture au sud. */
  prop(m, 'parcgate', 19, 28);
  setSolid(m, 19, 28);
  setSolid(m, 19, 32);
  const fenceTiles = [];
  for (let x = 1; x <= 19; x++) { if (x !== 17) { fenceTiles.push([x, 12]); } }
  for (let x = 1; x <= 19; x++) { if (x !== 12) { fenceTiles.push([x, 47]); } }
  for (let y = 13; y <= 46; y++) {
    if (y >= 28 && y <= 32) { continue; }
    fenceTiles.push([19, y]);
  }
  for (const [fx, fy] of fenceTiles) {
    if (!m.solid[fy * 60 + fx]) {
      prop(m, 'fence', fx, fy);
      setSolid(m, fx, fy);
    }
  }

  /* --- Est : centre commercial --- */
  for (let y = 18; y <= 42; y++) {
    for (let x = 44; x <= 58; x++) {
      setGround(m, x, y, T.MALL);
    }
  }
  for (let x = 44; x <= 58; x++) { setSolid(m, x, 18); setSolid(m, x, 42); }
  for (let y = 18; y <= 42; y++) { setSolid(m, 44, y); setSolid(m, 58, y); }
  setSolid(m, 44, 29, 0); setSolid(m, 44, 30, 0); setSolid(m, 44, 31, 0);
  prop(m, 'mallwalls', 44, 18, { w: 15, h: 25, gate: [29, 31] });
  const stallSpots = [[47, 21], [52, 21], [47, 25], [52, 25], [47, 35], [52, 35], [47, 39], [52, 39]];
  for (const [sx, sy] of stallSpots) {
    prop(m, 'stall', sx, sy, { hue: Math.floor(rng() * 360) });
    solidRect(m, sx, sy, sx + 2, sy + 1);
  }
  poi(m, 'vitrine', 49.5, 27.8, 2.2);
  for (const [px2, py2] of [[45, 20], [57, 20], [45, 40], [57, 40]]) {
    prop(m, 'pot', px2, py2);
    setSolid(m, px2, py2);
  }
  prop(m, 'cart', 46, 24); setSolid(m, 46, 24);
  poi(m, 'caddie', 46.5, 25.2, 1.3);
  prop(m, 'cart', 53, 33); setSolid(m, 53, 33);
  poi(m, 'caddie', 53.5, 34.2, 1.3);

  prop(m, 'stand', 55, 28, { label: 'GLACES', icon: 'glace', awning: '#48a8dc' });
  solidRect(m, 55, 28, 56, 28);
  poi(m, 'glaces', 57.2, 28.8, 1.1);
  prop(m, 'table', 54, 32); setSolid(m, 54, 32);
  prop(m, 'table', 56, 33); setSolid(m, 56, 33);
  poi(m, 'table', 54.5, 33.2, 1.3);

  prop(m, 'toywindow', 50, 19, { w: 2 });
  solidRect(m, 50, 19, 51, 19);
  poi(m, 'jouets', 51, 20.4, 1.4);
  prop(m, 'photomaton', 45, 34); setSolid(m, 45, 34);
  poi(m, 'photomaton', 45.5, 35.2, 1.2);
  prop(m, 'planboard', 45, 27); setSolid(m, 45, 27);
  poi(m, 'plan', 45.5, 28.2, 1.2);
  prop(m, 'rideau', 49, 41, { w: 3 });
  solidRect(m, 49, 41, 51, 41);
  poi(m, 'rideau', 50, 40.2, 1.3);

  prop(m, 'mosaic', 50.5, 30.3);
  poi(m, 'mosaique', 50.5, 30.3, 1.5);
  prop(m, 'fontaine', 49, 32);
  solidRect(m, 49, 32, 50, 33);
  poi(m, 'voeux', 50, 34.4, 1.6);

  prop(m, 'holo', 48, 24, { txt: 'PROMO', hue: 190 });
  prop(m, 'holo', 53, 29, { txt: '-50%', hue: 320 });
  prop(m, 'holo', 50, 37, { txt: 'NOUVEAU', hue: 55 });

  /* --- Sud : quartier des sables --- */
  for (let i = 0; i < 16; i++) {
    const x = 2 + Math.floor(rng() * 56);
    const y = 44 + Math.floor(rng() * 14);
    if (x >= 28 && x <= 32) { continue; }
    if (getGround(m, x, y) === T.SAND && !m.solid[y * 60 + x]) {
      prop(m, 'palm', x, y);
      setSolid(m, x, y);
    }
  }
  const ruinRects = [[20, 47, 23, 47], [38, 52, 40, 52], [10, 55, 13, 55], [48, 50, 50, 50]];
  for (const [a, b, c, d] of ruinRects) {
    prop(m, 'ruin', a, b, { w: c - a + 1 });
    solidRect(m, a, b, c, d);
  }
  poi(m, 'ruines', 21.5, 48.5, 2.4);

  prop(m, 'sandcastle', 25, 53);
  setSolid(m, 25, 53);
  poi(m, 'chateau', 25.5, 54.2, 1.4);
  prop(m, 'boat', 44, 55, { w: 3 });
  solidRect(m, 44, 55, 46, 55);
  poi(m, 'barque', 45.5, 56.4, 1.8);
  prop(m, 'campfire', 35, 49);
  setSolid(m, 35, 49);
  poi(m, 'feu', 35.5, 50.2, 1.4);
  for (let i = 0; i < 12; i++) {
    const x = 2 + Math.floor(rng() * 56);
    const y = 43 + Math.floor(rng() * 15);
    if (getGround(m, x, y) === T.SAND && !m.solid[y * 60 + x]) {
      prop(m, 'shell', x, y, { hue: Math.floor(rng() * 60) });
    }
  }

  /* --- Personnages --- */
  npc(m, 'pixel', 'Agent Pixel', 33.5, 31.5, { body: '#2f6fed', skin: '#f2c9a0', hat: 'cap', hair: '#2c1e12' });
  npc(m, 'lila', 'Lila', 24.5, 8.5, { body: '#3fae6a', skin: '#e8b48c', hat: 'straw', hair: '#7a4a1e', longHair: true });
  npc(m, 'marcus', 'Marcus', 33.5, 50.5, { body: '#8a6d4f', skin: '#d9a06e', hair: '#8a8a86' });
  npc(m, 'grillon', 'Grillon', 16.5, 33.5, { body: '#c0c8d4', skin: '#9aa6b6', robot: true });
  npc(m, 'faucon', 'Faucon', 4.5, 44.2, { body: '#5f8f5a', skin: '#9aa6b6', robot: true, r: 2.3 });
  npc(m, 'praline', 'Praline', 13.5, 39.2, { body: '#d66a9e', skin: '#9aa6b6', robot: true, r: 2.3 });
  npc(m, 'victor', 'Victor', 10.5, 26.5, { body: '#7c3aed', skin: '#f2c9a0', hat: 'top', hair: '#241c1c' });
  npc(m, 'nadia', 'Nadia', 51.5, 30.5, { body: '#e0447c', skin: '#c98d63', hair: '#3a2a1e', longHair: true });
  npc(m, 'gustave', 'Gustave', 47.5, 32.5, { body: '#37415c', skin: '#e8b48c', hat: 'cap', hair: '#4a3826' });
  npc(m, 'moka', 'Moka', 38.5, 24.3, { body: '#6b4a2b', skin: '#9aa6b6', robot: true, r: 2.2 });
  npc(m, 'balai', 'Balayette', 27.5, 34.5, { sweeper: true, wander: true, sp: 1.9 });
  npc(m, 'vanille', 'Vanille', 55.5, 27.2, { body: '#e8e2d4', skin: '#9aa6b6', robot: true, r: 2.3 });
  m.movers.push(
    { type: 'drone', cx: 30, cy: 16, rx: 14, ry: 3, sp: 0.25, ph: 0 },
    { type: 'drone', cx: 14, cy: 40, rx: 9, ry: 5, sp: 0.2, ph: 2.1 },
    { type: 'drone', cx: 46, cy: 11, rx: 9, ry: 4, sp: 0.3, ph: 4.2 },
    { type: 'drone', cx: 40, cy: 50, rx: 12, ry: 4, sp: 0.22, ph: 1.3 },
  );

  npc(m, 'b12', 'Unité B-12', 27.5, 37.5, { body: '#c0c8d4', skin: '#9aa6b6', robot: true, wander: true });
  npc(m, 'c3', 'Unité C-3', 20.5, 8.5, { body: '#aab8d0', skin: '#8e9cb4', robot: true, wander: true });
  npc(m, 'chat', 'Chat', 24.5, 12.5, { cat: true, wander: true, noTalk: true, sp: 2.3 });
  npc(m, 'bosquet', 'Bosquet', 46.5, 8.5, { body: '#4f8f6a', skin: '#9aa6b6', robot: true, wander: true });
  npc(m, 'z9', 'Unité Z-9', 50.5, 27.5, { body: '#d4c8b0', skin: '#a8a090', robot: true, wander: true });

  return m;
}

/* ================= USINE ================= */

function buildUsine() {
  const m = makeMap('usine', 22, 14, 5);
  for (let y = 0; y < 14; y++) {
    for (let x = 0; x < 22; x++) {
      const edge = x === 0 || y === 0 || x === 21 || y === 13;
      setGround(m, x, y, edge ? T.WALL : T.FLOOR);
      if (edge) { setSolid(m, x, y); }
    }
  }
  setSolid(m, 11, 13, 0);
  setGround(m, 11, 13, T.FLOOR);
  m.portals.push({ x: 11, y: 13, to: 'ville', tx: 30.5, ty: 28.5 });

  for (let x = 2; x <= 19; x += 3) { prop(m, 'machine', x, 1, { h: 2 }); }
  solidRect(m, 2, 1, 20, 2);
  poi(m, 'machines', 11, 3.6, 3);

  prop(m, 'socle', 11, 6);
  setSolid(m, 11, 6);
  poi(m, 'socle', 11.5, 7.2, 1.4);
  poi(m, 'sable', 9.8, 7.4, 1.1);
  prop(m, 'sablepile', 9.6, 7.2);
  poi(m, 'ticket', 13.6, 10.4, 1.1);
  prop(m, 'ticketprop', 13.4, 10.2);
  poi(m, 'roulettes', 11.5, 11.2, 1.2);
  prop(m, 'tracks', 11, 8);

  prop(m, 'crate', 3, 9); solidRect(m, 3, 9, 4, 10);
  prop(m, 'crate', 18, 5); solidRect(m, 18, 5, 19, 6);

  npc(m, 'mercier', 'Directeur Mercier', 6.5, 5.5, { body: '#37415c', skin: '#f2c9a0', hair: '#b8b8b4' });
  npc(m, 'ray', 'Ray', 17.5, 9.5, { body: '#4b5563', skin: '#caa27c', hat: 'cap', hair: '#2c2418' });
  npc(m, 'k7', 'Unité K-7', 14.5, 7.5, { body: '#c0c8d4', skin: '#9aa6b6', robot: true, wander: true });

  return m;
}

/* ================= MAISON HANTÉE ================= */

function buildHante() {
  const m = makeMap('hante', 17, 11, 9);
  for (let y = 0; y < 11; y++) {
    for (let x = 0; x < 17; x++) {
      const edge = x === 0 || y === 0 || x === 16 || y === 10;
      setGround(m, x, y, edge ? T.WALL : T.DARK);
      if (edge) { setSolid(m, x, y); }
    }
  }
  setSolid(m, 8, 10, 0);
  setGround(m, 8, 10, T.DARK);
  m.portals.push({ x: 8, y: 10, to: 'ville', tx: 8.5, ty: 25.5 });

  prop(m, 'bache', 7, 3);
  solidRect(m, 7, 3, 9, 4);
  poi(m, 'bacheRobot', 8.5, 5.4, 1.6);

  m.movers.push(
    { type: 'ghost', x0: 3, y0: 2, ax: 1.1, ay: 0.5, sp: 0.9, ph: 0 },
    { type: 'ghost', x0: 13, y0: 2, ax: 1.4, ay: 0.4, sp: 0.7, ph: 2.4 },
    { type: 'ghost', x0: 12, y0: 6, ax: 0.9, ay: 0.6, sp: 1.1, ph: 4.1 },
    { type: 'skeleton', x0: 2, y0: 6, ph: 0.5 },
    { type: 'skeleton', x0: 14, y0: 4, ph: 2.2 },
  );
  poi(m, 'fantome', 3.5, 3.4, 1.6);
  prop(m, 'cratewheels', 3, 8);
  solidRect(m, 3, 8, 4, 9);
  poi(m, 'caisse', 4.5, 8.5, 1.6);

  return m;
}

export function buildWorld() {
  return { ville: buildVille(), usine: buildUsine(), hante: buildHante() };
}

/* ================= RENDU STATIQUE ================= */

const TILE_COLORS = {
  [T.GRASS]: ['#4c9e53', '#468f4c'],
  [T.PATH]: ['#c8b189', '#bda680'],
  [T.SAND]: ['#e2cd91', '#d8c286'],
  [T.PAVE]: ['#9aa5b5', '#939eae'],
  [T.FLOOR]: ['#b4bcc8', '#aab2bf'],
  [T.WALL]: ['#3c4457', '#3c4457'],
  [T.DARK]: ['#2c2540', '#282039'],
  [T.MALL]: ['#cfd6e4', '#c4ccdc'],
  [T.ROAD]: ['#3a4254', '#3a4254'],
};

export function mapCanvas(m) {
  if (m._canvas) { return m._canvas; }
  const c = document.createElement('canvas');
  c.width = m.w * TILE;
  c.height = m.h * TILE;
  const g = c.getContext('2d');
  const rng = mulberry32(m.seed);

  for (let y = 0; y < m.h; y++) {
    for (let x = 0; x < m.w; x++) {
      const t = getGround(m, x, y);
      g.fillStyle = TILE_COLORS[t][0];
      g.fillRect(x * TILE, y * TILE, TILE, TILE);
      const r = rng();
      if (t === T.GRASS && r < 0.25) {
        g.fillStyle = 'rgba(255,255,255,0.06)';
        g.fillRect(x * TILE + 6 + r * 60 % 18, y * TILE + 8, 3, 3);
      } else if (t === T.SAND && r < 0.3) {
        g.fillStyle = 'rgba(120,90,40,0.18)';
        g.fillRect(x * TILE + (r * 100) % 24, y * TILE + (r * 53) % 24, 4, 2);
      } else if (t === T.ROAD) {
        g.fillStyle = 'rgba(72,220,255,0.5)';
        if (x === 30) { g.fillRect(x * TILE + 14, y * TILE + 4, 4, 12); }
        if (y === 30) { g.fillRect(x * TILE + 4, y * TILE + 14, 12, 4); }
        g.fillStyle = 'rgba(72,220,255,0.22)';
        if (x === 29 && getGround(m, x - 1, y) !== T.ROAD) { g.fillRect(x * TILE, y * TILE, 3, TILE); }
        if (x === 31 && getGround(m, x + 1, y) !== T.ROAD) { g.fillRect(x * TILE + TILE - 3, y * TILE, 3, TILE); }
        if (y === 29 && getGround(m, x, y - 1) !== T.ROAD) { g.fillRect(x * TILE, y * TILE, TILE, 3); }
        if (y === 31 && getGround(m, x, y + 1) !== T.ROAD) { g.fillRect(x * TILE, y * TILE + TILE - 3, TILE, 3); }
      } else if (t === T.PAVE && r < 0.07) {
        g.strokeStyle = 'rgba(72,220,255,0.28)';
        g.lineWidth = 1.5;
        g.beginPath();
        const cx = x * TILE + 6 + (r * 200) % 12;
        const cy = y * TILE + 6 + (r * 130) % 12;
        g.moveTo(cx, cy);
        g.lineTo(cx + 10, cy);
        g.lineTo(cx + 10, cy + 8);
        g.stroke();
        g.fillStyle = 'rgba(72,220,255,0.5)';
        g.fillRect(cx + 9, cy + 8, 3, 3);
      }
      if (t === T.WALL) {
        g.fillStyle = '#2a3040';
        g.fillRect(x * TILE, y * TILE + TILE - 6, TILE, 6);
        g.fillStyle = '#4a5468';
        g.fillRect(x * TILE, y * TILE, TILE, 4);
      }
      if (t === T.DARK && r < 0.2) {
        g.fillStyle = 'rgba(120,100,180,0.12)';
        g.fillRect(x * TILE + (r * 90) % 24, y * TILE + (r * 37) % 24, 5, 5);
      }
    }
  }

  const sorted = [...m.props].sort((a, b) => a.y - b.y);
  for (const p of sorted) { drawProp(g, p, rng); }

  m._canvas = c;
  return c;
}

function px(v) { return v * TILE; }

export function drawProp(g, p, rng) {
  const x = px(p.x), y = px(p.y);
  switch (p.type) {
    case 'tree': {
      g.fillStyle = '#6b4a2b';
      g.fillRect(x + 13, y + 12, 6, 18);
      g.fillStyle = '#2f7d3a';
      circle(g, x + 16, y + 2, 16);
      g.fillStyle = '#3c9448';
      circle(g, x + 6, y + 10, 11);
      circle(g, x + 26, y + 10, 11);
      g.fillStyle = '#4aab57';
      circle(g, x + 16, y + 6, 10);
      break;
    }
    case 'palm': {
      g.strokeStyle = '#8a6b3d';
      g.lineWidth = 5;
      g.beginPath();
      g.moveTo(x + 12, y + 30);
      g.quadraticCurveTo(x + 14, y + 12, x + 22, y + 4);
      g.stroke();
      g.strokeStyle = '#2f9e4f';
      g.lineWidth = 4;
      for (const [dx, dy] of [[-14, 2], [14, 0], [-8, -8], [10, -9], [0, -13]]) {
        g.beginPath();
        g.moveTo(x + 22, y + 4);
        g.quadraticCurveTo(x + 22 + dx, y + 4 + dy, x + 22 + dx * 1.4, y + 6 + dy + 6);
        g.stroke();
      }
      break;
    }
    case 'bamboo': {
      for (let i = 0; i < 3; i++) {
        const bx = x + 6 + i * 9;
        g.fillStyle = i % 2 ? '#7fbf4d' : '#8fca5c';
        g.fillRect(bx, y - 6, 4, 36);
        g.fillStyle = '#5d9938';
        g.fillRect(bx, y + 4, 4, 2);
        g.fillRect(bx, y + 16, 4, 2);
      }
      break;
    }
    case 'flower': {
      for (let i = 0; i < 4; i++) {
        g.fillStyle = `hsl(${(p.hue + i * 40) % 360} 80% 65%)`;
        circle(g, x + 6 + (i * 7) % 20, y + 8 + (i * 11) % 18, 3);
      }
      break;
    }
    case 'swing': {
      g.strokeStyle = '#b23a3a';
      g.lineWidth = 4;
      g.beginPath();
      g.moveTo(x + 4, y + 30); g.lineTo(x + 10, y + 2);
      g.lineTo(x + 54, y + 2); g.lineTo(x + 60, y + 30);
      g.stroke();
      g.strokeStyle = '#d8d8d8';
      g.lineWidth = 2;
      for (const sx of [20, 42]) {
        g.beginPath();
        g.moveTo(sx + x - 4, y + 2); g.lineTo(sx + x - 4, y + 20);
        g.moveTo(sx + x + 4, y + 2); g.lineTo(sx + x + 4, y + 20);
        g.stroke();
        g.fillStyle = '#f0c930';
        g.fillRect(x + sx - 6, y + 20, 12, 4);
      }
      break;
    }
    case 'lamp': {
      g.fillStyle = '#3c4457';
      g.fillRect(x + 14, y + 6, 4, 24);
      g.fillStyle = '#48dcff';
      circle(g, x + 16, y + 4, 5);
      g.fillStyle = 'rgba(72,220,255,0.25)';
      circle(g, x + 16, y + 4, 10);
      break;
    }
    case 'fontaine': {
      g.fillStyle = '#8894a8';
      circle(g, x + TILE, y + TILE, 30);
      g.fillStyle = '#3ba7d9';
      circle(g, x + TILE, y + TILE, 24);
      g.fillStyle = '#7fd4f2';
      circle(g, x + TILE, y + TILE, 10);
      break;
    }
    case 'coaster': {
      g.strokeStyle = '#e04444';
      g.lineWidth = 5;
      g.beginPath();
      g.arc(x + TILE, y + 16, 28, Math.PI, 0);
      g.stroke();
      g.strokeStyle = '#a83232';
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(x + 4, y + 16); g.lineTo(x + 4, y + 30);
      g.moveTo(x + 60, y + 16); g.lineTo(x + 60, y + 30);
      g.stroke();
      break;
    }
    case 'carousel': {
      const cx = x + TILE * 2, cy = y + TILE * 2;
      g.fillStyle = '#c9a13f';
      circle(g, cx, cy, 58);
      g.fillStyle = '#e04444';
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        g.beginPath();
        g.moveTo(cx, cy);
        g.arc(cx, cy, 58, a, a + Math.PI / 8);
        g.closePath();
        if (i % 2 === 0) { g.fill(); }
      }
      g.fillStyle = '#f5e9c8';
      circle(g, cx, cy, 18);
      g.fillStyle = '#7c3aed';
      circle(g, cx, cy, 7);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + 0.4;
        g.fillStyle = '#ffffff';
        circle(g, cx + Math.cos(a) * 38, cy + Math.sin(a) * 38, 6);
      }
      break;
    }
    case 'pond': {
      g.fillStyle = '#3ba7d9';
      ellipse(g, x + TILE * 2, y + TILE * 1.5, TILE * 2, TILE * 1.4);
      g.fillStyle = '#7fd4f2';
      ellipse(g, x + TILE * 2, y + TILE * 1.5, TILE * 1.4, TILE * 0.9);
      for (const [dx, dy] of [[-20, -6], [10, 4], [26, -12]]) {
        g.fillStyle = '#f7d418';
        circle(g, x + TILE * 2 + dx, y + TILE * 1.5 + dy, 6);
        circle(g, x + TILE * 2 + dx + 5, y + TILE * 1.5 + dy - 5, 4);
        g.fillStyle = '#f08c1a';
        g.fillRect(x + TILE * 2 + dx + 8, y + TILE * 1.5 + dy - 6, 4, 2);
      }
      break;
    }
    case 'stand': {
      const awning = p.awning || (p.pink ? '#e04ba0' : '#e04444');
      g.fillStyle = '#8a5a30';
      g.fillRect(x + 2, y + 10, 60, 20);
      for (let i = 0; i < 8; i++) {
        g.fillStyle = i % 2 ? awning : '#f5f0e6';
        g.fillRect(x + i * 8, y, 8, 10);
      }
      if (p.icon === 'glace') {
        g.fillStyle = '#e5c46a';
        g.beginPath();
        g.moveTo(x + 28, y + 20); g.lineTo(x + 36, y + 20); g.lineTo(x + 32, y + 30);
        g.closePath();
        g.fill();
        g.fillStyle = '#fdf6ec';
        circle(g, x + 30, y + 17, 4.5);
        g.fillStyle = '#f7b8dd';
        circle(g, x + 35, y + 17, 4.5);
        g.fillStyle = '#7a4a2e';
        circle(g, x + 32, y + 13, 4.5);
      } else if (p.pink) {
        g.fillStyle = '#f7b8dd';
        circle(g, x + 32, y + 17, 7);
        circle(g, x + 27, y + 20, 5);
        circle(g, x + 37, y + 20, 5);
        g.fillStyle = '#c9a13f';
        g.fillRect(x + 31, y + 20, 2, 8);
      } else {
        g.fillStyle = '#3c2a18';
        circle(g, x + 32, y + 20, 7);
        g.fillStyle = '#f08c1a';
        circle(g, x + 32, y + 18, 4);
      }
      g.fillStyle = '#f5f0e6';
      g.font = 'bold 9px sans-serif';
      g.textAlign = 'center';
      g.fillText(p.label || 'MARRONS', x + 32, y + 39);
      break;
    }
    case 'archery': {
      g.fillStyle = '#8a5a30';
      g.fillRect(x, y + 8, TILE * 4, 16);
      for (let i = 0; i < 3; i++) {
        const tx = x + 20 + i * 42;
        g.fillStyle = '#f5f0e6'; circle(g, tx, y + 16, 12);
        g.fillStyle = '#e04444'; circle(g, tx, y + 16, 8);
        g.fillStyle = '#f5f0e6'; circle(g, tx, y + 16, 4);
        g.fillStyle = '#e04444'; circle(g, tx, y + 16, 2);
      }
      break;
    }
    case 'ruin': {
      const w = (p.w || 3) * TILE;
      g.fillStyle = '#8d8878';
      for (let i = 0; i < w / 12; i++) {
        const bh = 10 + ((i * 37) % 14);
        g.fillRect(x + i * 12, y + 28 - bh, 11, bh);
      }
      g.fillStyle = 'rgba(226,205,145,0.7)';
      g.fillRect(x, y + 24, w, 8);
      break;
    }
    case 'stall': {
      g.fillStyle = `hsl(${p.hue} 45% 55%)`;
      g.fillRect(x, y + 8, TILE * 3, TILE * 2 - 8);
      g.fillStyle = `hsl(${p.hue} 55% 40%)`;
      g.fillRect(x, y, TILE * 3, 10);
      g.fillStyle = 'rgba(255,255,255,0.85)';
      g.fillRect(x + 8, y + 18, TILE * 3 - 16, 22);
      g.fillStyle = 'rgba(0,0,0,0.15)';
      g.fillRect(x + 8, y + 30, TILE * 3 - 16, 2);
      for (let i = 0; i < 4; i++) {
        const ih = (p.hue + 70 + i * 65) % 360;
        g.fillStyle = `hsl(${ih} 70% 55%)`;
        if (i % 2 === 0) {
          circle(g, x + 17 + i * 17, y + 26, 4.5);
        } else {
          g.fillRect(x + 13 + i * 17, y + 21, 8, 9);
        }
        g.fillStyle = `hsl(${(ih + 40) % 360} 70% 50%)`;
        circle(g, x + 17 + i * 17, y + 36, 3.5);
      }
      break;
    }
    case 'mallwalls': {
      const w = p.w * TILE, h = p.h * TILE;
      const gy0 = (p.gate[0] - p.y) * TILE;
      const gy1 = (p.gate[1] - p.y + 1) * TILE;
      g.fillStyle = '#5a6480';
      g.fillRect(x, y, w, TILE);
      g.fillRect(x, y + h - TILE, w, TILE);
      g.fillRect(x, y, TILE, gy0);
      g.fillRect(x, y + gy1, TILE, h - gy1);
      g.fillRect(x + w - TILE, y, TILE, h);
      g.fillStyle = '#6d7894';
      g.fillRect(x, y, w, 6);
      g.fillRect(x, y + h - TILE, w, 6);
      g.fillStyle = 'rgba(72,220,255,0.5)';
      g.fillRect(x + 4, y + gy0 - 6, TILE - 8, 4);
      g.fillRect(x + 4, y + gy1 + 2, TILE - 8, 4);
      g.fillStyle = 'rgba(72,220,255,0.95)';
      g.font = 'bold 22px sans-serif';
      g.textAlign = 'center';
      g.fillText('GRAND CENTRE', x + w / 2, y + TILE - 10);
      break;
    }
    case 'usine': {
      const w = p.w * TILE, h = p.h * TILE;
      g.fillStyle = '#525d75';
      g.fillRect(x, y, w, h);
      g.fillStyle = '#3c4457';
      g.fillRect(x, y, w, 14);
      g.fillStyle = '#48dcff';
      for (let i = 0; i < 5; i++) {
        g.fillRect(x + 20 + i * ((w - 60) / 4), y + 40, 24, 16);
      }
      g.fillStyle = '#e8ecf5';
      g.font = 'bold 26px sans-serif';
      g.textAlign = 'center';
      g.fillText('ROBOCORP', x + w / 2, y + 30);
      g.strokeStyle = '#8894a8';
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(x + 30, y); g.lineTo(x + 30, y - 22);
      g.moveTo(x + w - 30, y); g.lineTo(x + w - 30, y - 14);
      g.stroke();
      g.fillStyle = '#ff5d73';
      circle(g, x + 30, y - 24, 3);
      g.fillStyle = '#48dcff';
      circle(g, x + w - 30, y - 16, 3);
      g.fillStyle = '#8894a8';
      ellipse(g, x + w - 60, y + 4, 10, 4);
      g.fillStyle = '#1e2536';
      g.fillRect(px(p.door), y + h - 30, TILE, 30);
      g.fillStyle = '#48dcff';
      g.fillRect(px(p.door) + 4, y + h - 26, TILE - 8, 4);
      break;
    }
    case 'hante': {
      const w = p.w * TILE, h = p.h * TILE;
      g.fillStyle = '#3a2d55';
      g.fillRect(x, y + 20, w, h - 20);
      g.fillStyle = '#241c38';
      g.beginPath();
      g.moveTo(x - 8, y + 24);
      g.lineTo(x + w / 2, y - 18);
      g.lineTo(x + w + 8, y + 24);
      g.closePath();
      g.fill();
      g.fillStyle = '#f7d418';
      for (const wx of [0.25, 0.75]) {
        circle(g, x + w * wx, y + 48, 9);
        g.fillStyle = '#241c38';
        circle(g, x + w * wx + 2, y + 48, 4);
        g.fillStyle = '#f7d418';
      }
      g.fillStyle = '#e8ecf5';
      g.font = 'bold 16px sans-serif';
      g.textAlign = 'center';
      g.fillText('MAISON HANTÉE', x + w / 2, y + 16);
      g.fillStyle = '#14101f';
      g.fillRect(px(p.door), y + h - 28, TILE, 28);
      break;
    }
    case 'machine': {
      const h = (p.h || 1) * TILE;
      g.fillStyle = '#6b7488';
      g.fillRect(x, y, TILE * 2.5, h);
      g.fillStyle = '#48dcff';
      g.fillRect(x + 6, y + 8, 10, 6);
      g.fillStyle = '#ff5d73';
      g.fillRect(x + 22, y + 8, 10, 6);
      g.fillStyle = '#3c4457';
      g.fillRect(x + 6, y + h - 18, TILE * 2.5 - 12, 10);
      break;
    }
    case 'socle': {
      g.fillStyle = '#d8dde8';
      g.fillRect(x - 6, y + 8, TILE + 12, TILE - 4);
      g.fillStyle = '#f5f8ff';
      g.fillRect(x - 2, y, TILE + 4, 12);
      g.strokeStyle = 'rgba(72,220,255,0.8)';
      g.lineWidth = 2;
      g.strokeRect(x - 10, y - 10, TILE + 20, 14);
      g.strokeStyle = 'rgba(72,220,255,0.35)';
      g.beginPath();
      g.moveTo(x - 10, y - 10); g.lineTo(x + 8, y + 4);
      g.stroke();
      break;
    }
    case 'sablepile': {
      g.fillStyle = 'rgba(226,205,145,0.9)';
      ellipse(g, x + 12, y + 12, 14, 6);
      ellipse(g, x + 26, y + 18, 8, 4);
      break;
    }
    case 'ticketprop': {
      g.save();
      g.translate(x + 12, y + 12);
      g.rotate(0.5);
      g.fillStyle = '#e04444';
      g.fillRect(-8, -5, 16, 10);
      g.fillStyle = '#f5f0e6';
      g.fillRect(-6, -2, 12, 4);
      g.restore();
      break;
    }
    case 'tracks': {
      g.strokeStyle = 'rgba(60,60,60,0.4)';
      g.lineWidth = 3;
      g.setLineDash([6, 8]);
      g.beginPath();
      g.moveTo(x + 10, y);
      g.lineTo(x + 8, y + TILE * 4.6);
      g.moveTo(x + 22, y);
      g.lineTo(x + 20, y + TILE * 4.6);
      g.stroke();
      g.setLineDash([]);
      break;
    }
    case 'crate': case 'cratewheels': {
      g.fillStyle = '#a97c44';
      g.fillRect(x, y, TILE * 2, TILE * 2 - 6);
      g.strokeStyle = '#7c5a2e';
      g.lineWidth = 3;
      g.strokeRect(x + 3, y + 3, TILE * 2 - 6, TILE * 2 - 12);
      g.beginPath();
      g.moveTo(x + 3, y + 3); g.lineTo(x + TILE * 2 - 3, y + TILE * 2 - 9);
      g.stroke();
      if (p.type === 'cratewheels') {
        g.fillStyle = '#2c2c2c';
        circle(g, x + 10, y + TILE * 2 - 2, 5);
        circle(g, x + TILE * 2 - 10, y + TILE * 2 - 2, 5);
      }
      break;
    }
    case 'bache': {
      g.fillStyle = '#9aa3ae';
      g.beginPath();
      g.moveTo(x - 4, y + TILE * 2);
      g.quadraticCurveTo(x + TILE * 1.5, y - TILE * 1.4, x + TILE * 3 + 4, y + TILE * 2);
      g.closePath();
      g.fill();
      g.strokeStyle = '#7b8490';
      g.lineWidth = 2;
      for (const fx of [0.3, 0.55, 0.8]) {
        g.beginPath();
        g.moveTo(x + TILE * 3 * fx, y - 6 + 20 * Math.abs(fx - 0.55));
        g.lineTo(x + TILE * 3 * fx - 6, y + TILE * 2);
        g.stroke();
      }
      g.fillStyle = '#c0c8d4';
      g.fillRect(x + TILE - 2, y + TILE * 2 - 8, 12, 8);
      g.fillRect(x + TILE + 20, y + TILE * 2 - 8, 12, 8);
      break;
    }
    case 'ghost': {
      g.fillStyle = 'rgba(240,240,255,0.85)';
      circle(g, x + 16, y + 10, 11);
      g.beginPath();
      g.moveTo(x + 5, y + 10);
      g.lineTo(x + 5, y + 26);
      g.lineTo(x + 11, y + 21); g.lineTo(x + 16, y + 27);
      g.lineTo(x + 21, y + 21); g.lineTo(x + 27, y + 26);
      g.lineTo(x + 27, y + 10);
      g.closePath();
      g.fill();
      g.fillStyle = '#241c38';
      circle(g, x + 12, y + 9, 2.5);
      circle(g, x + 20, y + 9, 2.5);
      break;
    }
    case 'skeleton': {
      g.strokeStyle = '#e8e4d8';
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(x + 16, y + 12); g.lineTo(x + 16, y + 26);
      g.moveTo(x + 8, y + 15); g.lineTo(x + 24, y + 15);
      g.moveTo(x + 8, y + 20); g.lineTo(x + 24, y + 20);
      g.stroke();
      g.fillStyle = '#e8e4d8';
      circle(g, x + 16, y + 7, 6);
      g.fillStyle = '#241c38';
      circle(g, x + 14, y + 6, 1.6);
      circle(g, x + 18, y + 6, 1.6);
      break;
    }
    case 'table': {
      g.fillStyle = '#8a94a8';
      g.fillRect(x + 14, y + 12, 4, 14);
      g.fillStyle = '#c3ccd9';
      ellipse(g, x + 16, y + 12, 12, 7);
      g.fillStyle = '#7c86a0';
      g.fillRect(x - 2, y + 14, 7, 7);
      g.fillRect(x + 27, y + 14, 7, 7);
      break;
    }
    case 'toywindow': {
      const w = (p.w || 2) * TILE;
      g.fillStyle = '#5a4a7c';
      g.fillRect(x, y, w, 26);
      g.fillStyle = 'rgba(160,220,255,0.35)';
      g.fillRect(x + 4, y + 4, w - 8, 18);
      for (let i = 0; i < 3; i++) {
        const rx = x + 10 + i * 18;
        g.fillStyle = ['#48dcff', '#ff5d73', '#f7d418'][i];
        g.fillRect(rx, y + 12, 8, 8);
        circle(g, rx + 4, y + 9, 4);
        g.fillStyle = '#101830';
        g.fillRect(rx + 2, y + 8, 2, 2);
        g.fillRect(rx + 5, y + 8, 2, 2);
      }
      g.fillStyle = '#f7d418';
      g.font = 'bold 8px sans-serif';
      g.textAlign = 'center';
      g.fillText('JOUETS', x + w / 2, y + 33);
      break;
    }
    case 'photomaton': {
      g.fillStyle = '#1e3a5c';
      g.fillRect(x + 2, y - 8, 28, 38);
      g.fillStyle = '#e04444';
      for (let i = 0; i < 4; i++) {
        g.fillRect(x + 5 + i * 6, y + 6, 4, 22);
      }
      g.fillStyle = '#48dcff';
      circle(g, x + 16, y - 2, 5);
      g.fillStyle = '#f5f0e6';
      g.font = 'bold 7px sans-serif';
      g.textAlign = 'center';
      g.fillText('PHOTO', x + 16, y + 36);
      break;
    }
    case 'planboard': {
      g.fillStyle = '#3c4457';
      g.fillRect(x + 14, y + 14, 4, 16);
      g.fillStyle = '#101830';
      g.fillRect(x + 2, y - 6, 28, 22);
      g.strokeStyle = 'rgba(72,220,255,0.9)';
      g.lineWidth = 1.5;
      g.strokeRect(x + 3, y - 5, 26, 20);
      g.fillStyle = 'rgba(72,220,255,0.7)';
      g.fillRect(x + 6, y - 2, 8, 5);
      g.fillRect(x + 17, y - 2, 9, 4);
      g.fillRect(x + 6, y + 6, 6, 6);
      g.fillStyle = '#ff5d73';
      circle(g, x + 21, y + 9, 2.5);
      break;
    }
    case 'rideau': {
      const w = (p.w || 3) * TILE;
      g.fillStyle = '#6d7488';
      g.fillRect(x, y - 4, w, 32);
      g.strokeStyle = '#525a6e';
      g.lineWidth = 2;
      g.beginPath();
      for (let i = 1; i < w / 6; i++) {
        g.moveTo(x + i * 6, y - 4);
        g.lineTo(x + i * 6, y + 28);
      }
      g.stroke();
      g.fillStyle = '#c9b389';
      g.fillRect(x + w / 2 - 18, y + 4, 36, 12);
      g.fillStyle = '#3c2a18';
      g.font = 'bold 7px sans-serif';
      g.textAlign = 'center';
      g.fillText('RÉOUVERTURE', x + w / 2, y + 12);
      break;
    }
    case 'bigscreen': {
      const w = TILE * 4;
      g.fillStyle = '#3c4457';
      g.fillRect(x + 8, y + 20, 8, 24);
      g.fillRect(x + w - 16, y + 20, 8, 24);
      g.fillStyle = '#5a6480';
      g.fillRect(x + 4, y + 44, w - 8, 12);
      break;
    }
    case 'cafe': {
      const w = TILE * 3;
      g.fillStyle = '#6b4a2b';
      g.fillRect(x + 2, y + 12, w - 4, 40);
      for (let i = 0; i < 6; i++) {
        g.fillStyle = i % 2 ? '#2f8f8f' : '#f5f0e6';
        g.fillRect(x + i * (w / 6), y, w / 6, 12);
      }
      g.fillStyle = '#f5f0e6';
      g.fillRect(x + 10, y + 20, w - 20, 14);
      g.fillStyle = '#3c2a18';
      g.font = 'bold 8px sans-serif';
      g.textAlign = 'center';
      g.fillText('LE CIRCUIT COURT', x + w / 2, y + 30);
      g.fillStyle = '#e8ecf5';
      circle(g, x + 14, y + 44, 4);
      circle(g, x + w - 14, y + 44, 4);
      break;
    }
    case 'parasol': {
      g.fillStyle = '#8a94a8';
      ellipse(g, x + 16, y + 22, 10, 6);
      g.fillStyle = '#3c4457';
      g.fillRect(x + 15, y + 2, 2, 20);
      g.fillStyle = '#e04444';
      g.beginPath();
      g.moveTo(x - 2, y + 8);
      g.quadraticCurveTo(x + 16, y - 12, x + 34, y + 8);
      g.closePath();
      g.fill();
      g.fillStyle = '#f5f0e6';
      g.beginPath();
      g.moveTo(x + 7, y + 2.4);
      g.quadraticCurveTo(x + 16, y - 8, x + 25, y + 2.4);
      g.lineTo(x + 21, y + 4.5);
      g.quadraticCurveTo(x + 16, y - 2, x + 11, y + 4.5);
      g.closePath();
      g.fill();
      break;
    }
    case 'clockbase': {
      g.fillStyle = '#3c4457';
      g.fillRect(x + 13, y + 4, 6, 26);
      g.fillStyle = '#5a6480';
      ellipse(g, x + 16, y + 28, 11, 4);
      break;
    }
    case 'foodtruck': {
      const w = TILE * 3;
      g.fillStyle = '#e07b39';
      g.beginPath();
      g.roundRect(x + 2, y + 6, w - 4, 42, 8);
      g.fill();
      g.fillStyle = '#f5f0e6';
      g.fillRect(x + 10, y + 14, 34, 16);
      g.fillStyle = '#48dcff';
      g.fillRect(x + 12, y + 16, 30, 8);
      g.fillStyle = '#3c2a18';
      g.font = 'bold 8px sans-serif';
      g.textAlign = 'center';
      g.fillText('WOK-È-WATT', x + w / 2, y + 42);
      g.fillStyle = '#2c2c2c';
      circle(g, x + 14, y + 50, 6);
      circle(g, x + w - 14, y + 50, 6);
      g.fillStyle = '#8894a8';
      circle(g, x + 14, y + 50, 2.5);
      circle(g, x + w - 14, y + 50, 2.5);
      g.fillStyle = '#f7d418';
      g.fillRect(x + 52, y + 12, 10, 20);
      break;
    }
    case 'gpond': {
      const w = TILE * 6, h = TILE * 4;
      g.fillStyle = '#3ba7d9';
      ellipse(g, x + w / 2, y + h / 2, w / 2, h / 2);
      g.fillStyle = '#5fc0e8';
      ellipse(g, x + w / 2, y + h / 2, w / 2 - 12, h / 2 - 10);
      g.strokeStyle = 'rgba(72,220,255,0.9)';
      g.lineWidth = 2.5;
      g.beginPath();
      g.moveTo(x + 24, y + 64);
      g.quadraticCurveTo(x + 44, y + 50, x + 60, y + 66);
      g.moveTo(x + 120, y + 44);
      g.quadraticCurveTo(x + 140, y + 58, x + 156, y + 46);
      g.stroke();
      for (const [lx, ly] of [[28, 30], [140, 84], [46, 96], [150, 26]]) {
        g.fillStyle = '#2f8f46';
        ellipse(g, x + lx, y + ly, 9, 6);
        g.fillStyle = '#3ba7d9';
        g.beginPath();
        g.moveTo(x + lx, y + ly);
        g.lineTo(x + lx + 9, y + ly - 4);
        g.lineTo(x + lx + 9, y + ly + 2);
        g.closePath();
        g.fill();
      }
      g.fillStyle = '#3fae6a';
      circle(g, x + 30, y + 88, 5);
      circle(g, x + 26, y + 84, 3);
      g.fillStyle = '#101830';
      circle(g, x + 25, y + 83, 1);
      g.fillStyle = '#8a5a30';
      g.fillRect(x + TILE * 2, y - 2, TILE * 2, h + 4);
      g.strokeStyle = '#6b4523';
      g.lineWidth = 2;
      g.beginPath();
      for (let i = 0; i <= 8; i++) {
        g.moveTo(x + TILE * 2, y - 2 + i * (h + 4) / 8);
        g.lineTo(x + TILE * 4, y - 2 + i * (h + 4) / 8);
      }
      g.stroke();
      g.fillStyle = '#5f4423';
      g.fillRect(x + TILE * 2, y - 4, TILE * 2, 3);
      g.fillRect(x + TILE * 2, y + h + 1, TILE * 2, 3);
      break;
    }
    case 'gazebo': {
      const cx = x + TILE * 1.5, cy = y + TILE * 1.5;
      g.fillStyle = '#d8dde8';
      ellipse(g, cx, cy + 16, 44, 26);
      g.fillStyle = '#b23a5e';
      for (const [dx, dy] of [[-34, 8], [34, 8], [-22, -10], [22, -10]]) {
        g.fillRect(cx + dx - 2, cy + dy, 4, 22);
      }
      g.fillStyle = '#2f8f8f';
      g.beginPath();
      g.moveTo(cx - 48, cy - 4);
      g.lineTo(cx, cy - 40);
      g.lineTo(cx + 48, cy - 4);
      g.closePath();
      g.fill();
      g.fillStyle = '#48dcff';
      circle(g, cx, cy - 42, 4);
      g.fillStyle = '#e8ecf5';
      g.font = 'bold 12px sans-serif';
      g.textAlign = 'center';
      g.fillText('♪', cx, cy + 2);
      break;
    }
    case 'hedge': {
      g.fillStyle = '#2f7d3a';
      g.beginPath();
      g.roundRect(x + 1, y + 1, TILE - 2, TILE - 2, 6);
      g.fill();
      g.fillStyle = '#3c9448';
      circle(g, x + 9, y + 9, 5);
      circle(g, x + 22, y + 13, 6);
      circle(g, x + 13, y + 22, 5);
      break;
    }
    case 'topiary': {
      g.fillStyle = '#b06a3c';
      g.fillRect(x + 10, y + 24, 12, 6);
      g.fillStyle = '#3c9448';
      g.fillRect(x + 8, y + 8, 16, 16);
      circle(g, x + 16, y + 2, 8);
      g.fillStyle = '#8fca5c';
      g.fillRect(x + 12, y - 1, 3, 3);
      g.fillRect(x + 18, y - 1, 3, 3);
      g.fillStyle = '#2f7d3a';
      g.fillRect(x + 4, y + 10, 4, 8);
      g.fillRect(x + 24, y + 10, 4, 8);
      break;
    }
    case 'gstatue': {
      g.fillStyle = '#8894a8';
      g.fillRect(x + 4, y + 22, 24, 8);
      g.fillStyle = '#a5b0c2';
      if (p.kind === 'chat') {
        ellipse(g, x + 16, y + 16, 8, 6);
        circle(g, x + 21, y + 8, 5);
        g.beginPath();
        g.moveTo(x + 17, y + 5); g.lineTo(x + 18.5, y + 1); g.lineTo(x + 21, y + 4);
        g.moveTo(x + 25, y + 5); g.lineTo(x + 23.5, y + 1); g.lineTo(x + 21.5, y + 4);
        g.fill();
        g.strokeStyle = '#a5b0c2';
        g.lineWidth = 2.5;
        g.beginPath();
        g.moveTo(x + 9, y + 16);
        g.quadraticCurveTo(x + 4, y + 10, x + 7, y + 5);
        g.stroke();
      } else {
        g.fillRect(x + 10, y + 6, 12, 16);
        circle(g, x + 16, y + 2, 6);
        g.fillStyle = '#8894a8';
        g.fillRect(x + 13, y, 2, 2);
        g.fillRect(x + 17, y, 2, 2);
        g.fillStyle = '#e0447c';
        circle(g, x + 25, y + 10, 3);
        g.strokeStyle = '#3c9448';
        g.lineWidth = 2;
        g.beginPath();
        g.moveTo(x + 25, y + 12); g.lineTo(x + 24, y + 18);
        g.stroke();
      }
      break;
    }
    case 'fence': {
      g.fillStyle = '#b23a5e';
      g.fillRect(x + 3, y + 6, 4, 16);
      g.fillRect(x + 25, y + 6, 4, 16);
      g.fillStyle = '#e8a0b4';
      g.fillRect(x, y + 9, TILE, 4);
      g.fillRect(x, y + 16, TILE, 3);
      if ((p.x + p.y) % 2 === 0) {
        g.fillStyle = '#f7d418';
        g.beginPath();
        g.moveTo(x + 5, y + 2); g.lineTo(x + 13, y + 4); g.lineTo(x + 5, y + 7);
        g.closePath();
        g.fill();
      }
      break;
    }
    case 'parcgate': {
      for (const gy of [0, 4]) {
        g.fillStyle = '#b23a5e';
        g.fillRect(x + 8, y + gy * TILE + 2, 16, TILE - 4);
        g.fillStyle = '#48dcff';
        circle(g, x + 16, y + gy * TILE + 2, 4);
      }
      g.fillStyle = 'rgba(16,24,48,0.92)';
      g.fillRect(x - 44, y - 30, 120, 22);
      g.strokeStyle = 'rgba(72,220,255,0.9)';
      g.lineWidth = 2;
      g.strokeRect(x - 44, y - 30, 120, 22);
      g.fillStyle = '#48dcff';
      g.font = 'bold 12px sans-serif';
      g.textAlign = 'center';
      g.fillText('PARC DE QUEST', x + 16, y - 15);
      break;
    }
    case 'bumper': {
      const w = TILE * 4, h = TILE * 3;
      g.fillStyle = '#2c3446';
      g.fillRect(x, y, w, h);
      g.strokeStyle = '#f7d418';
      g.lineWidth = 4;
      g.strokeRect(x + 3, y + 3, w - 6, h - 6);
      const cars = [[30, 34, '#e04444'], [72, 66, '#48dcff'], [98, 28, '#3fae6a']];
      for (const [cx2, cy2, col] of cars) {
        g.strokeStyle = '#8894a8';
        g.lineWidth = 2;
        g.beginPath();
        g.moveTo(x + cx2, y + cy2); g.lineTo(x + cx2 + 8, y + cy2 - 14);
        g.stroke();
        g.fillStyle = col;
        ellipse(g, x + cx2, y + cy2, 12, 8);
        g.fillStyle = '#101830';
        ellipse(g, x + cx2, y + cy2, 6, 3.5);
      }
      g.fillStyle = '#f7d418';
      g.font = 'bold 9px sans-serif';
      g.textAlign = 'center';
      g.fillText('TAMPONNEUSES', x + w / 2, y - 6);
      break;
    }
    case 'droptower': {
      g.fillStyle = '#5a6480';
      g.fillRect(x + 14, y, 6, TILE * 4.4);
      g.fillRect(x + 44, y, 6, TILE * 4.4);
      g.fillStyle = '#3c4457';
      g.fillRect(x + 8, y - 12, 48, 14);
      g.fillStyle = '#ff5d73';
      circle(g, x + 32, y - 5, 4);
      g.fillStyle = '#e8ecf5';
      g.font = 'bold 8px sans-serif';
      g.textAlign = 'center';
      g.fillText('CHUTE LIBRE', x + 32, y + TILE * 4.4 + 24);
      g.fillStyle = '#5a6480';
      g.fillRect(x + 4, y + TILE * 4.4 - 4, 56, 12);
      break;
    }
    case 'wheelbase': {
      const cx = x + TILE * 2, cy = y + TILE * 2.4;
      g.strokeStyle = '#8894a8';
      g.lineWidth = 6;
      g.beginPath();
      g.moveTo(cx - 34, y + TILE * 5.4);
      g.lineTo(cx, cy);
      g.lineTo(cx + 34, y + TILE * 5.4);
      g.stroke();
      g.fillStyle = '#5a6480';
      g.fillRect(cx - 44, y + TILE * 5.4 - 6, 88, 12);
      break;
    }
    case 'mosaic': {
      const cx = x, cy = y;
      const palette = ['#48dcff', '#c9a13f', '#7c3aed', '#e8ecf5', '#2f6fed'];
      for (let ring = 0; ring < 4; ring++) {
        const rr = 12 + ring * 13;
        const count = 8 + ring * 6;
        for (let i = 0; i < count; i++) {
          const a = (i / count) * Math.PI * 2 + ring * 0.3;
          g.save();
          g.translate(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
          g.rotate(a);
          g.fillStyle = palette[(i + ring) % palette.length];
          g.globalAlpha = 0.8;
          g.fillRect(-5, -4, 10, 8);
          g.restore();
        }
      }
      g.globalAlpha = 1;
      g.fillStyle = '#c9a13f';
      circle(g, cx, cy, 9);
      g.fillStyle = '#101830';
      circle(g, cx, cy, 5);
      g.fillStyle = '#48dcff';
      circle(g, cx, cy, 2.5);
      break;
    }
    case 'drone': {
      g.fillStyle = '#556078';
      for (const [dx, dy] of [[2, 4], [26, 4], [2, 22], [26, 22]]) {
        ellipse(g, x + dx + 2, y + dy, 7, 2.5);
      }
      g.strokeStyle = '#3c4457';
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(x + 6, y + 6); g.lineTo(x + 26, y + 22);
      g.moveTo(x + 26, y + 6); g.lineTo(x + 6, y + 22);
      g.stroke();
      g.fillStyle = '#2c3446';
      g.fillRect(x + 10, y + 9, 12, 10);
      g.fillStyle = '#48dcff';
      g.fillRect(x + 13, y + 12, 6, 4);
      if (p.blink) {
        g.fillStyle = '#ff5d73';
        circle(g, x + 16, y + 7, 2.5);
      }
      break;
    }
    case 'holo': {
      g.fillStyle = 'rgba(0,0,0,0.15)';
      ellipse(g, x + 16, y + 28, 10, 3);
      g.fillStyle = `hsl(${p.hue} 85% 60% / 0.28)`;
      g.fillRect(x - 6, y - 14, 44, 20);
      g.strokeStyle = `hsl(${p.hue} 85% 65% / 0.9)`;
      g.lineWidth = 1.5;
      g.strokeRect(x - 6, y - 14, 44, 20);
      g.fillStyle = `hsl(${p.hue} 90% 75%)`;
      g.font = 'bold 10px sans-serif';
      g.textAlign = 'center';
      g.fillText(p.txt, x + 16, y - 1);
      break;
    }
    case 'bench': {
      g.fillStyle = '#8a5a30';
      g.fillRect(x + 2, y + 6, 28, 5);
      g.fillRect(x + 2, y + 14, 28, 7);
      g.fillStyle = '#6b4523';
      g.fillRect(x + 4, y + 21, 4, 8);
      g.fillRect(x + 24, y + 21, 4, 8);
      break;
    }
    case 'birdbath': {
      g.fillStyle = '#9aa5b5';
      g.fillRect(x + 13, y + 12, 6, 16);
      g.fillStyle = '#c3ccd9';
      ellipse(g, x + 16, y + 10, 13, 6);
      g.fillStyle = '#3ba7d9';
      ellipse(g, x + 16, y + 10, 9, 4);
      g.fillStyle = '#8a6d4f';
      circle(g, x + 12, y + 8, 2.5);
      circle(g, x + 21, y + 9, 2.5);
      break;
    }
    case 'statue': {
      g.fillStyle = '#7f8a9c';
      g.fillRect(x + 4, y + 34, 56, 26);
      g.fillStyle = '#98a3b5';
      g.fillRect(x + 8, y + 30, 48, 8);
      g.fillStyle = '#8f7a52';
      circle(g, x + 22, y + 8, 7);
      g.fillRect(x + 16, y + 14, 12, 22);
      g.fillStyle = '#a08a5e';
      g.fillRect(x + 38, y + 2, 12, 12);
      g.fillRect(x + 37, y + 16, 14, 20);
      g.fillStyle = '#8f7a52';
      g.fillRect(x + 27, y + 22, 11, 4);
      break;
    }
    case 'billboard': {
      g.fillStyle = '#3c4457';
      g.fillRect(x + 6, y + 14, 4, 18);
      g.fillRect(x + 54, y + 14, 4, 18);
      g.fillStyle = '#101830';
      g.fillRect(x, y - 8, 64, 24);
      g.strokeStyle = 'rgba(72,220,255,0.9)';
      g.lineWidth = 2;
      g.strokeRect(x + 1, y - 7, 62, 22);
      g.fillStyle = '#48dcff';
      g.font = 'bold 10px sans-serif';
      g.textAlign = 'center';
      g.fillText('RECHERCHÉ', x + 32, y + 1);
      g.fillText('NOVA-7', x + 32, y + 12);
      break;
    }
    case 'vending': {
      g.fillStyle = '#1e3a5c';
      g.fillRect(x + 4, y - 14, 24, 44);
      g.fillStyle = 'rgba(72,220,255,0.35)';
      g.fillRect(x + 7, y - 10, 18, 26);
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 2; j++) {
          g.fillStyle = ['#ff5d73', '#f7d418', '#48dcff'][(i + j) % 3];
          g.fillRect(x + 9 + j * 9, y - 7 + i * 8, 7, 5);
        }
      }
      g.fillStyle = '#f7d418';
      g.fillRect(x + 7, y + 20, 18, 4);
      break;
    }
    case 'bin': {
      g.fillStyle = '#3e7d4d';
      g.fillRect(x + 8, y + 8, 16, 20);
      g.fillStyle = '#2f6039';
      g.fillRect(x + 6, y + 4, 20, 6);
      g.fillStyle = 'rgba(72,220,255,0.5)';
      g.fillRect(x + 8, y + 30, 16, 2);
      break;
    }
    case 'sandcastle': {
      g.fillStyle = '#d8b96a';
      g.fillRect(x + 4, y + 14, 10, 14);
      g.fillRect(x + 18, y + 14, 10, 14);
      g.fillRect(x + 9, y + 18, 14, 10);
      g.fillStyle = '#c6a755';
      for (const tx of [4, 18]) {
        g.fillRect(x + tx, y + 10, 3, 4);
        g.fillRect(x + tx + 7, y + 10, 3, 4);
      }
      g.strokeStyle = '#e04444';
      g.lineWidth = 1.5;
      g.beginPath();
      g.moveTo(x + 9, y + 14); g.lineTo(x + 9, y + 4);
      g.stroke();
      g.fillStyle = '#e04444';
      g.beginPath();
      g.moveTo(x + 9, y + 4); g.lineTo(x + 16, y + 7); g.lineTo(x + 9, y + 10);
      g.closePath();
      g.fill();
      break;
    }
    case 'shell': {
      g.fillStyle = `hsl(${p.hue + 10} 50% 82%)`;
      g.beginPath();
      g.arc(x + 14, y + 16, 5, Math.PI, 0);
      g.fill();
      g.strokeStyle = `hsl(${p.hue + 10} 40% 60%)`;
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(x + 14, y + 16); g.lineTo(x + 11, y + 12);
      g.moveTo(x + 14, y + 16); g.lineTo(x + 14, y + 11);
      g.moveTo(x + 14, y + 16); g.lineTo(x + 17, y + 12);
      g.stroke();
      break;
    }
    case 'boat': {
      const w = (p.w || 3) * TILE;
      g.fillStyle = '#7c5a2e';
      g.beginPath();
      g.moveTo(x + 4, y + 8);
      g.quadraticCurveTo(x + w / 2, y + 34, x + w - 4, y + 8);
      g.lineTo(x + w - 12, y + 16);
      g.lineTo(x + 12, y + 16);
      g.closePath();
      g.fill();
      g.strokeStyle = '#5f4423';
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(x + 10, y + 14); g.quadraticCurveTo(x + w / 2, y + 30, x + w - 10, y + 14);
      g.stroke();
      g.fillStyle = 'rgba(226,205,145,0.85)';
      ellipse(g, x + w * 0.7, y + 24, w * 0.3, 7);
      break;
    }
    case 'campfire': {
      g.fillStyle = '#6f6a5e';
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        circle(g, x + 16 + Math.cos(a) * 11, y + 18 + Math.sin(a) * 7, 3.5);
      }
      g.fillStyle = '#6b4a2b';
      g.fillRect(x + 8, y + 16, 16, 4);
      g.fillStyle = '#f08c1a';
      g.beginPath();
      g.moveTo(x + 10, y + 16);
      g.quadraticCurveTo(x + 16, y - 2, x + 22, y + 16);
      g.closePath();
      g.fill();
      g.fillStyle = '#f7d418';
      g.beginPath();
      g.moveTo(x + 13, y + 16);
      g.quadraticCurveTo(x + 16, y + 5, x + 19, y + 16);
      g.closePath();
      g.fill();
      break;
    }
    case 'pot': {
      g.fillStyle = '#b06a3c';
      g.fillRect(x + 8, y + 16, 16, 12);
      g.fillRect(x + 6, y + 14, 20, 4);
      g.fillStyle = '#3c9448';
      circle(g, x + 16, y + 8, 9);
      circle(g, x + 10, y + 12, 6);
      circle(g, x + 22, y + 12, 6);
      break;
    }
    case 'cart': {
      g.strokeStyle = '#8a94a8';
      g.lineWidth = 2;
      g.strokeRect(x + 6, y + 6, 20, 14);
      g.beginPath();
      for (let i = 1; i < 4; i++) {
        g.moveTo(x + 6 + i * 5, y + 6); g.lineTo(x + 6 + i * 5, y + 20);
      }
      g.moveTo(x + 6, y + 13); g.lineTo(x + 26, y + 13);
      g.stroke();
      g.fillStyle = '#2c2c2c';
      circle(g, x + 10, y + 24, 3);
      circle(g, x + 22, y + 24, 3);
      g.strokeStyle = '#e04444';
      g.beginPath();
      g.moveTo(x + 26, y + 6); g.lineTo(x + 30, y + 2);
      g.stroke();
      break;
    }
    case 'bunting': {
      const w = (p.w || 4) * TILE;
      g.strokeStyle = '#e8ecf5';
      g.lineWidth = 1.5;
      g.beginPath();
      g.moveTo(x, y + 6);
      g.quadraticCurveTo(x + w / 2, y + 16, x + w, y + 6);
      g.stroke();
      for (let i = 0; i < 12; i++) {
        const fx = x + (i + 0.5) * (w / 12);
        const fy = y + 6 + Math.sin((i + 0.5) / 12 * Math.PI) * 9;
        g.fillStyle = `hsl(${i * 55 % 360} 75% 60%)`;
        g.beginPath();
        g.moveTo(fx - 4, fy); g.lineTo(fx + 4, fy); g.lineTo(fx, fy + 8);
        g.closePath();
        g.fill();
      }
      break;
    }
    default:
      break;
  }
}

function circle(g, x, y, r) {
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.fill();
}

function ellipse(g, x, y, rx, ry) {
  g.beginPath();
  g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  g.fill();
}

export const ZONES = [
  { name: "Parc d'attractions", test: (x, y) => x < 20 && y >= 12 && y <= 47 },
  { name: 'Le Grand Jardin', test: (x, y) => y < 18 },
  { name: 'Quartier des Sables', test: (x, y) => y >= 42 },
  { name: 'Le Grand Centre', test: (x) => x > 40 },
  { name: "Place de l'Usine", test: () => true },
];

export function zoneName(mapId, x, y) {
  if (mapId === 'usine') { return 'Usine RoboCorp'; }
  if (mapId === 'hante') { return 'Maison hantée' }
  for (const z of ZONES) {
    if (z.test(x, y)) { return z.name; }
  }
  return 'Quest';
}
