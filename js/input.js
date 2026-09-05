export const input = { vx: 0, vy: 0 };

const keys = new Set();
let onAction = null;

function updateFromKeys() {
  let vx = 0, vy = 0;
  if (keys.has('ArrowLeft') || keys.has('KeyA')) { vx -= 1; }
  if (keys.has('ArrowRight') || keys.has('KeyD')) { vx += 1; }
  if (keys.has('ArrowUp') || keys.has('KeyW')) { vy -= 1; }
  if (keys.has('ArrowDown') || keys.has('KeyS')) { vy += 1; }
  const len = Math.hypot(vx, vy);
  input.vx = len ? vx / len : 0;
  input.vy = len ? vy / len : 0;
}

export function initInput(actionCallback) {
  onAction = actionCallback;

  window.addEventListener('keydown', (e) => {
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(e.code)) {
      e.preventDefault();
    }
    if (e.repeat) { return; }
    if (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyE') {
      onAction && onAction();
      return;
    }
    keys.add(e.code);
    updateFromKeys();
  });
  window.addEventListener('keyup', (e) => {
    keys.delete(e.code);
    updateFromKeys();
  });

  const zone = document.getElementById('stick-zone');
  const base = document.getElementById('stick-base');
  const knob = document.getElementById('stick-knob');
  let stickId = null;
  let originX = 0, originY = 0;
  const RADIUS = 46;

  zone.addEventListener('pointerdown', (e) => {
    if (stickId !== null) { return; }
    stickId = e.pointerId;
    zone.setPointerCapture(e.pointerId);
    originX = e.clientX;
    originY = e.clientY;
    base.hidden = false;
    base.style.left = originX + 'px';
    base.style.top = originY + 'px';
    knob.style.transform = 'translate(-50%, -50%)';
  });

  zone.addEventListener('pointermove', (e) => {
    if (e.pointerId !== stickId) { return; }
    let dx = e.clientX - originX;
    let dy = e.clientY - originY;
    const len = Math.hypot(dx, dy);
    if (len > RADIUS) {
      dx = (dx / len) * RADIUS;
      dy = (dy / len) * RADIUS;
    }
    knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    const dead = 8;
    if (len < dead) {
      input.vx = 0; input.vy = 0;
    } else {
      const norm = Math.min(1, len / RADIUS);
      input.vx = (dx / (len || 1)) * norm;
      input.vy = (dy / (len || 1)) * norm;
    }
  });

  const endStick = (e) => {
    if (e.pointerId !== stickId) { return; }
    stickId = null;
    base.hidden = true;
    input.vx = 0;
    input.vy = 0;
  };
  zone.addEventListener('pointerup', endStick);
  zone.addEventListener('pointercancel', endStick);

  const btn = document.getElementById('btn-action');
  btn.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    onAction && onAction();
  });
}
