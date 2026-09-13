import type { PlayerState } from '../shared/types.js';

export function markItemSeen(state: PlayerState, id: string): PlayerState {
  const prev = state.seenItemIds ?? [];
  if (prev.includes(id)) return state;
  const living = new Set(state.inventory.map((e) => e.id));
  const next = [...prev, id].filter((x) => living.has(x) || x === id);
  return { ...state, seenItemIds: next };
}

/** 没点开过读条的件。未写入 seen 的一律算新（含旧存档里已有的装）。 */
export function isItemUnseen(state: PlayerState, id: string): boolean {
  return !(state.seenItemIds ?? []).includes(id);
}

export function migrateSeenItemIds(loaded: {
  seenItemIds?: unknown;
  unseenItemIds?: unknown;
  inventory?: { id: string }[];
}): string[] | undefined {
  if (Array.isArray(loaded.seenItemIds)) {
    return loaded.seenItemIds.filter((id): id is string => typeof id === 'string');
  }
  if (Array.isArray(loaded.unseenItemIds)) {
    const unseen = new Set(
      loaded.unseenItemIds.filter((id): id is string => typeof id === 'string'),
    );
    return (loaded.inventory ?? [])
      .map((e) => e.id)
      .filter((id) => !unseen.has(id));
  }
  return undefined;
}
