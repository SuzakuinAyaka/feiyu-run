const fraction = (value) => { const n = Math.sin(value * 127.1 + 311.7) * 43758.5453; return n - Math.floor(n); };

export function sceneryLayout(width, height, ground, distance = 0, reduced = false) {
  const sand = height - ground;
  const stones = sand > 70 ? Array.from({ length: Math.min(18, Math.ceil(width / 90)) }, (_, i) => {
    const h = 2 + fraction(i + 3) * 4;
    return { x: fraction(i + 7) * width, y: ground + 48 + h + fraction(i + 11) * Math.max(0, sand - 70 - 2 * h), w: 8 + fraction(i + 19) * 16, h, tilt: fraction(i + 31) * 0.6 - 0.3 };
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
  return { seaTop: ground - 195, quietTop: ground - 120, sandTop: ground + 48, height, stones, palms };
}

export function seaVisitor(time, width, ground, reduced = false) {
  if (reduced || time < 18) return null;
  const slot = Math.floor((time - 18) / 34);
  const elapsed = (time - 18) % 34;
  const kind = slot % 2 ? 'orca' : 'dolphin';
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

export function drawSea(c, width, height, ground, distance, time, reduced) {
  const layout = sceneryLayout(width, height, ground, distance, reduced);
  c.fillStyle = '#f1dba4'; c.globalAlpha = 0.65;
  c.beginPath(); c.arc(width * 0.22, Math.max(38, layout.seaTop * 0.38), 27, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1;
  c.fillStyle = '#c5e3ed'; c.fillRect(0, layout.seaTop, width, ground - layout.seaTop);
  c.fillStyle = '#d5ebf2'; c.fillRect(0, layout.seaTop, width, 4);
  const drift = reduced ? 0 : distance * 0.025;
  c.save();
  // 海洋动物和波纹不进入跑道上方 120 单位；椰树在障碍物下方的背景层单独绘制。
  c.beginPath(); c.rect(0, layout.seaTop - 30, width, ground - 128 - (layout.seaTop - 30)); c.clip();
  c.fillStyle = '#e0f0f5';
  for (let i = 0; i < 12; i++) {
    const x = ((i * 137 - drift) % (width + 100) + width + 100) % (width + 100);
    c.fillRect(x, layout.seaTop + 17 + i % 4 * 11, 20 + i % 3 * 12, 2);
  }
  const animal = seaVisitor(time, width, ground, reduced);
  if (animal) visitor(c, animal);
  c.restore();
  return layout;
}

export function drawSand(c, layout, width, distance, reduced) {
  c.save(); c.beginPath(); c.rect(0, layout.sandTop, width, Math.max(0, layout.height - layout.sandTop)); c.clip();
  c.save(); c.fillStyle = '#8b9f9b'; c.globalAlpha = 0.16;
  const drift = reduced ? 0 : distance * 0.035;
  for (const stone of layout.stones) {
    const x = ((stone.x - drift) % (width + 30) + width + 30) % (width + 30) - 15;
    c.save(); c.translate(x, stone.y); c.rotate(stone.tilt);
    c.beginPath(); c.moveTo(-stone.w / 2, 0); c.lineTo(-stone.w * 0.28, -stone.h * 0.65);
    c.lineTo(stone.w * 0.12, -stone.h); c.lineTo(stone.w * 0.4, -stone.h * 0.5); c.lineTo(stone.w / 2, stone.h * 0.2); c.closePath(); c.fill(); c.restore();
  }
  c.restore();
  c.restore();
}
