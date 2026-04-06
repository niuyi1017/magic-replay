<template>
  <div class="popup">
    <div class="header">
      <h1>✨ 小红书神回复</h1>
    </div>

    <div v-if="!isXhsPage" class="notice">
      请打开小红书笔记页面后再使用
    </div>

    <template v-else>
      <!-- 模型选择 -->
      <div class="section">
        <label class="label">当前模型</label>
        <select v-model="activeModelId" class="select" @change="onModelChange">
          <option v-for="m in models" :key="m.id" :value="m.id">{{ m.label }}</option>
        </select>
      </div>

      <!-- 风格选择 -->
      <div class="section">
        <label class="label">回复风格</label>
        <div class="style-grid">
          <button
            v-for="s in styles"
            :key="s.id"
            :class="['style-card', { active: activeStyleId === s.id }]"
            @click="selectStyle(s.id)"
          >
            <span class="emoji">{{ s.emoji }}</span>
            <span class="name">{{ s.name }}</span>
          </button>
        </div>
      </div>

      <!-- 状态 -->
      <div v-if="status" class="status" :class="statusType">{{ status }}</div>

      <!-- 生成按钮 -->
      <button class="generate-btn" :disabled="loading" @click="generate">
        {{ loading ? '⏳ 生成中...' : '🚀 为最新评论生成神回复' }}
      </button>

      <!-- 结果 -->
      <div v-if="result" class="result">
        <div class="result-text">{{ result }}</div>
        <div class="action-row">
          <button class="action-btn" @click="fillReply">📝 填入</button>
          <button class="action-btn" @click="copyReply">📋 复制</button>
        </div>
      </div>
    </template>

    <!-- 设置入口 -->
    <div class="footer">
      <a class="settings-link" @click="openOptions">⚙️ 设置</a>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { ModelConfig, StylePreset, PageContext, GenerateReplyResultMessage } from '@/types'
import { MessageType } from '@/types'
import {
  getModels, getActiveModelId, setActiveModelId,
  getStyles, getActiveStyleId, setActiveStyleId,
} from '@/utils/storage'
import { sendMessage } from '@/utils/messaging'

const models = ref<ModelConfig[]>([])
const styles = ref<StylePreset[]>([])
const activeModelId = ref('')
const activeStyleId = ref('')
const isXhsPage = ref(false)
const loading = ref(false)
const result = ref('')
const status = ref('')
const statusType = ref<'info' | 'error'>('info')
let pageContext: PageContext | null = null

/** 向当前 tab 的 content script 提取页面上下文 */
async function fetchPageContext(): Promise<PageContext | null> {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (!tab?.id || !tab.url?.includes('xiaohongshu.com')) return null

    // 先尝试直接发送消息
    return await new Promise<PageContext | null>((resolve) => {
      chrome.tabs.sendMessage(
        tab.id!,
        { type: MessageType.EXTRACT_CONTEXT },
        (resp: PageContext | null) => {
          if (chrome.runtime.lastError) {
            // content script 未加载，尝试注入后重试
            resolve(null)
          } else {
            resolve(resp ?? null)
          }
        },
      )
    }).then(async (ctx) => {
      if (ctx) return ctx
      // content script 可能未加载，用 scripting API 注入后重试
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id! },
          files: ['src/content/index.ts'],
        })
        // 注入后等待脚本初始化
        await new Promise((r) => setTimeout(r, 500))
        return await new Promise<PageContext | null>((resolve) => {
          chrome.tabs.sendMessage(
            tab.id!,
            { type: MessageType.EXTRACT_CONTEXT },
            (resp: PageContext | null) => {
              if (chrome.runtime.lastError) resolve(null)
              else resolve(resp ?? null)
            },
          )
        })
      } catch {
        return null
      }
    })
  } catch {
    return null
  }
}

onMounted(async () => {
  models.value = await getModels()
  styles.value = await getStyles()
  activeModelId.value = await getActiveModelId()
  activeStyleId.value = await getActiveStyleId()

  // 检查当前 tab 是否是小红书
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    isXhsPage.value = !!tab?.url?.includes('xiaohongshu.com')

    if (isXhsPage.value) {
      pageContext = await fetchPageContext()
      if (pageContext) {
        status.value = `已识别笔记：${pageContext.noteTitle.slice(0, 20)}...`
        statusType.value = 'info'
      } else {
        status.value = '正在连接页面，点击生成时会自动重试...'
        statusType.value = 'info'
      }
    }
  } catch {
    isXhsPage.value = false
  }
})

function onModelChange() {
  setActiveModelId(activeModelId.value)
}

function selectStyle(id: string) {
  activeStyleId.value = id
  setActiveStyleId(id)
}

async function generate() {
  // 如果还没获取到上下文，重试提取
  if (!pageContext) {
    status.value = '正在提取页面内容...'
    statusType.value = 'info'
    pageContext = await fetchPageContext()
  }

  if (!pageContext) {
    status.value = '未获取到页面内容，请确认已打开小红书笔记页面后刷新重试'
    statusType.value = 'error'
    return
  }

  const comments = pageContext.comments
  if (comments.length === 0) {
    status.value = '未找到评论'
    statusType.value = 'error'
    return
  }

  // 默认回复最新的一条评论
  const target = { username: comments[0].username, content: comments[0].content }

  loading.value = true
  result.value = ''
  status.value = ''

  try {
    const resp = await sendMessage<GenerateReplyResultMessage['payload']>({
      type: MessageType.GENERATE_REPLY,
      payload: {
        context: {
          ...pageContext,
          comments: pageContext.comments.map(({ username, content, time }) => ({ username, content, time })),
        },
        target,
        styleId: activeStyleId.value,
      },
    })

    if (resp.error) {
      status.value = resp.error
      statusType.value = 'error'
    } else {
      result.value = resp.reply
    }
  } catch (e) {
    status.value = e instanceof Error ? e.message : '生成失败'
    statusType.value = 'error'
  } finally {
    loading.value = false
  }
}

async function fillReply() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (tab?.id) {
    chrome.tabs.sendMessage(tab.id, {
      type: MessageType.FILL_REPLY,
      payload: { text: result.value },
    })
  }
}

async function copyReply() {
  try {
    await navigator.clipboard.writeText(result.value)
    status.value = '已复制到剪贴板'
    statusType.value = 'info'
  } catch {
    status.value = '复制失败'
    statusType.value = 'error'
  }
}

function openOptions() {
  chrome.runtime.openOptionsPage()
}
</script>

<style>
* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  width: 360px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  font-size: 14px;
  color: #333;
}

.popup { padding: 16px; }

.header { text-align: center; margin-bottom: 16px; }
.header h1 { font-size: 18px; color: #ff4757; }

.notice {
  text-align: center;
  color: #999;
  padding: 20px 0;
}

.section { margin-bottom: 14px; }

.label {
  display: block;
  font-size: 12px;
  color: #666;
  margin-bottom: 6px;
  font-weight: 500;
}

.select {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 13px;
  outline: none;
}
.select:focus { border-color: #ff4757; }

.style-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}

.style-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 8px 4px;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  background: #fafafa;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 12px;
}
.style-card:hover { border-color: #ff4757; }
.style-card.active {
  background: #fff0f0;
  border-color: #ff4757;
  color: #ff4757;
}
.style-card .emoji { font-size: 20px; }

.generate-btn {
  width: 100%;
  padding: 10px;
  background: linear-gradient(135deg, #ff4757, #ff6b81);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  font-weight: 500;
}
.generate-btn:hover { opacity: 0.9; }
.generate-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.status {
  font-size: 12px;
  padding: 6px 8px;
  border-radius: 4px;
  margin-bottom: 10px;
}
.status.info { color: #666; background: #f5f5f5; }
.status.error { color: #ff4757; background: #fff0f0; }

.result {
  margin-top: 12px;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  overflow: hidden;
}
.result-text {
  padding: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
  background: #f8f9fa;
}
.action-row {
  display: flex;
  border-top: 1px solid #e8e8e8;
}
.action-btn {
  flex: 1;
  padding: 8px;
  border: none;
  background: #fff;
  cursor: pointer;
  font-size: 13px;
  transition: background 0.2s;
}
.action-btn:hover { background: #f0f0f0; }
.action-btn + .action-btn { border-left: 1px solid #e8e8e8; }

.footer {
  text-align: center;
  margin-top: 14px;
  padding-top: 10px;
  border-top: 1px solid #f0f0f0;
}
.settings-link {
  color: #999;
  font-size: 12px;
  cursor: pointer;
  text-decoration: none;
}
.settings-link:hover { color: #ff4757; }
</style>
