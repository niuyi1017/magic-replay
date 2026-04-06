// ============================================================
// 共享类型定义
// ============================================================

/** AI 模型配置 */
export interface ModelConfig {
  id: string
  label: string
  baseURL: string
  apiKey: string
  modelName: string
}

/** 回复风格预设 */
export interface StylePreset {
  id: string
  name: string
  emoji: string
  systemPrompt: string
  temperature: number
  maxTokens: number
  builtin: boolean // 内置预设不可删除
}

/** 单条评论 */
export interface CommentInfo {
  username: string
  content: string
  time?: string
  element?: HTMLElement // 不序列化，仅 content script 内部使用
}

/** 页面上下文 */
export interface PageContext {
  noteTitle: string
  noteContent: string
  noteAuthor: string
  comments: CommentInfo[]
  url: string
}

/** 目标评论（用户选中的要回复的评论） */
export interface TargetComment {
  username: string
  content: string
}

// ============================================================
// 消息类型
// ============================================================

export enum MessageType {
  /** 请求生成回复 */
  GENERATE_REPLY = 'GENERATE_REPLY',
  /** 生成结果返回 */
  GENERATE_REPLY_RESULT = 'GENERATE_REPLY_RESULT',
  /** 提取页面上下文 */
  EXTRACT_CONTEXT = 'EXTRACT_CONTEXT',
  /** 提取结果返回 */
  EXTRACT_CONTEXT_RESULT = 'EXTRACT_CONTEXT_RESULT',
  /** 填入回复到评论框 */
  FILL_REPLY = 'FILL_REPLY',
  /** 复制到剪贴板 */
  COPY_REPLY = 'COPY_REPLY',
  /** 获取当前配置 */
  GET_CONFIG = 'GET_CONFIG',
  /** 右键菜单触发 */
  CONTEXT_MENU_TRIGGER = 'CONTEXT_MENU_TRIGGER',
}

export interface GenerateReplyMessage {
  type: MessageType.GENERATE_REPLY
  payload: {
    context: PageContext
    target: TargetComment
    styleId: string
  }
}

export interface GenerateReplyResultMessage {
  type: MessageType.GENERATE_REPLY_RESULT
  payload: {
    reply: string
    error?: string
  }
}

export interface ExtractContextMessage {
  type: MessageType.EXTRACT_CONTEXT
}

export interface ExtractContextResultMessage {
  type: MessageType.EXTRACT_CONTEXT_RESULT
  payload: PageContext
}

export interface FillReplyMessage {
  type: MessageType.FILL_REPLY
  payload: { text: string }
}

export interface CopyReplyMessage {
  type: MessageType.COPY_REPLY
  payload: { text: string }
}

export interface ContextMenuTriggerMessage {
  type: MessageType.CONTEXT_MENU_TRIGGER
  payload: {
    selectionText?: string
  }
}

export type ExtensionMessage =
  | GenerateReplyMessage
  | GenerateReplyResultMessage
  | ExtractContextMessage
  | ExtractContextResultMessage
  | FillReplyMessage
  | CopyReplyMessage
  | ContextMenuTriggerMessage
