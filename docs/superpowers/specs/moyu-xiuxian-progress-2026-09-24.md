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

## Loop 状态

**已停**（2026-09-27 · 用户要求；**2026-09-28** 确认结束后台 `AGENT_LOOP_TICK` PID 85039）。勿再挂 `/loop 10m`，除非重新开跑。

## 当前 Wave（手动续做时）

**V1 最小补齐包 · 已完成 2026-09-28**（未 commit  unless 用户要求）

## 已完成

W1–W13 · **V1 最小补齐包**：Web `rollEncounterModifiers`；布阵/Hub 共鸣预览；战斗词缀+共鸣文案；Hub 三步引导（`moyu_hub_onboard_v1`）；ch1–ch2 叙事；expand compose 遇「诀」用 motif；`.gitignore` 增 `.claude/` 等。

## **How to apply**

- 本地验证：Hub 首屏引导 → 主线/猎装一战看「本场词缀」→ 布阵前排满 3 看铁壁提示
- 可选后续：zhongtu 表内非 expand 路径的「诀」、tracking §13 历史段落压缩
