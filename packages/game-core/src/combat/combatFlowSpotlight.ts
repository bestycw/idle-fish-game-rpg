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
];
