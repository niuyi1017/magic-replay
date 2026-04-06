import type {
  CommentData,
  CommentPayload,
  GenerateReplyResponse,
  CheckConfigResponse,
  ExtensionMessage,
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
  const engageBar =
    document.querySelector(
      '.engage-bar-container .engage-bar .input-box',
    ) || document.querySelector('.engage-bar .input-box')
  if (!engageBar) return
  if (engageBar.querySelector(`[${BUTTON_FLAG}="post"]`)) return

  const btn = document.createElement('button')
  btn.className = 'xhs-magic-reply-post-btn'
  btn.setAttribute(BUTTON_FLAG, 'post')
  btn.innerHTML = '⚡ 神回复'
  btn.addEventListener('click', (e) => {
    e.preventDefault()
    e.stopPropagation()
    onMagicReply(null)
  })

  engageBar.parentElement?.appendChild(btn)
}

// ========== 浮窗 ==========

function showModal(title: string): void {
  closeModal()

  const overlay = document.createElement('div')
  overlay.className = 'xhs-magic-modal-overlay'
  overlay.id = 'xhs-magic-modal'
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal()
  })

  overlay.innerHTML = `
    <div class="xhs-magic-modal">
      <div class="xhs-magic-modal-header">
        <h3>⚡ ${title}</h3>
        <button class="xhs-magic-modal-close" id="xhs-modal-close">✕</button>
      </div>
      <div class="xhs-magic-modal-body" id="xhs-modal-body">
        <div class="xhs-magic-loading">
          <div class="spinner"></div>
          <div>正在生成神回复...</div>
        </div>
      </div>
      <div class="xhs-magic-modal-footer" id="xhs-modal-footer" style="display:none;"></div>
    </div>
  `

  document.body.appendChild(overlay)
  document
    .getElementById('xhs-modal-close')
    ?.addEventListener('click', closeModal)
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

  showModal(title)

  function doGenerate(): void {
    generating = true

    const commentPayloads: CommentPayload[] = comments.map((c) => ({
      username: c.username,
      content: c.content,
      isAuthor: c.isAuthor,
    }))

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

  doGenerate()
}

// ========== 回复填入 ==========

function fillReply(
  text: string,
  targetComment: CommentData | null,
): void {
  if (targetComment?.element) {
    const replyBtn =
      targetComment.element.querySelector('.reply.icon-container') ||
      targetComment.element.querySelector('.reply')
    if (replyBtn) {
      ;(replyBtn as HTMLElement).click()
      setTimeout(() => insertText(text), 300)
      return
    }
  }

  insertText(text)
}

function insertText(text: string): void {
  const textarea = document.getElementById('content-textarea')
  if (!textarea) {
    alert('找不到评论输入框，请手动粘贴：\n\n' + text)
    return
  }

  textarea.focus()
  textarea.textContent = ''
  textarea.textContent = text

  textarea.dispatchEvent(new Event('input', { bubbles: true }))
  textarea.dispatchEvent(new Event('compositionend', { bubbles: true }))
  textarea.dispatchEvent(new Event('change', { bubbles: true }))

  try {
    document.execCommand('selectAll', false, undefined)
    document.execCommand('insertText', false, text)
  } catch {
    // Fallback already set via textContent
  }
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

function init(): void {
  if (!isNotePage()) return

  injectButtons()

  const observer = new MutationObserver(
    debounce(() => {
      if (isNotePage()) {
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
  injectCommentButtons()
  injectPostButton()
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
