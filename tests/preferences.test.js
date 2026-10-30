import test from 'node:test';
import assert from 'node:assert/strict';
import { readPreferences, savePreference } from '../src/preferences.js';
import { messages, translate } from '../src/i18n.js';
import { runPose } from '../src/animation.js';

test('主题和语言默认明确，不依赖系统设置', () => {
  assert.deepEqual(readPreferences({ getItem: () => null }), { theme: 'dark', locale: 'zh-CN' });
});
test('有效偏好可恢复，非法值和存储异常回退默认值', () => {
  assert.deepEqual(readPreferences({ getItem: (key) => key.endsWith('theme') ? 'light' : 'en' }), { theme: 'light', locale: 'en' });
  assert.deepEqual(readPreferences({ getItem: () => 'system' }), { theme: 'dark', locale: 'zh-CN' });
  assert.deepEqual(readPreferences({ getItem: () => { throw new Error('blocked'); } }), { theme: 'dark', locale: 'zh-CN' });
});
test('只保存支持的偏好，存储被禁止不导致崩溃', () => {
  const saved = []; const storage = { setItem: (...args) => saved.push(args) };
  assert.equal(savePreference(storage, 'theme', 'light'), true);
  assert.deepEqual(saved, [['feiyu-run.theme', 'light']]);
  assert.equal(savePreference(storage, 'theme', 'system'), false);
  assert.equal(savePreference({ setItem() { throw new Error('blocked'); } }, 'locale', 'en'), false);
});
test('中英文文案键完整一致且插值保留分数', () => {
  assert.deepEqual(Object.keys(messages.en).sort(), Object.keys(messages['zh-CN']).sort());
  for (const locale of ['zh-CN', 'en']) {
    for (const key of Object.keys(messages.en)) assert.ok(translate(locale, key).length);
    assert.ok(translate(locale, 'overNote', { score: 123 }).includes('123'));
  }
  assert.equal(translate('unsupported', 'title'), messages['zh-CN'].title);
  assert.throws(() => translate('en', 'missing'), /missing/);
});
test('触屏入口提示点击屏幕，桌面保留空格提示', () => {
  for (const locale of ['zh-CN', 'en']) {
    assert.doesNotMatch(translate(locale, 'readyTouch'), /空格|Space/);
    assert.match(translate(locale, 'ready'), /空格|Space/);
  }
});
test('完整八帧步态按前进距离连续循环，不影响引擎状态', () => {
  const poses = Array.from({ length: 8 }, (_, i) => runPose(i * 18));
  assert.deepEqual(poses.map((p) => p.frame), [0, 1, 2, 3, 4, 5, 6, 7]);
  assert.equal(runPose(144).frame, 0);
  assert.equal(runPose(0).bob, runPose(144).bob);
  assert.ok(poses.some((p) => p.bob !== poses[0].bob));
  assert.ok(poses.every((p) => Number.isFinite(p.bob) && Math.abs(p.bob) <= 3));
});
test('减少动态效果时取消额外身体起伏，仍保留换腿动作', () => {
  assert.equal(runPose(18, true).bob, 0);
  assert.equal(runPose(18, true).lean, 0);
  assert.equal(runPose(18, true).frame, 1);
});
