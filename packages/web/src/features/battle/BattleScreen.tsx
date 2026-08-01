import {
  ALLY_BATTLE_ROWS,
  ENCOUNTERS,
  ENEMY_BATTLE_ROWS,
  isLiving,
  type ActionKind,
  type BattleState,
  type GridSlot,
  type PlayerState,
  type UnitRuntime,
} from '@moyu/game-core';
import { ChoiceList } from '@/components/game/ChoiceList';
import { Narrative } from '@/components/game/Narrative';
import { BattleLog } from '../shared/battleLog';
import { unitAt } from '../shared/unitViews';
import { cn } from '@/lib/utils';

type BattleScreenProps = {
  player: PlayerState;
  battle: BattleState;
  playing: boolean;
  onSubmitHeroAction: (kind: ActionKind) => void;
  onHeroManualAuto: () => void;
  onHeroManualManual: () => void;
};

function CompactLine({
  label,
  units,
  slots,
}: {
  label: string;
  units: UnitRuntime[];
  slots: GridSlot[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[10px] sm:text-[11px]">
      <span className="w-7 shrink-0 text-muted-foreground sm:w-8">{label}</span>
      {slots.map((slot) => {
        const u = unitAt(units, slot);
        if (!u) {
          return (
            <span key={slot} className="text-border">
              ·
            </span>
          );
        }
        const down = !isLiving(u);
        const pct = u.maxHp > 0 ? Math.round((Math.max(0, u.hp) / u.maxHp) * 100) : 0;
        return (
          <span
            key={slot}
            className={cn(
              'inline-flex items-baseline gap-1',
              down && 'opacity-40 line-through',
              u.isHero && 'text-primary',
            )}
            title={`${u.name} HP ${u.hp}/${u.maxHp}`}
          >
            <span className="max-w-[4.5rem] truncate sm:max-w-none">
              {u.name.replace('主角·', '')}
            </span>
            <span className="text-muted-foreground">{pct}%</span>
          </span>
        );
      })}
    </div>
  );
}

function BoardStrip({ battle }: { battle: BattleState }) {
  return (
    <div className="space-y-1 rounded-lg border border-border/70 bg-card/50 px-2.5 py-2 sm:px-3">
      {ENEMY_BATTLE_ROWS.map(({ row, slots }) => (
        <CompactLine
          key={`e-${row}`}
          label={row === 'back' ? '敌后' : row === 'mid' ? '敌中' : '敌前'}
          units={battle.enemy.units}
          slots={slots}
        />
      ))}
      <div className="my-1 border-t border-dashed border-border/60" />
      {ALLY_BATTLE_ROWS.map(({ row, slots }) => (
        <CompactLine
          key={`a-${row}`}
          label={row === 'front' ? '我前' : row === 'mid' ? '我中' : '我后'}
          units={battle.player.units}
          slots={slots}
        />
      ))}
    </div>
  );
}

export function BattleScreen({
  player,
  battle,
  playing,
  onSubmitHeroAction,
  onHeroManualAuto,
  onHeroManualManual,
}: BattleScreenProps) {
  const heroInBattle = battle.player.units.find((u) => u.isHero);
  const encounterName =
    ENCOUNTERS.find((e) => e.id === battle.encounterId)?.name ?? battle.encounterId;

  const statusLine = battle.awaitingHeroAction
    ? '等待指令'
    : playing
      ? '战报中…'
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
            id: 'def',
            label: '防御',
            onSelect: () => onSubmitHeroAction('defend'),
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
    <div className="space-y-4 pb-4 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.9fr)] lg:gap-5 lg:space-y-0">
      <div className="space-y-4">
        <Narrative
          eyebrow={`第 ${battle.turn} 回合 · ${statusLine}`}
          title={encounterName}
          paragraphs={[
            player.heroManual
              ? '手动：轮到你时从下方选招。索敌仍自动。'
              : '自动交锋。可切手动亲自出手。',
          ]}
        />
        <BoardStrip battle={battle} />
        {/* 窄屏：战报在指令上方；宽屏战报进右栏 */}
        <div className="lg:hidden">
          <p className="mb-2 font-mono text-[11px] tracking-[0.16em] text-muted-foreground">
            战报
          </p>
          <BattleLog battle={battle} />
        </div>
        <ChoiceList choices={actions} />
      </div>

      <aside className="hidden lg:block lg:sticky lg:top-4">
        <p className="mb-2 font-mono text-[11px] tracking-[0.16em] text-muted-foreground">
          战报
        </p>
        <BattleLog battle={battle} tall />
      </aside>
    </div>
  );
}
