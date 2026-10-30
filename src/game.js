import { Runner } from './engine.js';
import { Renderer, drawPixelAvatar } from './render.js';
import { readPreferences, savePreference } from './preferences.js';
import { applyTranslations, translate } from './i18n.js';
import { readBestScore, clearBestScore, isNewRecord } from './score.js';

const $ = (id) => document.getElementById(id);
const game = new Runner();
let renderer, soundEnabled = false, audio, lastTime = 0, previousState = 'ready', loadAttempt = 0;
let storage;
try { storage = window.localStorage; } catch { /* 隐私模式允许无存储游戏。 */ }
const preferences = readPreferences(storage);
const t = (key, values) => translate(preferences.locale, key, values);
const touchLayout = matchMedia('(pointer: coarse), (max-width: 700px)');
let loadState = 'loading', departureTimer;
const jumpPointers = new Set(), duckPointers = new Set();
const jumpKeys = new Set(['Space', 'ArrowUp', 'KeyW']);
const duckKeys = new Set(['ArrowDown', 'KeyS']);
const heldJumpKeys = new Set(), heldDuckKeys = new Set();
let best = readBestScore(storage), startingBest = best, wasRecord = false;
const modalOpen = () => !!document.querySelector('dialog[open]');
drawPixelAvatar($('pixel-avatar'), preferences.theme);

function announce(key, values) {
  const deviceKey = touchLayout.matches && ['announceReady', 'announceRunning'].includes(key) ? `${key}Touch` : key;
  $('status').textContent = t(deviceKey, values);
}

function refreshPreferences() {
  document.documentElement.dataset.theme = preferences.theme;
  document.documentElement.lang = preferences.locale;
  document.title = t('pageTitle');
  applyTranslations(document, preferences.locale);
  drawPixelAvatar($('pixel-avatar'), preferences.theme);
  updateUI();
}

function tone(frequency, duration = 0.09) {
  if (!soundEnabled) return;
  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state === 'suspended') void audio.resume().catch(() => {});
    const oscillator = audio.createOscillator(), gain = audio.createGain();
    oscillator.type = 'sine'; oscillator.frequency.setValueAtTime(frequency, audio.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.6, audio.currentTime + duration);
    gain.gain.setValueAtTime(0.055, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duration);
    oscillator.connect(gain); gain.connect(audio.destination); oscillator.start(); oscillator.stop(audio.currentTime + duration);
  } catch { /* 无音频设备或浏览器不支持时保持无声。 */ }
}

function clearInput() {
  jumpPointers.clear(); duckPointers.clear(); heldJumpKeys.clear(); heldDuckKeys.clear();
  game.releaseJump(); game.duck(false);
}

function updateScore() {
  const record = game.state !== 'ready' && isNewRecord(game.score, startingBest);
  $('score').textContent = String(game.score).padStart(5, '0');
  $('score').classList.toggle('new-record', record);
  $('score').setAttribute('aria-label', t(record ? 'recordScore' : 'currentScore', { score: game.score }));
  if (record && !wasRecord && game.state === 'running') announce('announceRecord');
  wasRecord = record;
}

function updateUI() {
  const state = game.state;
  document.body.dataset.state = state;
  $('entrance').hidden = state !== 'ready';
  $('playfield').hidden = state === 'ready';
  $('start').disabled = loadState !== 'ready';
  $('start-hint').textContent = t(loadState === 'ready' ? touchLayout.matches ? 'readyTouch' : 'ready' : loadState === 'error' ? 'loadFailed' : 'loading');
  $('scene').setAttribute('aria-label', t(touchLayout.matches ? 'sceneTouch' : 'scene'));
  $('pause').hidden = state === 'ready' || state === 'over';
  $('pause').textContent = t(state === 'paused' ? 'resume' : 'pause');
  $('home').hidden = state === 'ready';
  $('reset-score').hidden = state !== 'ready';
  $('reset-note').textContent = t('resetNote', { score: best });
  $('overlay').hidden = state !== 'paused' && state !== 'over';
  $('touch-controls').hidden = state !== 'running';
  $('theme').hidden = state !== 'ready';
  $('theme').setAttribute('aria-label', t(preferences.theme === 'dark' ? 'switchLight' : 'switchDark'));
  $('theme').title = t(preferences.theme === 'dark' ? 'switchLight' : 'switchDark');
  $('sound').textContent = t(soundEnabled ? 'soundOn' : 'soundOff');
  document.querySelector('meta[name="theme-color"]').content = state === 'ready' ? preferences.theme === 'dark' ? '#202124' : '#ffffff' : '#eaf5fa';
  updateScore();
  $('best').textContent = String(best).padStart(5, '0');
  $('overlay-title').textContent = t(state === 'over' ? 'overTitle' : 'pausedTitle');
  $('overlay-note').textContent = t(state === 'over' ? 'overNote' : 'pausedNote', { score: game.score });
  $('continue').textContent = t(state === 'over' ? 'again' : 'continue');
  if (state !== previousState) {
    if (state === 'over') {
      best = Math.max(best, game.score);
      try { localStorage.setItem('feiyu-run.best', String(best)); } catch { /* 本次会话仍记录最高分。 */ }
      $('best').textContent = String(best).padStart(5, '0');
      announce('announceOver', { score: game.score });
      tone(190, 0.23); clearInput(); $('continue').focus({ preventScroll: true });
    } else if (state === 'paused') {
      announce('announcePaused'); $('continue').focus({ preventScroll: true });
    } else if (state === 'running') announce('announceRunning');
    previousState = state;
  }
}

function hideDeparture() {
  clearTimeout(departureTimer);
  $('departure-message').hidden = true;
  document.body.classList.remove('arriving');
}

function begin() {
  if (!renderer || modalOpen()) return;
  const fromEntrance = game.state === 'ready';
  clearInput(); hideDeparture(); startingBest = best; game.start(); lastTime = 0;
  renderer.resetScenery();
  updateUI(); renderer.draw(game); $('scene').focus({ preventScroll: true });
  if (fromEntrance) {
    // 文案属于独立装饰层，保留约 3 秒，绝不等待它结束才启动游戏或接收输入。
    $('departure-message').hidden = false;
    document.body.classList.add('arriving');
    departureTimer = setTimeout(hideDeparture, 3400);
  }
}
function pause() {
  if (game.state !== 'running') return;
  clearInput(); game.pause(); updateUI();
}
function resume() {
  if (modalOpen()) return;
  clearInput(); game.resume(); lastTime = 0; updateUI(); $('scene').focus({ preventScroll: true });
}
function jump() { if (game.jump()) tone(640); }
function activate() {
  if (game.state === 'ready' || game.state === 'over') begin();
  else if (game.state === 'paused') resume();
}

async function loadSprite() {
  const attempt = ++loadAttempt;
  loadState = 'loading'; updateUI();
  $('load-error').hidden = true; $('retry-load').hidden = true;
  const sprite = new Image(), runSprite = new Image();
  const timer = setTimeout(() => failed(), 15000);
  function failed() {
    if (attempt !== loadAttempt) return;
    clearTimeout(timer); loadAttempt++;
    loadState = 'error'; updateUI(); $('load-error').hidden = false; $('retry-load').hidden = false;
    announce('announceError');
  }
  const loaded = (image, source) => new Promise((resolve, reject) => {
    image.onload = resolve; image.onerror = reject; image.src = new URL(source, import.meta.url).href;
  });
  Promise.all([
    loaded(sprite, '../assets/feiyu-sprites.png'),
    loaded(runSprite, '../assets/feiyu-run-cycle.png'),
  ]).then(() => {
    if (attempt !== loadAttempt) return;
    clearTimeout(timer); renderer = new Renderer($('scene'), sprite, runSprite); game.resize(renderer.width);
    loadState = 'ready'; updateUI(); announce('announceReady');
  }).catch(failed);
}

$('start').addEventListener('click', begin);
document.addEventListener('click', (event) => {
  if (!touchLayout.matches || game.state !== 'ready' || loadState !== 'ready' || modalOpen() || event.defaultPrevented) return;
  if (!(event.target instanceof Element) || event.target.closest('button, a, nav, dialog')) return;
  begin();
});
touchLayout.addEventListener('change', updateUI);
$('retry-load').addEventListener('click', loadSprite);
$('continue').addEventListener('click', activate);
$('pause').addEventListener('click', () => game.state === 'paused' ? resume() : pause());
$('home').addEventListener('click', () => {
  clearInput(); hideDeparture(); game.reset(); game.state = 'ready'; updateUI(); $('start').focus({ preventScroll: true });
});
$('sound').addEventListener('click', () => {
  soundEnabled = !soundEnabled; updateUI();
  $('sound').setAttribute('aria-pressed', String(soundEnabled)); tone(520);
});
$('theme').addEventListener('click', () => {
  preferences.theme = preferences.theme === 'dark' ? 'light' : 'dark';
  savePreference(storage, 'theme', preferences.theme); refreshPreferences();
});
$('language').addEventListener('click', () => {
  preferences.locale = preferences.locale === 'zh-CN' ? 'en' : 'zh-CN';
  savePreference(storage, 'locale', preferences.locale); refreshPreferences();
  const key = game.state === 'over' ? 'announceOver' : game.state === 'paused' ? 'announcePaused' : game.state === 'running' ? 'announceRunning' : loadState === 'ready' ? 'announceReady' : loadState === 'error' ? 'announceError' : 'loading';
  announce(key, { score: game.score });
  if (game.state === 'running') $('scene').focus({ preventScroll: true });
});
$('help').addEventListener('click', () => { pause(); $('help-dialog').showModal(); });
$('help-dialog').addEventListener('close', () => {
  clearInput();
  if (game.state === 'paused') $('continue').focus({ preventScroll: true });
});
$('reset-score').addEventListener('click', () => {
  if (game.state !== 'ready') return;
  clearInput(); $('reset-error').hidden = true; updateUI(); $('reset-dialog').showModal();
});
$('confirm-reset').addEventListener('click', () => {
  if (!$('reset-dialog').open || game.state !== 'ready') return;
  if (!clearBestScore(storage)) { $('reset-error').hidden = false; return; }
  best = 0; startingBest = 0; updateUI(); $('reset-dialog').close('confirmed'); announce('scoreCleared');
});
$('reset-dialog').addEventListener('close', clearInput);

document.addEventListener('keydown', (event) => {
  if (modalOpen() || event.ctrlKey || event.metaKey || event.altKey) return;
  const code = event.code;
  // 保留 Tab 选中设置按钮后的原生 Space/Enter 激活行为。
  if (event.target instanceof HTMLButtonElement && !['start', 'continue'].includes(event.target.id)) return;
  if (![...jumpKeys, ...duckKeys, 'KeyP', 'Escape', 'Enter'].includes(code)) return;
  event.preventDefault();
  if (event.repeat) return;
  if (code === 'KeyP' || code === 'Escape') { if (game.state === 'paused') resume(); else pause(); return; }
  if (code === 'Enter') { activate(); return; }
  if (jumpKeys.has(code)) {
    heldJumpKeys.add(code);
    if (game.state !== 'running') { activate(); heldJumpKeys.add(code); }
    else jump();
  } else if (duckKeys.has(code)) { heldDuckKeys.add(code); game.duck(true); }
});
document.addEventListener('keyup', (event) => {
  heldJumpKeys.delete(event.code); heldDuckKeys.delete(event.code);
  if (jumpKeys.has(event.code) && !heldJumpKeys.size && !jumpPointers.size) game.releaseJump();
  if (duckKeys.has(event.code) && !heldDuckKeys.size && !duckPointers.size) game.duck(false);
});

function bindHold(id, pointers, down, up) {
  const button = $(id);
  button.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    event.preventDefault(); button.setPointerCapture(event.pointerId); pointers.add(event.pointerId); down();
  });
  const release = (event) => {
    pointers.delete(event.pointerId);
    if (!pointers.size) up();
  };
  button.addEventListener('pointerup', release);
  button.addEventListener('pointercancel', release);
  button.addEventListener('lostpointercapture', release);
  // 为屏幕阅读器生成的 click 保留等价操作。
  button.addEventListener('click', (event) => { if (event.detail === 0) { down(); up(); } });
}
bindHold('jump', jumpPointers, jump, () => { if (!heldJumpKeys.size) game.releaseJump(); });
bindHold('duck', duckPointers, () => game.duck(true), () => { if (!heldDuckKeys.size) game.duck(false); });
$('scene').addEventListener('pointerdown', (event) => {
  if (game.state !== 'running' || event.button !== 0) return;
  event.preventDefault(); $('scene').setPointerCapture(event.pointerId); jumpPointers.add(event.pointerId); jump();
});
for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
  $('scene').addEventListener(type, (event) => { jumpPointers.delete(event.pointerId); if (!jumpPointers.size && !heldJumpKeys.size) game.releaseJump(); });
}
window.addEventListener('blur', pause);
document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
window.addEventListener('pagehide', pause);
window.addEventListener('resize', () => {
  if (renderer) { pause(); renderer.resize(); game.resize(renderer.width); renderer.draw(game); }
});
matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (event) => { if (renderer) renderer.reduced = event.matches; });

function frame(time) {
  if (renderer && game.state !== 'ready') {
    const dt = lastTime ? (time - lastTime) / 1000 : 0;
    game.update(dt); renderer.draw(game);
    if (game.state !== previousState) updateUI();
    else if (game.state === 'running') updateScore();
  }
  lastTime = time; requestAnimationFrame(frame);
}
refreshPreferences(); void loadSprite(); requestAnimationFrame(frame);
