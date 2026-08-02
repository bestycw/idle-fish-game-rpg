# 布阵系统

> 系统骨架 #2。与 [character.md](./character.md)、[combat.md](./combat.md) 紧耦合。  
> **UI（2026-07-29）：** 入口在**伙伴**页「布阵」→ 独立页；冒险页仅弱链「去布阵」，不做主操作。

## 职责

- 九宫站位（1–9）
- 出战上限 **5**（`MAX_PARTY_SIZE`）
- 换位 / 下阵（主角默认不可下）

## 细则位置

- 格子与前排承伤、形状攻击：→ [combat.md §4.1](./combat.md)
- 默认上阵与池内卡：→ [character.md](./character.md)
- 代码：`packages/game-core/src/formation/`（`placeUnit` / `benchUnit` / `normalizeFormation`）
- Web：`packages/web/src/features/character/FormationScreen.tsx`

## 玩家操作

战前主策略；战中默认只看自动战报（主角可切手动选攻击/技能，仍不点名）。
