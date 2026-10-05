import type { DungeonId, PlayerState } from '@moyu/game-core';
import { GearDungeonBrowser } from './GearDungeonBrowser';

type GearDungeonScreenProps = {
  player: PlayerState;
  recommendedPower: number;
  deployedPower: number;
  onBack: () => void;
  onEnter: (dungeonId: DungeonId) => void;
};

/** 猎装秘境：左列表 · 右介绍（整页高度，与冒险首页分离） */
export function GearDungeonScreen({
  player,
  recommendedPower,
  deployedPower,
  onBack,
  onEnter,
}: GearDungeonScreenProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 pb-1">
      <header className="flex shrink-0 items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onBack}
          className="shrink-0 rounded-lg border border-border/55 bg-black/20 px-3 py-2 text-xs text-muted-foreground hover:bg-muted/30 hover:text-foreground"
        >
          返回
        </button>
        <h2 className="font-display text-base text-foreground sm:text-lg">猎装秘境</h2>
      </header>

      <GearDungeonBrowser
        className="min-h-[min(70dvh,28rem)] flex-1 sm:min-h-0"
        player={player}
        recommendedPower={recommendedPower}
        deployedPower={deployedPower}
        onEnter={onEnter}
      />
    </div>
  );
}
