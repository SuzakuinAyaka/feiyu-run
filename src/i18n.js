export const messages = {
  'zh-CN': {
    title: '大肥鱼快跑', pageTitle: '大肥鱼快跑 · Feiyu Run',
    description: '点按大肥鱼或按空格键，和蓝色鲸鱼女仆一起沿着海岸奔跑。免费静态同人跑酷小游戏。',
    entrance: '游戏入口', start: '开始大肥鱼快跑', loading: '大肥鱼正在赶来…',
    ready: '点按大肥鱼或按空格键即可开玩', loadFailed: '大肥鱼还没赶到',
    loadError: '角色素材未能加载，请检查网络后重试。', retry: '重新加载',
    scene: '跑酷画面。空格或上方向键跳跃，按住跳得更高；下方向键下蹲；P 或 Escape 暂停。',
    scores: '分数', pause: '暂停', resume: '继续', home: '返回入口', soundOn: '音效：开', soundOff: '音效：关',
    help: '操作说明', settings: '游戏设置', preferences: '外观与语言',
    lightTheme: '浅色模式', darkTheme: '深色模式', switchLight: '切换到浅色模式', switchDark: '切换到深色模式',
    language: 'English', switchLanguage: 'Switch to English',
    pausedTitle: '休息一下', pausedNote: '海岸线会在这里等你。', overTitle: '本局结束',
    overNote: '跑了 {score} 分，再向前一点？', again: '再跑一次', continue: '继续跑',
    touch: '触屏操作', duck: '下蹲', jump: '跳跃', duckLabel: '按住下蹲', jumpLabel: '跳跃，按住跳得更高',
    howTo: '沿着海岸线，跳过礁石和漂流木，下蹲躲过海鸥。跑得越远，速度越快。',
    jumpHelp: '空格 / ↑ / W，按住跳得更高', duckHelp: '按住 ↓ / S，空中按下快速落地',
    pauseHelp: 'P / Escape；离开页面自动暂停', restart: '重开', restartHelp: '结束后按空格 / Enter，或点按重开',
    phoneHelp: '手机使用屏幕下方的两个按钮。最高分仅保存在当前浏览器；音效默认关闭。',
    credit: '非官方同人项目，与 DeepSeek 无隶属、合作或授权关系。角色依据用户提供的参考图生成，代码与游戏图形自行实现。',
    gotIt: '知道了', noScript: '大肥鱼快跑需要 JavaScript，请在浏览器中启用后刷新。',
    announceReady: '游戏已准备好。点按大肥鱼或按空格键开始。',
    announceRunning: '开始跑酷。空格跳跃，下方向键下蹲。', announcePaused: '游戏已暂停。请主动继续。',
    announceOver: '本局结束，{score} 分。按空格或 Enter 再跑一次。', announceError: '角色素材加载失败，可以重新加载。',
    entering: '沿着海风，出发。',
  },
  en: {
    title: 'Feiyu Run', pageTitle: 'Feiyu Run · A seaside runner',
    description: 'Tap Feiyu or press Space to run along the coast with a blue whale maid. A free fan-made endless runner.',
    entrance: 'Game entrance', start: 'Start Feiyu Run', loading: 'Feiyu is on her way…',
    ready: 'Tap Feiyu or press Space to play', loadFailed: 'Feiyu hasn’t arrived yet',
    loadError: 'The character could not load. Check your connection and try again.', retry: 'Try again',
    scene: 'Runner game. Space or Up to jump; hold to jump higher. Down to duck. P or Escape to pause.',
    scores: 'Score', pause: 'Pause', resume: 'Resume', home: 'Back to start', soundOn: 'Sound: on', soundOff: 'Sound: off',
    help: 'How to play', settings: 'Game settings', preferences: 'Appearance and language',
    lightTheme: 'Light mode', darkTheme: 'Dark mode', switchLight: 'Switch to light mode', switchDark: 'Switch to dark mode',
    language: '简体中文', switchLanguage: '切换到简体中文',
    pausedTitle: 'Take a breather', pausedNote: 'The coast will be right here.', overTitle: 'Game over',
    overNote: '{score} points. A little further next time?', again: 'Run again', continue: 'Keep running',
    touch: 'Touch controls', duck: 'Duck', jump: 'Jump', duckLabel: 'Hold to duck', jumpLabel: 'Jump; hold to jump higher',
    howTo: 'Run along the coast. Jump over rocks and driftwood; duck under seagulls. The further you go, the faster it gets.',
    jumpHelp: 'Space / ↑ / W; hold to jump higher', duckHelp: 'Hold ↓ / S; press in the air to drop faster',
    pauseHelp: 'P / Escape; pauses when you leave the page', restart: 'Restart', restartHelp: 'After a run, press Space / Enter or tap Run again',
    phoneHelp: 'On mobile, use the two buttons below. Your best score stays in this browser. Sound is off by default.',
    credit: 'Unofficial fan project. Not affiliated with, partnered with, or authorized by DeepSeek. Character art was generated from a user-provided reference; game code and scenery were created for this project.',
    gotIt: 'Got it', noScript: 'Feiyu Run needs JavaScript. Enable it in your browser and refresh.',
    announceReady: 'Ready to play. Tap Feiyu or press Space to start.',
    announceRunning: 'Running. Space to jump, Down to duck.', announcePaused: 'Game paused. Resume when you are ready.',
    announceOver: 'Game over. {score} points. Press Space or Enter to run again.', announceError: 'Character failed to load. You can try again.',
    entering: 'Off we go, with the sea breeze.',
  },
};

export function translate(locale, key, values = {}) {
  const text = (messages[locale] || messages['zh-CN'])[key];
  if (text === undefined) throw new Error(`Missing translation: ${key}`);
  return text.replace(/\{(\w+)\}/g, (_, name) => String(values[name] ?? `{${name}}`));
}

export function applyTranslations(root, locale) {
  for (const element of root.querySelectorAll('[data-i18n]')) element.textContent = translate(locale, element.dataset.i18n);
  for (const attribute of ['aria-label', 'content']) {
    for (const element of root.querySelectorAll(`[data-i18n-${attribute}]`)) {
      element.setAttribute(attribute, translate(locale, element.getAttribute(`data-i18n-${attribute}`)));
    }
  }
}
