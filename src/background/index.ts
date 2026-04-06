import type {
  ExtensionMessage,
  GenerateReplyMessage,
  GenerateReplyResponse,
  CheckConfigResponse,
  ExtensionConfig,
  ChatCompletionResponse,
} from '@/types'
import { DEFAULT_CONFIG } from '@/types'

const STYLE_PROMPTS: Record<string, string> = {
  '幽默搞笑': '你的回复风格是幽默搞笑，善于用谐音梗、反转、夸张等手法制造笑点，让人忍不住点赞。',
  '毒舌犀利': '你的回复风格是毒舌犀利，一针见血地指出要害，语言锋利但不恶毒，让人拍案叫绝。',
  '暖心共情': '你的回复风格是暖心共情，善于站在对方角度表达理解和支持，让人感到被治愈。',
  '知识科普': '你的回复风格是知识科普，用有趣的方式普及相关知识，让评论区变成学习现场。',
}

const SYSTEM_PROMPT = `你是一个小红书神评手，专门写出让人忍不住点赞的高质量评论回复。

要求：
1. 回复简短精炼，通常1-3句话，最多不超过100字
2. 符合小红书的社区氛围和语言风格
3. 可以适当使用emoji，但不要过多（1-3个）
4. 回复要有记忆点，能引起共鸣或让人会心一笑
5. 不要使用"哈哈哈"等低质量的回复
6. 不要过于谄媚或虚伪
7. 直接输出回复内容，不要加引号或其他格式`

chrome.runtime.onMessage.addListener(
  (
    request: ExtensionMessage,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: GenerateReplyResponse | CheckConfigResponse) => void,
  ) => {
    if (request.type === 'GENERATE_REPLY') {
      handleGenerateReply(request)
        .then(sendResponse)
        .catch((err: Error) => {
          sendResponse({ error: err.message || '生成失败' })
        })
      return true
    }

    if (request.type === 'CHECK_CONFIG') {
      chrome.storage.sync.get(['apiKey'], (items) => {
        sendResponse({ configured: !!items.apiKey })
      })
      return true
    }
  },
)

async function handleGenerateReply(
  request: GenerateReplyMessage,
): Promise<GenerateReplyResponse> {
  const config = await getConfig()

  if (!config.apiKey) {
    throw new Error('请先在插件设置中配置 API Key')
  }

  const styleDesc =
    config.style === 'custom'
      ? config.customStyle || '幽默有趣'
      : STYLE_PROMPTS[config.style] || STYLE_PROMPTS['幽默搞笑']

  const systemMessage = SYSTEM_PROMPT + '\n\n' + styleDesc

  let userMessage = `【帖子内容】\n${request.postContent}\n`

  if (request.comments && request.comments.length > 0) {
    userMessage += `\n【评论区精选】\n`
    request.comments.slice(0, 10).forEach((c) => {
      const authorTag = c.isAuthor ? '（作者）' : ''
      userMessage += `- ${c.username}${authorTag}：${c.content}\n`
    })
  }

  if (request.targetComment) {
    userMessage += `\n【要回复的评论】\n${request.targetComment.username}：${request.targetComment.content}\n`
    userMessage += `\n请针对这条评论生成一条神回复。`
  } else {
    userMessage += `\n请针对这篇帖子生成一条神评论。`
  }

  const apiUrl = `${config.apiBase}/chat/completions`

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: userMessage },
      ],
      max_tokens: 200,
      temperature: 0.9,
    }),
  })

  if (!response.ok) {
    const errBody = await response.text()
    throw new Error(
      `API 请求失败 (${response.status}): ${errBody.slice(0, 200)}`,
    )
  }

  const data: ChatCompletionResponse = await response.json()
  const reply = data.choices?.[0]?.message?.content?.trim()

  if (!reply) {
    throw new Error('AI 未返回有效内容')
  }

  return { reply }
}

function getConfig(): Promise<ExtensionConfig> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(DEFAULT_CONFIG, (items) => {
      resolve(items as ExtensionConfig)
    })
  })
}
