import { cn } from '@/lib/utils';

/** 技能特长 / 状态小标签（夜间墨底可读） */
export function specTone(kind: string): string {
  const map: Record<string, string> = {
    pierce: 'border-amber-500/35 bg-amber-500/10 text-amber-200',
    aoe: 'border-teal-500/35 bg-teal-500/10 text-teal-200',
    heal: 'border-emerald-500/35 bg-emerald-500/10 text-emerald-200',
    shield: 'border-sky-500/35 bg-sky-500/10 text-sky-200',
    silence: 'border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-200',
    stun: 'border-yellow-500/35 bg-yellow-500/10 text-yellow-100',
    bleed: 'border-red-500/35 bg-red-500/10 text-red-200',
    'heal-block': 'border-rose-500/35 bg-rose-500/10 text-rose-200',
    havoc: 'border-pink-500/35 bg-pink-500/10 text-pink-200',
    slow: 'border-slate-400/35 bg-slate-500/10 text-slate-200',
    shred: 'border-orange-500/35 bg-orange-500/10 text-orange-200',
    sleep: 'border-indigo-400/35 bg-indigo-500/10 text-indigo-200',
    berserk: 'border-orange-400/40 bg-orange-500/15 text-orange-100',
    purge: 'border-cyan-500/35 bg-cyan-500/10 text-cyan-200',
    cleanse: 'border-green-500/35 bg-green-500/10 text-green-200',
    special: 'border-primary/35 bg-primary/10 text-primary',
  };
  return cn(
    'inline-flex rounded border px-1.5 py-0.5 text-[10px] font-medium leading-none',
    map[kind] ?? map.special,
  );
}

export function rarityTone(rarity: string): string {
  if (rarity === 'legendary') return 'border-l-amber-400/80';
  if (rarity === 'epic') return 'border-l-fuchsia-400/70';
  if (rarity === 'rare') return 'border-l-sky-400/70';
  return 'border-l-border';
}

/** 装备名着色（暗黑式 tooltip 标题） */
export function rarityNameTone(rarity: string): string {
  if (rarity === 'legendary') return 'text-amber-300';
  if (rarity === 'epic') return 'text-fuchsia-300';
  if (rarity === 'rare') return 'text-sky-300';
  if (rarity === 'uncommon') return 'text-emerald-300/90';
  return 'text-foreground/85';
}

/** 伙伴卡框：整圈描边 + 轻底（列表/详情头图） */
export function rarityFrame(rarity: string): string {
  if (rarity === 'legendary') {
    return 'border-amber-400/55 bg-gradient-to-b from-amber-500/15 via-card to-[#0e141c] shadow-[inset_0_0_0_1px_rgba(251,191,36,0.12)]';
  }
  if (rarity === 'epic') {
    return 'border-fuchsia-400/50 bg-gradient-to-b from-fuchsia-500/12 via-card to-[#0e141c]';
  }
  if (rarity === 'rare') {
    return 'border-sky-400/45 bg-gradient-to-b from-sky-500/12 via-card to-[#0e141c]';
  }
  return 'border-border/70 bg-gradient-to-b from-card to-[#0e141c]';
}

/** 未获得：虚线弱化，仍保留稀有度色相暗示 */
export function rarityFrameLocked(rarity: string): string {
  if (rarity === 'legendary') return 'border-dashed border-amber-400/35 opacity-55';
  if (rarity === 'epic') return 'border-dashed border-fuchsia-400/30 opacity-55';
  if (rarity === 'rare') return 'border-dashed border-sky-400/30 opacity-55';
  return 'border-dashed border-border/50 opacity-55';
}

export function logTone(tone: string): string {
  const map: Record<string, string> = {
    'log-crit': 'text-primary font-medium',
    'log-special': 'text-amber-200/90',
    'log-status': 'text-teal-200/85',
    'log-resist': 'text-muted-foreground',
    'log-heal': 'text-emerald-300/90',
    'log-shield': 'text-sky-300/90',
    'log-mitigation': 'text-slate-300/80',
    'log-down': 'text-destructive font-medium',
  };
  return map[tone] ?? 'text-foreground/75';
}
