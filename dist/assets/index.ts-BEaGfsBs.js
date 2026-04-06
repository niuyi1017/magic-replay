import{_ as e,a as t,c as n,d as r,f as i,g as a,l as o,m as s,n as c,o as l,p as u,s as d,u as f,v as p}from"./vue.runtime.esm-bundler-B6Qd6QMU.js";import{t as m}from"./types-ekCzNfEe.js";import{o as ee,r as te}from"./storage-BwCUPM4u.js";import{t as h}from"./messaging-CXeNLtfR.js";var g=[`.reply-input textarea`,`.comment-input textarea`,`[class*="commentInput"] textarea`,`[class*="reply"] textarea`,`[class*="comment"] [contenteditable="true"]`,`[contenteditable="true"]`,`textarea`];function _(){for(let e of g){let t=document.querySelector(e);if(t&&v(t))return t}return null}function v(e){return e.offsetParent!==null||e.offsetHeight>0||e.offsetWidth>0}function y(e,t){e.focus(),e instanceof HTMLTextAreaElement||e instanceof HTMLInputElement?(Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype,`value`)?.set||Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,`value`)?.set)?.call(e,t):e.hasAttribute(`contenteditable`)&&(e.textContent=t),e.dispatchEvent(new Event(`focus`,{bubbles:!0})),e.dispatchEvent(new Event(`compositionstart`,{bubbles:!0})),e.dispatchEvent(new InputEvent(`input`,{bubbles:!0,data:t,inputType:`insertText`})),e.dispatchEvent(new Event(`compositionend`,{bubbles:!0})),e.dispatchEvent(new Event(`change`,{bubbles:!0}))}function b(e){let t=_();return t?(y(t,e),!0):!1}async function x(e){try{return await navigator.clipboard.writeText(e),!0}catch{let t=document.createElement(`textarea`);t.value=e,t.style.cssText=`position:fixed;left:-9999px;top:-9999px;opacity:0`,document.body.appendChild(t),t.select();let n=document.execCommand(`copy`);return document.body.removeChild(t),n}}var S={class:`reply-panel`},C={class:`panel-header`},w={class:`target-comment`},T={class:`username`},E={class:`style-tabs`},D=[`onClick`],O=[`disabled`],k={key:0,class:`loading`},A={key:1,class:`error`},j={class:`result-area`},M=f({__name:`ReplyPanel`,props:{comment:{},context:{}},emits:[`close`],setup(r,{emit:c}){let f=r,g=a([]),_=a(`humorous`),v=a(``),y=a(!1),M=a(``);i(async()=>{try{g.value=await ee(),_.value=await te()}catch{g.value=[{id:`humorous`,name:`幽默搞笑`,emoji:`😂`,systemPrompt:``,temperature:.9,maxTokens:200,builtin:!0},{id:`professional`,name:`专业知识`,emoji:`🎓`,systemPrompt:``,temperature:.6,maxTokens:200,builtin:!0},{id:`empathetic`,name:`温暖共情`,emoji:`🤗`,systemPrompt:``,temperature:.7,maxTokens:200,builtin:!0},{id:`sharp`,name:`毒舌犀利`,emoji:`🔥`,systemPrompt:``,temperature:.8,maxTokens:200,builtin:!0},{id:`literary`,name:`文艺诗意`,emoji:`🌸`,systemPrompt:``,temperature:.8,maxTokens:200,builtin:!0}]}});async function N(){y.value=!0,M.value=``,v.value=``;try{let e=await h({type:m.GENERATE_REPLY,payload:{context:{...f.context,comments:f.context.comments.map(({username:e,content:t,time:n})=>({username:e,content:t,time:n}))},target:f.comment,styleId:_.value}});e.error?M.value=e.error:v.value=e.reply}catch(e){M.value=e instanceof Error?e.message:`生成失败，请重试`}finally{y.value=!1}}function P(){v.value&&(b(v.value)||(M.value=`未找到评论输入框，已复制到剪贴板`,x(v.value)))}async function F(){v.value&&(await x(v.value)?M.value=``:M.value=`复制失败`)}return(i,a)=>(u(),n(`div`,S,[l(`div`,C,[a[1]||=l(`span`,{class:`panel-title`},`✨ 神回复`,-1),l(`button`,{class:`close-btn`,onClick:a[0]||=e=>i.$emit(`close`)},`✕`)]),l(`div`,w,[l(`span`,T,`@`+p(r.comment.username),1),o(`：`+p(r.comment.content),1)]),l(`div`,E,[(u(!0),n(t,null,s(g.value,t=>(u(),n(`button`,{key:t.id,class:e([`style-tab`,{active:_.value===t.id}]),onClick:e=>_.value=t.id},p(t.emoji)+` `+p(t.name),11,D))),128))]),l(`button`,{class:`generate-btn`,disabled:y.value,onClick:N},p(y.value?`生成中...`:v.value?`🔄 重新生成`:`🚀 生成回复`),9,O),y.value?(u(),n(`div`,k,`⏳ AI 正在思考中...`)):d(``,!0),M.value?(u(),n(`div`,A,`❌ `+p(M.value),1)):d(``,!0),v.value&&!y.value?(u(),n(t,{key:2},[l(`div`,j,p(v.value),1),l(`div`,{class:`action-btns`},[l(`button`,{class:`action-btn primary`,onClick:P},`📝 填入评论框`),l(`button`,{class:`action-btn`,onClick:F},`📋 复制`)])],64)):d(``,!0)]))}});function N(){return document.querySelector(`#noteContainer`)??document}var P={noteTitle:[`#detail-title`,`.title`,`[class*="title"]`],noteContent:[`#detail-desc .note-text`,`#detail-desc`,`.note-text`,`.desc`],noteAuthor:[`.author-wrapper .username`,`.user-name`,`[class*="author"] [class*="name"]`],commentItem:[`.comment-item`,`[class*="comment-item"]`,`[class*="commentItem"]`],commentUser:[`.name`,`.user-name`,`[class*="name"]`],commentContent:[`.content`,`.text`,`[class*="content"]`],commentTime:[`.time`,`.date`,`[class*="time"]`]};function F(e,t){for(let n of t){let t=e.querySelector(n);if(t)return t}return null}function ne(e,t){for(let n of t){let t=e.querySelectorAll(n);if(t.length>0)return Array.from(t)}return[]}function I(e){return e?(e.textContent??``).trim():``}function L(){return I(F(N(),P.noteTitle))||`未获取到标题`}function re(){return I(F(N(),P.noteContent))||`未获取到正文`}function ie(){return I(F(N(),P.noteAuthor))||`未知作者`}function R(){return ne(N(),P.commentItem).map(e=>({username:I(F(e,P.commentUser))||`匿名`,content:I(F(e,P.commentContent))||``,time:I(F(e,P.commentTime)),element:e}))}function z(){return{noteTitle:L(),noteContent:re(),noteAuthor:ie(),comments:R(),url:window.location.href}}function B(){if(document.querySelector(`#noteContainer`))return!0;let e=window.location.href;return/xiaohongshu\.com\/(explore|discovery\/item)\//.test(e)||document.querySelector(`[class*="note-detail"], [class*="noteDetail"]`)!==null}var V=null,H=null,U=``;function W(e,t){V||(U=window.location.href,V=new MutationObserver(()=>{let n=window.location.href;if(n!==U){U=n,t();return}H&&clearTimeout(H),H=setTimeout(e,300)}),V.observe(document.body,{childList:!0,subtree:!0}))}var G=new WeakSet,K=[];function q(){R().forEach(e=>{if(!e.element||G.has(e.element))return;G.add(e.element);let t=document.createElement(`button`);t.className=`xhs-auto-reply-btn`,t.textContent=`💬 神回复`,t.title=`生成 AI 神回复`,t.addEventListener(`click`,n=>{n.stopPropagation(),n.preventDefault(),J(e,t)}),e.element.style.position=`relative`,e.element.appendChild(t)})}function J(e,t){let n=t.parentElement?.querySelector(`.xhs-reply-panel-host`);if(n){n.remove();return}document.querySelectorAll(`.xhs-reply-panel-host`).forEach(e=>e.remove());let i=z(),a=document.createElement(`div`);a.className=`xhs-reply-panel-host`;let o=a.attachShadow({mode:`open`}),s=document.createElement(`style`);s.textContent=ae(),o.appendChild(s);let l=document.createElement(`div`);o.appendChild(l);let u=c({render(){return r(M,{comment:{username:e.username,content:e.content},context:i,onClose:()=>{u.unmount(),a.remove()}})}});u.mount(l),K.push(u),t.parentElement?.appendChild(a)}function Y(){K.forEach(e=>{try{e.unmount()}catch{}}),K.length=0,document.querySelectorAll(`.xhs-auto-reply-btn, .xhs-reply-panel-host`).forEach(e=>e.remove())}function ae(){return`
    * { box-sizing: border-box; margin: 0; padding: 0; }

    .reply-panel {
      background: #fff;
      border: 1px solid #e8e8e8;
      border-radius: 12px;
      padding: 16px;
      margin-top: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 14px;
      color: #333;
      position: relative;
      z-index: 9999;
      max-width: 480px;
    }

    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .panel-title {
      font-size: 15px;
      font-weight: 600;
      color: #333;
    }

    .close-btn {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 18px;
      color: #999;
      padding: 4px;
      line-height: 1;
    }
    .close-btn:hover { color: #333; }

    .style-tabs {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
      margin-bottom: 12px;
    }

    .style-tab {
      padding: 4px 12px;
      border: 1px solid #e0e0e0;
      border-radius: 20px;
      background: #fafafa;
      cursor: pointer;
      font-size: 13px;
      transition: all 0.2s;
      white-space: nowrap;
    }
    .style-tab:hover { border-color: #ff4757; color: #ff4757; }
    .style-tab.active {
      background: #ff4757;
      color: #fff;
      border-color: #ff4757;
    }

    .generate-btn {
      width: 100%;
      padding: 10px;
      background: linear-gradient(135deg, #ff4757, #ff6b81);
      color: #fff;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: opacity 0.2s;
    }
    .generate-btn:hover { opacity: 0.9; }
    .generate-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .result-area {
      margin-top: 12px;
      padding: 12px;
      background: #f8f9fa;
      border-radius: 8px;
      line-height: 1.6;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .action-btns {
      display: flex;
      gap: 8px;
      margin-top: 10px;
    }

    .action-btn {
      flex: 1;
      padding: 8px;
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      background: #fff;
      cursor: pointer;
      font-size: 13px;
      transition: all 0.2s;
      text-align: center;
    }
    .action-btn:hover { border-color: #ff4757; color: #ff4757; }
    .action-btn.primary {
      background: #ff4757;
      color: #fff;
      border-color: #ff4757;
    }
    .action-btn.primary:hover { opacity: 0.9; }

    .loading {
      text-align: center;
      padding: 20px;
      color: #999;
    }

    .error {
      color: #ff4757;
      padding: 8px;
      font-size: 13px;
    }

    .target-comment {
      font-size: 13px;
      color: #666;
      margin-bottom: 12px;
      padding: 8px;
      background: #f5f5f5;
      border-radius: 6px;
      border-left: 3px solid #ff4757;
    }
    .target-comment .username { font-weight: 600; color: #333; }
  `}var oe=`modulepreload`,se=function(e){return`/`+e},X={},Z=function(e,t,n){let r=Promise.resolve();if(t&&t.length>0){let e=document.getElementsByTagName(`link`),i=document.querySelector(`meta[property=csp-nonce]`),a=i?.nonce||i?.getAttribute(`nonce`);function o(e){return Promise.all(e.map(e=>Promise.resolve(e).then(e=>({status:`fulfilled`,value:e}),e=>({status:`rejected`,reason:e}))))}r=o(t.map(t=>{if(t=se(t,n),t in X)return;X[t]=!0;let r=t.endsWith(`.css`),i=r?`[rel="stylesheet"]`:``;if(n)for(let n=e.length-1;n>=0;n--){let i=e[n];if(i.href===t&&(!r||i.rel===`stylesheet`))return}else if(document.querySelector(`link[href="${t}"]${i}`))return;let o=document.createElement(`link`);if(o.rel=r?`stylesheet`:oe,r||(o.as=`script`),o.crossOrigin=``,o.href=t,a&&o.setAttribute(`nonce`,a),document.head.appendChild(o),r)return new Promise((e,n)=>{o.addEventListener(`load`,e),o.addEventListener(`error`,()=>n(Error(`Unable to preload CSS for ${t}`)))})}))}function i(e){let t=new Event(`vite:preloadError`,{cancelable:!0});if(t.payload=e,window.dispatchEvent(t),!t.defaultPrevented)throw e}return r.then(t=>{for(let e of t||[])e.status===`rejected`&&i(e.reason);return e().catch(i)})},Q=!1;function $(){B()&&(Q||(Q=!0,setTimeout(()=>{q()},1e3),W(()=>{B()&&q()},()=>{Y(),Q=!1,setTimeout($,500)})))}chrome.runtime.onMessage.addListener((e,t,n)=>{switch(e.type){case m.EXTRACT_CONTEXT:n(z());break;case m.FILL_REPLY:n(b(e.payload.text));break;case m.COPY_REPLY:return x(e.payload.text).then(n),!0;case m.CONTEXT_MENU_TRIGGER:{let t=e.payload.selectionText;if(t){let e=window.getSelection();e&&e.rangeCount>0&&ce(t,e.getRangeAt(0).getBoundingClientRect())}break}}});async function ce(e,t){document.querySelectorAll(`.xhs-reply-panel-host`).forEach(e=>e.remove());let{createApp:n,h:r}=await Z(async()=>{let{createApp:e,h:t}=await import(`./vue.runtime.esm-bundler-B6Qd6QMU.js`).then(e=>e.t);return{createApp:e,h:t}},[]),i=(await Z(async()=>{let{default:e}=await import(`./ReplyPanel-pfHBxgdd.js`);return{default:e}},[])).default,a=z(),o=document.createElement(`div`);o.className=`xhs-reply-panel-host`,o.style.cssText=`position:fixed;left:${t.left}px;top:${t.bottom+8}px;z-index:99999;`;let s=o.attachShadow({mode:`open`}),c=document.createElement(`style`);c.textContent=le(),s.appendChild(c);let l=document.createElement(`div`);s.appendChild(l);let u=n({render(){return r(i,{comment:{username:`选中文本`,content:e},context:a,onClose:()=>{u.unmount(),o.remove()}})}});u.mount(l),document.body.appendChild(o)}function le(){return`
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .reply-panel { background:#fff;border:1px solid #e8e8e8;border-radius:12px;padding:16px;
      box-shadow:0 4px 20px rgba(0,0,0,0.15);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
      font-size:14px;color:#333;max-width:480px;min-width:320px; }
    .panel-header { display:flex;justify-content:space-between;align-items:center;margin-bottom:12px; }
    .panel-title { font-size:15px;font-weight:600; }
    .close-btn { background:none;border:none;cursor:pointer;font-size:18px;color:#999;padding:4px; }
    .close-btn:hover { color:#333; }
    .style-tabs { display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px; }
    .style-tab { padding:4px 12px;border:1px solid #e0e0e0;border-radius:20px;background:#fafafa;cursor:pointer;
      font-size:13px;transition:all 0.2s;white-space:nowrap; }
    .style-tab:hover { border-color:#ff4757;color:#ff4757; }
    .style-tab.active { background:#ff4757;color:#fff;border-color:#ff4757; }
    .generate-btn { width:100%;padding:10px;background:linear-gradient(135deg,#ff4757,#ff6b81);color:#fff;border:none;
      border-radius:8px;font-size:14px;cursor:pointer; }
    .generate-btn:hover { opacity:0.9; }
    .generate-btn:disabled { opacity:0.5;cursor:not-allowed; }
    .result-area { margin-top:12px;padding:12px;background:#f8f9fa;border-radius:8px;line-height:1.6;white-space:pre-wrap;word-break:break-word; }
    .action-btns { display:flex;gap:8px;margin-top:10px; }
    .action-btn { flex:1;padding:8px;border:1px solid #e0e0e0;border-radius:6px;background:#fff;cursor:pointer;
      font-size:13px;text-align:center; }
    .action-btn:hover { border-color:#ff4757;color:#ff4757; }
    .action-btn.primary { background:#ff4757;color:#fff;border-color:#ff4757; }
    .loading { text-align:center;padding:20px;color:#999; }
    .error { color:#ff4757;padding:8px;font-size:13px; }
    .target-comment { font-size:13px;color:#666;margin-bottom:12px;padding:8px;background:#f5f5f5;
      border-radius:6px;border-left:3px solid #ff4757; }
    .target-comment .username { font-weight:600;color:#333; }
  `}document.readyState===`loading`?document.addEventListener(`DOMContentLoaded`,$):$(),W(()=>{!Q&&B()&&$()},()=>{Y(),Q=!1,setTimeout($,500)});export{M as t};