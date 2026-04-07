import type {
  CommentData,
  CommentPayload,
  GenerateReplyResponse,
  CheckConfigResponse,
  ExtensionMessage,
  ExtensionConfig,
  GenerateReplyOverrides,
} from '@/types'

const BUTTON_FLAG = 'data-xhs-magic'

// ========== DOM 读取 ==========

function getPostContent(): string {
  const titleEl =
    document.querySelector('#detail-title .note-text') ||
    document.querySelector('.note-top .title')
  const descEl = document.querySelector('#detail-desc .note-text')

  const title = titleEl?.textContent?.trim() ?? ''
  const desc = descEl?.textContent?.trim() ?? ''

  return title ? `${title}\n${desc}` : desc || document.title
}

function getComments(): CommentData[] {
  const comments: CommentData[] = []
  document.querySelectorAll('.parent-comment').forEach((parentEl) => {
    const topComment = extractComment(
      parentEl.querySelector(':scope > .comment-item'),
    )
    if (topComment) comments.push(topComment)

    parentEl.querySelectorAll('.comment-item-sub').forEach((subEl) => {
      const sub = extractComment(subEl)
      if (sub) comments.push(sub)
    })
  })
  return comments
}

function extractComment(el: Element | null): CommentData | null {
  if (!el) return null
  const nameEl = el.querySelector('.name')
  const contentEl = el.querySelector('.content .note-text')
  const tagEl = el.querySelector('.tag')
  const likeEl = el.querySelector('.like .count')

  return {
    username: nameEl?.textContent?.trim() ?? '匿名',
    content: contentEl?.textContent?.trim() ?? '',
    isAuthor: tagEl?.textContent?.includes('作者') ?? false,
    likes: likeEl?.textContent?.trim() ?? '0',
    element: el,
  }
}

// ========== UI 注入 ==========

function createMagicButton(
  text: string,
  onClick: (btn: HTMLButtonElement) => void,
): HTMLButtonElement {
  const btn = document.createElement('button')
  btn.className = 'xhs-magic-reply-btn'
  btn.setAttribute(BUTTON_FLAG, '1')
  btn.innerHTML = `<span class="btn-icon">⚡</span>${text}`
  btn.addEventListener('click', (e) => {
    e.preventDefault()
    e.stopPropagation()
    onClick(btn)
  })
  return btn
}

function injectCommentButtons(): void {
  document.querySelectorAll('.parent-comment').forEach((parentEl) => {
    injectButtonForComment(
      parentEl.querySelector(':scope > .comment-item'),
    )
    parentEl.querySelectorAll('.comment-item-sub').forEach((subEl) => {
      injectButtonForComment(subEl)
    })
  })
}

function injectButtonForComment(commentEl: Element | null): void {
  if (!commentEl) return
  if (commentEl.querySelector(`[${BUTTON_FLAG}]`)) return

  const infoEl =
    commentEl.querySelector('.info') || commentEl.querySelector('.right')
  if (!infoEl) return

  const comment = extractComment(commentEl)
  if (!comment || !comment.content) return

  const btn = createMagicButton('神回复', () => {
    onMagicReply(comment)
  })

  const interactionsEl = infoEl.querySelector('.interactions')
  if (interactionsEl) {
    interactionsEl.appendChild(btn)
  } else {
    infoEl.appendChild(btn)
  }
}

function injectPostButton(): void {
  // Already injected and still in DOM — skip
  if (document.getElementById('xhs-magic-post-btn')) return

  const engageBar =
    document.querySelector('.engage-bar-container') ||
    document.querySelector('.engage-bar')
  if (!engageBar) return

  // Create a standalone wrapper outside the framework-managed DOM
  const wrapper = document.createElement('div')
  wrapper.id = 'xhs-magic-post-btn'
  wrapper.setAttribute(BUTTON_FLAG, 'post')

  const btn = document.createElement('button')
  btn.className = 'xhs-magic-reply-post-btn'
  btn.innerHTML = '⚡ 神回复'
  btn.addEventListener('click', (e) => {
    e.preventDefault()
    e.stopPropagation()
    onMagicReply(null)
  })

  wrapper.appendChild(btn)
  // Insert as a sibling AFTER the engage-bar container, outside the framework's control
  engageBar.parentElement?.insertBefore(wrapper, engageBar.nextSibling)
}

// ========== 浮窗 ==========

const STYLE_OPTIONS = ['幽默搞笑', '毒舌犀利', '暖心共情', '知识科普', 'custom'] as const
const MODEL_OPTIONS = ['deepseek-v3-2-251201', 'doubao-seed-2-0-pro-260215'] as const

async function getStoredConfig(): Promise<ExtensionConfig> {
  return new Promise((resolve) => {
    chrome.storage.sync.get({
      model: 'deepseek-v3-2-251201',
      style: '幽默搞笑',
      customStyle: '',
    }, (items) => {
      resolve(items as ExtensionConfig)
    })
  })
}

async function getStoredGenParams(): Promise<{ temperature: number; maxTokens: number }> {
  return new Promise((resolve) => {
    chrome.storage.sync.get({ temperature: 0.9, maxTokens: 200 }, (items) => {
      resolve(items as { temperature: number; maxTokens: number })
    })
  })
}

function getModalOverrides(): GenerateReplyOverrides {
  const model = (document.getElementById('xhs-cfg-model') as HTMLSelectElement | null)?.value
  const style = (document.getElementById('xhs-cfg-style') as HTMLSelectElement | null)?.value
  const customStyle = (document.getElementById('xhs-cfg-custom-style') as HTMLInputElement | null)?.value?.trim()
  const tempVal = (document.getElementById('xhs-cfg-temp') as HTMLInputElement | null)?.value
  const maxVal = (document.getElementById('xhs-cfg-max') as HTMLInputElement | null)?.value

  return {
    ...(model ? { model } : {}),
    ...(style ? { style } : {}),
    ...(style === 'custom' && customStyle ? { customStyle } : {}),
    ...(tempVal ? { temperature: parseFloat(tempVal) } : {}),
    ...(maxVal ? { maxTokens: parseInt(maxVal, 10) } : {}),
  }
}

async function showModal(title: string): Promise<void> {
  closeModal()

  const config = await getStoredConfig()
  const genParams = await getStoredGenParams()

  const overlay = document.createElement('div')
  overlay.className = 'xhs-magic-modal-overlay'
  overlay.id = 'xhs-magic-modal'

  const styleOptions = STYLE_OPTIONS.map((s) => {
    const label = s === 'custom' ? '自定义' : s
    const selected = s === config.style ? ' selected' : ''
    return `<option value="${s}"${selected}>${label}</option>`
  }).join('')

  const modelOptions = MODEL_OPTIONS.map((m) => {
    const selected = m === (config.model || MODEL_OPTIONS[0]) ? ' selected' : ''
    return `<option value="${m}"${selected}>${m}</option>`
  }).join('')

  const customStyleDisplay = config.style === 'custom' ? 'block' : 'none'

  overlay.innerHTML = `
    <div class="xhs-magic-modal">
      <div class="xhs-magic-modal-header">
        <h3>⚡ ${title}</h3>
        <button class="xhs-magic-modal-close" id="xhs-modal-close">✕</button>
      </div>

      <div class="xhs-magic-modal-body" id="xhs-modal-body">
        <div class="xhs-magic-placeholder">调整设置后点击下方按钮生成</div>
      </div>
      <div class="xhs-magic-modal-footer" id="xhs-modal-footer">
        <button class="xhs-magic-btn xhs-magic-btn-ghost" id="xhs-btn-cancel">取消</button>
        <button class="xhs-magic-btn xhs-magic-btn-primary" id="xhs-btn-generate">⚡ 生成回复</button>
      </div>

      <div class="xhs-magic-settings" id="xhs-settings-panel">
        <div class="xhs-settings-row">
          <div class="xhs-settings-group">
            <label class="xhs-settings-label">模型</label>
            <select class="xhs-settings-select" id="xhs-cfg-model">${modelOptions}</select>
          </div>
          <div class="xhs-settings-group">
            <label class="xhs-settings-label">风格</label>
            <select class="xhs-settings-select" id="xhs-cfg-style">${styleOptions}</select>
          </div>
        </div>
        <div class="xhs-settings-row" id="xhs-custom-style-row" style="display:${customStyleDisplay}">
          <div class="xhs-settings-group xhs-settings-group-full">
            <label class="xhs-settings-label">自定义风格描述</label>
            <input type="text" class="xhs-settings-input" id="xhs-cfg-custom-style" value="${escapeHtml(config.customStyle || '')}" placeholder="例如：温柔知性、学术风…" />
          </div>
        </div>
        <div class="xhs-settings-row">
          <div class="xhs-settings-group">
            <label class="xhs-settings-label">创造性 <span class="xhs-settings-value" id="xhs-temp-display">${genParams.temperature}</span></label>
            <input type="range" class="xhs-settings-range" id="xhs-cfg-temp" min="0" max="2" step="0.1" value="${genParams.temperature}" />
          </div>
          <div class="xhs-settings-group">
            <label class="xhs-settings-label">最大字数</label>
            <input type="number" class="xhs-settings-input xhs-settings-input-sm" id="xhs-cfg-max" value="${genParams.maxTokens}" min="50" max="1000" step="50" />
          </div>
        </div>
      </div>
    </div>
  `

  document.body.appendChild(overlay)
  document
    .getElementById('xhs-modal-close')
    ?.addEventListener('click', closeModal)
  document
    .getElementById('xhs-btn-cancel')
    ?.addEventListener('click', closeModal)

  // Toggle custom style row
  document.getElementById('xhs-cfg-style')?.addEventListener('change', (e) => {
    const row = document.getElementById('xhs-custom-style-row')
    if (row) {
      row.style.display = (e.target as HTMLSelectElement).value === 'custom' ? 'flex' : 'none'
    }
  })

  // Live temperature display
  document.getElementById('xhs-cfg-temp')?.addEventListener('input', (e) => {
    const display = document.getElementById('xhs-temp-display')
    if (display) display.textContent = (e.target as HTMLInputElement).value
  })
}

function updateModalResult(
  reply: string,
  onUse: (text: string) => void,
  onRetry: () => void,
): void {
  const body = document.getElementById('xhs-modal-body')
  const footer = document.getElementById('xhs-modal-footer')
  if (!body || !footer) return

  body.innerHTML = `
    <div class="xhs-magic-result">
      <textarea id="xhs-reply-text">${escapeHtml(reply)}</textarea>
    </div>
  `

  footer.style.display = 'flex'
  footer.innerHTML = `
    <button class="xhs-magic-btn xhs-magic-btn-ghost" id="xhs-btn-cancel">取消</button>
    <button class="xhs-magic-btn xhs-magic-btn-secondary" id="xhs-btn-retry">🔄 换一个</button>
    <button class="xhs-magic-btn xhs-magic-btn-primary" id="xhs-btn-use">✅ 使用此回复</button>
  `

  document
    .getElementById('xhs-btn-cancel')
    ?.addEventListener('click', closeModal)
  document
    .getElementById('xhs-btn-retry')
    ?.addEventListener('click', onRetry)
  document
    .getElementById('xhs-btn-use')
    ?.addEventListener('click', () => {
      const textarea = document.getElementById(
        'xhs-reply-text',
      ) as HTMLTextAreaElement | null
      onUse(textarea?.value ?? '')
    })
}

function updateModalError(errMsg: string, onRetry: () => void): void {
  const body = document.getElementById('xhs-modal-body')
  const footer = document.getElementById('xhs-modal-footer')
  if (!body || !footer) return

  body.innerHTML = `<div class="xhs-magic-error">❌ ${escapeHtml(errMsg)}</div>`

  footer.style.display = 'flex'
  footer.innerHTML = `
    <button class="xhs-magic-btn xhs-magic-btn-ghost" id="xhs-btn-cancel">取消</button>
    <button class="xhs-magic-btn xhs-magic-btn-secondary" id="xhs-btn-retry">🔄 重试</button>
  `

  document
    .getElementById('xhs-btn-cancel')
    ?.addEventListener('click', closeModal)
  document
    .getElementById('xhs-btn-retry')
    ?.addEventListener('click', onRetry)
}

function updateModalLoading(): void {
  const body = document.getElementById('xhs-modal-body')
  const footer = document.getElementById('xhs-modal-footer')
  if (!body || !footer) return

  body.innerHTML = `
    <div class="xhs-magic-loading">
      <div class="spinner"></div>
      <div>正在重新生成...</div>
    </div>
  `
  footer.style.display = 'none'
}

function closeModal(): void {
  document.getElementById('xhs-magic-modal')?.remove()
}

// ========== 核心逻辑 ==========

let generating = false

async function onMagicReply(
  targetComment: CommentData | null,
): Promise<void> {
  if (generating) return

  try {
    const configResult = (await sendMessage({
      type: 'CHECK_CONFIG',
    })) as CheckConfigResponse
    if (!configResult.configured) {
      alert('请先点击浏览器工具栏的「小红书神回复」图标，配置 API Key')
      return
    }
  } catch {
    alert('插件通信异常，请刷新页面重试')
    return
  }

  const postContent = getPostContent()
  const comments = getComments()
  const title = targetComment
    ? `回复：${targetComment.username}`
    : '生成神评论'

  await showModal(title)

  function doGenerate(): void {
    generating = true
    updateModalLoading()

    const commentPayloads: CommentPayload[] = comments.map((c) => ({
      username: c.username,
      content: c.content,
      isAuthor: c.isAuthor,
      likes: c.likes,
    }))

    const overrides = getModalOverrides()

    sendMessage({
      type: 'GENERATE_REPLY',
      postContent,
      comments: commentPayloads,
      targetComment: targetComment
        ? {
            username: targetComment.username,
            content: targetComment.content,
          }
        : null,
      overrides,
    } as ExtensionMessage)
      .then((result) => {
        generating = false
        const res = result as GenerateReplyResponse
        if (res.error) {
          updateModalError(res.error, () => {
            updateModalLoading()
            doGenerate()
          })
        } else {
          updateModalResult(
            res.reply ?? '',
            (text) => {
              fillReply(text, targetComment)
              closeModal()
            },
            () => {
              updateModalLoading()
              doGenerate()
            },
          )
        }
      })
      .catch((err: Error) => {
        generating = false
        updateModalError(err.message || '生成失败，请重试', () => {
          updateModalLoading()
          doGenerate()
        })
      })
  }

  // Bind generate button — do NOT auto-generate
  document.getElementById('xhs-btn-generate')?.addEventListener('click', () => {
    doGenerate()
  })
}

// ========== 回复填入 ==========

function fillReply(
  text: string,
  _targetComment: CommentData | null,
): void {
  copyToClipboard(text)
}

async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text)
    showToast('✅ 已复制到剪贴板，请粘贴到评论框')
  } catch {
    // Fallback for older browsers or permission denied
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    showToast('✅ 已复制到剪贴板，请粘贴到评论框')
  }
}

function showToast(msg: string): void {
  const existing = document.getElementById('xhs-magic-toast')
  if (existing) existing.remove()

  const toast = document.createElement('div')
  toast.id = 'xhs-magic-toast'
  toast.textContent = msg
  toast.style.cssText =
    'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);' +
    'background:#333;color:#fff;padding:10px 20px;border-radius:8px;' +
    'font-size:14px;z-index:999999;pointer-events:none;' +
    'animation:xhs-toast-fade 2s ease-in-out forwards;'
  document.body.appendChild(toast)
  setTimeout(() => toast.remove(), 2500)
}

// ========== 工具函数 ==========

function sendMessage(
  msg: ExtensionMessage,
): Promise<GenerateReplyResponse | CheckConfigResponse> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(msg, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message))
      } else {
        resolve(response)
      }
    })
  })
}

function escapeHtml(str: string): string {
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}

// ========== 初始化 & 观察 ==========

let observer: MutationObserver | null = null
let injecting = false

function init(): void {
  if (!isNotePage()) return

  injectButtons()

  observer = new MutationObserver(
    debounce(() => {
      if (!injecting && isNotePage()) {
        injectButtons()
      }
    }, 500),
  )

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  })
}

function injectButtons(): void {
  injecting = true
  try {
    injectCommentButtons()
    injectPostButton()
  } finally {
    // Defer resetting the flag so the mutation triggered by our DOM changes
    // is still suppressed when the observer callback runs.
    setTimeout(() => { injecting = false }, 100)
  }
}

function isNotePage(): boolean {
  return (
    !!document.querySelector('.note-container') ||
    !!document.querySelector('#noteContainer') ||
    !!document.querySelector('.note-detail-mask')
  )
}

function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>
  return function (this: unknown, ...args: Parameters<T>) {
    clearTimeout(timer)
    timer = setTimeout(() => fn.apply(this, args), delay)
  }
}

// Start
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}
