import { randomUUID } from 'node:crypto'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'
import type { Tool, ToolDraft, ToolInput } from '../src/types/tool'
import { normalizeToolInput, urlKey, validateToolInput } from '../src/shared/toolSchema'

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export interface ToolMutation {
  tool: Tool
  tools: Tool[]
}

function isStoredTool(value: unknown): value is Tool {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.name === 'string' &&
    typeof candidate.url === 'string' &&
    typeof candidate.category === 'string' &&
    typeof candidate.createdAt === 'string' &&
    typeof candidate.updatedAt === 'string'
  )
}

export async function readTools(filePath: string): Promise<Tool[]> {
  let raw: string
  try {
    raw = await readFile(filePath, 'utf8')
  } catch {
    throw new ApiError(500, '数据文件不存在，请检查 src/data/tools.json')
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new ApiError(500, '数据文件不是合法 JSON，请检查 src/data/tools.json')
  }

  if (!Array.isArray(parsed) || !parsed.every(isStoredTool)) {
    throw new ApiError(500, '数据文件格式错误，应为工具对象数组')
  }
  return parsed
}

export async function writeTools(filePath: string, tools: Tool[]): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true })
  const tempPath = `${filePath}.tmp`
  await writeFile(tempPath, `${JSON.stringify(tools, null, 2)}\n`, 'utf8')
  await rename(tempPath, filePath)
}

function normalizeAndValidate(raw: ToolInput | Record<string, unknown>): ToolDraft {
  const draft = normalizeToolInput(raw)
  const { valid, errors } = validateToolInput(draft)
  if (!valid) {
    throw new ApiError(400, Object.values(errors)[0] ?? '工具信息不合法')
  }
  return draft
}

function assertUniqueUrl(tools: Tool[], url: string, ignoreId?: string): void {
  const key = urlKey(url)
  const conflict = tools.find((tool) => tool.id !== ignoreId && urlKey(tool.url) === key)
  if (conflict) {
    throw new ApiError(409, `该链接已注册为「${conflict.name}」`)
  }
}

function storedFields(draft: ToolDraft): Omit<Tool, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    name: draft.name,
    url: draft.url,
    category: draft.category,
    ...(draft.description ? { description: draft.description } : {}),
    ...(draft.icon ? { icon: draft.icon } : {}),
  }
}

export function createToolRecord(
  tools: Tool[],
  raw: ToolInput | Record<string, unknown>,
  now = new Date(),
): ToolMutation {
  const draft = normalizeAndValidate(raw)
  assertUniqueUrl(tools, draft.url)

  const timestamp = now.toISOString()
  const tool: Tool = {
    id: randomUUID(),
    ...storedFields(draft),
    createdAt: timestamp,
    updatedAt: timestamp,
  }
  return { tool, tools: [tool, ...tools] }
}

export function updateToolRecord(
  tools: Tool[],
  id: string,
  raw: ToolInput | Record<string, unknown>,
  now = new Date(),
): ToolMutation {
  const index = tools.findIndex((tool) => tool.id === id)
  if (index === -1) {
    throw new ApiError(404, '工具不存在或已被删除')
  }

  const draft = normalizeAndValidate(raw)
  assertUniqueUrl(tools, draft.url, id)

  const existing = tools[index]!
  const tool: Tool = {
    ...existing,
    ...storedFields(draft),
    updatedAt: now.toISOString(),
  }
  if (!draft.description) delete tool.description
  if (!draft.icon) delete tool.icon

  const next = tools.slice()
  next[index] = tool
  return { tool, tools: next }
}

export function deleteToolRecord(tools: Tool[], id: string): { tools: Tool[] } {
  const next = tools.filter((tool) => tool.id !== id)
  if (next.length === tools.length) {
    throw new ApiError(404, '工具不存在或已被删除')
  }
  return { tools: next }
}
