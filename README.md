# 📊 OpenRouter API 模型价格看板

这是一个简洁直观的实时看板，帮助您轻松对比并分析 [OpenRouter](https://openrouter.ai/models) 平台上各大 AI 模型的真实 API 价格。

## ✨ 核心特性

- **📈 散点图可视化：** 横纵轴清晰对比百万 Token (1M) 的输入与输出价格。
- **🔍 动态缩放探查：** 图表提供最高价格滑动条控制，默认过滤极端价格，助您精准看清高性价比区域的密集模型。
- **🎯 厂商实时过滤：** 鼠标悬停图例开启“探照灯”模式，或通过下方菜单直接联动过滤图表，一秒看清指定厂商（如 OpenAI、Anthropic、Google 等）的价格分布。
- **🧾 智能数据表：** 支持模型名与提供商名称双重全局搜索，并优雅处理官方的免费和动态计费（如 `auto` 模型）计费方式。
- **🌐 零配置本地服务：** 基于 Vite 极速启动并在局域网内提供服务。

## 🚀 快速启动

只需两步，即可在本地查看最新模型数据：

1. **安装依赖**
   ```bash
   npm install
   ```

2. **启动本地服务器**
   ```bash
   npm run dev
   ```
   > 运行后访问 `http://localhost:3005`，或者在同一局域网下的手机和平板上使用命令行中提示的 Network 地址（如 `http://192.168.x.x:3005`）进行访问。

## 🛠️ 技术栈

- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS 4](https://tailwindcss.com/)
- [Recharts](https://recharts.org/) (数据可视化)
- [Lucide Icons](https://lucide.dev/) (图标库)

## 📄 数据来源
应用每次启动/刷新时会实时通过客户端拉取 OpenRouter 的 [API V1 端点](https://openrouter.ai/api/v1/models)，确保您获取到的计费信息永远是最新鲜的。