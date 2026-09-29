import {
  ENCOUNTERS,
  getEncounterModifier,
  getFormationResonance,
  type ActionKind,
  type BattleState,
  type PlayerState,
} from '@moyu/game-core';
import { ChoiceList } from '@/components/game/ChoiceList';
import { BattleLog } from '../shared/battleLog';
import { BattleGrid } from './BattleGrid';
import { BattleEncounterBar } from './BattleEncounterBar';

type BattleScreenProps = {
  player: PlayerState;
  battle: BattleState;
  playing: boolean;
  onSubmitHeroAction: (kind: ActionKind) => void;
  onHeroManualAuto: () => void;
  onHeroManualManual: () => void;
};

export function BattleScreen({
  player,
  battle,
  playing,
  onSubmitHeroAction,
  onHeroManualAuto,
  onHeroManualManual,
}: BattleScreenProps) {
  const heroInBattle = battle.player.units.find((u) => u.isHero);
  const encounter = ENCOUNTERS.find((e) => e.id === battle.encounterId);
  const encounterName = encounter?.name ?? battle.encounterId;
  const modifierLabels = (battle.encounterModifierIds ?? [])
    .map((id) => getEncounterModifier(id)?.label)
    .filter((l): l is string => Boolean(l));
  const resonanceLabels = (battle.formationResonanceIds ?? [])
    .map((id) => getFormationResonance(id)?.label)
    .filter((l): l is string => Boolean(l));

  const statusLine = battle.awaitingHeroAction
    ? '等待指令'
    : playing
      ? '战报中'
      : '暂停';

  const actions =
    battle.awaitingHeroAction && heroInBattle
      ? [
          {
            id: 'atk',
            label: '攻击',
            onSelect: () => onSubmitHeroAction('attack'),
          },
          {
            id: 'skill',
            label: `技能 · ${heroInBattle.skill.name}`,
            hint: `能量 ${heroInBattle.qi}/${heroInBattle.skill.qiCost}`,
            disabled: heroInBattle.qi < heroInBattle.skill.qiCost,
            onSelect: () => onSubmitHeroAction('skill'),
          },
          {
            id: 'auto',
            label: '改为自动',
            onSelect: onHeroManualAuto,
          },
        ]
      : [
          {
            id: 'mode',
            label: player.heroManual ? '主角：手动' : '切换主角手动',
            onSelect: player.heroManual ? onHeroManualAuto : onHeroManualManual,
          },
        ];

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
      <BattleEncounterBar
        turn={battle.turn}
        statusLine={statusLine}
        encounterName={encounterName}
        modifierLabels={modifierLabels}
        resonanceLabels={resonanceLabels}
        heroManual={player.heroManual}
      />

      <div className="shrink-0">
        <BattleGrid battle={battle} compact layout="focus" />
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <BattleLog battle={battle} compact />
      </div>

      <div className="sticky bottom-0 z-10 shrink-0 border-t border-border/50 bg-background/95 pt-2 pb-0.5">
        <ChoiceList choices={actions} />
      </div>
    </div>
  );
}
