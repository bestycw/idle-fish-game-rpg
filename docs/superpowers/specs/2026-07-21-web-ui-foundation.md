# Web UI 地基（Tailwind + shadcn · 2026-07-21）

> **地位：** 已拍板并**迁移完成**。范围仅 `packages/web`；`game-core` 不碰 UI。

## 0. 产品 UI 原则（2026-07-27 拍板 · 2026-07-29 信息架构）

> **内容是文字游戏；元素布局按主流 RPG 手游。**

| 层 | 做法 |
|----|------|
| **内容** | 章节过场、战报、掉落说明 → 文字；可加简易图示（九宫色块、入口 mark） |
| **格局** | 顶栏资源、底栏 Tab（冒险/召唤/**伙伴**/背包）、首页 banner+入口卡；宽屏双栏 / 窄屏叠栏 |
| **信息不串页** | 冒险=战斗/刷本；伙伴=全池+养成+布阵；背包=装备+商会；邮件/设置=顶栏 |
| **不做** | 整页小说竖列点选项当唯一交互；后台菜单式文案 |

## 1. 目标

1. **Tailwind CSS v4** 做样式主引擎  
2. **shadcn/ui**（源码拷贝进仓库）做通用 primitive  
3. 全站页面已迁完；旧 `styles.css` **已删除**

## 2. 技术选型（冻结）

| 项 | 选择 | 理由 |
|----|------|------|
| 样式 | Tailwind v4 + `@tailwindcss/vite` | 与 Vite 7 / React 19 对齐 |
| 组件 | shadcn/ui（Radix 底座） | 可改源码、按需添加 |
| 不引入 | antd / MUI | 后台感重、覆盖成本高 |
| 路径别名 | `@/*` → `packages/web/src/*` | shadcn 惯例；保留 `@moyu/game-core` |
| 主题 | CSS 变量；墨底 + 琥珀强调（`index.css`） | 手游壳夜间皮肤 |

## 3. 目录约定

```
packages/web/src/
  components/ui/     # shadcn 生成
  components/game/   # GameShell / Narrative / ChoiceList / StatusBar
  lib/utils.ts       # cn()
  index.css          # Tailwind + 主题变量（唯一全局样式入口）
  features/          # 页面功能
```

## 4. 迁移状态

| 阶段 | 状态 |
|------|------|
| P0 地基 | ✅ |
| P1 App 壳 | ✅ |
| P2 人物纸娃娃 | ✅ |
| P3 Hub / Battle / Result / Inventory | ✅ |
| P4 文字冒险壳重做（2026-07-26） | ✅ 叙事+选项主交互；战报优先 |
| P5 自适应格局（2026-07-27） | ✅ 宽屏偏 C 双栏；窄屏偏 A 舞台+底栏 Tab；九宫轻图示 |
| P6 手游格局深化 | ✅ 冒险只留战斗向；底栏**伙伴**全池；图鉴→伙伴；商会→背包；邮件/设置→顶栏；布阵独立页 |

规则：新代码默认 Tailwind；组件用 `pnpm dlx shadcn@latest add <name>` 增加。

## 5. 验收（已通过）

1. 存在 `components.json`、`src/components/ui/*`、`src/lib/utils.ts`  
2. `main.tsx` 仅导入 `index.css`  
3. typecheck / build 通过  
4. 顶栏等处使用 shadcn `Button`

## 6. 非目标

- 换路由/状态库；monorepo 级共享 UI 包（以后再拆）
