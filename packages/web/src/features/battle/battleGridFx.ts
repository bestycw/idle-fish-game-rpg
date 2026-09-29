import type { BattleEvent, BattleState, GridSlot } from '@moyu/game-core';

export type BattleCellFxKind =
  | 'hit'
  | 'crit'
  | 'heal'
  | 'block'
  | 'dodge'
  | 'down'
  | 'cast'
  | 'shield';

export type BattleCellFx = {
  kind: BattleCellFxKind;
};

export type BattleCellFloatKind = 'damage' | 'heal' | 'miss' | 'block' | 'crit';

export type BattleCellFloat = {
  id: string;
  slot: GridSlot;
  side: 'ally' | 'enemy';
  text: string;
  kind: BattleCellFloatKind;
};

export function battleCellKey(side: 'ally' | 'enemy', slot: GridSlot): string {
  return `${side}:${slot}`;
}

function normalizeName(name: string): string {
  return name.replace(/^主角·/, '').trim();
}

function findUnitLoc(
  battle: BattleState,
  displayName: string,
): { slot: GridSlot; side: 'ally' | 'enemy' } | null {
  const needle = normalizeName(displayName);
  for (const u of battle.player.units) {
    if (normalizeName(u.name) === needle || u.name === displayName) {
      return { slot: u.slot, side: 'ally' };
    }
  }
  for (const u of battle.enemy.units) {
    if (normalizeName(u.name) === needle || u.name === displayName) {
      return { slot: u.slot, side: 'enemy' };
    }
  }
  return null;
}

function setFx(
  fx: Record<string, BattleCellFx>,
  side: 'ally' | 'enemy',
  slot: GridSlot,
  kind: BattleCellFxKind,
) {
  fx[battleCellKey(side, slot)] = { kind };
}

export function fxFromNewEvents(
  events: BattleEvent[],
  battle: BattleState,
): { fx: Record<string, BattleCellFx>; floats: BattleCellFloat[] } {
  const fx: Record<string, BattleCellFx> = {};
  const floats: BattleCellFloat[] = [];
  let seq = 0;

  for (const ev of events) {
    const p = ev.payload;
    const idBase = `${ev.turn}-${ev.code}-${seq}`;

    switch (ev.code) {
      case 'action': {
        const actor = String(p.actor ?? '');
        const loc = findUnitLoc(battle, actor);
        if (loc) setFx(fx, loc.side, loc.slot, 'cast');
        break;
      }
      case 'hit':
      case 'follow_up': {
        const target = String(p.target ?? '');
        const loc = findUnitLoc(battle, target);
        if (loc) {
          setFx(fx, loc.side, loc.slot, 'hit');
          floats.push({
            id: `${idBase}-dmg`,
            slot: loc.slot,
            side: loc.side,
            text: `-${p.amount}`,
            kind: 'damage',
          });
        }
        const actor = String(p.actor ?? '');
        const actorLoc = findUnitLoc(battle, actor);
        if (actorLoc) setFx(fx, actorLoc.side, actorLoc.slot, 'cast');
        seq += 1;
        break;
      }
      case 'crit': {
        const target = String(p.target ?? '');
        const loc = findUnitLoc(battle, target);
        if (loc) {
          setFx(fx, loc.side, loc.slot, 'crit');
          floats.push({
            id: `${idBase}-crit`,
            slot: loc.slot,
            side: loc.side,
            text: `-${p.amount}`,
            kind: 'crit',
          });
        }
        const actor = String(p.actor ?? '');
        const actorLoc = findUnitLoc(battle, actor);
        if (actorLoc) setFx(fx, actorLoc.side, actorLoc.slot, 'cast');
        seq += 1;
        break;
      }
      case 'heal': {
        const target = String(p.target ?? '');
        const loc = findUnitLoc(battle, target);
        if (loc) {
          setFx(fx, loc.side, loc.slot, 'heal');
          floats.push({
            id: `${idBase}-heal`,
            slot: loc.slot,
            side: loc.side,
            text: `+${p.amount}`,
            kind: 'heal',
          });
        }
        seq += 1;
        break;
      }
      case 'shield_gain': {
        const target = String(p.target ?? p.actor ?? '');
        const loc = findUnitLoc(battle, target);
        if (loc) {
          setFx(fx, loc.side, loc.slot, 'shield');
          floats.push({
            id: `${idBase}-shield`,
            slot: loc.slot,
            side: loc.side,
            text: `盾+${p.amount}`,
            kind: 'heal',
          });
        }
        seq += 1;
        break;
      }
      case 'block': {
        const target = String(p.target ?? '');
        const loc = findUnitLoc(battle, target);
        if (loc) {
          setFx(fx, loc.side, loc.slot, 'block');
          floats.push({
            id: `${idBase}-block`,
            slot: loc.slot,
            side: loc.side,
            text: '格挡',
            kind: 'block',
          });
        }
        seq += 1;
        break;
      }
      case 'dodge': {
        const target = String(p.target ?? '');
        const loc = findUnitLoc(battle, target);
        if (loc) {
          setFx(fx, loc.side, loc.slot, 'dodge');
          floats.push({
            id: `${idBase}-dodge`,
            slot: loc.slot,
            side: loc.side,
            text: '闪避',
            kind: 'miss',
          });
        }
        seq += 1;
        break;
      }
      case 'unit_down': {
        const target = String(p.target ?? '');
        const loc = findUnitLoc(battle, target);
        if (loc) setFx(fx, loc.side, loc.slot, 'down');
        seq += 1;
        break;
      }
      default:
        break;
    }
  }

  return { fx, floats };
}
