import type { CommentInfo, PageContext } from '@/types'

// ============================================================
// 小红书页面内容提取器
// #noteContainer 是包含完整笔记内容的根容器（图片、标题、正文、评论列表）
// 小红书 DOM 结构可能变化，提供多 fallback 选择器
// ============================================================

/** 获取笔记根容器，优先 #noteContainer */
function getNoteContainer(): Element | Document {
  return document.querySelector('#noteContainer') ?? document
}

const SELECTORS = {
  // 笔记标题（在 #noteContainer 内查找）
  noteTitle: ['#detail-title', '.title', '[class*="title"]'],
  // 笔记正文
  noteContent: [
    '#detail-desc .note-text',
    '#detail-desc',
    '.note-text',
    '.desc',
  ],
  // 笔记作者
  noteAuthor: ['.author-wrapper .username', '.user-name', '[class*="author"] [class*="name"]'],
  // 单条评论
  commentItem: ['.comment-item', '[class*="comment-item"]', '[class*="commentItem"]'],
  // 评论用户名
  commentUser: ['.name', '.user-name', '[class*="name"]'],
  // 评论内容
  commentContent: ['.content', '.text', '[class*="content"]'],
  // 评论时间
  commentTime: ['.time', '.date', '[class*="time"]'],
}

/**
 * 使用多个选择器尝试查找元素
 */
function queryFirst(parent: Element | Document, selectors: string[]): Element | null {
  for (const sel of selectors) {
    const el = parent.querySelector(sel)
    if (el) return el
  }
  return null
}

/**
 * 使用多个选择器尝试查找所有匹配元素
 */
function queryAllFirst(parent: Element | Document, selectors: string[]): Element[] {
  for (const sel of selectors) {
    const els = parent.querySelectorAll(sel)
    if (els.length > 0) return Array.from(els)
  }
  return []
}

/**
 * 获取元素文本内容（清理空白）
 */
function getText(el: Element | null): string {
  if (!el) return ''
  return (el.textContent ?? '').trim()
}

/**
 * 提取笔记标题
 */
export function extractNoteTitle(): string {
  return getText(queryFirst(getNoteContainer(), SELECTORS.noteTitle)) || '未获取到标题'
}

/**
 * 提取笔记正文
 */
export function extractNoteContent(): string {
  return getText(queryFirst(getNoteContainer(), SELECTORS.noteContent)) || '未获取到正文'
}

/**
 * 提取笔记作者
 */
export function extractNoteAuthor(): string {
  return getText(queryFirst(getNoteContainer(), SELECTORS.noteAuthor)) || '未知作者'
}

/**
 * 提取评论列表
 */
export function extractComments(): CommentInfo[] {
  const container = getNoteContainer()
  const items = queryAllFirst(container, SELECTORS.commentItem)
  return items.map((item) => ({
    username: getText(queryFirst(item, SELECTORS.commentUser)) || '匿名',
    content: getText(queryFirst(item, SELECTORS.commentContent)) || '',
    time: getText(queryFirst(item, SELECTORS.commentTime)),
    element: item as HTMLElement,
  }))
}

/**
 * 提取完整页面上下文
 */
export function extractPageContext(): PageContext {
  return {
    noteTitle: extractNoteTitle(),
    noteContent: extractNoteContent(),
    noteAuthor: extractNoteAuthor(),
    comments: extractComments(),
    url: window.location.href,
  }
}

/**
 * 检查当前页面是否是小红书笔记详情页
 */
export function isNoteDetailPage(): boolean {
  // 优先检测 #noteContainer
  if (document.querySelector('#noteContainer')) return true
  const url = window.location.href
  return /xiaohongshu\.com\/(explore|discovery\/item)\//.test(url) ||
    document.querySelector('[class*="note-detail"], [class*="noteDetail"]') !== null
}
