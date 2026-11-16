// DUSK POST — every tuning number and colour in one place.
// The playfield is a fixed 1280x720 logical area; the renderer scales it to
// the window, so no rule below depends on the screen size.

export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

export const OWL = {
  x: 300,
  minX: 170,
  maxX: 560,
  minY: 96,
  maxY: 596,
  radius: 34,
  ease: 0.12,
  keySpeed: 460,
  flapImpulse: -330,
  gravity: 900,
  invulnerable: 1.6,
};

export const LIVES = 3;

/** Letters to deliver to win the night. */
export const GOAL = 12;

/** Seconds of night at the start; deliveries buy more night back. */
export const NIGHT_SECONDS = 150;
export const NIGHT_BONUS = 3;
export const NIGHT_BONUS_EXPRESS = 6;

/** Combo window: deliveries closer together than this keep the combo alive. */
export const COMBO_WINDOW = 6;
export const COMBO_MAX = 5;

export const SCROLL = { base: 165, perLevel: 28 };

export const LETTER = {
  radius: 20,
  pickupRadius: 52,
  carryMax: 3,
  normalPoints: 100,
  expressPoints: 250,
  expressLife: 10,
  interval: 1.5,
  intervalJitter: 0.9,
  intervalScale: 0.9,
  minInterval: 0.7,
  colors: ['amber', 'green', 'violet'],
};

export const MAILBOX = {
  deliveryRadius: 72,
  /** Seconds a mailbox stays open (glowing) before it closes. */
  litSeconds: 22,
};

export const BAT = {
  radius: 20,
  speed: 210,
  speedPerLevel: 22,
  interval: 3.4,
  intervalScale: 0.88,
  minInterval: 1.6,
  /** First level bats appear. */
  fromLevel: 2,
};

export const GUST = {
  width: 150,
  height: 190,
  push: 260,
  interval: 6.5,
  /** First level gusts appear. */
  fromLevel: 3,
};

export const MOTH = {
  radius: 12,
  points: 25,
  interval: 4.2,
};

/** Seconds of play per level step; speeds and spawn rates stop growing at max. */
export const LEVEL = { deliveriesPerLevel: 4, max: 4 };

export const PALETTE = {
  skyTop: '#10152c',
  skyMid: '#232a4d',
  skyLow: '#4a2c5a',
  dawnGlow: '#e8a04c',
  star: '#dfe6ff',
  moon: '#f2e6c9',
  farSkyline: '#1a2140',
  building: '#26304a',
  buildingDark: '#1d2740',
  roof: '#141b30',
  chimney: '#2e3a58',
  windowAmber: '#ffb347',
  windowGreen: '#8be08b',
  windowViolet: '#c39bff',
  windowDark: '#2a3350',
  owlCream: '#f2e6c9',
  owlBrown: '#6b4a2f',
  owlWing: '#54402c',
  owlEye: '#ffb347',
  owlBeak: '#e8a04c',
  envelope: '#f5f0e1',
  bat: '#241a2e',
  batWing: '#3d2b52',
  moth: '#ffe9a8',
  gust: 'rgba(190, 220, 255, 0.10)',
  panel: 'rgba(10, 14, 28, 0.55)',
  panelEdge: 'rgba(242, 234, 216, 0.25)',
  text: '#f2ead8',
  muted: '#9aa3c0',
  accent: '#ffb347',
  danger: '#ff6b5e',
  good: '#8be08b',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the best score is kept between visits (this browser only). */
export const BEST_KEY = 'dusk-post.best';
