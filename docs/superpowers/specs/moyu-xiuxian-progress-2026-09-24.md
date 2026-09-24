# moyu-xiuxian · loop 进度记忆（2026-09-24）

> **Loop 已开** · 计划 [tracking.md §13.2](./tracking.md#132-dev-loop--上古-expand进行中)

## 环境噪声清单

| 现象 | 为何无害 | 快速复核 |
|------|----------|----------|
| `pnpm dev` / Volta | 工具链 | `packages/web` → `./node_modules/.bin/vite` |

## 本轮 commit 数

- **loop 第 1 轮**：1（P5a，见 `git log -1`）

## 已完成（别重做）

- §13.1 P0–P4（周循环、封神 expand 测例、prepHint）
- **P5a**：上古五人 `roster.test` 专测（169 tests 基线）

## ⚠️ 阻塞项

（无）

## 刻意的选择

- 条件伤害帽、支付、存档：**不碰**（§13.1 人定）

## **How to apply:**

1. **第一动作**：tracking **§13.2 P5b** — `zhongtuRoster.ts` 上古五人 `skillName` 与 `motif` 对齐（去掉「黄诀/西诀/伏诀/大诀」类占位若仍残留）。
2. **已完成别重做**：P5a 五人 roster 测例。
3. **下一件**：`packages/game-core/src/character/roster/zhongtuRoster.ts` 行 `huangdi`/`fuxi`/`dayu`/`xiwangmu`。
4. **为何单独一轮**：只改名册文案，不动 hooks/星轨编译。
5. **判据**：五人 `getSkill().name` 不含裸「诀」；`npm test` 169/169。
