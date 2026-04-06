document.addEventListener('DOMContentLoaded', () => {
  const statusIcon = document.getElementById('statusIcon') as HTMLDivElement
  const statusText = document.getElementById('statusText') as HTMLDivElement
  const statusCard = document.getElementById('statusCard') as HTMLDivElement

  // Check config status
  chrome.storage.sync.get(['apiKey'], (items) => {
    if (items.apiKey) {
      statusIcon.textContent = '✅'
      statusText.textContent = '已配置，可正常使用'
      statusCard.classList.add('ok')
    } else {
      statusIcon.textContent = '⚠️'
      statusText.textContent = '未配置 API Key'
      statusCard.classList.add('warn')
    }
  })

  // Open options page
  document.getElementById('btnSettings')?.addEventListener('click', () => {
    chrome.runtime.openOptionsPage()
  })

  // Open debug page
  document.getElementById('btnDebug')?.addEventListener('click', () => {
    const url = chrome.runtime.getURL('src/options/index.html#debug')
    chrome.tabs.create({ url })
  })
})
