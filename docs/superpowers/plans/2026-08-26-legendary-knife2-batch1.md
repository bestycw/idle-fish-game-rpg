# 计划：绝品刀二第一批

> **状态：已完成。** 规格：[legendary-knife2](../specs/2026-08-26-legendary-knife2-design.md)  
> 进度：[tracking.md](../specs/tracking.md)

## 目标

刘备、庞统、牛魔王、唐僧、铁扇公主：赵云标准招牌（2～3 效果）+ ★1–6 典故轨 + ★3/★6 各 2 岔。表驱动编进现网深做。

**不做：** 其余 ~54 张绝品；第二技能栏；新状态；跑 `gen_zhongtu_roster.py`。

## 任务

| ID | 项 | 状态 |
|----|----|------|
| K1 | `legendarySheets.ts` 五人母题卡 + compile → skill/star | done |
| K2 | 编入 `expandDeepKits` / `DEEP_TEMPLATE_IDS`；改 `zhongtuRoster` 五行文案 | done |
| K3 | 测例：27 深做、★3/★6 岔路、本批避让（无破甲/唐僧无硬控） | done |
| K4 | `game-core` 测试绿；浏览器刘备/唐僧技能页 | done |
