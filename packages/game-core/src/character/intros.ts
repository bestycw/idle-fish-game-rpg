/**
 * 人物一句话介绍。头栏用人设，不写打法（打法在技能页）。
 */
import { ZHONGTU_ROSTER } from './roster/zhongtuRoster.js';

const WRITTEN: Record<string, string> = {
  hero: '无名行者，阵中补位，何处缺人便往何处去。',
  zhangfei: '燕人张翼德，当阳桥上一声喝，前军谁敢近前。',
  zhaoyun: '常山赵子龙，长坂坡七进七出，一身是胆。',
  wukong: '齐天大圣孙悟空，金箍棒扫开天庭与凡尘。',
  huatuo: '神医华佗，剖骨疗毒，残局交到他手里。',
  houyi: '射日英雄后羿，九日落、一乌存，箭不虚发。',
  zhuge: '卧龙诸葛亮，借东风、布八阵，先算后打。',
  baigujing: '白骨夫人三戏唐僧，善化形、扰人心。',
  guanyu: '美髯公关羽，过五关斩六将，义薄云天。',
  lvbu: '飞将吕布，人中吕布马中赤兔，谁都不服。',
  dianwei: '古之恶来典韦，双手铁戟，死守营门。',
  nezha: '哪吒三太子，风火轮踏碎陈塘，莲身再世。',
  daji: '狐媚妲己，一笑倾城，专扰人心。',
  yangjian: '二郎真君杨戬，三眼看破幻术，哮天随行。',
  change: '月里嫦娥，奔月之后只余清辉与桂影。',
  xishi: '浣纱西施，一笑可沉吴国的江山。',
  sunbin: '兵家孙膑，减灶诱敌，残身仍能排兵。',
  zhouyu: '江东周郎，赤壁一把火烧断北军的退路。',
  xiangyu: '西楚霸王，破釜沉舟，不肯回头。',
  nuwa: '造人补天的上古女神，炼石填缺。',
  yuefei: '岳家军统帅，精忠二字刻进脊梁。',
  jiangziya: '封神台上那支笔，谁上榜由他说了算。',
  liubei: '汉昭烈刘备，桃园一拜，带着人往仁义那边走。',
  pangtong: '凤雏庞统，连环营还未排完，人已落在坡上。',
  niumowang: '平天大牛魔王，芭蕉洞里称混世，火眼也要让三分。',
  tangseng: '金蝉子转世唐僧，西行取经，紧箍勒的是心不是人。',
  tieshan: '罗刹女铁扇公主，一扇可熄八百里火焰山。',
};

const byId = new Map(ZHONGTU_ROSTER.map((e) => [e.id, e]));

export function characterIntro(templateId: string): string {
  const written = WRITTEN[templateId];
  if (written) return written;
  const e = byId.get(templateId);
  if (e) return `${e.lore} · ${e.motif}。`;
  return '';
}
