import type { ExtensionConfig, DebugLogEntry } from '@/types'
import { DEFAULT_CONFIG } from '@/types'

// ========== DOM Elements ==========
const $apiBase = document.getElementById('apiBase') as HTMLInputElement
const $apiKey = document.getElementById('apiKey') as HTMLInputElement
const $model = document.getElementById('model') as HTMLInputElement
const $temperature = document.getElementById('temperature') as HTMLInputElement
const $temperatureValue = document.getElementById('temperatureValue')!
const $maxTokens = document.getElementById('maxTokens') as HTMLInputElement
const $customStyle = document.getElementById('customStyle') as HTMLTextAreaElement
const $customStyleField = document.getElementById('customStyleField')!
const $status = document.getElementById('status')!
const $form = document.getElementById('settingsForm') as HTMLFormElement
const $toggleKey = document.getElementById('toggleKey')!
const $btnTest = document.getElementById('btnTest')!
const $btnRefreshDebug = document.getElementById('btnRefreshDebug')!
const $btnClearLogs = document.getElementById('btnClearLogs')!
const $debugConfig = document.getElementById('debugConfig')!
const $logFilter = document.getElementById('logFilter') as HTMLSelectElement
const $logCount = document.getElementById('logCount')!
const $logContainer = document.getElementById('logContainer')!

let allLogs: DebugLogEntry[] = []

// ========== Tab Switching ==========
function initTabs() {
  const navItems = document.querySelectorAll('.nav-item')
  const panels = document.querySelectorAll('.tab-panel')

  function switchTab(tab: string) {
    navItems.forEach((n) => n.classList.toggle('active', n.getAttribute('data-tab') === tab))
    panels.forEach((p) => p.classList.toggle('active', p.id === `tab-${tab}`))
    if (tab === 'debug') loadDebugInfo()
  }

  navItems.forEach((item) => {
    item.addEventListener('click', () => {
      const tab = item.getAttribute('data-tab')
      if (tab) switchTab(tab)
    })
  })

  // Support hash-based navigation (from popup)
  const hash = location.hash.replace('#', '')
  if (hash === 'debug') switchTab('debug')
}

// ========== Settings ==========
async function loadSettings() {
  const config = await chrome.storage.sync.get(DEFAULT_CONFIG) as ExtensionConfig
  $apiBase.value = config.apiBase
  $apiKey.value = config.apiKey
  $model.value = config.model

  // Load advanced settings
  const advanced = await chrome.storage.sync.get({ temperature: 0.9, maxTokens: 200 })
  $temperature.value = String(advanced.temperature)
  $temperatureValue.textContent = String(advanced.temperature)
  $maxTokens.value = String(advanced.maxTokens)

  // Style radio
  const radios = document.querySelectorAll<HTMLInputElement>('input[name="style"]')
  radios.forEach((r) => (r.checked = r.value === config.style))
  $customStyle.value = config.customStyle
  $customStyleField.style.display = config.style === 'custom' ? '' : 'none'
}

function saveSettings() {
  const style = (document.querySelector<HTMLInputElement>('input[name="style"]:checked'))?.value || '幽默搞笑'
  const config: ExtensionConfig = {
    apiBase: $apiBase.value.replace(/\/+$/, '') || DEFAULT_CONFIG.apiBase,
    apiKey: $apiKey.value.trim(),
    model: $model.value.trim() || DEFAULT_CONFIG.model,
    style,
    customStyle: $customStyle.value.trim(),
  }

  const advanced = {
    temperature: parseFloat($temperature.value) || 0.9,
    maxTokens: parseInt($maxTokens.value) || 200,
  }

  chrome.storage.sync.set({ ...config, ...advanced }, () => {
    showStatus('success', '✅ 设置已保存')
  })
}

function showStatus(type: 'success' | 'error', msg: string) {
  $status.textContent = msg
  $status.className = `status ${type}`
  setTimeout(() => {
    $status.textContent = ''
    $status.className = 'status'
  }, 3000)
}

// ========== Test Connection ==========
async function testConnection() {
  $btnTest.textContent = '⏳ 测试中...'
  ;($btnTest as HTMLButtonElement).disabled = true

  try {
    const config = await chrome.storage.sync.get(DEFAULT_CONFIG) as ExtensionConfig
    if (!config.apiKey) {
      showStatus('error', '❌ 请先填写 API Key')
      return
    }

    const apiUrl = `${config.apiBase.replace(/\/+$/, '')}/chat/completions`
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model || 'gpt-4o-mini',
        messages: [{ role: 'user', content: '你好，请回复"连接成功"' }],
        max_tokens: 20,
      }),
    })

    if (!res.ok) {
      const body = await res.text()
      showStatus('error', `❌ API 返回 ${res.status}: ${body.slice(0, 100)}`)
      return
    }

    const data = await res.json()
    const reply = data.choices?.[0]?.message?.content?.trim() || ''
    showStatus('success', `✅ 连接成功！AI 回复：${reply.slice(0, 50)}`)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    showStatus('error', `❌ 连接失败：${msg}`)
  } finally {
    $btnTest.textContent = '🧪 测试连接'
    ;($btnTest as HTMLButtonElement).disabled = false
  }
}

// ========== Debug ==========
async function loadDebugInfo() {
  try {
    // Read directly from storage — no need to go through background service worker
    const config = await chrome.storage.sync.get(DEFAULT_CONFIG) as ExtensionConfig
    const maskedKey = config.apiKey
      ? `${config.apiKey.slice(0, 6)}***${config.apiKey.slice(-4)}`
      : '(未设置)'
    renderConfig({ ...config, apiKey: maskedKey })

    const { debugLogs = [] } = await chrome.storage.local.get('debugLogs')
    allLogs = (debugLogs as DebugLogEntry[]) || []
    renderLogs()

    const version = chrome.runtime.getManifest().version
    const footer = document.querySelector('.sidebar-footer')
    if (footer) footer.textContent = `v${version}`
  } catch (e) {
    console.error('[debug] loadDebugInfo failed:', e)
    $debugConfig.innerHTML = '<div class="config-row"><span class="config-key" style="color:#ff4d4f">加载失败</span></div>'
  }
}

function renderConfig(config: ExtensionConfig & { apiKey: string }) {
  const rows: Array<{ key: string; value: string; masked?: boolean }> = [
    { key: 'API Base', value: config.apiBase },
    { key: 'API Key', value: config.apiKey, masked: true },
    { key: '模型', value: config.model },
    { key: '回复风格', value: config.style },
  ]
  if (config.customStyle) {
    rows.push({ key: '自定义风格', value: config.customStyle })
  }

  $debugConfig.innerHTML = rows
    .map(
      (r) =>
        `<div class="config-row">
          <span class="config-key">${r.key}</span>
          <span class="config-value${r.masked ? ' masked' : ''}">${escapeHtml(r.value)}</span>
        </div>`,
    )
    .join('')
}

function renderLogs() {
  const filter = $logFilter.value
  const filtered = filter === 'all' ? allLogs : allLogs.filter((l) => l.level === filter)

  $logCount.textContent = `${filtered.length} 条记录`

  if (filtered.length === 0) {
    $logContainer.innerHTML = '<div class="log-empty">暂无日志</div>'
    return
  }

  $logContainer.innerHTML = filtered
    .map(
      (log) =>
        `<div class="log-entry">
          <span class="log-time">${log.time}</span>
          <span class="log-level ${log.level}">${log.level}</span>
          <div class="log-message">
            ${escapeHtml(log.message)}
            ${log.detail ? `<div class="log-detail">${escapeHtml(log.detail)}</div>` : ''}
          </div>
        </div>`,
    )
    .join('')

  // Scroll to bottom
  $logContainer.scrollTop = $logContainer.scrollHeight
}

async function clearLogs() {
  await chrome.storage.local.set({ debugLogs: [] })
  allLogs = []
  renderLogs()
}

function escapeHtml(str: string): string {
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}

// ========== Event Binding ==========
function init() {
  initTabs()
  loadSettings()

  // Form events
  $form.addEventListener('submit', (e) => {
    e.preventDefault()
    saveSettings()
  })

  $toggleKey.addEventListener('click', () => {
    $apiKey.type = $apiKey.type === 'password' ? 'text' : 'password'
  })

  $temperature.addEventListener('input', () => {
    $temperatureValue.textContent = $temperature.value
  })

  // Style radio → toggle custom field
  document.querySelectorAll<HTMLInputElement>('input[name="style"]').forEach((r) => {
    r.addEventListener('change', () => {
      $customStyleField.style.display = r.value === 'custom' ? '' : 'none'
    })
  })

  $btnTest.addEventListener('click', testConnection)
  $btnRefreshDebug.addEventListener('click', loadDebugInfo)
  $btnClearLogs.addEventListener('click', clearLogs)
  $logFilter.addEventListener('change', renderLogs)
}

init()
