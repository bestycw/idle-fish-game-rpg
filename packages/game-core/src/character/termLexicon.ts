/**
 * 点词说明：给玩家看效果怎么算。
 * 本技能数字由 UI 从词后摘出（如 +8、×1.2），blurb 只写机制。
 */
export type TermFamily = 'setup' | 'hard_cc' | 'swing' | 'rating' | 'skill' | 'aid';

export interface TermEntry {
  id: string;
  name: string;
  family: TermFamily;
  blurb: string;
}

export const TERM_FAMILY_LABELS: Record<TermFamily, string> = {
  setup: '减益',
  hard_cc: '控制',
  swing: '扰乱',
  rating: '属性',
  skill: '招式',
  aid: '援助',
};

/** 制作侧备注；不要进玩家弹窗。 */
export const TERM_FAMILY_HINTS: Record<TermFamily, string> = {
  setup: '必上，不写必中。强度在括号里。',
  hard_cc: '要掷命中，会抵抗。命中率 ≠ 强度。',
  swing: '更难上；首领常免疫。',
  rating: '整数评分换百分比，堆得越多越薄。',
  skill: '条件乘区。本卡倍率写在词后面。',
  aid: '净化、结界、招魂、灌气。',
};

export const TERM_LEXICON: TermEntry[] = [
  {
    id: 'bleed',
    name: '流血',
    family: 'setup',
    blurb: '目标每次行动开始，按生命上限×3%×层数掉血（至少 1 点）。最多 3 层，不吃攻击、不暴击。',
  },
  {
    id: 'shred',
    name: '破甲',
    family: 'setup',
    blurb: '压低目标防御。防御×82% 表示只剩 82%。精通可再压深。',
  },
  {
    id: 'slow',
    name: '迟缓',
    family: 'setup',
    blurb: '身法变慢，出手更晚。通常行动权重 ×75%。',
  },
  {
    id: 'heal_block',
    name: '禁疗',
    family: 'setup',
    blurb: '期间治疗无效。',
  },
  {
    id: 'mark_prey',
    name: '猎印',
    family: 'setup',
    blurb: '目标承伤提高。承伤×115% 表示吃 115% 伤害。',
  },
  {
    id: 'poison',
    name: '毒雾',
    family: 'setup',
    blurb: '与流血相同：每回按生命上限×3%×层数掉血。',
  },
  {
    id: 'burn',
    name: '灼魂',
    family: 'setup',
    blurb: '与流血相同：每回按生命上限×3%×层数掉血。',
  },
  {
    id: 'stun',
    name: '眩晕',
    family: 'hard_cc',
    blurb: '无法行动。需命中，约 40% 命中；连续控制会越来越难上。',
  },
  {
    id: 'silence',
    name: '沉默',
    family: 'hard_cc',
    blurb: '无法放技能，仍可普攻。约 40% 命中。',
  },
  {
    id: 'havoc',
    name: '混乱',
    family: 'swing',
    blurb: '乱打，可能打到友军。约 25% 命中；首领常免疫。',
  },
  {
    id: 'sleep',
    name: '沉眠',
    family: 'swing',
    blurb: '无法行动，受伤会醒。约 30% 命中。',
  },
  {
    id: 'berserk',
    name: '狂乱',
    family: 'swing',
    blurb: '只能普攻，出手伤害 ×130%，可能打自己。约 25% 命中。',
  },
  {
    id: 'crit',
    name: '暴击',
    family: 'rating',
    blurb: '暴击率由评分换算：评分÷(评分+80)，上限 60%。堆得越多，同一笔加成越薄。',
  },
  {
    id: 'crit_dmg',
    name: '暴伤',
    family: 'rating',
    blurb: '暴击时在 1.5 倍基础上再加评分换算，上限 +80%。',
  },
  {
    id: 'pen',
    name: '穿透',
    family: 'rating',
    blurb: '评分换算为穿透率，用于打穿护甲。',
  },
  {
    id: 'mastery',
    name: '精通',
    family: 'rating',
    blurb: '按职能生效：控制更稳、破甲更深、治疗更厚。不改普攻公式。',
  },
  {
    id: 'tenacity',
    name: '坚韧',
    family: 'rating',
    blurb: '评分换算为减伤。坦克破境常走这条。',
  },
  {
    id: 'fortune',
    name: '气运',
    family: 'rating',
    blurb: '影响状态命中与被控，不直接加伤害。',
  },
  {
    id: 'main_stat',
    name: '主属性',
    family: 'rating',
    blurb: '攻、防、抗、血、身法一起提升。升星与破境的底子。',
  },
  {
    id: 'follow_up',
    name: '连击',
    family: 'skill',
    blurb: '技能结算后有概率再打一下。触发率与连击倍率见技能标注。',
  },
  {
    id: 'execute',
    name: '斩杀',
    family: 'skill',
    blurb: '目标生命过低时，本招伤害额外提高。',
  },
  {
    id: 'vs_shield',
    name: '对盾增伤',
    family: 'skill',
    blurb: '目标身上有护盾时，本招伤害额外提高。',
  },
  {
    id: 'shield',
    name: '护盾',
    family: 'skill',
    blurb: '先扣盾再掉血。盾量 = 攻击 × 护盾倍率 ×（1+坦克精通），不暴击。',
  },
  {
    id: 'taunt',
    name: '嘲讽',
    family: 'swing',
    blurb: '迫使敌方攻击施加者。约 55% 命中；首领常减半。',
  },
  {
    id: 'qi_drought',
    name: '闭气',
    family: 'setup',
    blurb: '期间无法回复气。',
  },
  {
    id: 'unstable',
    name: '反噬印',
    family: 'setup',
    blurb: '被净化或驱散时，反伤动手的人。',
  },
  {
    id: 'atk_up',
    name: '加持',
    family: 'skill',
    blurb: '出手伤害提高，通常约 ×115%。可被驱散。',
  },
  {
    id: 'def_up',
    name: '铁壁咒',
    family: 'skill',
    blurb: '承伤降低，通常承伤 ×88%。可被驱散。',
  },
  {
    id: 'spd_up',
    name: '神行',
    family: 'skill',
    blurb: '行动权重提高，出手更早。通常约 ×120%。',
  },
  {
    id: 'stagger',
    name: '卸力',
    family: 'skill',
    blurb: '本次承伤的 40% 推迟到自己下次行动再结算。可被驱散。',
  },
  {
    id: 'self_shield',
    name: '护体',
    family: 'skill',
    blurb: '只给自己叠盾。盾量 = 力系攻击 × 倍率 ×（1+坦克精通）。',
  },
  {
    id: 'first_cast',
    name: '先声增伤',
    family: 'skill',
    blurb: '本场第一次放出这招时，伤害额外提高。',
  },
  {
    id: 'surround',
    name: '合围',
    family: 'skill',
    blurb: '目标相邻格还有存活敌人时，本招伤害额外提高。',
  },
  {
    id: 'vs_rank',
    name: '镇煞',
    family: 'skill',
    blurb: '目标是精英或首领时，本招伤害额外提高；小兵不触发。',
  },
  {
    id: 'vs_cc',
    name: '乘乱增伤',
    family: 'skill',
    blurb: '目标处于眩晕、沉眠等硬控时，本招伤害额外提高。',
  },
  {
    id: 'nirvana',
    name: '涅槃',
    family: 'skill',
    blurb: '本场限一次：本该死时按生命上限比例起身。',
  },
  {
    id: 'block',
    name: '格挡',
    family: 'rating',
    blurb: '触发后本次伤害 ×70%（削去 30%）。标注的是格挡率。',
  },
  {
    id: 'dodge',
    name: '闪避',
    family: 'rating',
    blurb: '触发后本次伤害为 0。有效闪避 = 闪避 − 对方穿透×0.3。',
  },
  {
    id: 'lifesteal',
    name: '吸血',
    family: 'rating',
    blurb: '造成伤害后，按本次伤害比例为自己抬血。',
  },
  {
    id: 'thorns',
    name: '反伤',
    family: 'rating',
    blurb: '挨打后按本次伤害比例弹回（至少 1 点）。',
  },
  {
    id: 'cleanse',
    name: '净化',
    family: 'aid',
    blurb: '清除友军一道减益。硬控通常清不掉。',
  },
  {
    id: 'purge',
    name: '驱散',
    family: 'aid',
    blurb: '清除敌人一道增益（护盾、加持等）。',
  },
  {
    id: 'revive',
    name: '招魂',
    family: 'aid',
    blurb: '拉起一名倒下的队友（优先主角），按生命上限比例恢复生命。',
  },
  {
    id: 'team_shield',
    name: '队友结界',
    family: 'aid',
    blurb: '全队各得一层护盾。盾量 = 力系攻击 × 倍率 ×（1+坦克精通），不暴击。',
  },
  {
    id: 'ally_qi',
    name: '灌气',
    family: 'aid',
    blurb: '给友军每人灌一截气。有触发率时先掷骰，未中则全队都不灌；中了接近再放一招。',
  },
  {
    id: 'heal_low',
    name: '残血加疗',
    family: 'aid',
    blurb: '友方生命过低时，本次治疗额外加量。',
  },
  {
    id: 'kill_refund',
    name: '击杀还元',
    family: 'aid',
    blurb: '这招击杀后，按耗能比例返还气，最多计 2 个击杀。',
  },
  {
    id: 'steal_qi',
    name: '夺气',
    family: 'aid',
    blurb: '从每个目标抽取固定气给自己。',
  },
  {
    id: 'regen',
    name: '回春',
    family: 'aid',
    blurb: '每次行动开始，按生命上限比例抬血。通常 4%。可被驱散。',
  },
];

const BY_ID = new Map(TERM_LEXICON.map((e) => [e.id, e]));
const BY_EXACT_NAME = new Map(TERM_LEXICON.map((e) => [e.name, e]));
const BY_NAME = [...TERM_LEXICON].sort((a, b) => b.name.length - a.name.length);

export function getTerm(id: string): TermEntry | undefined {
  return BY_ID.get(id);
}

export function termIdByName(name: string): string | undefined {
  return BY_EXACT_NAME.get(name)?.id;
}

export function termsInFamily(family: TermFamily): TermEntry[] {
  return TERM_LEXICON.filter((e) => e.family === family);
}

export function termFamilyOf(id: string): TermFamily | undefined {
  return BY_ID.get(id)?.family;
}

export type TermSpan =
  | { kind: 'text'; value: string }
  | { kind: 'term'; id: string; name: string };

/** 把文案里出现的点词切开。 */
export function splitByTermNames(text: string): TermSpan[] {
  if (!text) return [];
  const spans: TermSpan[] = [];
  let cursor = 0;
  while (cursor < text.length) {
    let hit: { index: number; entry: TermEntry } | null = null;
    const slice = text.slice(cursor);
    for (const entry of BY_NAME) {
      const at = slice.indexOf(entry.name);
      if (at < 0) continue;
      if (!hit || at < hit.index || (at === hit.index && entry.name.length > hit.entry.name.length)) {
        hit = { index: at, entry };
      }
    }
    if (!hit) {
      spans.push({ kind: 'text', value: text.slice(cursor) });
      break;
    }
    if (hit.index > 0) {
      spans.push({ kind: 'text', value: slice.slice(0, hit.index) });
    }
    spans.push({ kind: 'term', id: hit.entry.id, name: hit.entry.name });
    cursor += hit.index + hit.entry.name.length;
  }
  return spans;
}

/** 词后面跟的本技能数字/回数。括号里的 · 不算分隔。 */
export function takeLocalNote(text: string): string | null {
  const s = text.replace(/^[：:\s]+/, '');
  if (!s) return null;
  let depth = 0;
  let out = '';
  for (const ch of s) {
    if (ch === '（' || ch === '(') depth += 1;
    if ((ch === '·' || ch === '。') && depth === 0) break;
    out += ch;
    if (ch === '）' || ch === ')') depth = Math.max(0, depth - 1);
  }
  const cut = out.trim();
  return cut || null;
}

/** 文案里第一个可点开的词。 */
export function firstTermIdIn(text: string): string | undefined {
  const hit = splitByTermNames(text).find((s) => s.kind === 'term');
  return hit?.kind === 'term' ? hit.id : undefined;
}
