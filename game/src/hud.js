// The HUD: letters delivered and score top-left, lives and the dawn meter
// top-right, carried letters bottom-left, and a combo badge when the owl is
// on a streak. Everything is drawn on the canvas so the screenshots show it.

import { FIELD, GOAL, NIGHT_SECONDS, PALETTE } from './config.js';
import { drawEnvelope } from './owl.js';

function panel(ctx, x, y, w, h) {
  ctx.fillStyle = PALETTE.panel;
  ctx.strokeStyle = PALETTE.panelEdge;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 10);
  ctx.fill();
  ctx.stroke();
}

export function drawHud(ctx, state, time) {
  ctx.textBaseline = 'alphabetic';
  // Top-left: deliveries + score.
  panel(ctx, 16, 14, 268, 64);
  ctx.fillStyle = PALETTE.text;
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`Letters  ${state.delivered}/${GOAL}`, 30, 42);
  ctx.fillStyle = PALETTE.accent;
  ctx.font = 'bold 20px system-ui, sans-serif';
  ctx.fillText(`Score  ${state.score.toLocaleString('en-US')}`, 30, 68);
  // Combo badge.
  if (state.combo >= 2) {
    const pulse = 1 + Math.sin(time * 5) * 0.05;
    ctx.save();
    ctx.translate(300, 46);
    ctx.scale(pulse, pulse);
    ctx.fillStyle = '#ffd54a';
    ctx.beginPath();
    ctx.roundRect(-34, -20, 68, 40, 20);
    ctx.fill();
    ctx.fillStyle = '#3a2a10';
    ctx.font = 'bold 18px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`x${state.combo}`, 0, 6);
    ctx.restore();
  }
  // Top-right: lives + dawn meter.
  panel(ctx, FIELD.width - 316, 14, 300, 64);
  ctx.fillStyle = PALETTE.text;
  ctx.font = 'bold 18px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Lives', FIELD.width - 300, 40);
  for (let i = 0; i < 3; i += 1) {
    const lx = FIELD.width - 246 + i * 30;
    const ly = 34;
    ctx.save();
    ctx.translate(lx, ly);
    if (i < state.lives) {
      ctx.fillStyle = PALETTE.owlCream;
    } else {
      ctx.fillStyle = 'rgba(154, 163, 192, 0.35)';
    }
    ctx.beginPath();
    ctx.ellipse(0, 0, 8, 12, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  // Dawn meter: the sun climbs as the night runs out.
  const dawn = 1 - state.night / NIGHT_SECONDS;
  ctx.fillStyle = PALETTE.text;
  ctx.font = 'bold 18px system-ui, sans-serif';
  ctx.fillText('Dawn', FIELD.width - 300, 68);
  ctx.fillStyle = 'rgba(242, 234, 216, 0.18)';
  ctx.beginPath();
  ctx.roundRect(FIELD.width - 246, 56, 150, 12, 6);
  ctx.fill();
  ctx.fillStyle = dawn > 0.8 ? PALETTE.danger : PALETTE.dawnGlow;
  ctx.beginPath();
  ctx.roundRect(FIELD.width - 246, 56, 150 * dawn, 12, 6);
  ctx.fill();
  ctx.fillStyle = '#ffd54a';
  ctx.beginPath();
  ctx.arc(FIELD.width - 246 + 150 * dawn, 62, 8, 0, Math.PI * 2);
  ctx.fill();
  // Bottom-left: carried letters.
  if (state.carried.length) {
    panel(ctx, 16, FIELD.height - 58, 44 + state.carried.length * 44, 42);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Carrying', 28, FIELD.height - 30);
    for (let i = 0; i < state.carried.length; i += 1) {
      drawEnvelope(ctx, 108 + i * 44, FIELD.height - 37, 30, 20, state.carried[i].color, 0);
    }
  }
  // Level tag, small, bottom-right.
  ctx.fillStyle = 'rgba(242, 234, 216, 0.6)';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`Night ${state.level}  ·  Best ${state.best.toLocaleString('en-US')}`, FIELD.width - 16, FIELD.height - 18);
}
