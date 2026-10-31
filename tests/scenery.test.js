import test from 'node:test';
import assert from 'node:assert/strict';
import { sceneryLayout, seaVisitor, drawPalms, seaWaves, skyFlocks, orcaSplashes } from '../src/scenery.js';
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
test('海浪仅位于远海，低幅度移动且减少动态效果时保持静态', () => {
  for (const width of [600, 1200, 2400]) {
    const waves = seaWaves(width, 520, 0);
    assert.ok(waves.length > 4);
    assert.ok(waves.every((wave) => wave.y + wave.amplitude < 520 - 128 && wave.amplitude <= 3));
    assert.notDeepEqual(waves, seaWaves(width, 520, 1));
    assert.deepEqual(seaWaves(width, 520, 10, true), seaWaves(width, 520, 0, true));
  }
});

test('每 68 秒保留一次海豚，虎鲸增加为两次且保持低透明度与安全距离', () => {
  const starts = [];
  let last = null;
  for (let time = 18; time < 154; time++) {
    const animal = seaVisitor(time, 1200, 520);
    if (animal && animal.kind !== last) starts.push([time, animal.kind]);
    last = animal?.kind ?? null;
    if (animal) {
      assert.ok(animal.opacity <= 0.19 && animal.y + 18 < 520 - 120);
      assert.equal(seaVisitor(time, 1200, 520, true), null);
    }
  }
  assert.deepEqual(starts.filter(([, kind]) => kind === 'dolphin').map(([time]) => time), [18, 86]);
  assert.deepEqual(starts.filter(([, kind]) => kind === 'orca').map(([time]) => time), [52, 74, 120, 142]);
});

test('虎鲸出水与入水各触发一次水花，入水余波在虎鲸消失后继续消散', () => {
  for (const start of [52, 74, 120, 142]) {
    assert.equal(orcaSplashes(start - 0.1, 1200, 520).length, 0);
    const launch = orcaSplashes(start + 0.4, 1200, 520);
    const landing = orcaSplashes(start + 7.1, 1200, 520);
    assert.equal(launch.length, 1); assert.equal(launch[0].kind, 'launch');
    assert.equal(landing.length, 1); assert.equal(landing[0].kind, 'landing');
    assert.ok(landing[0].x > launch[0].x);
    assert.equal(seaVisitor(start + 7.1, 1200, 520), null);
    assert.deepEqual(orcaSplashes(start + 3, 1200, 520), []);
    assert.deepEqual(orcaSplashes(start + 8.1, 1200, 520), []);
  }
  assert.deepEqual(orcaSplashes(18.4, 1200, 520), []);
});

test('水花低透明度、只在远海，随时间扩散且减少动态效果时不绘制', () => {
  for (const width of [600, 1200]) {
    const a = orcaSplashes(52.3, width, 520)[0], b = orcaSplashes(52.6, width, 520)[0];
    assert.equal(a.x, b.x); assert.ok(b.radius > a.radius);
    for (let time = 52; time < 60.1; time += 0.1) {
      for (const splash of orcaSplashes(time, width, 520)) {
        assert.ok(splash.opacity >= 0 && splash.opacity <= 0.32);
        assert.ok(splash.y + 4 < 520 - 128);
        assert.ok(splash.drops.every((drop) => drop.y + drop.radius < 520 - 128));
      }
      assert.deepEqual(orcaSplashes(time, width, 520, true), []);
    }
    assert.deepEqual(orcaSplashes(52.3, width, 520)[0], a);
  }
});

test('出入水掀起双侧浪峰，入水浪更高，随后向外扩散并落回海面', () => {
  const launch = orcaSplashes(52.65, 1200, 520)[0];
  const landing = orcaSplashes(59.3, 1200, 520)[0];
  assert.ok(launch.wave.height >= 18 && landing.wave.height >= 24);
  const early = orcaSplashes(52.2, 1200, 520)[0], late = orcaSplashes(53.2, 1200, 520)[0];
  assert.ok(late.wave.width > early.wave.width);
  assert.ok(late.wave.height < launch.wave.height);
  for (let time = 52; time < 60.1; time += 0.1) {
    for (const splash of orcaSplashes(time, 1200, 520)) {
      assert.ok(splash.wave.opacity >= 0 && splash.wave.opacity <= 0.4);
      assert.ok(splash.y + 4 < 520 - 128 && splash.wave.height <= 24);
    }
  }
});
test('海鸥群的数量、速度与间隔由独立种子确定，跨帧匀速向左且不渐隐', () => {
  const a = skyFlocks(1200, 520, 20, 123), b = skyFlocks(1200, 520, 21, 123);
  assert.ok(a.length > 0);
  const first = a[0], next = b.find((flock) => flock.id === first.id);
  assert.ok(first.count >= 3 && first.count <= 7);
  assert.ok(Math.abs(first.x - next.x - first.speed) < 1e-8);
  assert.equal(first.opacity, next.opacity);
  assert.ok(first.opacity <= 0.15);
  assert.notDeepEqual(a, skyFlocks(1200, 520, 20, 456));
  assert.deepEqual(a, skyFlocks(1200, 520, 20, 123));
  assert.deepEqual(skyFlocks(1200, 520, 20, 123, true), []);
});
test('海鸥群完全飞出左侧才移除，短横屏空间不足时不挤入前景', () => {
  for (const time of [0, 10, 20, 100, 300]) {
    assert.ok(skyFlocks(600, 936, time, 123).every((flock) => flock.x + flock.trail + 6 >= 0));
  }
  assert.deepEqual(skyFlocks(900, 240, 20, 123), []);
});
test('绘制数据的计算不消耗游戏随机数，不修改物理、计分及障碍', () => {
  const game = new Runner({ random: () => 0.5 }); game.start();
  for (let i = 0; i < 30; i++) game.update(1 / 120);
  const before = JSON.stringify(game);
  sceneryLayout(1200, 720, 520); seaVisitor(game.time, 1200, 520);
  assert.equal(JSON.stringify(game), before);
});
