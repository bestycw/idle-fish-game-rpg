import type { Rarity } from '../../shared/types.js';

export type UnlockBatch = 'start' | 'ch1' | 'ch2' | 'ch3' | 'ch4' | 'ch5' | 'ch6';

export type CircleId =
  | 'shu'
  | 'qunxiong'
  | 'xiyou'
  | 'fengshen'
  | 'shanggu'
  | 'baxian'
  | 'wuyue'
  | 'jiangnan'
  | 'chuhan'
  | 'bingjia'
  | 'zhonglie'
  | 'liangshan'
  | 'wagang'
  | 'baolian'
  | 'xiangyao'
  | 'liaozhai';

export const CIRCLE_LABELS: Record<CircleId, string> = {
  shu: '蜀汉',
  qunxiong: '群雄',
  xiyou: '取经',
  fengshen: '封神',
  shanggu: '上古',
  baxian: '八仙',
  wuyue: '吴越剑',
  jiangnan: '江南传奇',
  chuhan: '楚汉',
  bingjia: '兵家',
  zhonglie: '忠烈',
  liangshan: '梁山',
  wagang: '瓦岗',
  baolian: '宝莲',
  xiangyao: '降妖',
  liaozhai: '聊斋',
};

export interface BondPair {
  a: string;
  b: string;
  label: string;
}

/** 圈内对手戏；本轮只展示不结算 */
export const CIRCLE_BONDS: BondPair[] = [
  { a: 'liubei', b: 'guanyu', label: '桃园' },
  { a: 'liubei', b: 'zhangfei', label: '桃园' },
  { a: 'guanyu', b: 'zhangfei', label: '桃园' },
  { a: 'guanyu', b: 'zhaoyun', label: '五虎' },
  { a: 'zhangfei', b: 'zhaoyun', label: '五虎' },
  { a: 'zhaoyun', b: 'machao', label: '五虎' },
  { a: 'zhaoyun', b: 'huangzhong', label: '五虎' },
  { a: 'zhuge', b: 'pangtong', label: '卧龙凤雏' },
  { a: 'zhuge', b: 'jiangwei', label: '传灯' },
  { a: 'zhuge', b: 'huangyueying', label: '琴瑟' },
  { a: 'guanyu', b: 'huatuo', label: '刮骨' },
  { a: 'liubei', b: 'menghuo', label: '七擒' },
  { a: 'caocao', b: 'dianwei', label: '恶来' },
  { a: 'caocao', b: 'xuchu', label: '虎痴' },
  { a: 'caocao', b: 'guojia', label: '奉孝' },
  { a: 'lvbu', b: 'diaochan', label: '连环' },
  { a: 'lvbu', b: 'chengong', label: '辕门' },
  { a: 'diaochan', b: 'chengong', label: '连环' },
  { a: 'sunquan', b: 'zhouyu', label: '江东' },
  { a: 'zhouyu', b: 'daqiao', label: '小乔' },
  { a: 'zhouyu', b: 'xiaoqiao', label: '二乔' },
  { a: 'daqiao', b: 'xiaoqiao', label: '二乔' },
  { a: 'zhouyu', b: 'caocao', label: '赤壁' },
  { a: 'caocao', b: 'caiwenji', label: '胡笳' },
  { a: 'wukong', b: 'tangseng', label: '师徒' },
  { a: 'wukong', b: 'bajie', label: '师徒' },
  { a: 'wukong', b: 'shaseng', label: '师徒' },
  { a: 'tangseng', b: 'bailongma', label: '白龙' },
  { a: 'niumowang', b: 'tieshan', label: '魔王' },
  { a: 'tieshan', b: 'honghaier', label: '红孩' },
  { a: 'niumowang', b: 'honghaier', label: '红孩' },
  { a: 'jinjiao', b: 'yinjiao', label: '金角银角' },
  { a: 'baigujing', b: 'tangseng', label: '三戏' },
  { a: 'nezha', b: 'lijing', label: '父子' },
  { a: 'nezha', b: 'taiyi', label: '莲身' },
  { a: 'nezha', b: 'aobing', label: '抽龙筋' },
  { a: 'jiangziya', b: 'shengongbao', label: '同门' },
  { a: 'yunxiao', b: 'zhaogongming', label: '三霄' },
  { a: 'qiongxiao', b: 'zhaogongming', label: '三霄' },
  { a: 'bixiao', b: 'zhaogongming', label: '三霄' },
  { a: 'daji', b: 'zhouwang', label: '倾城' },
  { a: 'yangjian', b: 'chenxiang', label: '舅甥' },
  { a: 'nuwa', b: 'fuxi', label: '兄妹' },
  { a: 'huangdi', b: 'chiyou', label: '涿鹿' },
  { a: 'houyi', b: 'change', label: '奔月' },
  { a: 'kuafu', b: 'houyi', label: '逐日' },
  { a: 'jingwei', b: 'nuba', label: '填海' },
  { a: 'gonggong', b: 'zhurongshi', label: '触山' },
  { a: 'lvdongbin', b: 'hanzhongli', label: '八仙' },
  { a: 'lvdongbin', b: 'baimudan', label: '牡丹' },
  { a: 'aoguang', b: 'lvdongbin', label: '过海' },
  { a: 'jingke', b: 'gaojianli', label: '易水' },
  { a: 'ganjiang', b: 'moye', label: '铸剑' },
  { a: 'xishi', b: 'fanli', label: '浣纱' },
  { a: 'nieyinniang', b: 'hongxian', label: '剑侠' },
  { a: 'baisuzhen', b: 'xuxian', label: '白蛇' },
  { a: 'baisuzhen', b: 'xiaoqing', label: '白蛇' },
  { a: 'fahai', b: 'baisuzhen', label: '雷峰' },
  { a: 'liangshanbo', b: 'zhuyingtai', label: '梁祝' },
  { a: 'niulang', b: 'zhinu', label: '鹊桥' },
  { a: 'mengjiangnv', b: 'wanxiliang', label: '哭城' },
  { a: 'dongyong', b: 'qixiannv', label: '天仙配' },
  { a: 'xiangyu', b: 'yuji', label: '虞兮' },
  { a: 'liubang', b: 'zhangliang', label: '汉臣' },
  { a: 'liubang', b: 'hanxin', label: '汉臣' },
  { a: 'liubang', b: 'xiaohe', label: '汉臣' },
  { a: 'fankuai', b: 'xiangbo', label: '鸿门' },
  { a: 'guiguzi', b: 'sunbin', label: '鬼谷' },
  { a: 'guiguzi', b: 'pangjuan', label: '鬼谷' },
  { a: 'sunbin', b: 'pangjuan', label: '同门相残' },
  { a: 'suqin', b: 'zhangyi', label: '纵横' },
  { a: 'mozi', b: 'gongshuban', label: '攻守' },
  { a: 'yuefei', b: 'yueyun', label: '岳家' },
  { a: 'lianghongyu', b: 'hanshizhong', label: '击鼓' },
  { a: 'yangye', b: 'shetaijun', label: '杨门' },
  { a: 'muguiying', b: 'yangzongbao', label: '杨门' },
  { a: 'linchong', b: 'luzhishen', label: '野猪林' },
  { a: 'songjiang', b: 'wuyong', label: '梁山' },
  { a: 'qinqiong', b: 'yuchigong', label: '御前' },
  { a: 'qinqiong', b: 'chengyaojin', label: '瓦岗' },
  { a: 'luocheng', b: 'shanxiongxin', label: '表兄弟' },
  { a: 'lishimin', b: 'xumaogong', label: '秦王' },
  { a: 'lishimin', b: 'weizheng', label: '谏臣' },
  { a: 'chenxiang', b: 'sanshengmu', label: '劈山' },
  { a: 'sanshengmu', b: 'liuyanchang', label: '天仙' },
  { a: 'niexiaoqian', b: 'ningcaisen', label: '倩女' },
  { a: 'niexiaoqian', b: 'yanchixia', label: '捉鬼' },
  { a: 'yanchixia', b: 'ningcaisen', label: '兰若' },
];

export interface RosterBond {
  with: string;
  label: string;
}

const START_NAMED = new Set([
  'zhangfei',
  'zhaoyun',
  'wukong',
  'huatuo',
  'houyi',
  'guanyu',
  'dianwei',
]);

function isFanLiang(rarity: Rarity): boolean {
  return rarity === 'common' || rarity === 'rare';
}

/** 按圈 + 品级算解锁档。开局点名绝品除外。 */
export function unlockFor(id: string, circleId: CircleId | null, rarity: Rarity): UnlockBatch | null {
  if (!circleId || id === 'hero') return null;
  if (START_NAMED.has(id)) return 'start';
  switch (circleId) {
    case 'shu':
    case 'xiyou':
      return isFanLiang(rarity) ? 'start' : 'ch1';
    case 'wuyue':
    case 'zhonglie':
      return isFanLiang(rarity) ? 'ch1' : 'ch2';
    case 'qunxiong':
      return 'ch2';
    case 'liangshan':
    case 'wagang':
      return 'ch3';
    case 'fengshen':
    case 'jiangnan':
      return 'ch4';
    case 'chuhan':
    case 'baxian':
    case 'baolian':
      return 'ch5';
    case 'shanggu':
    case 'xiangyao':
    case 'liaozhai':
    case 'bingjia':
      return 'ch6';
    default:
      return 'ch6';
  }
}

export function bondsFor(templateId: string): RosterBond[] {
  const out: RosterBond[] = [];
  for (const b of CIRCLE_BONDS) {
    if (b.a === templateId) out.push({ with: b.b, label: b.label });
    else if (b.b === templateId) out.push({ with: b.a, label: b.label });
  }
  return out;
}
