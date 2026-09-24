# moyu-xiuxian · loop 进度记忆（2026-09-24）

> 断点真源。每轮 dev-loop **先读本文**，再动代码。计划阶段见 [tracking.md §13.1](./tracking.md#131-dev-loop-周循环主线计划)。

## 环境噪声清单

| 现象 | 为何无害 | 快速复核 |
|------|----------|----------|
| 根目录 `pnpm dev` 在部分环境报 Volta 找不到 pnpm | 与玩法无关 | `packages/web` 下 `./node_modules/.bin/vite` |
| `tsconfig.tsbuildinfo` 常出现在 git status | 构建缓存 | 不必纳入 commit 除非团队约定 |

## 本轮 commit 数

- **2026-09-24**：3（`4b3590b` dungeon · `0030b7c` equipment · `510f1b8` roster+loop 文档）

## 已完成（别重做）

- **P0**：`tracking.md` §13.1 + 本 progress 文件 + loop prompt 模板
- **P1（核心）**：`buildDefeatHint` 八题中 spirit/oil/shield/archers 补「镜渊/猎装」指向；Hub 副标题（刷装量 / 对症 T3）
- **P2**：`growth.test.ts` 与赵云深做星轨、破境文案格式对齐 → **167/167** `npm test` 绿
- 遭遇八题、镜渊掉落加权、`encounterRecipes.test.ts`、`dungeon.test.ts`、`gearIdentity.test.ts`（会话前 WIP）

## ⚠️ 阻塞项

（无）

## 刻意的选择（别优化掉）

- **套装 2/4 身份后置**；**胚子打造不做**；**传说招牌圣经暂缓**。
- **条件伤害帽 35%**：未动（§13.1 人定项）。

## **How to apply:**

1. **第一动作**：若用户要求 **提交 WIP**，按 tracking §13.1「P0-WIP 清单」拆 2~3 commit；否则进入 **P3**。
2. **已完成别重做**：P2 测试门禁、P1 战败 hint 主路径（除非 P4 战前提示要复用同一 metadata）。
3. **下一件**：`packages/game-core/src/character/roster/` — 封神缺口 **申公豹 / 敖丙 / 太乙**（参照 `legendary-knife2` plan 与已有 `expandRoster` 模式）。
4. **为何单独一轮**：P3 只动 roster/星轨/技能表一条变更面，避免与 dungeon 掉落混 commit。
5. **验收判据**：tracking §13.1 **P3 判据**；全量 `npm test` 仍 0 fail。
