import { state, hasClue, addClue, flag, setFlag, save, load, hasSave, reset } from './state.js';
import { CLUES, SUSPECTS, npcDialogue, objectDialogue, accusationResult, LOCKED_DOOR_MSG, POI_CLUES, npcHasNews, newsText, coatColor } from './data.js';
import { TILE, buildWorld, mapCanvas, isSolid, zoneName, drawProp } from './world.js';
import { input, initInput } from './input.js';
import { startMusic, toggleMute, isMuted, setTheme } from './audio.js';
import * as ui from './ui.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const world = buildWorld();

const SPEED = 4.6;
const PLAYER_R = 0.32;
const INTERACT_R = 1.5;

let dpr = 1;
let started = false;
let lastZone = '';
let lastLockToast = 0;
let leftPortal = true;

function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(canvas.clientWidth * dpr);
  canvas.height = Math.round(canvas.clientHeight * dpr);
}
window.addEventListener('resize', resize);
resize();

function currentMap() {
  return world[state.map];
}

/* ---------- Interactions ---------- */

function currentTarget() {
  const m = currentMap();
  let best = null;
  let bestD = INTERACT_R;
  for (const n of m.npcs) {
    if (n.noTalk) { continue; }
    const d = Math.hypot(n.x - state.x, n.y - state.y);
    if (d < Math.max(bestD, n.r || 0) && d <= (n.r || INTERACT_R) && (!best || d < bestD)) {
      best = { kind: 'npc', ref: n };
      bestD = d;
    }
  }
  for (const o of m.interactables) {
    const d = Math.hypot(o.x - state.x, o.y - state.y);
    if (d < Math.max(bestD, o.r) && d <= o.r && (!best || d < bestD)) {
      best = { kind: 'obj', ref: o };
      bestD = d;
    }
  }
  return best;
}

function onAction() {
  if (!started) { return; }
  if (ui.dialogueOpen()) {
    ui.advance();
    return;
  }
  if (ui.isBusy()) { return; }
  const t = currentTarget();
  if (!t) { return; }
  if (t.kind === 'npc') {
    runDialogue(npcDialogue(t.ref.id));
  } else {
    const d = objectDialogue(t.ref.id);
    if (d) { runDialogue(d); }
  }
}

function runDialogue(d) {
  ui.showDialogue(d.lines, () => {
    if (d.flagSet) { setFlag(d.flagSet); }
    if (d.clue && addClue(d.clue)) {
      ui.toast('🔍 Nouvel indice : ' + CLUES[d.clue].title);
      ui.updateBadge();
    }
    if (d.accuse) { offerAccusation(); }
  });
}

function offerAccusation() {
  const options = SUSPECTS.map((s) => ({
    label: s.name,
    sub: s.role,
    cb: () => resolveAccusation(s.id),
  }));
  options.push({ label: 'Continuer l’enquête', cb: () => {} });
  ui.showChoices('Qui accusez-vous ?', options);
}

function resolveAccusation(id) {
  const res = accusationResult(id);
  if (res.win) {
    state.solved = true;
    save();
    ui.showWin(() => {
      reset();
      location.reload();
    });
    return;
  }
  runDialogue(res);
}

/* ---------- Mise à jour ---------- */

function tryMove(dt) {
  const m = currentMap();
  const nx = state.x + input.vx * SPEED * dt;
  const ny = state.y + input.vy * SPEED * dt;

  if (canStand(m, nx, state.y)) { state.x = nx; }
  if (canStand(m, state.x, ny)) { state.y = ny; }
}

function canStand(m, x, y) {
  return !isSolid(m, x - PLAYER_R, y - PLAYER_R)
    && !isSolid(m, x + PLAYER_R, y - PLAYER_R)
    && !isSolid(m, x - PLAYER_R, y + PLAYER_R)
    && !isSolid(m, x + PLAYER_R, y + PLAYER_R);
}

function checkPortals() {
  const m = currentMap();
  const tx = Math.floor(state.x);
  const ty = Math.floor(state.y);
  const pt = m.portals.find((p) => p.x === tx && p.y === ty);
  if (!pt) {
    leftPortal = true;
    return;
  }
  if (!leftPortal) { return; }
  if (pt.lockedFlag && !flag(pt.lockedFlag)) {
    const now = performance.now();
    if (now - lastLockToast > 1800) {
      ui.toast(LOCKED_DOOR_MSG);
      lastLockToast = now;
    }
    state.y = pt.y + 1.0 + PLAYER_R;
    return;
  }
  state.map = pt.to;
  state.x = pt.tx;
  state.y = pt.ty;
  leftPortal = false;
  setTheme(state.map === 'hante' ? 'hante' : 'ville');
  save();
}

function updateWanderers(dt) {
  const m = currentMap();
  for (const n of m.npcs) {
    if (!n.wander) { continue; }
    if (!n.home) { n.home = { x: n.x, y: n.y }; }
    n.timer = (n.timer ?? 0) - dt;
    if (n.timer <= 0) {
      n.timer = 1.5 + Math.random() * 2.5;
      if (Math.hypot(n.x - n.home.x, n.y - n.home.y) > 4) {
        const dx = n.home.x - n.x;
        const dy = n.home.y - n.y;
        const l = Math.hypot(dx, dy) || 1;
        n.vx = dx / l;
        n.vy = dy / l;
      } else if (Math.random() < 0.35) {
        n.vx = 0;
        n.vy = 0;
      } else {
        const a = Math.random() * Math.PI * 2;
        n.vx = Math.cos(a);
        n.vy = Math.sin(a);
      }
    }
    if (!n.vx && !n.vy) { continue; }
    const sp = n.sp || 1.5;
    const nx = n.x + n.vx * sp * dt;
    const ny = n.y + n.vy * sp * dt;
    if (canStand(m, nx, n.y)) { n.x = nx; } else { n.vx = -n.vx; }
    if (canStand(m, n.x, ny)) { n.y = ny; } else { n.vy = -n.vy; }
  }
}

function updateBirds(dt) {
  const m = currentMap();
  for (const b of m.movers) {
    if (b.type !== 'bird') { continue; }
    if (b.mode === 'fly') {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.timer -= dt;
      if (b.timer <= 0) { landBird(b, m); }
    } else if (Math.hypot(b.x - state.x, b.y - state.y) < 2.2) {
      const ang = Math.atan2(b.y - state.y, b.x - state.x);
      b.mode = 'fly';
      b.vx = Math.cos(ang) * 4;
      b.vy = Math.sin(ang) * 4 - 1.5;
      b.timer = 2.2;
    }
  }
}

function landBird(b, m) {
  for (let i = 0; i < 20; i++) {
    const x = b.hx + (Math.random() - 0.5) * 10;
    const y = b.hy + (Math.random() - 0.5) * 8;
    if (x < 1 || y < 1 || x >= m.w - 1 || y >= m.h - 1) { continue; }
    if (!isSolid(m, x, y) && Math.hypot(x - state.x, y - state.y) > 4) {
      b.x = x;
      b.y = y;
      b.mode = 'ground';
      return;
    }
  }
  b.x = b.hx;
  b.y = b.hy;
  b.mode = 'ground';
}

let saveTimer = 0;

function update(dt) {
  if (!started || ui.isBusy()) { return; }
  tryMove(dt);
  updateWanderers(dt);
  updateBirds(dt);
  checkPortals();
  saveTimer += dt;
  if (saveTimer > 4) {
    saveTimer = 0;
    save();
  }
  const z = zoneName(state.map, state.x, state.y);
  if (z !== lastZone) {
    lastZone = z;
    ui.setZoneName(z);
  }
}

/* ---------- Dessin ---------- */

function computeZoom() {
  const minDim = Math.min(canvas.clientWidth, canvas.clientHeight);
  return Math.min(Math.max(minDim / (TILE * 13), 1), 2.6);
}

function draw(t) {
  const m = currentMap();
  const zoom = computeZoom();
  const viewW = canvas.clientWidth / zoom;
  const viewH = canvas.clientHeight / zoom;
  const mapW = m.w * TILE;
  const mapH = m.h * TILE;
  let camX = state.x * TILE - viewW / 2;
  let camY = state.y * TILE - viewH / 2;
  camX = Math.max(Math.min(camX, mapW - viewW), Math.min(0, (mapW - viewW) / 2));
  camY = Math.max(Math.min(camY, mapH - viewH), Math.min(0, (mapH - viewH) / 2));

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = '#0b1020';
  ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);
  ctx.setTransform(dpr * zoom, 0, 0, dpr * zoom, -camX * dpr * zoom, -camY * dpr * zoom);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(mapCanvas(m), 0, 0);

  const heroLook = state.hero === 'fille'
    ? { body: coatColor(), skin: '#f2c9a0', hat: 'detective', hair: '#b3541e', longHair: true }
    : { body: coatColor(), skin: '#f2c9a0', hat: 'detective', hair: '#5a3d20' };
  const busyNow = ui.isBusy();
  const actors = [...m.npcs.map((n) => ({
    ...n,
    isNpc: true,
    moving: !busyNow && !!n.wander && !!(n.vx || n.vy),
  })), {
    x: state.x,
    y: state.y,
    ...heroLook,
    player: true,
    moving: started && !busyNow && (input.vx !== 0 || input.vy !== 0),
  }];
  actors.sort((a, b) => a.y - b.y);
  for (const a of actors) { drawActor(a, t); }

  for (const mv of m.movers) { drawMover(mv, t); }

  for (const n of m.npcs) {
    if (npcHasNews(n.id)) { drawExclaim(n.x, n.y - 1.35, t); }
  }
  for (const o of m.interactables) {
    const c = POI_CLUES[o.id];
    if (c && !hasClue(c)) { drawClueMark(o.x, o.y - 0.5, t); }
  }

  if (started && !ui.isBusy()) {
    const target = currentTarget();
    if (target) {
      const r = target.ref;
      let label = 'Examiner';
      if (target.kind === 'npc') {
        label = 'Parler';
      } else if (POI_CLUES[r.id] && !hasClue(POI_CLUES[r.id])) {
        label = 'Indice !';
      }
      drawPrompt(r.x, r.y - (target.kind === 'npc' ? 1.4 : 0.9), label);
    }
  }
}

function drawMover(mv, t) {
  if (mv.type === 'drone') {
    const dx = mv.cx + Math.cos(t * mv.sp + mv.ph) * mv.rx;
    const dy = mv.cy + Math.sin(t * mv.sp * 0.8 + mv.ph) * mv.ry;
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.beginPath();
    ctx.ellipse(dx * TILE, dy * TILE + 46, 12, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    drawProp(ctx, { type: 'drone', x: dx - 0.5, y: dy - 0.5, blink: Math.sin(t * 6 + mv.ph) > 0 });
  } else if (mv.type === 'ghost') {
    const gx = mv.x0 + Math.sin(t * mv.sp + mv.ph) * mv.ax;
    const gy = mv.y0 + Math.sin(t * mv.sp * 1.7 + mv.ph) * mv.ay;
    ctx.globalAlpha = 0.65 + Math.sin(t * 2 + mv.ph) * 0.3;
    drawProp(ctx, { type: 'ghost', x: gx, y: gy });
    ctx.globalAlpha = 1;
  } else if (mv.type === 'dropcab') {
    const ph = (t * 0.22) % 1;
    let h;
    if (ph < 0.55) {
      h = ph / 0.55;
    } else if (ph < 0.7) {
      h = 1;
    } else if (ph < 0.78) {
      h = 1 - (ph - 0.7) / 0.08;
    } else {
      h = 0;
    }
    const x = mv.x0 * TILE + 6;
    const y = (mv.y0 + 3.1 * (1 - h)) * TILE;
    ctx.fillStyle = '#f7d418';
    ctx.fillRect(x, y, 52, 12);
    ctx.fillStyle = '#101830';
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.arc(x + 10 + i * 11, y + 4, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (mv.type === 'wheel') {
    const a0 = t * 0.4;
    const cx = mv.cx * TILE;
    const cy = mv.cy * TILE;
    const r = mv.r * TILE;
    ctx.strokeStyle = '#e04444';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = '#c9a13f';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = a0 + (i * Math.PI) / 4;
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    }
    ctx.stroke();
    for (let i = 0; i < 8; i++) {
      const a = a0 + (i * Math.PI) / 4;
      const gx = cx + Math.cos(a) * r;
      const gy = cy + Math.sin(a) * r;
      ctx.fillStyle = `hsl(${i * 45} 70% 55%)`;
      ctx.beginPath();
      ctx.roundRect(gx - 6, gy - 2, 12, 10, 3);
      ctx.fill();
    }
    ctx.fillStyle = '#3c4457';
    ctx.beginPath();
    ctx.arc(cx, cy, 6, 0, Math.PI * 2);
    ctx.fill();
  } else if (mv.type === 'skeleton') {
    const sx = mv.x0 + Math.sin(t * 3 + mv.ph) * 0.14;
    const sy = mv.y0 - Math.abs(Math.sin(t * 5 + mv.ph)) * 0.12;
    drawProp(ctx, { type: 'skeleton', x: sx, y: sy });
  } else if (mv.type === 'butterfly') {
    const bx = (mv.cx + Math.sin(t * 0.7 + mv.ph) * mv.rx + Math.sin(t * 2.3 + mv.ph) * 0.3) * TILE;
    const by = (mv.cy + Math.sin(t * 0.9 + mv.ph * 2) * mv.ry + Math.sin(t * 3.1) * 0.2) * TILE;
    const flap = 0.3 + Math.abs(Math.sin(t * 9 + mv.ph)) * 0.7;
    ctx.fillStyle = `hsl(${mv.hue} 80% 65%)`;
    ctx.beginPath();
    ctx.ellipse(bx - 4 * flap, by - 1, 4.5 * flap, 3.5, -0.4, 0, Math.PI * 2);
    ctx.ellipse(bx + 4 * flap, by - 1, 4.5 * flap, 3.5, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2c2438';
    ctx.fillRect(bx - 1, by - 4, 2, 8);
  } else if (mv.type === 'bird') {
    const bx = mv.x * TILE;
    const by = mv.y * TILE;
    const bodyCol = mv.mech ? '#9aa5b5' : '#8a94a8';
    const bellyCol = mv.mech ? '#48dcff' : '#e08a5a';
    if (mv.mode === 'fly') {
      const flap = Math.sin(t * 16) > 0 ? 1 : -1;
      ctx.strokeStyle = '#5f6c82';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(bx - 8, by - 4 * flap); ctx.quadraticCurveTo(bx - 3, by, bx, by);
      ctx.moveTo(bx + 8, by - 4 * flap); ctx.quadraticCurveTo(bx + 3, by, bx, by);
      ctx.stroke();
      ctx.fillStyle = bodyCol;
      ctx.beginPath();
      ctx.ellipse(bx, by, 5, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const hop = Math.abs(Math.sin(t * 5 + mv.hx)) * 1.5;
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.beginPath();
      ctx.ellipse(bx, by + 5, 5, 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = bodyCol;
      ctx.beginPath();
      ctx.ellipse(bx, by - hop, 5, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = bellyCol;
      ctx.beginPath();
      ctx.ellipse(bx + 1, by + 1 - hop, 3, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = bodyCol;
      ctx.beginPath();
      ctx.arc(bx + 4, by - 4 - hop, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f08c1a';
      ctx.beginPath();
      ctx.moveTo(bx + 7, by - 4 - hop); ctx.lineTo(bx + 10, by - 3.5 - hop); ctx.lineTo(bx + 7, by - 2.5 - hop);
      ctx.fill();
      ctx.fillStyle = mv.mech ? '#ff5d73' : '#101830';
      ctx.beginPath();
      ctx.arc(bx + 5, by - 5 - hop, 0.9, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (mv.type === 'ticker') {
    const x = mv.x * TILE;
    const y = mv.y * TILE;
    const w = mv.w * TILE;
    const text = newsText();
    ctx.fillStyle = '#101830';
    ctx.fillRect(x - 6, y - 26, w + 12, 48);
    ctx.strokeStyle = 'rgba(72,220,255,0.85)';
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 5, y - 25, w + 10, 46);
    ctx.save();
    ctx.beginPath();
    ctx.rect(x - 2, y - 23, w + 4, 42);
    ctx.clip();
    ctx.fillStyle = '#48dcff';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'left';
    const tw = ctx.measureText(text).width;
    const off = (t * 45) % tw;
    ctx.fillText(text, x - off, y - 2);
    ctx.fillText(text, x - off + tw, y - 2);
    ctx.restore();
    ctx.fillStyle = Math.sin(t * 4) > 0 ? '#ff5d73' : '#5a2230';
    ctx.beginPath();
    ctx.arc(x + w + 1, y - 19, 2.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (mv.type === 'clock') {
    const x = mv.x * TILE + 16;
    const y = mv.y * TILE - 6 + Math.sin(t * 1.5) * 2;
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const sep = now.getSeconds() % 2 ? ':' : ' ';
    ctx.fillStyle = 'rgba(72,220,255,0.14)';
    ctx.beginPath();
    ctx.ellipse(x, y, 26, 13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#48dcff';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${hh}${sep}${mm}`, x, y + 5);
  } else if (mv.type === 'squirrel') {
    const cyc = (t * 0.22 + mv.ph) % 2;
    let u;
    let running = false;
    if (cyc < 0.3) { u = cyc / 0.3; running = true; }
    else if (cyc < 1) { u = 1; }
    else if (cyc < 1.3) { u = 1 - (cyc - 1) / 0.3; running = true; }
    else { u = 0; }
    const sx = (mv.x0 + (mv.x1 - mv.x0) * u) * TILE;
    const sy = mv.y0 * TILE - (running ? Math.abs(Math.sin(t * 18)) * 3 : 0);
    ctx.fillStyle = '#9a5f2e';
    ctx.beginPath();
    ctx.ellipse(sx, sy, 6, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(sx + 6, sy - 3, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(sx + 5, sy - 6); ctx.lineTo(sx + 6, sy - 9); ctx.lineTo(sx + 8, sy - 6);
    ctx.fill();
    ctx.strokeStyle = '#b06a3c';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(sx - 6, sy - 1);
    ctx.quadraticCurveTo(sx - 12, sy - 8 + Math.sin(t * 6) * 2, sx - 8, sy - 12);
    ctx.stroke();
    ctx.fillStyle = '#101830';
    ctx.beginPath();
    ctx.arc(sx + 7, sy - 4, 0.9, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawExclaim(tx, ty, t) {
  const x = tx * TILE;
  const y = ty * TILE + Math.sin(t * 3.2) * 2.5;
  ctx.fillStyle = '#f7d418';
  ctx.strokeStyle = '#101830';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x, y, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#101830';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('!', x, y + 0.5);
  ctx.textBaseline = 'alphabetic';
}

function drawClueMark(tx, ty, t) {
  const x = tx * TILE;
  const y = ty * TILE + Math.sin(t * 3.2 + 1.5) * 2.5;
  const pulse = 0.55 + Math.sin(t * 4) * 0.25;
  ctx.strokeStyle = `rgba(72,220,255,${pulse})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, 10 + Math.sin(t * 4) * 2, 0, Math.PI * 2);
  ctx.stroke();
  ctx.font = '13px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🔍', x, y);
  ctx.textBaseline = 'alphabetic';
}

function drawActor(a, t) {
  const x = a.x * TILE;
  const y = a.y * TILE + (a.player ? 0 : Math.sin(t * 2.4 + a.x * 3) * 1.2);

  if (a.cat) {
    drawCat(x, a.y * TILE, t);
    return;
  }

  if (a.sweeper) {
    const sy = a.y * TILE;
    ctx.fillStyle = 'rgba(72,220,255,0.12)';
    ctx.beginPath();
    ctx.ellipse(x, sy + 6, 14, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#5a6480';
    ctx.beginPath();
    ctx.roundRect(x - 10, sy - 8, 20, 14, 6);
    ctx.fill();
    ctx.fillStyle = '#48dcff';
    ctx.fillRect(x - 6, sy - 5, 12, 3);
    ctx.fillStyle = Math.sin(t * 6) > 0 ? '#f7d418' : '#8a6d1e';
    ctx.beginPath();
    ctx.arc(x, sy - 10, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#8894a8';
    ctx.lineWidth = 2;
    const spin = t * 10;
    for (const sx of [-9, 9]) {
      ctx.beginPath();
      for (let i = 0; i < 3; i++) {
        const a2 = spin + (i * Math.PI * 2) / 3;
        ctx.moveTo(x + sx, sy + 5);
        ctx.lineTo(x + sx + Math.cos(a2) * 5, sy + 5 + Math.sin(a2) * 2.5);
      }
      ctx.stroke();
    }
    return;
  }

  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(x, y + 16, 10, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  const step = a.moving ? Math.sin(t * 11 + a.x + a.y) * 3.2 : 0;
  const liftL = Math.max(0, step);
  const liftR = Math.max(0, -step);
  const legCol = a.robot ? '#7a8496' : '#2b2f3d';
  const footCol = a.robot ? '#5a6480' : '#1c1f28';
  ctx.fillStyle = legCol;
  ctx.beginPath();
  ctx.roundRect(x - 6, y + 5, 5, 10 - liftL, 2.5);
  ctx.roundRect(x + 1, y + 5, 5, 10 - liftR, 2.5);
  ctx.fill();
  ctx.fillStyle = footCol;
  ctx.beginPath();
  ctx.ellipse(x - 3.5, y + 15 - liftL, 3.5, 2, 0, 0, Math.PI * 2);
  ctx.ellipse(x + 3.5, y + 15 - liftR, 3.5, 2, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = a.body;
  ctx.beginPath();
  ctx.roundRect(x - 8, y - 6, 16, 15, 6);
  ctx.fill();

  if (a.hair && a.longHair) {
    ctx.fillStyle = a.hair;
    ctx.beginPath();
    ctx.ellipse(x - 8, y - 8, 3.5, 8, 0.2, 0, Math.PI * 2);
    ctx.ellipse(x + 8, y - 8, 3.5, 8, -0.2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = a.skin;
  ctx.beginPath();
  ctx.arc(x, y - 12, 8, 0, Math.PI * 2);
  ctx.fill();

  if (a.hair) {
    ctx.fillStyle = a.hair;
    ctx.beginPath();
    ctx.arc(x, y - 14, 8, Math.PI * 1.05, Math.PI * 1.95);
    ctx.fill();
  }

  if (a.robot) {
    ctx.fillStyle = '#1e2536';
    ctx.fillRect(x - 4, y - 14, 3, 3);
    ctx.fillRect(x + 1, y - 14, 3, 3);
    ctx.fillRect(x - 3, y - 9, 6, 2);
    ctx.strokeStyle = '#9aa6b6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y - 20);
    ctx.lineTo(x, y - 25);
    ctx.stroke();
    ctx.fillStyle = '#ff5d73';
    ctx.beginPath();
    ctx.arc(x, y - 26, 2.5, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = '#1e2536';
    ctx.beginPath();
    ctx.arc(x - 3, y - 13, 1.6, 0, Math.PI * 2);
    ctx.arc(x + 3, y - 13, 1.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#8a4a3a';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.arc(x, y - 10.5, 3, Math.PI * 0.2, Math.PI * 0.8);
    ctx.stroke();
  }

  if (a.hat === 'detective') {
    ctx.fillStyle = '#5c4632';
    ctx.fillRect(x - 10, y - 19, 20, 3);
    ctx.beginPath();
    ctx.arc(x, y - 19, 7, Math.PI, 0);
    ctx.fill();
  } else if (a.hat === 'cap') {
    ctx.fillStyle = '#1e3a8a';
    ctx.beginPath();
    ctx.arc(x, y - 17, 8, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(x - 2, y - 18, 12, 3);
  } else if (a.hat === 'straw') {
    ctx.fillStyle = '#e5c46a';
    ctx.fillRect(x - 11, y - 17, 22, 3);
    ctx.beginPath();
    ctx.arc(x, y - 17, 6, Math.PI, 0);
    ctx.fill();
  } else if (a.hat === 'top') {
    ctx.fillStyle = '#241c38';
    ctx.fillRect(x - 9, y - 19, 18, 3);
    ctx.fillRect(x - 6, y - 28, 12, 10);
  }
}

function drawCat(x, y, t) {
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.ellipse(x, y + 8, 8, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#d07f2e';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x - 8, y + 2);
  ctx.quadraticCurveTo(x - 14, y - 2 + Math.sin(t * 4) * 3, x - 12, y - 8 + Math.sin(t * 4) * 2);
  ctx.stroke();

  ctx.fillStyle = '#e8963c';
  ctx.beginPath();
  ctx.ellipse(x - 2, y + 2, 8, 5.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#d07f2e';
  ctx.fillRect(x - 6, y - 2, 2.5, 4);
  ctx.fillRect(x - 1, y - 3, 2.5, 5);

  ctx.fillStyle = '#e8963c';
  ctx.beginPath();
  ctx.arc(x + 7, y - 3, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x + 3, y - 6); ctx.lineTo(x + 4.5, y - 11); ctx.lineTo(x + 7, y - 7);
  ctx.moveTo(x + 11, y - 6); ctx.lineTo(x + 9.5, y - 11); ctx.lineTo(x + 7.5, y - 7);
  ctx.fill();
  ctx.fillStyle = '#1e2536';
  ctx.beginPath();
  ctx.arc(x + 5.5, y - 4, 1.1, 0, Math.PI * 2);
  ctx.arc(x + 9, y - 4, 1.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#c2566a';
  ctx.fillRect(x + 6.7, y - 2.5, 1.6, 1.4);

  if ((t % 22) < 2.2) {
    ctx.fillStyle = 'rgba(11,16,32,0.85)';
    ctx.font = 'italic 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Miaou.', x + 4, y - 16);
  }
}

function drawPrompt(tx, ty, label) {
  const x = tx * TILE;
  const y = ty * TILE;
  ctx.font = 'bold 12px sans-serif';
  const w = ctx.measureText(label).width + 16;
  ctx.fillStyle = 'rgba(11,16,32,0.9)';
  ctx.strokeStyle = 'rgba(72,220,255,0.8)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(x - w / 2, y - 26, w, 20, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#e8ecf5';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x, y - 16);
  ctx.textBaseline = 'alphabetic';
}

/* ---------- Cartes (mini et grande) ---------- */

const mmCanvas = document.getElementById('minimap');
const mmCtx = mmCanvas.getContext('2d');
const bigCanvas = document.getElementById('bigmap-canvas');
const bigCtx = bigCanvas.getContext('2d');

function drawMapInto(c2, ctx2, t) {
  const m = currentMap();
  const src = mapCanvas(m);
  const scale = Math.min(c2.width / src.width, c2.height / src.height);
  const w = src.width * scale;
  const h = src.height * scale;
  const ox = (c2.width - w) / 2;
  const oy = (c2.height - h) / 2;
  ctx2.fillStyle = '#0b1020';
  ctx2.fillRect(0, 0, c2.width, c2.height);
  ctx2.drawImage(src, ox, oy, w, h);
  const dotR = Math.max(3, c2.width / 75);
  const exR = Math.max(5, c2.width / 42);
  for (const n of m.npcs) {
    if (npcHasNews(n.id)) {
      drawMapExclaim(ctx2, ox + n.x * TILE * scale, oy + n.y * TILE * scale, exR);
    }
  }
  for (const pt of m.portals) {
    if (mapHasNews(pt.to)) {
      drawMapExclaim(ctx2, ox + (pt.x + 0.5) * TILE * scale, oy + (pt.y + 0.5) * TILE * scale, exR);
    }
  }
  const px2 = ox + state.x * TILE * scale;
  const py2 = oy + state.y * TILE * scale;
  ctx2.strokeStyle = 'rgba(72,220,255,0.9)';
  ctx2.lineWidth = 2;
  ctx2.beginPath();
  ctx2.arc(px2, py2, dotR + 2.5 + Math.sin(t * 5) * 1.5, 0, Math.PI * 2);
  ctx2.stroke();
  ctx2.fillStyle = '#ffffff';
  ctx2.beginPath();
  ctx2.arc(px2, py2, dotR, 0, Math.PI * 2);
  ctx2.fill();
}

function mapHasNews(mapId) {
  const m = world[mapId];
  return m ? m.npcs.some((n) => npcHasNews(n.id)) : false;
}

function drawMapExclaim(ctx2, x, y, r) {
  ctx2.fillStyle = '#f7d418';
  ctx2.strokeStyle = '#101830';
  ctx2.lineWidth = Math.max(1, r / 5);
  ctx2.beginPath();
  ctx2.arc(x, y, r, 0, Math.PI * 2);
  ctx2.fill();
  ctx2.stroke();
  ctx2.fillStyle = '#101830';
  ctx2.font = `bold ${Math.round(r * 1.5)}px sans-serif`;
  ctx2.textAlign = 'center';
  ctx2.textBaseline = 'middle';
  ctx2.fillText('!', x, y + r * 0.08);
  ctx2.textBaseline = 'alphabetic';
}

mmCanvas.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  if (started && !ui.isBusy()) { ui.openBigmap(); }
});
document.getElementById('bigmap').addEventListener('pointerdown', (e) => {
  e.preventDefault();
  ui.closeBigmap();
});

/* ---------- Boucle ---------- */

let last = 0;
function frame(ts) {
  const dt = Math.min(0.05, (ts - last) / 1000);
  last = ts;
  update(dt);
  draw(ts / 1000);
  if (!mmCanvas.hidden) { drawMapInto(mmCanvas, mmCtx, ts / 1000); }
  if (ui.isBigmapOpen()) { drawMapInto(bigCanvas, bigCtx, ts / 1000); }
  requestAnimationFrame(frame);
}

/* ---------- Démarrage ---------- */

ui.initUi();
initInput(onAction);

const btnMusic = document.getElementById('btn-music');
function refreshMusicBtn() {
  btnMusic.textContent = isMuted() ? '🔇' : '🔊';
}
refreshMusicBtn();
btnMusic.addEventListener('click', () => {
  startMusic();
  toggleMute();
  refreshMusicBtn();
});

ui.showTitle(hasSave(), () => {
  reset();
  startMusic();
  setTheme('ville');
  ui.showHeroSelect((hero) => {
    state.hero = hero;
    started = true;
    save();
    ui.showCoatPicker(() => {
      ui.showHowto();
    });
  });
}, () => {
  load();
  startMusic();
  setTheme(state.map === 'hante' ? 'hante' : 'ville');
  started = true;
  ui.updateBadge();
});

requestAnimationFrame(frame);

/* Hook de développement : window.__quest.tick(dt) fait avancer la simulation
   même quand l'onglet est masqué (requestAnimationFrame suspendu). */
window.__quest = {
  state,
  world,
  action: onAction,
  target: currentTarget,
  warp(map, x, y) {
    state.map = map;
    state.x = x;
    state.y = y;
    leftPortal = true;
  },
  tick(dt = 1 / 60) {
    update(dt);
    draw(performance.now() / 1000);
    if (!mmCanvas.hidden) { drawMapInto(mmCanvas, mmCtx, performance.now() / 1000); }
    if (ui.isBigmapOpen()) { drawMapInto(bigCanvas, bigCtx, performance.now() / 1000); }
  },
};

if ('serviceWorker' in navigator
  && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
