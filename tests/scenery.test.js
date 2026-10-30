import test from 'node:test';
import assert from 'node:assert/strict';
import { sceneryLayout, seaVisitor, drawPalms } from '../src/scenery.js';
import { Runner } from '../src/engine.js';

test('沙滩小物位于跑道下方，椰树从沙地表面向上生长', () => {
  for (const [width, height] of [[1200, 720], [600, 1300], [900, 320]]) {
    const ground = height * 0.72;
    const layout = sceneryLayout(width, height, ground);
    assert.ok(layout.beachItems.every((item) => item.y - item.radius >= ground + 48));
    assert.ok(layout.palms.length > 0);
    assert.ok(layout.palms.every((p) => p.y === ground + 2 && p.y - p.h < ground));
  }
});
test('海星和贝壳使用独立种子随机分布，同一种子跨帧保持稳定', () => {
  const a = sceneryLayout(1200, 720, 520, 0, false, 123);
  const b = sceneryLayout(1200, 720, 520, 0, false, 456);
  assert.deepEqual(a.beachItems, sceneryLayout(1200, 720, 520, 0, false, 123).beachItems);
  assert.notDeepEqual(a.beachItems, b.beachItems);
  assert.deepEqual(new Set(a.beachItems.map((item) => item.kind)), new Set(['starfish', 'shell']));
  assert.ok(a.beachItems.every((item) => item.opacity >= 0.12 && item.opacity <= 0.17));
  assert.deepEqual(a.palms, b.palms);
});
test('椰树始终以固定透明度绘制，不因玩家或障碍接近消失', () => {
  const draw = (foreground) => {
    const operations = [];
    const context = new Proxy({}, {
      get: (_, key) => (...args) => operations.push([key, ...args]),
      set: (_, key, value) => { operations.push([key, value]); return true; },
    });
    drawPalms(context, { palms: [{ x: 400, y: 520, h: 100 }] }, foreground);
    return operations;
  };
  const baseline = draw([]);
  assert.ok(baseline.length > 0);
  assert.deepEqual(draw([{ x: 400, w: 43 }]), baseline);
  assert.deepEqual(draw([{ x: 30, w: 500 }]), baseline);
});
test('椰树锚定世界坐标，随前进距离向后移动且相邻间距更大', () => {
  const a = sceneryLayout(2800, 720, 520, 0);
  const b = sceneryLayout(2800, 720, 520, 100);
  const tree = a.palms.find((p) => p.x > 200);
  const moved = b.palms.find((p) => p.id === tree.id);
  assert.ok(moved.x < tree.x);
  assert.equal(moved.worldX, tree.worldX);
  assert.ok(Math.abs(tree.x - moved.x - 18) < 1e-8);
  assert.ok(a.palms.slice(1).every((p, i) => p.worldX - a.palms[i].worldX >= 1200));
});
test('椰树离屏后才补入新树，同一世界位置可重现，减少动态效果时固定', () => {
  const a = sceneryLayout(600, 1300, 936, 8000);
  const b = sceneryLayout(600, 1300, 936, 8000);
  assert.deepEqual(a.palms, b.palms);
  assert.deepEqual(sceneryLayout(600, 1300, 936, 8000, true).palms, sceneryLayout(600, 1300, 936, 0, true).palms);
  assert.ok(a.palms.every((p) => p.x >= -180 && p.x <= 780));
});
test('海豚与虎鲸低频出现、缓慢移动且远离玩家与障碍判断带', () => {
  assert.equal(seaVisitor(0, 1200, 520), null);
  assert.equal(seaVisitor(15, 1200, 520), null);
  const dolphin = seaVisitor(21, 1200, 520), orca = seaVisitor(55, 1200, 520);
  assert.equal(dolphin.kind, 'dolphin'); assert.equal(orca.kind, 'orca');
  assert.ok(dolphin.x > 260 && dolphin.y + 18 < 520 - 120);
  assert.ok(Math.abs(seaVisitor(22, 1200, 520).x - dolphin.x) < 25);
  assert.equal(seaVisitor(35, 1200, 520), null);
  assert.equal(seaVisitor(21, 1200, 520, true), null);
});
test('绘制数据的计算不消耗游戏随机数，不修改物理、计分及障碍', () => {
  const game = new Runner({ random: () => 0.5 }); game.start();
  for (let i = 0; i < 30; i++) game.update(1 / 120);
  const before = JSON.stringify(game);
  sceneryLayout(1200, 720, 520); seaVisitor(game.time, 1200, 520);
  assert.equal(JSON.stringify(game), before);
});
