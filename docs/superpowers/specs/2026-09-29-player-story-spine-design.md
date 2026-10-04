# 玩家定调主线 + AI 叙事架构

> **状态：** 架构拍板稿（2026-09-29）· **未开工代码**  
> **正式开场流程：** [现代牛马 → 选世界 → 异世](./2026-09-29-opening-saga-modern-isekai.md)（**先于**本章 §4 旧「三模式」）  
> **Skill 契约：** [story-gen-skill-contract](./story-gen-skill-contract.md)  
> **关联：** [product §2.3](./product.md) · [chapter-progress §9](./systems/chapter-progress.md) · `chapter/defs.ts`（Spine 真源）

---

## 1. 要解决的问题

玩家希望：

1. **统一现代序章**（纯牛马、老板压榨、裂隙），再 **玩家选异世界**（武侠 / 仙侠 / 赛博朋克…）。  
2. **AI / Skill 在框架内生成** 各世界 Skin（章名、场地、过场），见 [story-gen-skill-contract](./story-gen-skill-contract.md)。  
3. **默认世界 = 仙侠**（序章后可「不挑了」一键进入）。  
4. **玩法不被剧情绑架**：解锁、遭遇 id、掉落、战斗公式 **不变**；卡池仍是历史/传说 **投影** 同行。

---

## 2. 核心原则（两层分离）

```text
┌─────────────────────────────────────────────────────────┐
│  Story Spine（引擎锁死 · 策划/表驱动 · 禁止 AI 改 id）     │
│  章序 · 节点 kind · encounterId · unlocksOnClear · 掉落池  │
└───────────────────────────┬─────────────────────────────┘
                            │ 1:1 映射 nodeId / chapterId
┌───────────────────────────▼─────────────────────────────┐
│  Story Skin（玩家 + AI · 可缓存 · 可换皮不改档进度）       │
│  世界名 · 章回名 · place/title/blurb · 词表 · 过场选项文案   │
└─────────────────────────────────────────────────────────┘
```

| 锁死（Spine） | 可生成（Skin） |
|---------------|----------------|
| `ch1`…`ch6` 顺序、每章 `nodes[]` 长度与 `kind` | 章 `name` / `blurb` 的**显示版** |
| 每个 battle 节点的 `encounterId` | 该战 `title` / `place` / `blurb`、战前一句话 |
| `unlocksOnClear` 的 kind + id | 解锁 toast / 章末卡片上的**Flavor 一句** |
| 章档 `CHAPTER_BANDS`、建议战力 | Hub 主卡片上的**剧情摘要** |
| role / skillId / 九宫 / 八题机制 | 为何组队的**合理化叙述**（英灵殿、梦境试炼、宗门大比…） |

**卡池：** 200 人中土圈 **不随皮换 id**；Skin 只解释「为何出现」，不换模板。

---

## 3. 默认官方线：仙侠 (`skinPreset: xianxia`)

> 用户拍板：**未定制时默认仙侠**，不是中性占位。

### 3.1 预设元数据（不经过 AI 也可跑）

| 字段 | 默认仙侠示例 |
|------|----------------|
| `worldName` | 九州劫域（可配置） |
| `playerFantasy` | 散修携命格入劫，借名仕异士破阵试炼 |
| `tone` | 短句、江湖+修真口吻，少长篇 |
| `partyFrame` | 命格召来历史/传说中的战魂（解释卡池） |
| `statSkin` | 真元、神速、会心、气运…（见 product §2.3.1） |

### 3.2 默认六章**情节弧**（Skin 模板，Spine 仍用现有 unlock 表）

Spine 节点数量可与现 `defs.ts` 对齐；Skin 按章替换显示文案。

| 章 | Spine 职责（不变） | 默认仙侠 Skin 弧 |
|----|-------------------|------------------|
| ch1 | 开门、猎装八题、开 ch1 池 | **初入劫域** — 驿道遇盾墙，识「破阵」之理 |
| ch2 | 镜渊 + 四八题 + 群雄池 | **乱阵林** — 伏兵乱位，开「镜渊」对症炼器 |
| ch3 | archers + ch3 池 | **远矢台** — 后排箭雨，教切后与穿透 |
| ch4 | wall + ch4 池 | **磨合关** — 宗门小比，定阵换装 |
| ch5 | raiders 高压 + ch5 池 | **劫火原** — 速攻再临，压境试炼 |
| ch6 | boss_warden + ch6 池 | **镇守门** — 线暂歇，深门终阵 |

> 具体 `place/title/blurb` 由 **OfficialXianxiaPack** 静态 JSON 或 AI 在 `xianxia` 约束下生成，**不得改 encounter 与 unlock id**。

---

## 4. 玩家开局（与 opening-saga 对齐）

| 步骤 | 行为 |
|------|------|
| 1 | 播放 **官方序章**（现代牛马 → 裂隙）· 见 [opening-saga §3](./2026-09-29-opening-saga-modern-isekai.md) |
| 2 | **必选世界** `wuxia` / `xianxia` / `cyberpunk`；或「不挑了 → 仙侠」 |
| 3 | 加载对应 **OfficialPack** + 落地屏 |
| 4（可选） | 再填 1 句基调 → **Story Gen Skill** 润色 overlay（Spine 不变） |

**不想管剧情：** 序章连点 + 默认仙侠 → 直接 ch1。

---

## 5. AI 生成契约（输入 / 输出 / 禁止）

### 5.1 输入

```typescript
// 概念类型 · 实现时放 game-core 或 narrative 包
interface StoryGenRequest {
  spineVersion: number;        // 与 CHAPTERS 表版本绑定
  preset: 'xianxia' | 'custom';
  userPrompt?: string;         // B/C 模式
  toneTags?: ('燃' | '谐' | '虐' | '正剧')[];
  locale: 'zh-CN';
}
```

### 5.2 输出（必须可校验）

```typescript
interface StoryBible {
  id: string;                  // hash(request + spineVersion)
  preset: string;
  worldName: string;
  partyFrame: string;          // 1～2 句
  statLabels?: Record<string, string>; // 可选词表，缺则回退 xianxia/中性
}

interface NarrativeOverlay {
  chapters: {
    chapterId: string;         // 必须 = defs 里 ch1…ch6
    displayName: string;
    displayBlurb: string;
    nodes: {
      nodeId: string;          // 必须 = defs 里 node id
      title: string;
      place: string;
      blurb: string;
      /** story 节点可选 2～3 个分支，仅改 flag + 下一段 blurb，不改 kind */
      choices?: { id: string; label: string; blurbAfter: string }[];
    }[];
    unlockFlavor: string;      // 章末一句，不替代 unlockLabels 逻辑
  }[];
}
```

### 5.3 校验器（生成后必跑）

- 每个 `chapterId` / `nodeId` 存在于当前 `CHAPTERS`。  
- 不得出现未注册的 `encounterId` / unlock id。  
- 单节点 blurb 长度上限（如 280 字），防 UI 爆。  
- 失败：**回退 OfficialXianxiaPack**，并标记 `storyGenFailed: true`（可 Hub 提示重试）。

### 5.4 禁止 AI 碰

- 数值、掉落表、遭遇敌人属性、抽卡权重、体力、任何 `ContentUnlock.id`。

---

## 6. 存档与运行时

```typescript
interface PlayerNarrativeState {
  spineVersion: number;
  preset: 'xianxia' | 'custom';
  storySource: 'official' | 'ai';
  bibleId: string;
  /** 完整 overlay；官方线可为预 baked id */
  overlay: NarrativeOverlay;
  /** 节点分支 flag，仅影响后续 blurb，不影响 unlock */
  flags?: Record<string, string>;
  /** 是否已展示「本局世界观」开场 */
  introSeen?: boolean;
}
```

- 挂到 `PlayerState.narrative`（新字段 · SAVE_VERSION bump）。  
- **Hub / ChapterRoute / 战前** 读 `resolveNodeCopy(chapterId, nodeId)` = overlay 优先，无则 defs 占位。  
- **换皮不重打进度**：仅当用户「重开故事皮」且确认后，换 overlay，**保留** `chapterCleared` / roster / 装备。

---

## 7. UI 流程（产品）

1. **新档 / 清档后**：三选一（默认仙侠 / 写一句 / 交给 AI）→ 生成或加载 pack → 短开场（worldName + partyFrame）。  
2. **Hub 主线卡**：显示 overlay 的章名 + 当前 `place` + 下一解锁预告（读 Spine unlock 表 + unlockFlavor）。  
3. **story 节点**：若有 `choices`，2～3 按钮；否则「继续」。  
4. **章末**：解锁卡片（Spine 真实解锁 + Skin 一句）+ **平行原世界同步简报**（现代工位 · 三档 · 可跳过）→ [parallel-sync-realworld-line](./2026-09-29-parallel-sync-realworld-line.md) + 可选宝箱演出（后续掉落层，另 plan）。

---

## 8. 实施分期

| 阶段 | 内容 | 判据 |
|------|------|------|
| **P0 架构** | 本文 + `OfficialXianxiaPack` 静态 overlay 写满 ch1–ch6 | 无 AI；Hub 全读 overlay |
| **P1 开局定调 UI** | 三选一；存档 `narrative`；清档触发 | 默认仙侠可玩通 |
| **P2 AI 生成** | 服务端或 Cursor Skill 批生成 + 校验器；缓存 bibleId | 自定义一句可出整局 overlay |
| **P3 节点分支** | story 节点 choices + flags | 不改变 battle 场次 |
| **后置** | 属性/技能全词表 AI、语音、章节>6 | 不挡 P0–P1 |

**AI 调用策略（建议）：**

- **开局一次**生成全书 overlay（成本低、体验连贯）。  
- 章内仅 **改 blurb / 选项**，不每战调 API。  
- 官方 `xianxia` pack **内置仓库**，零 API。

---

## 9. 与「功能随剧情开放」的关系

Spine 已在 `unlocksOnClear` 实现 **锁内容池**；Skin 负责 **让玩家理解为何此时开放**：

| 解锁类型 | Spine | Skin 示例（仙侠） |
|----------|-------|-------------------|
| `abyss_mirror` | ch2 通关 | 「劫域镜海现，可炼对症法器」 |
| 八题 encounter | 各章 | 「试炼碑林增一题：铁壁灵阵」 |
| `gacha_unit` 批次 | 各章 | 「命格殿可召 XX 境战魂」（汇总，不列 id） |

模块深度（星尘/塔/instant）**另开 plan**；本架构只保证 **主线推起来有叙事、有开门理由**。

---

## 10. 非目标（本架构不做）

- 开放世界、自由聊天、改战斗结局线数。  
- 按剧情换 encounter 数值或卡池 id。  
- V1 即接真 LLM 流式（P2 再议 provider）。

---

## 11. 待你确认的一项（产品）

**默认仙侠 pack 是否与现 ch1–ch2 已写叙事合并润色，还是 ch1–6 全部重写为同一套「劫域」用语？**

- **推荐：** 以本文 §3.2 为纲 **重写六章 Skin 静态包**，Spine id 不动；ch1–2 现有文案迁入 pack 并统一称谓。

确认后可开工 **P0：静态 pack + resolveNodeCopy + Hub 读 overlay**（仍不接 AI）。
