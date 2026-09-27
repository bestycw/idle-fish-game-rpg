/**
 * dev-loop 每轮战斗冒烟：替换/追加本批验收卡 id（须能 `owned` 上阵）。
 * 改这里 + combatFlowSmoke 测例会在 npm test 里跑多轮 auto battle。
 */
export const LOOP_COMBAT_SPOTLIGHT: readonly string[] = [
  // 封神 expand（§13.2 前）
  'shengongbao',
  'aobing',
  'taiyi',
  // 上古 expand（§13.2）
  'huangdi',
  'chiyou',
  'xiwangmu',
  'fuxi',
  'dayu',
  // 吴越 expand（§13.3）
  'nieyinniang',
  'jingke',
  'ganjiang',
  'moye',
  'libai',
  'wuzixu',
  // 群雄 expand（§13.4）
  'caocao',
  'simayi',
  'guojia',
  // W1 八仙+东海（§13.5）
  'lvdongbin',
  'hanzhongli',
  'tieguaili',
  'aoguang',
  // W2 江南（§13.6）
  'baisuzhen',
  'xiaoqing',
  'fahai',
  'zhinu',
  // W3 楚汉（§13.7）
  'liubang',
  'hanxin',
  'zhangliang',
  'yuji',
  // W4 兵家（§13.8）
  'guiguzi',
  'sunwu',
  'gongshuban',
  'pangjuan',
  // W5 忠烈（§13.9）
  'muguiying',
  'yangye',
  'mulan',
  'shetaijun',
  // W6 梁山（§13.10）
  'linchong',
  'wusong',
  'luzhishen',
  'songjiang',
  // W7 瓦岗（§13.11）
  'qinqiong',
  'lishimin',
  'yuchigong',
  'luocheng',
  // W8 宝莲+降妖（§13.12）
  'chenxiang',
  'sanshengmu',
  'zhongkui',
  'xuxun',
  'jigong',
  // W9 聊斋（§13.13）
  'zhangdaoling',
  'niexiaoqian',
  'yanchixia',
  'huapi',
];
