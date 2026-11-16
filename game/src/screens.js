// The title, pause, win and lose screens. They draw over the world on a dim
// panel, with the game's own art: the title shows the owl under the moon, the
// end screens show the score and how to fly again.

import { FIELD, GOAL, PALETTE } from './config.js';
import { createOwl } from './owl.js';

// A still owl for the title screen, drawn with the game's own art.
const titleOwl = createOwl();
titleOwl.state.x = FIELD.width / 2;
titleOwl.state.y = 128;
titleOwl.state.flapPhase = 1.1;
titleOwl.state.tilt = 0;

function dim(ctx, alpha) {
  ctx.fillStyle = `rgba(8, 10, 22, ${alpha})`;
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
}

function card(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(16, 21, 44, 0.88)';
  ctx.strokeStyle = PALETTE.panelEdge;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 18);
  ctx.fill();
  ctx.stroke();
}

function titleText(ctx, text, y, size, color, weight) {
  ctx.fillStyle = color;
  ctx.font = `${weight || 'bold'} ${size}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(text, FIELD.width / 2, y);
}

function prompt(ctx, y, time) {
  const a = 0.65 + Math.sin(time * 3) * 0.35;
  ctx.fillStyle = `rgba(255, 179, 71, ${a})`;
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Press Space or click to start', FIELD.width / 2, y);
}

export function drawTitle(ctx, state, time) {
  dim(ctx, 0.45);
  // Moon with Pip perched in front of it, drawn with the game's own owl art.
  ctx.fillStyle = PALETTE.moon;
  ctx.beginPath();
  ctx.arc(FIELD.width / 2, 128, 54, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(242, 230, 201, 0.18)';
  ctx.beginPath();
  ctx.arc(FIELD.width / 2, 128, 72, 0, Math.PI * 2);
  ctx.fill();
  titleOwl.draw(ctx, time, []);

  card(ctx, FIELD.width / 2 - 330, 236, 660, 300);
  titleText(ctx, 'DUSK POST', 306, 64, PALETTE.text);
  titleText(ctx, 'Deliver the night’s letters before dawn.', 348, 21, PALETTE.accent);
  ctx.fillStyle = PALETTE.muted;
  ctx.font = '19px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Steer Pip the owl with your mouse or arrow keys.', FIELD.width / 2, 396);
  ctx.fillText('Catch letters, drop each one at a glowing mailbox of its colour.', FIELD.width / 2, 424);
  ctx.fillText(`Deliver ${GOAL} letters to win. Mind the chimneys, bats and gusts.`, FIELD.width / 2, 452);
  ctx.fillStyle = PALETTE.text;
  ctx.font = 'bold 18px system-ui, sans-serif';
  ctx.fillText(`Best score  ${state.best.toLocaleString('en-US')}`, FIELD.width / 2, 496);
  prompt(ctx, 578, time);
}

export function drawPause(ctx, state, time) {
  dim(ctx, 0.55);
  card(ctx, FIELD.width / 2 - 230, 270, 460, 170);
  titleText(ctx, 'Paused', 330, 44, PALETTE.text);
  titleText(ctx, 'The night waits for you.', 372, 19, PALETTE.muted);
  ctx.fillStyle = `rgba(255, 179, 71, ${0.65 + Math.sin(time * 3) * 0.35})`;
  ctx.font = 'bold 20px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Press P to keep flying', FIELD.width / 2, 412);
}

export function drawWin(ctx, state, time) {
  dim(ctx, 0.5);
  card(ctx, FIELD.width / 2 - 330, 210, 660, 320);
  titleText(ctx, 'Every letter home!', 282, 52, '#ffd54a');
  titleText(ctx, 'Dawn breaks over a city that got its mail.', 322, 21, PALETTE.accent);
  ctx.fillStyle = PALETTE.text;
  ctx.font = 'bold 30px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`Score  ${state.score.toLocaleString('en-US')}`, FIELD.width / 2, 392);
  ctx.fillStyle = PALETTE.muted;
  ctx.font = '20px system-ui, sans-serif';
  ctx.fillText(`${GOAL} letters delivered  ·  best combo x${state.bestCombo}  ·  ${state.lives} ${state.lives === 1 ? 'life' : 'lives'} left`, FIELD.width / 2, 428);
  ctx.fillStyle = PALETTE.text;
  ctx.font = 'bold 18px system-ui, sans-serif';
  ctx.fillText(`Best  ${state.best.toLocaleString('en-US')}`, FIELD.width / 2, 468);
  prompt(ctx, 512, time);
}

export function drawLose(ctx, state, time) {
  dim(ctx, 0.55);
  card(ctx, FIELD.width / 2 - 330, 210, 660, 320);
  const byDawn = state.night <= 0;
  titleText(ctx, byDawn ? 'Dawn broke too soon' : 'Pip is grounded', 282, 48, PALETTE.danger);
  titleText(
    ctx,
    byDawn ? 'The sun rose with letters still undelivered.' : 'Three crashes ended the night’s round.',
    322,
    21,
    PALETTE.muted,
  );
  ctx.fillStyle = PALETTE.text;
  ctx.font = 'bold 30px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`Score  ${state.score.toLocaleString('en-US')}`, FIELD.width / 2, 392);
  ctx.fillStyle = PALETTE.muted;
  ctx.font = '20px system-ui, sans-serif';
  ctx.fillText(`${state.delivered} of ${GOAL} letters delivered  ·  best combo x${state.bestCombo}`, FIELD.width / 2, 428);
  ctx.fillStyle = PALETTE.text;
  ctx.font = 'bold 18px system-ui, sans-serif';
  ctx.fillText(`Best  ${state.best.toLocaleString('en-US')}`, FIELD.width / 2, 468);
  prompt(ctx, 512, time);
}
