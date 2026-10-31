import { runPose } from './animation.js';
import { drawSea, drawSand, drawPalms } from './scenery.js';

const frames = [
  { x: 22, y: 40, w: 495, h: 510 },
  { x: 540, y: 40, w: 480, h: 510 },
  { x: 1030, y: 40, w: 490, h: 510 },
  { x: 26, y: 558, w: 490, h: 452 },
  { x: 523, y: 650, w: 510, h: 360 },
  { x: 1090, y: 610, w: 435, h: 405 },
];
// 按实际透明轮廓取帧，统一缩放倍率并对齐脚底，避免生成图的留白差异造成跳动。
const runFrames = [
  { x: 19, y: 85, w: 351, h: 410 },
  { x: 417, y: 83, w: 331, h: 410 },
  { x: 776, y: 82, w: 338, h: 413 },
  { x: 1152, y: 83, w: 340, h: 408 },
  { x: 22, y: 565, w: 349, h: 405 },
  { x: 406, y: 560, w: 342, h: 414 },
  { x: 777, y: 562, w: 342, h: 412 },
  { x: 1154, y: 561, w: 360, h: 394 },
];

export function drawPixelAvatar(canvas, theme = 'dark') {
  const c = canvas.getContext('2d');
  c.clearRect(0, 0, 48, 56);
  // 入口专用的小像素形象；进入游戏才使用完整动漫角色。
  const pixels = [
    '         aaa        ',
    '        a   a       ',
    '      wwwwwwww      ',
    '     wwhhhhhhww     ',
    '    hhhhhhhhhhh     ',
    '    hhhhhhhhhhhh    ',
    '   hhhsshhsshhhh    ',
    '   hhskssskshhhh    ',
    '   hhssssssshhhh    ',
    '   hhhssmsshhhh     ',
    '   hhhwwwwwhhh      ',
    '  ahhdbwwbdhhh a    ',
    ' aahhdwwwwdhh aaa   ',
    ' aahddwwwwddhaa a   ',
    '  aaddwwwwddaaaa    ',
    '   addwwwwdda       ',
    '    dddddddd        ',
    '    wwwwwwww        ',
    '     ss  ss         ',
    '     kk  kk         ',
  ];
  const colors = theme === 'light'
    ? { a: '#626970', w: '#b8bdc2', h: '#5f6368', s: '#a4a8ad', k: '#30343a', m: '#4b5056', d: '#656b72', b: '#3f444b' }
    : { a: '#777d86', w: '#d3d6da', h: '#999ea6', s: '#c0c3c8', k: '#383b40', m: '#72767e', d: '#767c85', b: '#535962' };
  pixels.forEach((row, y) => [...row].forEach((p, x) => {
    if (colors[p]) { c.fillStyle = colors[p]; c.fillRect(2 + x * 2, 8 + y * 2, 2, 2); }
  }));
}

export class Renderer {
  constructor(canvas, sprite, runSprite) {
    this.canvas = canvas;
    this.c = canvas.getContext('2d');
    this.sprite = sprite;
    this.runSprite = runSprite;
    this.resetScenery();
    this.reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.resize();
  }
  resetScenery() {
    // 独立背景种子；不调用游戏障碍使用的 Math.random，跨帧保持不变。
    const value = globalThis.crypto?.getRandomValues
      ? globalThis.crypto.getRandomValues(new Uint32Array(1))[0]
      : Date.now();
    this.scenerySeed = value % 1000000;
  }
  resize() {
    const w = innerWidth, h = innerHeight;
    this.width = Math.max(600, w / 1.25);
    this.scale = w / this.width;
    this.height = h / this.scale;
    this.ground = this.height * (h < 500 ? 0.77 : 0.72);
    const dpr = Math.min(devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.c.setTransform(dpr * this.scale, 0, 0, dpr * this.scale, 0, 0);
    this.c.imageSmoothingEnabled = true;
  }

  cloud(x, y, size) {
    const c = this.c;
    c.fillStyle = '#fff';
    c.beginPath();
    c.ellipse(x, y, size, size * 0.21, 0, 0, Math.PI * 2);
    c.ellipse(x - size * 0.25, y - size * 0.15, size * 0.4, size * 0.3, 0, 0, Math.PI * 2);
    c.ellipse(x + size * 0.25, y - size * 0.2, size * 0.35, size * 0.36, 0, 0, Math.PI * 2);
    c.fill();
  }

  draw(game) {
    const c = this.c, w = this.width, h = this.height, ground = this.ground;
    // 入场跑动只用于绘制，接续到正式跑酷；不计入得分或推进障碍生成时间。
    const distance = game.distance + (game.entranceElapsed || 0) * 330;
    c.clearRect(0, 0, w, h);
    c.fillStyle = '#eaf5fa'; c.fillRect(0, 0, w, h);
    // 远景太阳先绘制，随后云层覆盖它的重叠部分。
    const scenery = drawSea(c, w, h, ground, distance, game.time, this.reduced, this.scenerySeed);
    const drift = this.reduced ? 0 : distance * 0.045;
    [0.31, 0.65, 0.94].forEach((f, i) => {
      const x = ((w * f - drift * (0.7 + i * 0.2)) % (w + 180) + w + 180) % (w + 180) - 60;
      this.cloud(x, ground - 270 - (i % 2) * 55, 38 + i * 7);
    });
    // 先画完整椰树，随后绘制沙地、障碍与角色；重叠时由前景遮挡，不隐藏整棵树。
    drawPalms(c, scenery);
    c.fillStyle = '#f2eada'; c.fillRect(0, ground, w, h - ground);
    drawSand(c, scenery, w, distance, this.reduced);
    c.fillStyle = '#8caaad'; c.fillRect(0, ground, w, 2);
    c.fillStyle = '#c7bfae';
    for (let i = 0; i < Math.ceil(w / 40) + 2; i++) {
      const x = ((i * 47 - distance) % (w + 70) + w + 70) % (w + 70);
      c.fillRect(x, ground + 9 + (i % 3) * 7, i % 2 ? 5 : 10, 2);
    }
    for (const obstacle of game.obstacles) this.obstacle(obstacle, ground, game.time);
    const p = game.player;
    const index = game.state === 'over' ? 5 : p.y < 0 ? 3 : p.ducking ? 4 : -1;
    const pose = runPose(distance, this.reduced);
    const frame = index >= 0 ? frames[index] : runFrames[pose.frame];
    const height = index < 0 ? frame.h / 4.1 : index === 4 ? 58 : index === 5 ? 78 : 102;
    const width = frame.w / frame.h * height;
    // 碰撞只覆盖前方身体，飘动头发与尾巴不造成惩罚。
    c.save();
    c.translate(116, ground + p.y + 2 + (index < 0 ? pose.bob : 0));
    if (index < 0) c.rotate(pose.lean);
    c.drawImage(index < 0 ? this.runSprite : this.sprite, frame.x, frame.y, frame.w, frame.h, 132 - width - 116, -height, width, height);
    c.restore();
  }

  obstacle(o, ground, time) {
    const c = this.c, x = o.x, y = ground + o.y;
    c.save(); c.translate(x, y);
    if (o.kind === 'rock') {
      c.fillStyle = '#65889b';
      c.beginPath(); c.moveTo(0, 49); c.lineTo(5, 18); c.lineTo(18, 0); c.lineTo(34, 7); c.lineTo(43, 49); c.closePath(); c.fill();
      c.fillStyle = '#91aebc'; c.beginPath(); c.moveTo(5, 18); c.lineTo(18, 0); c.lineTo(23, 31); c.lineTo(0, 49); c.fill();
    } else if (o.kind === 'log') {
      c.fillStyle = '#9a7560'; c.beginPath(); c.roundRect(0, 4, 66, 31, 9); c.fill();
      c.fillStyle = '#d9b58a'; c.beginPath(); c.ellipse(59, 19, 7, 15, 0, 0, Math.PI * 2); c.fill();
      c.strokeStyle = '#725a4d'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(8, 13); c.lineTo(43, 13); c.moveTo(6, 24); c.lineTo(37, 24); c.stroke();
    } else {
      const flap = Math.sin(time * 12) * 9;
      c.strokeStyle = '#547a91'; c.lineWidth = 4; c.lineCap = 'round';
      c.beginPath(); c.moveTo(0, 4 + flap); c.quadraticCurveTo(13, -3 + flap, 24, 14); c.quadraticCurveTo(36, -3 + flap, 48, 4 + flap); c.stroke();
      c.fillStyle = '#fff'; c.beginPath(); c.ellipse(24, 14, 12, 5, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#c89448'; c.fillRect(34, 12, 7, 3);
    }
    c.restore();
  }
}
