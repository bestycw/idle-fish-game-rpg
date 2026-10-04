# 剧情 Skin 生成方案（玩法核心 · 文案填充）

> **状态：** 2026-10-02 定稿方向（取代「像小说」对外叙事）  
> **上级：** [product.md](./product.md) · [player-story-spine-design](./2026-09-29-player-story-spine-design.md)  
> **Skill 契约：** [story-gen-skill-contract.md](./story-gen-skill-contract.md)  
> **平行工位：** [parallel-sync-realworld-line](./2026-09-29-parallel-sync-realworld-line.md)

---

## 1. 产品定位（必须先统一口径）

| 是 | 不是 |
|----|------|
| **布阵 × 刷装 × 抽卡 × 推章** 是核心循环 | 不是 AI 阅读器 / 互动小说 App |
| 文案是 **推进时的 Skin 填充**（Hub、战前、story 节点、章末一句） | 不是「生成一本可导出的小说」作为主卖点 |
| 千人千面 = **同一关卡、不同措辞与意象** | 不是改 encounter、掉落、解锁、战斗次数 |
| 质量靠 **结构 + 状态 + 校验 + 模板**，Skill 只填 **槽位** | 不是单靠 prompt 让模型「自由发挥」 |

**成功标准：** 去掉所有 AI 文案，游戏仍完整可玩；加上 Skin 后，**更贴当前阵位、章节、招募进度**，不增认知负担。

---

## 2. 三层架构（真源顺序）

```text
Spine（引擎 · 不可 AI 改）
  章序、nodeId、kind、encounterId、unlock、数值 band
        ↓ 只读
Runtime State（引擎 · 每帧/每次推进可读）
  chapterCleared、nodeIndex、roster、formation、最近胜负、tier、flags…
        ↓ 约束
Skin Layer（生成/缓存 · 可替换）
  overlay[nodeId]、弧末 parallel 四段、Hub 一行摘要
```

**原则：** Skill 输出必须 **挂到已有 nodeId**；句子内容受 **State + Bible 槽位** 约束，prompt 只负责 **在槽内造句**。

---

## 3. 玩家开局设定（定参 · 无自由小作文）

### 3.1 流程

```text
序章 story（固定）
  → 选 worldPreset：武侠 | 仙侠 | 赛博
  → 输入 heroName（称呼）
  → 选「叙事向量」（见 §3.2，全为枚举）
  → 后台：生成/加载 Bible + 10 章 outline 占位
  → Hub（玩法主轴）
```

### 3.2 叙事向量（建议定稿 · 待 UI 从「8 书型单选」迁回此模型）

**单选（世界观层）**

| 字段 id | 含义 | 武侠示例档 |
|---------|------|------------|
| `worldTexture` | 社会层与视觉基调 | 江湖市井 / 宗门规矩 / 朝局暗线 |

（仙侠：`人间镇守 / 宗门 / 劫域`；赛博：`下层跑刀 / 战队公司 / 殁网残栈` — 词表 per preset）

**可选 1～2 个（长篇母题 · 只改措辞侧重，Gameplay 仍含战斗+招募+破阵）**

| 字段 id | 档 |
|---------|-----|
| `storyMotifs[]` | 护送债 / 洗冤名分 / 崛起破阵 / 探谜真相 （max 2） |

**单选（曲线控制 · 已有类型可映射）**

| 字段 | 现网字段（过渡） |
|------|------------------|
| 感情距离 | `control.bondLine` |
| 全书运势相位 | `control.fortuneArc` |
| 主角口吻 | `control.heroEdge` |
| 叙事镜头 | `control.narrativeLens` |
| 局内压力质感 | `control.pressureTone` |
| 文风 / 节奏 | `tone` / `pace` |

**内置 `novelFrameId`（8 本/位面）** 降级为：Skill 的 **官方 preset 包**（= 上述向量的预置组合），**不作为**主界面「选故事情节」。

### 3.3 玩家不选、引擎必供

- 现代序章 `modernHook`（固定摘要注入 Bible）  
- Spine 节点表、encounter、prepHint  
- 平行四轴 / tier（弧末才算，不进主线 blurb 权重）

---

## 4. 为什么不能只靠 Prompt

| 问题 | 只靠 prompt | 本方案 |
|------|-------------|--------|
| 人设/地名漂移 | 高发 | **Bible 锁词表 + 势力表**；换 bibleId 才允许大改 |
| 与没抽到的卡矛盾 | 高发 | **resolveNodeCopy 读 roster**；模板槽 `{{ownedCount}}` / 无则中性句 |
| 与战斗无关 | 高发 | **prepHint 必填槽**；校验器对照 `encounters.ts` |
| 超长/不可本地化 | 高发 | **字数上限 + validate**；失败 → official pack |
| 续章失忆 | 高发 | **manuscriptSummary + 上一 node 尾句** 进上下文 |
| 成本/延迟 | 不可控 | **outline 一次 + 节点缓存**；同 bible 不重复生成 |

**Skill 角色：** 槽位填词器 + 润色器，**不是**关卡的作者。

---

## 5. 数据产物（存档与文件）

### 5.1 玩家存档 `PlayerNarrativeState`（目标 schema）

```typescript
// 已有 + 待增（SAVE bump 时落地）
interface PlayerNarrativeState {
  phase: 'prologue' | 'mainline';
  worldPreset: WorldPreset;
  heroName: string;

  /** 定参向量（§3.2；过渡期可用 preferences + novelFrameId） */
  narrativeVector: NarrativeVector;

  /** 书级真源 · Skill Phase A 产出或 official 加载 */
  bibleId: string;
  novelBible?: NovelBible;

  /** 节点 copy · key = nodeId */
  overlay?: NarrativeOverlay;

  /** 10 章展示用 outline（title/blurb/fillStatus） */
  mainPlot?: MainPlotOutline;

  /** story choice · 仅影响后续 blurb */
  flags?: Record<string, string>;

  /** 续章用 · 每章通后滚动更新（200～400 字） */
  manuscriptSummary?: string;
  /** 已生成 Skin 的最大章 order */
  skinChapterReady?: number;

  skinGenerationStatus: 'pending_skill' | 'stub' | 'ready' | 'failed';
  parallelWorldAxes?: …;   // 见 parallel-sync spec
  parallelArcReports?: …;
}
```

### 5.2 `NovelBible`（Phase A 最小集）

```typescript
interface NovelBible {
  id: string;              // hash(vector + spineVersion + preset)
  preset: WorldPreset;
  heroRole: string;        // 1 句身份
  worldDisplayName: string;
  factions: { id: string; label: string; blurb: string }[]; // 2～4
  lexicon: string[];       // 允许用词
  forbidden: string[];     // 禁止词（含 avoidMixing）
  rosterRule: string;      // 投影怎么称呼
  motifWeights: Record<string, number>; // 来自 storyMotifs
  chapterThesis: string[]; // 长度 ≥ 计划章数（默认 10）
}
```

### 5.3 节点 Copy 槽位（Phase B · 模板驱动）

每个 `nodeId` 在 official pack 或 skeleton 中有 **模板 id**，例如：

```yaml
ch2_n1:
  template: battle_gate
  slots:
    place: { max: 16 }
    title: { max: 20 }
    blurb:
      max: 280
      must_include: [ prepHint_paraphrase, roster_or_solo ]
      optional: [ callback_prev_node ]
```

Skill **只填 slots**，不发明 template。模板库放 `narrative/templates.zh.yaml`（P0 可仅 ch1–2）。

---

## 6. 生成流水线（与玩法节奏对齐）

### Phase 0 · 官方保底（无 Skill 也能玩）

- `officialPacks/{preset}.overlay.json` 写满 **defs 现有 ch1–ch6** 全部 nodeId  
- Hub / 战前 / story：**resolveNodeCopy** → overlay → defs 占位

### Phase A · 开书（序章提交后 · 异步可）

**输入：** worldPreset + narrativeVector + heroName + spineVersion  
**输出：** novelBible + mainPlot 十章 **title + chapterThesis**（blurb 仍占位）  
**判据：** validateBible；失败 → official bibleId + `skinGenerationStatus: failed`（Hub 小字提示，**不影响战斗**）

### Phase B · 懒填充（玩法触发）

| 触发 | scope | 产出 |
|------|-------|------|
| 首次进入 Hub 且当前 node 无 copy | node | 当前 node slots |
| 通章前预取 | chapter | 下一章全部 node（可选） |
| story choice 后 | node | 分支 blurbAfter 写入 flags 链 |

**输入必含：** bible + **PlayerState 快照**（roster、formation、chapterCleared、flags）+ prepHint + prevBlurbTail  
**输出：** overlay 片段 merge 进存档  
**缓存：** 同一 `bibleId + nodeId + flagsHash` 不重复调 Skill

### Phase C · 弧末平行（独立 Skill）

- 仅 `parallelArcReports` 四段；输入 tier/axes/roster/power，**不读 worldTexture 词表**

### Phase D · 续章（chapterCleared ≥ 10 后）

**触发：** 通第 10 章（或每通偶数章）询问「续写下一章节」或自动 append  
**输入：** bible + manuscriptSummary + overlay 最近 2 章 + **band 规则**（新章 encounter 仍从表抽）  
**输出：**  
1. 新 `ChapterDef` **仅 Skin 侧** 增 `ch11…` outline；或玩法侧扩 defs（需单独 plan）  
2. Phase B 继续 lazy fill  

**玩法续章硬约束：** 新章 node 数、encounter band 与 [chapter-progress](../systems/chapter-progress.md) 一致，**AI 不得加/减 battle 次数**。

---

## 7. 章内「选择性内容」（填充用 · 不改 Spine）

- 仅 **kind=story** 且 skeleton 标记 `choice: true` 的节点  
- 2～3 选项 → 写 `flags[choiceId]`  
- 后续 node 模板增加条件：`if flag.x → slot variant B`（**模板分支，不是 AI 即兴**）  
- battle 节点 **无 choice**

默认十章：每章 **0～2** 个 choice 槽（见 [10ch-sections](./2026-09-29-story-spine-10ch-sections-design.md)）。

---

## 8. 运行时：`resolveNodeCopy`（P0 必实现）

```typescript
function resolveNodeCopy(
  state: PlayerState,
  chapterId: string,
  nodeId: string,
): { title: string; place: string; blurb: string } {
  const base = defsNode(chapterId, nodeId);
  const skin = state.narrative?.overlay?.nodes[nodeId];
  const merged = skin ? { ...base, ...skin } : base;
  return injectRuntimeTokens(merged, state); // 名册数、当前战前 hint、heroName
}
```

**injectRuntimeTokens：** 规则引擎（非 LLM），例如未拥有某模板 id 时不渲染「XXX 立于阵前」句。

---

## 9. 校验与回退（质量门禁）

| 步骤 | 函数 | 失败时 |
|------|------|--------|
| Bible | `validateNovelBible` | official bible |
| Overlay | `validateNarrativeOverlay` | 该 node 用 official 句 |
| 运行时 | 长度 / 禁词 / prepHint 关键词 | 截断 + 日志；玩家侧无阻塞 |

**禁止 AI 碰：** 数值、掉落、encounter 属性、unlock id、gacha、体力（与 player-spine §5.4 一致）。

---

## 10. Skill 工具链（Cursor / CI）

1. **Read-only：** `chapter/defs.ts`、`encounters.ts`、玩家 vector JSON  
2. **Write：** `novelBible` → 校验 → 存档或 `generated/{bibleId}.json`  
3. **Write：** overlay 按 scope merge  
4. **Never：** 改 defs.ts（续章玩法扩展走人工 PR + 版本号）

Skill 正文见 [story-gen-skill-contract.md](./story-gen-skill-contract.md)（将随本方案更新输入字段为 `narrativeVector`）。

---

## 11. 与现网差距（实施序）

| 优先级 | 项 | 说明 |
|--------|-----|------|
| **P0** | `resolveNodeCopy` + official ch1–6 pack | 无 Skill 可玩 |
| **P0** | `validateNarrativeOverlay` 骨架 | 至少 nodeId 存在 + 字数 |
| **P1** | 序章 UI 改为 **向量定参**（§3.2）；书型改 preset | 去掉「选情节」心智 |
| **P1** | Phase A stub + `novelBible` 存档字段 | 仍可用模板句 |
| **P1** | 章通关 → `applyParallelReport` + 弧 UI | 平行填充 |
| **P2** | Phase B lazy + state 注入 + 节点缓存 | 真千人千面 |
| **P2** | choice 节点 + flags + 模板分支 | 选择性填充 |
| **P3** | Spine 10 章与 band 对齐 | 与 mainPlot 一致 |
| **P3** | Phase D 续章 + manuscriptSummary | 10 章后继续 |
| **P3** | Parallel Brief Skill 替换 stub | 弧末四段 |

---

## 12. 验收（每个 Phase）

- **P0：** 关 Skill，通 ch1–3，文案全来自 official，无空白报错  
- **P1：** 改 vector 重开档，logline/bible 变，**战斗表不变**  
- **P2：** 盲测 20 节点：无 prepHint 脱节、无未拥有角色指名  
- **P3：** 通 10 章后续写 ch11，摘要不矛盾，band 合规  

---

## 13. 对外话术（运营 / 商店）

- ✅ 「摸鱼修仙，推图布阵；你的这趟异世界，台词和名场面随进度长出来。」  
- ❌ 「AI 写小说」「专属长篇连载」作为主标题  

---

## 14. 已拍板（2026-10-02）

1. **叙事向量：** 采用 §3.2（`worldTexture` + `storyMotifs`≤2 + control + tone/pace）。  
2. **卷一：** **Spine 与 Skin 均为 10 章**（`defs.ts` · `CHAPTER_BANDS` · `mainPlot.chapters`）。  
3. **分卷：** **10 章 = 一卷**；卷末（ch10）后可开 **卷二**（ch11–20），新卷须新 `bibleId` + 继承 `manuscriptSummary`。

---

## 15. 卷内推进：不散漫靠什么（不靠 prompt）

**引擎真源：** `volumeBeats.ts` · `VOLUME1_BEATS`（10 条，与 ch1–ch10 一一对应）

每章固定：

- **beatTitle / beatSummary** — 本章叙事功能（入局→初规→…→卷终）  
- **primaryLocation** — 绑 `SpineLocationId`  
- **npcSlots** — 本章应出现的剧情 NPC 槽  
- **callbackFromChapter** — 必须承接上一章因果  
- **hookForNext** — 为下一章埋钩类型（threat/clue/cost/arrival）  
- **anchorNodeId** — 模板/Skill 首填节点  

**Skill 填 node 时的硬输入（除 Bible/State 外）：**

```text
volumeBeat(chN) + resolveLocationDisplay + resolveNpcDisplay
+ prepHint + prevNodeBlurbTail + flags
```

**校验（validateNodeSkin）：**

- blurb 须出现 **primaryLocation 的 displayName**（或同义词表内）  
- 若 `npcSlots` 非空，须至少出现其一 displayName  
- 若 `callbackFromChapter` 非空，须含 **上一 beat 的 beatTitle 或 summary 关键词之一**（表驱动）  
- 禁止引入未在 bible / worldSpine 注册的地点名  

这样 **推进逻辑在表上**，Skill 只做「同骨不同皮」的造句。

---

## 16. 地图 · 城池 · NPC：Spine 与 Skin 分工

| 层 | 内容 | 谁维护 |
|----|------|--------|
| **Spine** | `loc_gate`…`loc_boss_gate` · `npc_handler`…`npc_turncoat` | 引擎 `worldSpine.ts`（id 永不增删，卷内稳定） |
| **Official Skin** | 每 preset 默认中文名（青石关 / 界域关 / 下层关口…） | `LOCALE_*` 表，**无 Skill 可玩** |
| **Generated Skin** | 同 id 换名，须 **worldTexture + lexicon** 一致 | Skill 输出 `WorldSkinNames` 写入 Bible，**不得新 id** |

**抽卡 hero（名册投影）** 与 **剧情 NPC 槽** 分离：

- 战斗单位仍 `hero` / templateId；文案通过 `rosterHook` + **State 是否 owned** 注入。  
- 剧情 NPC 只用 `npc_*` 槽，卷内职能不变，换皮只换称呼。

**是否每皮完全生成地图？** 否。默认 **全玩家共用 10 城 5 槽**；Skill 仅在 Bible 里 **optional override displayName**，并通过校验与 preset 默认二选一。

代码真源：

- `packages/game-core/src/narrative/worldSpine.ts`  
- `packages/game-core/src/narrative/volumeBeats.ts`

---

## 17. 卷二及以后（ch11+）

1. 通 ch10 → 触发 **开卷**（UI 一次确认）。  
2. 复制 `VOLUME1_BEATS` 结构为 `VOLUME2_BEATS`（或同表 `volumeId: vol2` + chapterOrder 11–20），**beat 功能可复用，location id 可映射新 pass/hall**。  
3. `manuscriptSummary` + 卷一 overlay 摘要作为 Skill 输入；**Spine 扩表 ch11…**（玩法 band 续表）。  
4. 平行弧：`arc6` 起每 2 章仍弧末推演（spec 后续扩 `ParallelArcId`）。

---

## 18. 实施序更新

| 优先级 | 项 | 状态 |
|--------|-----|------|
| P0 | Spine **10 章** + bands 10 | ✅ defs/bands |
| P0 | volumeBeats + worldSpine | ✅ 代码 |
| P0 | official overlay 10 章 + resolveNodeCopy | ✅ `resolveNodeCopy` · `buildOfficialOverlayFromBaseline` · Hub 已读 |
| P1 | 序章 narrativeVector UI | 待做 |
| P1 | validateNodeSkin（beat + location + npc） | ✅ `validateNarrativeOverlay` 骨架 + 单测 |
| P2 | Bible 含 `WorldSkinNames` | 待做 |
| P3 | 卷二 ch11+ 开卷流程 | 待做 |
