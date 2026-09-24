/**
 * 未深做绝品：六星星章加深该卡钩子，★3/★6 两条走法都服务同一招。
 * 不写刘备招魂 / 赵云猎印斩杀 / 主角破妄。
 */
import type { SkillEffect, SoftModeThen, SoftModeWhen } from '../../shared/types.js';
import type { StarNodeDef, StarNodeEffect } from '../starTypes.js';
import { KIT_PATCHES, type KitId } from './kitCompose.js';
import { LEGENDARY_EXPAND_HOOKS } from './legendaryExpandHooks.js';
import { LORE_DEFS } from './loreTracks.js';
import { ZHONGTU_ROSTER } from './zhongtuRoster.js';

const FALLBACK_TITLES = ['起势', '蓄力', '分野', '深化', '圆满', '登峰'] as const;

function titlesFor(id: string): string[] {
  const raw = LORE_DEFS[id]?.titles ?? [];
  const out = [...raw];
  while (out.length < 6) out.push(FALLBACK_TITLES[out.length]!);
  return out.slice(0, 6);
}

function pathsFor(id: string, when: SoftModeWhen): readonly [string, string] {
  const paths = LORE_DEFS[id]?.paths;
  if (paths) return paths;
  if (when.kind === 'self_hp_below') return ['反咬', '自守'];
  if (when.kind === 'target_hp_below') return ['追命', '毕命'];
  if (when.kind === 'target_has_status') return ['延势', '加码'];
  if (when.kind === 'target_under_cc') return ['钉控', '砸实'];
  return ['先令', '加厚'];
}

function bumpEffect(e: SkillEffect, climax: boolean): SkillEffect {
  const out: SkillEffect = { ...e };
  if (out.multiplier != null) out.multiplier += climax ? 0.12 : 0.06;
  if (out.kind === 'ally_grant_qi' && out.value != null) {
    out.value += climax ? 8 : 4;
    delete out.chance;
  }
  return out;
}

function fromThen(then: SoftModeThen, climax: boolean): StarNodeEffect[] {
  const out: StarNodeEffect[] = [];
  for (const e of then.effectPatches ?? []) {
    out.push({ kind: 'effect_unlock', effect: bumpEffect(e, climax) });
  }
  for (const s of then.statusPatches ?? []) {
    if (s.statusId === 'shred') continue;
    out.push({
      kind: 'status_unlock',
      status: { ...s, duration: (s.duration ?? 1) + (climax ? 1 : 0) },
    });
  }
  return out;
}

function hookBranch(when: SoftModeWhen, then: SoftModeThen, climax: boolean): StarNodeEffect[] {
  const fromSoft = fromThen(then, climax);
  if (fromSoft.length) {
    if (climax && then.multiplierDelta) fromSoft.push({ kind: 'skill_mult', delta: 0.1 });
    return fromSoft;
  }
  if (when.kind === 'first_cast') {
    return [
      { kind: 'effect_unlock', effect: { kind: 'first_cast', multiplier: climax ? 1.32 : 1.2 } },
    ];
  }
  if (when.kind === 'self_hp_below') {
    return [
      {
        kind: 'effect_unlock',
        effect: { kind: 'self_low_hp', value: climax ? 0.45 : 0.4, multiplier: climax ? 1.36 : 1.22 },
      },
    ];
  }
  if (when.kind === 'target_hp_below') {
    return [
      {
        kind: 'effect_unlock',
        effect: { kind: 'execute', value: when.value, multiplier: climax ? 1.42 : 1.28 },
      },
    ];
  }
  if (when.kind === 'target_has_status') {
    return climax
      ? [
          { kind: 'status_boost', duration: 1 },
          { kind: 'skill_mult', delta: 0.15 },
        ]
      : [{ kind: 'status_boost', duration: 1 }];
  }
  if (when.kind === 'target_under_cc') {
    return climax
      ? [
          { kind: 'effect_unlock', effect: { kind: 'vs_cc', multiplier: 1.32 } },
          { kind: 'status_boost', duration: 1 },
        ]
      : [{ kind: 'effect_unlock', effect: { kind: 'vs_cc', multiplier: 1.2 } }];
  }
  return [{ kind: 'skill_mult', delta: climax ? 0.15 : 0.1 }];
}

function kitOverlapsWhen(kit: KitId, when: SoftModeWhen): boolean {
  if (when.kind === 'first_cast') {
    return kit === 'first_strike' || kit === 'first_wave' || kit === 'first_guard' || kit === 'flex_first';
  }
  if (when.kind === 'self_hp_below') return kit === 'hp_guard' || kit === 'earth';
  if (when.kind === 'target_hp_below') return kit === 'execute';
  if (when.kind === 'target_has_status') {
    return KIT_PATCHES[kit].applyStatus?.some((s) => s.statusId === when.statusId) ?? false;
  }
  if (when.kind === 'target_under_cc') {
    return kit === 'stun' || kit === 'flex_stun' || kit === 'sleep' || kit === 'silence';
  }
  return false;
}

function kitBranch(kit: KitId, climax: boolean): StarNodeEffect[] {
  const patch = KIT_PATCHES[kit];
  const out: StarNodeEffect[] = [];
  const st = patch.applyStatus?.[0];
  if (st) {
    out.push({
      kind: 'status_boost',
      duration: 1,
      ...(climax && st.statusId !== 'shred' ? { valueMult: 0.92 } : {}),
    });
  }
  const fx = patch.effects?.[0];
  if (fx && fx.kind !== 'ally_grant_qi') {
    out.push({ kind: 'effect_unlock', effect: bumpEffect(fx, climax) });
  } else if (fx?.kind === 'ally_grant_qi') {
    out.push({
      kind: 'effect_unlock',
      effect: { kind: 'ally_grant_qi', value: (fx.value ?? 18) + (climax ? 8 : 4) },
    });
  }
  if (!out.length) out.push({ kind: 'skill_mult', delta: climax ? 0.15 : 0.1 });
  return out;
}

function lineB(kits: readonly KitId[], when: SoftModeWhen, climax: boolean): StarNodeEffect[] {
  const primary = kits[0];
  if (primary && !kitOverlapsWhen(primary, when)) return kitBranch(primary, climax);
  if (when.kind === 'target_has_status' || when.kind === 'target_hp_below') {
    return climax
      ? [
          { kind: 'skill_mult', delta: 0.2 },
          { kind: 'enable_follow_up', chance: 0.28, multiplier: 0.55 },
        ]
      : [{ kind: 'skill_mult', delta: 0.15 }];
  }
  const second = kits[1];
  if (second && !kitOverlapsWhen(second, when)) return kitBranch(second, climax);
  return [{ kind: 'skill_mult', delta: climax ? 0.15 : 0.1 }];
}

function polishHook(when: SoftModeWhen, then: SoftModeThen): StarNodeEffect[] {
  const fromSoft = fromThen(then, false);
  if (fromSoft.length) return fromSoft.slice(0, 1);
  if (when.kind === 'first_cast') {
    return [{ kind: 'effect_unlock', effect: { kind: 'first_cast', multiplier: 1.16 } }];
  }
  if (when.kind === 'self_hp_below') {
    return [{ kind: 'effect_unlock', effect: { kind: 'self_low_hp', value: 0.4, multiplier: 1.18 } }];
  }
  if (when.kind === 'target_hp_below') {
    return [{ kind: 'effect_unlock', effect: { kind: 'execute', value: when.value, multiplier: 1.22 } }];
  }
  if (when.kind === 'target_has_status' || when.kind === 'target_under_cc') {
    return [{ kind: 'status_boost', duration: 1 }];
  }
  return [{ kind: 'skill_mult', delta: 0.1 }];
}

function compileOne(id: string): Partial<Record<number, StarNodeDef>> {
  const hook = LEGENDARY_EXPAND_HOOKS[id];
  const entry = ZHONGTU_ROSTER.find((e) => e.id === id);
  if (!hook || !entry) throw new Error(`expand star missing ${id}`);
  const when = hook.softModes[0]!.when;
  const then = hook.softModes[0]!.then;
  const titles = titlesFor(id);
  const paths = pathsFor(id, when);
  const kits = entry.kits;

  return {
    1: {
      star: 1,
      label: titles[0]!,
      effects: [{ kind: 'stat_pct', mainPct: 0.03 }, ...polishHook(when, then)],
    },
    2: {
      star: 2,
      label: titles[1]!,
      effects: [
        { kind: 'qi_cost', delta: -5 },
        { kind: 'skill_mult', delta: 0.1 },
      ],
    },
    3: {
      star: 3,
      label: titles[2]!,
      effects: [],
      branches: [
        {
          id: 'a',
          identityLabel: paths[0],
          label: `${titles[2]}·${paths[0]}`,
          effects: hookBranch(when, then, false),
        },
        {
          id: 'b',
          identityLabel: paths[1],
          label: `${titles[2]}·${paths[1]}`,
          effects: lineB(kits, when, false),
        },
      ],
    },
    4: {
      star: 4,
      label: titles[3]!,
      effects: [
        { kind: 'stat_pct', mainPct: 0.04 },
        { kind: 'skill_mult', delta: 0.1 },
      ],
    },
    5: {
      star: 5,
      label: titles[4]!,
      effects: [{ kind: 'stat_pct', mainPct: 0.04 }, { kind: 'skill_mult', delta: 0.08 }],
    },
    6: {
      star: 6,
      label: titles[5]!,
      effects: [],
      branches: [
        {
          id: 'a',
          identityLabel: paths[0],
          label: `${titles[5]}·${paths[0]}`,
          effects: hookBranch(when, then, true),
        },
        {
          id: 'b',
          identityLabel: paths[1],
          label: `${titles[5]}·${paths[1]}`,
          effects: lineB(kits, when, true),
        },
      ],
    },
  };
}

export const LEGENDARY_EXPAND_STAR_OVERRIDES: Record<
  string,
  Partial<Record<number, StarNodeDef>>
> = {};

for (const id of Object.keys(LEGENDARY_EXPAND_HOOKS)) {
  LEGENDARY_EXPAND_STAR_OVERRIDES[id] = compileOne(id);
}
