# 能力池总表（Ability Pool Catalog）

> **地位：** 内容库（2026-08-02；2026-08-26 收同质）。**后续加角色时的选材表**：按人物历史/典故背景，从本池挑选能力，组合进该角色的招牌技能与升星星章。  
> **配合：** [skill-design-spec](./2026-08-02-skill-design-spec.md)、[character-foundation](./2026-08-02-character-foundation-design.md)、[combat §4.13/4.15](./systems/combat.md)。  
> **玩家不养成能力池**——池是制作侧原子；玩家养成仍是人·星·装。  
> **丰富性来自「背景选题 + 组合」**，不是把百余条全塞进一张卡。  
> **现网可配（N）** 必须能映射到 `ABILITY_ATOMS`（`packages/game-core/src/character/abilityAtoms.ts`）。已挂星轨的 id **不能删、不能改义**。

## 0. 怎么用（加角色流程）

```
1. 读人物历史母题（一句话）
2. 在本池按母题选题：属性 / 控制 / 连击 / 护盾…（通常底板 1～2 条核心 + 星章分散）
3. 组合成该角色的招牌 SkillDef（战斗动词 + 主能力）
4. ★1–★6 星章：典故命名 + 各挂 1～2 条能力 id（必须含一条被动；默认按 role 取 `ROLE_STAR_LADDERS`）
5. ★3 / ★6 至少 1 条质变向能力（目录标 ★）
6. 实现：能力 id → StarNodeEffect / SkillModifier → composeSkill
```

**一句话：** 池是「零件柜」，角色背景是「装配图」，装出来的才是那个人的技能。

**选题优先：** 同一机制只留一档 canonical。新卡用 `a_main_pct_s` / `c_mult_s` / `d_follow_s`；已挂的 `_m` 档继续生效，勿新用 `_l`。不要预打包（`b_tank_kit` 等）。不要换皮重复（fear→`g_havoc`，seal→`g_silence`）。

| 列 | 含义 |
|----|------|
| id | 稳定能力 id（拉丁蛇形） |
| 名 | 中性显示名（故事皮可换词） |
| 类 | 见 §1 |
| 钩子 | 落点：`stat` / `rating` / `rare` / `status` / `effect` / `follow` / `skill` / `rule` |
| 档 | **N**=现网可配（已进 `ABILITY_ATOMS` 且有 compose/战斗钩子）；并入 id 见 §2.2，不进原子表 |
| 质变 | ★ 适合当 ★3/★6 身份质变 |

参考气质（非版权）：经典 ARPG/回合、网游 Buff 轴、网文「悟道/神通/杀招」节奏——机制中性化后入库。

---

## 1. 分类索引

| 类码 | 类名 | 约条数 | 说明 |
|------|------|--------|------|
| A | 主属性 / 底子 | 11 | 攻防血速等；档位分身见 §2.2 |
| B | 副属性 / 稀有 | 11 | 一条一词；预打包见 §2.2 |
| C | 技能数值 | 8 | 倍率、耗能、治疗/范围加深 |
| D | 连击 / 追加 | 7 | followUp 与变体 |
| E | 伤害修饰 | 11 | 斩杀、对盾、乘乱、撼岳、先声 |
| F | 持续伤害 / 削弱 | 12 | DoT、破甲、迟滞、封疗、猎印 |
| G | 控制 | 9 | 硬控软控（含嘲讽/缴械） |
| H | 增益 / 护盾 | 11 | 攻防速短 Buff、护体、结界 |
| I | 治疗 / 续航 | 8 | 抬血、HoT、击杀回血、净化 |
| J | 驱散 / 破局 | 6 | purge / 破守 |
| K | 能量 / 节奏 | 6 | qi 经济 |
| L | 位面 / 九宫 | 8 | 前后排、列、残血焦点 |
| M | 特殊神通 | 14 | 复活、分摊、标记引爆等多 L |
| — | **合计** | **≈122** | 并入 id 见 §2.2，不另占活跃条 |

---

## 2. 能力表

### A · 主属性 / 底子

| id | 名 | 钩子 | 档 | 质变 | 备注 |
|----|----|------|----|------|------|
| a_main_pct_s | 底子微幅 | stat | N | | 现网默认档；mainPct +3% |
| a_main_pct_m | 底子强化 | stat | N | | **已挂星轨**；新卡勿用，叠 s |
| a_hp_pct | 体魄 | stat | N | | 仅生命%（`split_stat` hp） |
| a_atk_phys | 力势 | rating/stat | N | | 偏 phys；`split_stat` atk |
| a_atk_spirit | 灵机 | rating/stat | N | | 偏 spirit；`split_stat` atk |
| a_def_phys | 铁骨 | stat | N | | `split_stat` def |
| a_def_spirit | 定心 | stat | N | | `split_stat` res |
| a_spd_edge | 先机 | stat | N | | 身法微幅 |
| a_vers_wall | 均衡壁 | rating | N | | 现网无 versRating；用 tenacity |
| a_mastery_edge | 精通锋 | rating | N | | masteryRating |
| a_final_edge | 终势 | rating | N | ★ | `final_dmg` |

### B · 副属性 / 稀有

| id | 名 | 钩子 | 档 | 质变 | 备注 |
|----|----|------|----|------|------|
| b_crit | 会心 | rating | N | | critRating |
| b_crit_dmg | 暴烈 | rating | N | | critDmgRating |
| b_haste | 勤修 | rating | N | | 急速只回能（`qi_passive.basic`；无 hasteRating） |
| b_lifesteal | 嗜血 | rare | N | | |
| b_dodge | 飘忽 | rare | N | | |
| b_block | 格挡 | rare | N | | |
| b_counter | 反击 | rare | N | | |
| b_thorns | 反刺 | rare | N | | |
| b_resilience | 不屈 | rare | N | | |
| b_fortune | 气运 | rating | N | | fortuneRating |
| b_crit_resist | 沉着 | rare | N | | critResist |

### C · 技能数值

| id | 名 | 钩子 | 档 | 质变 | 备注 |
|----|----|------|----|------|------|
| c_mult_s | 招式加深 | skill | N | | 现网默认；skill_mult +0.1 |
| c_mult_m | 招式大成 | skill | N | ★ | **已挂**；新卡慎叠 |
| c_qi_cheap | 省元 | skill | N | | qi_cost -5 |
| c_heal_mult | 济世加深 | skill | N | | 治疗技能倍率（heal tag） |
| c_guard_mult | 守势加深 | skill | N | | guard/shield 倍率 |
| c_aoe_mult | 横扫加深 | skill | N | | aoe tag 倍率 |
| c_single_mult | 一点加深 | skill | N | | single 倍率 |
| c_status_power | 符效 | skill | N | | status_boost valueMult |

### D · 连击 / 追加

| id | 名 | 钩子 | 档 | 质变 | 备注 |
|----|----|------|----|------|------|
| d_follow_s | 连势 | follow | N | ★ | 现网默认；chance≈0.25×0.55 |
| d_follow_m | 连斩 | follow | N | ★ | **已挂**；新卡勿再叠 l |
| d_follow_heal | 连济 | follow | N | ★ | 治疗后再抬一刀血 |
| d_follow_shred | 连破 | follow | N | ★ | 连击附带破甲 |
| d_extra_hit_front | 扫尾 | follow | N | ★ | 额外打前排另一人 |
| d_on_kill_follow | 追亡 | follow | N | ★ | 击杀触发追加 |
| d_counter_follow | 反击连 | follow | N | | 受击后下次行动连 |

### E · 伤害修饰

| id | 名 | 钩子 | 档 | 质变 | 备注 |
|----|----|------|----|------|------|
| e_vs_low_hp | 猎残 | rule/focus | N | ★ | focusPolicy lowest_hp；斩杀见 `e_execute` / `m_execute` |
| e_vs_high_hp | 撼岳 | rule | N | ★ | 目标血量≥65% 增伤（2026-08-26） |
| e_vs_shield | 碎甲 | rule | N | ★ | `vs_shield`；勿再做「破盾」换皮 |
| e_vs_cc | 乘乱 | rule | N | ★ | 目标带硬控时增伤（2026-08-26） |
| e_first_cast | 先声 | rule | N | ★ | `first_cast` |
| e_execute | 斩杀 | rule | N | ★ | `execute` 残血增伤 |
| e_self_low | 残血狂 | rule | N | ★ | 自己 ≤40% 血输出 ×1.3（2026-08-26） |
| e_vs_rank | 镇煞 | rule | N | ★ | 对 elite/Boss ×1.22 |
| e_surround | 合围 | rule | N | ★ | 目标邻格还有活人 ×1.2 |
| e_focus_streak | 一鼓作气 | rule | N | ★ | 连续打同一人每层 +8%，最多 3 |
| e_back_bonus | 袭后 | rule | N | ★ | pierce+后排（`vs_back`） |

### F · 持续伤害 / 削弱

| id | 名 | 钩子 | 档 | 质变 | 备注 |
|----|----|------|----|------|------|
| f_bleed | 流血 | status | N | | bleed |
| f_bleed_deep | 血河 | status | N | ★ | status_boost layers/duration |
| f_poison | 毒雾 | status | N | ★ | DoT tick |
| f_burn | 灼魂 | status | N | ★ | DoT |
| f_frostbite | 霜噬 | status | N | | DoT+缓 |
| f_shred | 破甲 | status | N | | shred |
| f_shred_deep | 碎铠 | status | N | ★ | value 更深 / 时长 |
| f_slow | 迟滞 | status | N | | slow |
| f_heal_block | 封疗 | status | N | ★ | heal_block |
| f_atk_down | 丧锋 | status | N | | 降低攻击（与 `h_atk_up` 对位） |
| f_mark_prey | 猎印 | status | N | ★ | 承伤倍率；引爆见 `m_mark_pop` |
| f_unstable | 驱则反噬 | status | N | ★ | 印被净化/驱散时反噬驱散者 |
| f_corruption | 侵蚀 | status | N | | 叠层爆炸（网文毒誓） |

### G · 控制

| id | 名 | 钩子 | 档 | 质变 | 备注 |
|----|----|------|----|------|------|
| g_stun | 震慑 | status | N | ★ | stun；时长变体见 §2.2 |
| g_sleep | 沉眠 | status | N | ★ | sleep |
| g_freeze | 凝冰 | status | N | ★ | 类 stun 桶 |
| g_root | 定身 | status | N | | 行动权重减半 |
| g_silence | 禁咒 | status | N | ★ | silence |
| g_havoc | 乱心 | status | N | ★ | havoc；fear 并入本条 |
| g_berserk | 狂乱 | status | N | | berserk |
| g_taunt | 嘲讽 | status | N | ★ | 焦点锁 sourceUid |
| g_disarm | 缴械 | status | N | | 禁普攻 |

### H · 增益 / 护盾

| id | 名 | 钩子 | 档 | 质变 | 备注 |
|----|----|------|----|------|------|
| h_shield | 护体 | effect | N | ★ | `self_shield` 给自己叠盾（不打到敌人） |
| h_shield_team | 结界 | effect | N | ★ | `team_shield` |
| h_atk_up | 加持 | effect | N | | 自身 2 回输出×1.15 |
| h_def_up | 铁壁咒 | effect | N | | 自身 2 回承伤×0.88（减伤，不是盾） |
| h_spd_up | 神行 | effect | N | | 自身 2 回先手权重×1.2 |
| h_stagger | 卸力 | effect | N | ★ | 承伤 40% 推迟到后续行动再扣 |
| h_earth_shield | 受击回春 | effect | N | ★ | 自己挨打回血，3 次 |
| h_crit_up | 开眼 | status | N | | 暴击↑短时 |
| h_immortal_brief | 不屈金身 | status | N | ★ | 短时免死 |
| h_share_dmg | 义护 | rule | N | ★ | 分摊（桃园向） |
| h_link_heal | 同心 | rule | N | | 治疗溢出转盾 |
| h_stealth_next | 隐锋 | status | N | | 下次技能必暴 |

### I · 治疗 / 续航

| id | 名 | 钩子 | 档 | 质变 | 备注 |
|----|----|------|----|------|------|
| i_heal_st | 单济 | skill | N | | heal tag 底板（技能形态，非星章原子） |
| i_heal_aoe | 普济 | skill | N | | aoe heal |
| i_heal_low | 残血加疗 | effect | N | ★ | `heal_low_hp` |
| i_cleanse | 涤安 | effect | N | ★ | cleanse |
| i_heal_on_skill | 战疗 | rule | N | | 造成伤害回血 |
| i_heal_on_kill | 饮胜 | rule | N | ★ | 击杀按 maxHp×12% 回血 |
| i_atonement | 伤疗同源 | rule | N | ★ | 造伤 22% 抬队里最残 |
| i_heal_from_taken | 以伤回血 | rule | N | ★ | 按近期承伤回血，帽 35% 生命 |
| i_hot | 续命 | effect | N | | `self_regen`；禁疗时跳过 |
| i_cleanse_team | 群体涤 | effect | N | ★ | aoe cleanse |

### J · 驱散 / 破局

| id | 名 | 钩子 | 档 | 质变 | 备注 |
|----|----|------|----|------|------|
| j_purge | 破妄 | effect | N | ★ | purge |
| j_strip_buff | 削灵 | effect | N | | 强驱敌增益 |
| j_break_guard | 破守 | rule | N | | 对盾姿态；碎甲见 `e_vs_shield` |
| j_interrupt | 打断 | — | 并入 | | 无吟唱模型；见 §2.2，不单开 |
| j_reveal | 破隐 | — | 并入 | | 无反隐；见 §2.2，不单开 |
| j_cleanse_self | 净己 | effect | N | | 仅自身 cleanse |

### K · 能量 / 节奏

| id | 名 | 钩子 | 档 | 质变 | 备注 |
|----|----|------|----|------|------|
| k_qi_start | 开局聚气 | rule | N | | 开战 qi+ |
| k_qi_on_hit | 受击回气 | rule | N | | |
| k_grant_qi | 赠气 | effect | N | | 给自己 `grant_qi` |
| k_ally_qi | 济元 | effect | N | | 给治疗目标 `ally_grant_qi` |
| k_qi_steal | 夺气 | rule | N | ★ | 偷敌 qi |
| k_kill_refund | 还元 | rule | N | ★ | `refund_qi_on_kill` |
| k_basic_qi_up | 普攻充盈 | rule | N | | 普攻 +qi 更高 |

### L · 位面 / 九宫

| id | 名 | 钩子 | 档 | 质变 | 备注 |
|----|----|------|----|------|------|
| l_pierce | 穿透 | skill tag | N | ★ | pierce；默认不进升星改形 |
| l_row_front | 扫排 | pattern | N | ★ | row_front |
| l_col | 贯列 | pattern | N | ★ | col_focus |
| l_focus_back | 猎后 | focus | N | ★ | backline |
| l_focus_front | 攻坚 | focus | N | | front_row |
| l_ally_lowest | 急救焦点 | focus | N | | 治疗残血（现网） |
| l_cover_front | 掩护 | rule | N | | 前排减伤光环 |
| l_cell_lock | 画地为牢 | rule | N | ★ | 锁一格；站上去迟缓 |
| l_swap_threat | 换位势 | rule | N | | 同嘲讽锁焦点 |

### M · 特殊神通（网文 / 网游味）

| id | 名 | 钩子 | 档 | 质变 | 备注 |
|----|----|------|----|------|------|
| m_revive_self | 涅槃 | rule | N | ★ | 本场一次免死起身约 30% |
| m_revive_ally | 招魂 | rule | N | ★ | 技能拉一名倒下队友约 35% |
| m_second_wind | 残阳 | rule | N | | 残血触发自疗/盾 |
| m_execute | 斩杀线 | rule | N | ★ | 同 `e_execute`（目录互指，实现只挂一条） |
| m_clone_hit | 影袭 | follow | N | ★ | 分身多一段 |
| m_time_rewind | 逆转 | rule | N | | 本场一次回血（慎） |
| m_steal_buff | 窃天 | effect | N | ★ | 偷增益 |
| m_reflect_cc | 反制 | rule | N | | 控人反控 |
| m_dmg_cap | 金身限额 | rule | N | | 单击伤害上限 |
| m_stack_dao | 悟道叠层 | status | N | ★ | 叠「道韵」强化下一次 |
| m_blood_pact | 血契 | rule | N | | 自损换爆发 |
| m_guardian_oath | 誓约 | status | N | ★ | 链一人分摊；同 `h_share_dmg` 方向 |
| m_domain_lite | 领域 | rule | N | ★ | 短时场地效果 |
| m_mark_pop | 印爆 | rule | N | ★ | 猎印结束/主动引爆（区别于挂印） |
| m_fate_lock | 因果锁 | rule | N | ★ | 1 回死不了也抬不了 |
| j_transfer_debuff | 移花接木 | effect | N | ★ | 把队友减益挪到敌人 |
| k_qi_drought | 闭气 | status | N | | 目标若干回不能回能 |
| e_overkill_col | 列贯余伤 | rule | N | | 超杀砸同列下一人 |
| m_fortune_strike | 天眷 | rating+rule | N | | 幸运影响特殊掷骰 |

---

## 2.1 现网已挂（勿删改义）

职能默认星轨 `ROLE_STAR_LADDERS` 与深做个性轨正在用的能力 id。改数值可以，改语义或删 id 会炸 compose。

`a_main_pct_s` `a_main_pct_m` `a_mastery_edge` `b_block` `b_thorns` `b_crit` `b_lifesteal` `c_qi_cheap` `c_mult_s` `c_status_power` `d_follow_s` `d_follow_m` `e_vs_shield` `e_first_cast` `e_execute` `f_bleed` `f_shred` `f_shred_deep` `g_silence` `g_stun` `h_shield_team` `i_heal_low` `i_cleanse` `k_kill_refund` `k_ally_qi` `j_purge` `m_revive_self` `m_revive_ally`

实现表：`ABILITY_ATOMS`。新 N 档必须先加原子再进星轨。

---

## 2.2 并入 / 勿新用

旧目录里的档位分身、预打包、换皮。**id 保留占位，禁止改义复用。** 新卡请用 canonical。

| 旧 id | 并入 | 原因 |
|-------|------|------|
| a_main_pct_l | a_main_pct_s / 高星叠两次 s | 档位分身 |
| c_mult_l | c_mult_m | 档位分身 |
| c_qi_cheaper | c_qi_cheap | 同动词加数字 |
| d_follow_l | d_follow_m | 档位分身 |
| b_tank_kit / b_assassin_kit / b_healer_kit | 分拆挂 b_block+… | 预打包 |
| b_crit_haste / b_dual_crit / b_glass | 分拆挂 | 预打包 |
| g_stun_long / g_petrify | g_stun | 同晕换皮/加时长 |
| g_fear | g_havoc | 同乱心 |
| m_seal_skill | g_silence | 同禁咒 |
| j_anti_heal_burst | f_heal_block | 同封疗 |
| j_purge_shield | j_purge / e_vs_shield | 驱散已优先拆盾 |
| i_resurrect_ally | m_revive_ally | 同招魂 |
| k_refund_on_kill / k_qi_on_kill | k_kill_refund | 同还元 |
| k_skill_qi_battery | c_qi_cheap + 低倍率底板 | 预打包 |
| m_lifesteal_burst | b_lifesteal + c_mult_s | 预打包 |
| h_thorns / h_regen / h_qi_armor / h_absorb_spirit | b_thorns / i_hot / h_shield | 换皮或无钩子 |
| e_after_basic / e_front_bonus / e_solo_target / e_ignore_block / e_true_ratio | e_self_low / e_surround / e_focus_streak | 同质伤害修饰，换成有几何/血线身份的 |
| j_interrupt / j_reveal | l_cell_lock / j_transfer_debuff | 无吟唱/反隐占位 |
| f_def_down / f_curse_weak | f_shred / f_mark_prey | 近破甲/猎印 |

---

## 3. 拼装示例（说明组合，非新卡）

**赵云（已有方向）**
- 底板：穿 + 流血  
- ★1 `a_main_pct_s` 银枪 · ★2 `b_crit` 会心 · ★3 `d_follow_m` 七进七出（质变）  
- ★4 加深流血 · ★5 连势 · ★6 `c_mult_m` + `f_shred` 单骑救主  

**坦克母题（张飞/典韦向）**
- 底板：眩晕或护盾  
- 属性：`b_block` `h_def_up`；质变：`h_shield` / `h_shield_team`；嘲讽 `g_taunt`  

**奶妈母题（华佗/雅典娜）**
- `i_heal_*` + `i_cleanse`；质变：`h_shield_team` / `i_hot`  

**网文「剑修一剑」**
- `c_mult_s` + `e_vs_low_hp` + `d_follow_s`；星章名用剑意/问心，不用堆 6 个 DoT  

---

## 4. 落地映射（实现时）

| 能力钩子 | 代码落点 |
|----------|----------|
| stat / rating / rare | `StarNodeEffect` → deriveGrowthStats |
| skill / status boost | → SkillModifier → composeSkill |
| status / effect 解锁 | `status_unlock` / `effect_unlock` |
| 自身短 Buff / HoT / 护体 | `self_atk_up` / `self_def_up` / `self_spd_up` / `self_regen` / `self_shield`（打在施术者，不走 applyStatus 打敌人） |
| follow | `enable_follow_up` |
| focus / pattern | 现网可配（`focus_policy` / `pattern` / `tag_add`）；**默认仍不进职能升星改形** |
| rule | `skillRules` / `abilityRuntime` / `register*`；钩子齐才能进星轨 |
| 涅槃 | `StarNodeEffect.nirvana` → `tryStandFromLethal` |
| 招魂 | `effect_unlock revive_ally` |
| 乘乱 / 撼岳 / 击杀回血 | `skillRules`（`vs_cc` / `vs_high_hp` / `heal_on_kill`） |
| 残血狂 / 镇煞 / 合围 / 一鼓作气 | `self_low_hp` / `vs_rank` / `surround` / `focus_streak` |
| 伤疗同源 / 以伤回血 | `atonement` / `heal_from_taken` |
| 卸力 / 受击回春 / 驱则反噬 | 状态 `stagger` / `earth_shield` / `unstable` |
| 独特动词系数 | `growRuleMult` / `growRuleRatio`：精通 0 时等于数据表；只放大「多出来的那截」 |
| 分拆属性 / 终伤 / 回能被动 | `split_stat` / `final_dmg` / `qi_passive` |
| 嘲讽 / 缴械 / 闭气 / 金身 | `forcesFocus` / `blocksBasic` / `blocksQiGain` / `preventLethal` |
| 扫尾 / 追亡 / 战疗 / 印爆 | `abilityRuntime.afterOffensiveSkill` + `effectRegistry` |

**扩展口：** 新增能力优先加本表一行 + `ABILITY_ATOMS`；新 status/effect 走 combat 注册表。

---

## 5. 禁令

- 一张卡挂超过 ~8 条战斗向能力（星章累计）→ 必糊。  
- 用能力池代替母题命名（星章标题仍要典故）。  
- 把能力池做成玩家可抽的「第三条养成」。  
- 未实现钩子的能力写进现网星轨。  
- 新卡再挂 `*_l` 档位、预打包 kit、换皮重复 id。  
- 把 `j_interrupt` / `j_reveal` 改义复活成吟唱/反隐。  

---

## 6. 修订

- 加能力：只追加行，**不复用改义旧 id**。  
- 升档 N←P：改「档」列、写入 `ABILITY_ATOMS`，并在 balance-changelog 记一笔。  
- 目标体量：**≥100（本稿活跃条均 N，并入 id 除外）**；后续可扩，禁止只铺目录不装钩子。
