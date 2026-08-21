export interface CommentTextPart {
  type: 'text' | 'mention'
  content: string
  userId?: string
}

const MENTION_REGEX = /@\[([^\]]+)\]\(([^)]+)\)/g

export function parseCommentMentions(text: string): CommentTextPart[] {
  const parts: CommentTextPart[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  MENTION_REGEX.lastIndex = 0
  while ((match = MENTION_REGEX.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.slice(lastIndex, match.index) })
    }
    parts.push({ type: 'mention', content: match[1], userId: match[2] })
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.slice(lastIndex) })
  }

  return parts
}

export function extractMentionIds(text: string): string[] {
  const ids = new Set<string>()
  for (const part of parseCommentMentions(text)) {
    if (part.type === 'mention' && part.userId) ids.add(part.userId)
  }
  return Array.from(ids)
}
