(function () {
  'use strict';

  const BUTTON_FLAG = 'data-xhs-magic';

  // ========== DOM 读取 ==========

  function getPostContent() {
    const titleEl = document.querySelector('#detail-title .note-text') ||
      document.querySelector('.note-top .title');
    const descEl = document.querySelector('#detail-desc .note-text');

    const title = titleEl ? titleEl.textContent.trim() : '';
    const desc = descEl ? descEl.textContent.trim() : '';

    return title ? `${title}\n${desc}` : desc || document.title;
  }

  function getComments() {
    const comments = [];
    document.querySelectorAll('.parent-comment').forEach(parentEl => {
      // Top-level comment
      const topComment = extractComment(parentEl.querySelector(':scope > .comment-item'));
      if (topComment) comments.push(topComment);

      // Sub-replies
      parentEl.querySelectorAll('.comment-item-sub').forEach(subEl => {
        const sub = extractComment(subEl);
        if (sub) comments.push(sub);
      });
    });
    return comments;
  }

  function extractComment(el) {
    if (!el) return null;
    const nameEl = el.querySelector('.name');
    const contentEl = el.querySelector('.content .note-text');
    const tagEl = el.querySelector('.tag');
    const likeEl = el.querySelector('.like .count');

    return {
      username: nameEl ? nameEl.textContent.trim() : '匿名',
      content: contentEl ? contentEl.textContent.trim() : '',
      isAuthor: tagEl ? tagEl.textContent.includes('作者') : false,
      likes: likeEl ? likeEl.textContent.trim() : '0',
      element: el
    };
  }

  // ========== UI 注入 ==========

  function createMagicButton(text, onClick) {
    const btn = document.createElement('button');
    btn.className = 'xhs-magic-reply-btn';
    btn.setAttribute(BUTTON_FLAG, '1');
    btn.innerHTML = `<span class="btn-icon">⚡</span>${text}`;
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      onClick(btn);
    });
    return btn;
  }

  function injectCommentButtons() {
    document.querySelectorAll('.parent-comment').forEach(parentEl => {
      injectButtonForComment(parentEl.querySelector(':scope > .comment-item'));
      parentEl.querySelectorAll('.comment-item-sub').forEach(subEl => {
        injectButtonForComment(subEl);
      });
    });
  }

  function injectButtonForComment(commentEl) {
    if (!commentEl) return;
    if (commentEl.querySelector(`[${BUTTON_FLAG}]`)) return;

    const infoEl = commentEl.querySelector('.info') ||
      commentEl.querySelector('.right');
    if (!infoEl) return;

    const comment = extractComment(commentEl);
    if (!comment || !comment.content) return;

    const btn = createMagicButton('神回复', (btnEl) => {
      onMagicReply(comment, btnEl);
    });

    // Insert into the info/interactions area
    const interactionsEl = infoEl.querySelector('.interactions');
    if (interactionsEl) {
      interactionsEl.appendChild(btn);
    } else {
      infoEl.appendChild(btn);
    }
  }

  function injectPostButton() {
    const engageBar = document.querySelector('.engage-bar-container .engage-bar .input-box') ||
      document.querySelector('.engage-bar .input-box');
    if (!engageBar) return;
    if (engageBar.querySelector(`[${BUTTON_FLAG}="post"]`)) return;

    const btn = document.createElement('button');
    btn.className = 'xhs-magic-reply-post-btn';
    btn.setAttribute(BUTTON_FLAG, 'post');
    btn.innerHTML = '⚡ 神回复';
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      onMagicReply(null, btn);
    });

    engageBar.parentElement.appendChild(btn);
  }

  // ========== 浮窗 ==========

  function showModal(title) {
    // Remove existing modal
    closeModal();

    const overlay = document.createElement('div');
    overlay.className = 'xhs-magic-modal-overlay';
    overlay.id = 'xhs-magic-modal';
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });

    overlay.innerHTML = `
      <div class="xhs-magic-modal">
        <div class="xhs-magic-modal-header">
          <h3>⚡ ${title}</h3>
          <button class="xhs-magic-modal-close" id="xhs-modal-close">✕</button>
        </div>
        <div class="xhs-magic-modal-body" id="xhs-modal-body">
          <div class="xhs-magic-loading">
            <div class="spinner"></div>
            <div>正在生成神回复...</div>
          </div>
        </div>
        <div class="xhs-magic-modal-footer" id="xhs-modal-footer" style="display:none;"></div>
      </div>
    `;

    document.body.appendChild(overlay);

    document.getElementById('xhs-modal-close').addEventListener('click', closeModal);

    return { overlay };
  }

  function updateModalResult(reply, onUse, onRetry) {
    const body = document.getElementById('xhs-modal-body');
    const footer = document.getElementById('xhs-modal-footer');
    if (!body || !footer) return;

    body.innerHTML = `
      <div class="xhs-magic-result">
        <textarea id="xhs-reply-text">${escapeHtml(reply)}</textarea>
      </div>
    `;

    footer.style.display = 'flex';
    footer.innerHTML = `
      <button class="xhs-magic-btn xhs-magic-btn-ghost" id="xhs-btn-cancel">取消</button>
      <button class="xhs-magic-btn xhs-magic-btn-secondary" id="xhs-btn-retry">🔄 换一个</button>
      <button class="xhs-magic-btn xhs-magic-btn-primary" id="xhs-btn-use">✅ 使用此回复</button>
    `;

    document.getElementById('xhs-btn-cancel').addEventListener('click', closeModal);
    document.getElementById('xhs-btn-retry').addEventListener('click', onRetry);
    document.getElementById('xhs-btn-use').addEventListener('click', () => {
      const text = document.getElementById('xhs-reply-text').value;
      onUse(text);
    });
  }

  function updateModalError(errMsg, onRetry) {
    const body = document.getElementById('xhs-modal-body');
    const footer = document.getElementById('xhs-modal-footer');
    if (!body || !footer) return;

    body.innerHTML = `<div class="xhs-magic-error">❌ ${escapeHtml(errMsg)}</div>`;

    footer.style.display = 'flex';
    footer.innerHTML = `
      <button class="xhs-magic-btn xhs-magic-btn-ghost" id="xhs-btn-cancel">取消</button>
      <button class="xhs-magic-btn xhs-magic-btn-secondary" id="xhs-btn-retry">🔄 重试</button>
    `;

    document.getElementById('xhs-btn-cancel').addEventListener('click', closeModal);
    document.getElementById('xhs-btn-retry').addEventListener('click', onRetry);
  }

  function updateModalLoading() {
    const body = document.getElementById('xhs-modal-body');
    const footer = document.getElementById('xhs-modal-footer');
    if (!body || !footer) return;

    body.innerHTML = `
      <div class="xhs-magic-loading">
        <div class="spinner"></div>
        <div>正在重新生成...</div>
      </div>
    `;
    footer.style.display = 'none';
  }

  function closeModal() {
    const modal = document.getElementById('xhs-magic-modal');
    if (modal) modal.remove();
  }

  // ========== 核心逻辑 ==========

  let generating = false;

  async function onMagicReply(targetComment, btnEl) {
    if (generating) return;

    // Check config first
    try {
      const configResult = await sendMessage({ type: 'CHECK_CONFIG' });
      if (!configResult.configured) {
        alert('请先点击浏览器工具栏的「小红书神回复」图标，配置 API Key');
        return;
      }
    } catch {
      alert('插件通信异常，请刷新页面重试');
      return;
    }

    const postContent = getPostContent();
    const comments = getComments();

    const title = targetComment ? `回复：${targetComment.username}` : '生成神评论';

    showModal(title);

    function doGenerate() {
      generating = true;

      sendMessage({
        type: 'GENERATE_REPLY',
        postContent,
        comments: comments.map(c => ({
          username: c.username,
          content: c.content,
          isAuthor: c.isAuthor
        })),
        targetComment: targetComment ? {
          username: targetComment.username,
          content: targetComment.content
        } : null
      }).then(result => {
        generating = false;
        if (result.error) {
          updateModalError(result.error, () => {
            updateModalLoading();
            doGenerate();
          });
        } else {
          updateModalResult(
            result.reply,
            (text) => {
              fillReply(text, targetComment);
              closeModal();
            },
            () => {
              updateModalLoading();
              doGenerate();
            }
          );
        }
      }).catch(err => {
        generating = false;
        updateModalError(err.message || '生成失败，请重试', () => {
          updateModalLoading();
          doGenerate();
        });
      });
    }

    doGenerate();
  }

  // ========== 回复填入 ==========

  function fillReply(text, targetComment) {
    // If replying to a specific comment, first click its reply button
    if (targetComment && targetComment.element) {
      const replyBtn = targetComment.element.querySelector('.reply.icon-container') ||
        targetComment.element.querySelector('.reply');
      if (replyBtn) {
        replyBtn.click();
        // Wait a bit for the reply input to appear
        setTimeout(() => insertText(text), 300);
        return;
      }
    }

    insertText(text);
  }

  function insertText(text) {
    const textarea = document.getElementById('content-textarea');
    if (!textarea) {
      alert('找不到评论输入框，请手动粘贴：\n\n' + text);
      return;
    }

    // Focus and clear
    textarea.focus();
    textarea.textContent = '';

    // Set text
    textarea.textContent = text;

    // Trigger events for Vue reactivity
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    textarea.dispatchEvent(new Event('compositionend', { bubbles: true }));
    textarea.dispatchEvent(new Event('change', { bubbles: true }));

    // Also try execCommand for contenteditable
    try {
      document.execCommand('selectAll', false, null);
      document.execCommand('insertText', false, text);
    } catch {
      // Fallback already set via textContent
    }
  }

  // ========== 工具函数 ==========

  function sendMessage(msg) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(msg, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ========== 初始化 & 观察 ==========

  function init() {
    // Only run on note pages
    if (!isNotePage()) return;

    injectButtons();

    // Observe DOM changes for dynamically loaded comments
    const observer = new MutationObserver(debounce(() => {
      if (isNotePage()) {
        injectButtons();
      }
    }, 500));

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  function injectButtons() {
    injectCommentButtons();
    injectPostButton();
  }

  function isNotePage() {
    // Match note detail pages and explore pages with note popups
    return !!document.querySelector('.note-container') ||
      !!document.querySelector('#noteContainer') ||
      !!document.querySelector('.note-detail-mask');
  }

  function debounce(fn, delay) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  // Start
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
