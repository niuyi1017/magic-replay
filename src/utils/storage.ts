import type { ModelConfig, StylePreset } from '@/types'

// ============================================================
// 默认风格预设
// ============================================================

export const DEFAULT_STYLES: StylePreset[] = [
  {
    id: 'humorous',
    name: '幽默搞笑',
    emoji: '😂',
    systemPrompt:
      '你是一个小红书评论高手，擅长用幽默搞笑的方式回复评论。回复要机智、有趣、接地气，善用网络梗和谐音梗，让人忍不住想点赞。回复要简短精炼，不超过100字。',
    temperature: 0.9,
    maxTokens: 200,
    builtin: true,
  },
  {
    id: 'professional',
    name: '专业知识',
    emoji: '🎓',
    systemPrompt:
      '你是一个小红书评论达人，擅长用专业且易懂的方式回复评论。回复要有干货、有见解、言之有物，展示你的专业素养，同时保持亲和力。回复要简短精炼，不超过100字。',
    temperature: 0.6,
    maxTokens: 200,
    builtin: true,
  },
  {
    id: 'empathetic',
    name: '温暖共情',
    emoji: '🤗',
    systemPrompt:
      '你是一个小红书评论暖心达人，擅长用温暖、共情的方式回复评论。回复要体贴、真诚、让人感到被理解和关心，像一个贴心的朋友。回复要简短精炼，不超过100字。',
    temperature: 0.7,
    maxTokens: 200,
    builtin: true,
  },
  {
    id: 'sharp',
    name: '毒舌犀利',
    emoji: '🔥',
    systemPrompt:
      '你是一个小红书评论毒舌达人，擅长用犀利、一针见血的方式回复评论。回复要锋利但不失分寸，有深度、有态度，让人拍案叫绝。注意不要人身攻击或违反社区规范。回复要简短精炼，不超过100字。',
    temperature: 0.8,
    maxTokens: 200,
    builtin: true,
  },
  {
    id: 'literary',
    name: '文艺诗意',
    emoji: '🌸',
    systemPrompt:
      '你是一个小红书评论文艺达人，擅长用诗意、文艺的方式回复评论。回复要有意境、有美感、富有文学气息，可以引用诗词或用优美的比喻。回复要简短精炼，不超过100字。',
    temperature: 0.8,
    maxTokens: 200,
    builtin: true,
  },
]

const DEFAULT_MODEL: ModelConfig = {
  id: 'default',
  label: '默认模型',
  baseURL: 'https://api.openai.com/v1',
  apiKey: '',
  modelName: 'gpt-4o-mini',
}

// ============================================================
// Storage keys
// ============================================================

const KEYS = {
  MODELS: 'models',
  ACTIVE_MODEL_ID: 'activeModelId',
  STYLES: 'styles',
  ACTIVE_STYLE_ID: 'activeStyleId',
  GLOBAL_SYSTEM_PROMPT: 'globalSystemPrompt',
} as const

// ============================================================
// Helpers
// ============================================================

async function get<T>(key: string, fallback: T): Promise<T> {
  const result = await chrome.storage.local.get(key)
  const value = result[key]
  if (value == null) return fallback
  // 如果 fallback 是数组，确保返回值也是数组
  if (Array.isArray(fallback) && !Array.isArray(value)) return fallback
  return value as T
}

async function set(key: string, value: unknown): Promise<void> {
  await chrome.storage.local.set({ [key]: value })
}

// ============================================================
// Public API
// ============================================================

// --- Models ---

export async function getModels(): Promise<ModelConfig[]> {
  return get<ModelConfig[]>(KEYS.MODELS, [DEFAULT_MODEL])
}

export async function setModels(models: ModelConfig[]): Promise<void> {
  await set(KEYS.MODELS, models)
}

export async function getActiveModelId(): Promise<string> {
  return get<string>(KEYS.ACTIVE_MODEL_ID, 'default')
}

export async function setActiveModelId(id: string): Promise<void> {
  await set(KEYS.ACTIVE_MODEL_ID, id)
}

export async function getActiveModel(): Promise<ModelConfig> {
  const [models, activeId] = await Promise.all([getModels(), getActiveModelId()])
  return models.find((m) => m.id === activeId) ?? models[0] ?? DEFAULT_MODEL
}

// --- Styles ---

export async function getStyles(): Promise<StylePreset[]> {
  return get<StylePreset[]>(KEYS.STYLES, DEFAULT_STYLES)
}

export async function setStyles(styles: StylePreset[]): Promise<void> {
  await set(KEYS.STYLES, styles)
}

export async function getActiveStyleId(): Promise<string> {
  return get<string>(KEYS.ACTIVE_STYLE_ID, 'humorous')
}

export async function setActiveStyleId(id: string): Promise<void> {
  await set(KEYS.ACTIVE_STYLE_ID, id)
}

export async function getActiveStyle(): Promise<StylePreset> {
  const [styles, activeId] = await Promise.all([getStyles(), getActiveStyleId()])
  return styles.find((s) => s.id === activeId) ?? styles[0] ?? DEFAULT_STYLES[0]
}

// --- Global System Prompt ---

export async function getGlobalSystemPrompt(): Promise<string> {
  return get<string>(KEYS.GLOBAL_SYSTEM_PROMPT, '')
}

export async function setGlobalSystemPrompt(prompt: string): Promise<void> {
  await set(KEYS.GLOBAL_SYSTEM_PROMPT, prompt)
}
