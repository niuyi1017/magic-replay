# 小红书神回复 - Chrome 浏览器插件

## 概述

Chrome Manifest V3 浏览器插件，在小红书网页版帖子页面注入「⚡神回复」按钮，读取帖子标题/内容/评论上下文，调用用户自配的 OpenAI 兼容 API 生成高质量评论回复，用户确认后自动填入评论框。

## 架构

```
┌─────────────────────┐     ┌──────────────────────────┐     ┌───────────────────────┐
│   Popup (设置页)     │     │  Content Script (注入页面) │     │ Background (SW)       │
│                     │     │                          │     │                       │
│ • API Base URL      │     │ • 读取帖子 DOM            │     │ • 代理 AI API 请求     │
│ • API Key           │     │ • 注入「神回复」按钮       │     │   (避免 CORS)          │
│ • 模型名称           │     │ • 浮窗 UI (生成/确认)     │     │ • 构造 Prompt          │
│ • 回复风格           │     │ • 回复填入评论框          │     │ • 读取 storage 配置    │
│                     │     │                          │     │                       │
│  chrome.storage ←───┼─────┼──── sendMessage ─────────┼────→│ fetch → AI API        │
└─────────────────────┘     └──────────────────────────┘     └───────────────────────┘
```

## 文件结构

```
auto-replay/
├── manifest.json              # Chrome 扩展清单 (Manifest V3)
├── background/
│   └── background.js          # Service Worker - 消息处理 + AI API 调用
├── content/
│   ├── content.js             # 注入脚本 - DOM 读取 + UI 注入 + 回复填入
│   └── content.css            # 注入样式 - 按钮 + 浮窗
├── popup/
│   ├── popup.html             # 设置页 HTML
│   ├── popup.js               # 设置保存/加载逻辑
│   └── popup.css              # 设置页样式
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## 核心流程

### 1. 用户配置 (Popup)

用户点击工具栏图标，在 Popup 中配置：

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| API Base URL | OpenAI 兼容 API 地址 | `https://api.openai.com/v1` |
| API Key | 认证密钥 | 空 |
| 模型名称 | 模型 ID | `gpt-4o-mini` |
| 回复风格 | 预设/自定义 | 幽默搞笑 |

配置持久化到 `chrome.storage.sync`，跨设备同步。

### 2. 页面注入 (Content Script)

Content Script 在 `document_idle` 时注入，IIFE 封装：

```
init()
 ├── isNotePage() 检测是否为笔记页
 ├── injectButtons()
 │   ├── injectCommentButtons()  — 每条评论旁注入「⚡神回复」按钮
 │   └── injectPostButton()     — 评论框旁注入帖子级按钮
 └── MutationObserver           — 监听 DOM 变化，动态评论加载时自动注入
```

**按钮去重**：通过 `data-xhs-magic` 属性标记已注入的按钮，避免重复创建。

**页面检测**：匹配 `.note-container` / `#noteContainer` / `.note-detail-mask` 三种选择器。

### 3. DOM 内容读取

```javascript
getPostContent()
  → #detail-title .note-text   // 帖子标题
  → #detail-desc .note-text    // 帖子正文
  → document.title              // 降级方案

getComments()
  → .parent-comment             // 遍历所有评论
    → :scope > .comment-item    // 顶级评论
    → .comment-item-sub         // 子回复

extractComment(el)
  → .name                       // 用户名
  → .content .note-text         // 评论文字
  → .tag (含"作者")              // 是否为作者
  → .like .count                // 点赞数
```

### 4. 生成流程

```
用户点击「⚡神回复」
    │
    ├─ sendMessage({ type: 'CHECK_CONFIG' })
    │  └─ 未配置 → alert 提示
    │
    ├─ getPostContent() + getComments()
    │
    ├─ showModal() → 显示 loading 浮窗
    │
    └─ sendMessage({ type: 'GENERATE_REPLY', ... })
       │
       │  ┌─── Background Service Worker ───┐
       │  │                                  │
       │  │  getConfig() ← chrome.storage    │
       │  │  构造 system prompt + user prompt│
       │  │  fetch(apiBase/chat/completions) │
       │  │  → 返回 { reply } 或 { error }  │
       │  └──────────────────────────────────┘
       │
       ├─ 成功 → updateModalResult()
       │          ├─ 可编辑 textarea 显示回复
       │          ├─ 「🔄 换一个」→ 重新生成
       │          └─ 「✅ 使用此回复」→ fillReply()
       │
       └─ 失败 → updateModalError()
                  └─ 「🔄 重试」→ 重新生成
```

### 5. Prompt 工程

**System Prompt（固定）**：

```
你是一个小红书神评手，专门写出让人忍不住点赞的高质量评论回复。
要求：
1. 回复简短精炼，通常1-3句话，最多不超过100字
2. 符合小红书的社区氛围和语言风格
3. 可以适当使用emoji，但不要过多（1-3个）
4. 回复要有记忆点，能引起共鸣或让人会心一笑
5. 不要使用"哈哈哈"等低质量的回复
6. 不要过于谄媚或虚伪
7. 直接输出回复内容，不要加引号或其他格式
```

**风格追加**（根据用户选择）：

| 风格 | 追加指令 |
|------|---------|
| 幽默搞笑 | 善于用谐音梗、反转、夸张等手法制造笑点 |
| 毒舌犀利 | 一针见血地指出要害，语言锋利但不恶毒 |
| 暖心共情 | 站在对方角度表达理解和支持 |
| 知识科普 | 用有趣的方式普及相关知识 |
| 自定义 | 使用用户输入的自定义描述 |

**User Prompt 结构**：

```
【帖子内容】
{标题 + 正文}

【评论区精选】（最多10条）
- 用户名（作者）：评论内容
- 用户名：评论内容

【要回复的评论】（如有具体目标）
用户名：评论内容

请针对这条评论生成一条神回复。 / 请针对这篇帖子生成一条神评论。
```

**API 参数**：`max_tokens: 200`, `temperature: 0.9`（鼓励创造性输出）

### 6. 回复填入

```javascript
fillReply(text, targetComment)
  │
  ├─ 有 targetComment → 点击该评论的 .reply 按钮展开回复框
  │   └─ setTimeout(300ms) → insertText()
  │
  └─ 无 targetComment → 直接 insertText()

insertText(text)
  → #content-textarea (contenteditable div)
  → textarea.focus()
  → textarea.textContent = text
  → 触发事件让 Vue 响应式更新：
      • input (bubbles: true)
      • compositionend (bubbles: true)
      • change (bubbles: true)
  → 备用: document.execCommand('selectAll' + 'insertText')
```

**不自动发送**：填入后用户自行点击页面上的「发送」按钮。

## 小红书 DOM 选择器参考

| 元素 | CSS 选择器 | 说明 |
|------|-----------|------|
| 帖子标题 | `#detail-title .note-text` | 帖子标题文本 |
| 帖子正文 | `#detail-desc .note-text` | 帖子描述/正文 |
| 评论容器 | `.comments-container` | 所有评论的父容器 |
| 顶级评论 | `.parent-comment` | 每条顶级评论（含其子回复） |
| 评论项 | `.comment-item` | 单条评论 |
| 子回复 | `.comment-item-sub` | 嵌套回复 |
| 用户名 | `.comment-item .name` | 评论者用户名 |
| 评论内容 | `.content .note-text` | 评论文字 |
| 作者标签 | `.tag`（文本含"作者"） | 标识原帖作者 |
| 点赞数 | `.like .count` | 评论点赞数 |
| 回复按钮 | `.reply.icon-container` | 评论的回复触发按钮 |
| 评论输入框 | `#content-textarea` | contenteditable div |
| 发送按钮 | `.btn.submit` | 提交评论按钮 |
| 交互区 | `.interactions` | 评论下方的交互按钮区域 |
| 笔记容器 | `.note-container` / `#noteContainer` | 笔记详情页容器 |
| 笔记弹窗 | `.note-detail-mask` | 信息流中的笔记弹窗 |
| 输入框区域 | `.engage-bar .input-box` | 底部评论栏 |

## 消息通信协议

### Content → Background

**CHECK_CONFIG**
```json
{ "type": "CHECK_CONFIG" }
→ { "configured": true/false }
```

**GENERATE_REPLY**
```json
{
  "type": "GENERATE_REPLY",
  "postContent": "帖子标题\n帖子正文",
  "comments": [
    { "username": "用户A", "content": "评论内容", "isAuthor": false }
  ],
  "targetComment": {
    "username": "用户B",
    "content": "要回复的评论"
  }
}
→ { "reply": "生成的神回复" }
→ { "error": "错误信息" }
```

## 权限说明

| 权限 | 用途 |
|------|------|
| `storage` | 保存 API 配置和风格偏好 |
| `activeTab` | 访问当前标签页 |
| `host_permissions: xiaohongshu.com` | Content Script 注入 + 页面 DOM 操作 |

## 安全设计

- API Key 仅存储在本地 `chrome.storage.sync`，不上传第三方
- API 请求在 background service worker 中发起，避免 CORS 且不暴露 Key 给页面
- 不自动发送评论，用户必须手动确认和点击发送
- Content Script 使用 IIFE 封装，不污染页面全局作用域
