import { MessageType } from '@/types'
import type { ExtensionMessage, GenerateReplyMessage, PageContext } from '@/types'
import { getActiveModel, getStyles, getGlobalSystemPrompt } from '@/utils/storage'
import { buildSystemPrompt, buildUserPrompt } from '@/utils/prompt-builder'
import { sendTabMessage } from '@/utils/messaging'

// ============================================================
// AI API 调用
// ============================================================

async function callAI(
  baseURL: string,
  apiKey: string,
  modelName: string,
  systemPrompt: string,
  userPrompt: string,
  temperature: number,
  maxTokens: number,
): Promise<string> {
  const url = `${baseURL.replace(/\/+$/, '')}/chat/completions`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: modelName,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature,
      max_tokens: maxTokens,
    }),
  })

  if (!response.ok) {
    const errBody = await response.text().catch(() => '')
    if (response.status === 401) throw new Error('API Key 无效，请在设置中检查')
    if (response.status === 429) throw new Error('请求过于频繁或额度不足')
    if (response.status === 402) throw new Error('API 额度不足')
    throw new Error(`API 请求失败 (${response.status}): ${errBody.slice(0, 200)}`)
  }

  const data = await response.json()
  const content = data?.choices?.[0]?.message?.content
  if (!content) throw new Error('API 返回空内容')
  return content.trim()
}

// ============================================================
// 消息处理
// ============================================================

async function handleGenerateReply(msg: GenerateReplyMessage) {
  try {
    const model = await getActiveModel()
    if (!model.apiKey) {
      return { reply: '', error: '请先在设置中配置 API Key' }
    }

    const styles = await getStyles()
    const style = styles.find((s) => s.id === msg.payload.styleId) ?? styles[0]
    const globalPrompt = await getGlobalSystemPrompt()

    const systemPrompt = buildSystemPrompt(style, globalPrompt)
    const userPrompt = buildUserPrompt(msg.payload.context, msg.payload.target)

    const reply = await callAI(
      model.baseURL,
      model.apiKey,
      model.modelName,
      systemPrompt,
      userPrompt,
      style.temperature,
      style.maxTokens,
    )

    return { reply, error: '' }
  } catch (e) {
    return { reply: '', error: e instanceof Error ? e.message : '生成失败' }
  }
}

// 监听来自 content script / popup 的消息
chrome.runtime.onMessage.addListener((message: ExtensionMessage, sender, sendResponse) => {
  if (message.type === MessageType.GENERATE_REPLY) {
    handleGenerateReply(message).then(sendResponse)
    return true // 异步响应
  }

  if (message.type === MessageType.EXTRACT_CONTEXT) {
    // 转发给当前活跃 tab 的 content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, message, sendResponse)
      } else {
        sendResponse(null)
      }
    })
    return true
  }

  if (message.type === MessageType.FILL_REPLY || message.type === MessageType.COPY_REPLY) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, message, sendResponse)
      } else {
        sendResponse(false)
      }
    })
    return true
  }
})

// ============================================================
// 右键菜单
// ============================================================

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'auto-reply-generate',
    title: '💬 用神回复回复这条评论',
    contexts: ['selection'],
    documentUrlPatterns: ['https://www.xiaohongshu.com/*', 'https://*.xiaohongshu.com/*'],
  })
})

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'auto-reply-generate' && tab?.id) {
    chrome.tabs.sendMessage(tab.id, {
      type: MessageType.CONTEXT_MENU_TRIGGER,
      payload: { selectionText: info.selectionText },
    } as ExtensionMessage)
  }
})
