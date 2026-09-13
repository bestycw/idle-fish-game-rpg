# 升星分支化设计（A1 · 同卡多解法）

> **地位：** 成长深化「第一期 · 解法轨凿深」的首刀（2026-08-04 拍板 A1）。
> **上位约束：** [build-dual-core-design](./2026-07-21-build-dual-core-design.md) §0 反四不像自检句；[skill-design-spec](./2026-08-02-skill-design-spec.md) 星章规范。
> **落点：** 复用现有 `starTracks` / `resolveStarNode` / `CharacterProgress`，**不改战斗主循环**。
> **成长深化路线图：** 一期 A（本文）→ 二期 B 弱连携 → 三期 C 收集叙事。

## 0. 动机与自检

- **动机：** 升星当前是线性 ★1–6 固定质变；抽到/养成同一张卡只有一种打法。丰富「人·解法」核，让同卡按关卡切解法，直接反哺「解法卡关」体验。
- **自检句（必过）：** 玩家多的是一种**怎么过关**的选法 —— 岔路让同卡在「守 vs 控」「连击 vs 斩杀」间取舍，是选法不是肝法。✅
- **明确不做：** 不做战前自由切（那是 loadout，不是构筑取舍）；不新开货币；不锁通关；不新增战斗子系统。

## 1. 玩法定义

- 深做卡的**质变星节点（★3、★6）**从「单一节点」升级为「二选一岔路」。
- 升到岔路星时**必须当场选一支**才落地；已选支即时通过 compose 生效。
- 选择**锁定**；改选走**重洗**：每天第一次**免费**，之后当日递增（50 → 100 → 150 …），次日重置。复用星尘兜底货币，符合「付费/少肝、不买通关」。
- 占位卡与非岔路星保持现状（回落 `SHARED_STAR_NODES`，零改动）。

**具象例（张飞 ★3 · 坦克两解法）**

| 支 | 星章名 | 母题 | 机制（挂已有钩子） |
|----|--------|------|--------------------|
| A | 燕人结界 | 长坂据守 | 受击给全队小盾（`effect_unlock: team_shield`） |
| B | 当阳断喝 | 喝退曹军 | 硬控命中/时长强化（`status_boost` on stun） |

打高压输出关走 A，打需要打断的关走 B。

## 2. 数据模型（扩展口，非改写）

```typescript
// starTypes.ts
export interface StarBranchDef {
  id: string;            // 'guard' | 'burst' … 卡内唯一
  label: string;         // 星章名（典故化，遵 skill-design-spec §4）
  effects: StarNodeEffect[];
}
export interface StarNodeDef {
  star: number;
  label: string;         // 岔路节点：作为“组名/母题”，如「据守 or 断喝」
  effects: StarNodeEffect[];  // 无分支时用；岔路星可留空或放共有底子
  stack?: boolean;
  branches?: StarBranchDef[]; // 存在 = 岔路星（≥2 支）
}

// shared/types.ts · CharacterProgress
starBranch?: Record<number, string>;  // { 3: 'guard', 6: 'burst' }；缺省=未选/无分支
```

存档：`starBranch` 可选，旧档缺省即「无分支」，**不 bump**。

## 3. 解析与流程（复用现有函数）

| 环节 | 改动 |
|------|------|
| `resolveStarNode(templateId, star, choice?)` | 加可选 `choice`（来自 `progress.starBranch[star]`）；岔路星按 choice 返回 `{ label: branch.label, effects: [...node.effects, ...branch.effects] }`；无 choice 返回「待选」标记（effects 仅含共有底子） |
| `unlockedStarNodes` / compose 上游 | 传入 `progress.starBranch`，让已解锁星按玩家选择产出修正 |
| `tryStarUp` | 升到岔路星：返回 `needBranch`（UI 弹二选一）；星级先落地，分支由 `chooseStarBranch` 补选 |
| 新增 `chooseStarBranch(state, templateId, star, branchId)` | 首次选择；落 `progress.starBranch`；校验该星确有此支 |
| 新增 `respecStarBranch(state, templateId, star, branchId)` | 重洗；每天首次免费，之后星尘 50/100/150… 递增，次日重置；改 `progress.starBranch` |

**AI / 战斗侧：** 无改动。compose 产出的技能已含所选支 effects，战斗照常消费。

## 4. 范围与批次

| 批次 | 内容 |
|------|------|
| 第一批 | 深做 20 卡的 **★3 + ★6 岔路**（每卡每岔路星二选一，遵母题双解法） |
| 不做 | 占位 68 张扩展卡：无岔路，回落职能共用轨 |

数据结构与内容一步到位（★3 + ★6 同批），符合「先做透再扩」。

## 5. UI（升星页）

- 岔路星在升星 diff 里展示**两支并列对比**（星章名 + `summarizeStarEffect` 摘要）。
- 已选支高亮；另一支灰显带「重洗」入口（首免后 50/100/150…）。
- 未选（刚升到岔路星）：醒目「请选择一条星章路线」。
- 布阵/详情页可见当前所选支（服务「同装不同味」的可读性）。

## 6. 校验与测试

- `assertCharacterBundle`：每张深做卡的岔路星 `branches` ≥2，每支可 compose resolve。
- `roster.test` / 新 `starBranch.test`：选择→compose 生效；重洗扣费与改写；未选态不崩。
- 手感：`npm run feel` / 审计不受影响（分支不改敌人；只改我方构筑）。

## 7. 实现步骤（approval 后拆 plan）

1. `starTypes`：加 `StarBranchDef` / `StarNodeDef.branches` / `summarize` 分支展开。
2. `shared/types`：`CharacterProgress.starBranch`。
3. `starTracks.resolveStarNode` 带 choice；上游传 `starBranch`。
4. `growth`：`chooseStarBranch` / `respecStarBranch` + 每日首免递增；`tryStarUp` 返回 `needBranch`。
5. 深做 20 卡 ★3+★6 岔路内容（`deepKits` / `STAR_OVERRIDES`），遵 skill-design-spec 双解法不撞车。
6. UI：升星页二选一 + 重洗；详情技能轨显示所选支。（已接线）
7. 校验/测试；记 balance-changelog；**Agent 不自行 commit**。

## 8. 待后续拍板（不阻塞一期）

- ★6 岔路与 ★3 联动：**已拍板为分支锁定**（★3 选一次，★6 跟跑；见 [legendary-knife2](./2026-08-26-legendary-knife2-design.md) §2）。
- ~~重洗代价递增~~（已拍板：每天首免 → 50/100/150 递增，次日重置）。
- 是否给占位卡升格时也配岔路——归入后续「升格深做」批次。
