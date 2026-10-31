const supported = { theme: ['dark', 'light'], locale: ['zh-CN', 'en'], touchButtons: ['on', 'off'] };
const defaults = { theme: 'dark', locale: 'zh-CN', touchButtons: 'on' };

export function readPreferences(storage) {
  return Object.fromEntries(Object.keys(defaults).map((key) => {
    let value;
    try { value = storage?.getItem(`feiyu-run.${key}`); } catch { /* 使用明确默认值，不跟随系统。 */ }
    return [key, supported[key].includes(value) ? value : defaults[key]];
  }));
}

export function savePreference(storage, key, value) {
  if (!supported[key]?.includes(value)) return false;
  try { storage?.setItem(`feiyu-run.${key}`, value); return !!storage; } catch { return false; }
}
