// The world: one fixed-step simulation of the night. The owl flies, the city
// scrolls, letters drift in, bats wobble across, and the dawn meter drains.
// Deliveries buy the night back; three crashes, or a dawn with letters still
// out, end the game.

import {
  FIELD, STEP, OWL, LIVES, GOAL, NIGHT_SECONDS, NIGHT_BONUS, NIGHT_BONUS_EXPRESS,
  COMBO_WINDOW, COMBO_MAX, SCROLL, LETTER, MAILBOX, LEVEL, MOTH,
} from './config.js';
import { createOwl } from './owl.js';
import { createCity } from './city.js';
import { createLetters } from './letters.js';
import { createHazards } from './hazards.js';
import { createParticles } from './particles.js';

export const EVENT_PICKUP = 1;
export const EVENT_DELIVER = 2;
export const EVENT_HIT = 4;
export const EVENT_OVER = 8;
export const EVENT_WIN = 16;
export const EVENT_MOTH = 32;

export function scrollSpeed(level) {
  return SCROLL.base + SCROLL.perLevel * (level - 1);
}

export function createWorld(random, audio) {
  const owl = createOwl();
  const city = createCity(random);
  const letters = createLetters(random);
  const hazards = createHazards(random);
  const particles = createParticles();
  const state = {
    time: 0,
    night: NIGHT_SECONDS,
    score: 0,
    combo: 0,
    comboTimer: 0,
    bestCombo: 0,
    delivered: 0,
    lives: LIVES,
    level: 1,
    best: 0,
    carried: [],
    shake: 0,
    over: false,
    won: false,
    lostByDawn: false,
    trailTimer: 0,
  };

  function reset() {
    state.time = 0;
    state.night = NIGHT_SECONDS;
    state.score = 0;
    state.combo = 0;
    state.comboTimer = 0;
    state.bestCombo = 0;
    state.delivered = 0;
    state.lives = LIVES;
    state.level = 1;
    state.carried = [];
    state.shake = 0;
    state.over = false;
    state.won = false;
    state.lostByDawn = false;
    state.trailTimer = 0;
    owl.state.x = OWL.x;
    owl.state.y = 360;
    owl.state.vx = 0;
    owl.state.vy = 0;
    owl.state.invulnerable = 0;
    city.reset();
    letters.reset();
    hazards.reset();
    particles.reset();
  }

  function crash() {
    state.lives -= 1;
    state.combo = 0;
    state.comboTimer = 0;
    owl.state.invulnerable = OWL.invulnerable;
    state.shake = 14;
    particles.burst(owl.state.x, owl.state.y, 'crash');
    if (audio) audio.crash();
    // A crash shakes one carried letter loose; it flutters away.
    const lost = state.carried.pop();
    if (lost) particles.burst(owl.state.x, owl.state.y + 30, 'deliver');
    if (state.lives <= 0) {
      state.over = true;
      state.lostByDawn = false;
      if (audio) audio.lose();
      return EVENT_HIT | EVENT_OVER;
    }
    return EVENT_HIT;
  }

  function step(dt, input, demo) {
    if (state.over) return 0;
    let events = 0;
    state.time += dt;
    if (!demo) state.night -= dt;
    state.level = Math.min(LEVEL.max, 1 + Math.floor(state.delivered / LEVEL.deliveriesPerLevel));
    const speed = scrollSpeed(state.level);

    city.step(dt, speed);
    letters.step(dt, speed, state.level);
    hazards.step(dt, speed, state.level);
    particles.step(dt);
    if (state.comboTimer > 0) {
      state.comboTimer -= dt;
      if (state.comboTimer <= 0) state.combo = 0;
    }

    owl.step(dt, input);
    // Wind gusts shove the owl after it steers.
    owl.state.y += hazards.gustPush(owl.state.x, owl.state.y) * dt;
    owl.state.y = Math.max(OWL.minY, Math.min(OWL.maxY, owl.state.y));
    if (state.shake > 0) state.shake = Math.max(0, state.shake - dt * 40);
    state.trailTimer -= dt;
    if (state.trailTimer <= 0) {
      particles.trail(owl.state.x, owl.state.y);
      state.trailTimer = 0.09;
    }

    const o = owl.state;
    // Pick up letters.
    if (state.carried.length < LETTER.carryMax) {
      const got = letters.tryPickup(o.x, o.y);
      if (got) {
        state.carried.push(got);
        events |= EVENT_PICKUP;
        if (audio) audio.pickup();
      }
    }
    // Moths are a small bonus.
    if (letters.tryMoth(o.x, o.y)) {
      state.score += MOTH.points;
      events |= EVENT_MOTH;
      if (audio) audio.moth();
    }
    // Deliveries: a carried letter to an open mailbox of its colour.
    for (let i = state.carried.length - 1; i >= 0; i -= 1) {
      const letter = state.carried[i];
      const found = city.litMailboxNear(o.x, o.y, letter.color, MAILBOX.deliveryRadius);
      if (found) {
        found.mailbox.lit = false;
        state.carried.splice(i, 1);
        state.delivered += 1;
        state.combo = state.comboTimer > 0 ? Math.min(state.combo + 1, COMBO_MAX) : 1;
        state.comboTimer = COMBO_WINDOW;
        state.bestCombo = Math.max(state.bestCombo, state.combo);
        const express = letter.kind === 'express';
        state.score += (express ? LETTER.expressPoints : LETTER.normalPoints) * state.combo;
        state.night = Math.min(NIGHT_SECONDS, state.night + (express ? NIGHT_BONUS_EXPRESS : NIGHT_BONUS));
        particles.burst(found.x, found.y, 'deliver');
        events |= EVENT_DELIVER;
        if (audio) audio.deliver(state.combo);
        if (state.delivered >= GOAL) {
          if (demo) {
            // Attract mode never ends: the title owl keeps flying.
            state.delivered = GOAL - 1;
          } else {
            state.over = true;
            state.won = true;
            state.best = Math.max(state.best, state.score);
            if (audio) audio.win();
            return events | EVENT_WIN | EVENT_OVER;
          }
        }
      }
    }
    // Collisions: rooftops, chimneys, bats.
    if (o.invulnerable <= 0) {
      let hit = false;
      for (const b of city.buildings) {
        if (o.x + OWL.radius * 0.7 > b.x && o.x - OWL.radius * 0.7 < b.x + b.width && o.y + OWL.radius * 0.7 > b.top) {
          hit = true;
          break;
        }
        if (b.chimney) {
          const cx = b.x + b.chimneyX * b.width;
          if (o.x + OWL.radius * 0.6 > cx - 9 && o.x - OWL.radius * 0.6 < cx + 9 && o.y + OWL.radius * 0.6 > b.top - 30) {
            hit = true;
            break;
          }
        }
      }
      if (!hit) {
        for (const bat of hazards.bats) {
          if (Math.hypot(bat.x - o.x, bat.y - o.y) < OWL.radius * 0.75 + 18) {
            hit = true;
            break;
          }
        }
      }
      if (hit) {
        if (demo) {
          // Attract mode: a bump just rattles the owl, it never costs a life.
          owl.state.invulnerable = OWL.invulnerable;
          state.shake = 10;
          particles.burst(o.x, o.y, 'crash');
        } else {
          events |= crash();
        }
      }
    }
    // Dawn.
    if (!demo && !state.over && state.night <= 0) {
      state.night = 0;
      state.over = true;
      state.won = false;
      state.lostByDawn = true;
      state.best = Math.max(state.best, state.score);
      if (audio) audio.lose();
      events |= EVENT_OVER;
    }
    if (state.over) state.best = Math.max(state.best, state.score);
    return events;
  }

  return {
    state,
    owl,
    city,
    letters,
    hazards,
    particles,
    reset,
    step,
    scrollSpeed,
  };
}
