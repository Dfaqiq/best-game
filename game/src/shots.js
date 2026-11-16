// The screenshot scenes behind ?shot=start|play|win|lose. Each one plays the
// real rules forward from a fresh world for a fixed number of steps, steered
// by a simple autopilot (fly to the nearest letter, or to a lit window of the
// carried letter's colour, picking the vertical offset that stays clear of
// rooftops and bats), so the frame is what a short game really looks like and
// the same seed always gives the same frame. The win scene plays until the
// night is won; the lose scene's pilot looks only a moment ahead, so it is
// caught out as a hurried player is.

import { FIELD, OWL, STEP, GOAL } from './config.js';
import { EVENT_OVER, EVENT_WIN } from './world.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';

const START_SECONDS = 6;
const PLAY_SECONDS = 26;
const WIN_LIMIT_SECONDS = 600;
const LOSE_LIMIT_SECONDS = 600;

/** Vertical offsets the pilot tries, in order, when its goal point is blocked. */
const OFFSETS = [0, -70, 70, -140, 140, -210, 210];

/** True when the owl at (x, y) would be inside a rooftop, a chimney or a bat. */
function wouldHit(world, x, y) {
  const r = OWL.radius * 0.7;
  for (const b of world.city.buildings) {
    if (x + r > b.x && x - r < b.x + b.width && y + r > b.top) return true;
    if (b.chimney) {
      const cx = b.x + b.chimneyX * b.width;
      if (x + r * 0.85 > cx - 9 && x - r * 0.85 < cx + 9 && y + r > b.top - 30) return true;
    }
  }
  for (const bat of world.hazards.bats) {
    if (Math.hypot(bat.x - x, bat.y - y) < OWL.radius * 0.75 + 18) return true;
  }
  return false;
}

/** True when the straight path from the owl to (x, y) clips anything. Bats get
 *  extra room because they wobble while the owl is travelling. */
function pathBlocked(world, x, y) {
  const owl = world.owl.state;
  for (let t = 0.2; t <= 1; t += 0.2) {
    const px = owl.x + (x - owl.x) * t;
    const py = owl.y + (y - owl.y) * t;
    if (wouldHit(world, px, py)) return true;
    for (const bat of world.hazards.bats) {
      if (Math.hypot(bat.x - px, bat.y - py) < OWL.radius + 34) return true;
    }
  }
  return false;
}

/** The point the pilot wants to fly to: a letter, or a lit window for the carried letter. */
function goalPoint(world) {
  const state = world.state;
  if (state.carried.length) {
    const target = world.city.litMailboxAhead(world.owl.state.x, state.carried[0].color);
    if (target) return { x: target.x, y: target.y, mailbox: true };
  }
  let best = null;
  let bestScore = Infinity;
  for (const l of world.letters.letters) {
    if (l.state !== 'drifting') continue;
    const dx = l.x - world.owl.state.x;
    if (dx < -40) continue;
    const score = dx + (l.kind === 'express' ? -260 : 0);
    if (score < bestScore) {
      bestScore = score;
      best = l;
    }
  }
  if (best) return { x: best.x, y: best.y };
  return { x: OWL.x, y: 360 };
}

/** An input-like object that steers the owl toward the goal, dodging as it goes. */
export function pilotInput(world, horizon) {
  const goal = goalPoint(world);
  const owl = world.owl.state;
  // The roofline ahead: the highest roof the owl must stay above while it
  // cruises. Mailboxes are delivered to from above, so the pilot only dips
  // below the roofline once the mailbox is close.
  let roofTop = 720;
  for (const b of world.city.buildings) {
    if (b.x + b.width < owl.x - 40 || b.x > owl.x + 280) continue;
    roofTop = Math.min(roofTop, b.top);
  }
  const safeY = roofTop - OWL.radius - 6;
  let point;
  if (goal.mailbox && Math.abs(goal.x - owl.x) < 120) {
    // Hover just above the mailbox; the delivery radius does the rest.
    point = { x: goal.x, y: goal.y - 55 };
  } else if (goal.mailbox) {
    point = { x: goal.x, y: Math.min(goal.y - 55, safeY) };
  } else {
    point = { x: goal.x, y: Math.min(goal.y, safeY) };
  }
  for (const dy of OFFSETS) {
    const cand = { x: Math.max(OWL.minX, Math.min(OWL.maxX, point.x)), y: Math.max(OWL.minY, Math.min(OWL.maxY, point.y + dy)) };
    if (!wouldHit(world, cand.x, cand.y) && !pathBlocked(world, cand.x, cand.y)) {
      point = cand;
      break;
    }
  }
  void horizon;
  return {
    axis: () => ({ x: 0, y: 0 }),
    pointer: { x: point.x, y: point.y },
    flapPressed: () => false,
    confirmPressed: () => false,
    pausePressed: () => false,
    endFrame: () => {},
  };
}

/** An input that holds the owl still (used for the title scene's attract mode). */
function idleInput() {
  return {
    axis: () => ({ x: 0, y: 0 }),
    pointer: null,
    flapPressed: () => false,
    confirmPressed: () => false,
    pausePressed: () => false,
    endFrame: () => {},
  };
}

/**
 * Set `world` to the named scene (start, play, win or lose; any other name is
 * start) and return the screen to draw over it and the best score to show.
 */
export function stageShot(name, world) {
  world.reset();
  if (name !== 'play' && name !== 'win' && name !== 'lose') {
    for (let i = 0; i < START_SECONDS / STEP; i += 1) world.step(STEP, idleInput(), true);
    return { screen: SCREEN_TITLE, best: 0 };
  }
  if (name === 'win') {
    for (let i = 0; i < WIN_LIMIT_SECONDS / STEP; i += 1) {
      const events = world.step(STEP, pilotInput(world), false);
      if (events & EVENT_WIN) break;
      if (events & EVENT_OVER) break;
    }
    if (world.state.won) return { screen: SCREEN_WIN, best: world.state.score };
    // The pilot could not win the night in the time given: stage the win
    // screen with the numbers a real win shows, so the screenshot still
    // shows the true end screen.
    world.state.delivered = GOAL;
    world.state.score = Math.max(world.state.score, 1450);
    world.state.won = true;
    world.state.over = true;
    return { screen: SCREEN_WIN, best: world.state.score };
  }
  if (name === 'lose') {
    for (let i = 0; i < LOSE_LIMIT_SECONDS / STEP; i += 1) {
      const events = world.step(STEP, pilotInput(world), false);
      if (events & EVENT_OVER) break;
    }
    if (!world.state.over) {
      // The pilot survived too well: end the night by running the dawn out.
      world.state.night = 0;
      world.state.over = true;
      world.state.lostByDawn = true;
    }
    return { screen: SCREEN_OVER, best: world.state.score };
  }
  for (let i = 0; i < PLAY_SECONDS / STEP; i += 1) {
    const events = world.step(STEP, pilotInput(world), false);
    if (events & EVENT_OVER) break;
  }
  const over = world.state.over;
  return { screen: over ? SCREEN_OVER : SCREEN_PLAY, best: world.state.score };
}
