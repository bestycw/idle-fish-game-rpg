import {
  ENCOUNTERS,
  getEncounterModifier,
  getFormationResonance,
  type BattleState,
} from '@moyu/game-core';
import { BattleLog } from '../shared/battleLog';
import { BattleGrid } from './BattleGrid';
import { BattleEncounterBar } from './BattleEncounterBar';
import { useBattleGridFx } from './useBattleGridFx';
import { BattleSpeedControls, type BattleSpeed } from './BattleSpeedControls';

type BattleScreenProps = {
  battle: BattleState;
  playing: boolean;
  speed: BattleSpeed;
  onSpeed: (speed: BattleSpeed) => void;
  onSkip: () => void;
};

export function BattleScreen({ battle, playing, speed, onSpeed, onSkip }: BattleScreenProps) {
  const encounter = ENCOUNTERS.find((e) => e.id === battle.encounterId);
  const encounterName = encounter?.name ?? battle.encounterId;
  const modifierLabels = (battle.encounterModifierIds ?? [])
    .map((id) => getEncounterModifier(id)?.label)
    .filter((l): l is string => Boolean(l));
  const resonanceLabels = (battle.formationResonanceIds ?? [])
    .map((id) => getFormationResonance(id)?.label)
    .filter((l): l is string => Boolean(l));

  const statusLine =
    battle.status !== 'ongoing' ? '结束' : playing ? '交战中' : '暂停';

  const { fx, floats } = useBattleGridFx(battle, playing);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-hidden">
      <BattleEncounterBar
        turn={battle.turn}
        maxTurns={battle.maxTurns}
        statusLine={statusLine}
        encounterName={encounterName}
        modifierLabels={modifierLabels}
        resonanceLabels={resonanceLabels}
      />

      <BattleSpeedControls
        speed={speed}
        onSpeed={onSpeed}
        onSkip={onSkip}
        disabled={battle.status !== 'ongoing'}
      />

      <div className="shrink-0">
        <BattleGrid battle={battle} compact layout="focus" fx={fx} floats={floats} />
      </div>

      <BattleLog battle={battle} compact />
    </div>
  );
}
