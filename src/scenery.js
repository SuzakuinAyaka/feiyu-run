const fraction = (value) => { const n = Math.sin(value * 127.1 + 311.7) * 43758.5453; return n - Math.floor(n); };

export function sceneryLayout(width, height, ground, distance = 0, reduced = false, seed = 0) {
  const sand = height - ground;
  const beachItems = sand > 80 ? Array.from({ length: Math.min(18, Math.ceil(width / 100)) }, (_, i) => {
    const random = (salt) => fraction(seed + i * 17 + salt);
    const radius = 6 + random(3) * 4;
    return {
      kind: (i + Math.floor(random(5) * 2)) % 2 ? 'starfish' : 'shell',
      x: random(7) * width,
      y: ground + 48 + radius + random(11) * Math.max(0, sand - 64 - radius * 2),
      radius, tilt: random(31) * Math.PI * 2, opacity: 0.12 + random(23) * 0.05,
    };
  }) : [];
  // 固定世界位置，相隔 1250 单位；只用行进距离投影，不在视口内循环瞬移。
  const offset = reduced ? 0 : distance * 0.18;
  const palms = [];
  const first = Math.ceil((offset - 180 - 580) / 1250);
  const last = Math.floor((offset + width + 180 - 580) / 1250);
  for (let id = first; id <= last; id++) {
    const worldX = 580 + id * 1250;
    palms.push({ id, worldX, x: worldX - offset, y: ground + 2, h: Math.min(110, ground * 0.22) * (0.9 + fraction(id + 43) * 0.15) });
  }
  return { seaTop: ground - 195, quietTop: ground - 120, sandTop: ground + 48, height, beachItems, palms };
}

export function seaVisitor(time, width, ground, reduced = false) {
  if (reduced || time < 18) return null;
  // 保留原有海豚和虎鲸时刻，每轮再加一次虎鲸，不叠加动物或提高运动速度。
  const cycleTime = (time - 18) % 68;
  const start = cycleTime >= 56 ? 56 : cycleTime >= 34 ? 34 : 0;
  const elapsed = cycleTime - start;
  const kind = start === 0 ? 'dolphin' : 'orca';
  const duration = kind === 'orca' ? 7 : 6;
  if (elapsed >= duration) return null;
  const phase = elapsed / duration;
  return {
    kind, phase,
    x: Math.max(290, width * 0.54) + Math.min(120, width * 0.1) * phase,
    y: ground - 160 - Math.sin(phase * Math.PI) * 18,
    angle: (phase - 0.5) * 0.55,
    opacity: Math.min(1, phase * 7, (1 - phase) * 7) * 0.19,
  };
}

export function orcaSplashes(time, width, ground, reduced = false) {
  if (reduced || time < 18) return [];
  const cycleTime = (time - 18) % 68;
  const drift = Math.min(120, width * 0.1);
  const splashes = [];
  for (const start of [34, 56]) {
    for (const kind of ['launch', 'landing']) {
      const landing = kind === 'landing';
      const elapsed = cycleTime - start - (landing ? 6.55 : 0);
      const duration = landing ? 1.5 : 1.3;
      if (elapsed < 0 || elapsed >= duration) continue;
      const phase = elapsed / duration;
      // 水花锚定出入水点，不跟着空中的虎鲸移动；余波独立于动物的显示时长。
      const x = Math.max(290, width * 0.54) + (landing ? drift : 0), y = ground - 156;
      const drops = Array.from({ length: landing ? 8 : 6 }, (_, i) => ({
        x: x + (i % 2 ? 1 : -1) * (3 + (12 + Math.floor(i / 2) * 4) * phase),
        y: y - Math.sin(phase * Math.PI) * (9 + i % 3 * 4) + phase * 2,
        radius: 1 + i % 2 * 0.4,
      }));
      const lift = Math.sin(phase * Math.PI);
      const wave = { width: 14 + phase * (landing ? 34 : 26), height: Math.pow(lift, 0.7) * (landing ? 24 : 18), opacity: lift * 0.4 };
      splashes.push({ kind, x, y, radius: 8 + phase * (landing ? 25 : 18), opacity: lift * 0.32, drops, wave });
    }
  }
  return splashes;
}

function drawOrcaSplashes(c, splashes) {
  c.save(); c.lineWidth = 1.2; c.lineCap = 'round';
  for (const splash of splashes) {
    const { width: w, height: h, opacity } = splash.wave;
    // 双侧卷起的半透明浪体和白色浪尖，随冲击向外展开、回落。
    for (const direction of [-1, 1]) {
      c.save(); c.translate(splash.x, splash.y); c.scale(direction, 1);
      c.globalAlpha = opacity; c.fillStyle = '#78afc5';
      c.beginPath(); c.moveTo(0, 1);
      c.bezierCurveTo(w * 0.22, -h * 0.2, w * 0.35, -h, w * 0.72, -h);
      c.quadraticCurveTo(w * 1.08, -h * 0.95, w * 0.94, -h * 0.55);
      c.quadraticCurveTo(w * 0.72, -h * 0.82, w * 0.63, -h * 0.48);
      c.quadraticCurveTo(w * 0.72, -h * 0.1, w, 1); c.closePath(); c.fill();
      c.strokeStyle = '#f5ffff'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(w * 0.35, -h * 0.72);
      c.quadraticCurveTo(w * 0.5, -h, w * 0.72, -h);
      c.quadraticCurveTo(w * 1.08, -h * 0.95, w * 0.94, -h * 0.55); c.stroke();
      c.restore();
    }
    c.lineWidth = 1.2;
    c.globalAlpha = splash.opacity; c.strokeStyle = '#729eaf'; c.fillStyle = '#f5ffff';
    c.beginPath(); c.ellipse(splash.x, splash.y, splash.radius, 2.5, 0, 0, Math.PI * 2); c.stroke();
    c.beginPath(); c.ellipse(splash.x, splash.y + 1, splash.radius * 0.65, 1.5, 0, 0, Math.PI); c.stroke();
    for (const drop of splash.drops) {
      c.beginPath(); c.ellipse(drop.x, drop.y, drop.radius, drop.radius * 1.6, -0.3, 0, Math.PI * 2); c.fill(); c.stroke();
    }
  }
  c.restore();
}

function palm(c, tree) {
  c.save(); c.translate(tree.x, tree.y); c.scale(tree.h, tree.h);
  c.globalAlpha = 0.23; c.lineCap = 'round';
  // 暖棕树干与分节纹理，和绿色羽状树冠明确区分。
  c.fillStyle = '#9b7a58';
  c.beginPath(); c.moveTo(-0.035, 0); c.quadraticCurveTo(-0.015, -0.55, 0.19, -1);
  c.lineTo(0.25, -1); c.quadraticCurveTo(0.065, -0.55, 0.035, 0); c.closePath(); c.fill();
  c.strokeStyle = '#795d41'; c.lineWidth = 0.012;
  for (let i = 1; i < 9; i++) {
    const t = i / 10, x = 0.22 * t * t;
    c.beginPath(); c.moveTo(x - 0.023, -t); c.lineTo(x + 0.025, -t + 0.016); c.stroke();
  }
  const fronds = [[-0.58, 0.18], [-0.55, -0.02], [-0.38, -0.23], [-0.12, -0.32], [0.31, -0.25], [0.54, -0.07], [0.61, 0.16]];
  fronds.forEach(([x, y], i) => {
    c.fillStyle = i % 2 ? '#73a083' : '#528969'; c.globalAlpha = 0.2;
    c.beginPath(); c.moveTo(0.22, -1);
    c.quadraticCurveTo(0.22 + x * 0.48, -1 + y * 0.35 - 0.13, 0.22 + x, -1 + y);
    c.quadraticCurveTo(0.22 + x * 0.45, -1 + y * 0.3 + 0.03, 0.22, -1); c.fill();
    c.strokeStyle = '#477d5e'; c.lineWidth = 0.009;
    c.beginPath(); c.moveTo(0.22, -1); c.quadraticCurveTo(0.22 + x * 0.55, -1 + y * 0.4 - 0.04, 0.22 + x, -1 + y); c.stroke();
    // 沿叶脉补短羽片，避免树冠仍像几条等粗的弧线。
    for (let j = 2; j < 7; j++) {
      const t = j / 8, px = 0.22 + x * t, py = -1 + y * t - Math.sin(t * Math.PI) * 0.05;
      const length = 0.055 * (1 - t);
      c.beginPath(); c.moveTo(px - y * length, py + x * length); c.lineTo(px + y * length, py - x * length); c.stroke();
    }
  });
  c.globalAlpha = 0.26; c.fillStyle = '#90704f';
  for (const [x, y] of [[0.19, -0.96], [0.25, -0.94], [0.22, -0.9]]) {
    c.beginPath(); c.ellipse(x, y, 0.027, 0.035, 0.2, 0, Math.PI * 2); c.fill();
  }
  c.restore();
}

export function drawPalms(c, layout) {
  for (const tree of layout.palms) palm(c, tree);
}

function visitor(c, animal) {
  const orca = animal.kind === 'orca';
  c.save(); c.translate(animal.x, animal.y); c.rotate(animal.angle); c.globalAlpha = animal.opacity;
  c.scale(orca ? 1.2 : 1, orca ? 1.2 : 1);
  c.fillStyle = orca ? '#456777' : '#628fa3';
  c.beginPath();
  c.moveTo(-21, 2); c.bezierCurveTo(-9, -13, 15, -13, 23, -3);
  c.quadraticCurveTo(orca ? 29 : 34, orca ? 0 : -2, orca ? 25 : 32, 2);
  c.quadraticCurveTo(13, 11, -10, 7, -21, 2); c.fill();
  // 背鳍、胸鳍与尾鳍均为远景轮廓，不使用类似障碍的实心高对比形状。
  c.beginPath(); c.moveTo(-5, -8); c.quadraticCurveTo(-1, -23, 4, -8); c.fill();
  c.beginPath(); c.moveTo(1, 5); c.quadraticCurveTo(-1, 15, -7, 14); c.lineTo(-4, 3); c.fill();
  c.beginPath(); c.moveTo(-18, 1); c.lineTo(-32, -7); c.quadraticCurveTo(-30, 1, -25, 3); c.quadraticCurveTo(-30, 9, -33, 8); c.lineTo(-22, 4); c.fill();
  if (orca) {
    c.fillStyle = '#fff'; c.beginPath(); c.ellipse(16, -3, 4.5, 2.2, -0.2, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.ellipse(7, 4, 10, 2.2, 0, 0, Math.PI * 2); c.fill();
  }
  c.restore();
}

export function seaWaves(width, ground, time = 0, reduced = false) {
  const t = reduced ? 0 : time;
  return Array.from({ length: (Math.ceil(width / 180) + 1) * 2 }, (_, i) => ({
    x: ((Math.floor(i / 2) * 180 + (i % 2) * 67 - t * 2) % (width + 160) + width + 160) % (width + 160) - 70,
    y: ground - 195 + 18 + i % 2 * 32 + fraction(i + 53) * 4,
    width: 35 + fraction(i + 67) * 34,
    amplitude: 1.5 + fraction(i + 71) * 1.5,
    phase: i * 0.8 - t * 0.45,
  }));
}

export function skyFlocks(width, ground, time, seed = 0, reduced = false) {
  const sky = ground - 195;
  if (reduced || sky < 90) return [];
  const flocks = [];
  let start = 7 + fraction(seed + 101) * 5;
  for (let id = 0; start <= time; id++) {
    const random = (salt) => fraction(seed + id * 37 + salt);
    const count = 3 + Math.floor(random(107) * 5);
    const speed = 14 + random(113) * 12;
    const trail = Math.ceil((count - 1) / 2) * 18;
    const x = width + 12 - (time - start) * speed;
    if (x + trail + 6 >= 0) {
      flocks.push({ id, count, speed, trail, x, y: Math.max(62, sky * (0.18 + random(127) * 0.06)), opacity: 0.13 });
    }
    start += 24 + random(139) * 28;
  }
  return flocks;
}

function drawSkyFlocks(c, width, ground, time, seed, reduced) {
  c.save(); c.strokeStyle = '#71909e'; c.lineWidth = 1.1; c.lineCap = 'round';
  for (const flock of skyFlocks(width, ground, time, seed, reduced)) {
    c.globalAlpha = flock.opacity;
    for (let i = 0; i < flock.count; i++) {
      const rank = Math.ceil(i / 2);
      const x = flock.x + rank * 18, y = flock.y + rank * (i % 2 ? -7 : 7);
      // 两笔弧线组成的小海鸥；形状、透明度与本群速度始终固定。
      c.beginPath(); c.moveTo(x - 4.5, y - 1.5); c.quadraticCurveTo(x - 2, y - 3, x, y);
      c.quadraticCurveTo(x + 2, y - 3, x + 4.5, y - 1.5); c.stroke();
    }
  }
  c.restore();
}

export function drawSea(c, width, height, ground, distance, time, reduced, seed = 0) {
  const layout = sceneryLayout(width, height, ground, distance, reduced, seed);
  c.fillStyle = '#f1dba4'; c.globalAlpha = 0.65;
  c.beginPath(); c.arc(width * 0.22, Math.max(38, layout.seaTop * 0.38), 27, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1;
  drawSkyFlocks(c, width, ground, time, seed, reduced);
  c.fillStyle = '#c5e3ed'; c.fillRect(0, layout.seaTop, width, ground - layout.seaTop);
  c.fillStyle = '#d5ebf2'; c.fillRect(0, layout.seaTop, width, 4);
  c.save();
  // 海洋动物和波纹不进入跑道上方 120 单位；椰树在障碍物下方的背景层单独绘制。
  c.beginPath(); c.rect(0, layout.seaTop - 30, width, ground - 128 - (layout.seaTop - 30)); c.clip();
  c.strokeStyle = '#f5ffff'; c.lineWidth = 1.2; c.lineCap = 'round'; c.globalAlpha = 0.43;
  for (const wave of seaWaves(width, ground, time, reduced)) {
    c.beginPath();
    for (let step = 0; step <= 16; step++) {
      const progress = step / 16;
      const x = wave.x + wave.width * progress;
      const y = wave.y + Math.sin(progress * Math.PI * 2 + wave.phase) * wave.amplitude;
      if (step === 0) c.moveTo(x, y); else c.lineTo(x, y);
    }
    c.stroke();
  }
  c.globalAlpha = 1;
  const animal = seaVisitor(time, width, ground, reduced);
  if (animal) visitor(c, animal);
  drawOrcaSplashes(c, orcaSplashes(time, width, ground, reduced));
  c.restore();
  return layout;
}

export function drawSand(c, layout, width, distance, reduced) {
  c.save(); c.beginPath(); c.rect(0, layout.sandTop, width, Math.max(0, layout.height - layout.sandTop)); c.clip();
  const drift = reduced ? 0 : distance * 0.035;
  for (const item of layout.beachItems) {
    const x = ((item.x - drift) % (width + 30) + width + 30) % (width + 30) - 15;
    c.save(); c.translate(x, item.y); c.rotate(item.tilt); c.scale(item.radius, item.radius);
    c.globalAlpha = item.opacity; c.lineWidth = 0.07;
    if (item.kind === 'starfish') {
      c.fillStyle = '#bd927b'; c.strokeStyle = '#a7806d'; c.beginPath();
      for (let i = 0; i < 10; i++) {
        const angle = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 0.42 : 0.96;
        if (i === 0) c.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
        else c.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
      }
      c.closePath(); c.fill();
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI / 2 + i * Math.PI * 2 / 5;
        c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a) * 0.65, Math.sin(a) * 0.65); c.stroke();
      }
    } else {
      c.fillStyle = '#a79c8a'; c.strokeStyle = '#938e82'; c.beginPath();
      c.moveTo(-0.16, 0.65); c.lineTo(-0.83, -0.15);
      for (let i = 0; i < 5; i++) {
        const a = Math.PI + i * Math.PI / 5, b = Math.PI + (i + 1) * Math.PI / 5;
        c.quadraticCurveTo(Math.cos((a+b)/2) * 1.03, Math.sin((a+b)/2) * 0.9 - 0.15, Math.cos(b) * 0.83, Math.sin(b) * 0.72 - 0.15);
      }
      c.lineTo(0.16, 0.65); c.closePath(); c.fill();
      for (const a of [Math.PI * 1.2, Math.PI * 1.4, Math.PI * 1.6, Math.PI * 1.8]) {
        c.beginPath(); c.moveTo(0, 0.55); c.quadraticCurveTo(Math.cos(a) * 0.35, -0.1, Math.cos(a) * 0.7, Math.sin(a) * 0.6 - 0.15); c.stroke();
      }
    }
    c.restore();
  }
  c.restore();
}
