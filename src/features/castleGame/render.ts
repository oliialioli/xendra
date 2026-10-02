import { snailParts, toCssColor, type SnailPart } from '../../game/utils/snailArt';
import { BOSS, CRYSTAL, ENEMY, PLAYER, SCORE } from './config';
import { NOTE_SIZE, type Boss, type Enemy, type GameEvent, type GameState } from './engine';
import { ARENA, CHECKPOINTS, DOOR, GROUND_Y, LEVEL_HEIGHT, LEVEL_WIDTH, SOLIDS, type Rect } from './level';

/**
 * The castle in the map's own language: pale cream stone blocks with moss,
 * sage hills, a warm sky, and the map's snail drawn from the very same
 * parts as the map sprite (snailArt.ts), seen side-on. Everything is drawn
 * in code -- no image files -- so each piece can be swapped for artwork
 * later without touching the game logic.
 */
const PAL = {
  skyTop: '#e7e7d6',
  skyBottom: '#f4eedb',
  sun: '#f2db9d',
  hillFar: '#d3d7bd',
  hillNear: '#bfc8a4',
  ruinFar: '#e2dccb',
  ruinShade: '#d2cab4',
  stone: '#ebe4d2',
  stoneTop: '#f7f2e4',
  stoneShade: '#cbc1a6',
  stoneSeam: '#d8cfb8',
  moss: '#b9c49c',
  mossDark: '#8fa07d',
  abyssTop: '#c8bfa6',
  abyssBottom: '#6f6857',
  ink: '#2e3529',
  coral: '#c97b5c',
  accent: '#f2db9d',
  wood: '#8a6a48',
  woodDark: '#6b5037',
  iron: '#5f5a4f',
  salt: '#eef4f6',
  saltEdge: '#8fa3ac',
  saltFacet: '#c9d8df',
  mite: '#5f7480',
  miteLight: '#7f95a1',
  boss: '#7d8f99',
  bossLight: '#a6b6be',
  bossDark: '#5d6f79',
  white: '#fbf8ef',
} as const;

/** The level is never shown narrower than this, so you can always see what's coming. */
const MIN_VIEW_WIDTH = 440;

/** CSS px kept clear under the level for the touch buttons, when the screen has room to spare (portrait phones). */
const TOUCH_ZONE = 104;

export type View = {
  /** Level units -> CSS px. */
  scale: number;
  width: number;
  height: number;
  /** How far down the level starts: extra sky above it when the screen is taller than the level. */
  offsetY: number;
};

export function computeView(cssWidth: number, cssHeight: number): View {
  const scale = Math.min(cssHeight / LEVEL_HEIGHT, cssWidth / MIN_VIEW_WIDTH);
  const width = cssWidth / scale;
  const height = cssHeight / scale;
  const extra = height - LEVEL_HEIGHT;
  // Spare height goes under the level first (up to the touch buttons' zone), then above it as sky.
  const below = Math.min(extra, TOUCH_ZONE / scale);
  return { scale, width, height, offsetY: extra - below };
}

/** A stable pseudo-random number in [0, 1) for decoration `i`, so the ruins look the same every time. */
function rand(i: number): number {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  kind: 'spark' | 'dust' | 'shard' | 'text';
  text?: string;
  color: string;
  size: number;
};

/** Little reactions to what happened: sparkles, dust, shards and floating points. */
export class Effects {
  private particles: Particle[] = [];

  handle(events: GameEvent[], state: GameState): void {
    for (const e of events) {
      if (e.type === 'note') {
        this.burst(e.x, e.y, 'spark', PAL.accent, 8, 120);
        this.text(e.x, e.y - 10, `+${SCORE.note}`);
      } else if (e.type === 'stomp') {
        this.burst(e.x, e.y + ENEMY.height, 'dust', PAL.stoneShade, 8, 90);
        this.text(e.x, e.y - 14, `+${SCORE.enemy}`);
      } else if (e.type === 'crystalShatter') {
        this.burst(e.x, e.y, 'shard', PAL.salt, 7, 160);
      } else if (e.type === 'bossHit') {
        const b = state.boss;
        this.burst(b.x + BOSS.width / 2, b.y + 10, 'shard', PAL.salt, 12, 220);
      } else if (e.type === 'bossDefeated') {
        const b = state.boss;
        this.burst(b.x + BOSS.width / 2, b.y + BOSS.height / 2, 'shard', PAL.salt, 26, 300);
        this.text(b.x + BOSS.width / 2, b.y - 10, `+${SCORE.boss}`);
      } else if (e.type === 'victory') {
        this.burst(DOOR.x + DOOR.w / 2, DOOR.y + 30, 'spark', PAL.accent, 24, 200);
        this.text(DOOR.x + DOOR.w / 2, DOOR.y - 16, `+${SCORE.door}`);
      } else if (e.type === 'jump') {
        const p = state.player;
        this.burst(p.x + PLAYER.width / 2, p.y + PLAYER.height, 'dust', PAL.stoneShade, 3, 50);
      }
    }
  }

  clear(): void {
    this.particles = [];
  }

  update(dt: number): void {
    this.particles = this.particles.filter((p) => {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.kind === 'shard') p.vy += 900 * dt;
      if (p.kind === 'text') p.vy *= 0.96;
      return p.life > 0;
    });
  }

  draw(ctx: CanvasRenderingContext2D): void {
    for (const p of this.particles) {
      const t = p.life / p.maxLife;
      ctx.globalAlpha = Math.min(1, t * 1.6);
      if (p.kind === 'text') {
        ctx.fillStyle = PAL.ink;
        ctx.font = '700 15px "Instrument Sans", system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(p.text ?? '', p.x, p.y);
      } else if (p.kind === 'shard') {
        ctx.fillStyle = p.color;
        ctx.strokeStyle = PAL.saltEdge;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y - p.size);
        ctx.lineTo(p.x + p.size * 0.6, p.y);
        ctx.lineTo(p.x, p.y + p.size);
        ctx.lineTo(p.x - p.size * 0.6, p.y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (p.kind === 'dust' ? 1.6 - t * 0.6 : t), 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  private burst(x: number, y: number, kind: Particle['kind'], color: string, count: number, speed: number): void {
    for (let i = 0; i < count; i += 1) {
      const angle = kind === 'dust' ? Math.PI + (Math.random() * Math.PI) : Math.random() * Math.PI * 2;
      const v = speed * (0.4 + Math.random() * 0.6);
      const life = 0.45 + Math.random() * 0.35;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * v,
        vy: Math.sin(angle) * v * (kind === 'dust' ? 0.3 : 1) - (kind === 'spark' ? 40 : 0),
        life,
        maxLife: life,
        kind,
        color,
        size: kind === 'shard' ? 4 + Math.random() * 3 : 2 + Math.random() * 2.5,
      });
    }
  }

  private text(x: number, y: number, text: string): void {
    this.particles.push({ x, y, vx: 0, vy: -60, life: 0.9, maxLife: 0.9, kind: 'text', text, color: PAL.ink, size: 0 });
  }
}

/** Follows the snail with a little lag, a bit ahead of it, never past the level's ends. */
export class Camera {
  x = 0;

  follow(state: GameState, view: View, dt: number, snap = false): void {
    const p = state.player;
    const lead = p.facing * 60;
    const target = p.x + PLAYER.width / 2 + lead - view.width * 0.45;
    const max = Math.max(0, LEVEL_WIDTH - view.width);
    const clamped = Math.min(Math.max(target, 0), max);
    this.x = snap ? clamped : this.x + (clamped - this.x) * Math.min(1, dt * 6);
    this.x = Math.min(Math.max(this.x, 0), max);
    if (view.width > LEVEL_WIDTH) this.x = (LEVEL_WIDTH - view.width) / 2;
  }
}

// ---------------------------------------------------------------- scenery

function drawSky(ctx: CanvasRenderingContext2D, view: View, camX: number): void {
  const top = -view.offsetY;
  const sky = ctx.createLinearGradient(0, top, 0, LEVEL_HEIGHT);
  sky.addColorStop(0, PAL.skyTop);
  sky.addColorStop(1, PAL.skyBottom);
  ctx.fillStyle = sky;
  ctx.fillRect(camX, top, view.width, view.height);

  // A low warm sun, barely moving.
  const sunX = camX + view.width * 0.72 - camX * 0.04;
  const glow = ctx.createRadialGradient(sunX, 120, 10, sunX, 120, 160);
  glow.addColorStop(0, 'rgba(242, 219, 157, 0.9)');
  glow.addColorStop(0.35, 'rgba(242, 219, 157, 0.35)');
  glow.addColorStop(1, 'rgba(242, 219, 157, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(sunX - 170, -50, 340, 340);
  ctx.fillStyle = PAL.sun;
  ctx.beginPath();
  ctx.arc(sunX, 120, 34, 0, Math.PI * 2);
  ctx.fill();
}

function drawHills(ctx: CanvasRenderingContext2D, view: View, camX: number, parallax: number, base: number, amp: number, color: string, seed: number): void {
  const offset = camX * parallax;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(camX, LEVEL_HEIGHT);
  for (let sx = 0; sx <= view.width + 20; sx += 20) {
    const wx = sx + offset;
    const y = base - amp * (0.55 * Math.sin(wx / 210 + seed) + 0.3 * Math.sin(wx / 97 + seed * 2) + 0.15 * Math.sin(wx / 41));
    ctx.lineTo(camX + sx, y);
  }
  ctx.lineTo(camX + view.width + 20, LEVEL_HEIGHT);
  ctx.closePath();
  ctx.fill();
}

/** Broken walls and towers in the distance, moving slower than the level. */
function drawFarRuins(ctx: CanvasRenderingContext2D, view: View, camX: number): void {
  const parallax = 0.45;
  const spacing = 330;
  const first = Math.floor((camX * parallax) / spacing) - 1;
  const count = Math.ceil(view.width / spacing) + 3;
  for (let i = first; i < first + count; i += 1) {
    const wx = i * spacing + rand(i) * 120;
    const x = camX + wx - camX * parallax;
    const h = 110 + rand(i + 7) * 120;
    const w = 70 + rand(i + 3) * 90;
    const baseY = GROUND_Y - 30;
    ctx.fillStyle = PAL.ruinFar;
    ctx.fillRect(x, baseY - h, w, h + 30);
    // Crenellations and a broken top.
    for (let c = 0; c < w; c += 18) {
      if (rand(i * 31 + c) > 0.45) ctx.fillRect(x + c, baseY - h - 12, 10, 12);
    }
    ctx.fillStyle = PAL.ruinShade;
    ctx.fillRect(x + w - 10, baseY - h, 10, h + 30);
    // An arched window or two.
    ctx.fillStyle = PAL.skyBottom;
    for (let k = 0; k < 2; k += 1) {
      if (rand(i * 13 + k) < 0.35) continue;
      const wxw = x + 14 + k * (w / 2 - 6);
      const wy = baseY - h + 26 + rand(i + k) * 30;
      ctx.beginPath();
      ctx.moveTo(wxw, wy + 30);
      ctx.lineTo(wxw, wy + 8);
      ctx.arc(wxw + 8, wy + 8, 8, Math.PI, 0);
      ctx.lineTo(wxw + 16, wy + 30);
      ctx.closePath();
      ctx.fill();
    }
  }
}

/** The darkness under the floor, seen through the gaps -- and filling any room left below the level. */
function drawAbyss(ctx: CanvasRenderingContext2D, view: View, camX: number): void {
  const g = ctx.createLinearGradient(0, GROUND_Y, 0, LEVEL_HEIGHT);
  g.addColorStop(0, PAL.abyssTop);
  g.addColorStop(1, PAL.abyssBottom);
  ctx.fillStyle = g;
  ctx.fillRect(camX, GROUND_Y + 8, view.width, LEVEL_HEIGHT - GROUND_Y);
  const below = view.height - view.offsetY - LEVEL_HEIGHT;
  if (below > 0) {
    ctx.fillStyle = PAL.abyssBottom;
    ctx.fillRect(camX, LEVEL_HEIGHT - 1, view.width, below + 2);
  }
}

function drawStone(ctx: CanvasRenderingContext2D, r: Rect, seed: number): void {
  ctx.fillStyle = PAL.stone;
  ctx.fillRect(r.x, r.y, r.w, r.h);

  // Courses of blocks, every other row offset.
  ctx.save();
  ctx.beginPath();
  ctx.rect(r.x, r.y, r.w, r.h);
  ctx.clip();
  ctx.strokeStyle = PAL.stoneSeam;
  ctx.lineWidth = 1.5;
  const rowH = 26;
  for (let y = r.y + rowH; y < r.y + r.h; y += rowH) {
    ctx.beginPath();
    ctx.moveTo(r.x, y);
    ctx.lineTo(r.x + r.w, y);
    ctx.stroke();
  }
  for (let row = 0, y = r.y; y < r.y + r.h; row += 1, y += rowH) {
    const offset = row % 2 === 0 ? 0 : 30;
    for (let x = r.x + offset + 60; x < r.x + r.w; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, y + 2);
      ctx.lineTo(x, Math.min(y + rowH, r.y + r.h));
      ctx.stroke();
    }
  }
  // Soft shade at the bottom of each block face, and a few greener stones like the map's castle.
  for (let i = 0; i < r.w / 70; i += 1) {
    if (rand(seed * 17 + i) < 0.55) continue;
    ctx.fillStyle = 'rgba(185, 196, 156, 0.45)';
    ctx.fillRect(r.x + rand(seed + i) * (r.w - 30), r.y + 8 + rand(seed * 3 + i) * Math.max(0, r.h - 30), 28, 16);
  }
  ctx.restore();

  ctx.fillStyle = PAL.stoneShade;
  ctx.fillRect(r.x, r.y + r.h - 5, r.w, 5);
  ctx.fillRect(r.x + r.w - 4, r.y, 4, r.h);
  ctx.fillStyle = PAL.stoneTop;
  ctx.fillRect(r.x, r.y, r.w, 5);

  // Moss along the top edge.
  for (let x = r.x + 6; x < r.x + r.w - 6; x += 9) {
    const n = rand(seed * 101 + x);
    if (n < 0.35) continue;
    ctx.fillStyle = n > 0.8 ? PAL.mossDark : PAL.moss;
    ctx.beginPath();
    ctx.ellipse(x, r.y + 1, 6 + n * 4, 3 + n * 2, 0, Math.PI, 0);
    ctx.fill();
  }
  // Tufts of grass here and there.
  ctx.strokeStyle = PAL.mossDark;
  ctx.lineWidth = 1.6;
  for (let x = r.x + 20; x < r.x + r.w - 10; x += 47) {
    if (rand(seed * 7 + x) < 0.5) continue;
    for (let b = -1; b <= 1; b += 1) {
      ctx.beginPath();
      ctx.moveTo(x + b * 2, r.y);
      ctx.quadraticCurveTo(x + b * 3, r.y - 6, x + b * 5, r.y - 10 + Math.abs(b) * 3);
      ctx.stroke();
    }
  }
}

function drawCheckpoints(ctx: CanvasRenderingContext2D, state: GameState): void {
  CHECKPOINTS.forEach((cp, i) => {
    if (!cp.visible) return;
    const reached = state.checkpoint >= i;
    const x = cp.x + 10;
    ctx.fillStyle = PAL.woodDark;
    ctx.fillRect(x - 2, GROUND_Y - 96, 4, 96);
    ctx.fillStyle = PAL.wood;
    ctx.beginPath();
    ctx.arc(x, GROUND_Y - 98, 5, 0, Math.PI * 2);
    ctx.fill();
    // The banner, waving a little.
    const wave = Math.sin(state.time * 3) * 3;
    ctx.fillStyle = reached ? PAL.accent : '#d9d3c2';
    ctx.beginPath();
    ctx.moveTo(x + 2, GROUND_Y - 92);
    ctx.quadraticCurveTo(x + 22, GROUND_Y - 92 + wave, x + 44, GROUND_Y - 88);
    ctx.lineTo(x + 36, GROUND_Y - 74 + wave * 0.5);
    ctx.lineTo(x + 44, GROUND_Y - 60);
    ctx.quadraticCurveTo(x + 22, GROUND_Y - 62 + wave, x + 2, GROUND_Y - 60);
    ctx.closePath();
    ctx.fill();
    // A small spiral, the snail's shell, on the cloth.
    ctx.strokeStyle = reached ? PAL.coral : '#b7b09e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let t = 0; t < 1; t += 0.05) {
      const a = t * Math.PI * 3.5;
      const rr = 8 * (1 - t);
      const px = x + 20 + Math.cos(a) * rr;
      const py = GROUND_Y - 76 + Math.sin(a) * rr;
      if (t === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
  });
}

function drawGate(ctx: CanvasRenderingContext2D, state: GameState): void {
  const g = ARENA.gate;
  // Two stone posts either side, and a lintel.
  drawStone(ctx, { x: g.x - 20, y: g.y - 30, w: 18, h: g.h + 30 }, 91);
  drawStone(ctx, { x: g.x + g.w + 2, y: g.y - 30, w: 18, h: g.h + 30 }, 92);
  drawStone(ctx, { x: g.x - 24, y: g.y - 44, w: g.w + 48, h: 18 }, 93);

  const lift = state.gateOpen * (g.h - 10);
  ctx.save();
  ctx.beginPath();
  ctx.rect(g.x - 2, g.y - 26, g.w + 4, g.h + 26);
  ctx.clip();
  const top = g.y - lift;
  ctx.strokeStyle = PAL.iron;
  ctx.lineWidth = 3;
  for (let x = g.x + 3; x <= g.x + g.w - 2; x += 7.5) {
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x, top + g.h - 4);
    ctx.stroke();
    // Pointed ends.
    ctx.fillStyle = PAL.iron;
    ctx.beginPath();
    ctx.moveTo(x - 2.5, top + g.h - 6);
    ctx.lineTo(x, top + g.h + 2);
    ctx.lineTo(x + 2.5, top + g.h - 6);
    ctx.fill();
  }
  for (let y = top + 20; y < top + g.h - 10; y += 36) {
    ctx.beginPath();
    ctx.moveTo(g.x, y);
    ctx.lineTo(g.x + g.w, y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawDoor(ctx: CanvasRenderingContext2D, state: GameState): void {
  const d = DOOR;
  const active = state.boss.phase === 'defeated';
  const archR = d.w / 2;

  // Banners either side: the band's warm colours.
  [d.x - 46, d.x + d.w + 22].forEach((bx, i) => {
    ctx.fillStyle = i === 0 ? PAL.coral : PAL.accent;
    ctx.beginPath();
    ctx.moveTo(bx, d.y - 60);
    ctx.lineTo(bx + 24, d.y - 60);
    ctx.lineTo(bx + 24, d.y + 30);
    ctx.lineTo(bx + 12, d.y + 20);
    ctx.lineTo(bx, d.y + 30);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = PAL.woodDark;
    ctx.fillRect(bx - 4, d.y - 64, 32, 4);
  });

  // Stone frame.
  ctx.fillStyle = PAL.stoneShade;
  ctx.beginPath();
  ctx.moveTo(d.x - 14, d.y + d.h);
  ctx.lineTo(d.x - 14, d.y + archR);
  ctx.arc(d.x + archR, d.y + archR, archR + 14, Math.PI, 0);
  ctx.lineTo(d.x + d.w + 14, d.y + d.h);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = PAL.stone;
  ctx.beginPath();
  ctx.moveTo(d.x - 10, d.y + d.h);
  ctx.lineTo(d.x - 10, d.y + archR);
  ctx.arc(d.x + archR, d.y + archR, archR + 10, Math.PI, 0);
  ctx.lineTo(d.x + d.w + 10, d.y + d.h);
  ctx.closePath();
  ctx.fill();

  // The doorway: warm light inside once it opens.
  const doorway = () => {
    ctx.beginPath();
    ctx.moveTo(d.x, d.y + d.h);
    ctx.lineTo(d.x, d.y + archR);
    ctx.arc(d.x + archR, d.y + archR, archR, Math.PI, 0);
    ctx.lineTo(d.x + d.w, d.y + d.h);
    ctx.closePath();
  };
  doorway();
  if (active) {
    const pulse = 0.75 + Math.sin(state.time * 4) * 0.25;
    const light = ctx.createRadialGradient(d.x + archR, d.y + d.h * 0.6, 4, d.x + archR, d.y + d.h * 0.6, d.h);
    light.addColorStop(0, '#fff6d8');
    light.addColorStop(1, PAL.accent);
    ctx.fillStyle = light;
    ctx.fill();
    ctx.globalAlpha = 0.35 * pulse;
    ctx.fillStyle = PAL.accent;
    ctx.beginPath();
    ctx.arc(d.x + archR, d.y + d.h * 0.55, d.h * 0.9, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  } else {
    ctx.fillStyle = PAL.woodDark;
    ctx.fill();
  }

  // The wooden door: shut, or swung open to the side.
  ctx.save();
  doorway();
  ctx.clip();
  const doorW = active ? d.w * 0.22 : d.w;
  ctx.fillStyle = PAL.wood;
  ctx.fillRect(d.x, d.y, doorW, d.h);
  ctx.strokeStyle = PAL.woodDark;
  ctx.lineWidth = 2;
  for (let x = d.x + doorW / 4; x < d.x + doorW; x += doorW / 4) {
    ctx.beginPath();
    ctx.moveTo(x, d.y);
    ctx.lineTo(x, d.y + d.h);
    ctx.stroke();
  }
  if (!active) {
    ctx.fillStyle = PAL.iron;
    [0.3, 0.7].forEach((t) => ctx.fillRect(d.x, d.y + d.h * t, d.w, 5));
    ctx.beginPath();
    ctx.arc(d.x + d.w * 0.72, d.y + d.h * 0.55, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// ---------------------------------------------------------------- characters

function drawNote(ctx: CanvasRenderingContext2D, x: number, y: number, t: number, i: number): void {
  const bob = Math.sin(t * 3 + i) * 4;
  const cy = y + bob;
  ctx.fillStyle = 'rgba(242, 219, 157, 0.55)';
  ctx.beginPath();
  ctx.arc(x, cy, NOTE_SIZE * 0.62, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PAL.coral;
  ctx.strokeStyle = PAL.coral;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.ellipse(x - 3, cy + 6, 6, 4.4, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x + 2.6, cy + 5);
  ctx.lineTo(x + 2.6, cy - 11);
  ctx.quadraticCurveTo(x + 6, cy - 4, x + 10, cy - 3);
  ctx.stroke();
}

function drawMite(ctx: CanvasRenderingContext2D, e: Enemy, t: number): void {
  const cx = e.x + ENEMY.width / 2;
  const bottom = e.y + ENEMY.height;
  if (!e.alive) {
    if (e.squash <= 0) return;
    ctx.globalAlpha = Math.min(1, e.squash * 3);
    ctx.fillStyle = PAL.mite;
    ctx.beginPath();
    ctx.ellipse(cx, bottom - 3, ENEMY.width / 2 + 4, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    return;
  }
  const step = Math.sin(t * 14 + e.x * 0.1);
  // Little legs.
  ctx.strokeStyle = PAL.mite;
  ctx.lineWidth = 2;
  [-10, 0, 10].forEach((dx, i) => {
    const s = (i % 2 === 0 ? step : -step) * 2.5;
    ctx.beginPath();
    ctx.moveTo(cx + dx, bottom - 7);
    ctx.lineTo(cx + dx + s, bottom);
    ctx.stroke();
  });
  // Body, with salt crystals growing on its back.
  ctx.fillStyle = PAL.mite;
  ctx.beginPath();
  ctx.ellipse(cx, bottom - 11, ENEMY.width / 2, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PAL.miteLight;
  ctx.beginPath();
  ctx.ellipse(cx - 3, bottom - 15, ENEMY.width / 3, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  [[-7, 9], [1, 13], [8, 8]].forEach(([dx, h]) => {
    ctx.fillStyle = PAL.salt;
    ctx.strokeStyle = PAL.saltEdge;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx + dx - 3, bottom - 18);
    ctx.lineTo(cx + dx, bottom - 18 - h);
    ctx.lineTo(cx + dx + 3, bottom - 18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  });
  // Eyes, looking the way it walks.
  const ex = cx + e.dir * 9;
  ctx.fillStyle = PAL.white;
  ctx.beginPath();
  ctx.arc(ex - 3, bottom - 12, 3.4, 0, Math.PI * 2);
  ctx.arc(ex + 4, bottom - 12, 3.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PAL.ink;
  ctx.beginPath();
  ctx.arc(ex - 3 + e.dir * 1.2, bottom - 12, 1.6, 0, Math.PI * 2);
  ctx.arc(ex + 4 + e.dir * 1.2, bottom - 12, 1.6, 0, Math.PI * 2);
  ctx.fill();
}

function crystalPath(ctx: CanvasRenderingContext2D, x: number, baseY: number, w: number, h: number): void {
  ctx.beginPath();
  ctx.moveTo(x - w / 2, baseY);
  ctx.lineTo(x - w / 2, baseY - h * 0.75);
  ctx.lineTo(x, baseY - h);
  ctx.lineTo(x + w / 2, baseY - h * 0.75);
  ctx.lineTo(x + w / 2, baseY);
  ctx.closePath();
}

function drawBoss(ctx: CanvasRenderingContext2D, b: Boss, state: GameState): void {
  if (b.phase === 'waiting' && state.player.x < ARENA.triggerX - 700) return;
  const defeated = b.phase === 'defeated';
  if (defeated && b.timer <= 0) return;

  const t = state.time;
  const windup = b.phase === 'windup';
  const shake = windup ? Math.sin(t * 60) * 2 : 0;
  const walkBob = b.phase === 'walk' ? Math.abs(Math.sin(t * 8)) * 3 : 0;
  const sink = defeated ? (1 - b.timer / 1.2) * 40 : 0;
  const cx = b.x + BOSS.width / 2 + shake;
  const bottom = b.y + BOSS.height;
  const top = b.y - walkBob + sink;

  ctx.save();
  if (defeated) ctx.globalAlpha = Math.max(0, b.timer / 1.2);
  // Blinks white while it can't be hurt.
  const flash = b.invulnerable > 0 && Math.floor(b.invulnerable * 12) % 2 === 0;

  // Shadow.
  ctx.fillStyle = 'rgba(46, 53, 41, 0.18)';
  ctx.beginPath();
  ctx.ellipse(cx, bottom, BOSS.width * 0.55, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // Stubby feet.
  const stepPhase = b.phase === 'walk' ? Math.sin(t * 8) * 5 : 0;
  ctx.fillStyle = PAL.bossDark;
  ctx.beginPath();
  ctx.ellipse(cx - 28 + stepPhase, bottom - 6, 18, 9, 0, 0, Math.PI * 2);
  ctx.ellipse(cx + 28 - stepPhase, bottom - 6, 18, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  // The wind-up: its crystals light up before it throws.
  if (windup) {
    const k = 1 - b.timer / BOSS.telegraph;
    const glow = ctx.createRadialGradient(cx, top + 10, 4, cx, top + 10, 70 + k * 30);
    glow.addColorStop(0, `rgba(242, 219, 157, ${0.5 + k * 0.4})`);
    glow.addColorStop(1, 'rgba(242, 219, 157, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, top + 10, 100, 0, Math.PI * 2);
    ctx.fill();
  }

  // Salt crystals growing out of its back.
  const crystals: [number, number, number][] = [[-30, 16, 34], [-12, 20, 52], [8, 18, 44], [26, 14, 30], [-2, 12, 28]];
  crystals.forEach(([dx, w, h]) => {
    const lit = windup && Math.floor(t * 10) % 2 === 0;
    ctx.fillStyle = lit ? '#fff3cf' : PAL.salt;
    ctx.strokeStyle = PAL.saltEdge;
    ctx.lineWidth = 1.5;
    crystalPath(ctx, cx + dx, top + 26, w, h);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = PAL.saltFacet;
    ctx.beginPath();
    ctx.moveTo(cx + dx, top + 26);
    ctx.lineTo(cx + dx, top + 26 - h);
    ctx.lineTo(cx + dx + w / 2, top + 26 - h * 0.75);
    ctx.lineTo(cx + dx + w / 2, top + 26);
    ctx.closePath();
    ctx.fill();
  });

  // Body: a big rounded mound of stone and salt.
  ctx.fillStyle = flash ? PAL.white : PAL.boss;
  ctx.beginPath();
  ctx.ellipse(cx, top + 54, BOSS.width / 2, 46, 0, Math.PI, 0);
  ctx.lineTo(cx + BOSS.width / 2, bottom - 8);
  ctx.quadraticCurveTo(cx, bottom + 4, cx - BOSS.width / 2, bottom - 8);
  ctx.closePath();
  ctx.fill();
  if (!flash) {
    ctx.fillStyle = PAL.bossLight;
    ctx.beginPath();
    ctx.ellipse(cx + b.dir * 10, top + 66, 32, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    // Moss patches, like the castle's stones.
    ctx.fillStyle = PAL.moss;
    ctx.beginPath();
    ctx.ellipse(cx - 36, top + 34, 12, 6, -0.4, 0, Math.PI * 2);
    ctx.ellipse(cx + 40, top + 42, 9, 5, 0.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Face, looking at the snail.
  const look = Math.sign(state.player.x + PLAYER.width / 2 - cx) || b.dir;
  const fx = cx + look * 16;
  ctx.fillStyle = PAL.white;
  ctx.beginPath();
  ctx.ellipse(fx - 13, top + 50, 8, 9, 0, 0, Math.PI * 2);
  ctx.ellipse(fx + 13, top + 50, 8, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PAL.ink;
  ctx.beginPath();
  ctx.arc(fx - 13 + look * 3, top + 52, 3.6, 0, Math.PI * 2);
  ctx.arc(fx + 13 + look * 3, top + 52, 3.6, 0, Math.PI * 2);
  ctx.fill();
  // A heavy brow (frowning while it winds up) and a wide mouth.
  ctx.strokeStyle = PAL.bossDark;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  const frown = windup ? 5 : 0;
  ctx.beginPath();
  ctx.moveTo(fx - 22, top + 38 - frown);
  ctx.lineTo(fx - 5, top + 40 + frown);
  ctx.moveTo(fx + 5, top + 40 + frown);
  ctx.lineTo(fx + 22, top + 38 - frown);
  ctx.stroke();
  ctx.lineWidth = 3;
  ctx.beginPath();
  if (windup) ctx.ellipse(fx, top + 70, 8, 6, 0, 0, Math.PI * 2);
  else {
    ctx.moveTo(fx - 12, top + 70);
    ctx.quadraticCurveTo(fx, top + 74, fx + 12, top + 70);
  }
  ctx.stroke();
  ctx.lineCap = 'butt';
  ctx.restore();
}

function drawCrystal(ctx: CanvasRenderingContext2D, x: number, y: number, spin: number): void {
  const s = CRYSTAL.size;
  ctx.save();
  ctx.translate(x + s / 2, y + s / 2);
  ctx.rotate(spin);
  ctx.fillStyle = 'rgba(242, 219, 157, 0.45)';
  ctx.beginPath();
  ctx.arc(0, 0, s * 0.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PAL.salt;
  ctx.strokeStyle = PAL.saltEdge;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.6);
  ctx.lineTo(s * 0.4, 0);
  ctx.lineTo(0, s * 0.6);
  ctx.lineTo(-s * 0.4, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

const SNAIL_RIGHT = snailParts('right');
/** Frame point that sits on the ground: under the middle of the foot. */
const SNAIL_FOOT = { x: 33, y: 50 };
const SNAIL_SCALE = 0.95;

function drawSnailParts(ctx: CanvasRenderingContext2D, parts: SnailPart[], t: number, airborne: boolean): void {
  for (const part of parts) {
    if (airborne && part.alpha !== undefined && part.alpha < 0.3 && part.kind === 'ellipse') continue; // no ground shadow mid-air
    const sway = part.layer === 'feelers' ? Math.sin(t * 5) * 0.8 : 0;
    ctx.globalAlpha = part.alpha ?? 1;
    if (part.kind === 'ellipse') {
      ctx.fillStyle = toCssColor(part.fill);
      ctx.beginPath();
      ctx.ellipse(part.cx + sway, part.cy, part.rx, part.ry, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.strokeStyle = toCssColor(part.stroke);
      ctx.lineWidth = part.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      part.points.forEach(([px, py], i) => (i === 0 ? ctx.moveTo(px + sway, py) : ctx.lineTo(px + sway, py)));
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
}

/** The map's snail, side-on: squashes and stretches with jumps, blinks while it can't be hurt. */
export function drawSnail(ctx: CanvasRenderingContext2D, x: number, footY: number, facing: 1 | -1, vy: number, airborne: boolean, t: number): void {
  const stretch = airborne ? Math.max(-0.12, Math.min(0.12, -vy / 4000)) : 0;
  ctx.save();
  ctx.translate(x, footY);
  ctx.scale(facing * SNAIL_SCALE * (1 - stretch), SNAIL_SCALE * (1 + stretch));
  ctx.translate(-SNAIL_FOOT.x, -SNAIL_FOOT.y);
  drawSnailParts(ctx, SNAIL_RIGHT, t, airborne);
  ctx.restore();
}

// ---------------------------------------------------------------- frame

/** Draws one frame. `ctx` must already be scaled for the device pixel ratio. */
export function drawFrame(ctx: CanvasRenderingContext2D, state: GameState, view: View, camera: Camera, effects: Effects): void {
  const camX = camera.x;
  ctx.save();
  ctx.scale(view.scale, view.scale);
  ctx.translate(-camX, view.offsetY);

  drawSky(ctx, view, camX);
  drawHills(ctx, view, camX, 0.15, GROUND_Y - 150, 40, PAL.hillFar, 1.3);
  drawFarRuins(ctx, view, camX);
  drawHills(ctx, view, camX, 0.3, GROUND_Y - 60, 30, PAL.hillNear, 4.1);
  drawAbyss(ctx, view, camX);

  const left = camX - 40;
  const right = camX + view.width + 40;
  SOLIDS.forEach((s, i) => {
    if (s.x + s.w < left || s.x > right) return;
    drawStone(ctx, s, i + 1);
  });

  drawCheckpoints(ctx, state);
  drawDoor(ctx, state);
  drawGate(ctx, state);

  state.notes.forEach((n, i) => {
    if (!n.taken && n.x > left && n.x < right) drawNote(ctx, n.x, n.y, state.time, i);
  });
  state.enemies.forEach((e) => {
    if (e.x + ENEMY.width > left && e.x < right) drawMite(ctx, e, state.time);
  });
  drawBoss(ctx, state.boss, state);
  state.crystals.forEach((c) => drawCrystal(ctx, c.x, c.y, c.spin));

  const p = state.player;
  const blinking = p.invulnerable > 0 && Math.floor(p.invulnerable * 10) % 2 === 0;
  if (!blinking && state.status !== 'gameOver') {
    drawSnail(ctx, p.x + PLAYER.width / 2, p.y + PLAYER.height, p.facing, p.vy, !p.onGround, state.time);
  }

  effects.draw(ctx);
  ctx.restore();
}
