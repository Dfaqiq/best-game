// Every sound is synthesized with WebAudio: no audio files are shipped.
// The context starts on the first user gesture; until then the game is silent.

export function createAudio() {
  let context = null;
  let wind = null;
  let muted = false;

  function ensure() {
    if (context) return context;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      context = new AudioContext();
      // A quiet loop of filtered noise: the night wind.
      const length = context.sampleRate * 2;
      const buffer = context.createBuffer(1, length, context.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
      const source = context.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      const filter = context.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 320;
      const gain = context.createGain();
      gain.gain.value = 0.035;
      source.connect(filter).connect(gain).connect(context.destination);
      source.start();
      wind = { gain, filter };
    } catch {
      context = null;
    }
    return context;
  }

  function tone(freq, start, duration, type, volume, slideTo) {
    const ctx = ensure();
    if (!ctx || muted) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + start + duration);
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(volume || 0.12, ctx.currentTime + start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + duration);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + duration + 0.05);
    } catch {
      // Sound is garnish: a failure never stops the game.
    }
  }

  function thud() {
    const ctx = ensure();
    if (!ctx || muted) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(130, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(38, ctx.currentTime + 0.22);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch {
      // Sound is garnish.
    }
  }

  return {
    /** Call from any user gesture so the context is allowed to start. */
    unlock() {
      const ctx = ensure();
      if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
    },
    setMuted(value) {
      muted = value;
    },
    pickup() {
      tone(880, 0, 0.09, 'sine', 0.1, 1320);
    },
    deliver(combo) {
      const base = 523 * (1 + Math.min(combo, 5) * 0.06);
      tone(base, 0, 0.12, 'triangle', 0.12);
      tone(base * 1.25, 0.07, 0.12, 'triangle', 0.12);
      tone(base * 1.5, 0.14, 0.2, 'triangle', 0.12);
      tone(base * 2, 0.21, 0.28, 'sine', 0.1);
    },
    flap() {
      tone(300, 0, 0.12, 'sine', 0.05, 520);
    },
    crash() {
      thud();
      tone(220, 0, 0.18, 'sawtooth', 0.06, 90);
    },
    moth() {
      tone(1568, 0, 0.07, 'sine', 0.07);
    },
    win() {
      [523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, i * 0.11, 0.3, 'triangle', 0.11));
    },
    lose() {
      [392, 370, 349, 311].forEach((f, i) => tone(f, i * 0.16, 0.32, 'triangle', 0.1));
    },
    /** The wind rises slightly as dawn approaches. */
    setDawn(amount) {
      if (wind) {
        wind.gain.gain.value = 0.035 + amount * 0.03;
        wind.filter.frequency.value = 320 + amount * 420;
      }
    },
  };
}
