<template>
  <div class="reply-panel">
    <div class="panel-header">
      <span class="panel-title">✨ 神回复</span>
      <button class="close-btn" @click="$emit('close')">✕</button>
    </div>

    <!-- 目标评论 -->
    <div class="target-comment">
      <span class="username">@{{ comment.username }}</span>：{{ comment.content }}
    </div>

    <!-- 风格选择 -->
    <div class="style-tabs">
      <button
        v-for="style in styles"
        :key="style.id"
        :class="['style-tab', { active: activeStyleId === style.id }]"
        @click="activeStyleId = style.id"
      >
        {{ style.emoji }} {{ style.name }}
      </button>
    </div>

    <!-- 生成按钮 -->
    <button class="generate-btn" :disabled="loading" @click="generate">
      {{ loading ? '生成中...' : result ? '🔄 重新生成' : '🚀 生成回复' }}
    </button>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading">⏳ AI 正在思考中...</div>

    <!-- 错误提示 -->
    <div v-if="error" class="error">❌ {{ error }}</div>

    <!-- 结果展示 -->
    <template v-if="result && !loading">
      <div class="result-area">{{ result }}</div>
      <div class="action-btns">
        <button class="action-btn primary" @click="fillReply">📝 填入评论框</button>
        <button class="action-btn" @click="copyReply">📋 复制</button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { PageContext, TargetComment, StylePreset, GenerateReplyResultMessage } from '@/types'
import { MessageType } from '@/types'
import { getStyles, getActiveStyleId } from '@/utils/storage'
import { sendMessage } from '@/utils/messaging'
import { fillReplyInput, copyToClipboard } from '@/content/reply-filler'

const props = defineProps<{
  comment: TargetComment
  context: PageContext
}>()

const emit = defineEmits<{
  close: []
}>()

const styles = ref<StylePreset[]>([])
const activeStyleId = ref('humorous')
const result = ref('')
const loading = ref(false)
const error = ref('')

onMounted(async () => {
  try {
    styles.value = await getStyles()
    activeStyleId.value = await getActiveStyleId()
  } catch {
    // 使用内联默认值
    styles.value = [
      { id: 'humorous', name: '幽默搞笑', emoji: '😂', systemPrompt: '', temperature: 0.9, maxTokens: 200, builtin: true },
      { id: 'professional', name: '专业知识', emoji: '🎓', systemPrompt: '', temperature: 0.6, maxTokens: 200, builtin: true },
      { id: 'empathetic', name: '温暖共情', emoji: '🤗', systemPrompt: '', temperature: 0.7, maxTokens: 200, builtin: true },
      { id: 'sharp', name: '毒舌犀利', emoji: '🔥', systemPrompt: '', temperature: 0.8, maxTokens: 200, builtin: true },
      { id: 'literary', name: '文艺诗意', emoji: '🌸', systemPrompt: '', temperature: 0.8, maxTokens: 200, builtin: true },
    ]
  }
})

async function generate() {
  loading.value = true
  error.value = ''
  result.value = ''

  try {
    const response = await sendMessage<GenerateReplyResultMessage['payload']>({
      type: MessageType.GENERATE_REPLY,
      payload: {
        context: {
          ...props.context,
          comments: props.context.comments.map(({ username, content, time }) => ({
            username,
            content,
            time,
          })),
        },
        target: props.comment,
        styleId: activeStyleId.value,
      },
    })

    if (response.error) {
      error.value = response.error
    } else {
      result.value = response.reply
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : '生成失败，请重试'
  } finally {
    loading.value = false
  }
}

function fillReply() {
  if (!result.value) return
  const ok = fillReplyInput(result.value)
  if (!ok) {
    error.value = '未找到评论输入框，已复制到剪贴板'
    copyToClipboard(result.value)
  }
}

async function copyReply() {
  if (!result.value) return
  const ok = await copyToClipboard(result.value)
  if (ok) {
    // 简单反馈：按钮闪烁
    error.value = ''
  } else {
    error.value = '复制失败'
  }
}
</script>
