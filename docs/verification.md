# 验证记录

日期：2026-10-30；平台：Windows；Node：24.22.1。

## 已执行

- `npm test`：10 项核心测试通过。覆盖待机、自动前进、按住/松开高度差、禁止二段跳、轻点高度、下蹲碰撞盒、海鸥碰撞与躲避、碰撞冻结和重开、暂停、加速上限与生成间距、卡顿限制、矩形边界。
- 测试先于引擎实现，初次缺少模块时失败；轻点高度测试实测失败（仅约 15.4 单位），调整松开速度后通过。即时重复跳跃测试也捕获过 y 尚未变化时重复起跳的问题。
- `npm run check`：JavaScript 语法、页面资源引用、DOM 绑定、项目相对路径与 PNG 格式检查通过。
- `npm run build`：成功生成 `dist/`，仅包含 HTML、CSS、三个模块、角色图、图标与 `.nojekyll`。
- design-taste `lint.mjs index.html styles.css src`：0 FAIL / 0 WARN。
- 已安装 Chromium（Playwright 缓存 revision 1248）通过临时服务实际加载 `/feiyu-run/`。14 组浏览器验收通过，截图及原始结果保留在本机忽略目录 `test-results/`，不进入发布产物。

## 浏览器实测范围

| 场景 | 实际检查 |
| --- | --- |
| 1440 × 900 | 像素入口、空格开玩、动漫场景、真实键盘跳跃与下蹲、暂停继续、实际碰撞、Enter 重开、刷新最高分、音效按钮切换 |
| 375 / 390 × 844 | 入口与游戏无横向溢出，真实 CDP 触摸跳跃、touchCancel 释放、下蹲与释放，双按钮可见 |
| 768 × 1024 | 入口和游戏布局无横向溢出 |
| 生命周期 | 分发 blur 后暂停，focus 后不自动继续；操作说明打开时暂停，原生 Escape 关闭后仍暂停 |
| 降级 | 禁止 localStorage 且启用 reduced-motion 时可游戏；阻断角色 PNG 后显示错误和重试，解除阻断后恢复 |
| 资源 | 桌面子路径资源无 HTTP 4xx，页面无捕获到的运行时异常 |

blur/focus 为浏览器内分发的事件，不冒充跨应用实切；手机为设备仿真，不是实体手机。音效开关及 Web Audio 路径已执行，但无头浏览器未做主观听音验收。Firefox、Safari 与实体 iOS 未验证。

## 设计检查与用户指定例外

design-taste `inspect.mjs` 在 1440、768、390 上完成入口测量并生成截图。原始报告为 **6 FAIL / 3 WARN**：缺少四张图片、无大视觉焦点、不可见大标题、内容未铺满、无可见 h1、无入场动画；警告涉及无填充主按钮、无视频与大面积留白。

这些营销页指标与用户明确要求的 Chrome 小恐龙式入口冲突：大面积空白、小像素角色与一句提示。因此保留需求，不添加照片、巨大标题或无关动画消除报告。开始入口为可聚焦的原生按钮，h1 供辅助技术读取；Canvas 运动不会计入检查器的 DOM 动画计数。**不声称 inspector 为 0 FAIL。**

### ROUND 1

Seen in one second: 深灰页面上的像素鲸鱼女仆与开玩提示。

Idea (one sentence): 熟悉的小恐龙式像素入口，启动后进入大肥鱼的彩色海岸。

Live thing: 实际可玩的跳跃、下蹲与无尽跑酷。

Layout words by section: entrance=窄列留白 / game=全屏横向跑道 / help=原生对话框。

Scores: design 7 · usability 8 · creativity 7 · content 8 → weighted 7.4；按 Skill 原始 FAIL 上限记为 6.0，作为风格适用性限制记录，不宣称第三方评分。

Caps applied: inspector 的营销页规则，保留用户指定例外。

Top three problems (most visible first), each with the screenshot it shows in and the fix:

1. `desktop-jump.png`：动作源矩形边界带入邻帧杂点。缩小相邻边界后重拍，手机跳跃截图未见杂点。
2. `desktop-game.png`：焦点转移后出现醒目的全屏蓝框。改为低对比度海蓝键盘焦点框，其他按钮保留清晰焦点。
3. `game-390.png`：高窄屏中的角色比桌面小。这是保留反应跑道宽度的取舍；实际约 66px 高，双触屏按钮留在下方，后续可决定是否进一步放大。
