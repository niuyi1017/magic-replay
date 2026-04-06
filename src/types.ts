// ========== 消息协议 ==========

export interface CommentPayload {
  username: string
  content: string
  isAuthor: boolean
}

export interface TargetCommentPayload {
  username: string
  content: string
}

export interface GenerateReplyMessage {
  type: 'GENERATE_REPLY'
  postContent: string
  comments: CommentPayload[]
  targetComment: TargetCommentPayload | null
}

export interface CheckConfigMessage {
  type: 'CHECK_CONFIG'
}

export interface GetDebugInfoMessage {
  type: 'GET_DEBUG_INFO'
}

export type ExtensionMessage = GenerateReplyMessage | CheckConfigMessage | GetDebugInfoMessage

export interface GenerateReplyResponse {
  reply?: string
  error?: string
}

export interface CheckConfigResponse {
  configured: boolean
}

export interface DebugLogEntry {
  time: string
  level: 'info' | 'warn' | 'error'
  message: string
  detail?: string
}

export interface DebugInfoResponse {
  config: Omit<ExtensionConfig, 'apiKey'> & { apiKey: string }
  logs: DebugLogEntry[]
  version: string
}

// ========== 配置 ==========

export interface ExtensionConfig {
  apiBase: string
  apiKey: string
  model: string
  style: string
  customStyle: string
}

export const DEFAULT_CONFIG: ExtensionConfig = {
  apiBase: 'https://api.openai.com/v1',
  apiKey: '',
  model: 'gpt-4o-mini',
  style: '幽默搞笑',
  customStyle: '',
}

// ========== AI API ==========

export interface ChatCompletionResponse {
  choices: Array<{
    message: {
      content: string
    }
  }>
}

// ========== Content Script ==========

export interface CommentData {
  username: string
  content: string
  isAuthor: boolean
  likes: string
  element: Element | null
}
