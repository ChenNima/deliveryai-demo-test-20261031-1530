# 静态计数器演示

一个纯静态的计数器演示页面，用于验证加一、重置、键盘操作与移动端适配。

> 本项目为纯静态页面，不依赖后端服务。

## 功能介绍

- 初始计数为 0
- 支持加一和重置操作
- 支持键盘 Tab、Enter、Space 操作
- 提供可访问名称和状态播报
- 适配 360px 移动端视口和桌面端

## 技术栈

- React 18
- TypeScript
- Vite
- Tailwind CSS
- i18next
- Playwright

## 环境要求

- Node.js 18 或更高版本
- npm 9 或更高版本

## 本地开发

安装依赖：

```bash
npm install
```

启动开发服务：

```bash
npm run dev
```

服务默认运行在 `http://localhost:5173`。如果该端口已被占用，Vite 会自动选择其他可用端口。

## 常用命令

```bash
# 启动开发服务
npm run dev

# 执行代码检查
npm run lint

# 构建生产版本
npm run build
```

生产构建产物会生成在 `dist/` 目录。

## 项目结构

```text
.
├── e2e/                    # Playwright 端到端测试
├── server/                 # 旧演示遗留健康检查服务，不参与当前页面
├── src/
│   ├── assets/             # 图片资源
│   ├── components/         # 当前入口为 CounterView.tsx
│   ├── data/               # 旧演示遗留数据，当前计数器不依赖
│   ├── hooks/              # React Hooks
│   ├── state/              # 旧演示遗留状态管理，当前计数器不依赖
│   ├── App.tsx             # 应用入口组件
│   ├── i18n.ts             # 中英文文案
│   └── index.css           # 全局样式
├── index.html
├── tailwind.config.js
└── vite.config.ts
```

## 预览模式

页面入口为根路径，无需额外预览参数。

```text
http://localhost:5173/
```

实际端口以 Vite 启动日志为准。
