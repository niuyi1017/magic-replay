import { createApp, h } from 'vue'
import type { CommentInfo, PageContext } from '@/types'
import ReplyPanel from '@/components/ReplyPanel.vue'
import { extractComments, extractPageContext } from './extractor'

// 已注入按钮的评论元素集合
const injectedSet = new WeakSet<HTMLElement>()

// 所有已挂载的 Vue 实例（用于清理）
const mountedApps: Array<{ unmount: () => void }> = []

/**
 * 在评论旁注入"神回复"按钮
 */
export function injectReplyButtons(): void {
  const comments = extractComments()
  comments.forEach((comment) => {
    if (!comment.element || injectedSet.has(comment.element)) return
    injectedSet.add(comment.element)

    const btn = document.createElement('button')
    btn.className = 'xhs-auto-reply-btn'
    btn.textContent = '💬 神回复'
    btn.title = '生成 AI 神回复'

    btn.addEventListener('click', (e) => {
      e.stopPropagation()
      e.preventDefault()
      showReplyPanel(comment, btn)
    })

    // 插入按钮到评论元素中
    comment.element.style.position = 'relative'
    comment.element.appendChild(btn)
  })
}

/**
 * 显示回复面板（Shadow DOM 隔离）
 */
function showReplyPanel(comment: CommentInfo, anchorBtn: HTMLElement): void {
  // 如果已经有面板打开，先关闭
  const existing = anchorBtn.parentElement?.querySelector('.xhs-reply-panel-host')
  if (existing) {
    existing.remove()
    return
  }

  // 关闭其他面板
  document.querySelectorAll('.xhs-reply-panel-host').forEach((el) => el.remove())

  const context = extractPageContext()

  // 创建 Shadow DOM 宿主
  const host = document.createElement('div')
  host.className = 'xhs-reply-panel-host'

  const shadow = host.attachShadow({ mode: 'open' })

  // 注入样式
  const style = document.createElement('style')
  style.textContent = getPanelStyles()
  shadow.appendChild(style)

  // Vue 挂载容器
  const container = document.createElement('div')
  shadow.appendChild(container)

  const app = createApp({
    render() {
      return h(ReplyPanel, {
        comment: { username: comment.username, content: comment.content },
        context,
        onClose: () => {
          app.unmount()
          host.remove()
        },
      })
    },
  })

  app.mount(container)
  mountedApps.push(app)

  // 插入到评论元素后面
  anchorBtn.parentElement?.appendChild(host)
}

/**
 * 清理所有注入的元素
 */
export function cleanup(): void {
  mountedApps.forEach((app) => {
    try { app.unmount() } catch { /* ignore */ }
  })
  mountedApps.length = 0
  document.querySelectorAll('.xhs-auto-reply-btn, .xhs-reply-panel-host').forEach((el) => el.remove())
}

/**
 * 面板内联样式（Shadow DOM 隔离）
 */
function getPanelStyles(): string {
  return `
    * { box-sizing: border-box; margin: 0; padding: 0; }

    .reply-panel {
      background: #fff;
      border: 1px solid #e8e8e8;
      border-radius: 12px;
      padding: 16px;
      margin-top: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 14px;
      color: #333;
      position: relative;
      z-index: 9999;
      max-width: 480px;
    }

    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .panel-title {
      font-size: 15px;
      font-weight: 600;
      color: #333;
    }

    .close-btn {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 18px;
      color: #999;
      padding: 4px;
      line-height: 1;
    }
    .close-btn:hover { color: #333; }

    .style-tabs {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
      margin-bottom: 12px;
    }

    .style-tab {
      padding: 4px 12px;
      border: 1px solid #e0e0e0;
      border-radius: 20px;
      background: #fafafa;
      cursor: pointer;
      font-size: 13px;
      transition: all 0.2s;
      white-space: nowrap;
    }
    .style-tab:hover { border-color: #ff4757; color: #ff4757; }
    .style-tab.active {
      background: #ff4757;
      color: #fff;
      border-color: #ff4757;
    }

    .generate-btn {
      width: 100%;
      padding: 10px;
      background: linear-gradient(135deg, #ff4757, #ff6b81);
      color: #fff;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: opacity 0.2s;
    }
    .generate-btn:hover { opacity: 0.9; }
    .generate-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .result-area {
      margin-top: 12px;
      padding: 12px;
      background: #f8f9fa;
      border-radius: 8px;
      line-height: 1.6;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .action-btns {
      display: flex;
      gap: 8px;
      margin-top: 10px;
    }

    .action-btn {
      flex: 1;
      padding: 8px;
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      background: #fff;
      cursor: pointer;
      font-size: 13px;
      transition: all 0.2s;
      text-align: center;
    }
    .action-btn:hover { border-color: #ff4757; color: #ff4757; }
    .action-btn.primary {
      background: #ff4757;
      color: #fff;
      border-color: #ff4757;
    }
    .action-btn.primary:hover { opacity: 0.9; }

    .loading {
      text-align: center;
      padding: 20px;
      color: #999;
    }

    .error {
      color: #ff4757;
      padding: 8px;
      font-size: 13px;
    }

    .target-comment {
      font-size: 13px;
      color: #666;
      margin-bottom: 12px;
      padding: 8px;
      background: #f5f5f5;
      border-radius: 6px;
      border-left: 3px solid #ff4757;
    }
    .target-comment .username { font-weight: 600; color: #333; }
  `
}
