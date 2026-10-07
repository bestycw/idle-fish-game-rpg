import {
  ENCOUNTERS,
  battlePressure,
  chapterBattlePressure,
  ch1EliteGateActive,
  gearDungeonBattlePressure,
  hasOwnedRareCompanion,
  hasRareCompanionOnField,
  buildPlayerParty,
  createBattle,
  createBattleDisplayOpts,
  currentChapterBattleContext,
  encounterDisplayTier,
  getDungeon,
  isGearDungeonId,
  resolveWorldPreset,
  tGearDungeonName,
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
  if (kind === 'chapter') {
    return chapterBattlePressure(player);
  }
  if (isGearDungeonId(dungeonId)) {
    return gearDungeonBattlePressure(dungeonId);
  }
  return battlePressure(chapter, pressureForDungeon(dungeonId));
}

function buildPreview(
  player: PlayerState,
  config: BattlePrepConfig,
  encounterIndex: number,
): BattleState | null {
  const party = buildPlayerParty(player);
  if (party.length === 0) return null;
  const seed = battleSeed(player, config.kind);
  const displayContext =
    config.kind === 'dungeon'
      ? { dungeonId: config.dungeonId, battleSeed: seed }
      : undefined;
  return createBattle(party, seed, encounterIndex, {
    pressure: battlePressureFor(player, config.kind, config.dungeonId),
    rollEncounterModifiers: true,
    ...createBattleDisplayOpts(player, encounterIndex, displayContext),
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
  const prepSeed = battleSeed(player, config.kind);
  const prepDisplayContext =
    config.kind === 'dungeon'
      ? { dungeonId: config.dungeonId, battleSeed: prepSeed }
      : undefined;
  const encounterDisplayName = encounter
    ? createBattleDisplayOpts(player, config.encounterIndex, prepDisplayContext)
        .encounterDisplayName ?? encounter.name
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
  const preset = resolveWorldPreset(player);
  const dungeonLabel =
    config.kind === 'chapter'
      ? '主线战斗'
      : isGearDungeonId(config.dungeonId)
        ? tGearDungeonName(config.dungeonId, preset)
        : getDungeon(config.dungeonId).name;
  const waveBadge =
    chapterWave && chapterWave.waveTotal > 1
      ? chapterWave.unitTotal > 1
        ? ` · ${chapterWave.unitLabel ?? `第 ${chapterWave.unitIndex + 1} 阵`} · 第 ${
            chapterWave.waveInUnit + 1
          }/3 场${chapterWave.waveLabel ? `「${chapterWave.waveLabel}」` : ''}`
        : ` · 第 ${chapterWave.waveIndex + 1}/${chapterWave.waveTotal} 场${
            chapterWave.waveLabel ? `「${chapterWave.waveLabel}」` : ''
          }`
      : '';

  const teachNeedDeploy =
    config.kind === 'chapter' &&
    Boolean(player.tutorialFlags?.ch1EliteTicketGranted) &&
    hasOwnedRareCompanion(player) &&
    !hasRareCompanionOnField(player) &&
    chapterWave?.unitIndex === 0 &&
    chapterWave.waveInUnit === 2;
  const teachGateHard =
    config.kind === 'chapter' && ch1EliteGateActive(player);
  const canStart = Boolean(preview && partyCount > 0 && !teachNeedDeploy);

  const handleStart = () => {
    if (teachNeedDeploy) {
      pushNotice('蓝卡还在替补席——点席下伙伴上阵后再开。');
      return;
    }
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

          {teachGateHard ? (
            <p className="rounded-lg border border-rose-400/40 bg-rose-950/30 px-3 py-2 font-mono text-[11px] leading-relaxed text-rose-100/90">
              本场精锐是教学门：两人打不过。去召唤补蓝卡再回来。
            </p>
          ) : null}
          {teachNeedDeploy ? (
            <p className="rounded-lg border border-amber-400/40 bg-amber-950/30 px-3 py-2 font-mono text-[11px] leading-relaxed text-amber-100/90">
              蓝卡已入手但未上阵——点下方席位把良品拖进九宫，再开战。
            </p>
          ) : null}

          {preview ? (
            <section>
              <p className="mb-1 font-mono text-[9px] tracking-[0.14em] text-rose-300/75">
                敌情预览
                {config.kind === 'chapter' && chapterWave ? (
                  <span className="ml-1.5 font-normal text-muted-foreground">
                    ·{' '}
                    {chapterWave.waveInUnit < 2
                      ? '剧情小怪'
                      : encounterDisplayTier(encounter.id) === 'boss'
                        ? '首领'
                        : encounterDisplayTier(encounter.id) === 'elite'
                          ? '精锐'
                          : '剧情小怪'}
                    {chapterWave.waveLabel ? `（${chapterWave.waveLabel}）` : ''}
                  </span>
                ) : null}
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
            : teachNeedDeploy
              ? '请先把蓝卡上阵'
              : staminaCost > 0
                ? `开始战斗 · 体力 ${staminaCost}`
                : '开始战斗'}
        </button>
      </div>
    </div>
  );
}
