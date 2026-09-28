# moyu-xiuxian · Loop 总路线图（2026-09-25）

> **真源优先级：** 本文件 = 阶段顺序与判据；断点 = [moyu-xiuxian-progress-2026-09-24.md](./moyu-xiuxian-progress-2026-09-24.md)；细则 = [tracking.md §13](./tracking.md#13-当前下一刀跟踪用)。

## 0. 北极星（不 loop 偏航）

**产品核：** 九宫布阵 × 刷装；**人·解法**（八题遭遇）+ **装·风格**（猎装量 / 镜渊 T3）。  
**时间预算：** 5–10 h/周 — loop 每轮 1 子阶段、1 commit（用户要求时）。

**不做（除非用户点名）：** 胚子打造、54 绝品深做星、传说招牌圣经重开、套装 2/4 大改、真支付/云存档、PVP。

---

## 1. 每轮固定门禁（所有 Wave 共用）

| 步骤 | 命令 / 动作 |
|------|-------------|
| 开场 | 读 progress → `git status` / `git log -1` |
| 开发 | **一轮一个变更面**（dev-loop §1.4） |
| 收尾 | `cd packages/game-core && npm test`（含 **combatFlowSmoke**） |
| 可选 | `npm run feel -- --seeds 15 --encounters wall,oil_cask,archers` |

**expand 批次标准配方（W1–W9）：**

1. `roster.test.ts` 本批专测（名、softMode、★3 岔路、禁招魂/禁乱开 shred 等）
2. `zhongtuRoster.ts` skillName 与 motif 对齐（无裸「诀」）
3. `combatFlowSpotlight.ts` **追加本批 id**（战斗流多轮验伤害/技能）
4. progress 写下一 Wave（tracking 只更新 §13 指针，不重复抄批次）

---

## 2. 已完成（勿重做）

| 代号 | 内容 |
|------|------|
| **W0·玩法** | P0–P4：周循环、镜渊 T3、八题、prepHint、growth 测例 |
| **W0·expand** | 封神 3 · 上古 5 · 吴越 6 · 群雄 3 |
| **W1·expand** | 八仙+东海 4 人（见 §3 表） |
| **W7–W9·expand** | 瓦岗 / 宝莲+降妖 / 聊斋（见 §3 表） |
| **门禁** | `combatFlowSmoke.test.ts` + `npm test` 基线 **184** |

---

## 3. Expand 清尾（W1–W9 · 按圈 batch）

hooks 已在 `legendaryExpandHooks.ts`；loop **只验收 + 文案 + 测例**。

| Wave | §13 | 圈 | ids（legendary expand） | 判据 |
|------|-----|-----|-------------------------|------|
| **W1** | 13.5 | 八仙+东海 | `lvdongbin`, `hanzhongli`, `tieguaili`, `aoguang` | 专测 + 无诀 + spotlight + test 绿 · **2026-09-25 已验收** |
| **W2** | 13.6 | 江南 | `baisuzhen`, `xiaoqing`, `fahai`, `zhinu` | 同上 · **2026-09-27 已验收（177 tests）** |
| **W3** | 13.7 | 楚汉 | `liubang`, `hanxin`, `zhangliang`, `yuji` | 同上 · **2026-09-27 已验收（178 tests）** |
| **W4** | 13.8 | 兵家 | `guiguzi`, `sunwu`, `gongshuban`, `pangjuan` | 同上 · **2026-09-27 已验收（179 tests）** |
| **W5** | 13.9 | 忠烈 | `muguiying`, `yangye`, `mulan`, `shetaijun` | 同上 · **2026-09-27 已验收（180 tests）** |
| **W6** | 13.10 | 梁山 | `linchong`, `wusong`, `luzhishen`, `songjiang` | 同上 · **2026-09-27 已验收（181 tests）** |
| **W7** | 13.11 | 瓦岗 | `qinqiong`, `lishimin`, `yuchigong`, `luocheng` | 同上 · **2026-09-27 已验收** |
| **W8** | 13.12 | 宝莲+降妖 | `chenxiang`, `sanshengmu`, `zhongkui`, `xuxun`, `jigong` | 同上 · **2026-09-27 已验收** |
| **W9** | 13.13 | 聊斋 | `zhangdaoling`, `niexiaoqian`, `yanchixia`, `huapi` | 同上 · **2026-09-27 已验收（184 tests）** |

W9 已完成：**expand 清尾**；进入 **§3.1 拍板后的 V1 加厚顺序**（**W10 E1** 起）。

### 3.1 用户拍板（2026-09-25 · loop 遵从此序）

| 决策 | 结论 |
|------|------|
| W9 后加厚深度 | **先 E1 遭遇词缀 → E2 阵位共鸣**（见 [gameplay-expansion-catalog §E1/E2](./2026-08-07-gameplay-expansion-catalog.md)） |
| 200 池叙事 | **广收集**；构筑与抽卡「定核」靠传说 expand + 深做卡，不对 200 张均匀圣经 |
| 修炼塔 V1 | **薄壳**：修为/破境入口；塔战斗加深 **不做** |
| 仍后置 | 胚子打造、54 绝品全深做、套装 2/4 大改、Rogue Run(E3)、真支付/云存档 |

**缺口优先级（产品向 · 与 Wave 对齐）：**

| 优先级 | 主题 | Wave / 动作 |
|--------|------|-------------|
| **P0** | expand 清尾 + 测试门禁 | **W2–W9**（当前 W2 江南） |
| **P0** | 手感自证（非战力墙） | **W13 feel** 固定种子进 progress |
| **P1** | 局间变化、布阵价值 | **W10 E1** → **W11 E2**（各 1–2 loop 轮可 MVP） |
| **P2** | 文案/Hub/首会话可读 | **W12** Hub·章节·Result 与 prepHint 一致 |
| **P2** | 名册扫尾 | **W14** bundle / 裸「诀」扫尾 |
| **P3** | 装侧厚度 | 章内力/灵倾向、扩套（**无 Wave**，用户点名再开） |
| **P4** | 商业/叙事/AI | B6–B10、E3 Rogue、官方主线 |

---

## 4. V1 加厚（W10–W14 · W9 之后）

| Wave | 内容 | 判据 |
|------|------|------|
| **W10** | **E1 遭遇词缀** MVP：进战挂 0–1 条 modifier；至少 3 条 id + 八题/猎装各 1 测 | 新测绿；`npm test` 全绿；不改 §4.14 管道顺序 |
| **W11** | **E2 阵位共鸣** MVP：1–2 条站位 team buff；与九宫现有格位对齐 | 布阵相关测或 combat smoke 增例绿 |
| **W12** | Hub/章节：解锁一句「猎装/镜渊/八题」；Result 战败与 prepHint 一致抽查 | 文案 + 现有测不红 |
| **W13** | `npm run feel -- --seeds 15 --encounters wall,oil_cask,archers` 输出进 progress | 记录胜率区间；**仅红灯**才动数值（含条件帽仍待 §11 拍板） |
| **W14** | `characterBundle` / 绝品占位名扫尾（`诀`、重复 gate 文案） | roster 相关测绿 |

（原 W10–W12 抛光项已并入上表并插入 E1/E2。）

---

## 5. 需要人定的决定（loop 默认不动）

见 [tracking §13.1](./tracking.md#需要人定的决定仅此停问)：条件伤害帽 35%、产品名、存档、支付。

---

## 6. 统一 Loop Prompt（Cursor `/loop 10m`）

```text
按 docs/superpowers/specs/moyu-xiuxian-loop-master-plan.md 与 tracking.md §13 指针推进。先读 docs/superpowers/specs/moyu-xiuxian-progress-2026-09-24.md 断点。一轮一个 Wave 子步骤；收尾前 packages/game-core 下 npm test。仅 tracking「需要人定」可问用户。dev-loop §2 开场、§4 收尾；有进展且用户曾要求提交时再 commit。
```

**间隔建议：** `10m` 或 cron `7,22,37,52 * * * *`（避开整点）。

---

## 7. loop 何时停

- W9 完成；**建议**做到 W13 feel；W14 可选  
- 或用户说停  
- 或连续两轮 `npm test` 无新 Wave 可写（progress 已标完）
