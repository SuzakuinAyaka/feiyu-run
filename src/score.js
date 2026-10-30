const BEST_KEY = 'feiyu-run.best';

export function readBestScore(storage) {
  try {
    const value = Number(storage?.getItem(BEST_KEY));
    return Number.isFinite(value) ? Math.min(99999999, Math.max(0, Math.floor(value))) : 0;
  } catch { return 0; }
}

export function clearBestScore(storage) {
  try { storage?.removeItem(BEST_KEY); return true; } catch { return false; }
}

export const isNewRecord = (score, startingBest) => score > startingBest;
