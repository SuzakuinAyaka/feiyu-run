# 素材记录

## 入口

`src/render.js` 中的 `drawPixelAvatar` 为自绘灰色像素鲸鱼女仆小图，用于入口。`assets/favicon.svg` 为自绘简化鲸鱼图标。

## 游戏内角色

- 文件：`assets/feiyu-sprites.png`，1536 × 1024 RGBA。
- 生成方式：内置 imagegen，2026-10-30。未使用 API Key 或 CLI 回退。
- 参考：用户提供的 `D:/Desktop/dafeiyu-chibi-character-sheet.png`。参考图本身不进入发布产物。没有把此参考推断成官方设定或官方授权。
- 实际画面：保留彩色动漫细节的六姿态动作图，分别为三个跑动姿态、跳跃、下蹲和碰撞。背景透明；源 PNG 在透明像素中保留 RGB，不影响正常 Canvas alpha 合成。
- `src/render.js` 中以明确的源矩形选取动作，不依赖生成器严格等分。头发与尾巴不参与物理碰撞。
- 生成结果偏向精细像素动漫风，并非手绘逐帧动画；跑步用三个姿态轮换。

### 使用的生成提示词

Use case: illustration-story. Create a production GAME SPRITE SHEET for a cute pixel-art endless runner. The attached picture is CHARACTER REFERENCE, not an edit target. Preserve recognizable identity: chibi blue long hair fading to light blue, blue eyes, white ruffled maid headband, navy maid dress with white apron, blue bows, navy shoes, large blue whale tail behind. Pixel art with crisp square pixels, restrained 16-bit game palette, navy outlines, no anti-aliasing. All characters face RIGHT, three-quarter side view. Transparent background, no floor, no shadow, no text, no grid lines. EXACT layout: canvas landscape 1536x1024, 3 columns and 2 rows, six equal cells 512x512. Each full-body sprite fits within its cell with 70px padding, centred at x 256/768/1280 and feet at y 440 (top row) or y 952 (bottom row). Similar sizes in all frames; sprite silhouette ~300px wide including tail and ~360px tall. Row 1: run stride left leg forward; run passing pose; run stride right leg forward. Row 2: jumping with knees tucked and delighted expression; crouching low compressed pose head bent forward, height ~220px from same feet baseline; dizzy stopped after bump, little closed eyes. Keep EXACT same outfit and character across all six. No props, no background. Beautiful expressive readable small sprite suitable to display at 80 pixels tall. Do not include any official logos; apron plain.

## 场景及声音

天空、云、海面、跑道、礁石、漂流木与海鸥由 Canvas 自行绘制。音效由 Web Audio 的振荡器即时合成。没有使用第三方摄影、视频、字体、精灵图或音频。
