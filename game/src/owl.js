// Pip, the barn owl courier: hovers with a slow wingbeat, steers toward the
// pointer or the arrow keys, and flaps for a quick upward burst. Drawing is
// flat vector art: cream body, brown wings, big amber eyes.

import { FIELD, OWL, PALETTE } from './config.js';

export function createOwl() {
  const owl = {
    x: OWL.x,
    y: 360,
    vx: 0,
    vy: 0,
    flapPhase: 0,
    flapBoost: 0,
    tilt: 0,
    invulnerable: 0,
    faceX: 1,
  };

  function step(dt, input) {
    const axis = input.axis();
    const pointer = input.pointer;
    let wantX = 0;
    let wantY = 0;
    if (pointer && pointer.x !== null) {
      const dx = pointer.x - owl.x;
      const dy = pointer.y - owl.y;
      wantX = Math.max(-560, Math.min(560, dx * 6));
      wantY = Math.max(-560, Math.min(560, dy * 6));
    }
    wantX += axis.x * OWL.keySpeed;
    wantY += axis.y * OWL.keySpeed;
    const k = 1 - Math.exp(-9 * dt);
    owl.vx += (wantX - owl.vx) * k;
    owl.vy += (wantY - owl.vy) * k;
    if (input.flapPressed()) {
      owl.vy = OWL.flapImpulse;
      owl.flapBoost = 1;
    }
    owl.x += owl.vx * dt;
    owl.y += owl.vy * dt;
    owl.x = Math.max(OWL.minX, Math.min(OWL.maxX, owl.x));
    owl.y = Math.max(OWL.minY, Math.min(OWL.maxY, owl.y));
    owl.flapPhase += dt * (7 + Math.abs(owl.vy) * 0.012 + owl.flapBoost * 10);
    owl.flapBoost = Math.max(0, owl.flapBoost - dt * 3);
    owl.tilt = Math.max(-0.32, Math.min(0.32, owl.vy * 0.00045));
    if (owl.vx > 30) owl.faceX = 1;
    else if (owl.vx < -30) owl.faceX = -1;
    if (owl.invulnerable > 0) owl.invulnerable -= dt;
  }

  function draw(ctx, time, carried) {
    const blink = owl.invulnerable > 0 && Math.floor(time * 14) % 2 === 0;
    ctx.save();
    ctx.translate(owl.x, owl.y);
    ctx.rotate(owl.tilt);
    ctx.scale(1.45, 1.45);
    if (blink) ctx.globalAlpha = 0.35;
    const wing = Math.sin(owl.flapPhase) * 0.9;
    // Far wing.
    ctx.fillStyle = PALETTE.owlWing;
    ctx.beginPath();
    ctx.ellipse(-6, -2 + wing * 6, 26, 10, -0.5 - wing * 0.25, 0, Math.PI * 2);
    ctx.fill();
    // Tail.
    ctx.fillStyle = PALETTE.owlBrown;
    ctx.beginPath();
    ctx.moveTo(-22, 8);
    ctx.lineTo(-38, 20);
    ctx.lineTo(-36, 26);
    ctx.lineTo(-20, 18);
    ctx.closePath();
    ctx.fill();
    // Body.
    ctx.fillStyle = PALETTE.owlCream;
    ctx.beginPath();
    ctx.ellipse(0, 0, 26, 30, 0, 0, Math.PI * 2);
    ctx.fill();
    // Belly speckles.
    ctx.fillStyle = 'rgba(107, 74, 47, 0.35)';
    for (const [sx, sy] of [[-8, 8], [6, 12], [0, 18], [-12, -2], [12, 2]]) {
      ctx.beginPath();
      ctx.arc(sx, sy, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
    // Ear tufts.
    ctx.fillStyle = PALETTE.owlBrown;
    ctx.beginPath();
    ctx.moveTo(-16, -24);
    ctx.lineTo(-22, -36);
    ctx.lineTo(-10, -27);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(16, -24);
    ctx.lineTo(22, -36);
    ctx.lineTo(10, -27);
    ctx.closePath();
    ctx.fill();
    // Eyes: big amber discs with pupils that look where the owl is going.
    for (const side of [-1, 1]) {
      ctx.fillStyle = PALETTE.owlEye;
      ctx.beginPath();
      ctx.arc(side * 11, -12, 8.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1a1420';
      ctx.beginPath();
      ctx.arc(side * 11 + owl.faceX * 2.5, -12, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(side * 11 + owl.faceX * 2.5 + 1.5, -14, 1.4, 0, Math.PI * 2);
      ctx.fill();
    }
    // Beak.
    ctx.fillStyle = PALETTE.owlBeak;
    ctx.beginPath();
    ctx.moveTo(-4, -4);
    ctx.lineTo(4, -4);
    ctx.lineTo(0, 3);
    ctx.closePath();
    ctx.fill();
    // Near wing.
    ctx.fillStyle = PALETTE.owlBrown;
    ctx.beginPath();
    ctx.ellipse(-2, 2 - wing * 7, 24, 11, -0.4 + wing * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(242, 230, 201, 0.5)';
    ctx.beginPath();
    ctx.ellipse(-2, 2 - wing * 7, 14, 5, -0.4 + wing * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Carried letters trail beneath the owl, fanned out.
    if (carried && carried.length) {
      for (let i = 0; i < carried.length; i += 1) {
        const lx = owl.x - 18 + i * 20;
        const ly = owl.y + 50 + Math.sin(time * 3 + i * 1.4) * 3;
        drawEnvelope(ctx, lx, ly, 15, 10, carried[i].color, 0.12 * i);
      }
    }
  }

  return { state: owl, step, draw };
}

export function envelopeColor(color) {
  return color === 'amber' ? PALETTE.windowAmber : color === 'green' ? PALETTE.windowGreen : PALETTE.windowViolet;
}

export function drawEnvelope(ctx, x, y, w, h, color, rot) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot || 0);
  ctx.fillStyle = PALETTE.envelope;
  ctx.fillRect(-w / 2, -h / 2, w, h);
  ctx.strokeStyle = 'rgba(60, 45, 30, 0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-w / 2, -h / 2);
  ctx.lineTo(0, 1);
  ctx.lineTo(w / 2, -h / 2);
  ctx.moveTo(-w / 2, h / 2);
  ctx.lineTo(0, 1);
  ctx.lineTo(w / 2, h / 2);
  ctx.stroke();
  ctx.fillStyle = envelopeColor(color);
  ctx.beginPath();
  ctx.arc(0, 1, 3.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
