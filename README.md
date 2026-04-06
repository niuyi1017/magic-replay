# 小红书神回复 ✨

基于 AI 为小红书笔记评论生成「神回复」的 Chrome 浏览器插件。

自动提取笔记内容与评论，结合用户自定义风格偏好，通过 OpenAI 兼容 API 一键生成机智、有趣、引人共鸣的回复。

## 功能特性

- 💬 **一键神回复** — 评论旁注入按钮，点击即生成 AI 回复
- 🎨 **5 种内置风格** — 幽默搞笑 😂 / 专业知识 🎓 / 温暖共情 🤗 / 毒舌犀利 🔥 / 文艺诗意 🌸
- ✏️ **自定义风格** — 完整 CRUD 管理，每种风格 = System Prompt + Temperature + MaxTokens
- 🤖 **多模型切换** — 支持 OpenAI 兼容格式的任意大模型（GPT / 通义 / DeepSeek / Moonshot 等）
- 📝 **自动填入** — 生成后一键填入评论框，或复制到剪贴板
- 🖱️ **右键菜单** — 选中文本后右键「用神回复回复这条评论」
- 🔒 **隐私安全** — API Key 仅存于本地 `chrome.storage`，不经任何第三方服务器

## 截图预览

<!-- TODO: 添加实际截图 -->

| 评论旁按钮 | 回复面板 | Popup 弹窗 | 设置页 |
|:---:|:---:|:---:|:---:|
| 💬 | ✨ | 🚀 | ⚙️ |

## 安装

### 从源码构建

```bash
# 克隆项目
git clone https://github.com/niuyi1017/auto-replay.git
cd auto-replay

# 安装依赖
pnpm install

# 构建
pnpm build
```

### 加载到 Chrome

1. 打开 `chrome://extensions/`
2. 开启右上角「开发者模式」
3. 点击「加载已解压的扩展程序」
4. 选择项目的 `dist/` 目录

## 使用方法

### 1. 配置 API

首次使用前需配置 AI 模型：

1. 点击插件图标 → 底部「⚙️ 设置」
2. 在「API 配置」中填入：
   - **API 地址**：如 `https://api.openai.com/v1` 或国产模型的兼容地址
   - **API Key**：你的密钥
   - **模型名称**：如 `gpt-4o-mini`、`deepseek-chat` 等
3. 点击「🔗 测试连接」验证配置
4. 保存

### 2. 生成回复

**方式一：评论旁按钮（推荐）**

打开任意小红书笔记详情页，每条评论旁会出现「💬 神回复」按钮：

1. 点击按钮 → 弹出回复面板
2. 选择风格（幽默/专业/温暖/毒舌/文艺）
3. 点击「🚀 生成回复」
4. 点击「📝 填入评论框」或「📋 复制」

**方式二：Popup 弹窗**

1. 在小红书笔记页点击插件图标
2. 选择模型和风格
3. 点击「🚀 为最新评论生成神回复」

**方式三：右键菜单**

1. 选中评论文本
2. 右键 →「💬 用神回复回复这条评论」

### 3. 自定义风格

在设置页「🎨 风格管理」中：

- 修改内置风格的 System Prompt / Temperature
- 添加自定义风格，完全控制 AI 的回复方式
- 调整全局附加 System Prompt（所有风格共享）

## 技术栈

- **Chrome Extension** Manifest V3
- **Vue 3** + TypeScript
- **Vite** + [@crxjs/vite-plugin](https://crxjs.dev/)
- **Shadow DOM** 隔离注入样式
- **OpenAI 兼容 API** 格式（覆盖主流大模型）

## 项目结构

```
src/
├── manifest.json               # Chrome MV3 manifest
├── background/
│   └── service-worker.ts       # AI API 调用 / 右键菜单 / 消息路由
├── content/
│   ├── index.ts                # 入口：初始化 Observer → Injector
│   ├── extractor.ts            # 小红书 DOM 内容提取
│   ├── observer.ts             # MutationObserver 监听评论区变化
│   ├── injector.ts             # Shadow DOM 注入按钮和回复面板
│   └── reply-filler.ts         # 评论框模拟输入 / 剪贴板复制
├── components/
│   └── ReplyPanel.vue          # 注入页面的回复面板
├── popup/
│   └── App.vue                 # 弹窗 UI
├── options/
│   └── App.vue                 # 设置页 UI
├── utils/
│   ├── storage.ts              # chrome.storage 封装 + 默认预设
│   ├── messaging.ts            # 类型安全消息通信
│   └── prompt-builder.ts       # Prompt 组装
├── types/
│   └── index.ts                # 共享类型定义
└── assets/
    ├── content.css             # 注入按钮样式
    └── icons/                  # 插件图标
```

## 开发

```bash
# 开发模式（HMR 热更新）
pnpm dev

# 生产构建
pnpm build
```

开发模式下 CRXJS 提供 HMR 支持，修改代码后插件自动更新（content script 除外，需刷新页面）。

## 兼容性说明

- **浏览器**：Chrome 88+（Manifest V3 最低要求）
- **AI API**：任何兼容 OpenAI `/v1/chat/completions` 接口格式的服务
- **小红书 DOM**：提取器 (`extractor.ts`) 使用多组 fallback 选择器，小红书前端更新后可能需要更新选择器

## License

ISC
