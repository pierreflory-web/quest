const MUTE_KEY = 'quest-muted';

let audio = null;
let master = null;
let filter = null;
let muted = false;
let theme = 'ville';
let nextBar = 0;
let barIndex = 0;

try { muted = localStorage.getItem(MUTE_KEY) === '1'; } catch (e) { /* stockage indisponible */ }

export function isMuted() {
  return muted;
}

export function toggleMute() {
  muted = !muted;
  try { localStorage.setItem(MUTE_KEY, muted ? '1' : '0'); } catch (e) { /* rien */ }
  if (master) {
    master.gain.setTargetAtTime(muted ? 0 : 0.16, audio.currentTime, 0.1);
  }
}

export function setTheme(t) {
  theme = t;
}

export function startMusic() {
  if (audio) {
    if (audio.state === 'suspended') { audio.resume(); }
    return;
  }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) { return; }
  audio = new AC();
  master = audio.createGain();
  master.gain.value = muted ? 0 : 0.16;
  filter = audio.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 1600;
  filter.connect(master);
  master.connect(audio.destination);
  nextBar = audio.currentTime + 0.1;
  setInterval(schedule, 250);
}

function schedule() {
  if (!audio || audio.state !== 'running') { return; }
  while (nextBar < audio.currentTime + 0.8) {
    if (theme === 'hante') {
      barHante(nextBar);
      nextBar += 4;
    } else {
      barVille(nextBar);
      nextBar += 3.2;
    }
    barIndex++;
  }
}

function note(freq, t, dur, { type = 'sine', gain = 0.1, attack = 0.02, detune = 0 } = {}) {
  const o = audio.createOscillator();
  o.type = type;
  o.frequency.value = freq;
  o.detune.value = detune;
  const g = audio.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(gain, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g);
  g.connect(filter);
  o.start(t);
  o.stop(t + dur + 0.05);
}

/* Thème de la ville : boucle rêveuse Am7 → Fmaj7 → Cmaj7 → G6. */
const VILLE = [
  { bass: 110, pad: [220, 261.63, 329.63, 392], arp: [440, 523.25, 659.25, 783.99, 880] },
  { bass: 87.31, pad: [174.61, 220, 261.63, 329.63], arp: [349.23, 440, 523.25, 698.46, 880] },
  { bass: 130.81, pad: [196, 246.94, 261.63, 329.63], arp: [523.25, 587.33, 659.25, 783.99, 987.77] },
  { bass: 98, pad: [196, 246.94, 293.66, 329.63], arp: [392, 493.88, 587.33, 659.25, 783.99] },
];

function barVille(t) {
  const c = VILLE[barIndex % 4];
  note(c.bass, t, 3.0, { type: 'sine', gain: 0.09, attack: 0.05 });
  for (const f of c.pad) {
    note(f, t, 3.2, { type: 'triangle', gain: 0.035, attack: 0.9 });
    note(f, t, 3.2, { type: 'triangle', gain: 0.025, attack: 0.9, detune: 6 });
  }
  for (let i = 0; i < 8; i++) {
    if (Math.random() < 0.35) { continue; }
    const f = c.arp[Math.floor(Math.random() * c.arp.length)];
    note(f, t + i * 0.4, 0.5, { type: 'sine', gain: 0.05, attack: 0.01 });
    note(f * 2, t + i * 0.4 + 0.2, 0.35, { type: 'sine', gain: 0.015, attack: 0.01 });
  }
}

/* Thème de la maison hantée : nappe sombre et notes fantomatiques. */
function barHante(t) {
  const minor = barIndex % 2 === 0;
  const chord = minor ? [146.83, 174.61, 220] : [138.59, 164.81, 207.65];
  for (const f of chord) {
    note(f, t, 4.4, { type: 'sine', gain: 0.05, attack: 1.4 });
    note(f, t, 4.4, { type: 'sine', gain: 0.04, attack: 1.4, detune: 9 });
  }
  note(minor ? 73.42 : 69.3, t, 4.2, { type: 'sine', gain: 0.07, attack: 0.3 });
  if (Math.random() < 0.5) {
    eerie([587.33, 698.46, 880][Math.floor(Math.random() * 3)], t + 0.8 + Math.random() * 1.5);
  }
}

function eerie(freq, t) {
  const o = audio.createOscillator();
  o.type = 'sine';
  o.frequency.value = freq;
  const lfo = audio.createOscillator();
  lfo.frequency.value = 5.5;
  const lg = audio.createGain();
  lg.gain.value = 8;
  lfo.connect(lg);
  lg.connect(o.frequency);
  const g = audio.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(0.028, t + 0.8);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 2.4);
  o.connect(g);
  g.connect(filter);
  o.start(t);
  lfo.start(t);
  o.stop(t + 2.5);
  lfo.stop(t + 2.5);
}
