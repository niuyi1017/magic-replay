// ============================================================
// DOM Observer - 监听小红书 SPA 路由变化与评论区加载
// ============================================================

type Callback = () => void

let observer: MutationObserver | null = null
let debounceTimer: ReturnType<typeof setTimeout> | null = null
let lastUrl = ''

/**
 * 启动 DOM 观察者
 * @param onCommentsChange 评论区有变化时的回调
 * @param onRouteChange 路由变化时的回调
 */
export function startObserver(onCommentsChange: Callback, onRouteChange: Callback): void {
  if (observer) return // 避免重复启动

  lastUrl = window.location.href

  observer = new MutationObserver(() => {
    // 检测 SPA 路由变化
    const currentUrl = window.location.href
    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl
      onRouteChange()
      return
    }

    // Debounce 评论区变化回调
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(onCommentsChange, 300)
  })

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  })
}

/**
 * 停止 DOM 观察者
 */
export function stopObserver(): void {
  if (observer) {
    observer.disconnect()
    observer = null
  }
  if (debounceTimer) {
    clearTimeout(debounceTimer)
    debounceTimer = null
  }
}
