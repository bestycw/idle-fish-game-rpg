# moyu-xiuxian · loop 进度记忆

> [moyu-xiuxian-loop-master-plan.md](./moyu-xiuxian-loop-master-plan.md)

## feel 基线（W13 · 2026-09-27）

默认队（主角/张飞/赵云/孙悟空/华佗）· **15 seeds** · `wall,oil_cask,archers`

| 遭遇 | 胜率 | 备注 |
|------|------|------|
| wall | **67%** (10/15) | 33% 败；部分「战局过久」 |
| oil_cask | **53%** (8/15) | 败因禁疗/医士提示与过久混合 |
| archers | **53%** (8/15) | 败因多「后排点爆」+ 猎装/镜渊 hint |
| **合计** | **58%** (26/45) | 未调参（绿灯区间，仅记录） |

命令：`cd packages/game-core && npm run feel -- --seeds 15 --encounters wall,oil_cask,archers`

## 当前 Wave

**W14 · bundle/诀 扫尾**（可选）或停 loop

## 已完成

W1–W12 · **W13 feel**

## **How to apply**

- W12 代码未 commit（Hub/unlockLabels/Result）
- W14：`characterBundle` / 名册裸「诀」扫尾（zhongtu 仍有非 expand 占位时可改）
