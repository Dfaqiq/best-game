// The night's letters: they drift in on the wind from the right, bob gently,
// and wait to be picked up. A letter can only go to a window of its own
// colour; gold express letters are worth more and buy more night, but they
// fade after a few seconds. Moths are a small bonus for a careful flyer.

import { FIELD, LETTER, MOTH } from './config.js';
import { drawEnvelope, envelopeColor } from './owl.js';

export function createLetters(random) {
  const letters = [];
  const moths = [];
  let letterTimer = 0.8;
  let mothTimer = 2.5;
  let nextId = 1;

  function spawnLetter(level) {
    const express = level >= 2 && random.next() < 0.18;
    letters.push({
      id: nextId++,
      x: FIELD.width + 30,
      y: random.range(140, 420),
      color: random.pick(LETTER.colors),
      kind: express ? 'express' : 'normal',
      age: 0,
      bob: random.range(0, Math.PI * 2),
      state: 'drifting',
    });
  }

  function spawnMoth() {
    moths.push({
      x: FIELD.width + 20,
      y: random.range(140, 540),
      bob: random.range(0, Math.PI * 2),
      age: 0,
    });
  }

  function step(dt, speed, level) {
    letterTimer -= dt;
    if (letterTimer <= 0) {
      spawnLetter(level);
      const interval = Math.max(LETTER.minInterval, LETTER.interval * Math.pow(LETTER.intervalScale, level - 1));
      letterTimer = interval + random.range(0, LETTER.intervalJitter);
    }
    mothTimer -= dt;
    if (mothTimer <= 0) {
      spawnMoth();
      mothTimer = MOTH.interval + random.range(0, 2);
    }
    for (const l of letters) {
      if (l.state === 'drifting') {
        l.x -= speed * dt;
        l.bob += dt * 2;
        l.y += Math.sin(l.bob) * 14 * dt;
        l.age += dt;
        if (l.kind === 'express' && l.age > LETTER.expressLife) l.state = 'gone';
        if (l.x < -40) l.state = 'gone';
      }
    }
    for (const m of moths) {
      m.x -= speed * 0.9 * dt;
      m.bob += dt * 3;
      m.y += Math.sin(m.bob) * 22 * dt;
      m.age += dt;
      if (m.x < -30) m.age = 99;
    }
    for (let i = letters.length - 1; i >= 0; i -= 1) {
      if (letters[i].state === 'gone') letters.splice(i, 1);
    }
    for (let i = moths.length - 1; i >= 0; i -= 1) {
      if (moths[i].age > 40) moths.splice(i, 1);
    }
  }

  function reset() {
    letters.length = 0;
    moths.length = 0;
    letterTimer = 0.8;
    mothTimer = 2.5;
  }

  function draw(ctx, time) {
    for (const m of moths) {
      const flap = Math.sin(time * 18 + m.bob) * 0.7;
      ctx.save();
      ctx.translate(m.x, m.y);
      ctx.fillStyle = '#ffe9a8';
      ctx.beginPath();
      ctx.ellipse(-4, -flap * 3, 5, 2.6, -0.5 - flap * 0.3, 0, Math.PI * 2);
      ctx.ellipse(4, -flap * 3, 5, 2.6, 0.5 + flap * 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#8a6d3b';
      ctx.beginPath();
      ctx.ellipse(0, 0, 2.2, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    for (const l of letters) {
      if (l.state !== 'drifting') continue;
      const blink = l.kind === 'express' && l.age > LETTER.expressLife - 3 && Math.floor(time * 6) % 2 === 0;
      const pulse = l.kind === 'express' ? 1 + Math.sin(time * 6) * 0.12 : 1;
      ctx.save();
      ctx.translate(l.x, l.y);
      ctx.scale(pulse, pulse);
      if (blink) ctx.globalAlpha = 0.35;
      // A soft glow so the letter reads at a glance.
      ctx.fillStyle = l.kind === 'express' ? 'rgba(255, 213, 74, 0.22)' : 'rgba(242, 234, 216, 0.14)';
      ctx.beginPath();
      ctx.arc(0, 0, 34, 0, Math.PI * 2);
      ctx.fill();
      drawEnvelope(ctx, 0, 0, 34, 23, l.color, Math.sin(l.bob) * 0.08);
      if (l.kind === 'express') {
        ctx.fillStyle = '#ffd54a';
        ctx.font = 'bold 11px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('EXPRESS', 0, -20);
      }
      ctx.restore();
    }
  }

  return {
    letters,
    moths,
    step,
    reset,
    draw,
    /** Pick up any drifting letter within reach of the owl; returns the letter or null. */
    tryPickup(owlX, owlY) {
      for (const l of letters) {
        if (l.state !== 'drifting') continue;
        if (Math.hypot(l.x - owlX, l.y - owlY) < LETTER.pickupRadius) {
          l.state = 'carried';
          return l;
        }
      }
      return null;
    },
    tryMoth(owlX, owlY) {
      for (let i = 0; i < moths.length; i += 1) {
        if (Math.hypot(moths[i].x - owlX, moths[i].y - owlY) < MOTH.radius + 26) {
          moths.splice(i, 1);
          return true;
        }
      }
      return false;
    },
    carriedCount(carried) {
      return carried.length;
    },
    envelopeColor,
  };
}
