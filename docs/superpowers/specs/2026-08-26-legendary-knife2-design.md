# 绝品刀二 · 第一批深做（2026-08-26）

> **地位：** 中土卡池 [刀二](./2026-08-26-zhongtu-roster-circles-design.md) §8 的第一刀内容规格。  
> **配合：** [skill-design-spec](./2026-08-02-skill-design-spec.md)、[ability-pool-catalog](./2026-08-02-ability-pool-catalog.md)、[character](./systems/character.md)。  
> **本轮只做 5 张。** 其余绝品按本文 §4 槽位、§5 圈序后续分批，不在本轮实现。

## 0. 拍板

| 项 | 结论 |
|----|------|
| 范围 | 未深做绝品里先做 **蜀汉缺口 + 取经剩余**：刘备、庞统、牛魔王、唐僧、铁扇公主 |
| 厚度 | **赵云标准**：招牌 2～3 效果；六星典故名；★3 / ★6 **必质变且各 2 岔** |
| 做法 | 表驱动母题卡 → 编进 `deepKits` / `expandDeepKits`；手改 `zhongtuRoster` 文案 |
| 不做 | 第二技能栏；新状态 id；破甲（仍仅孙膑/公输班）；跑 `gen_zhongtu_roster.py`；一次生成剩余 ~54 张 |

已深做 22 张不动（赵云、关羽、张飞、孔明、华佗、悟空、白骨、哪吒、杨戬、妲己、姜子牙、后羿、女娲、嫦娥、西施、孙膑、周瑜、项羽、岳飞、吕布、典韦、主角）。

## 1. 避让（本批对照）

| 人 | 勿做成 |
|----|--------|
| 刘备 | 华佗（单体治疗+净化底板）；女娲（全体治疗+结界底板） |
| 庞统 | 孔明（抽蓝+迟缓+灌气）；孙膑（破甲） |
| 牛魔王 | 张飞（眩晕先声）；典韦（分摊/按伤回血） |
| 唐僧 | 华佗底板；把沉默打在治疗目标上 |
| 铁扇 | 妲己/白骨（混乱） |

## 2. 槽位（本批 + 后续绝品深做共用）

每人一张母题卡，字段与 skill-design-spec §2 对齐，并冻结：

| 星 | 槽 |
|----|----|
| ★1 | 立身：`a_main_pct_s` + 一条定位被动 |
| ★2 | 手感：`a_main_pct_s` + 省能或符效 |
| ★3 | **选定分支**（两条技能路子之一；节点 effects 空） |
| ★4 | 加深招牌（共用，不按分支） |
| ★5 | 二次强化（共用；不是把 ★6 满星提前） |
| ★6 | **该分支的满星**（不再二选一，随 ★3 锁定） |

**分支规则（2026-08-26 改）：** 每人两条技能分支（如治疗 / 结界）。升到 ★3 时选一次；★3 与 ★6 都走这条，不能混装。改分支走重洗（整条线）。开局不选——★0–2 还吃不到分支差。技能页 ★3 / ★6 各自标明分支、只展示该星技能，不把满星预告堆在 ★3。玩家文案用「分支」，不用「身份」。

分支零件互斥：同一零件（净化 / 结界 / 招魂 / 新状态）只挂在一条线上。★6 可以给本线加厚（结界×0.55），文案不得再写「解锁」已有件。★1/2/4/5 与底板共用。不默认 `stack`。不新开战斗循环分支。

## 3. 第一批母题卡

数值落在现网职责带内；实现时可 ±0.05 微调，不得改分支。

### 3.1 刘备 `liubei` · `aoe_heal` · 济

- **母题：** 仁德聚义  
- **招牌：** `桃园结义` · `all` · 灵 · 倍率 **0.72** · 耗能 **50**  
- **效果：** `heal_low_hp(0.4, ×1.22)` + `ally_grant_qi(14)`  
- **blurb：** 为全队抬血，残血处多抬，并给队友灌气。  
- **底板禁止：** cleanse、team_shield（结界走星章）

| 星 | 名 | 效果 |
|----|----|------|
| 1 | 桃园 | `a_main_pct_s` + `c_mult_s` |
| 2 | 三顾 | `a_main_pct_s` + `c_qi_cheap` |
| 3 | 仁德 | **选定分支** |
| 4 | 入川 | `a_main_pct_m` + `c_mult_s` |
| 5 | 白帝 | `a_main_pct_m` + `k_ally_qi` |
| 6 | 汉中王 | **沿所选分支** |

| 分支 | ★3 | ★6 |
|------|----|----|
| **济世** | `i_cleanse` + `c_mult_s` | `m_revive_ally` + `c_mult_s` |
| **护民** | `h_shield_team` | 结界加厚 `team_shield×0.55` + `c_mult_s` |

### 3.2 庞统 `pangtong` · `group_amp` · 破

- **母题：** 落凤坡连环营  
- **招牌：** `落凤坡` · `single` · 灵 · 倍率 **1.05** · 耗能 **50**  
- **效果：** `slow` 2 回 + `surround ×1.2` + `self_atk_up`  
- **blurb：** 点破一名敌人并迟缓；合围更疼，并为自己加持攻势。  
- **底板禁止：** shred、qi_drought

| 星 | 名 | 效果 |
|----|----|------|
| 1 | 凤雏 | `a_main_pct_s` + `c_mult_s` |
| 2 | 耒阳 | `a_main_pct_s` + `c_qi_cheap` |
| 3 | 连环 | **选定分支** |
| 4 | 落凤 | `a_main_pct_m` + `c_mult_s` |
| 5 | 西川 | `a_main_pct_m` + `c_status_power` |
| 6 | 副军师 | **沿所选分支** |

| 分支 | ★3 | ★6 |
|------|----|----|
| **围城** | `status_boost`（迟缓+1）+ `c_status_power` | `status_boost` + 合围加深 |
| **火攻** | `f_burn` + `e_first_cast` | `c_mult_s` + `skill_mult +0.12` |

火攻挂灼魂，不挂混乱（周瑜/妲己位）。

### 3.3 牛魔王 `niumowang` · `tank` · 守

- **母题：** 混世魔王  
- **招牌：** `混世魔王` · `single` · 力 · 倍率 **1.22** · 耗能 **45** · tags `guard`  
- **效果：** `taunt` 2 回 + `shield`（自身护体）+ `self_low_hp(0.4, ×1.2)`  
- **blurb：** 怒喝锁住敌方焦点，为自己叠盾；残血时盾更硬。  
- **底板禁止：** stun、self_stagger、heal_from_taken

| 星 | 名 | 效果 |
|----|----|------|
| 1 | 牛魔 | `a_main_pct_s` + `b_block` |
| 2 | 芭蕉洞 | `a_main_pct_s` + `c_qi_cheap` |
| 3 | 平天 | **选定分支** |
| 4 | 反刺 | `a_main_pct_m` + `b_thorns` |
| 5 | 魔王 | `a_main_pct_m` + `a_hp_pct` |
| 6 | 牛王 | **沿所选分支** |

| 分支 | ★3 | ★6 |
|------|----|----|
| **镇洞** | `h_shield_team` + `b_block` | 结界加厚 `team_shield×0.55` + `b_block` |
| **夺扇** | `b_thorns` + `status_boost`（嘲讽+1） | `m_revive_self`（涅槃 0.3）+ `b_lifesteal` |

嘲讽走现网 `taunt`（锁焦点到自己）。结界是全队薄盾，与自身 `shield` 不是同一条。

### 3.4 唐僧 `tangseng` · `st_heal` · 济

- **母题：** 金蝉西行  
- **招牌：** `紧箍咒` · `single` · 沿用现网治疗索敌（不新写 focusPolicy）· 灵 · 倍率 **1.28** · 耗能 **48** · tags `heal`  
- **效果：** `heal_low_hp(0.4, ×1.3)`  
- **blurb：** 为最残的人抬血，残血处多抬。  
- **底板禁止：** team_shield（金身走分支）；任何 `silence` / `stun` / `heal_block` 打在治疗目标上

| 星 | 名 | 效果 |
|----|----|------|
| 1 | 金蝉 | `a_main_pct_s` + `c_mult_s` |
| 2 | 收徒 | `a_main_pct_s` + `c_qi_cheap` |
| 3 | 紧箍 | **选定分支** |
| 4 | 西行 | `a_main_pct_m` + `k_ally_qi` |
| 5 | 取经 | `a_main_pct_m` + `c_mult_s` |
| 6 | 西天 | **沿所选分支** |

| 分支 | ★3 | ★6 |
|------|----|----|
| **开光** | `i_cleanse` + `c_mult_s` | `m_revive_ally` + `c_mult_s` |
| **金身** | `h_shield_team` + `c_qi_cheap` | 结界加厚 `team_shield×0.55` + `c_qi_cheap` |

「紧箍」是戒律（净化/金身），不是打人的硬控。

### 3.5 铁扇公主 `tieshan` · `aoe_ctrl` · 慑

- **母题：** 芭蕉扇灭火  
- **招牌：** `芭蕉扇` · `row_front` · 灵 · 倍率 **1.08** · 耗能 **52**  
- **效果：** `silence` 1 回 + `slow` 2 回  
- **blurb：** 横扫前排，封招并迟缓。  
- **底板禁止：** havoc、unstable、shred

| 星 | 名 | 效果 |
|----|----|------|
| 1 | 罗刹 | `a_main_pct_s` + `c_mult_s` |
| 2 | 芭蕉 | `a_main_pct_s` + `c_status_power` |
| 3 | 借风 | **选定分支** |
| 4 | 灭火 | `a_main_pct_m` + `status_boost`（迟缓） |
| 5 | 魔息 | `a_main_pct_m` + `c_mult_s` |
| 6 | 一扇 | **沿所选分支** |

| 分支 | ★3 | ★6 |
|------|----|----|
| **封招** | `c_status_power` + `status_boost`（沉默时长） | `pattern: all` + `c_mult_s` |
| **抽息** | `k_qi_drought` + `e_first_cast` | `d_follow_s` + `c_mult_s` |

沉默仍走硬控命中，不写必中。

## 4. 表结构

新增 `packages/game-core/src/character/roster/legendarySheets.ts`（或同级一批一文件，由 index 汇总）：

```ts
interface LegendarySheet {
  templateId: string;
  motif: string;
  verb: string;
  skill: Partial<SkillDef> & { name: string; blurb: string };
  stars: Array<{
    label: string;
    effects?: StarNodeEffect[];
    branches?: StarBranchDef[];
  }>; // 长度必须 6
}
```

编进现网：

- `EXPAND_DEEP_SKILL_OVERRIDES` / `DEEP_SKILL_OVERRIDES`（扩展卡技能 id 已是 `skill_<id>`）
- `EXPAND_DEEP_STAR_OVERRIDES` / `DEEP_STAR_OVERRIDES`
- `DEEP_TEMPLATE_IDS` 追加 5 个 id
- `zhongtuRoster`：改 `motif` / `skillName`；**不要**跑 `gen_zhongtu_roster.py`（会打乱 kit）

实现用 `StarNodeEffect` 直写（与现 `deepKits` 一致）；上表能力 id 是对照，不是运行时第三套系统。

## 5. 后续圈序（不在本轮写卡）

第一批之后仍按圈、每次 5～8 张、同一槽位：

1. 封神剩余：申公豹、敖丙、太乙真人  
2. 上古剩余：黄帝、蚩尤、西王母、伏羲、大禹  
3. 吴越剩余：聂隐娘、荆轲、干将、莫邪、李白、伍子胥  
4. 群雄剩余：曹操、司马懿、郭嘉  
5. 八仙 / 江南 / 楚汉剩余 / 兵家剩余 / 忠烈剩余  
6. 梁山 / 瓦岗 / 宝莲 / 降妖 / 聊斋  

每批单独规格或本文件追加 §3.x，禁止无表一次生成。

## 6. 测例

- `DEEP_TEMPLATE_IDS` 含本批 5 id，且各有 6 星、★3/★6 数据各 2 条分支（玩家只在 ★3 选）  
- `isBranchStar(id, 6) === false`；只选 ★3 分支即可在 ★6 吃到对应满星  
- 刘备济世线无结界、护民线无招魂  
- 无人 `applyStatus` 含 `shred`  
- 唐僧底板与星章 effects/status 不含 `silence` / `stun` / `heal_block`  
- 刘备底板不含 `cleanse`、`team_shield`  
- 铁扇底板不含 `havoc`  
- 牛魔底板含 `taunt`  
- 庞统底板不含 `qi_drought`、`shred`  
- 现网 `game-core` 测试仍绿；点开五人技能页能看见虚线词与星章岔路（实现时浏览器过一遍刘备/唐僧）

## 7. 非目标

- 珍/良/凡深做  
- 羁绊结算  
- 新能力原子（本批只用目录已有 id / 现网 effect kind）  
- 改战斗主循环、命中公式、一人多主动  

## 8. 落点

| 产物 | 路径 |
|------|------|
| 母题表 | `character/roster/legendarySheets.ts`（建议） |
| 编入深做 | `expandDeepKits.ts` / `deepKits.ts` / `templates.ts` `DEEP_TEMPLATE_IDS` |
| 名册文案 | `roster/zhongtuRoster.ts` 五行 motif/skillName |
| 测例 | `roster/roster.test.ts`；必要时 `skillCompose.test.ts` |
| 进度 | `tracking.md` 主线仍为刀二；本文件 = 第一批内容权威 |
