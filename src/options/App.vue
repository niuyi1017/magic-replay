<template>
  <div class="options-page">
    <h1 class="page-title">✨ 小红书神回复 - 设置</h1>

    <!-- Tab 导航 -->
    <div class="tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        :class="['tab', { active: activeTab === tab.id }]"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Tab 1: API 配置 -->
    <div v-if="activeTab === 'api'" class="tab-content">
      <div class="card" v-for="(model, idx) in models" :key="model.id">
        <div class="card-header">
          <input v-model="model.label" class="input" placeholder="配置名称" />
          <button v-if="models.length > 1" class="delete-btn" @click="removeModel(idx)">🗑️</button>
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label>API 地址</label>
            <input v-model="model.baseURL" class="input" placeholder="https://api.openai.com/v1" />
          </div>
          <div class="form-group">
            <label>API Key</label>
            <input v-model="model.apiKey" class="input" type="password" placeholder="sk-..." />
          </div>
          <div class="form-group">
            <label>模型名称</label>
            <input v-model="model.modelName" class="input" placeholder="gpt-4o-mini" />
          </div>
          <div class="form-group">
            <button class="test-btn" :disabled="testing === idx" @click="testModel(idx)">
              {{ testing === idx ? '测试中...' : '🔗 测试连接' }}
            </button>
            <span v-if="testResults[idx]" :class="['test-result', testResults[idx]!.ok ? 'ok' : 'fail']">
              {{ testResults[idx]!.msg }}
            </span>
          </div>
        </div>
      </div>
      <button class="add-btn" @click="addModel">+ 添加模型配置</button>
    </div>

    <!-- Tab 2: 风格管理 -->
    <div v-if="activeTab === 'styles'" class="tab-content">
      <div class="card" v-for="(style, idx) in styles" :key="style.id">
        <div class="card-header">
          <div class="style-name-row">
            <input v-model="style.emoji" class="input emoji-input" maxlength="4" />
            <input v-model="style.name" class="input" placeholder="风格名称" />
          </div>
          <button v-if="!style.builtin" class="delete-btn" @click="removeStyle(idx)">🗑️</button>
          <span v-else class="builtin-badge">内置</span>
        </div>
        <div class="form-group">
          <label>System Prompt</label>
          <textarea v-model="style.systemPrompt" class="textarea" rows="3" placeholder="角色设定和指令..."></textarea>
        </div>
        <div class="form-row">
          <div class="form-group half">
            <label>Temperature ({{ style.temperature }})</label>
            <input v-model.number="style.temperature" type="range" min="0" max="1" step="0.1" class="range" />
          </div>
          <div class="form-group half">
            <label>Max Tokens</label>
            <input v-model.number="style.maxTokens" type="number" class="input" min="50" max="2000" />
          </div>
        </div>
      </div>
      <button class="add-btn" @click="addStyle">+ 添加自定义风格</button>
    </div>

    <!-- Tab 3: 高级设置 -->
    <div v-if="activeTab === 'advanced'" class="tab-content">
      <div class="card">
        <div class="form-group">
          <label>全局附加 System Prompt</label>
          <textarea
            v-model="globalSystemPrompt"
            class="textarea"
            rows="5"
            placeholder="在所有风格预设的 system prompt 之后追加的内容（可选）"
          ></textarea>
          <p class="hint">此内容会附加在每种风格的 System Prompt 末尾，所有风格共享。</p>
        </div>
      </div>
    </div>

    <!-- 保存按钮 -->
    <div class="save-bar">
      <span v-if="saved" class="save-status">✅ 已保存</span>
      <button class="save-btn" @click="save">💾 保存设置</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { ModelConfig, StylePreset } from '@/types'
import {
  getModels, setModels,
  getStyles, setStyles,
  getGlobalSystemPrompt, setGlobalSystemPrompt,
} from '@/utils/storage'

const tabs = [
  { id: 'api', label: '🤖 API 配置' },
  { id: 'styles', label: '🎨 风格管理' },
  { id: 'advanced', label: '⚙️ 高级设置' },
]

const activeTab = ref('api')
const models = ref<ModelConfig[]>([])
const styles = ref<StylePreset[]>([])
const globalSystemPrompt = ref('')
const saved = ref(false)
const testing = ref(-1)
const testResults = ref<Record<number, { ok: boolean; msg: string }>>({})

onMounted(async () => {
  models.value = await getModels()
  styles.value = await getStyles()
  globalSystemPrompt.value = await getGlobalSystemPrompt()
})

function addModel() {
  models.value.push({
    id: `model_${Date.now()}`,
    label: `新模型 ${models.value.length + 1}`,
    baseURL: 'https://api.openai.com/v1',
    apiKey: '',
    modelName: 'gpt-4o-mini',
  })
}

function removeModel(idx: number) {
  models.value.splice(idx, 1)
}

function addStyle() {
  styles.value.push({
    id: `style_${Date.now()}`,
    name: '自定义风格',
    emoji: '🌟',
    systemPrompt: '你是一个小红书评论达人，请用你独特的风格回复评论。回复要简短精炼，不超过100字。',
    temperature: 0.7,
    maxTokens: 200,
    builtin: false,
  })
}

function removeStyle(idx: number) {
  styles.value.splice(idx, 1)
}

async function testModel(idx: number) {
  const model = models.value[idx]
  if (!model.apiKey) {
    testResults.value[idx] = { ok: false, msg: '请先填写 API Key' }
    return
  }

  testing.value = idx
  testResults.value[idx] = undefined as any

  try {
    const url = `${model.baseURL.replace(/\/+$/, '')}/chat/completions`
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${model.apiKey}`,
      },
      body: JSON.stringify({
        model: model.modelName,
        messages: [{ role: 'user', content: '你好' }],
        max_tokens: 10,
      }),
    })

    if (resp.ok) {
      testResults.value[idx] = { ok: true, msg: '✅ 连接成功' }
    } else {
      const errText = await resp.text().catch(() => '')
      testResults.value[idx] = { ok: false, msg: `❌ 状态码 ${resp.status}: ${errText.slice(0, 100)}` }
    }
  } catch (e) {
    testResults.value[idx] = { ok: false, msg: `❌ 网络错误: ${e instanceof Error ? e.message : '未知'}` }
  } finally {
    testing.value = -1
  }
}

async function save() {
  await Promise.all([
    setModels(models.value),
    setStyles(styles.value),
    setGlobalSystemPrompt(globalSystemPrompt.value),
  ])
  saved.value = true
  setTimeout(() => { saved.value = false }, 2000)
}
</script>

<style>
* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  font-size: 14px;
  color: #333;
  background: #f5f5f5;
}

.options-page {
  max-width: 680px;
  margin: 0 auto;
  padding: 24px 20px 80px;
}

.page-title {
  font-size: 22px;
  color: #ff4757;
  margin-bottom: 20px;
  text-align: center;
}

.tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 20px;
  background: #fff;
  border-radius: 10px;
  padding: 4px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}

.tab {
  flex: 1;
  padding: 10px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.2s;
}
.tab:hover { background: #f0f0f0; }
.tab.active { background: #ff4757; color: #fff; }

.tab-content { animation: fadeIn 0.2s; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

.card {
  background: #fff;
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.style-name-row {
  display: flex;
  gap: 8px;
  flex: 1;
}

.emoji-input { width: 50px !important; text-align: center; font-size: 18px; }

.delete-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  padding: 4px 8px;
  border-radius: 4px;
}
.delete-btn:hover { background: #fff0f0; }

.builtin-badge {
  font-size: 11px;
  color: #999;
  background: #f0f0f0;
  padding: 2px 8px;
  border-radius: 10px;
  white-space: nowrap;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.form-group {
  margin-bottom: 10px;
}
.form-group label {
  display: block;
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.form-row {
  display: flex;
  gap: 12px;
}
.form-group.half { flex: 1; }

.input {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 13px;
  outline: none;
  transition: border-color 0.2s;
}
.input:focus { border-color: #ff4757; }

.textarea {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 13px;
  outline: none;
  resize: vertical;
  font-family: inherit;
}
.textarea:focus { border-color: #ff4757; }

.range { width: 100%; }

.hint {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.test-btn {
  padding: 6px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  font-size: 13px;
}
.test-btn:hover { border-color: #ff4757; color: #ff4757; }
.test-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.test-result { font-size: 12px; margin-left: 8px; }
.test-result.ok { color: #2ed573; }
.test-result.fail { color: #ff4757; }

.add-btn {
  width: 100%;
  padding: 12px;
  border: 2px dashed #e0e0e0;
  border-radius: 10px;
  background: transparent;
  cursor: pointer;
  font-size: 14px;
  color: #999;
  transition: all 0.2s;
}
.add-btn:hover { border-color: #ff4757; color: #ff4757; }

.save-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  border-top: 1px solid #e8e8e8;
  padding: 12px 20px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  z-index: 100;
}

.save-status {
  color: #2ed573;
  font-size: 13px;
}

.save-btn {
  padding: 10px 24px;
  background: linear-gradient(135deg, #ff4757, #ff6b81);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  font-weight: 500;
}
.save-btn:hover { opacity: 0.9; }
</style>
