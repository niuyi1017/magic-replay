# 小红书神回复 ⚡

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![Chrome Extension](https://img.shields.io/badge/Platform-Chrome%20Extension-brightgreen.svg)](https://developer.chrome.com/docs/extensions/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-orange.svg)](https://developer.chrome.com/docs/extensions/mv3/)

[English](README.en.md)

AI 驱动的小红书神回复生成器 —— 一键生成有趣、犀利、暖心的评论回复。

<!-- 
截图占位：替换为实际截图
![screenshot](docs/screenshot.png)
-->

## ✨ 功能特性

- **⚡ 一键生成回复** — 在小红书帖子和评论旁自动注入「神回复」按钮，点击即可生成高质量评论
- **🎨 5 种回复风格**
  - 😂 幽默搞笑 — 反转、类比、谐音梗，制造自然笑点
  - 🗡️ 毒舌犀利 — 一针见血，犀利但不恶毒
  - 💗 暖心共情 — 温暖真实，给人力量
  - 📚 知识科普 — 冷知识分享，评论区变课堂
  - ✏️ 自定义风格 — 按你的想法定义回复风格
- **🔌 兼容 OpenAI API** — 支持任何 OpenAI 兼容的 API 服务（OpenAI、DeepSeek、豆包等）
- **⚙️ 灵活配置** — 可调节模型、Temperature、最大 Token 数等参数
- **📝 可编辑回复** — 生成的回复可直接编辑后使用
- **🧪 连接测试** — 内置 API 连接测试功能
- **🐛 调试面板** — 实时日志查看，方便排查问题

## 📦 安装

### 从源码构建

1. **克隆仓库**

```bash
git clone https://github.com/niuyi1017/magic-reply.git
cd magic-reply
```

2. **安装依赖**

```bash
pnpm install
```

3. **构建扩展**

```bash
pnpm build
```

4. **加载到 Chrome**

- 打开 Chrome，访问 `chrome://extensions/`
- 开启右上角「开发者模式」
- 点击「加载已解压的扩展程序」
- 选择项目中的 `dist` 目录

### 开发模式

```bash
pnpm dev
```

启动 Vite 开发服务器，支持热更新。加载 `dist` 目录后修改代码会自动重新构建。

## 🚀 使用方法

### 1. 配置 API Key

- 点击浏览器工具栏中的扩展图标
- 进入「设置」页面
- 填写 API Base URL 和 API Key
- 选择模型（默认 `deepseek-v3-2-251201`）
- 点击「测试连接」确认配置正确
- 保存设置

### 2. 生成回复

- 打开任意小红书帖子（`xiaohongshu.com`）
- 在帖子底部或每条评论旁会出现 ⚡ 按钮
- 点击按钮，弹窗中可调整风格和参数
- 生成的回复可直接编辑
- 点击「使用」将回复填入评论框

## ⚙️ 配置说明

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| API Base URL | OpenAI 兼容 API 的基础地址 | `https://api.openai.com/v1` |
| API Key | 你的 API 密钥 | — |
| 模型 | AI 模型名称 | `deepseek-v3-2-251201` |
| 回复风格 | 5 种预设 + 自定义 | 幽默搞笑 |
| Temperature | 回复创造性（0-2，越高越有创意） | `0.9` |
| Max Tokens | 回复最大长度 | `200` |

## 🏗️ 项目结构

```
magic-reply/
├── manifest.json          # Chrome 扩展配置 (Manifest V3)
├── package.json           # 项目依赖与脚本
├── tsconfig.json          # TypeScript 配置
├── vite.config.ts         # Vite 构建配置 (crx 插件)
├── public/icons/          # 扩展图标 (16/48/128px)
└── src/
    ├── types.ts           # 共享类型定义
    ├── background/        # Service Worker — AI API 调用、日志
    │   └── index.ts
    ├── content/           # 内容脚本 — DOM 注入、UI 交互
    │   ├── index.ts
    │   └── style.css
    ├── popup/             # 弹出窗口 — 状态展示
    │   ├── index.html
    │   ├── main.ts
    │   └── style.css
    └── options/           # 设置页面 — 配置管理、调试面板
        ├── index.html
        ├── main.ts
        └── style.css
```

## 🛠️ 技术栈

- **TypeScript** 5.7 — 类型安全开发
- **Vite** 6.0 + **@crxjs/vite-plugin** — 快速构建 Chrome 扩展
- **Chrome Extension Manifest V3** — 最新扩展标准
- **Chrome Storage API** — 配置持久化（无需后端）
- **pnpm** — 包管理器

## ❓ 常见问题

<details>
<summary><b>支持哪些 AI 服务？</b></summary>

支持任何兼容 OpenAI Chat Completions API 的服务，包括但不限于：
- OpenAI（GPT-4、GPT-3.5）
- DeepSeek
- 字节豆包（Doubao）
- 其他兼容 API 的第三方服务

只需修改 API Base URL 和 API Key 即可。
</details>

<details>
<summary><b>为什么按钮没有出现？</b></summary>

1. 确认你在小红书页面上（`www.xiaohongshu.com`）
2. 确认扩展已启用（检查 `chrome://extensions/`）
3. 尝试刷新页面
4. 查看调试面板的日志信息
</details>

<details>
<summary><b>API 调用失败怎么办？</b></summary>

1. 在设置页面点击「测试连接」检查配置
2. 确认 API Key 有效且有余额
3. 确认 API Base URL 格式正确（需以 `/v1` 结尾）
4. 查看调试面板中的错误日志
</details>

<details>
<summary><b>数据安全吗？</b></summary>

- API Key 存储在 Chrome 本地存储中，不会上传到任何第三方服务器
- 帖子内容仅在生成回复时发送到你配置的 AI API
- 扩展不收集任何用户数据
</details>

## 📄 许可证

本项目基于 [Apache License 2.0](LICENSE) 开源。

## 🤝 贡献

欢迎贡献！请阅读 [贡献指南](CONTRIBUTING.md) 了解如何参与项目开发。
