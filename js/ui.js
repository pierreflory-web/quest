import { state, reset, save } from './state.js';
import { CLUES, SUSPECTS, WIN_TEXT, nextHint, COATS, coatColor } from './data.js';

const $ = (id) => document.getElementById(id);

let dlg = null;
let choicesOpen = false;
let notebookOpen = false;
let titleOpen = true;
let howtoOpen = false;
let coatOpen = false;
let toastTimer = null;

export function isBusy() {
  return !!dlg || choicesOpen || notebookOpen || titleOpen || howtoOpen || coatOpen;
}

export function dialogueOpen() {
  return !!dlg;
}

/* ---------- Dialogue ---------- */

export function showDialogue(lines, onDone) {
  dlg = { lines, i: 0, onDone };
  $('dialogue').hidden = false;
  renderLine();
}

function renderLine() {
  const l = dlg.lines[dlg.i];
  $('dlg-who').textContent = l.who;
  $('dlg-text').textContent = l.text;
}

export function advance() {
  if (!dlg) { return; }
  dlg.i++;
  if (dlg.i >= dlg.lines.length) {
    const d = dlg;
    dlg = null;
    $('dialogue').hidden = true;
    if (d.onDone) { d.onDone(); }
  } else {
    renderLine();
  }
}

/* ---------- Choix ---------- */

export function showChoices(title, options) {
  choicesOpen = true;
  $('choices-title').textContent = title;
  const list = $('choices-list');
  list.innerHTML = '';
  for (const opt of options) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn choice-btn';
    b.innerHTML = `${opt.label}${opt.sub ? `<small>${opt.sub}</small>` : ''}`;
    b.addEventListener('click', () => {
      choicesOpen = false;
      $('choices').hidden = true;
      opt.cb && opt.cb();
    });
    list.appendChild(b);
  }
  $('choices').hidden = false;
}

/* ---------- Carnet ---------- */

export function toggleNotebook() {
  if (notebookOpen) {
    notebookOpen = false;
    $('notebook').hidden = true;
    return;
  }
  notebookOpen = true;
  const cl = $('nb-clues');
  cl.innerHTML = '';
  if (state.clues.length === 0) {
    cl.innerHTML = '<p class="nb-empty">Aucun indice pour l’instant. Fouillez la ville !</p>';
  } else {
    for (const id of state.clues) {
      const c = CLUES[id];
      if (!c) { continue; }
      const div = document.createElement('div');
      div.className = 'nb-item';
      div.innerHTML = `<b>${c.title}</b><span>${c.desc}</span>`;
      cl.appendChild(div);
    }
  }
  const sl = $('nb-suspects');
  sl.innerHTML = '';
  for (const s of SUSPECTS) {
    const div = document.createElement('div');
    div.className = 'nb-item';
    div.innerHTML = `<b>${s.name}</b><span>${s.role}</span>`;
    sl.appendChild(div);
  }
  $('notebook').hidden = false;
}

export function updateBadge() {
  const b = $('clue-badge');
  b.textContent = state.clues.length;
  b.hidden = state.clues.length === 0;
}

/* ---------- Toast ---------- */

export function toast(text, ms = 2600) {
  const t = $('toast');
  t.textContent = text;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, ms);
}

/* ---------- Écrans ---------- */

export function showTitle(hasSaveGame, onNew, onContinue) {
  titleOpen = true;
  $('title').hidden = false;
  $('btn-continue').hidden = !hasSaveGame;
  $('btn-new').onclick = () => {
    titleOpen = false;
    $('title').hidden = true;
    startHud();
    onNew();
  };
  $('btn-continue').onclick = () => {
    titleOpen = false;
    $('title').hidden = true;
    startHud();
    onContinue();
  };
}

function startHud() {
  $('hud').hidden = false;
  $('btn-action').hidden = false;
  $('btn-coat').hidden = false;
  refreshCoatBtn();
  updateBadge();
}

export function showHeroSelect(onPick) {
  howtoOpen = true;
  $('hero').hidden = false;
  const pick = (hero) => () => {
    howtoOpen = false;
    $('hero').hidden = true;
    onPick(hero);
  };
  $('btn-hero-fille').onclick = pick('fille');
  $('btn-hero-garcon').onclick = pick('garcon');
}

export function refreshCoatBtn() {
  $('btn-coat').style.background = coatColor();
}

export function showCoatPicker(onDone) {
  coatOpen = true;
  const grid = $('coat-grid');
  grid.innerHTML = '';
  const current = state.coat || (state.hero === 'fille' ? 'rose' : 'bleu');
  for (const c of COATS) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'coat-swatch' + (c.id === current ? ' selected' : '');
    b.style.background = c.color;
    b.textContent = c.name;
    b.addEventListener('click', () => {
      state.coat = c.id;
      save();
      coatOpen = false;
      $('coat').hidden = true;
      refreshCoatBtn();
      if (onDone) { onDone(); }
    });
    grid.appendChild(b);
  }
  $('coat').hidden = false;
}

export function showHowto() {
  howtoOpen = true;
  $('howto').hidden = false;
  $('btn-howto-ok').onclick = () => {
    howtoOpen = false;
    $('howto').hidden = true;
  };
}

/* ---------- Confettis ---------- */

let confettiRunning = false;

function startConfetti() {
  const c = $('confetti');
  const ctx = c.getContext('2d');
  confettiRunning = true;
  const resize = () => {
    c.width = c.clientWidth;
    c.height = c.clientHeight;
  };
  resize();
  const COLORS = ['#48dcff', '#ff5d73', '#f7d418', '#7c3aed', '#3fae6a', '#f08c1a', '#e8ecf5'];
  const parts = [];
  for (let i = 0; i < 140; i++) {
    parts.push({
      x: Math.random() * c.width,
      y: -Math.random() * c.height,
      w: 5 + Math.random() * 6,
      h: 8 + Math.random() * 8,
      vy: 60 + Math.random() * 110,
      vx: -25 + Math.random() * 50,
      rot: Math.random() * Math.PI * 2,
      vr: -3 + Math.random() * 6,
      color: COLORS[i % COLORS.length],
      sway: Math.random() * Math.PI * 2,
    });
  }
  let prev = performance.now();
  function tickConfetti(now) {
    if (!confettiRunning) { return; }
    const dt = Math.min(0.05, (now - prev) / 1000);
    prev = now;
    if (c.width !== c.clientWidth || c.height !== c.clientHeight) { resize(); }
    ctx.clearRect(0, 0, c.width, c.height);
    for (const p of parts) {
      p.sway += dt * 2.5;
      p.x += (p.vx + Math.sin(p.sway) * 30) * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
      if (p.y > c.height + 20) {
        p.y = -20;
        p.x = Math.random() * c.width;
      }
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * (0.4 + 0.6 * Math.abs(Math.sin(p.sway))));
      ctx.restore();
    }
    requestAnimationFrame(tickConfetti);
  }
  requestAnimationFrame(tickConfetti);
}

function stopConfetti() {
  confettiRunning = false;
}

export function showWin(onReplay) {
  $('win-text').textContent = WIN_TEXT;
  $('win').hidden = false;
  choicesOpen = true;
  startConfetti();
  $('btn-win-continue').onclick = () => {
    choicesOpen = false;
    $('win').hidden = true;
    stopConfetti();
  };
  $('btn-replay').onclick = () => { onReplay(); };
}

export function setZoneName(name) {
  $('zone-name').textContent = name;
}

export function initUi() {
  $('btn-notebook').addEventListener('click', toggleNotebook);
  $('btn-close-notebook').addEventListener('click', toggleNotebook);
  $('btn-coat').addEventListener('click', () => {
    if (!isBusy()) { showCoatPicker(); }
  });
  $('btn-hint').addEventListener('click', () => {
    toggleNotebook();
    showDialogue([{ who: 'Votre instinct', text: nextHint() }], null);
  });
  $('btn-restart').addEventListener('click', () => {
    toggleNotebook();
    showChoices('Recommencer l’enquête ?', [
      {
        label: 'Oui, tout recommencer',
        sub: 'La progression actuelle sera perdue.',
        cb: () => {
          reset();
          location.reload();
        },
      },
      { label: 'Annuler', cb: () => {} },
    ]);
  });
  $('dialogue').addEventListener('pointerdown', (e) => {
    e.preventDefault();
    advance();
  });
}
