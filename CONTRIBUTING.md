# 贡献指南

感谢你对「小红书神回复」项目的关注！欢迎通过以下方式参与贡献。

## 开发环境

### 前置要求

- [Node.js](https://nodejs.org/) >= 18
- [pnpm](https://pnpm.io/) >= 8
- Chrome 浏览器

### 本地开发

```bash
# 克隆仓库
git clone https://github.com/niuyi1017/auto-replay.git
cd auto-replay

# 安装依赖
pnpm install

# 启动开发模式
pnpm dev
```

### 加载扩展到 Chrome

1. 打开 `chrome://extensions/`
2. 开启「开发者模式」
3. 点击「加载已解压的扩展程序」
4. 选择项目中的 `dist` 目录

开发模式下修改代码后，扩展会自动重新构建。你可能需要在 `chrome://extensions/` 页面点击刷新按钮来加载最新代码。

### 构建

```bash
pnpm build
```

## 代码规范

- 使用 **TypeScript**，启用 strict 模式
- 缩进使用 **2 个空格**
- 文件使用 **UTF-8** 编码
- 换行符使用 **LF**
- 使用有意义的变量和函数命名

## 提交 Issue

### Bug 报告

请使用 [Bug 报告模板](https://github.com/niuyi1017/auto-replay/issues/new?template=bug_report.md) 并提供：

- 浏览器版本
- 扩展版本
- 复现步骤
- 期望行为 vs 实际行为
- 截图（如有）

### 功能建议

请使用 [功能请求模板](https://github.com/niuyi1017/auto-replay/issues/new?template=feature_request.md) 描述你的想法。

## 提交 Pull Request

1. **Fork** 本仓库
2. 创建功能分支：`git checkout -b feature/your-feature`
3. 提交更改：`git commit -m 'feat: add some feature'`
4. 推送分支：`git push origin feature/your-feature`
5. 创建 **Pull Request**

### Commit 格式

推荐使用 [Conventional Commits](https://www.conventionalcommits.org/) 格式：

```
feat: 添加新功能
fix: 修复 bug
docs: 更新文档
style: 代码格式调整（不影响功能）
refactor: 代码重构
chore: 构建/工具相关
```

### PR Checklist

- [ ] 代码经过本地测试
- [ ] `pnpm build` 构建通过
- [ ] 功能在 Chrome 中加载并运行正常
- [ ] 如有新功能，已更新相关文档

## 项目结构

```
src/
├── types.ts           # 共享类型定义（消息协议、配置接口）
├── background/        # Service Worker（AI API 调用、日志记录）
├── content/           # 内容脚本（DOM 注入、UI 交互）
├── popup/             # 弹出窗口（状态展示）
└── options/           # 设置页面（配置管理、调试面板）
```

## 许可证

提交贡献即表示你同意你的代码以 [Apache License 2.0](LICENSE) 许可分发。
