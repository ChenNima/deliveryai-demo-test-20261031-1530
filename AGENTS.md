# AGENTS.md

> 供 AI 编码 Agent 阅读的仓库事实与约定。通用的测试执行/Review 规范见 [docs/agent-testing.md](docs/agent-testing.md)，GitHub Pages 发布核验见 [docs/agent-release.md](docs/agent-release.md)。
> 修改本文件需同步更新相关代码描述。

## 项目概述

静态计数器演示页面（`static-counter-demo`）。React SPA，页面状态全部在浏览器内存中运行，不依赖后端 API。`server/` 仅为可选的健康检查 Express 应用，不参与当前验收链路。

当前验收对象为单一静态计数器页面，入口为根路径，不使用 hash 路由，也不依赖任何业务状态机。

## 技术栈

React 18 · TypeScript ~5.6 · Vite 6 · Tailwind CSS 3.4 · i18next（中/英）· Playwright（E2E）。计数器状态用 `useState` 内存态管理；ESM；路径别名 `@` → `src/`。

## 目录结构

```
src/
├── main.tsx               # 入口，挂载 React
├── App.tsx                # 根组件：挂载静态计数器页面并同步文档元信息
├── types.ts               # 旧演示遗留类型，当前计数器页面不依赖
├── i18n.ts                # i18next 初始化 + zh/en 资源
├── index.css              # 基础样式、老人模式、过渡、自定义 utilities
├── state/orderReducer.ts  # 旧演示遗留 reducer，当前计数器页面不依赖
├── data/menu.ts           # 旧演示遗留数据，当前计数器页面不依赖
├── hooks/useElderlyMode.ts# 老人模式：localStorage + html.elderly
├── hooks/useViewRoute.ts  # 旧演示遗留 hash 路由 hook，当前计数器页面不依赖
├── lib/utils.ts           # cn（类名合并）、money（¥ 格式化）
├── components/            # 当前入口为 CounterView.tsx；其余为旧演示遗留组件
└── assets/                # hotpot/broth/beef/vegetables 图片
e2e/counter.spec.ts        # 静态计数器 E2E 验收

index.html                 # 入口，含初始化语言的内联脚本
tailwind.config.js         # 自定义色板；vite.config.ts 配 base './' 与 @ 别名
playwright.config.ts       # E2E 配置
```

> 当前仅保留单一 `CounterView.tsx` 作为页面级入口；旧演示组件仅作为遗留代码保留，不参与当前验收。

## 样式约定

颜色类名直接硬编码在 JSX（如 `bg-rice-100`、`text-charcoal-900`、`border-charcoal-900/5`），不用 CSS 变量或语义 token 层，新组件沿用此模式。

`tailwind.config.js` 的自定义色板：

| 色系 | 色阶 | 用途 |
| --- | --- | --- |
| rice | 50 `#fffdf8` / 100 `#fbf5ea` / 200 `#f3e6d0` | 背景、卡片、次级面板 |
| charcoal | 500 `#5f5b55` / 700 `#34312d` / 900 `#211f1c` | 文字、深色背景 |
| chili | 50 `#fff1ef` / 100 `#ffddd8` / 500 `#e13b2b` / 600 `#c92f21` / 700 `#a9231a` | 按钮、强调、徽章 |
| amber | 100 `#fff2c7` / 400 `#f5b83f` / 500 `#e69b18` | 徽章、进度色 |

当前为单一浅色主题，Tailwind 未配置 `darkMode`，组件中没有 `dark:` 变体。全局颜色/字号变化有 250ms 过渡（`src/index.css`），老人模式切换无需额外动画。

## 编码约定

- 当前页面组件为 `src/components/CounterView.tsx`；旧演示的 `Dialog`、`Button` 等组件仅作遗留代码保留，不参与当前验收。
- 样式只用 Tailwind 类名，不用 CSS Modules / styled-components。
- 新增 i18n 文案在 `src/i18n.ts` 的 zh/en 两处同步添加，当前计数器相关文案统一放在 `common.counter_*`。
- 新增 `localStorage` 持久化一律 `try/catch` 包裹，不可用时降级内存态；现有 key：`i18nextLng`、`elderly-mode`（`true`/`false`）。
- 需要在 React 挂载前设置 html 属性/class 时，扩展 `index.html` 的内联脚本。
- npm 源默认走 `https://registry.npmmirror.com`（见根目录与 `server/.npmrc`）。

## 验证命令

| 命令 | 作用 |
| --- | --- |
| `npm ci` / `npm install` | 安装依赖（缺 `node_modules` 时先装） |
| `npm run build` | `tsc -b && vite build`，产物到 `dist/` |
| `npm run lint` | ESLint，零警告通过 |
| `npx tsc -b --noEmit` | 仅类型检查 |
| `npx playwright test` | E2E，webServer 自动拉起 `npm run dev` |

E2E 的执行约束（浏览器来源、报告路径、批量修复、不重跑等）与用例编写/自审规范见 [docs/agent-testing.md](docs/agent-testing.md)。

## 不要做

- 不引入额外的 UI 库或设计系统框架。
- 不使用 CSS Modules 或 styled-components。
- 不修改 `server/`（仅健康检查，无业务逻辑）。
- 不引入后端 API 调用，计数器状态为前端内存态，刷新后回到初始值。
