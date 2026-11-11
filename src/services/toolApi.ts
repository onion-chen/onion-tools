import type { Tool, ToolInput } from '@/types/tool'
import seedTools from '@/data/tools.json'

const API_BASE = '/api/tools'

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message
  return '操作失败，请稍后重试'
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
    })
  } catch {
    throw new ApiError(0, '无法连接本地开发服务，请确认 npm run dev 正在运行')
  }

  if (!response.ok) {
    let message = `请求失败（HTTP ${response.status}）`
    try {
      const payload = (await response.json()) as { message?: unknown }
      if (typeof payload?.message === 'string' && payload.message) {
        message = payload.message
      }
    } catch {
      // 保留默认提示
    }
    throw new ApiError(response.status, message)
  }

  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

export interface ToolApi {
  readonly canWrite: boolean
  list(): Promise<Tool[]>
  create(input: ToolInput): Promise<Tool>
  update(id: string, input: ToolInput): Promise<Tool>
  remove(id: string): Promise<void>
}

const readOnlyError = () =>
  new ApiError(403, '当前为静态构建版本，仅展示已注册工具；新增或编辑请在本地 npm run dev 中进行')

const staticApi: ToolApi = {
  canWrite: false,
  async list() {
    return (seedTools as Tool[]).map((tool) => ({ ...tool }))
  },
  async create() {
    throw readOnlyError()
  },
  async update() {
    throw readOnlyError()
  },
  async remove() {
    throw readOnlyError()
  },
}

const devApi: ToolApi = {
  canWrite: true,
  list: () => request<Tool[]>(''),
  create: (input) =>
    request<Tool>('', { method: 'POST', body: JSON.stringify(input) }),
  update: (id, input) =>
    request<Tool>(`/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(input) }),
  remove: (id) =>
    request<void>(`/${encodeURIComponent(id)}`, { method: 'DELETE' }),
}

export const toolApi: ToolApi = import.meta.env.DEV ? devApi : staticApi
