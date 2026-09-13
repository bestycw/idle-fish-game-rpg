/**
 * 未深做卡：典故星章名叠在职能轨上；绝/珍在 ★3（绝再加 ★6）给两条技能分支。
 * 深做卡由 DEEP_STAR_OVERRIDES 覆盖，不走本表。
 */
import type { Role } from '../../shared/types.js';
import type { StarBranchDef, StarNodeDef, StarNodeEffect } from '../starTypes.js';
import { ZHONGTU_ROSTER } from './zhongtuRoster.js';

type Paths = readonly [string, string];

type LoreDef = {
  titles: readonly string[];
  paths?: Paths;
};

function fx(role: Role, star: 3 | 6): [StarNodeEffect[], StarNodeEffect[]] {
  if (role === 'tank') {
    return star === 3
      ? [
          [{ kind: 'effect_unlock', effect: { kind: 'team_shield', multiplier: 0.38 } }],
          [
            { kind: 'status_unlock', status: { statusId: 'taunt', duration: 1 } },
            { kind: 'rare_stat', stat: 'thorns', value: 0.08 },
          ],
        ]
      : [
          [
            { kind: 'effect_unlock', effect: { kind: 'team_shield', multiplier: 0.5 } },
            { kind: 'rare_stat', stat: 'block', value: 0.05 },
          ],
          [{ kind: 'nirvana', hpRatio: 0.3 }],
        ];
  }
  if (role === 'st_burst') {
    return star === 3
      ? [
          [{ kind: 'enable_follow_up', chance: 0.32, multiplier: 0.62 }],
          [{ kind: 'effect_unlock', effect: { kind: 'execute', value: 0.28, multiplier: 1.32 } }],
        ]
      : [
          [
            { kind: 'effect_unlock', effect: { kind: 'execute', value: 0.32, multiplier: 1.4 } },
            { kind: 'effect_unlock', effect: { kind: 'refund_qi_on_kill', value: 0.4 } },
          ],
          [
            { kind: 'rating', stat: 'critDmgRating', value: 10 },
            { kind: 'enable_follow_up', chance: 0.18, multiplier: 0.5 },
          ],
        ];
  }
  if (role === 'aoe_dps') {
    return star === 3
      ? [
          [{ kind: 'enable_follow_up', chance: 0.3, multiplier: 0.55 }],
          [{ kind: 'effect_unlock', effect: { kind: 'first_cast', multiplier: 1.22 } }],
        ]
      : [
          [{ kind: 'effect_unlock', effect: { kind: 'execute', value: 0.28, multiplier: 1.3 } }],
          [{ kind: 'effect_unlock', effect: { kind: 'surround', multiplier: 1.25 } }],
        ];
  }
  if (role === 'st_ctrl') {
    return star === 3
      ? [
          [{ kind: 'status_unlock', status: { statusId: 'silence', duration: 1, chance: 0.55 } }],
          [{ kind: 'status_boost', duration: 1 }],
        ]
      : [
          [{ kind: 'status_unlock', status: { statusId: 'stun', duration: 1, chance: 0.45 } }],
          [{ kind: 'status_boost', duration: 1, valueMult: 0.9 }],
        ];
  }
  if (role === 'aoe_ctrl') {
    return star === 3
      ? [
          [{ kind: 'status_unlock', status: { statusId: 'havoc', duration: 1, chance: 0.45 } }],
          [{ kind: 'status_boost', duration: 1 }],
        ]
      : [
          [{ kind: 'status_unlock', status: { statusId: 'silence', duration: 1, chance: 0.5 } }],
          [{ kind: 'status_boost', duration: 1, valueMult: 0.9 }],
        ];
  }
  if (role === 'group_amp') {
    return star === 3
      ? [
          [{ kind: 'effect_unlock', effect: { kind: 'ally_grant_qi', value: 14 } }],
          [{ kind: 'effect_unlock', effect: { kind: 'team_shield', multiplier: 0.34 } }],
        ]
      : [
          [{ kind: 'effect_unlock', effect: { kind: 'ally_grant_qi', value: 20 } }],
          [{ kind: 'effect_unlock', effect: { kind: 'team_shield', multiplier: 0.48 } }],
        ];
  }
  if (role === 'st_heal') {
    return star === 3
      ? [
          [{ kind: 'effect_unlock', effect: { kind: 'cleanse' } }],
          [{ kind: 'effect_unlock', effect: { kind: 'heal_low_hp', value: 0.4, multiplier: 1.28 } }],
        ]
      : [
          [{ kind: 'effect_unlock', effect: { kind: 'revive_ally', value: 0.32 } }],
          [{ kind: 'effect_unlock', effect: { kind: 'ally_grant_qi', value: 16 } }],
        ];
  }
  if (role === 'aoe_heal') {
    return star === 3
      ? [
          [{ kind: 'effect_unlock', effect: { kind: 'cleanse' } }],
          [{ kind: 'effect_unlock', effect: { kind: 'team_shield', multiplier: 0.36 } }],
        ]
      : [
          [{ kind: 'effect_unlock', effect: { kind: 'revive_ally', value: 0.3 } }],
          [{ kind: 'effect_unlock', effect: { kind: 'team_shield', multiplier: 0.5 } }],
        ];
  }
  return star === 3
    ? [
        [{ kind: 'effect_unlock', effect: { kind: 'purge' } }],
        [{ kind: 'enable_follow_up', chance: 0.28, multiplier: 0.58 }],
      ]
    : [
        [{ kind: 'effect_unlock', effect: { kind: 'first_cast', multiplier: 1.2 } }],
        [{ kind: 'enable_follow_up', chance: 0.16, multiplier: 0.5 }],
      ];
}

function branches(role: Role, star: 3 | 6, paths: Paths): StarBranchDef[] {
  const [a, b] = fx(role, star);
  return [
    { id: 'a', label: `${star === 3 ? paths[0] : paths[0]}`, identityLabel: paths[0], effects: a },
    { id: 'b', label: `${star === 3 ? paths[1] : paths[1]}`, identityLabel: paths[1], effects: b },
  ];
}

/** 未深做卡典故名 + 绝/珍分支短名 */
export const LORE_DEFS: Record<string, LoreDef> = {
  machao: { titles: ['西凉', '潼关', '锦马超', '冀城', '渭桥', '许都'], paths: ['突阵', '锦马'] },
  huangyueying: { titles: ['木牛', '流马', '机关', '武侯宅', '连弩', '星灯'], paths: ['连弩', '木牛'] },
  huangzhong: { titles: ['老当', '定军', '黄汉升', '百步', '斩夏侯', '五虎'], paths: ['百步', '定军'] },
  jiangwei: { titles: ['天水', '九伐', '伯约', '沓中', '剑阁', '承志'], paths: ['九伐', '承志'] },
  xushu: { titles: ['走马荐', '新野', '元直', '曹营', '孝心', '一言'] },
  weiyan: { titles: ['子午', '汉中', '反骨', '前军', '南郑'] },
  zhurong: { titles: ['火神', '藤甲', '洞主', '飞刀'] },
  menghuo: { titles: ['七擒', '南蛮', '藤甲'] },
  caocao: { titles: ['兖州', '官渡', '挟天子', '铜雀', '赤壁', '魏武'], paths: ['挟令', '奸雄'] },
  simayi: { titles: ['鹰视', '空城', '狼顾', '巾帼', '高平陵', '冢虎'], paths: ['隐忍', '夺魏'] },
  guojia: { titles: ['十胜', '郭嘉', '遗计', '定河北', '病中', '奉孝'], paths: ['遗计', '十胜'] },
  xuchu: { titles: ['裸衣', '殿虎', '许褚', '护驾', '许田'], paths: ['裸衣', '护驾'] },
  zhangliao: { titles: ['逍遥津', '合肥', '张辽', '八百', '江东'], paths: ['突击', '镇淮'] },
  diaochan: { titles: ['闭月', '凤仪', '连环', '吕布', '董卓'], paths: ['连环', '闭月'] },
  luxun: { titles: ['火烧', '夷陵', '陆逊', '书生帅', '东吴'], paths: ['火攻', '儒将'] },
  chengong: { titles: ['弃曹', '濮阳', '白门'] },
  sunquan: { titles: ['坐断', '江东', '紫髯', '合肥', '称帝'], paths: ['守江', '争衡'] },
  taishici: { titles: ['神亭', '弓马', '北海'] },
  daqiao: { titles: ['二乔', '铜雀', '江东', '小乔妹', '国色'], paths: ['国色', '铜雀'] },
  caiwenji: { titles: ['胡笳', '文姬', '归汉'] },
  xiaoqiao: { titles: ['二乔', '铜雀', '江东'] },
  ganning: { titles: ['锦帆', '百骑', '西陵'] },
  honghaier: { titles: ['圣婴', '火尖', '红孩', '车迟', '莲台'], paths: ['三昧', '圣婴'] },
  zhenyuanzi: { titles: ['人参果', '五庄', '镇元', '袖里', '地仙'], paths: ['果园', '袖里'] },
  bajie: { titles: ['高老庄', '九齿', '天蓬', '流沙', '净坛'], paths: ['九齿', '天蓬'] },
  bailongma: { titles: ['鹰愁涧', '白马', '西海'] },
  jinjiao: { titles: ['葫芦', '金角', '平顶'] },
  yinjiao: { titles: ['紫金葫', '银角', '平顶'] },
  nvguowang: { titles: ['西梁', '招亲', '女儿国'] },
  zhizhujing: { titles: ['盘丝', '七情', '蛛丝'] },
  shaseng: { titles: ['流沙', '宝杖', '卷帘'] },
  taibai: { titles: ['招安', '金星', '天庭'] },
  huangfeng: { titles: ['黄风', '虎先锋', '灵吉'] },
  shengongbao: { titles: ['北海', '反殷', '申公豹', '敖丙', '灭商', '阻截'], paths: ['说反', '阻截'] },
  aobing: { titles: ['龙宫', '陈塘', '敖丙', '抽筋', '莲身', '华盖'], paths: ['龙息', '莲身'] },
  taiyi: { titles: ['乾元', '莲花', '太乙', '哪吒', '金光', '金霞'], paths: ['莲化', '金光'] },
  wenzhong: { titles: ['闻太师', '金鞭', '绝龙岭', '墨麒麟', '摘星'], paths: ['金鞭', '绝龙'] },
  zhaogongming: { titles: ['财神', '金龙', '赵公明', '钉头', '峨眉'], paths: ['金龙', '钉头'] },
  zhouwang: { titles: ['酒池', '炮烙', '朝歌', '妲己', '摘星'], paths: ['炮烙', '酒池'] },
  lijing: { titles: ['托塔', '陈塘', '李靖', '天王', '哪吒'], paths: ['托塔', '天王'] },
  yunxiao: { titles: ['九曲', '黄河', '云霄', '混元', '三仙'], paths: ['黄河', '混元'] },
  huangfeihu: { titles: ['反商', '五岳', '黄飞虎'] },
  tuxingsun: { titles: ['土遁', '准提', '西岐'] },
  dengchanyu: { titles: ['五光石', '邓婵玉', '金鸡'] },
  leizhenzi: { titles: ['风雷', '翅', '西岐'] },
  qiongxiao: { titles: ['金蛟', '琼霄', '黄河'] },
  bixiao: { titles: ['混元', '碧霄', '三仙'] },
  huangdi: { titles: ['涿鹿', '轩辕', '黄帝', '指南', '合符', '垂衣'], paths: ['涿鹿', '垂衣'] },
  chiyou: { titles: ['兵主', '铜头', '蚩尤', '雾阵', '涿鹿', '战神'], paths: ['雾阵', '兵主'] },
  xiwangmu: { titles: ['瑶池', '蟠桃', '西王母', '昆仑', '罚罪', '金母'], paths: ['蟠桃', '罚罪'] },
  fuxi: { titles: ['八卦', '龙身', '伏羲', '网罟', '琴瑟', '人文'], paths: ['八卦', '人文'] },
  dayu: { titles: ['治水', '过门', '大禹', '九州', '鼎', '疏导'], paths: ['疏导', '九州'] },
  shennong: { titles: ['百草', '耒耜', '神农', '尝毒', '茶'], paths: ['百草', '耒耜'] },
  xingtian: { titles: ['干戚', '无头', '刑天', '舞', '不屈'], paths: ['干戚', '不屈'] },
  jingwei: { titles: ['填海', '精卫', '发鸠', '木石', '衔石'], paths: ['填海', '衔石'] },
  nuba: { titles: ['旱魃', '赤地', '黄帝'] },
  zhurongshi: { titles: ['祝融', '火正', '衡山'] },
  kuafu: { titles: ['逐日', '渴死', '杖桃'] },
  gonggong: { titles: ['触山', '共工', '水德'] },
  jumang: { titles: ['春神', '句芒', '木德'] },
  lvdongbin: { titles: ['岳阳', '剑仙', '洞宾', '黄粱', '三戏', '纯阳'], paths: ['剑仙', '黄粱'] },
  hanzhongli: { titles: ['芭蕉', '汉钟离', '度吕', '飞剑', '正阳', '散仙'], paths: ['度人', '飞剑'] },
  tieguaili: { titles: ['铁拐', '葫芦', '李玄', '尸解', '济世', '拐李'], paths: ['葫芦', '济世'] },
  aoguang: { titles: ['东海', '龙王', '敖广', '水晶', '陈塘', '借兵'], paths: ['龙宫', '借兵'] },
  hexiangu: { titles: ['荷花', '何仙姑', '罗浮', '笊篱', '灵芝'], paths: ['荷花', '罗浮'] },
  zhangguolao: { titles: ['倒骑', '纸驴', '张果', '赵州', '隐'], paths: ['倒骑', '隐世'] },
  hanxiangzi: { titles: ['花篮', '韩湘', '蓝关'] },
  longnv: { titles: ['潮音', '龙女', '宝珠'] },
  lancahe: { titles: ['拍板', '蓝采和', '踏歌'] },
  caoguojiu: { titles: ['朝笏', '曹国舅', '云阳'] },
  baimudan: { titles: ['洛阳', '牡丹', '白'] },
  nieyinniang: { titles: ['刺客', '隐娘', '磨镜', '精精儿', '空空儿', '剑匣'], paths: ['隐刺', '剑匣'] },
  jingke: { titles: ['易水', '督亢', '图穷', '秦庭', '樊於期', '悲歌'], paths: ['图穷', '易水'] },
  ganjiang: { titles: ['铸剑', '莫邪', '干将', '剑气', '吴越', '双剑'], paths: ['铸锋', '剑气'] },
  moye: { titles: ['雌剑', '投炉', '莫邪', '子剑', '复仇', '湛卢'], paths: ['投炉', '雌剑'] },
  libai: { titles: ['将进酒', '蜀道', '青莲', '捉月', '剑器', '谪仙'], paths: ['酒剑', '捉月'] },
  wuzixu: { titles: ['过昭关', '鞭尸', '子胥', '钱塘', '抉眼', '怒潮'], paths: ['鞭尸', '怒潮'] },
  hongxian: { titles: ['红线', '夜盗', '潞州', '金盒', '侠'], paths: ['夜盗', '金盒'] },
  fanli: { titles: ['扁舟', '陶朱', '范蠡', '西施', '五湖'], paths: ['五湖', '陶朱'] },
  gaojianli: { titles: ['筑声', '高渐离', '易水', '熏目', '击秦'], paths: ['筑声', '击秦'] },
  zhuanzhu: { titles: ['鱼肠', '专诸', '炙鱼'] },
  kunlunnu: { titles: ['昆仑', '负主', '红绡'] },
  yuenv: { titles: ['越女', '剑术', '袁公'] },
  yaoli: { titles: ['要离', '刺庆忌', '断臂'] },
  yuangong: { titles: ['白猿', '袁公', '竹'] },
  baisuzhen: { titles: ['断桥', '盗仙草', '白蛇', '水漫', '雷峰', '报恩'], paths: ['仙草', '水漫'] },
  xiaoqing: { titles: ['青蛇', '护姐', '小青', '剑', '金山', '同修'], paths: ['护姐', '青剑'] },
  fahai: { titles: ['金山', '钵盂', '法海', '降妖', '雷峰', '禅杖'], paths: ['钵盂', '降妖'] },
  zhinu: { titles: ['天河', '织锦', '织女', '鹊桥', '别离', '云锦'], paths: ['织锦', '鹊桥'] },
  qixiannv: { titles: ['槐荫', '七仙', '织绢', '董永', '天条'], paths: ['织绢', '槐荫'] },
  liangshanbo: { titles: ['草桥', '同窗', '梁祝', '化蝶', '坟'], paths: ['同窗', '化蝶'] },
  zhuyingtai: { titles: ['女扮', '英台', '祭坟', '化蝶', '草桥'], paths: ['女扮', '化蝶'] },
  niulang: { titles: ['牵牛', '鹊桥', '金牛'] },
  mengjiangnv: { titles: ['哭城', '孟姜', '万喜良'] },
  xuxian: { titles: ['保和堂', '许仙', '断桥'] },
  wanxiliang: { titles: ['筑城', '万喜良', '寒衣'] },
  dongyong: { titles: ['槐荫', '董永', '织绢'] },
  liubang: { titles: ['鸿门', '大风', '沛公', '约法', '斩蛇', '汉高'], paths: ['约法', '鸿门'] },
  hanxin: { titles: ['背水', '胯下', '韩信', '十面', '点兵', '淮阴'], paths: ['背水', '点兵'] },
  zhangliang: { titles: ['圯桥', '张良', '椎秦', '运筹', '辟谷', '留侯'], paths: ['运筹', '椎秦'] },
  yuji: { titles: ['垓下', '剑舞', '虞兮', '别姬', '楚歌', '贞'], paths: ['剑舞', '别姬'] },
  fanzeng: { titles: ['亚父', '鸿门', '范增', '玉玦', '弃'], paths: ['玉玦', '亚父'] },
  xiaohe: { titles: ['月下', '追韩', '萧何', '律令', '镇国家'], paths: ['追韩', '律令'] },
  yingbu: { titles: ['九江', '英布', '叛楚'] },
  fankuai: { titles: ['鸿门', '樊哙', '彘肩'] },
  quyuan: { titles: ['离骚', '汨罗', '屈子', '天问', '怀沙'], paths: ['离骚', '怀沙'] },
  xiangbo: { titles: ['项伯', '舞剑', '救沛'] },
  pengyue: { titles: ['梁地', '彭越', '游兵'] },
  guiguzi: { titles: ['云梦', '纵横', '鬼谷', '孙庞', '出世', '捭阖'], paths: ['捭阖', '点化'] },
  sunwu: { titles: ['兵法', '吴宫', '孙武', '十三篇', '斩姬', '庙算'], paths: ['庙算', '斩姬'] },
  gongshuban: { titles: ['云梯', '墨守', '公输', '机心', '攻城', '止楚'], paths: ['云梯', '机心'] },
  pangjuan: { titles: ['马陵', '庞涓', '妒才', '减灶', '魏将', '树下'], paths: ['妒才', '马陵'] },
  wuqi: { titles: ['杀妻', '吴起', '河西', '吮疽', '楚悼'], paths: ['河西', '吮疽'] },
  suqin: { titles: ['合纵', '苏秦', '佩六国'] },
  zhangyi: { titles: ['连横', '张仪', '欺楚'] },
  yueyi: { titles: ['乐毅', '下齐', '燕昭'] },
  mozi: { titles: ['非攻', '墨子', '守圉', '兼爱', '止楚'], paths: ['非攻', '守圉'] },
  muguiying: { titles: ['挂帅', '穆桂英', '大破', '天门', '杨门'], paths: ['挂帅', '天门'] },
  yangye: { titles: ['金沙滩', '杨业', '李陵碑', '七郎', '撞碑', '令公'], paths: ['死守', '撞碑'] },
  mulan: { titles: ['替父', '木兰', '从军', '十二载', '还乡', '花木'], paths: ['从军', '还乡'] },
  shetaijun: { titles: ['佘太君', '百岁', '挂帅', '天波', '杨门', '百岁帅'], paths: ['挂帅', '天波'] },
  lianghongyu: { titles: ['擂鼓', '梁红玉', '金山', '韩世忠', '黄天荡'], paths: ['擂鼓', '黄天荡'] },
  yangyanzhao: { titles: ['六郎', '杨延昭', '三关', '穆桂英', '天波'], paths: ['三关', '六郎'] },
  yangpaifeng: { titles: ['烧火', '杨排风', '棍'] },
  yueyun: { titles: ['岳云', '锤', '朱仙'] },
  hanshizhong: { titles: ['韩世忠', '黄天荡', '梁红玉', '金山', '武'], paths: ['黄天荡', '守江'] },
  yangzongbao: { titles: ['宗保', '穆柯', '帅印'] },
  zhangxian: { titles: ['张宪', '岳家', '风波'] },
  linchong: { titles: ['豹子头', '白虎堂', '林冲', '风雪山神', '投梁', '枪'], paths: ['逼上', '枪神'] },
  wusong: { titles: ['景阳冈', '武松', '十字坡', '鸳鸯楼', '醉打', '行者'], paths: ['打虎', '血溅'] },
  luzhishen: { titles: ['倒拔', '鲁达', '拳镇关西', '桃花山', '禅杖', '花和尚'], paths: ['倒拔', '禅杖'] },
  songjiang: { titles: ['及时雨', '宋江', '招安', '梁山', '黑宋', '忠义'], paths: ['聚义', '招安'] },
  wuyong: { titles: ['智多星', '吴用', '连环', '黄泥冈', '军师'], paths: ['连环', '智计'] },
  lujunyi: { titles: ['玉麒麟', '卢俊义', '大名', '梁山', '刀'], paths: ['陷井', '玉麟'] },
  likui: { titles: ['黑旋风', '李逵', '斧', '沂岭', '忠'], paths: ['双斧', '黑旋'] },
  gongsunsheng: { titles: ['入云龙', '公孙胜', '道术'] },
  husanniang: { titles: ['一丈青', '扈三娘', '红线'] },
  huarong: { titles: ['小李广', '花荣', '神箭'] },
  yanqing: { titles: ['浪子', '燕青', '相扑'] },
  chaijin: { titles: ['小旋风', '柴进', '庄园'] },
  qinqiong: { titles: ['秦琼', '卖马', '锏', '瓦岗', '门神'], paths: ['双锏', '门神'] },
  lishimin: { titles: ['天策', '世民', '玄武', '秦王', '贞观', '唐宗'], paths: ['天策', '贞观'] },
  yuchigong: { titles: ['尉迟', '鞭', '敬德', '单鞭', '门神'], paths: ['单鞭', '门神'] },
  luocheng: { titles: ['罗成', '枪', '淤泥', '瓦岗', '银枪'], paths: ['银枪', '淤泥'] },
  shanxiongxin: { titles: ['单雄信', '枣阳', '槊', '反唐', '金堤'], paths: ['金槊', '反唐'] },
  xumaogong: { titles: ['徐茂公', '半仙', '瓦岗', '军师', '凌烟'], paths: ['半仙', '军师'] },
  chengyaojin: { titles: ['程咬金', '三斧', '瓦岗', '混世', '皇'], paths: ['三斧', '混世'] },
  weizheng: { titles: ['魏征', '谏', '斩龙'] },
  wangbodang: { titles: ['王伯当', '箭', '瓦岗'] },
  peiyuanqing: { titles: ['裴元庆', '锤', '少年'] },
  limi: { titles: ['李密', '魏公', '洛口'] },
  wuyunzhao: { titles: ['伍云召', '反隋', '南阳'] },
  chenxiang: { titles: ['沉香', '劈山', '宝莲', '救母', '神斧', '华山'], paths: ['劈山', '救母'] },
  sanshengmu: { titles: ['三圣母', '宝莲', '思凡', '压山', '神灯', '华山'], paths: ['思凡', '宝莲'] },
  pili: { titles: ['霹雳', '大仙', '沉香'] },
  gashan: { titles: ['嘎善', '护山', '丁山'] },
  liuyanchang: { titles: ['刘彦昌', '进京', '书生'] },
  zhongkui: { titles: ['钟馗', '捉鬼', '进士', '啖邪', '判官', '终南'], paths: ['捉鬼', '啖邪'] },
  xuxun: { titles: ['许逊', '斩蛟', '旌阳', '飞升', '净明', '十二真'], paths: ['斩蛟', '净明'] },
  jigong: { titles: ['济公', '破帽', '酒肉', '癫僧', '净慈', '活佛'], paths: ['癫济', '酒肉'] },
  zhangdaoling: { titles: ['张道陵', '龙虎', '天师', '符箓', '正一', '鹤鸣'], paths: ['符箓', '天师'] },
  sazhenren: { titles: ['萨真人', '西河', '雷法'] },
  wanglingguan: { titles: ['王灵官', '鞭', '护法'] },
  cuipanguan: { titles: ['崔判官', '簿', '鄷都'] },
  wuchang: { titles: ['无常', '勾魂', '黑白'] },
  niexiaoqian: { titles: ['聂小倩', '兰若', '报恩', '燕赤霞', '宁采臣', '鬼'], paths: ['报恩', '兰若'] },
  yanchixia: { titles: ['燕赤霞', '剑', '崂山', '斩妖', '道袍', '问道'], paths: ['斩妖', '问道'] },
  huapi: { titles: ['画皮', '换面', '王生', '裂皮', '太原', '画皮妖'], paths: ['换面', '裂皮'] },
  lupan: { titles: ['陆判', '换心', '朱尔旦', '簿', '冥'], paths: ['换心', '冥簿'] },
  yingning: { titles: ['婴宁', '笑', '狐', '花', '鬼'] , paths: ['憨笑', '花丛'] },
  lianxiang: { titles: ['莲香', '狐', '桑生'] },
  jiaona: { titles: ['娇娜', '狐医', '孔生'] },
  ningcaisen: { titles: ['宁采臣', '兰若', '书生'] },
};

function compileOne(id: string, role: Role, rarity: string, def: LoreDef): Partial<Record<number, StarNodeDef>> {
  const out: Partial<Record<number, StarNodeDef>> = {};
  const branched = Boolean(def.paths) && (rarity === 'legendary' || rarity === 'epic');
  def.titles.forEach((label, i) => {
    const star = i + 1;
    const isPick = branched && star === 3;
    const isClimax = branched && rarity === 'legendary' && star === 6;
    out[star] = {
      star,
      label,
      effects: [],
      stack: !(isPick || isClimax),
      branches: isPick || isClimax ? branches(role, star === 6 ? 6 : 3, def.paths!) : undefined,
    };
  });
  return out;
}

export const LORE_STAR_OVERRIDES: Record<string, Partial<Record<number, StarNodeDef>>> = {};
for (const e of ZHONGTU_ROSTER) {
  const def = LORE_DEFS[e.id];
  if (!def) continue;
  LORE_STAR_OVERRIDES[e.id] = compileOne(e.id, e.role, e.rarity, def);
}
