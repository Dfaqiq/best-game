// Hazards: bats that wobble in from the right, and wind gusts that shove the
// owl up or down. Both are telegraphed — bats flap loudly on screen, gusts
// show as pale streaks with drifting leaves before they push.

import { FIELD, BAT, GUST } from './config.js';

export function createHazards(random) {
  const bats = [];
  const gusts = [];
  let batTimer = 4;
  let gustTimer = 5;

  function spawnBat(level) {
    bats.push({
      x: FIELD.width + 30,
      y: random.range(140, 560),
      baseY: 0,
      speed: BAT.speed + BAT.speedPerLevel * (level - 1) + random.range(-30, 30),
      wing: random.range(0, Math.PI * 2),
      age: 0,
    });
    bats[bats.length - 1].baseY = bats[bats.length - 1].y;
  }

  function spawnGust() {
    gusts.push({
      x: FIELD.width + 40,
      y: random.range(180, 520),
      dir: random.next() < 0.5 ? -1 : 1,
      age: 0,
      life: 5,
    });
  }

  function step(dt, speed, level) {
    if (level >= BAT.fromLevel) {
      batTimer -= dt;
      if (batTimer <= 0) {
        spawnBat(level);
        const interval = Math.max(BAT.minInterval, BAT.interval * Math.pow(BAT.intervalScale, level - 1));
        batTimer = interval + random.range(0, 1.4);
      }
    }
    if (level >= GUST.fromLevel) {
      gustTimer -= dt;
      if (gustTimer <= 0) {
        spawnGust();
        gustTimer = GUST.interval + random.range(0, 2.5);
      }
    }
    for (const b of bats) {
      b.x -= b.speed * dt;
      b.age += dt;
      b.wing += dt * 14;
      b.y = b.baseY + Math.sin(b.age * 2.4) * 46;
    }
    for (const g of gusts) {
      g.x -= speed * dt;
      g.age += dt;
    }
    for (let i = bats.length - 1; i >= 0; i -= 1) {
      if (bats[i].x < -50) bats.splice(i, 1);
    }
    for (let i = gusts.length - 1; i >= 0; i -= 1) {
      if (gusts[i].age > gusts[i].life || gusts[i].x + GUST.width < -20) gusts.splice(i, 1);
    }
  }

  function reset() {
    bats.length = 0;
    gusts.length = 0;
    batTimer = 4;
    gustTimer = 5;
  }

  /** The vertical push a gust applies to something at (x, y); 0 outside it. */
  function gustPush(x, y) {
    let push = 0;
    for (const g of gusts) {
      if (x > g.x - 20 && x < g.x + GUST.width + 20 && y > g.y - GUST.height / 2 && y < g.y + GUST.height / 2) {
        push += g.dir * GUST.push;
      }
    }
    return push;
  }

  function draw(ctx, time) {
    for (const g of gusts) {
      ctx.save();
      ctx.fillStyle = 'rgba(190, 220, 255, 0.10)';
      ctx.fillRect(g.x, g.y - GUST.height / 2, GUST.width, GUST.height);
      ctx.strokeStyle = 'rgba(220, 235, 255, 0.35)';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 4; i += 1) {
        const ly = g.y - GUST.height / 2 + 24 + i * 44;
        const lx = g.x + ((time * 160 + i * 47) % GUST.width);
        ctx.beginPath();
        ctx.moveTo(lx, ly);
        ctx.lineTo(lx + 26, ly + (g.dir > 0 ? 10 : -10));
        ctx.stroke();
      }
      ctx.fillStyle = '#c9a86a';
      for (let i = 0; i < 3; i += 1) {
        const lx = g.x + ((time * 120 + i * 61) % GUST.width);
        const ly = g.y - 40 + i * 40 + Math.sin(time * 3 + i) * 8;
        ctx.save();
        ctx.translate(lx, ly);
        ctx.rotate(time * 2 + i);
        ctx.fillRect(-3, -1.5, 6, 3);
        ctx.restore();
      }
      ctx.restore();
    }
    for (const b of bats) {
      const flap = Math.sin(b.wing) * 0.8;
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.fillStyle = '#3d2b52';
      ctx.beginPath();
      ctx.ellipse(-12, -flap * 8, 15, 6, -0.5 - flap * 0.3, 0, Math.PI * 2);
      ctx.ellipse(12, -flap * 8, 15, 6, 0.5 + flap * 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#241a2e';
      ctx.beginPath();
      ctx.ellipse(0, 0, 12, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-6, -8);
      ctx.lineTo(-9, -15);
      ctx.lineTo(-3, -10);
      ctx.closePath();
      ctx.moveTo(6, -8);
      ctx.lineTo(9, -15);
      ctx.lineTo(3, -10);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ff5e6e';
      ctx.beginPath();
      ctx.arc(-4, -2, 1.8, 0, Math.PI * 2);
      ctx.arc(4, -2, 1.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  return {
    bats,
    gusts,
    step,
    reset,
    draw,
    gustPush,
  };
}
