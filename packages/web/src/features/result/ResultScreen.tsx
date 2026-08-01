import { wearLoot, type BattleState, type Equipment, type PlayerState } from '@moyu/game-core';
import { BattleLog } from '../shared/battleLog';
import { cn } from '@/lib/utils';
import { rarityTone } from '@/lib/tones';

type ResultScreenProps = {
  battle: BattleState;
  lastLoot: Equipment | null;
  dungeonName: string;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerState>>;
  onRestartBattle: () => void;
  onBackToHub: () => void;
  pushNotice: (msg: string) => void;
};

/** 结算页：手游式胜负横幅 + 掉落卡 + 底部双按钮 */
export function ResultScreen({
  battle,
  lastLoot,
  dungeonName,
  setPlayer,
  onRestartBattle,
  onBackToHub,
  pushNotice,
}: ResultScreenProps) {
  const won = battle.status === 'won';

  return (
    <div className="mx-auto max-w-lg space-y-4 pb-4">
      <div
        className={cn(
          'rounded-2xl border px-4 py-6 text-center sm:px-6',
          won
            ? 'border-primary/35 bg-gradient-to-b from-primary/20 to-card/80'
            : 'border-destructive/35 bg-gradient-to-b from-destructive/15 to-card/80',
        )}
      >
        <p className="font-mono text-[11px] tracking-[0.2em] text-muted-foreground">
          {dungeonName}
        </p>
        <h2 className="font-display mt-2 text-3xl tracking-wide sm:text-4xl">
          {won ? '胜利' : '战败'}
        </h2>
        {!won && battle.defeatHint ? (
          <p className="mx-auto mt-3 max-w-md text-sm text-foreground/85">{battle.defeatHint}</p>
        ) : null}
        {won && !lastLoot ? (
          <p className="mt-3 text-sm text-muted-foreground">进度已记下（本场无猎装掉落）</p>
        ) : null}
      </div>

      {won && lastLoot ? (
        <div
          className={cn(
            'rounded-xl border border-l-4 bg-card/60 p-4',
            rarityTone(lastLoot.rarity),
          )}
        >
          <p className="font-mono text-[11px] tracking-[0.14em] text-muted-foreground">掉落</p>
          <div className="font-display mt-1 text-xl">{lastLoot.name}</div>
          <p className="mt-2 text-sm text-muted-foreground">
            {lastLoot.affixes.map((a) => `${a.name}+${a.value}`).join(' · ')}
            {lastLoot.setId ? ` · ${lastLoot.setId}` : ''}
          </p>
          <button
            type="button"
            className="mt-3 w-full rounded-lg bg-primary py-2.5 font-medium text-primary-foreground"
            onClick={() => {
              setPlayer((p) => wearLoot(p, lastLoot.id));
              pushNotice(`已穿戴 ${lastLoot.name}`);
            }}
          >
            立即穿戴
          </button>
        </div>
      ) : null}

      <details className="rounded-xl border border-border/70 bg-card/40 open:pb-2">
        <summary className="cursor-pointer px-3 py-2.5 font-mono text-[11px] tracking-[0.14em] text-muted-foreground">
          本场战报
        </summary>
        <div className="px-2 pb-2">
          <BattleLog battle={battle} />
        </div>
      </details>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onRestartBattle}
          className="rounded-xl border border-primary/40 bg-primary/15 py-3.5 font-medium text-primary"
        >
          {won ? '再刷一把' : '重整再战'}
        </button>
        <button
          type="button"
          onClick={onBackToHub}
          className="rounded-xl border border-border/80 bg-card/70 py-3.5 font-medium"
        >
          返回冒险
        </button>
      </div>
    </div>
  );
}
