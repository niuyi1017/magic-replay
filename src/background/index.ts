import type {
  ExtensionMessage,
  GenerateReplyMessage,
  GenerateReplyResponse,
  CheckConfigResponse,
  ExtensionConfig,
  ChatCompletionResponse,
  DebugLogEntry,
  DebugInfoResponse,
} from '@/types'
import { DEFAULT_CONFIG } from '@/types'

// ========== Debug Logging ==========
const MAX_LOGS = 200

function formatTime(): string {
  return new Date().toLocaleString('zh-CN', { hour12: false })
}

async function addLog(level: DebugLogEntry['level'], message: string, detail?: string) {
  try {
    const { debugLogs = [] } = await chrome.storage.local.get('debugLogs') as { debugLogs: DebugLogEntry[] }
    debugLogs.push({ time: formatTime(), level, message, detail })
    if (debugLogs.length > MAX_LOGS) debugLogs.splice(0, debugLogs.length - MAX_LOGS)
    await chrome.storage.local.set({ debugLogs })
  } catch { /* storage not available */ }
}

const STYLE_PROMPTS: Record<string, string> = {
  '幽默搞笑': `【风格：幽默搞笑】
你擅长用反转、类比、谐音梗、自嘲等手法制造笑点。
手法参考：把日常小事夸张化、用不相关领域的概念做类比、先认同再反转、用"我朋友/我同事"开头讲段子。
注意：笑点要自然，不要硬凹，不要用烂梗。`,

  '毒舌犀利': `【风格：毒舌犀利】
你擅长一针见血地指出问题本质，用锋利但不恶毒的语言让人拍案叫绝。
手法参考：精准吐槽、反讽、犀利比喻、用数据/事实打脸。
注意：毒舌≠人身攻击，要让人笑着被扎心，不要真正伤害人。`,

  '暖心共情': `【风格：暖心共情】
你擅长站在对方角度表达理解，用温暖但不做作的方式给人力量。
手法参考：分享相似经历、点出对方没说出口的感受、给出具体可行的小建议、用画面感的语言传递善意。
注意：不要说教，不要居高临下，不要用"加油"这种空洞的鼓励。`,

  '知识科普': `【风格：知识科普】
你擅长用通俗易懂的方式分享相关领域的冷知识或专业见解，让评论区变成学习现场。
手法参考：用"其实..."引出反常识知识、用生活化类比解释专业概念、补充原帖未提到的关键信息。
注意：确保知识准确，不要卖弄学术术语，语气保持轻松。`,
}

const SYSTEM_PROMPT = `# 角色
你是一个深度活跃的小红书用户，浸泡社区多年，熟悉各类话题的讨论氛围。你写的评论自然、真实，像是从一个有趣的朋友嘴里说出来的。

# 核心策略
根据帖子内容和语境，灵活选择以下策略之一：
- **共鸣延伸**：从帖子内容出发，分享自己的相似经历或感受，让人觉得"你懂我"
- **精准切入**：抓住帖子中最有讨论价值的一个细节展开，而非泛泛而谈
- **反转/意外**：先顺着说，再来一个出人意料的转折
- **经验碰撞**：用自己的经验补充或轻微挑战帖子观点，引发讨论

# 硬性约束
1. 长度：1-3句话，不超过100字
2. emoji：0-3个，自然融入，不要堆砌
3. 直接输出回复内容，不加引号、不加"回复："前缀、不加任何格式标记

# 禁止事项（违反任何一条即为失败）
- ❌ 空洞附和："说得太对了"、"深有同感"、"太真实了"等套话开头
- ❌ AI腔调："作为一个…"、"我认为…"、"首先…其次…"
- ❌ 过度热情：连续使用感叹号、堆砌emoji、无理由夸赞
- ❌ 万能回复：脱离帖子具体内容的通用评论
- ❌ 复读帖子：重复帖子已说过的内容`

const FEW_SHOT_EXAMPLES: Record<string, string> = {
  '幽默搞笑': `
示例参考（学习风格，不要照搬）：
帖子："加班到凌晨三点终于做完了方案" → "你的黑眼圈已经不是圈了，是眼影 🌚"
帖子："今天被猫主子挠了一道" → "恭喜获得猫主子亲笔签名 ✍️"`,

  '毒舌犀利': `
示例参考（学习风格，不要照搬）：
帖子："又开始纠结要不要考研了" → "纠结本身就是答案——你还没准备好 🎯"
帖子："月薪5000存不下钱" → "不是存不下，是花呗替你做了理财规划"`,

  '暖心共情': `
示例参考（学习风格，不要照搬）：
帖子："异地恋好难坚持啊" → "能说出难，说明你还在努力，这本身就很了不起 🤝"
帖子："面试又挂了第三家" → "第三家说明你没放弃投第四家，这个韧劲比offer更值钱"`,

  '知识科普': `
示例参考（学习风格，不要照搬）：
帖子："为什么奶茶喝完会睡不着" → "咖啡因半衰期5-6小时，下午三点那杯奶茶到晚上还剩一半在你血液里蹦迪 🧬"
帖子："皮肤换季就过敏" → "其实不一定是过敏，可能是皮肤屏障受损。换季先精简护肤步骤比换产品有用"`,
}

chrome.runtime.onMessage.addListener(
  (
    request: ExtensionMessage,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: GenerateReplyResponse | CheckConfigResponse | DebugInfoResponse) => void,
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

    if (request.type === 'GET_DEBUG_INFO') {
      handleGetDebugInfo()
        .then(sendResponse)
        .catch(() => sendResponse({ config: DEFAULT_CONFIG, logs: [], version: '1.0.0' }))
      return true
    }
  },
)

async function handleGenerateReply(
  request: GenerateReplyMessage,
): Promise<GenerateReplyResponse> {
  const config = await getConfig()

  if (!config.apiKey) {
    await addLog('error', 'API Key 未配置')
    throw new Error('请先在插件设置中配置 API Key')
  }

  // Per-request overrides from modal controls
  const ov = request.overrides ?? {}
  const effectiveModel = ov.model || config.model
  const effectiveStyle = ov.style || config.style
  const effectiveCustomStyle = ov.customStyle || config.customStyle

  const styleKey = effectiveStyle === 'custom' ? '' : effectiveStyle
  const styleDesc =
    effectiveStyle === 'custom'
      ? `【风格：自定义】\n${effectiveCustomStyle || '幽默有趣，自然真实'}`
      : STYLE_PROMPTS[effectiveStyle] || STYLE_PROMPTS['幽默搞笑']

  const fewShot = styleKey && FEW_SHOT_EXAMPLES[styleKey] ? FEW_SHOT_EXAMPLES[styleKey] : ''

  const systemMessage = SYSTEM_PROMPT + '\n\n' + styleDesc + (fewShot ? '\n' + fewShot : '')

  let userMessage = `【帖子内容】\n${request.postContent}\n`

  if (request.comments && request.comments.length > 0) {
    userMessage += `\n【评论区现有讨论】\n`
    request.comments.slice(0, 10).forEach((c) => {
      const authorTag = c.isAuthor ? '（作者）' : ''
      const likesTag = c.likes && c.likes !== '0' ? ` [${c.likes}赞]` : ''
      userMessage += `- ${c.username}${authorTag}：${c.content}${likesTag}\n`
    })
  }

  if (request.targetComment) {
    userMessage += `\n【要回复的评论】\n${request.targetComment.username}：${request.targetComment.content}\n`
    userMessage += `\n请针对上面这条评论写一条回复。要求：紧扣该评论的具体内容，让评论者和围观的人都想给你点赞。不要泛泛而谈。`
  } else {
    userMessage += `\n请针对这篇帖子写一条评论。要求：找到帖子中最有发挥空间的一个点作为切入，写出有记忆点的独到见解或有趣观点，避免与已有评论重复。`
  }

  const apiUrl = `${config.apiBase}/chat/completions`
  const stored = await chrome.storage.sync.get({ temperature: 0.9, maxTokens: 200 }) as { temperature: number; maxTokens: number }
  const temperature = ov.temperature ?? stored.temperature
  const maxTokens = ov.maxTokens ?? stored.maxTokens

  await addLog('info', '发起 AI 请求', `模型: ${effectiveModel} | 风格: ${effectiveStyle} | Temperature: ${temperature} | MaxTokens: ${maxTokens}`)

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: effectiveModel,
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: userMessage },
      ],
      max_tokens: maxTokens,
      temperature,
    }),
  })

  if (!response.ok) {
    const errBody = await response.text()
    await addLog('error', `API 请求失败 (${response.status})`, errBody.slice(0, 500))
    throw new Error(
      `API 请求失败 (${response.status}): ${errBody.slice(0, 200)}`,
    )
  }

  const data: ChatCompletionResponse = await response.json()
  const reply = data.choices?.[0]?.message?.content?.trim()

  if (!reply) {
    await addLog('error', 'AI 未返回有效内容')
    throw new Error('AI 未返回有效内容')
  }

  await addLog('info', '回复生成成功', reply.slice(0, 100))
  return { reply }
}

async function handleGetDebugInfo(): Promise<DebugInfoResponse> {
  const config = await getConfig()
  const { debugLogs = [] } = await chrome.storage.local.get('debugLogs') as { debugLogs: DebugLogEntry[] }
  const manifest = chrome.runtime.getManifest()

  return {
    config: {
      ...config,
      apiKey: config.apiKey ? `${config.apiKey.slice(0, 6)}***${config.apiKey.slice(-4)}` : '(未设置)',
    },
    logs: debugLogs,
    version: manifest.version,
  }
}

function getConfig(): Promise<ExtensionConfig> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(DEFAULT_CONFIG, (items) => {
      resolve(items as ExtensionConfig)
    })
  })
}
