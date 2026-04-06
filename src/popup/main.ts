import { DEFAULT_CONFIG } from '@/types'
import type { ExtensionConfig } from '@/types'

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('settingsForm') as HTMLFormElement
  const apiBase = document.getElementById('apiBase') as HTMLInputElement
  const apiKey = document.getElementById('apiKey') as HTMLInputElement
  const model = document.getElementById('model') as HTMLInputElement
  const customStyleField = document.getElementById(
    'customStyleField',
  ) as HTMLDivElement
  const customStyle = document.getElementById(
    'customStyle',
  ) as HTMLTextAreaElement
  const toggleKey = document.getElementById('toggleKey') as HTMLButtonElement
  const status = document.getElementById('status') as HTMLDivElement

  // Load saved settings
  chrome.storage.sync.get(DEFAULT_CONFIG, (items) => {
    const config = items as ExtensionConfig
    apiBase.value = config.apiBase
    apiKey.value = config.apiKey
    model.value = config.model
    customStyle.value = config.customStyle

    const styleRadio = document.querySelector(
      `input[name="style"][value="${config.style}"]`,
    ) as HTMLInputElement | null
    if (styleRadio) {
      styleRadio.checked = true
    }
    toggleCustomStyle(config.style)
  })

  // Toggle API key visibility
  toggleKey.addEventListener('click', () => {
    apiKey.type = apiKey.type === 'password' ? 'text' : 'password'
  })

  // Show/hide custom style input
  document.querySelectorAll<HTMLInputElement>('input[name="style"]').forEach((radio) => {
    radio.addEventListener('change', (e) => {
      toggleCustomStyle((e.target as HTMLInputElement).value)
    })
  })

  function toggleCustomStyle(value: string): void {
    customStyleField.style.display = value === 'custom' ? 'block' : 'none'
  }

  // Save settings
  form.addEventListener('submit', (e) => {
    e.preventDefault()

    const selectedStyle = document.querySelector(
      'input[name="style"]:checked',
    ) as HTMLInputElement | null
    if (!selectedStyle) {
      showStatus('请选择回复风格', 'error')
      return
    }

    const settings: ExtensionConfig = {
      apiBase:
        apiBase.value.trim().replace(/\/+$/, '') || DEFAULT_CONFIG.apiBase,
      apiKey: apiKey.value.trim(),
      model: model.value.trim() || DEFAULT_CONFIG.model,
      style: selectedStyle.value,
      customStyle: customStyle.value.trim(),
    }

    if (!settings.apiKey) {
      showStatus('请填写 API Key', 'error')
      return
    }

    chrome.storage.sync.set(settings, () => {
      showStatus('设置已保存 ✓', 'success')
    })
  })

  function showStatus(msg: string, type: 'success' | 'error'): void {
    status.textContent = msg
    status.className = 'status ' + type
    setTimeout(() => {
      status.textContent = ''
      status.className = 'status'
    }, 2000)
  }
})
