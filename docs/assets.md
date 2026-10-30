# 素材记录

## 入口

`src/render.js` 中的 `drawPixelAvatar` 为自绘灰色像素鲸鱼女仆小图，用于入口。`assets/favicon.svg` 为自绘简化鲸鱼图标。

入口主题切换使用 `index.html` 内联的自绘太阳/月亮 SVG，使用 `currentColor` 跟随深浅主题与悬停状态，不依赖第三方图标库。图标只作视觉呈现，按钮本身提供双语 `aria-label` 与 `title`。

## 游戏内角色

- 文件：`assets/feiyu-sprites.png`，1536 × 1024 RGBA。
- 生成方式：内置 imagegen，2026-10-30。未使用 API Key 或 CLI 回退。
- 参考：用户提供的 `D:/Desktop/dafeiyu-chibi-character-sheet.png`。参考图本身不进入发布产物。没有把此参考推断成官方设定或官方授权。
- 实际画面：保留彩色动漫细节的六姿态动作图，分别为三个跑动姿态、跳跃、下蹲和碰撞。背景透明；源 PNG 在透明像素中保留 RGB，不影响正常 Canvas alpha 合成。
- `src/render.js` 中以明确的源矩形选取动作，不依赖生成器严格等分。头发与尾巴不参与物理碰撞。
- 此图继续用于跳跃、下蹲与碰撞姿态；跑步已改用下述专用八帧图。

### 使用的生成提示词

Use case: illustration-story. Create a production GAME SPRITE SHEET for a cute pixel-art endless runner. The attached picture is CHARACTER REFERENCE, not an edit target. Preserve recognizable identity: chibi blue long hair fading to light blue, blue eyes, white ruffled maid headband, navy maid dress with white apron, blue bows, navy shoes, large blue whale tail behind. Pixel art with crisp square pixels, restrained 16-bit game palette, navy outlines, no anti-aliasing. All characters face RIGHT, three-quarter side view. Transparent background, no floor, no shadow, no text, no grid lines. EXACT layout: canvas landscape 1536x1024, 3 columns and 2 rows, six equal cells 512x512. Each full-body sprite fits within its cell with 70px padding, centred at x 256/768/1280 and feet at y 440 (top row) or y 952 (bottom row). Similar sizes in all frames; sprite silhouette ~300px wide including tail and ~360px tall. Row 1: run stride left leg forward; run passing pose; run stride right leg forward. Row 2: jumping with knees tucked and delighted expression; crouching low compressed pose head bent forward, height ~220px from same feet baseline; dizzy stopped after bump, little closed eyes. Keep EXACT same outfit and character across all six. No props, no background. Beautiful expressive readable small sprite suitable to display at 80 pixels tall. Do not include any official logos; apron plain.

## 新跑步动作图

- 文件：`assets/feiyu-run-cycle.png`，1536 × 1024 RGBA，内置 imagegen 生成，2026-10-30。
- 原因：原三姿态动作近似，换腿和重心变化不足。新图为 4 × 2 的八帧彩色动漫跑步图，包含落脚、承重、摆腿及腾空姿态；不是对动作质量作逐帧手绘的声明。
- 参考：原游戏角色图和用户角色参考图。首轮图的帧间距不足，第二轮要求缩小角色并隔开透明间距；只将第二轮选定结果纳入项目。
- 使用实际 alpha 轮廓确定 `runFrames`，各帧统一缩放倍率、脚底对齐；`src/animation.js` 以距离驱动步频，减少动态效果时保留步态、取消额外起伏与轻微倾斜。
- 实际渲染的八帧对照图保存在本地 `test-results/features/run-contact-sheet.png`，不随网站发布。

### 首轮生成提示词

Use case: illustration-story. Production sprite animation sheet, EXACT same recognizable blue-haired chibi whale maid as references, but NEW FULL SMOOTH RUN CYCLE. Reference 1 establishes the game character and reference 2 her costume. Anime illustration, clean expressive chibi with blue long flowing hair, white ruffled maid headband, navy maid dress, plain white apron, blue bows, navy shoes, large blue whale tail. All frames face RIGHT at identical three-quarter side angle, same proportions and outfit. TRUE TRANSPARENT background, no backdrop, no floor, no shadows, no text, no captions, no grid. Make a landscape 1536x1024 sprite sheet arranged EXACTLY 4 columns x 2 rows, eight equal 384x512 cells. Whole character including tail stays completely INSIDE each cell with at least 24px empty margin. Each sprite ~330px wide and ~420px tall, feet baseline y=460 in row1 and y=972 in row2. Row-major order 8 distinct successive poses at equally spaced times through ONE continuous energetic running stride. Frame1 LEFT heel contact far in front, RIGHT leg extended behind; frame2 left leg weighted/support knee bent, right leg lifts forward; frame3 passing pose right knee driving forward, left leg under body; frame4 flight right leg reaching forward, left folded behind; frame5 RIGHT heel contact far in front, LEFT leg extended behind (opposite of frame1); frame6 right knee compresses supporting weight, left drives forward; frame7 passing left knee driving forward right under body; frame8 flight left reaching forward right folded behind, loops seamlessly to frame1. IMPORTANT feet and knees must genuinely change position, not 8 near-identical standing dolls. Arms pump opposite to legs, torso leans forward, hair and whale tail trail and swing gently with stride, skirt/apron flutter. Keep face and head size consistent. No duplicating the same foot forward in every frame. Final professional charming anime game art, smooth clean strokes and beautifully legible tiny poses, no official logos.

### 第二轮修正提示词

Edit this sprite sheet to fix its game-engine layout. KEEP character design, smooth anime style and the eight distinct running poses. Required 1536x1024 canvas with EXACT 4-column x 2-row grid. All characters must be SMALLER, with each whole character including whale tail and hair fitting in a 280px-wide x 360px-high bounding box. Eight completely isolated sprites on true transparent background, no glow or shadow. CELL CENTRES top row (192,256), (576,256), (960,256), (1344,256); bottom row same x values at y768. Feet exactly at y440 on top row and y952 on bottom row. This leaves at least 50 transparent pixels at both sides of EACH cell, and at least70 transparent pixels at top/bottom. Do not enlarge characters to fill all available canvas. Important equal head sizes and body scales across frames. Strongly emphasize alternate LEFT and RIGHT leg contact, feet pass under pelvis in passing poses, arms swing opposite to legs. Keep blue whale maid costume consistent, face right. No divider lines, no text, no floor, no background; actual transparent alpha.

## 场景及声音

天空、太阳、云、海面、跑道、半透明海星、扇形贝壳和椰树、远海海豚与虎鲸、前景礁石/漂流木/海鸥均由 Canvas 自行绘制。远景装饰位于 `src/scenery.js`，不新增外部图像或音频请求。音效由 Web Audio 的振荡器即时合成。没有使用第三方摄影、视频、字体、精灵图或音频。
