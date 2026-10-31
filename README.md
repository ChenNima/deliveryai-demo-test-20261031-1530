# 费用申请演示

一个用于演示整数分费用申请、低额自动通过与高额主管审批的协同页面。

> 本项目为纯前端演示页面，后端契约由协同流程单独提供。

## 功能介绍

- 金额输入采用整数分
- 低额申请自动显示“已通过”
- 高额申请显示“待主管审批”
- 自动生成并展示幂等键
- 修改金额后生成新的幂等键
- 表单和结果具备基础可访问性

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

### 隔离服务地址

- 默认隔离服务地址：`http://127.0.0.1:8787`
- 可通过 `VITE_EXPENSE_API_BASE_URL` 覆盖。
- 在真实隔离服务启动前，页面提交请求会失败，不应视为服务可用。

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
├── e2e/                    # Playwright 端到端测试（当前为 expense-application.spec.ts）
├── server/                 # 旧演示遗留健康检查服务，不参与当前页面
├── src/
│   ├── assets/             # 图片资源
│   ├── components/         # 当前入口为 ExpenseApplicationView.tsx
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
