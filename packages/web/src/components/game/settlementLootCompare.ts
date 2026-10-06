import {
  firstWearableDeployed,
  itemPower,
  type Equipment,
  type PlayerState,
} from '@moyu/game-core';

export function wornItemComparedToLoot(
  player: PlayerState,
  loot: Equipment,
): { worn: Equipment | null; powerDelta: number } {
  const wearer = firstWearableDeployed(player, loot);
  if (!wearer) return { worn: null, powerDelta: 0 };
  const wornId = player.characterEquip?.[wearer]?.[loot.slot];
  const worn = wornId ? (player.inventory.find((e) => e.id === wornId) ?? null) : null;
  const powerDelta = worn ? itemPower(loot) - itemPower(worn) : 0;
  return { worn, powerDelta };
}
