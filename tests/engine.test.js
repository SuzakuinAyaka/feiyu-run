import test from 'node:test';
import assert from 'node:assert/strict';
import { Runner, playerBox, overlaps } from '../src/engine.js';

const fresh = () => new Runner({ random: () => 0.5, width: 900 });
const step = (g, seconds) => { for (let n = 0; n < Math.round(seconds * 120); n++) g.update(1 / 120); };

test('待机不会计分，开始后自动前进', () => {
  const g = fresh(); step(g, 1); assert.equal(g.distance, 0);
  g.start(); step(g, 1); assert.ok(g.distance > 300); assert.equal(g.state, 'running');
});

test('入口准备持续 3 秒，冻结计分、障碍与输入，随后才开始跑酷', () => {
  const g = fresh(); g.start({ entrance: true });
  assert.equal(g.state, 'entering'); assert.equal(g.jump(), false); g.duck(true);
  step(g, 2.9);
  assert.ok(g.entranceElapsed > 2.89 && g.entranceElapsed < 2.91);
  assert.equal(g.state, 'entering'); assert.equal(g.score, 0); assert.equal(g.time, 0);
  assert.equal(g.distance, 0); assert.deepEqual(g.obstacles, []); assert.equal(g.player.ducking, false);
  step(g, 0.1); assert.equal(g.state, 'running'); assert.equal(g.score, 0); assert.equal(g.entranceElapsed, 3);
  step(g, 0.2); assert.ok(g.distance > 0); assert.ok(g.time > 0);
});

test('准备中暂停冻结剩余时间，主动继续后完成过渡；重开默认跳过准备', () => {
  const g = fresh(); g.start({ entrance: true }); step(g, 1); g.pause();
  const remaining = g.entranceRemaining;
  const elapsed = g.entranceElapsed;
  assert.equal(g.state, 'paused'); step(g, 4); assert.equal(g.entranceRemaining, remaining);
  assert.equal(g.entranceElapsed, elapsed);
  g.resume(); assert.equal(g.state, 'entering'); step(g, 2); assert.equal(g.state, 'running');
  g.start(); assert.equal(g.state, 'running'); assert.equal(g.entranceRemaining, 0);
  step(g, 0.1); assert.ok(g.distance > 0);
});

test('入场按实际时间计时，低帧率不拉长三秒过渡，结束帧仍不计分', () => {
  const g = fresh(); g.start({ entrance: true });
  g.update(NaN); g.update(-1); assert.equal(g.entranceRemaining, 3);
  g.update(1.5); assert.equal(g.entranceRemaining, 1.5);
  g.update(2); assert.equal(g.state, 'running'); assert.equal(g.entranceElapsed, 3);
  assert.equal(g.distance, 0); assert.deepEqual(g.obstacles, []);
});
test('按住跳跃比松开跳得更高，空中不能二段跳', () => {
  const held = fresh(), tap = fresh(); held.start(); tap.start();
  assert.equal(held.jump(), true); tap.jump(); tap.releaseJump();
  assert.equal(held.jump(), false);
  step(held, 0.24); step(tap, 0.24); assert.ok(held.player.y < tap.player.y - 15);
  step(held, 0.9); assert.equal(held.player.y, 0);
});
test('下蹲缩小碰撞盒且不能同时起跳', () => {
  const g = fresh(); g.start(); const standing = playerBox(g.player);
  g.duck(true); assert.ok(playerBox(g.player).h < standing.h / 1.5); assert.equal(g.jump(), false);
  g.duck(false); assert.equal(g.jump(), true);
});
test('轻点跳跃也有足够高度越过礁石', () => {
  const g = fresh(); g.start(); g.jump(); g.releaseJump();
  let highest = 0;
  for (let i = 0; i < 60; i++) { g.update(1 / 120); highest = Math.min(highest, g.player.y); }
  assert.ok(highest < -50, `轻点跳跃高度不足：${-highest}`);
});
test('海鸥与站立角色碰撞，下蹲可以通过', () => {
  const bird = { x: 95, y: -78, w: 44, h: 22, kind: 'gull' };
  const a = fresh(); a.start(); a.obstacles = [{ ...bird }]; a.update(1 / 120); assert.equal(a.state, 'over');
  const b = fresh(); b.start(); b.duck(true); b.obstacles = [{ ...bird }]; b.update(1 / 120); assert.equal(b.state, 'running');
});
test('碰撞结束冻结距离，重新开始重置本局', () => {
  const g = fresh(); g.start(); step(g, 0.5);
  g.obstacles = [{ x: 95, y: -40, w: 40, h: 40, kind: 'rock' }]; g.update(1 / 120);
  assert.equal(g.state, 'over'); const distance = g.distance; step(g, 1); assert.equal(g.distance, distance);
  g.start(); assert.equal(g.distance, 0); assert.equal(g.obstacles.length, 0); assert.equal(g.state, 'running');
});
test('暂停与继续不重置分数，暂停时输入不修改物理状态', () => {
  const g = fresh(); g.start(); step(g, 0.5); g.pause(); const distance = g.distance;
  step(g, 1); assert.equal(g.distance, distance); assert.equal(g.jump(), false);
  g.resume(); step(g, 0.1); assert.ok(g.distance > distance);
});
test('速度递增且有上限，生成间隔保留可反应距离', () => {
  const g = fresh(); g.start(); const initial = g.speed;
  for (let n = 0; n < 120 * 150; n++) { g.obstacles = []; g.update(1 / 120); }
  assert.ok(g.speed > initial); assert.ok(g.speed <= 640);
  const spawned = [];
  for (let n = 0; n < 120 * 20; n++) {
    g.obstacles = []; g.update(1 / 120);
    if (g.obstacles.length) spawned.push(g.time);
  }
  assert.ok(spawned.length > 5);
  assert.ok(spawned.slice(1).every((time, i) => time - spawned[i] >= 1.3));
});
test('屏幕变窄时障碍进入可视区，单帧卡顿不会穿越整屏', () => {
  const g = fresh(); g.resize(600); g.start(); g.update(100);
  assert.ok(g.distance < 25); assert.equal(g.width, 600);
});

test('障碍间隔在 30 秒后平滑缩短，90 秒后保持下限且保留完整跳跃时间', () => {
  for (const roll of [0, 0.5, 1]) {
    const g = new Runner({ random: () => roll });
    const intervals = [0, 30, 60, 90, 180].map((time) => {
      g.time = time; g.spawn(); return g.untilNext;
    });
    assert.equal(intervals[0], 1.4 + roll * 0.65);
    assert.equal(intervals[0], intervals[1]);
    assert.ok(intervals[1] > intervals[2] && intervals[2] > intervals[3]);
    assert.equal(intervals[3], intervals[4]);
    assert.ok(intervals[3] >= 1.15 && intervals[3] <= 1.7);
  }
  const g = fresh(); g.start(); g.jump();
  let airborne = 0;
  do { g.update(1 / 120); airborne += 1 / 120; } while (g.player.y < 0);
  assert.ok(airborne + 0.3 < 1.15, `完整跳跃 ${airborne} 秒需保留动作准备时间`);
});
test('矩形仅边缘相触不判碰撞', () => {
  assert.equal(overlaps({ x: 0, y: 0, w: 10, h: 10 }, { x: 10, y: 0, w: 10, h: 10 }), false);
});
