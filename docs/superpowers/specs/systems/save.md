# 存档 / 会话系统

> 系统骨架 #11。横切所有系统。  
> **实现状态：** 本地存档；`PlayerState.version` = **16**。云/账号后置。

## 职责

- 本地存档读写（后置云/账号）
- `PlayerState.version` bump；不兼容则作废旧档
- 会话内：冒险 →（布阵/养成）→ 战斗 → 结果 → 回冒险

## 约定

- Demo：bump 即废旧档（已用）；当前 `PlayerState.version` = **16**
  - v4：`towerFloor` / 成长 roster  
  - v5：抽卡券 / `owned` / `cardShards` 等（见 gacha）  
  - v6：`stamina` / `staminaUpdatedAt`（见 stamina）  
  - v7：`chapterCleared` / `chapterNodeIndex`（见 chapter-progress）  
  - v8：`lastDailyClaimDay`（摸鱼补给日戳）  
  - v9：公版卡池换代 — 剔除旧占位 templateId；阵容重置为默认五人（决策史：[public-domain-roster](../2026-08-01-public-domain-roster-design.md)）  
  - v10：卡池扩至 24 + 成长/副本加深 — `ensureRoster` 补齐新卡  
  - v11：属性键 remap（旧双攻/急速/终伤 → 现行字段）  
  - v12：共享衣柜 `equipped` → 每角色 `characterEquip`（16 槽 remap 到 12 槽）  
  - v13：清空旧库存 / 装备栏 / 封存印（词缀生成器换代）  
  - v14：旧 5 境 remap 到 17 档天梯（`LEGACY_REALM_TIER_MAP`）  
  - **v15：** 读档后 `equipped` 恒空；穿戴只认 `characterEquip`  
  - **v16：现行。** 中土卡池：国外 id 映射或折碎片，见 [中土故事圈 §4](../2026-08-26-zhongtu-roster-circles-design.md)  
- 装备槽 **12 全开**（见 [equipment.md](./equipment.md)）；字段预留：`skinId`、套装激活态（非「未露槽」）  
- Web key 与 core `version` 可不同步；读档以 `PlayerState.version` 为准

## 代码

- `packages/game-core/src/save/player.ts`
- `packages/web/src/adapters/localSave.ts`
