// ============================================================
// Content Script 入口 — 小红书神回复
// ============================================================

import { MessageType } from '@/types'
import type { ExtensionMessage } from '@/types'
import { isNoteDetailPage, extractPageContext } from './extractor'
import { startObserver, stopObserver } from './observer'
import { injectReplyButtons, cleanup } from './injector'
import { fillReplyInput, copyToClipboard } from './reply-filler'

let initialized = false

/**
 * 初始化内容脚本
 */
function init(): void {
  if (!isNoteDetailPage()) return
  if (initialized) return
  initialized = true

  // 注入按钮到已有的评论
  setTimeout(() => {
    injectReplyButtons()
  }, 1000) // 等待评论区渲染完成

  // 监听 DOM 变化（新评论加载、路由切换）
  startObserver(
    // 评论区变化 → 注入新按钮
    () => {
      if (isNoteDetailPage()) {
        injectReplyButtons()
      }
    },
    // 路由变化 → 重新初始化
    () => {
      cleanup()
      initialized = false
      setTimeout(init, 500)
    },
  )
}

/**
 * 监听来自 background / popup 的消息
 */
chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
  switch (message.type) {
    case MessageType.EXTRACT_CONTEXT:
      sendResponse(extractPageContext())
      break

    case MessageType.FILL_REPLY:
      sendResponse(fillReplyInput(message.payload.text))
      break

    case MessageType.COPY_REPLY:
      copyToClipboard(message.payload.text).then(sendResponse)
      return true // 异步

    case MessageType.CONTEXT_MENU_TRIGGER: {
      // 右键菜单触发：用选中的文本作为目标评论
      const text = message.payload.selectionText
      if (text) {
        const sel = window.getSelection()
        if (sel && sel.rangeCount > 0) {
          const range = sel.getRangeAt(0)
          const rect = range.getBoundingClientRect()
          showFloatingPanel(text, rect)
        }
      }
      break
    }
  }
})

/**
 * 右键菜单触发时显示浮动回复面板
 */
async function showFloatingPanel(selectedText: string, rect: DOMRect): Promise<void> {
  // 关闭已有面板
  document.querySelectorAll('.xhs-reply-panel-host').forEach((el) => el.remove())

  const { createApp, h } = await import('vue')
  const ReplyPanel = (await import('@/components/ReplyPanel.vue')).default

  const context = extractPageContext()

  const host = document.createElement('div')
  host.className = 'xhs-reply-panel-host'
  host.style.cssText = `position:fixed;left:${rect.left}px;top:${rect.bottom + 8}px;z-index:99999;`

  const shadow = host.attachShadow({ mode: 'open' })

  const style = document.createElement('style')
  // 复用注入面板的样式
  style.textContent = getMinimalPanelStyles()
  shadow.appendChild(style)

  const container = document.createElement('div')
  shadow.appendChild(container)

  const app = createApp({
    render() {
      return h(ReplyPanel, {
        comment: { username: '选中文本', content: selectedText },
        context,
        onClose: () => {
          app.unmount()
          host.remove()
        },
      })
    },
  })

  app.mount(container)
  document.body.appendChild(host)
}

function getMinimalPanelStyles(): string {
  return `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .reply-panel { background:#fff;border:1px solid #e8e8e8;border-radius:12px;padding:16px;
      box-shadow:0 4px 20px rgba(0,0,0,0.15);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
      font-size:14px;color:#333;max-width:480px;min-width:320px; }
    .panel-header { display:flex;justify-content:space-between;align-items:center;margin-bottom:12px; }
    .panel-title { font-size:15px;font-weight:600; }
    .close-btn { background:none;border:none;cursor:pointer;font-size:18px;color:#999;padding:4px; }
    .close-btn:hover { color:#333; }
    .style-tabs { display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px; }
    .style-tab { padding:4px 12px;border:1px solid #e0e0e0;border-radius:20px;background:#fafafa;cursor:pointer;
      font-size:13px;transition:all 0.2s;white-space:nowrap; }
    .style-tab:hover { border-color:#ff4757;color:#ff4757; }
    .style-tab.active { background:#ff4757;color:#fff;border-color:#ff4757; }
    .generate-btn { width:100%;padding:10px;background:linear-gradient(135deg,#ff4757,#ff6b81);color:#fff;border:none;
      border-radius:8px;font-size:14px;cursor:pointer; }
    .generate-btn:hover { opacity:0.9; }
    .generate-btn:disabled { opacity:0.5;cursor:not-allowed; }
    .result-area { margin-top:12px;padding:12px;background:#f8f9fa;border-radius:8px;line-height:1.6;white-space:pre-wrap;word-break:break-word; }
    .action-btns { display:flex;gap:8px;margin-top:10px; }
    .action-btn { flex:1;padding:8px;border:1px solid #e0e0e0;border-radius:6px;background:#fff;cursor:pointer;
      font-size:13px;text-align:center; }
    .action-btn:hover { border-color:#ff4757;color:#ff4757; }
    .action-btn.primary { background:#ff4757;color:#fff;border-color:#ff4757; }
    .loading { text-align:center;padding:20px;color:#999; }
    .error { color:#ff4757;padding:8px;font-size:13px; }
    .target-comment { font-size:13px;color:#666;margin-bottom:12px;padding:8px;background:#f5f5f5;
      border-radius:6px;border-left:3px solid #ff4757; }
    .target-comment .username { font-weight:600;color:#333; }
  `
}

// ============================================================
// 启动
// ============================================================

// 立即尝试初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}

// 即使不是笔记详情页，也持续监听路由变化（SPA 可能导航到详情页）
startObserver(
  () => {
    if (!initialized && isNoteDetailPage()) {
      init()
    }
  },
  () => {
    cleanup()
    initialized = false
    setTimeout(init, 500)
  },
)
