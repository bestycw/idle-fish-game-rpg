# moyu-xiuxian · loop 进度记忆（2026-09-24）

> 断点真源。计划：[tracking.md §13.1](./tracking.md#131-dev-loop-周循环主线计划)。

## 环境噪声清单

| 现象 | 为何无害 | 快速复核 |
|------|----------|----------|
| 根目录 `pnpm dev` Volta 找不到 pnpm | 与玩法无关 | `packages/web` 下 `./node_modules/.bin/vite` |

## 本轮 commit 数

- **2026-09-24 早**：3（`4b3590b` · `0030b7c` · `7df36c0`）
- **2026-09-24 晚**：1（`a2dd264` P3/P4）

## 已完成（别重做）

- P0–P2、周循环 dungeon/镜渊/战败 hint、Hub 副标题
- **P3**：封神 expand 三人 hooks+星轨；`roster.test` 专测；申公豹星章标题修正
- **P4**：八题 `prepHint`；`BattleScreen` 战前展示

## ⚠️ 阻塞项

（无）

## **How to apply:**

1. **第一动作**：tracking §13.1 暂无强制 P 阶段；可选 **上古 expand 五人** 或 **loop 文档/Hub 抛光**。
2. **已完成别重做**：prepHint 八题、封神三人 expand 测例。
3. **下一件**：按 [legendary-knife2-design §5](./2026-08-26-legendary-knife2-design.md) 圈序做上古 batch，或开新 §13.2 计划节。
4. **验收判据**：`npm test` **168/168** pass。
