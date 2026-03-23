# OpenRouter Prices Code Wiki

## 1. 项目简介

`openrouter-prices` 是一个纯前端的模型价格看板项目，用来实时展示 OpenRouter 平台模型的 API 定价与上下文能力。

它的核心目标是：

- 从 OpenRouter 官方接口实时拉取模型列表与价格数据
- 用散点图直观比较输入/输出价格
- 用表格做搜索、筛选、排序和能力补充查看
- 以静态站点形式部署到 GitHub Pages

这是一个没有后端、没有数据库、没有账号系统的单页应用。所有数据都由浏览器直接请求 `https://openrouter.ai/api/v1/models` 获取。

## 2. 技术栈

- React 19
- TypeScript 5
- Vite 8
- Tailwind CSS 4
- Recharts
- rc-slider
- Lucide React
- ESLint 9

## 3. 运行方式

### 安装依赖

```bash
npm install
```

### 本地开发

```bash
npm run dev
```

默认端口在 `vite.config.ts` 中配置为 `3005`，并开启了 `host: true`，所以同局域网设备也可以访问。

### 生产构建

```bash
npm run build
```

构建输出目录是 `dist/`。

### 本地预览构建产物

```bash
npm run preview
```

### 代码检查

```bash
npm run lint
```

注意：当前仓库里 `lint` 不是完全通过状态，`src/components/ModelTable.tsx` 里有现存 ESLint 报错，主要是：

- 内部定义了 `ToggleButton` 组件，触发 `react-hooks/static-components`
- 使用了 `any` 类型，触发 `@typescript-eslint/no-explicit-any`

## 4. 项目目录结构

```text
openrouter-prices/
├── .github/workflows/deploy.yml    # GitHub Pages 自动部署
├── public/                         # 静态资源
├── src/
│   ├── assets/                     # 本地图片资源
│   ├── components/                 # 主要 UI 组件
│   │   ├── ModelTable.tsx          # 模型表格
│   │   └── PriceScatterChart.tsx   # 价格散点图
│   ├── utils/
│   │   └── data.ts                 # OpenRouter 数据拉取与格式化
│   ├── App.tsx                     # 页面主容器与状态汇总
│   ├── index.css                   # 全局样式入口
│   └── main.tsx                    # React 挂载入口
├── dist/                           # 构建产物
├── eslint.config.js                # ESLint 配置
├── index.html                      # HTML 模板
├── package.json                    # 依赖与脚本
├── tsconfig.app.json               # 前端 TS 配置
├── tsconfig.node.json              # Node/Vite TS 配置
├── tsconfig.json                   # TS 项目引用入口
└── vite.config.ts                  # Vite 配置
```

## 5. 核心架构

项目的数据流很简单，基本可以概括成：

1. `src/main.tsx` 挂载 React 应用
2. `src/App.tsx` 在页面初始化时调用 `fetchModels()`
3. `src/utils/data.ts` 请求 OpenRouter 接口并把原始数据转换成前端可直接消费的 `FormattedModel[]`
4. `App.tsx` 统一维护搜索词和厂商筛选状态
5. `PriceScatterChart.tsx` 与 `ModelTable.tsx` 接收同一份过滤后的数据进行展示

换句话说，这个项目是标准的“单页面 + 单次远程拉取 + 本地派生过滤”结构，没有复杂状态管理库。

## 6. 关键文件说明

### `src/main.tsx`

应用入口文件。负责：

- 引入全局样式 `src/index.css`
- 将 `App` 挂载到 `#root`
- 用 `StrictMode` 包裹应用

### `src/App.tsx`

页面的顶层容器，也是主要状态协调层。负责：

- 首次渲染时调用 `fetchModels()` 拉取数据
- 维护 `data`、`loading`、`searchTerm`、`filterProvider` 状态
- 用 `useMemo` 生成厂商列表 `allProviders`
- 用 `useMemo` 生成传给图表和表格的 `filteredData`
- 统计过滤后的模型总数和免费模型数
- 组织页面布局：头部、统计卡片、散点图、数据表

如果以后要增加更多全局筛选条件，优先放在这里统一管理。

### `src/utils/data.ts`

这是项目最重要的数据层文件。主要职责：

- 定义 OpenRouter 原始返回结构 `OpenRouterModel`
- 定义前端统一使用的数据结构 `FormattedModel`
- 在 `fetchModels()` 中请求 `https://openrouter.ai/api/v1/models`
- 把价格从“每 token 单价”换算为“每 1M token 单价”
- 从模型 `id` 中拆出 `provider` 和 `modelName`
- 计算业务字段，例如：
  - `isFree`
  - `isVariable`
  - `cacheReadPrice1M`
  - `hasVision`
  - `hasFunctionCalling`
  - `maxOutputTokens`
- 最后按 `contextLength` 倒序排序

这里有几个很关键的业务约定：

- 价格为负数时视为动态价格模型，前端用 `Dynamic` 展示
- `input_cache_read` 只有大于 0 时才视为真正支持缓存输入价格
- 免费模型定义为输入和输出价格都为 0，且不是动态价格
- 请求失败时不会抛出到 UI，而是打印控制台错误并返回空数组

如果后续 OpenRouter API 字段变动，这个文件是第一优先检查点。

### `src/components/PriceScatterChart.tsx`

负责价格散点图展示。主要行为：

- 只展示非免费、非动态计价、且输入价格大于 0 的模型
- 通过滑块限制最大输入价格，默认上限视图聚焦在更便宜的模型区间
- 横轴是输入价格，纵轴是输出价格
- 气泡大小代表上下文长度 `contextLength`
- 按 provider 分组着色
- 鼠标悬停图例时，会让其他 provider 点位淡出，方便观察单个厂商

实现细节：

- provider 颜色不是写死映射，而是通过字符串 hash 稳定映射到颜色表
- 图例最多渲染前 15 个 provider：`providers.slice(0, 15)`
- 使用 `rc-slider` 控制价格缩放范围

如果以后要引入更多维度，例如模态、能力、延迟，这个组件会是主要扩展点。

### `src/components/ModelTable.tsx`

负责模型明细表格。主要能力：

- 模型名和 provider 名称搜索
- provider 下拉筛选
- 按输入价、输出价、缓存输入价排序
- 支持切换额外列：
  - Vision
  - Max Output
  - Tools
- 对免费模型展示 `Free` 标记
- 对动态价格展示 `Dynamic`

实现上的注意点：

- 排序时会优先把动态价格模型推到底部，避免影响静态价格比较
- `cacheReadPrice1M === null` 的模型会在该列排序时被推到底部
- 目前 `ToggleButton` 是在组件内部定义的，这正是当前 lint 报错来源之一

### `src/index.css`

全局样式入口。目前内容很少，主要是：

- 引入 Tailwind CSS 4
- 给 `body` 设置背景色、文字颜色和抗锯齿

如果以后要做全局主题、排版系统或变量管理，可以从这里开始扩展。

## 7. 每个脚本的作用

来自 `package.json`：

### `npm run dev`

启动 Vite 开发服务器。

适用场景：

- 本地开发
- 联调 UI
- 验证实时接口返回效果

### `npm run build`

先执行 `tsc -b` 做 TypeScript 构建检查，再执行 `vite build` 生成生产包。

适用场景：

- 提交前确认可以正常打包
- GitHub Pages 部署前验证

当前状态：构建可以通过，但 Vite 会提示打包后的 JS chunk 偏大，主包约 579 kB。

### `npm run lint`

执行 `eslint .`，检查 TypeScript/React 代码风格与潜在问题。

适用场景：

- 提交前静态检查
- 重构后防止引入低级问题

当前状态：存在现存错误，见上文说明。

### `npm run preview`

启动 Vite 的生产构建预览服务，用于本地查看 `dist/` 的实际效果。

适用场景：

- 模拟部署后的访问效果
- 检查静态资源路径是否正确

## 8. 部署机制

部署配置在 `/.github/workflows/deploy.yml`。

工作流逻辑：

1. 监听 `master` 分支 push
2. 在 GitHub Actions 中执行 `npm ci`
3. 执行 `npm run build`
4. 上传 `dist/` 为 Pages artifact
5. 发布到 GitHub Pages

与部署强相关的本地配置有两个：

- `vite.config.ts` 中设置了 `base: '/openrouter-prices/'`
- 构建产物依赖该 base 路径才能正确挂载到 GitHub Pages 子路径

如果将来仓库名或部署子路径变化，优先改这里。

## 9. 新开发者最该先理解的业务规则

### 价格展示规则

- 页面统一展示“每 1M token”的价格，不是原始每 token 价格
- 免费模型会被单独标记
- 动态价格模型不会显示具体数值，而显示 `Dynamic`
- 散点图默认不展示免费和动态价格模型

### 数据可信来源

- 前端直接依赖 OpenRouter 官方接口
- 没有本地缓存，也没有服务端兜底
- 因此页面数据实时性高，但也完全受外部接口可用性影响

### 错误处理策略

- 当前失败策略比较轻：请求失败时返回空数组
- UI 不会弹出错误态，而是可能出现空表格/空图
- 如果你要优化用户体验，可以增加错误提示、重试按钮、降级文案

## 10. 当前已知问题与改进方向

### 已知问题

- `npm run lint` 当前不通过
- 构建产物存在大 chunk 警告
- 没有测试体系
- 请求失败时没有明确错误 UI
- `src/assets/hero.png` 当前未见业务使用，可以确认是否为遗留资源

### 推荐优先改进项

1. 修复 `ModelTable.tsx` 的 lint 问题
2. 增加请求错误态和加载失败提示
3. 为数据转换逻辑补单元测试，优先覆盖 `fetchModels()` 的格式化规则
4. 评估图表相关依赖体积，减少打包体积
5. 视需求增加更多筛选维度，例如上下文长度区间、视觉能力、工具调用能力

## 11. 新人上手建议

如果你是第一次接手这个项目，推荐按这个顺序理解：

1. 先看 `package.json`，知道怎么跑项目
2. 再看 `src/App.tsx`，理解状态和页面结构
3. 再看 `src/utils/data.ts`，理解数据字段是怎么被整理出来的
4. 然后分别看 `src/components/PriceScatterChart.tsx` 和 `src/components/ModelTable.tsx`
5. 最后看 `vite.config.ts` 和 `.github/workflows/deploy.yml`，理解部署方式

你真正开始开发时，最常改动的地方通常就是：

- `src/utils/data.ts`：数据字段和业务规则
- `src/App.tsx`：全局筛选和页面编排
- `src/components/ModelTable.tsx`：表格能力扩展
- `src/components/PriceScatterChart.tsx`：图表交互扩展

## 12. 一句话总结

这是一个以 `src/utils/data.ts` 为数据核心、以 `App.tsx` 为状态协调中心、以图表和表格为展示终端的静态前端看板项目；理解这三层关系后，就足够开始继续开发。
