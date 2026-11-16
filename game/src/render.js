// The renderer: one painter for the night. Sky gradient and stars, the moon,
// two parallax skylines, the near rooftops with their lit windows, letters,
// bats, gusts, the owl, particles and the HUD — then the screen overlay.
// The whole scene is drawn from the world state, so a screenshot of a staged
// scene is the game itself.

import { FIELD, NIGHT_SECONDS, PALETTE } from './config.js';
import { envelopeColor } from './owl.js';
import { drawHud } from './hud.js';
import { drawTitle, drawPause, drawWin, drawLose } from './screens.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';
export const SCREEN_WIN = 'win';

function lerpColor(a, b, t) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  const mix = pa.map((v, i) => Math.round(v + (pb[i] - v) * t));
  return `rgb(${mix[0]}, ${mix[1]}, ${mix[2]})`;
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  const stars = [];
  for (let i = 0; i < 90; i += 1) {
    stars.push({
      x: (i * 137.5) % FIELD.width,
      y: ((i * 89.3) % 330) + 8,
      r: 0.6 + ((i * 7) % 10) / 12,
      tw: (i * 0.37) % (Math.PI * 2),
    });
  }

  function drawSky(state, time) {
    const dawn = 1 - state.night / NIGHT_SECONDS;
    const grad = ctx.createLinearGradient(0, 0, 0, FIELD.height);
    grad.addColorStop(0, lerpColor(PALETTE.skyTop, '#3a2a55', dawn * 0.7));
    grad.addColorStop(0.55, lerpColor(PALETTE.skyMid, '#6b3a5e', dawn * 0.7));
    grad.addColorStop(1, lerpColor(PALETTE.skyLow, '#c97e4a', dawn));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    // Stars fade as dawn comes.
    ctx.fillStyle = PALETTE.star;
    for (const s of stars) {
      ctx.globalAlpha = (0.35 + Math.sin(time * 1.5 + s.tw) * 0.3) * (1 - dawn * 0.85);
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    // Moon, low on the right so it never crowds the HUD.
    const mx = 1150;
    const my = 200;
    ctx.fillStyle = 'rgba(242, 230, 201, 0.16)';
    ctx.beginPath();
    ctx.arc(mx, my, 46, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.moon;
    ctx.beginPath();
    ctx.arc(mx, my, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(180, 165, 120, 0.5)';
    ctx.beginPath();
    ctx.arc(mx - 10, my - 6, 6, 0, Math.PI * 2);
    ctx.arc(mx + 12, my + 10, 4, 0, Math.PI * 2);
    ctx.fill();
    // Dawn glow on the horizon.
    if (dawn > 0.05) {
      const glow = ctx.createLinearGradient(0, 520, 0, FIELD.height);
      glow.addColorStop(0, 'rgba(232, 160, 76, 0)');
      glow.addColorStop(1, `rgba(232, 160, 76, ${dawn * 0.5})`);
      ctx.fillStyle = glow;
      ctx.fillRect(0, 520, FIELD.width, FIELD.height - 520);
    }
  }

  function drawCity(world, state, time) {
    const city = world.city;
    // Far skyline.
    ctx.fillStyle = PALETTE.farSkyline;
    for (const f of city.far) {
      ctx.fillRect(f.x, city.groundY - f.h, f.w, f.h);
      ctx.beginPath();
      ctx.moveTo(f.x, city.groundY - f.h);
      ctx.lineTo(f.x + f.w / 2, city.groundY - f.h - 14);
      ctx.lineTo(f.x + f.w, city.groundY - f.h);
      ctx.closePath();
      ctx.fill();
    }
    // Near buildings.
    for (const b of city.buildings) {
      const shade = ['#26304a', '#1d2740', '#2c3856'][b.shade];
      ctx.fillStyle = shade;
      ctx.fillRect(b.x, b.top, b.width, b.height);
      // Roof edge.
      ctx.fillStyle = PALETTE.roof;
      ctx.fillRect(b.x - 2, b.top - 4, b.width + 4, 8);
      // Chimney.
      if (b.chimney) {
        const cx = b.x + b.chimneyX * b.width;
        ctx.fillStyle = PALETTE.chimney;
        ctx.fillRect(cx - 9, b.top - 30, 18, 30);
        ctx.fillStyle = '#3d4a6b';
        ctx.fillRect(cx - 12, b.top - 34, 24, 6);
      }
      // Mailboxes on the roof: glowing and open, or closed and grey.
      for (const m of b.mailboxes) {
        const mx = b.x + m.dx;
        const my = b.top - 12;
        if (m.lit) {
          ctx.fillStyle = envelopeColor(m.color);
          ctx.globalAlpha = 0.22;
          ctx.beginPath();
          ctx.arc(mx, my, 30, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
          ctx.fillStyle = envelopeColor(m.color);
          ctx.beginPath();
          ctx.roundRect(mx - 13, my - 9, 26, 20, 4);
          ctx.fill();
          ctx.fillStyle = 'rgba(20, 27, 48, 0.8)';
          ctx.fillRect(mx - 13, my - 2, 26, 3);
          ctx.fillStyle = envelopeColor(m.color);
          ctx.fillRect(mx + 10, my - 22, 2, 13);
          ctx.beginPath();
          ctx.moveTo(mx + 12, my - 22);
          ctx.lineTo(mx + 24, my - 18);
          ctx.lineTo(mx + 12, my - 14);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.fillStyle = '#3a435e';
          ctx.beginPath();
          ctx.roundRect(mx - 13, my - 9, 26, 20, 4);
          ctx.fill();
        }
      }
      // Windows.
      for (const w of b.windows) {
        const wx = b.x + w.dx;
        const wy = b.top + w.dy;
        if (w.lit) {
          ctx.fillStyle = envelopeColor(w.color);
          ctx.fillRect(wx, wy, 22, 26);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
          ctx.fillRect(wx, wy, 22, 4);
          // Cross frame.
          ctx.fillStyle = 'rgba(20, 27, 48, 0.55)';
          ctx.fillRect(wx + 10, wy, 2, 26);
          ctx.fillRect(wx, wy + 12, 22, 2);
        } else {
          ctx.fillStyle = PALETTE.windowDark;
          ctx.fillRect(wx, wy, 22, 26);
        }
      }
    }
    // Street.
    ctx.fillStyle = '#12172a';
    ctx.fillRect(0, city.groundY, FIELD.width, FIELD.height - city.groundY);
    ctx.fillStyle = 'rgba(255, 179, 71, 0.12)';
    ctx.fillRect(0, city.groundY, FIELD.width, 3);
  }

  function drawHint(world, state) {
    if (!state.carried.length || state.over) return;
    const letter = state.carried[0];
    const target = world.city.litMailboxAhead(world.owl.state.x, letter.color);
    if (!target) return;
    const ox = world.owl.state.x;
    const oy = world.owl.state.y;
    const dx = target.x - ox;
    const dy = target.y - oy;
    const dist = Math.hypot(dx, dy);
    if (dist < 120) return;
    const angle = Math.atan2(dy, dx);
    const ax = ox + Math.cos(angle) * 64;
    const ay = oy + Math.sin(angle) * 64;
    ctx.save();
    ctx.translate(ax, ay);
    ctx.rotate(angle);
    ctx.globalAlpha = 0.75 + Math.sin(performance.now() / 180) * 0.2;
    ctx.fillStyle = envelopeColor(letter.color);
    ctx.beginPath();
    ctx.moveTo(14, 0);
    ctx.lineTo(-8, -9);
    ctx.lineTo(-8, 9);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  function draw(state, screen, best) {
    const world = state.world;
    const time = state.time;
    ctx.save();
    if (world.state.shake > 0.5) {
      ctx.translate((Math.random() - 0.5) * world.state.shake, (Math.random() - 0.5) * world.state.shake);
    }
    drawSky(world.state, time);
    drawCity(world, world.state, time);
    world.hazards.draw(ctx, time);
    world.letters.draw(ctx, time);
    drawHint(world, world.state);
    // The owl is hidden on the end screens: on a win it has flown home, on a
    // loss it is grounded, and its body behind the card reads as a smudge.
    if (screen !== SCREEN_WIN && screen !== SCREEN_OVER) {
      world.owl.draw(ctx, time, world.state.carried);
    }
    world.particles.draw(ctx);
    ctx.restore();
    if (screen === SCREEN_PLAY || screen === SCREEN_PAUSED) {
      drawHud(ctx, { ...world.state, best }, time);
    }
    if (screen === SCREEN_TITLE) drawTitle(ctx, { ...world.state, best }, time);
    if (screen === SCREEN_PAUSED) drawPause(ctx, { ...world.state, best }, time);
    if (screen === SCREEN_WIN) drawWin(ctx, { ...world.state, best }, time);
    if (screen === SCREEN_OVER) drawLose(ctx, { ...world.state, best }, time);
  }

  return { draw };
}
