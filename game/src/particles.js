// Small bursts of feedback: golden sparkles and drifting feathers on a
// delivery, grey puffs on a crash, a soft trail behind the owl.

import { PALETTE } from './config.js';

export function createParticles() {
  const parts = [];

  function burst(x, y, kind) {
    const count = kind === 'crash' ? 22 : 18;
    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * (kind === 'crash' ? 180 : 130);
      parts.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 30,
        age: 0,
        life: 0.5 + Math.random() * 0.5,
        size: kind === 'crash' ? 3 + Math.random() * 4 : 2 + Math.random() * 3.5,
        kind: kind === 'crash' ? 'crash' : 'spark',
        spin: Math.random() * Math.PI * 2,
      });
    }
  }

  function trail(x, y) {
    if (parts.length > 220) return;
    parts.push({
      x: x - 24,
      y: y + 8,
      vx: -30,
      vy: 6,
      age: 0,
      life: 0.4,
      size: 2,
      kind: 'trail',
      spin: 0,
    });
  }

  function step(dt) {
    for (let i = parts.length - 1; i >= 0; i -= 1) {
      const p = parts[i];
      p.age += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += (p.kind === 'crash' ? 260 : 60) * dt;
      p.spin += dt * 4;
      if (p.age > p.life) parts.splice(i, 1);
    }
  }

  function draw(ctx) {
    for (const p of parts) {
      const t = 1 - p.age / p.life;
      if (p.kind === 'spark') {
        ctx.fillStyle = `rgba(255, 213, 74, ${t})`;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.spin);
        ctx.fillRect(-p.size, -p.size / 3, p.size * 2, p.size / 1.5);
        ctx.restore();
      } else if (p.kind === 'feather') {
        ctx.fillStyle = `rgba(242, 230, 201, ${t * 0.9})`;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.spin);
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size * 1.6, p.size * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (p.kind === 'crash') {
        ctx.fillStyle = `rgba(120, 110, 100, ${t * 0.8})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1 + p.age), 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = `rgba(190, 205, 235, ${t * 0.35})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  return {
    parts,
    burst(x, y, kind) {
      burst(x, y, kind);
      if (kind === 'deliver') {
        for (let i = 0; i < 6; i += 1) {
          parts.push({
            x: x + (Math.random() - 0.5) * 30,
            y: y + (Math.random() - 0.5) * 20,
            vx: (Math.random() - 0.5) * 60,
            vy: -20 - Math.random() * 40,
            age: 0,
            life: 0.9 + Math.random() * 0.5,
            size: 3 + Math.random() * 3,
            kind: 'feather',
            spin: Math.random() * Math.PI * 2,
          });
        }
      }
    },
    trail,
    step,
    draw,
    reset() {
      parts.length = 0;
    },
  };
}
