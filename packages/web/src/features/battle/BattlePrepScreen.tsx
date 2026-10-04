import {
  ENCOUNTERS,
  battlePressure,
  buildPlayerParty,
  createBattle,
  createBattleDisplayOpts,
  currentChapterBattleContext,
  getDungeon,
  getEncounterModifier,
  getFormationResonance,
  MAX_PARTY_SIZE,
  pressureForDungeon,
  staminaCostForDungeon,
  type BattleState,
  type DungeonId,
  type PlayerState,
} from '@moyu/game-core';
import { useMemo } from 'react';
import { FormationEditor } from '../character/FormationEditor';
import { BattlePrepBrief } from './BattlePrepBrief';
import { BattleGridEnemyOnly } from './BattleGrid';
import { cn } from '@/lib/utils';

export type BattlePrepKind = 'dungeon' | 'chapter';

export type BattlePrepConfig = {
  kind: BattlePrepKind;
  dungeonId: DungeonId;
  encounterIndex: number;
};

type BattlePrepScreenProps = {
  player: PlayerState;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerState>>;
  config: BattlePrepConfig;
  pushNotice: (msg: string) => void;
  onBack: () => void;
  onConfirmStart: (preview: BattleState) => void;
};

function battleSeed(player: PlayerState, kind: BattlePrepKind): number {
  return kind === 'chapter' ? player.seed + player.wins + 1000 : player.seed + player.wins;
}

function battlePressureFor(
  player: PlayerState,
  kind: BattlePrepKind,
  dungeonId: DungeonId,
): number {
  const chapter = player.chapterCleared ?? 0;
  return kind === 'chapter'
    ? battlePressure(chapter)
    : battlePressure(chapter, pressureForDungeon(dungeonId));
}

function buildPreview(
  player: PlayerState,
  config: BattlePrepConfig,
  encounterIndex: number,
): BattleState | null {
  const party = buildPlayerParty(player);
  if (party.length === 0) return null;
  return createBattle(party, battleSeed(player, config.kind), encounterIndex, {
    pressure: battlePressureFor(player, config.kind, config.dungeonId),
    rollEncounterModifiers: true,
    ...createBattleDisplayOpts(player, encounterIndex),
  });
}

export function BattlePrepScreen({
  player,
  setPlayer,
  config,
  pushNotice,
  onBack,
  onConfirmStart,
}: BattlePrepScreenProps) {
  const encounter = ENCOUNTERS[config.encounterIndex];
  const partyCount = Object.keys(player.formation).length;
  const chapterWave =
    config.kind === 'chapter' ? currentChapterBattleContext(player) : null;
  const encounterDisplayName = encounter
    ? createBattleDisplayOpts(player, config.encounterIndex).encounterDisplayName ??
      encounter.name
    : '';

  const preview = useMemo(
    () => (encounter ? buildPreview(player, config, config.encounterIndex) : null),
    [player, config, encounter],
  );

  const modifierNames =
    preview?.encounterModifierIds
      ?.map((id) => getEncounterModifier(id)?.label)
      .filter((l): l is string => Boolean(l)) ?? [];

  const resonanceNames =
    preview?.formationResonanceIds
      ?.map((id) => getFormationResonance(id)?.label)
      .filter((l): l is string => Boolean(l)) ?? [];

  const staminaCost =
    config.kind === 'dungeon' ? staminaCostForDungeon(config.dungeonId) : 0;
  const dungeonLabel =
    config.kind === 'chapter' ? '主线战斗' : getDungeon(config.dungeonId).name;
  const waveBadge =
    chapterWave && chapterWave.waveTotal > 1
      ? ` · 第 ${chapterWave.waveIndex + 1}/${chapterWave.waveTotal} 波${
          chapterWave.waveLabel ? `「${chapterWave.waveLabel}」` : ''
        }`
      : '';

  const canStart = Boolean(preview && partyCount > 0);

  const handleStart = () => {
    const fresh = buildPreview(player, config, config.encounterIndex);
    if (fresh) onConfirmStart(fresh);
  };

  if (!encounter) {
    return <p className="text-sm text-destructive">遭遇数据缺失，请返回。</p>;
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 items-center justify-between gap-2 pb-1.5">
        <button
          type="button"
          onClick={onBack}
          className="font-mono text-[11px] text-muted-foreground hover:text-foreground"
        >
          ← 返回
        </button>
        <span className="font-mono text-[10px] text-muted-foreground">
          {dungeonLabel}
          {waveBadge}
        </span>
      </div>

      <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,auto)_minmax(0,1fr)] gap-2 overflow-hidden pt-0.5">
        <div className="shrink-0 space-y-2.5 overflow-hidden">
          <BattlePrepBrief
            encounterId={encounter.id}
            encounterName={encounterDisplayName}
            modifierLabels={modifierNames}
            resonanceLabels={resonanceNames}
            prepHint={encounter.prepHint}
          />

          {preview ? (
            <section>
              <p className="mb-1 font-mono text-[9px] tracking-[0.14em] text-rose-300/75">
                敌情预览
              </p>
              <BattleGridEnemyOnly battle={preview} />
            </section>
          ) : null}
        </div>

        <section className="flex min-h-0 flex-col overflow-hidden border-t border-border/50 pt-2">
          <p className="mb-1 shrink-0 font-mono text-[9px] tracking-[0.14em] text-teal-300/80">
            我方布阵 · {partyCount}/{MAX_PARTY_SIZE}
          </p>
          <FormationEditor
            player={player}
            setPlayer={setPlayer}
            pushNotice={pushNotice}
            compact
            parentScroll
          />
        </section>
      </div>

      <div className="shrink-0 border-t border-border/60 bg-background/95 pt-2 pb-1">
        <button
          type="button"
          disabled={!canStart}
          onClick={handleStart}
          className={cn(
            'w-full rounded-xl px-4 py-3.5 text-center text-base font-medium shadow-lg',
            canStart
              ? 'bg-primary text-primary-foreground shadow-primary/25 hover:brightness-110'
              : 'cursor-not-allowed bg-muted text-muted-foreground',
          )}
        >
          {partyCount === 0
            ? '请先上阵至少一人'
            : staminaCost > 0
              ? `开始战斗 · 体力 ${staminaCost}`
              : '开始战斗'}
        </button>
      </div>
    </div>
  );
}
