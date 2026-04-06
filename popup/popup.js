const DEFAULTS = {
  apiBase: 'https://api.openai.com/v1',
  apiKey: '',
  model: 'gpt-4o-mini',
  style: '幽默搞笑',
  customStyle: ''
};

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('settingsForm');
  const apiBase = document.getElementById('apiBase');
  const apiKey = document.getElementById('apiKey');
  const model = document.getElementById('model');
  const customStyleField = document.getElementById('customStyleField');
  const customStyle = document.getElementById('customStyle');
  const toggleKey = document.getElementById('toggleKey');
  const status = document.getElementById('status');

  // Load saved settings
  chrome.storage.sync.get(DEFAULTS, (items) => {
    apiBase.value = items.apiBase;
    apiKey.value = items.apiKey;
    model.value = items.model;
    customStyle.value = items.customStyle;

    const styleRadio = document.querySelector(`input[name="style"][value="${items.style}"]`);
    if (styleRadio) {
      styleRadio.checked = true;
    }
    toggleCustomStyle(items.style);
  });

  // Toggle API key visibility
  toggleKey.addEventListener('click', () => {
    apiKey.type = apiKey.type === 'password' ? 'text' : 'password';
  });

  // Show/hide custom style input
  document.querySelectorAll('input[name="style"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      toggleCustomStyle(e.target.value);
    });
  });

  function toggleCustomStyle(value) {
    customStyleField.style.display = value === 'custom' ? 'block' : 'none';
  }

  // Save settings
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const selectedStyle = document.querySelector('input[name="style"]:checked');
    if (!selectedStyle) {
      showStatus('请选择回复风格', 'error');
      return;
    }

    const settings = {
      apiBase: apiBase.value.trim().replace(/\/+$/, '') || DEFAULTS.apiBase,
      apiKey: apiKey.value.trim(),
      model: model.value.trim() || DEFAULTS.model,
      style: selectedStyle.value,
      customStyle: customStyle.value.trim()
    };

    if (!settings.apiKey) {
      showStatus('请填写 API Key', 'error');
      return;
    }

    chrome.storage.sync.set(settings, () => {
      showStatus('设置已保存 ✓', 'success');
    });
  });

  function showStatus(msg, type) {
    status.textContent = msg;
    status.className = 'status ' + type;
    setTimeout(() => {
      status.textContent = '';
      status.className = 'status';
    }, 2000);
  }
});
