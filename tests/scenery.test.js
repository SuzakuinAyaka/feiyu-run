import test from 'node:test';
import assert from 'node:assert/strict';
import { sceneryLayout, seaVisitor } from '../src/scenery.js';
import { Runner } from '../src/engine.js';

test('装饰沙石与椰树完全位于跑道下方，横竖屏均保留判断空间', () => {
  for (const [width, height] of [[1200, 720], [600, 1300], [900, 320]]) {
    const ground = height * 0.72;
    const layout = sceneryLayout(width, height, ground);
    assert.ok(layout.stones.every((s) => s.y - s.h >= ground + 48));
    assert.ok(layout.palms.every((p) => p.y - p.h * 1.2 >= ground + 48));
  }
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
