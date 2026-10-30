# 大肥鱼跑酷技术调研

日期：2026-10-30。后台调研经主 Agent 收敛到实际使用的结论；不把未找到角色授权解释为获得授权。

## 玩法来源

Chromium Dino 源码包括 `offline.ts`、`trex.ts`、`obstacle.ts`、`horizon.ts` 与 `distance_meter.ts`，分别涉及调度、角色、障碍、地平线与计分。[Chromium 官方源码目录](https://chromium.googlesource.com/chromium/src/+/HEAD/components/neterror/resources/dino_game/)

键盘跳跃、可变高度、下蹲、加速、碰撞结束及重开可从对应源码核对。它以 Canvas 绘制并通过 `requestAnimationFrame` 驱动更新。[offline.ts](https://chromium.googlesource.com/chromium/src/+/HEAD/components/neterror/resources/dino_game/offline.ts)、[trex.ts](https://chromium.googlesource.com/chromium/src/+/HEAD/components/neterror/resources/dino_game/trex.ts)

本项目只借鉴用户指定的交互和布局，逻辑、场景和入口角色自行实现，没有复制 Chromium 源码、恐龙精灵图或声音。若后续复用代码或素材，应核对其适用许可证。[Chromium LICENSE](https://chromium.googlesource.com/chromium/src/+/HEAD/LICENSE)

## GitHub Pages

Pages 支持从分支根目录、`/docs` 或 Actions 产物发布静态站点。[创建站点](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site)、[配置发布源](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)

项目站点通常位于 `https://<用户>.github.io/<仓库>/`。本实现使用相对资源路径，并在本地 `/feiyu-run/` 前缀下做浏览器验证。[GitHub Pages 简介](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)

Actions 流程为测试、检查、构建 `dist/`，再配置 Pages、上传并部署。部署任务需具备 `pages: write`、`id-token: write`，且通过 `needs` 等待构建任务。环境为 `github-pages`。[官方工作流说明](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)

2026-10-30 主 Agent 复核官方示例：`checkout@v6`、`configure-pages@v5`、`upload-pages-artifact@v4`、`deploy-pages@v4`；Node 设置使用 `setup-node@v6`，Node 24。[Pages 示例](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)、[setup-node](https://github.com/actions/setup-node)

## 角色来源与实现选择

具体造型来自本次用户提供的蓝色长发鲸鱼女仆参考图，不作为 DeepSeek 官方设定。游戏使用生成的新动作图，入口为自绘灰色像素角色。提示词及素材清单见 [素材记录](assets.md)。

本次没有确认 DeepSeek 官方发布这套形象或授权本项目，不将其写成官方吉祥物，不复制其他社区桌宠素材。操作说明中标注「非官方同人项目，与 DeepSeek 无隶属、合作或授权关系」。该说明不是权利许可的替代品。

原生 Canvas 与 ES modules，无运行时依赖。确定性引擎与浏览器输入、渲染分开，用 Node 内置测试器验证物理和状态。头发与尾巴不计入碰撞，轻点也能跳过普通礁石；这些是本项目的手感选择，不是 Chrome 内部数值复刻。
