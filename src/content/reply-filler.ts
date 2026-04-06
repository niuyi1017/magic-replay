// ============================================================
// 回复填充器 - 将生成的回复填入小红书评论框 / 复制到剪贴板
// ============================================================

const REPLY_INPUT_SELECTORS = [
  '.reply-input textarea',
  '.comment-input textarea',
  '[class*="commentInput"] textarea',
  '[class*="reply"] textarea',
  '[class*="comment"] [contenteditable="true"]',
  '[contenteditable="true"]',
  'textarea',
]

/**
 * 查找当前激活的评论输入框
 */
function findReplyInput(): HTMLTextAreaElement | HTMLElement | null {
  for (const sel of REPLY_INPUT_SELECTORS) {
    const el = document.querySelector(sel) as HTMLElement | null
    if (el && isVisible(el)) return el
  }
  return null
}

function isVisible(el: HTMLElement): boolean {
  return el.offsetParent !== null || el.offsetHeight > 0 || el.offsetWidth > 0
}

/**
 * 模拟原生输入事件（兼容 React / Vue 等框架的事件系统）
 */
function simulateInput(el: HTMLElement, text: string): void {
  el.focus()

  if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
    // 标准 textarea / input
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      'value',
    )?.set || Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value',
    )?.set
    nativeInputValueSetter?.call(el, text)
  } else if (el.hasAttribute('contenteditable')) {
    // contenteditable div
    el.textContent = text
  }

  // 触发完整的输入事件链
  el.dispatchEvent(new Event('focus', { bubbles: true }))
  el.dispatchEvent(new Event('compositionstart', { bubbles: true }))
  el.dispatchEvent(new InputEvent('input', { bubbles: true, data: text, inputType: 'insertText' }))
  el.dispatchEvent(new Event('compositionend', { bubbles: true }))
  el.dispatchEvent(new Event('change', { bubbles: true }))
}

/**
 * 将文本填入评论框
 * @returns 是否成功填入
 */
export function fillReplyInput(text: string): boolean {
  const input = findReplyInput()
  if (!input) return false
  simulateInput(input, text)
  return true
}

/**
 * 复制文本到剪贴板
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Fallback: 使用 textarea 方式复制
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.cssText = 'position:fixed;left:-9999px;top:-9999px;opacity:0'
    document.body.appendChild(textarea)
    textarea.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(textarea)
    return ok
  }
}
