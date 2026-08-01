# 体力系统

> 系统骨架见 [systems-overview.md](../systems-overview.md)。  
> **实现状态（2026-07-26）：** B2 薄刀已落地（上限 / 自然恢复 / 开战扣点）；付费续航后置。

### 5.4 体力（V1 落地）

| 项 | 规则 |
|----|------|
| 上限 | `STAMINA_MAX = 100` |
| 自然恢复 | 每 `STAMINA_REGEN_MS`（6 分钟）+1，离线同样按时间补；不满上限才涨 |
| 猎装试炼 | 开战扣 **10** |
| 修炼塔 | 爬一层扣 **5** |
| 星尘秘境 | 每次扣 **8** |
| 摸鱼补给 | 每日一次：体力 +20、券 +1（`tryClaimDaily`；日戳 `lastDailyClaimDay`） |
| 扣点时机 | **进入时扣**（败也扣）；不够则不能开 |
| 开局 | 满体力 |
| 定位 | 节奏阀，不是惩罚器；免费额度够多段短刷 |

付费买体力 / 月卡续航：**后置**（→ [economy.md](./economy.md)）。

### API（game-core）

```
syncStamina(state, now?)
getStaminaView(state, now?) → { current, max, msToNext }
trySpendStamina(state, cost, now?) → ok | 不足
tryClaimDaily(state, now?) → 摸鱼补给（见 dungeon/dailyClaim）
```

Hub / 开战前先 `sync`；显示当前体力。
