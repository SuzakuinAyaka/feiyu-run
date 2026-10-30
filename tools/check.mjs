import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const html = await readFile(resolve(root, 'index.html'), 'utf8');
const css = await readFile(resolve(root, 'styles.css'), 'utf8');
const game = await readFile(resolve(root, 'src/game.js'), 'utf8');
for (const [, id] of game.matchAll(/\$\('([^']+)'\)/g)) {
  assert.ok(html.includes(`id="${id}"`), `页面缺少 #${id}`);
}
for (const [, file] of html.matchAll(/(?:href|src)="(\.\/[^"?#]+)"/g)) {
  assert.ok((await stat(resolve(root, file))).isFile(), `缺少资源 ${file}`);
}
assert.ok(!/(?:src|href)="\/(?!\/)/.test(html), '项目站点不得使用站点根路径');
assert.ok(!/https?:\/\//.test(html + css + game), '首屏不应依赖远程资源');
const png = await readFile(resolve(root, 'assets/feiyu-sprites.png'));
assert.equal(png.subarray(1, 4).toString(), 'PNG');
assert.equal(png.readUInt32BE(16), 1536);
assert.equal(png.readUInt32BE(20), 1024);
assert.equal(png[25], 6, '角色素材应带 alpha 通道');
console.log('页面引用、DOM 绑定、子路径兼容性和角色 PNG 校验通过。');
