import {
  getStatusDef,
  isLiving,
  ratingToPct,
  statusLabel,
  type GridSlot,
  type SkillDef,
  type UnitRuntime,
} from '@moyu/game-core';
import { cn } from '@/lib/utils';
import { specTone } from '@/lib/tones';

export function unitAt(units: UnitRuntime[], slot: GridSlot): UnitRuntime | undefined {
  return units.find((u) => u.slot === slot && isLiving(u)) ?? units.find((u) => u.slot === slot);
}

/** 技能角标：优先 tags/pattern；状态名读注册表，勿为每个新 statusId 堆 if */
export function skillSpecialty(skill: SkillDef): { label: string; tone: string } | null {
  if (skill.tags.includes('purge')) return { label: '驱散', tone: 'purge' };
  if (skill.tags.includes('cleanse')) return { label: '净化', tone: 'cleanse' };
  if (skill.targetPattern === 'col_focus') return { label: '贯列', tone: 'aoe' };
  if (skill.tags.includes('pierce')) return { label: '穿透', tone: 'pierce' };
  if (skill.tags.includes('aoe')) return { label: '群体', tone: 'aoe' };
  if (skill.tags.includes('heal')) return { label: '治疗', tone: 'heal' };
  if (skill.tags.includes('guard')) return { label: '护盾', tone: 'shield' };
  const st = skill.applyStatus[0]?.statusId;
  if (st && getStatusDef(st)) {
    return { label: statusLabel(st), tone: statusToneKey(st) };
  }
  return null;
}

/** UI 色调键；未知 id 回落 special（展示名仍走 statusLabel） */
export function statusToneKey(statusId: string): string {
  const map: Record<string, string> = {
    stun: 'stun',
    silence: 'silence',
    bleed: 'bleed',
    heal_block: 'heal-block',
    havoc: 'havoc',
    slow: 'slow',
    shred: 'shred',
    shield: 'shield',
    sleep: 'sleep',
    berserk: 'berserk',
  };
  return map[statusId] ?? 'special';
}

function ResourceBar({
  kind,
  current,
  max,
}: {
  kind: 'hp' | 'qi';
  current: number;
  max: number;
}) {
  const pct = max > 0 ? Math.max(0, Math.min(100, Math.round((current / max) * 100))) : 0;
  return (
    <div
      className="relative h-3.5 overflow-hidden rounded-sm border border-border/80 bg-muted"
      title={kind === 'hp' ? '生命' : '能量'}
    >
      <span
        className={cn(
          'absolute inset-y-0 left-0 transition-[width]',
          kind === 'hp' ? 'bg-emerald-600/80' : 'bg-sky-600/75',
        )}
        style={{ width: `${pct}%` }}
      />
      <span className="relative z-[1] flex h-full items-center justify-center text-[9px] font-medium text-foreground">
        {current}/{max}
      </span>
    </div>
  );
}

export function MiniUnit({ unit }: { unit?: UnitRuntime }) {
  if (!unit) {
    return (
      <div className="flex min-h-[4.5rem] items-center justify-center rounded-md border border-dashed border-border bg-muted/40 text-xs text-muted-foreground">
        空
      </div>
    );
  }
  const critPct = Math.round(ratingToPct(unit.critRating, 'critRating') * 100);
  const spec = skillSpecialty(unit.skill);
  const down = unit.dead || unit.hp <= 0;
  return (
    <div
      className={cn(
        'flex min-h-[4.5rem] flex-col gap-1 rounded-md border border-border bg-card p-1.5 text-left',
        down && 'opacity-45',
        unit.isHero && 'border-primary/50 bg-accent/40',
      )}
    >
      <strong className="truncate text-xs">{unit.name.replace('主角·', '')}</strong>
      <div className="text-[10px] text-muted-foreground">
        速{unit.spd} · <span className="font-medium text-orange-700">暴{critPct}%</span>
      </div>
      {(spec || unit.statuses.length > 0) && (
        <div className="flex flex-wrap gap-1">
          {spec && <span className={specTone(spec.tone)}>{spec.label}</span>}
          {unit.statuses
            .filter((s) => s.remaining > 0)
            .map((s) => (
              <span key={`${s.statusId}-${s.remaining}`} className={specTone(statusToneKey(s.statusId))}>
                {s.statusId}
              </span>
            ))}
        </div>
      )}
      <div className="mt-auto flex flex-col gap-0.5">
        <ResourceBar kind="hp" current={unit.hp} max={unit.maxHp} />
        <ResourceBar kind="qi" current={unit.qi} max={unit.maxQi} />
      </div>
    </div>
  );
}
