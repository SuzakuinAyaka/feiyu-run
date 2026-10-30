const fraction = (value) => { const n = Math.sin(value * 127.1 + 311.7) * 43758.5453; return n - Math.floor(n); };

export function sceneryLayout(width, height, ground) {
  const sand = height - ground;
  const stones = sand > 70 ? Array.from({ length: Math.min(18, Math.ceil(width / 90)) }, (_, i) => {
    const h = 2 + fraction(i + 3) * 4;
    return { x: fraction(i + 7) * width, y: ground + 48 + h + fraction(i + 11) * Math.max(0, sand - 70 - 2 * h), w: 8 + fraction(i + 19) * 16, h, tilt: fraction(i + 31) * 0.6 - 0.3 };
  }) : [];
  const palms = sand > 110 ? [0.34, 0.82].map((x, i) => ({ x: width * x, y: height - 20, h: Math.min(110, (sand - 68) / 1.25) * (i ? 0.85 : 1) })) : [];
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
  c.globalAlpha = 0.12; c.strokeStyle = '#658f84'; c.lineCap = 'round'; c.lineWidth = 0.045;
  c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(0.02, -0.55, 0.22, -1); c.stroke();
  c.lineWidth = 0.035;
  for (const [x, y] of [[-0.48, 0.12], [-0.45, -0.02], [-0.3, -0.15], [-0.1, -0.18], [0.28, -0.16], [0.46, -0.04], [0.5, 0.12]]) {
    c.beginPath(); c.moveTo(0.22, -1); c.quadraticCurveTo(0.22 + x * 0.65, -1.18, 0.22 + x, -1 + y); c.stroke();
  }
  c.restore();
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
  const layout = sceneryLayout(width, height, ground);
  c.fillStyle = '#f1dba4'; c.globalAlpha = 0.65;
  c.beginPath(); c.arc(width * 0.22, Math.max(38, layout.seaTop * 0.38), 27, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1;
  c.fillStyle = '#c5e3ed'; c.fillRect(0, layout.seaTop, width, ground - layout.seaTop);
  c.fillStyle = '#d5ebf2'; c.fillRect(0, layout.seaTop, width, 4);
  const drift = reduced ? 0 : distance * 0.025;
  c.save();
  // 最后 120 个世界单位仅保留平色海面，远景不会进入障碍判断带。
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
  for (const tree of layout.palms) palm(c, tree);
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
