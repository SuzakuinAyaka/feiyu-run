import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const target = resolve(root, 'dist');
// 目标固定为项目内 dist，绝不接受外部路径参数。
await rm(target, { recursive: true, force: true });
await mkdir(target, { recursive: true });
for (const name of ['index.html', 'styles.css', 'src', 'assets']) {
  await cp(resolve(root, name), resolve(target, name), { recursive: true });
}
await writeFile(resolve(target, '.nojekyll'), '');
console.log('静态站点已构建至 dist/（仅包含页面、脚本和素材）。');
