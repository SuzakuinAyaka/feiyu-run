# 大肥鱼快跑 · Feiyu Run

蓝色鲸鱼女仆的海边跑酷小游戏。入口模仿 Chrome 小恐龙的深色留白、小像素角色和开玩提示；进入游戏后切换彩色动漫角色与海岸场景。

纯静态 HTML / CSS / JavaScript / Canvas，无后端，无运行时依赖，无外部字体或追踪请求。

## 本地运行

需要 Node.js 22 及以上，无须 `npm install`。

```powershell
npm run dev
```

打开终端输出的本地地址，默认 [http://127.0.0.1:4173](http://127.0.0.1:4173)。ES modules 需要 HTTP 服务，不能直接双击 HTML。

## 操作

| 操作 | 电脑 | 手机 |
| --- | --- | --- |
| 开始 | 点按像素角色 / 空格 / ↑ / Enter | 点按像素角色 |
| 跳跃 | 空格 / ↑ / W；按住跳得更高 | 按住跳跃按钮，或点按游戏画面 |
| 下蹲 | 按住 ↓ / S；空中按下加速落地 | 按住下蹲按钮 |
| 暂停 / 继续 | P / Escape / 页面按钮 | 页面按钮 |
| 重开 | 空格 / Enter / 重开按钮 | 重开按钮 |

碰到礁石、漂流木或海鸥后本局结束，头发和尾巴不参与碰撞判定。速度逐渐增加且有上限。离开页面、打开操作说明或调整窗口时自动暂停，返回后需要主动继续。

最高分仅保存在当前浏览器的 `localStorage`；禁用存储时仍可游戏。音效默认关闭，通过 Web Audio 即时合成，无背景音乐。减少动态效果设置会停止装饰性云与海浪漂移，保留跑酷所需的运动。

## 验证与构建

```powershell
npm test
npm run check
npm run build
node tools/serve.mjs --dist --subpath --port 4174
```

最后一个命令在 `/feiyu-run/` 下提供构建产物，用于检查 GitHub Pages 项目路径。`dist/` 仅包含发布需要的文件，构建时会替换该目录。

## GitHub Pages

仓库内已配置 `.github/workflows/pages.yml`。将本项目上传至你拥有的 GitHub 仓库后，在仓库 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**。推送到 `master` 或 `main` 会先测试、检查和构建，再发布 `dist/`；也可以手动运行工作流。

项目站点地址通常是 `https://<用户名>.github.io/<仓库名>/`。资源全部使用相对路径，支持仓库子路径部署。实际发布地址以 Actions 的部署结果为准。

## 目录

- `src/engine.js`：状态、物理、障碍、计分及碰撞。
- `src/game.js`：输入、UI、生命周期、存储、音效。
- `src/render.js`：入口像素角色、游戏场景与动漫动作图绘制。
- `assets/`：本地角色动作图与图标。
- `tests/`：核心引擎测试。
- `tools/`：无依赖服务、检查及构建工具。
- `docs/`：调研、实现方案、素材来源与验证记录。

## 说明

非官方同人项目，与 DeepSeek 无隶属、合作或授权关系。角色依据用户提供的参考图生成，不将该参考图随站点公开分发，不使用其他桌宠仓库的素材。具体素材来源及生成提示词见 [素材说明](docs/assets.md)，技术参考见 [调研记录](docs/research.md)。
