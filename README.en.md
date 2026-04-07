# XHS Magic Reply ⚡

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![Chrome Extension](https://img.shields.io/badge/Platform-Chrome%20Extension-brightgreen.svg)](https://developer.chrome.com/docs/extensions/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-orange.svg)](https://developer.chrome.com/docs/extensions/mv3/)

[中文](README.md)

AI-powered reply generator for Xiaohongshu (Little Red Book) — generate witty, sharp, and heartfelt comment replies with one click.

<!-- 
Screenshot placeholder: replace with actual screenshots
![screenshot](docs/screenshot.png)
-->

## ✨ Features

- **⚡ One-Click Reply** — Automatically injects "Magic Reply" buttons next to posts and comments on Xiaohongshu
- **🎨 5 Reply Styles**
  - 😂 Humorous — Witty reversals, analogies, and puns
  - 🗡️ Sharp & Sarcastic — Incisive but not mean-spirited
  - 💗 Warm & Empathetic — Genuine warmth and encouragement
  - 📚 Educational — Fun facts and knowledge sharing
  - ✏️ Custom — Define your own reply style
- **🔌 OpenAI-Compatible** — Works with any OpenAI-compatible API (OpenAI, DeepSeek, Doubao, etc.)
- **⚙️ Flexible Configuration** — Adjustable model, temperature, max tokens, and more
- **📝 Editable Replies** — Edit generated replies before using them
- **🧪 Connection Test** — Built-in API connectivity tester
- **🐛 Debug Panel** — Real-time logging for troubleshooting

## 📦 Installation

### Build from Source

1. **Clone the repository**

```bash
git clone https://github.com/niuyi1017/magic-reply.git
cd magic-reply
```

2. **Install dependencies**

```bash
pnpm install
```

3. **Build the extension**

```bash
pnpm build
```

4. **Load into Chrome**

- Open Chrome and navigate to `chrome://extensions/`
- Enable "Developer mode" (top-right toggle)
- Click "Load unpacked"
- Select the `dist` directory in the project

### Development Mode

```bash
pnpm dev
```

Starts a Vite dev server with hot reload. After loading the `dist` directory, code changes will trigger automatic rebuilds.

## 🚀 Usage

### 1. Configure API Key

- Click the extension icon in the Chrome toolbar
- Go to "Settings"
- Enter your API Base URL and API Key
- Select a model (default: `deepseek-v3-2-251201`)
- Click "Test Connection" to verify
- Save settings

### 2. Generate Replies

- Open any Xiaohongshu post (`xiaohongshu.com`)
- ⚡ buttons will appear at the bottom of posts and next to each comment
- Click a button to open the reply modal
- Adjust style and parameters as needed
- Edit the generated reply if desired
- Click "Use" to paste the reply into the comment box

## ⚙️ Configuration

| Option | Description | Default |
|--------|-------------|---------|
| API Base URL | Base URL of an OpenAI-compatible API | `https://api.openai.com/v1` |
| API Key | Your API secret key | — |
| Model | AI model name | `deepseek-v3-2-251201` |
| Reply Style | 5 presets + custom | Humorous |
| Temperature | Creativity level (0–2, higher = more creative) | `0.9` |
| Max Tokens | Maximum reply length | `200` |

## 🏗️ Project Structure

```
magic-reply/
├── manifest.json          # Chrome Extension config (Manifest V3)
├── package.json           # Dependencies & scripts
├── tsconfig.json          # TypeScript configuration
├── vite.config.ts         # Vite build config (crx plugin)
├── public/icons/          # Extension icons (16/48/128px)
└── src/
    ├── types.ts           # Shared type definitions
    ├── background/        # Service Worker — AI API calls, logging
    │   └── index.ts
    ├── content/           # Content script — DOM injection, UI
    │   ├── index.ts
    │   └── style.css
    ├── popup/             # Popup — status display
    │   ├── index.html
    │   ├── main.ts
    │   └── style.css
    └── options/           # Options page — settings, debug panel
        ├── index.html
        ├── main.ts
        └── style.css
```

## 🛠️ Tech Stack

- **TypeScript** 5.7 — Type-safe development
- **Vite** 6.0 + **@crxjs/vite-plugin** — Fast Chrome extension bundling
- **Chrome Extension Manifest V3** — Latest extension standard
- **Chrome Storage API** — Client-side config persistence (no backend)
- **pnpm** — Package manager

## ❓ FAQ

<details>
<summary><b>Which AI services are supported?</b></summary>

Any service compatible with the OpenAI Chat Completions API, including:
- OpenAI (GPT-4, GPT-3.5)
- DeepSeek
- ByteDance Doubao
- Other third-party compatible services

Just update the API Base URL and API Key in settings.
</details>

<details>
<summary><b>Why don't the buttons appear?</b></summary>

1. Make sure you're on a Xiaohongshu page (`www.xiaohongshu.com`)
2. Confirm the extension is enabled in `chrome://extensions/`
3. Try refreshing the page
4. Check the debug panel for log messages
</details>

<details>
<summary><b>What if API calls fail?</b></summary>

1. Use "Test Connection" in settings to verify your configuration
2. Ensure your API key is valid and has remaining quota
3. Confirm the API Base URL is correct (should end with `/v1`)
4. Check error logs in the debug panel
</details>

<details>
<summary><b>Is my data safe?</b></summary>

- API keys are stored in Chrome's local storage and never uploaded to third-party servers
- Post content is only sent to the AI API you configured when generating replies
- The extension does not collect any user data
</details>

## 📄 License

This project is licensed under the [Apache License 2.0](LICENSE).

## 🤝 Contributing

Contributions are welcome! Please read the [Contributing Guide](CONTRIBUTING.md) to get started.
