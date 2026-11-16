// Keyboard and mouse input: the owl steers toward the pointer, arrow keys or
// WASD push it, and Space or a click flaps (a quick upward burst). Enter,
// Space or a click also confirms on the title and end screens; P pauses.

export const ACTION_CONFIRM = 'confirm';
export const ACTION_PAUSE = 'pause';
export const ACTION_FLAP = 'flap';

export function createInput(canvas) {
  const keys = new Set();
  const pointer = { x: null, y: null, down: false };
  const pressed = new Set();
  let pointerSeen = false;

  function keyName(event) {
    return event.key.length === 1 ? event.key.toLowerCase() : event.key;
  }

  function onKeyDown(event) {
    const name = keyName(event);
    if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
      event.preventDefault();
    }
    if (!event.repeat) {
      keys.add(name);
      pressed.add(name);
    }
  }

  function onKeyUp(event) {
    keys.delete(keyName(event));
  }

  function onPointer(event) {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 1280;
    pointer.y = ((event.clientY - rect.top) / rect.height) * 720;
    pointerSeen = true;
  }

  function onPointerDown(event) {
    onPointer(event);
    pointer.down = true;
    pressed.add('click');
  }

  function onPointerUp() {
    pointer.down = false;
  }

  function onBlur() {
    keys.clear();
    pointer.down = false;
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', onBlur);
  canvas.addEventListener('pointermove', onPointer);
  canvas.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointerup', onPointerUp);

  return {
    /** -1, 0 or 1 on each axis from the held keys. */
    axis() {
      let x = 0;
      let y = 0;
      if (keys.has('arrowleft') || keys.has('a')) x -= 1;
      if (keys.has('arrowright') || keys.has('d')) x += 1;
      if (keys.has('arrowup') || keys.has('w')) y -= 1;
      if (keys.has('arrowdown') || keys.has('s')) y += 1;
      return { x, y };
    },
    /** The pointer's position in logical coordinates, or null before it moves. */
    pointer: pointerSeen ? pointer : null,
    pointerDown: pointer.down,
    /** True once for each fresh press of Space, Enter or a click; consumed on read. */
    confirmPressed() {
      const hit = pressed.has(' ') || pressed.has('enter') || pressed.has('click');
      pressed.delete(' ');
      pressed.delete('enter');
      pressed.delete('click');
      return hit;
    },
    flapPressed() {
      const hit = pressed.has(' ') || pressed.has('click');
      pressed.delete(' ');
      pressed.delete('click');
      return hit;
    },
    pausePressed() {
      const hit = pressed.has('p') || pressed.has('escape');
      pressed.delete('p');
      pressed.delete('escape');
      return hit;
    },
    /** True while Space is held (for holding to climb). */
    flapHeld() {
      return keys.has(' ');
    },
    /** Forget one-frame presses; call at the end of each frame. */
    endFrame() {
      pressed.clear();
    },
  };
}
