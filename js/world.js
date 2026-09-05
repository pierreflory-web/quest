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
      if (x >= 20 && x <= 40 && y >= 20 && y <= 40) { g = T.PAVE; }
      if (x >= 41 && y >= 18 && y <= 42) { g = T.PAVE; }
      setGround(m, x, y, g);
    }
  }

  for (let y = 0; y < 60; y++) {
    for (let x = 29; x <= 31; x++) {
      if (getGround(m, x, y) !== T.PAVE) { setGround(m, x, y, T.PATH); }
    }
  }
  for (let x = 0; x < 60; x++) {
    for (let y = 29; y <= 31; y++) {
      if (getGround(m, x, y) !== T.PAVE) { setGround(m, x, y, T.PATH); }
    }
  }
  for (let x = 3; x <= 56; x++) { setGround(m, x, 8, T.PATH); }

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
  for (let i = 0; i < 55; i++) {
    const x = 2 + Math.floor(rng() * 56);
    const y = 1 + Math.floor(rng() * 16);
    if (y >= 7 && y <= 9) { continue; }
    if (x >= 28 && x <= 32) { continue; }
    if (x >= 9 && x <= 16 && y <= 5) { continue; }
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
  m.portals.push({ x: 8, y: 24, to: 'hante', tx: 8.5, ty: 9.2, lockedUnless: 'grillon' });

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
  poi(m, 'tir', 4.5, 46.5, 2.2);

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

  /* --- Personnages --- */
  npc(m, 'pixel', 'Agent Pixel', 33.5, 31.5, { body: '#2f6fed', skin: '#f2c9a0', hat: 'cap' });
  npc(m, 'lila', 'Lila', 24.5, 8.5, { body: '#3fae6a', skin: '#e8b48c', hat: 'straw' });
  npc(m, 'marcus', 'Marcus', 33.5, 50.5, { body: '#8a6d4f', skin: '#d9a06e' });
  npc(m, 'grillon', 'Grillon', 16.5, 33.5, { body: '#c0c8d4', skin: '#9aa6b6', robot: true });
  npc(m, 'victor', 'Victor', 10.5, 26.5, { body: '#7c3aed', skin: '#f2c9a0', hat: 'top' });
  npc(m, 'nadia', 'Nadia', 51.5, 30.5, { body: '#e0447c', skin: '#c98d63' });

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

  npc(m, 'mercier', 'Directeur Mercier', 6.5, 5.5, { body: '#37415c', skin: '#f2c9a0', hat: 'none' });
  npc(m, 'ray', 'Ray', 17.5, 9.5, { body: '#4b5563', skin: '#caa27c', hat: 'cap' });

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

  prop(m, 'ghost', 3, 2); prop(m, 'ghost', 13, 2); prop(m, 'ghost', 12, 6);
  prop(m, 'skeleton', 2, 6); prop(m, 'skeleton', 14, 4);
  poi(m, 'fantome', 3.5, 3.4, 1.4);
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
      const colors = TILE_COLORS[t];
      g.fillStyle = colors[(x + y) % 2];
      g.fillRect(x * TILE, y * TILE, TILE, TILE);
      const r = rng();
      if (t === T.GRASS && r < 0.25) {
        g.fillStyle = 'rgba(255,255,255,0.06)';
        g.fillRect(x * TILE + 6 + r * 60 % 18, y * TILE + 8, 3, 3);
      } else if (t === T.SAND && r < 0.3) {
        g.fillStyle = 'rgba(120,90,40,0.18)';
        g.fillRect(x * TILE + (r * 100) % 24, y * TILE + (r * 53) % 24, 4, 2);
      } else if ((t === T.PAVE || t === T.MALL || t === T.FLOOR)) {
        g.strokeStyle = 'rgba(0,0,0,0.07)';
        g.strokeRect(x * TILE + 0.5, y * TILE + 0.5, TILE, TILE);
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

function drawProp(g, p, rng) {
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
      g.fillStyle = '#8a5a30';
      g.fillRect(x + 2, y + 10, 60, 20);
      g.fillStyle = '#e04444';
      for (let i = 0; i < 8; i++) {
        g.fillStyle = i % 2 ? '#e04444' : '#f5f0e6';
        g.fillRect(x + i * 8, y, 8, 10);
      }
      g.fillStyle = '#3c2a18';
      circle(g, x + 32, y + 20, 7);
      g.fillStyle = '#f08c1a';
      circle(g, x + 32, y + 18, 4);
      g.fillStyle = '#f5f0e6';
      g.font = 'bold 9px sans-serif';
      g.textAlign = 'center';
      g.fillText('MARRONS', x + 32, y + 39);
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
      g.fillStyle = 'rgba(255,255,255,0.75)';
      g.fillRect(x + 8, y + 18, TILE * 3 - 16, 14);
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
  { name: 'Le Grand Jardin', test: (x, y) => y < 18 },
  { name: 'Quartier des Sables', test: (x, y) => y >= 42 },
  { name: "Parc d'attractions", test: (x) => x < 20 },
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
