import type { ToolDraft, ToolInput } from '../types/tool'

export const NAME_MAX = 30
export const DESCRIPTION_MAX = 80
export const ICON_MAX = 4

export interface ValidationResult {
  valid: boolean
  errors: Record<string, string>
}

export function normalizeUrl(input: string): string {
  const trimmed = input.trim()
  if (!trimmed) return ''
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

export function isHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value)
    return (parsed.protocol === 'http:' || parsed.protocol === 'https:') && parsed.hostname.length > 0
  } catch {
    return false
  }
}

/** 用于重复链接比对：protocol + host + path，忽略末尾斜杠差异 */
export function urlKey(value: string): string {
  try {
    const parsed = new URL(normalizeUrl(value))
    const path = parsed.pathname.replace(/\/+$/, '')
    return `${parsed.protocol}//${parsed.host}${path}${parsed.search}`.toLowerCase()
  } catch {
    return value.trim().toLowerCase()
  }
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function charLength(value: string): number {
  return Array.from(value).length
}

export function normalizeToolInput(raw: ToolInput | Record<string, unknown>): ToolDraft {
  return {
    name: text(raw.name),
    url: normalizeUrl(text(raw.url)),
    description: text(raw.description),
    category: text(raw.category),
    icon: text(raw.icon),
  }
}

export function validateToolInput(draft: ToolDraft): ValidationResult {
  const errors: Record<string, string> = {}

  if (!draft.name) {
    errors.name = '请输入工具名称'
  } else if (charLength(draft.name) > NAME_MAX) {
    errors.name = `名称最多 ${NAME_MAX} 个字符`
  }

  if (!draft.url) {
    errors.url = '请输入工具链接'
  } else if (!isHttpUrl(draft.url)) {
    errors.url = '仅支持 http/https 链接'
  }

  if (draft.description && charLength(draft.description) > DESCRIPTION_MAX) {
    errors.description = `描述最多 ${DESCRIPTION_MAX} 个字符`
  }

  if (!draft.category) {
    errors.category = '请选择分类'
  }

  if (draft.icon && charLength(draft.icon) > ICON_MAX) {
    errors.icon = `图标最多 ${ICON_MAX} 个字符`
  }

  return { valid: Object.keys(errors).length === 0, errors }
}
