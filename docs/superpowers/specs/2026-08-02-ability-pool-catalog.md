# 能力池总表（Ability Pool Catalog）

> **地位：** 内容库（2026-08-02）。**后续加角色时的选材表**：按人物历史/典故背景，从本池挑选能力，组合进该角色的招牌技能与升星星章。  
> **配合：** [skill-design-spec](./2026-08-02-skill-design-spec.md)、[character-foundation](./2026-08-02-character-foundation-design.md)、[combat §4.13/4.15](./systems/combat.md)。  
> **玩家不养成能力池**——池是制作侧原子；玩家养成仍是人·星·装。  
> **丰富性来自「背景选题 + 组合」**，不是把百余条全塞进一张卡。

## 0. 怎么用（加角色流程）

```
1. 读人物历史母题（一句话）
2. 在本池按母题选题：属性 / 控制 / 连击 / 护盾…（通常底板 1～2 条核心 + 星章分散）
3. 组合成该角色的招牌 SkillDef（战斗动词 + 主能力）
4. ★1–★6 星章：典故命名 + 各挂 1～2 条能力 id（可纯属性）
5. ★3 / ★6 至少 1 条质变向能力（目录标 ★）
6. 实现：能力 id → StarNodeEffect / SkillModifier → composeSkill
```

**一句话：** 池是「零件柜」，角色背景是「装配图」，装出来的才是那个人的技能。

| 列 | 含义 |
|----|------|
| id | 稳定能力 id（拉丁蛇形） |
| 名 | 中性显示名（故事皮可换词） |
| 类 | 见 §1 |
| 钩子 | 落点：`stat` / `rating` / `rare` / `status` / `effect` / `follow` / `skill` / `rule`（需新钩子） |
| 档 | **N**=现网可配；**P**=近（register 即可）；**L**=后置（要新规则/软顶） |
| 质变 | ★ 适合当 ★3/★6 身份质变 |

参考气质（非版权）：经典 ARPG/回合、网游 Buff 轴、网文「悟道/神通/杀招」节奏——机制中性化后入库。

---

## 1. 分类索引

| 类码 | 类名 | 约条数 | 说明 |
|------|------|--------|------|
| A | 主属性 / 底子 | 12 | 攻防血速等百分比或评级 |
| B | 副属性 / 稀有 | 14 | 暴击急速吸血格挡等 |
| C | 技能数值 | 10 | 倍率、耗能、治疗倍率 |
| D | 连击 / 追加 | 8 | followUp 与变体 |
| E | 伤害修饰 | 12 | 斩杀、对护盾、首动等 |
| F | 持续伤害 / 削弱 | 14 | DoT、破甲、降疗 |
| G | 控制 | 12 | 硬控软控 |
| H | 增益 / 护盾 | 14 | 攻防加速护盾反伤 |
| I | 治疗 / 续航 | 10 | 抬血、净化、吸血转化 |
| J | 驱散 / 破局 | 8 | purge/cleanse/破盾 |
| K | 能量 / 节奏 | 8 | qi 经济 |
| L | 位面 / 九宫 | 8 | 前后排、列、残血焦点 |
| M | 特殊神通 | 16 | 复活、标记、分摊、偷取等（多 L） |
| — | **合计** | **≈146** | 可继续加行，勿改已用 id |

---

## 2. 能力表

### A · 主属性 / 底子

| id | 名 | 钩子 | 档 | 质变 | 备注 |
|----|----|------|----|------|------|
| a_main_pct_s | 底子微幅 | stat | N | | mainPct +3% |
| a_main_pct_m | 底子强化 | stat | N | | +5% |
| a_main_pct_l | 底子贯通 | stat | N | | +8%（高星慎用） |
| a_hp_pct | 体魄 | stat | P | | 仅生命%（需 derive 分拆；暂可用 main） |
| a_atk_phys | 力势 | rating/stat | N | | 偏 phys 向（现用 main 近似） |
| a_atk_spirit | 灵机 | rating/stat | N | | 偏 spirit |
| a_def_phys | 铁骨 | stat | N | | |
| a_def_spirit | 定心 | stat | N | | |
| a_spd_edge | 先机 | stat | N | | 身法微幅 |
| a_vers_wall | 均衡壁 | rating | N | | versRating |
| a_mastery_edge | 精通锋 | rating | N | | masteryRating |
| a_final_edge | 终势 | rating | N | ★ | finalDmgRating |

### B · 副属性 / 稀有

| id | 名 | 钩子 | 档 | 质变 | 备注 |
|----|----|------|----|------|------|
| b_crit | 会心 | rating | N | | critRating |
| b_crit_dmg | 暴烈 | rating | N | | critDmgRating |
| b_haste | 勤修 | rating | N | | haste→回能 |
| b_lifesteal | 嗜血 | rare | N | | |
| b_dodge | 飘忽 | rare | N | | |
| b_block | 格挡 | rare | N | | |
| b_crit_resist | 沉着 | rare | P | | critResist 词缀已有 |
| b_fortune | 气运 | rating | N | | fortune |
| b_crit_haste | 疾会 | rating | N | | 小暴+小急组合包 |
| b_tank_kit | 铁壁包 | rare+rating | N | | 格挡+均衡 |
| b_assassin_kit | 刺骨包 | rating | N | | 暴击+暴伤 |
| b_healer_kit | 慈航包 | rating | N | | 急速+精通 |
| b_dual_crit | 双会 | rating | N | | 暴+抗暴（对峙感） |
| b_glass | 琉璃 | rating | N | | 终伤+降防（慎；或只终伤） |

### C · 技能数值

| id | 名 | 钩子 | 档 | 质变 | 备注 |
|----|----|------|----|------|------|
| c_mult_s | 招式加深 | skill | N | | skill_mult +0.1 |
| c_mult_m | 招式大成 | skill | N | ★ | +0.15～0.2 |
| c_mult_l | 绝技 | skill | N | ★ | +0.25 慎叠 |
| c_qi_cheap | 省元 | skill | N | | qi_cost -5 |
| c_qi_cheaper | 凝元 | skill | N | | -10 |
| c_heal_mult | 济世加深 | skill | P | | 治疗技能倍率（heal tag） |
| c_guard_mult | 守势加深 | skill | P | | guard/shield 倍率 |
| c_aoe_mult | 横扫加深 | skill | P | | aoe tag 倍率 |
| c_single_mult | 一点加深 | skill | P | | single 倍率 |
| c_status_power | 符效 | skill | N | | status_boost valueMult |

### D · 连击 / 追加

| id | 名 | 钩子 | 档 | 质变 | 备注 |
|----|----|------|----|------|------|
| d_follow_s | 连势 | follow | N | ★ | chance≈0.28×0.6 |
| d_follow_m | 连斩 | follow | N | ★ | ≈0.35×0.7 |
| d_follow_l | 狂连 | follow | N | ★ | ≈0.42×0.8 软顶 |
| d_follow_heal | 连济 | follow | P | ★ | 治疗后再抬一刀血 |
| d_follow_shred | 连破 | follow | P | ★ | 连击附带破甲 |
| d_extra_hit_front | 扫尾 | follow | L | ★ | 额外打前排另一人 |
| d_on_kill_follow | 追亡 | follow | L | ★ | 击杀触发追加（网文斩杀感） |
| d_counter_follow | 反击连 | follow | L | | 受击后下次行动连 |

### E · 伤害修饰

| id | 名 | 钩子 | 档 | 质变 | 备注 |
|----|----|------|----|------|------|
| e_vs_low_hp | 猎残 | rule/focus | N | ★ | focusPolicy lowest_hp；斩杀见 `execute` |
| e_vs_high_hp | 撼岳 | rule | L | ★ | 高血额外伤 |
| e_vs_shield | 碎甲 | rule | N | ★ | `effects: vs_shield`（2026-08-03） |
| e_vs_cc | 乘乱 | rule | L | | 目标被控增伤 |
| e_first_cast | 先声 | rule | N | ★ | `effects: first_cast`（2026-08-03） |
| e_after_basic | 蓄锐 | rule | L | | 普攻后下一技增伤 |
| e_front_bonus | 陷阵 | rule | L | | 打前排增伤 |
| e_back_bonus | 袭后 | rule | P | ★ | pierce+后排（现网近似） |
| e_solo_target | 专壹 | rule | L | | 敌方仅 1 人时增伤 |
| e_aoe_falloff_ignore | 无衰减 | rule | L | | V1 本无衰减；占位 |
| e_ignore_block | 破挡 | rule | L | | 无视部分格挡 |
| e_true_ratio | 洞穿 | rule | L | ★ | 一小段「真伤」比例（慎） |

### F · 持续伤害 / 削弱

| id | 名 | 钩子 | 档 | 质变 | 备注 |
|----|----|------|----|------|------|
| f_bleed | 流血 | status | N | | bleed |
| f_bleed_deep | 血河 | status | N | ★ | status_boost layers/duration |
| f_poison | 毒雾 | status | P | ★ | 新 tick（测例已证可注册） |
| f_burn | 灼魂 | status | P | ★ | DoT |
| f_frostbite | 霜噬 | status | P | | DoT+缓 |
| f_shred | 破甲 | status | N | | shred |
| f_shred_deep | 碎铠 | status | N | ★ | value 更深 / 时长 |
| f_slow | 迟滞 | status | N | | slow |
| f_heal_block | 封疗 | status | N | ★ | heal_block |
| f_atk_down | 丧锋 | status | P | | 降低攻击 |
| f_def_down | 碎防 | status | P | | 非 shred 的减防 |
| f_mark_prey | 猎印 | status | N | ★ | `mark_prey` + value 承伤倍率（2026-08-03） |
| f_curse_weak | 咒弱 | status | P | | 综合小减益 |
| f_corruption | 侵蚀 | status | L | | 叠层爆炸（网文毒誓） |

### G · 控制

| id | 名 | 钩子 | 档 | 质变 | 备注 |
|----|----|------|----|------|------|
| g_stun | 震慑 | status | N | ★ | stun |
| g_stun_long | 镇岳 | status | N | | duration+（吃 DR） |
| g_sleep | 沉眠 | status | N | ★ | sleep |
| g_freeze | 凝冰 | status | P | ★ | 类 stun 桶 |
| g_root | 定身 | status | P | | 可行动但不能…（需规则） |
| g_silence | 禁咒 | status | N | ★ | 现网有 silence 向 |
| g_fear | 丧胆 | status | L | | 强制随机/跳（近 havoc） |
| g_havoc | 乱心 | status | N | ★ | havoc |
| g_berserk | 狂乱 | status | N | | berserk |
| g_taunt | 嘲讽 | status | L | ★ | 坦克母题 |
| g_disarm | 缴械 | status | L | | 禁普攻或降普攻 |
| g_petrify | 石化 | status | P | ★ | 美杜莎向；可映射 stun |

### H · 增益 / 护盾

| id | 名 | 钩子 | 档 | 质变 | 备注 |
|----|----|------|----|------|------|
| h_shield | 护体 | status | N | ★ | shield |
| h_shield_team | 结界 | status | N | ★ | `effects: team_shield`（2026-08-03） |
| h_atk_up | 加持 | status | P | | 攻↑ |
| h_def_up | 铁壁咒 | status | P | | 防↑ |
| h_spd_up | 神行 | status | P | | 身法↑ |
| h_crit_up | 开眼 | status | P | | 暴击↑短时 |
| h_regen | 回春 | status | P | | 回合回血 |
| h_thorns | 反刺 | status | L | ★ | 反伤 |
| h_absorb_spirit | 灵吸盾 | status | L | | 吸灵伤 |
| h_stealth_next | 隐锋 | status | L | | 下次技能必暴/穿 |
| h_immortal_brief | 不屈 | status | L | ★ | 短时免死（网文金身） |
| h_qi_armor | 气甲 | status | P | | 护盾随 qi |
| h_share_dmg | 义护 | rule | L | ★ | 分摊（桃园向） |
| h_link_heal | 同心 | rule | L | | 治疗溢出转盾 |

### I · 治疗 / 续航

| id | 名 | 钩子 | 档 | 质变 | 备注 |
|----|----|------|----|------|------|
| i_heal_st | 单济 | skill | N | | heal tag 底板 |
| i_heal_aoe | 普济 | skill | N | | aoe heal |
| i_cleanse | 涤安 | effect | N | ★ | cleanse |
| i_heal_on_skill | 战疗 | rule | L | | 造成伤害回血 |
| i_heal_on_kill | 饮胜 | rule | L | | 击杀回血 |
| i_hot | 续命 | status | P | | HoT |
| i_resurrect_ally | 还魂 | rule | L | ★ | 复活（lifecycle 钩子已有方向） |
| i_self_heal | 自愈 | skill | P | | 技能自抬 |
| i_convert_overheal | 溢乳 | rule | L | | 过量治疗→盾 |
| i_cleanse_team | 群体涤 | effect | P | ★ | aoe cleanse |

### J · 驱散 / 破局

| id | 名 | 钩子 | 档 | 质变 | 备注 |
|----|----|------|----|------|------|
| j_purge | 破妄 | effect | N | ★ | purge（主角向） |
| j_purge_shield | 碎罩 | effect | N | | purge 优先盾 |
| j_cleanse_self | 净己 | effect | N | | |
| j_strip_buff | 削灵 | effect | P | | 强驱敌增益 |
| j_anti_heal_burst | 绝药 | status | N | | heal_block 包 |
| j_break_guard | 破守 | rule | L | | 对 guard 姿态/盾 |
| j_interrupt | 打断 | rule | L | | 需吟唱模型；V1 无 |
| j_reveal | 破隐 | rule | L | | 反隐占位 |

### K · 能量 / 节奏

| id | 名 | 钩子 | 档 | 质变 | 备注 |
|----|----|------|----|------|------|
| k_qi_start | 开局聚气 | rule | L | | 开战 qi+ |
| k_qi_on_hit | 受击回气 | rule | L | | V1 规格曾不做；可后开 |
| k_qi_on_kill | 杀意 | effect/rule | L | | |
| k_grant_qi | 赠气 | effect | N | | grant_qi 已有 |
| k_qi_steal | 夺气 | rule | L | ★ | 偷敌 qi |
| k_refund_on_kill | 还元 | rule | N | ★ | `refund_qi_on_kill`（2026-08-03） |
| k_basic_qi_up | 普攻充盈 | rule | P | | 普攻 +qi 更高 |
| k_skill_qi_battery | 电池 | skill | N | | 低耗能+小伤（辅助向） |

### L · 位面 / 九宫

| id | 名 | 钩子 | 档 | 质变 | 备注 |
|----|----|------|----|------|------|
| l_pierce | 穿透 | skill tag | N | ★ | pierce |
| l_row_front | 扫排 | pattern | N | ★ | row_front（默认不升星改形） |
| l_col | 贯列 | pattern | N | ★ | col_focus |
| l_focus_back | 猎后 | focus | P | ★ | backline |
| l_focus_front | 攻坚 | focus | P | | front_row |
| l_ally_lowest | 急救焦点 | focus | N | | 治疗残血（现网） |
| l_cover_front | 掩护 | rule | L | | 前排减伤光环 |
| l_swap_threat | 换位势 | rule | L | | 纯叙事/后置 |

### M · 特殊神通（网文 / 网游味 · 多后置）

| id | 名 | 钩子 | 档 | 质变 | 备注 |
|----|----|------|----|------|------|
| m_revive_self | 涅槃 | rule | L | ★ | 本场一次免死起身 |
| m_revive_ally | 招魂 | rule | L | ★ | 拉人 |
| m_second_wind | 残阳 | rule | L | | 残血触发自疗/盾 |
| m_execute | 斩杀线 | rule | N | ★ | `execute` 残血增伤（非秒杀；2026-08-03） |
| m_lifesteal_burst | 血祭 | rare+skill | N | ★ | 吸血+技能加深 |
| m_clone_hit | 影袭 | follow | L | ★ | 分身多一段（连击皮） |
| m_time_rewind | 逆转 | rule | L | | 回档生命（慎） |
| m_steal_buff | 窃天 | effect | L | ★ | 偷增益 |
| m_reflect_cc | 反制 | rule | L | | 控人反控 |
| m_dmg_cap | 金身限额 | rule | L | | 单击伤害上限 |
| m_stack_dao | 悟道叠层 | status | L | ★ | 叠「道韵」强化下一次 |
| m_blood_pact | 血契 | rule | L | | 自损换爆发 |
| m_guardian_oath | 誓约 | status | L | ★ | 链一人分摊（坦克） |
| m_domain_lite | 领域 | rule | L | ★ | 短时场地效果（后置） |
| m_seal_skill | 封技 | status | P | ★ | 近 silence |
| m_fortune_strike | 天眷 | rating+rule | L | | 幸运影响特殊掷骰 |

---

## 3. 拼装示例（说明组合，非新卡）

**赵云（已有方向）**
- 底板：穿 + 流血  
- ★1 `a_main_pct_s` 银枪 · ★2 `b_crit` 会心 · ★3 `d_follow_m` 七进七出（质变）  
- ★4 `f_bleed_deep` · ★5 `d_follow_l` · ★6 `c_mult_m` + `f_shred` 单骑救主  

**坦克母题（张飞/典韦向）**
- 底板：震慑/护盾  
- 属性：`b_block` `a_def_phys`；质变：`h_shield` 加深或 `g_taunt`（L）  

**奶妈母题（华佗/雅典娜）**
- `i_heal_*` + `i_cleanse`；质变：`i_cleanse_team` / `h_shield_team`  

**网文「剑修一剑」**
- `c_mult_l` + `e_vs_low_hp` + `d_follow_s`；星章名用剑意/问心，不用堆 6 个 DoT  

---

## 4. 落地映射（实现时）

| 能力钩子 | 代码落点 |
|----------|----------|
| stat / rating / rare | `StarNodeEffect` → deriveGrowthStats |
| skill / status boost | → SkillModifier → composeSkill |
| status / effect 解锁 | `status_unlock` / `effect_unlock` |
| follow | `enable_follow_up` |
| focus / pattern | **默认不进升星**；装形态或底板才改（foundation 冻结） |
| rule / L 档 | 先 `register*` 钩子，再开放进池 |

**扩展口：** 新增能力优先加本表一行 + 映射到已有 kind；新 status/effect 走 combat 注册表。

---

## 5. 禁令

- 一张卡挂超过 ~8 条战斗向能力（星章累计）→ 必糊。  
- 用能力池代替母题命名（星章标题仍要典故）。  
- 把能力池做成玩家可抽的「第三条养成」。  
- 未实现的 L 档写进现网星轨却无钩子。  

---

## 6. 修订

- 加能力：只追加行，**不复用改义旧 id**。  
- 升档 N←P：改「档」列并在 balance-changelog 记一笔。  
- 目标体量：**≥100（本稿 ≈146）**；后续可扩到 200，但 V1 实装仍以 N/P 为主。
