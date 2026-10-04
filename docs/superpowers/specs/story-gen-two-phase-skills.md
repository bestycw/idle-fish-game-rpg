# Story Gen · 两阶段 Skill（大纲 + 详写）

> **状态：** 2026-10-03 · 与单文件 [story-gen/SKILL.md](../../../.cursor/skills/story-gen/SKILL.md) 并存，**推荐新任务走两阶段**  
> **契约：** [story-gen-skill-contract.md](./story-gen-skill-contract.md)

## 为什么要拆

| 单 Skill 一次写 19 节点 | 两 Skill |
|-------------------------|----------|
| 上下文挤占，对话易变短、变模板 | 大纲锁定人名/城镇/章弧，详写专注台词密度 |
| 卷二续写要从零复述约束 | **outline 可换卷**；**detail 流程复用** |
| Agent 易漏 beat 回调 | outline 的 `mustMention` + detail 分批校验 |

玩法 Spine **不变**；两阶段只影响 Skin 生产流程。

---

## 阶段对照

| | Outline Skill | Detail Skill | Quest Skill（壳） |
|--|---------------|--------------|------------------|
| 路径 | `.cursor/skills/story-gen-outline/` | `.cursor/skills/story-gen-detail/` | `.cursor/skills/story-gen-quest/` |
| 产出 | `NovelBible`、`worldSkinNames`、`*.volumeN.outline.json` | `overlay.nodes`（JSON 或存档） | `*.quests.overlay.json`（**运行时未读**） |
| 粒度 | 10 章卷纲 | 建议 2–4 章/批 | 建议 3 章/批 · 卷一 6～10 side + 2～4 hidden |
| 续章 | 新卷 outline + 新 beat 表 | 同一 detail 规范写新 nodeId | 新卷 quest 皮 + `questIdRegistry` |

---

## 数据流

```text
序章定参
  → outline Skill（Phase A + 章纲 JSON）
  → detail Skill 批 1…N（Phase B 节点）
  → validate / story-gen-quality
  → （可选）quest Skill → story-gen-quest-quality
  → officialPacks 或 generateOnboardingSkinBatch
```

运行时仍：`玩家 overlay > official JSON > baseline`。

---

## Outline JSON schema

见 `officialPacks/xianxia.volume1.outline.json`（含 **`worldSkinNames`**、每章 **`nodes` brief**）。Detail Skill **必须**在写 node 前读对应章的 `dramaticGoal` / `mustMention` / `nodes[nodeId].brief`。

**续章 checklist：** 见 [.cursor/skills/story-gen-outline/SKILL.md](../../../.cursor/skills/story-gen-outline/SKILL.md) §续章 · 最小 Checklist。

**仙侠名表同步：** `packages/game-core/scripts/sync-xianxia-outline-to-overlay.mjs`（outline → overlay 顶栏；序章 batch 读 `getOfficialVolumeOutline`）。

---

## 当前落地

| 项 | 状态 |
|----|------|
| 仙侠卷一 outline | `xianxia.volume1.outline.json` |
| 仙侠卷一详写 | `xianxia.overlay.json` 已加厚 blurb + 5 行级 dialogue |
| 武侠/赛博 | 暂不跟进 |
| 运行时读 outline | **部分**：`worldSkinNames` 经 `volumeOutline.ts` 进序章 batch；节点正文仍只读 overlay |

---

## 与旧 `story-gen` Skill 关系

- **story-gen/SKILL.md**：卷一全览 + 校验命令，指向 outline/detail。  
- 小改（只修 ch7 对话）：只用 **detail**，不必重跑 outline。
