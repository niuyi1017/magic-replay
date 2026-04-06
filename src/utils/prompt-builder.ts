import type { PageContext, StylePreset, TargetComment } from '@/types'

/**
 * 构建 system prompt
 */
export function buildSystemPrompt(style: StylePreset, globalPrompt: string): string {
  let prompt = style.systemPrompt
  if (globalPrompt) {
    prompt += '\n\n' + globalPrompt
  }
  prompt +=
    '\n\n注意事项：\n- 直接输出回复内容，不要带引号或前缀\n- 不要说"作为AI"之类的话\n- 用自然的口语化表达\n- 回复要符合小红书的社区氛围'
  return prompt
}

/**
 * 构建 user prompt
 */
export function buildUserPrompt(context: PageContext, target: TargetComment): string {
  const parts: string[] = []

  parts.push(`## 笔记信息`)
  parts.push(`标题：${context.noteTitle}`)

  // 截断过长正文
  const content =
    context.noteContent.length > 500
      ? context.noteContent.slice(0, 500) + '...(已截断)'
      : context.noteContent
  parts.push(`正文：${content}`)
  parts.push(`作者：${context.noteAuthor}`)

  // 最多取最近 10 条评论作为上下文
  if (context.comments.length > 0) {
    parts.push(`\n## 已有评论（最近 ${Math.min(context.comments.length, 10)} 条）`)
    context.comments.slice(0, 10).forEach((c) => {
      parts.push(`- ${c.username}：${c.content}`)
    })
  }

  parts.push(`\n## 需要回复的评论`)
  parts.push(`${target.username}：${target.content}`)

  parts.push(`\n请生成一条精彩的回复：`)

  return parts.join('\n')
}
