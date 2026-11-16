// The night city: two parallax skylines and the near rooftops the owl rides
// above. Buildings scroll left and are recycled at the right edge with new
// heights, chimneys, lit windows and glowing mailboxes. A mailbox stays open
// for a while, then closes — a letter can only go to an open mailbox of its
// own colour, and the mailbox sits on the roof, so deliveries happen just
// above the roofline, where the owl can fly.

import { FIELD, MAILBOX } from './config.js';

const GROUND_Y = 648;
const MIN_HEIGHT = 90;
const MAX_HEIGHT = 260;
const MIN_WIDTH = 92;
const MAX_WIDTH = 190;

function makeBuilding(random, x) {
  const width = random.range(MIN_WIDTH, MAX_WIDTH);
  const height = random.range(MIN_HEIGHT, MAX_HEIGHT);
  const cols = Math.max(1, Math.floor((width - 24) / 46));
  const rows = Math.max(1, Math.floor((height - 30) / 54));
  const windows = [];
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      if (random.next() < 0.72) {
        windows.push({
          dx: 16 + col * 46,
          dy: 18 + row * 54,
          color: random.pick(['amber', 'green', 'violet']),
          lit: true,
          age: random.range(0, 20),
        });
      }
    }
  }
  // One or two glowing mailboxes on the roof; a building can also have none.
  const mailboxes = [];
  const mailboxCount = random.next() < 0.25 ? 0 : random.next() < 0.7 ? 1 : 2;
  for (let i = 0; i < mailboxCount; i += 1) {
    mailboxes.push({
      dx: random.range(24, Math.max(30, width - 50)),
      color: random.pick(['amber', 'green', 'violet']),
      lit: true,
      age: random.range(0, MAILBOX.litSeconds * 0.4),
    });
  }
  return {
    x,
    width,
    height,
    top: GROUND_Y - height,
    chimney: random.next() < 0.32,
    chimneyX: random.range(0.15, 0.75),
    windows,
    mailboxes,
    shade: random.pick([0, 1, 2]),
  };
}

export function createCity(random) {
  const buildings = [];
  const far = [];
  let farSeed = 0;

  function reset() {
    buildings.length = 0;
    far.length = 0;
    let x = -40;
    while (x < FIELD.width + 220) {
      const b = makeBuilding(random, x);
      buildings.push(b);
      x += b.width + random.range(24, 60);
    }
    farSeed = random.range(0, 1000);
    for (let i = 0; i < 26; i += 1) {
      far.push({ x: i * 58 + random.range(-12, 12), w: random.range(30, 62), h: random.range(60, 210) });
    }
  }

  function step(dt, speed) {
    for (const b of buildings) {
      b.x -= speed * dt;
      for (const w of b.windows) {
        if (w.lit) {
          w.age += dt;
          if (w.age > 20) w.lit = false;
        }
      }
      for (const m of b.mailboxes) {
        if (m.lit) {
          m.age += dt;
          if (m.age > MAILBOX.litSeconds) m.lit = false;
        }
      }
    }
    let right = 0;
    for (const b of buildings) right = Math.max(right, b.x + b.width);
    for (let i = 0; i < buildings.length; i += 1) {
      if (buildings[i].x + buildings[i].width < -20) {
        buildings[i] = makeBuilding(random, right + random.range(24, 60));
        right = buildings[i].x + buildings[i].width;
      }
    }
    for (const f of far) {
      f.x -= speed * 0.25 * dt;
      if (f.x + f.w < -20) {
        f.x = FIELD.width + random.range(0, 80);
        f.w = random.range(30, 62);
        f.h = random.range(60, 210);
      }
    }
  }

  return {
    reset,
    step,
    buildings,
    far,
    farSeed,
    groundY: GROUND_Y,
    /** The nearest open mailbox of `color` within `radius` of (x, y), or null. */
    litMailboxNear(x, y, color, radius) {
      let best = null;
      let bestD = radius;
      for (const b of buildings) {
        if (b.x > x + radius || b.x + b.width < x - radius) continue;
        for (const m of b.mailboxes) {
          if (!m.lit || m.color !== color) continue;
          const mx = b.x + m.dx;
          const my = b.top - 12;
          const d = Math.hypot(mx - x, my - y);
          if (d < bestD) {
            bestD = d;
            best = { building: b, mailbox: m, x: mx, y: my };
          }
        }
      }
      return best;
    },
    /** The nearest open mailbox of `color` ahead (for the delivery hint arrow). */
    litMailboxAhead(x, color) {
      let best = null;
      for (const b of buildings) {
        if (b.x + b.width < x) continue;
        for (const m of b.mailboxes) {
          if (!m.lit || m.color !== color) continue;
          const mx = b.x + m.dx;
          const my = b.top - 12;
          if (!best || mx < best.x) best = { x: mx, y: my };
        }
      }
      return best;
    },
  };
}
