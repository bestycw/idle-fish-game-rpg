import type { PlayerState, SaveAdapter } from '@moyu/game-core';

const KEY = 'moyu-xiuxian-save-v4';

export const localSaveAdapter: SaveAdapter = {
  load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      return JSON.parse(raw) as PlayerState;
    } catch {
      return null;
    }
  },
  save(state) {
    localStorage.setItem(KEY, JSON.stringify(state));
  },
  clear() {
    localStorage.removeItem(KEY);
  },
};
