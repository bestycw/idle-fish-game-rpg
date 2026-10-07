# Story Gen Skill · 接口契约（Agent / 离线 / 序章 batch）

> **总方案：** [narrative-skin-generation-scheme.md](./narrative-skin-generation-scheme.md)  
> **两阶段：** [story-gen-two-phase-skills.md](./story-gen-two-phase-skills.md) · outline / detail Skills  
> **Agent 操作手册：** [.cursor/skills/story-gen/SKILL.md](../../../.cursor/skills/story-gen/SKILL.md)  
> **Spine 清单：** `packages/game-core/src/narrative/storyGenManifest.ts`

---

## 1. 输入（序章定锚 · 无自由小作文）

| 字段 | 必填 | 说明 |
|------|------|------|
| `heroName` | 是 | 称呼；对话行用 `{{heroName}}` |
| `worldPreset` | 是 | `wuxia` \| `xianxia` \| `cyberpunk` |
| `preferences.vector.worldTexture` | 是 | 世界质感（每 preset 三档） |
| `preferences.vector.storyMotifs` | 是 | 1–2 个母题 |
| `preferences.novelFrameId` | 是 | 书型 seed（UI 可默认首项；Skill 必读 seed） |
| `preferences.control.*` | 是 | bond / fortune / heroEdge / lens / pressure |
| `preferences.tone` | 是 | `witty` \| `earnest` → 主角台词风格 |
| `preferences.pace` | 是 | `slow_burn` \| `fast` → 单节点对话行数倾向 |

**禁止：** `seed.avoidMixing` 词；新 Spine id；改 encounter/解锁/战斗波次表；改开局阵容 / 教学门发券逻辑。

**战斗：** 多波连战、小兵/Boss 组成由 `chapter/defs` + `mainlineBattleWaves` + `encounters` **默认配置**；Skill 仅在 battle `blurb` 中间接提及 prepHint，**不生成** `battleWaves`。

**卷一对齐（Skin 勿写反）：**

- 开局 = 主角 + 1 随机珍品（紫），不是五人默认队。  
- 每阵 = 两小怪 → 阵末精锐；**本章最后一个 battle 节点**收尾 = 首领（ch1 为 `ch1_n4` 箭道首领）。  
- ch1 首战盾墙阵末精锐 = 教学门（引擎发券保蓝）；主线/支线 Skin **勿再发同一张教学券**。

---

## 2. 输出（卷一 · 一次性）

### 2.1 `NovelBible`（Phase A）

见 `types.ts` · `NovelBible`。Skill 须填：`heroRole`, `lexicon`, `forbidden`, `rosterRule`, `chapterThesis[]`（≥10 条，对齐 beat）。

### 2.2 `NarrativeOverlay`（Phase B）

```typescript
interface NarrativeOverlay {
  worldSkinNames?: {
    towns?: Partial<Record<SpineTownId, string>>;
    locations?: Partial<Record<SpineLocationId, string>>;
    npcs?: Partial<Record<SpineNpcSlot, string>>;       // 人名 · speaker
    npcEpithets?: Partial<Record<SpineNpcSlot, string>>; // 身份称谓
  };
  nodes: Record<nodeId, {
    title?: string;
    place?: string;
    blurb?: string;
    dialogue?: { speaker: string; text: string }[];  // story 必填
  }>;
}
```

- **节点全集：** 19 个 nodeId（与 `defs` 一致）。  
- **story（9 个）：** 必须有 `dialogue`（2–8 行，text≤120）。  
- **battle（10 个）：** 无 dialogue；blurb 扣 `prepHint`。

### 2.3 校验

- `validateNarrativeOverlay(overlay, preset)` — 硬错误（beat/字数/缺节点）  
- `storyGenQualityReport(overlay, preset)` — 硬错误 + **`storyDialogueMissing[]`**  
- Skill 完整包：`errors` 空且 `storyDialogueMissing` 空  

---

## 3. 地点与 NPC

| 层 | Skill 做什么 |
|----|----------------|
| Spine id | **不改**（`loc_*`, `npc_*`） |
| 城镇 | `worldSkinNames.towns` · 每章 `primaryTown` 须在 blurb+dialogue 出现 |
| 事发地 | `locations` + node `place`（同一套显示名，**非**城镇名） |
| 剧情 NPC | `npcs` 人名 · dialogue `speaker`；`npcEpithets` 可选 |
| 名池 | `officialNamePools.zh.ts` · Skill 可从池选，不必每次造新字 |
| 每章 beat | `primaryTown` + `primaryLocation` + `npcSlots` 人名须在合体文本中出现 |
| 回调 | 含上一章 `beatTitle` 或 summary 前 8 字 |

抽卡 **战斗单位** 不进 dialogue speaker；用 `rosterRule` + 中性句。

---

## 4. 主角台词映射（摘要）

| 控制 | 效果 |
|------|------|
| `tone=witty` + `edge_banter` | 主角对白偏短、可吐槽 |
| `tone=earnest` + `edge_stoic` | 主角对白 Minimal |
| `heroEdge=edge_warm` | 主角多问人、少阴阳 |
| `fortuneArc=fortune_uphill` | 前段台词偏紧/险，后段略松（仍不剧透胜负） |

---

## 5. 流程（与代码）

```text
序章定参 → generateOnboardingSkinBatch（或 LLM 同形状）
  → novelBible + overlay(19 nodes) → 存档
Hub story 节点 → resolveMainlineDialogue → UI 对话 → advanceStoryNode
```

官方默认：`officialPacks/{preset}.overlay.json`（bundled + 可 Skill 整包替换）。

---

## 6. 书型列表（novelFrameId）

**武侠：** 天下镖局 · 浪子酒旗 · 门墙旧案 · 借势行棋 · 江口孤篷 · 金身疑案 · 雪山送帖 · 药谷换命  

**仙侠：** 劫域试心 · 人间镇守 · 剑冢无名 · 灵脉争席 · 丹炉誓约 · 异兽名簿 · 云上护送 · 心镜幻境  

**赛博：** 债务跑刀 · 战队挂靠 · 殁网教典 · 笼中成名 · 记忆当铺 · 轨下社群 · 合成人格 · 霓虹布道  

细节见 `novelFrames.zh.ts`。

---

## 7. Parallel Brief（独立 Skill）

- **Skill：** `.cursor/skills/story-gen-parallel/SKILL.md`  
- **产出：** `officialPacks/{preset}.parallel.overlay.json` · 当前只必填 **生活段** `segments[arcId].life.{low,mid,high}`  
- **运行时：** `resolveLifeLeisureText` · `{{heroName}}` + 无 overlay 时程序池 + `preferences.tone`  
- **禁止：** 改 tier/axes；**不读**主线 node dialogue。
