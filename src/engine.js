// 坐标以跑道为 y=0，向上为负；时间以秒计，不依赖浏览器帧率。
export const overlaps = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

export function playerBox(player) {
  return { x: 96, y: player.y - (player.ducking ? 37 : 78), w: 34, h: player.ducking ? 34 : 74 };
}

export class Runner {
  constructor({ random = Math.random, width = 1200 } = {}) {
    this.random = random;
    this.width = width;
    this.reset();
    this.state = 'ready';
  }

  reset() {
    this.entranceRemaining = 0;
    this.entranceElapsed = 0;
    this.time = 0;
    this.distance = 0;
    this.speed = 330;
    this.untilNext = 2.1;
    this.player = { y: 0, vy: 0, ducking: false, holding: false };
    this.obstacles = [];
  }

  start({ entrance = false } = {}) {
    this.reset(); this.entranceRemaining = entrance ? 3 : 0;
    this.state = entrance ? 'entering' : 'running';
  }
  resize(width) { this.width = Math.max(600, width); }
  pause() {
    if (this.state !== 'running' && this.state !== 'entering') return;
    this.state = 'paused';
    this.player.holding = false;
    this.player.ducking = false;
  }
  resume() { if (this.state === 'paused') this.state = this.entranceRemaining > 0 ? 'entering' : 'running'; }
  jump() {
    if (!['running', 'entering'].includes(this.state) || this.player.y < 0 || this.player.vy < 0 || this.player.ducking) return false;
    this.player.vy = -590;
    this.player.holding = true;
    return true;
  }
  releaseJump() {
    this.player.holding = false;
    if (this.player.vy < -470) this.player.vy = -470;
  }
  duck(active) {
    if (!['running', 'entering'].includes(this.state)) return;
    this.player.ducking = active;
    if (active && this.player.y < 0) {
      this.player.holding = false;
      this.player.vy = Math.max(300, this.player.vy);
    }
  }

  spawn() {
    const roll = this.random();
    const kind = this.time > 8 && roll > 0.68 ? 'gull' : roll > 0.36 ? 'log' : 'rock';
    const shape = kind === 'gull' ? { y: -78, w: 48, h: 22 } : kind === 'log' ? { y: -35, w: 66, h: 35 } : { y: -49, w: 43, h: 49 };
    this.obstacles.push({ kind, x: this.width + 50, ...shape });
    // 30～90 秒逐渐收紧；后期最短 1.15 秒，仍保留完整跳跃及下一次动作的准备时间。
    const pressure = Math.max(0, Math.min(1, (this.time - 30) / 60));
    this.untilNext = 1.4 - pressure * 0.25 + this.random() * (0.65 - pressure * 0.1);
  }

  update(delta) {
    if (this.state === 'entering' && Number.isFinite(delta) && delta > 0) {
      let remaining = Math.min(delta, this.entranceRemaining, 0.05);
      while (remaining > 0) {
        const dt = Math.min(remaining, 1 / 120); remaining -= dt; this.updatePlayer(dt);
      }
      this.entranceRemaining = Math.max(0, this.entranceRemaining - delta);
      if (this.entranceRemaining < 1e-9) { this.entranceRemaining = 0; this.state = 'running'; }
      this.entranceElapsed = 3 - this.entranceRemaining;
      return;
    }
    if (this.state !== 'running' || !Number.isFinite(delta) || delta <= 0) return;
    let remaining = Math.min(delta, 0.05);
    while (remaining > 0 && this.state === 'running') {
      const dt = Math.min(remaining, 1 / 120);
      remaining -= dt;
      this.time += dt;
      this.speed = Math.min(640, 330 + this.time * 3.3);
      this.distance += this.speed * dt;
      this.updatePlayer(dt);
      this.untilNext -= dt;
      if (this.untilNext <= 0) this.spawn();
      for (const obstacle of this.obstacles) obstacle.x -= this.speed * dt;
      this.obstacles = this.obstacles.filter((o) => o.x + o.w > -30);
      if (this.obstacles.some((o) => overlaps(playerBox(this.player), o))) this.state = 'over';
    }
  }

  updatePlayer(dt) {
    const p = this.player;
    if (p.y < 0 || p.vy < 0) {
      p.vy += (p.holding && p.vy < 0 ? 1450 : 2050) * dt;
      p.y += p.vy * dt;
      if (p.y >= 0) { p.y = 0; p.vy = 0; p.holding = false; }
    }
  }

  get score() { return Math.floor(this.distance / 12); }
}
