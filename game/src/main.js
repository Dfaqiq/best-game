// DUSK POST — boot and the one loop: input is read every frame, the world
// advances in fixed 1/60 s steps (several in a slow frame, none in a fast
// one), and the renderer paints what is there. The game moves between four
// screens: title, play, paused and game over (win or lose).
//
// ?seed=N fixes the night's pattern. ?shot=start|play|win|lose (with &seed=N)
// stages that scene instead of running the loop, paints it twice and sets
// window.__shotReady for a screenshot.

import { BEST_KEY, STEP } from './config.js';
import { createRandom } from './random.js';
import { createWorld, EVENT_OVER, EVENT_WIN } from './world.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { createRenderer, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';
import { stageShot, pilotInput } from './shots.js';

/** The longest frame the loop catches up on; a longer stall (a hidden tab) is dropped, not replayed. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const audio = createAudio();
const world = createWorld(createRandom(seed), audio);
const renderer = createRenderer(canvas);

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

function runShot(name) {
  const scene = stageShot(name, world);
  const best = Math.max(readBest(), scene.best);
  let painted = 0;
  function paint() {
    renderer.draw({ world, time: performance.now() / 1000 }, scene.screen, best);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();
  let statusText = 'Dusk Post: press Space or click to start.';

  function setStatus(text) {
    if (text !== statusText) {
      statusText = text;
      status.textContent = text;
    }
  }

  function startGame() {
    audio.unlock();
    world.reset();
    world.state.best = best;
    screen = SCREEN_PLAY;
    setStatus('Flying. Catch letters, deliver them to mailboxes of the same colour.');
  }

  function frame(now) {
    const elapsed = Math.min(MAX_FRAME, (now - last) / 1000);
    last = now;
    const time = now / 1000;
    accumulator += elapsed;

    if (screen === SCREEN_TITLE) {
      if (input.confirmPressed()) {
        startGame();
      } else {
        while (accumulator >= STEP) {
          world.step(STEP, pilotInput(world), true);
          accumulator -= STEP;
        }
        renderer.draw({ world, time }, SCREEN_TITLE, best);
        setStatus('Dusk Post: press Space or click to start.');
      }
    } else if (screen === SCREEN_PLAY) {
      if (input.pausePressed()) {
        screen = SCREEN_PAUSED;
        setStatus('Paused. Press P to keep flying.');
      } else {
        while (accumulator >= STEP) {
          const events = world.step(STEP, input);
          accumulator -= STEP;
          if (events & EVENT_OVER) {
            best = Math.max(best, world.state.score);
            saveBest(best);
            screen = world.state.won ? SCREEN_WIN : SCREEN_OVER;
            setStatus(
              world.state.won
                ? `Every letter home! Score ${world.state.score}. Press Space to fly again.`
                : `Game over. Score ${world.state.score}. Press Space to fly again.`,
            );
            break;
          }
        }
        renderer.draw({ world, time }, screen, best);
        setStatus(
          `Flying. ${world.state.delivered} of 12 letters delivered. Score ${world.state.score}.`,
        );
      }
    } else if (screen === SCREEN_PAUSED) {
      if (input.pausePressed() || input.confirmPressed()) {
        screen = SCREEN_PLAY;
        setStatus('Flying.');
      } else {
        renderer.draw({ world, time }, SCREEN_PAUSED, best);
      }
    } else if (input.confirmPressed()) {
      startGame();
    } else {
      renderer.draw({ world, time }, screen, best);
    }
    input.endFrame();
    requestAnimationFrame(frame);
  }

  world.reset();
  world.state.best = best;
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
