# 背包（道具）系统

> 系统骨架 **§3.7 #17**。状态：**登记 · 暂不做**。  
> 与 [equipment.md](./equipment.md) 区分：装备是穿戴件；本系统是材料/消耗品。  
> **物品 id、分类、生活/炼药/锻造预留：** 权威见 [item-registry.md](./item-registry.md)（勿在本文重复造表）。

## 职责（预定）

- UI：堆叠物背包格、筛选（货币/材料/消耗/任务）、使用/合成入口。
- 数据：只读 `ItemDef` + `PlayerState.materials`（见 item-registry §7）。

## 何时开工

Registry P0–P1 落地后；或人物成长（升级/突破）需要独立背包格时。
