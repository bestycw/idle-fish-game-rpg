# 摸鱼修仙（暂定名）

面向上班摸鱼的 Web 文字养成 RPG。  
九宫布阵 × 刷装构筑；战斗 / 副本 / 抽卡 / 体力已有薄实现；下一刀见 tracking。

## 文档（开发以规格为准）

| 角色 | 路径 |
|------|------|
| **规格入口（文档地图）** | [`docs/superpowers/specs/README.md`](docs/superpowers/specs/README.md) |
| **系统骨架** | [`docs/superpowers/specs/systems-overview.md`](docs/superpowers/specs/systems-overview.md) |
| **战斗 / 人物等分册** | [`docs/superpowers/specs/systems/`](docs/superpowers/specs/systems/) |
| **跟踪 / 下一刀** | [`docs/superpowers/specs/tracking.md`](docs/superpowers/specs/tracking.md) |
| **里程碑索引** | [`docs/superpowers/plans/2026-07-19-vertical-slice.md`](docs/superpowers/plans/2026-07-19-vertical-slice.md) |
| 历史实现 plan（A* 已完成） | [`docs/superpowers/plans/2026-07-19-attrs-and-qi.md`](docs/superpowers/plans/2026-07-19-attrs-and-qi.md) |

方案一经确认必须**落盘对应系统分册**；plan / 实现跟规格走。

## 技术结构

```
packages/
  game-core/   # 纯 TS 引擎（无 DOM），便于日后迁小游戏 / Steam / iOS 壳
  web/         # Vite + React UI
```

## 开发

```bash
pnpm install
pnpm dev
```

浏览器打开终端提示的本地地址（默认 `http://localhost:5173`）。

```bash
pnpm test      # game-core 单测
pnpm build     # 构建
```

## 架构注意

- 引擎与故事皮 / 卡面皮分离；战斗认 `role` + `jobId` + 技能效果。  
- 生命周期与扩展钩子见 `systems/combat.md` §4.15–4.16。  
