# moyu-xiuxian · loop 进度记忆（2026-09-24）

> 计划 [tracking.md §13.3](./tracking.md#133-dev-loop--吴越-expand待开)

## 每轮必跑（伤害/技能流）

```bash
cd packages/game-core && npm test
# 或快验：npm run test:combat-flow
```

维护 spotlight：`packages/game-core/src/combat/combatFlowSpotlight.ts`

## 已完成（别重做）

- §13.2 上古 P5a–P5c
- **loop 门禁**：`combatFlowSmoke.test.ts`（173+ tests）

## **How to apply:**

1. **第一动作**：§13.3 **P6a** 吴越六人 roster 测例；**P6b 后**把六 id 写入 `combatFlowSpotlight.ts`。
2. **每轮收尾**：`npm test` 0 fail（含多轮 auto battle 冒烟）。
