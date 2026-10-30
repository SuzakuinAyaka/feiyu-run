import test from 'node:test';
import assert from 'node:assert/strict';
import { readBestScore, clearBestScore, isNewRecord } from '../src/score.js';

test('读取原有最高分键，并对非法值及存储异常回退为零', () => {
  assert.equal(readBestScore({ getItem: (key) => key === 'feiyu-run.best' ? '128' : null }), 128);
  for (const value of [null, 'NaN', 'Infinity', '-1']) assert.equal(readBestScore({ getItem: () => value }), 0);
  assert.equal(readBestScore({ getItem() { throw new Error('blocked'); } }), 0);
});
test('清空只删除最高分，保留语言、主题和其他站点数据', () => {
  const values = new Map([['feiyu-run.best', '128'], ['feiyu-run.theme', 'light'], ['feiyu-run.locale', 'en'], ['other', 'keep']]);
  assert.equal(clearBestScore({ removeItem: (key) => values.delete(key) }), true);
  assert.equal(values.has('feiyu-run.best'), false);
  assert.equal(values.size, 3);
});
test('清空失败必须报告，无持久化存储时允许清空会话记录', () => {
  assert.equal(clearBestScore({ removeItem() { throw new Error('blocked'); } }), false);
  assert.equal(clearBestScore(undefined), true);
});
test('严格超过本局开始时的最高分才触发新纪录，零分与平分不触发', () => {
  assert.equal(isNewRecord(0, 0), false);
  assert.equal(isNewRecord(128, 128), false);
  assert.equal(isNewRecord(127, 128), false);
  assert.equal(isNewRecord(129, 128), true);
  assert.equal(isNewRecord(1, 0), true);
});
