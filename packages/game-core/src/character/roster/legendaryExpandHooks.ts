/**
 * 未深做绝品扩展卡：一人一条场合钩子，盖掉 kit 叠软模式。
 * ★0 把钩子烘进同一招；星章见 legendaryExpandStars。
 * 不克隆刘备灌气/招魂、赵云猎印斩杀、主角破妄。
 */
import type { SkillDef, SoftModeDef } from '../../shared/types.js';

export interface LegendaryExpandHook {
  blurb: string;
  softModes: SoftModeDef[];
}

function hook(
  blurb: string,
  when: SoftModeDef['when'],
  then: SoftModeDef['then'],
  copy: string,
): LegendaryExpandHook {
  return { blurb, softModes: [{ when, then, copy }] };
}

export const LEGENDARY_EXPAND_HOOKS: Record<string, LegendaryExpandHook> = {
  caocao: hook('挟天子以令：抽干敌方能量。本场第一令，号令压得更死。', { kind: 'first_cast' }, { multiplierDelta: 0.12 }, '本场第一令：号令更深'),
  simayi: hook('冢虎隐忍：先立铁壁。自己残血时，隐忍反咬一口。', { kind: 'self_hp_below', value: 0.4 }, { multiplierDelta: 0.14 }, '自己残血：冢虎反咬'),
  guojia: hook('十胜十败先算一筹：本场第一咒，加持压在开战。', { kind: 'first_cast' }, { multiplierDelta: 0.1 }, '本场第一筹：十胜先算'),
  shengongbao: hook('妨贤害能：点沉眠。已睡的人，再被压进梦里。', { kind: 'target_has_status', statusId: 'sleep' }, { multiplierDelta: 0.12 }, '沉眠中：妨贤再压'),
  aobing: hook('龙太子浪打十字。本场第一潮，浪头最狠。', { kind: 'first_cast' }, { multiplierDelta: 0.1 }, '本场第一潮：龙浪更深'),
  taiyi: hook('莲花化身：净化并抬血。本场第一剂，莲台更净。', { kind: 'first_cast' }, { effectPatches: [{ kind: 'cleanse' }] }, '本场第一剂：莲台更净'),
  huangdi: hook('涿鹿誓师：抬全队攻势。本场第一誓，军心更齐。', { kind: 'first_cast' }, { multiplierDelta: 0.1 }, '本场第一誓：涿鹿加持'),
  chiyou: hook('兵主开战横扫前排。本场第一刀，兵气最烈。', { kind: 'first_cast' }, { multiplierDelta: 0.12 }, '本场第一刀：兵主开战'),
  xiwangmu: hook('瑶池点穴：眩晕敌人。已被硬控时，这一指砸实。', { kind: 'target_under_cc' }, { multiplierDelta: 0.12 }, '已被硬控：瑶池点实'),
  fuxi: hook('一画开天：给队友灌气。本场第一画，气机最足。', { kind: 'first_cast' }, { effectPatches: [{ kind: 'ally_grant_qi', value: 28 }] }, '本场第一画：开天气足'),
  dayu: hook('疏河定州：驱散障碍。本场第一铲，河道先通。', { kind: 'first_cast' }, { effectPatches: [{ kind: 'purge' }] }, '本场第一铲：河道先通'),
  lvdongbin: hook('剑仙斩妖并带流血。已见血时，纯阳剑再深一寸。', { kind: 'target_has_status', statusId: 'bleed' }, { multiplierDelta: 0.12 }, '已见血：纯阳再斩'),
  hanzhongli: hook('轻摇宝扇先立盾。本场第一摇，扇风最厚。', { kind: 'first_cast' }, { multiplierDelta: 0.1 }, '本场第一摇：宝扇更厚'),
  tieguaili: hook('铁拐济世：治疗并净化。本场第一剂，葫芦最灵。', { kind: 'first_cast' }, { effectPatches: [{ kind: 'cleanse' }] }, '本场第一剂：葫芦最灵'),
  aoguang: hook('龙王掀浪迟缓一片。已迟缓的人，被浪钉死脚步。', { kind: 'target_has_status', statusId: 'slow' }, { multiplierDelta: 0.1 }, '已迟缓：龙浪钉步'),
  nieyinniang: hook('飞剑取首专打残血。生命将尽时，隐锋毕命。', { kind: 'target_hp_below', value: 0.32 }, { multiplierDelta: 0.16 }, '残血：隐锋毕命'),
  jingke: hook('图穷匕见，专刺后排。本场第一匕，地图翻开。', { kind: 'first_cast' }, { multiplierDelta: 0.12 }, '本场第一匕：图穷'),
  ganjiang: hook('铸剑开锋浪打一列。本场第一锤，剑成开刃。', { kind: 'first_cast' }, { multiplierDelta: 0.1 }, '本场第一锤：开锋成剑'),
  moye: hook('雌剑嗜满血。本场第一噬，满血处最饿。', { kind: 'first_cast' }, { effectPatches: [{ kind: 'vs_high_hp', value: 0.7, multiplier: 1.32 }] }, '本场第一噬：满血开刃'),
  libai: hook('将进酒横扫邻格。本场第一斗，诗百更烈。', { kind: 'first_cast' }, { multiplierDelta: 0.1 }, '本场第一斗：将进酒'),
  wuzixu: hook('过昭关夜给自己叠盾。残夜未尽时，盾更硬。', { kind: 'self_hp_below', value: 0.4 }, { multiplierDelta: 0.12 }, '自己残血：昭关夜盾'),
  baisuzhen: hook('西湖救许：净化并抬血。本场第一救，水漫更暖。', { kind: 'first_cast' }, { multiplierDelta: 0.1 }, '本场第一救：西湖更暖'),
  xiaoqing: hook('青蛇给后排挂猎印。印还在时，青鳞咬得更死。', { kind: 'target_has_status', statusId: 'mark_prey' }, { multiplierDelta: 0.14 }, '猎印目标：青鳞咬死'),
  fahai: hook('钵印迟妖。已迟缓时，金钵压得更死。', { kind: 'target_has_status', statusId: 'slow' }, { multiplierDelta: 0.12 }, '已迟缓：金钵压死'),
  zhinu: hook('鹊桥织锦抬全队气血。本场第一织，锦上更暖。', { kind: 'first_cast' }, { multiplierDelta: 0.1 }, '本场第一织：鹊桥抬血'),
  liubang: hook('约法三章先立铁壁。本场第一令，法度立住。', { kind: 'first_cast' }, { multiplierDelta: 0.1 }, '本场第一令：约法立壁'),
  hanxin: hook('背水一战抬攻守。绝地残血时，韩信愈战愈凶。', { kind: 'self_hp_below', value: 0.4 }, { multiplierDelta: 0.14 }, '自己残血：背水加持'),
  zhangliang: hook('进履得书：点晕敌人。已被硬控时，这一策砸实。', { kind: 'target_under_cc' }, { multiplierDelta: 0.1 }, '已被硬控：兵书砸实'),
  yuji: hook('垓下舞剑给残血队友加疗。本场第一舞，剑气最暖。', { kind: 'first_cast' }, { multiplierDelta: 0.1 }, '本场第一舞：垓下抬血'),
  guiguzi: hook('纵横捭阖抬身法。本场第一纵横，开合最快。', { kind: 'first_cast' }, { multiplierDelta: 0.1 }, '本场第一纵横：开合更快'),
  sunwu: hook('不战屈人：抽干能量。已闭气时，再抽一把。', { kind: 'target_has_status', statusId: 'qi_drought' }, { multiplierDelta: 0.1 }, '已闭气：不战再抽'),
  gongshuban: hook('云梯攻城拆甲，并以械为城。甲已破时，云梯压城。', { kind: 'target_has_status', statusId: 'shred' }, { multiplierDelta: 0.12 }, '已破甲：云梯压城'),
  pangjuan: hook('马陵争道专打后排。本场第一道，埋伏先发。', { kind: 'first_cast' }, { multiplierDelta: 0.1 }, '本场第一道：马陵埋伏'),
  muguiying: hook('挂帅破阵浪打一列。本场第一阵，帅旗先开。', { kind: 'first_cast' }, { multiplierDelta: 0.1 }, '本场第一阵：挂帅破开'),
  yangye: hook('李陵碑前为全队结界。本场第一道，残阳最厚。', { kind: 'first_cast' }, { effectPatches: [{ kind: 'team_shield', multiplier: 0.4 }] }, '本场第一道：李陵结界'),
  mulan: hook('替父从军：先灌一口气再破障。本场第一刀，红妆卸尽。', { kind: 'first_cast' }, { effectPatches: [{ kind: 'purge' }] }, '本场第一刀：红妆卸尽'),
  shetaijun: hook('佘太君点将立铁壁。本场第一令，杨门听令。', { kind: 'first_cast' }, { multiplierDelta: 0.1 }, '本场第一令：杨门听令'),
  linchong: hook('风雪山神庙带流血。已见血时，豹子头再刺一枪。', { kind: 'target_has_status', statusId: 'bleed' }, { multiplierDelta: 0.12 }, '已见血：豹子头再刺'),
  wusong: hook('景阳冈专打残血。本场第一拳，酒气先发。', { kind: 'first_cast' }, { multiplierDelta: 0.12 }, '本场第一拳：景阳先发'),
  luzhishen: hook('倒拔垂杨嘲讽锁敌。本场第一喝，禅杖锁死。', { kind: 'first_cast' }, { statusPatches: [{ statusId: 'taunt', duration: 3 }] }, '本场第一喝：禅杖锁敌'),
  songjiang: hook('及时雨令抬全队攻势。本场第一令，兄弟听令。', { kind: 'first_cast' }, { multiplierDelta: 0.1 }, '本场第一令：及时雨'),
  qinqiong: hook('锏震瓦岗，挨打回春。自己残血时，双锏回春更深。', { kind: 'self_hp_below', value: 0.4 }, { multiplierDelta: 0.12 }, '自己残血：双锏回春'),
  lishimin: hook('天策开府抬身法。本场第一令，府兵先动。', { kind: 'first_cast' }, { multiplierDelta: 0.1 }, '本场第一令：天策开府'),
  yuchigong: hook('黑鞭守门先立盾。本场第一鞭，门楣最厚。', { kind: 'first_cast' }, { multiplierDelta: 0.1 }, '本场第一鞭：守门盾厚'),
  luocheng: hook('银枪先发。本场第一枪，罗成已至。', { kind: 'first_cast' }, { multiplierDelta: 0.14 }, '本场第一枪：罗成已至'),
  chenxiang: hook('斧劈华山带裂伤。山已裂时，神斧再深一记。', { kind: 'target_has_status', statusId: 'bleed' }, { multiplierDelta: 0.12 }, '已开裂：神斧再劈'),
  sanshengmu: hook('宝莲灯暖抬全队。本场第一暖，灯花最亮。', { kind: 'first_cast' }, { multiplierDelta: 0.1 }, '本场第一暖：宝莲灯'),
  zhongkui: hook('捉鬼啖邪给自己叠盾。邪气反噬、自己残血时，鬼判盾更硬。', { kind: 'self_hp_below', value: 0.4 }, { multiplierDelta: 0.12 }, '自己残血：鬼判盾硬'),
  xuxun: hook('斩蛟贯列。本场第一贯，蛟首先落。', { kind: 'first_cast' }, { multiplierDelta: 0.1 }, '本场第一贯：斩蛟'),
  jigong: hook('癫僧覆袖：群疗薄盾。本场第一幕，破袖结界。', { kind: 'first_cast' }, { effectPatches: [{ kind: 'team_shield', multiplier: 0.36 }] }, '本场第一幕：破袖结界'),
  zhangdaoling: hook('龙虎山点沉眠。已睡的人，符印再压一记。', { kind: 'target_has_status', statusId: 'sleep' }, { multiplierDelta: 0.12 }, '沉眠中：符印再压'),
  niexiaoqian: hook('兰若惊魂点晕。已被硬控时，这一惊砸实。', { kind: 'target_under_cc' }, { multiplierDelta: 0.1 }, '已被硬控：兰若惊魂'),
  yanchixia: hook('道袍猎妖专刺后排。本场第一剑，木剑先发。', { kind: 'first_cast' }, { multiplierDelta: 0.12 }, '本场第一剑：木剑猎妖'),
  huapi: hook('画皮换面扰乱心神。已乱的人，人皮再碎一层。', { kind: 'target_has_status', statusId: 'havoc' }, { multiplierDelta: 0.12 }, '已乱：人皮再碎'),
};

function bakeHookIntoSkill(skill: SkillDef, hookDef: LegendaryExpandHook, motif?: string): SkillDef {
  const when = hookDef.softModes[0]?.when;
  const then = hookDef.softModes[0]?.then;
  if (!when || !then) return skill;
  const effects = [...(skill.effects ?? [])];
  const has = (kind: string) => effects.some((e) => e.kind === kind);
  if (when.kind === 'first_cast' && then.multiplierDelta && !then.effectPatches && !has('first_cast')) {
    effects.push({ kind: 'first_cast', multiplier: 1 + then.multiplierDelta });
  }
  if (when.kind === 'self_hp_below' && !has('self_low_hp')) {
    effects.push({ kind: 'self_low_hp', value: when.value, multiplier: 1.18 });
  }
  if (when.kind === 'target_hp_below' && !has('execute')) {
    effects.push({ kind: 'execute', value: when.value, multiplier: 1.28 });
  }
  return {
    ...skill,
    name: /诀/.test(skill.name) && motif ? motif : skill.name,
    blurb: hookDef.blurb,
    effects: effects.length ? effects : skill.effects,
    softModes: hookDef.softModes.map((m) => ({
      ...m,
      when: { ...m.when },
      then: { ...m.then },
    })),
  };
}

export function applyLegendaryExpandHook(
  templateId: string,
  skill: SkillDef,
  motif?: string,
): SkillDef {
  const hookDef = LEGENDARY_EXPAND_HOOKS[templateId];
  if (!hookDef) return skill;
  return bakeHookIntoSkill(skill, hookDef, motif);
}
