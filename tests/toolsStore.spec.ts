import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import type { Tool, ToolInput } from '@/types/tool'

const { api } = vi.hoisted(() => ({
  api: {
    canWrite: true,
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}))

vi.mock('@/services/toolApi', () => ({ toolApi: api }))

import { ALL_CATEGORIES, useToolsStore } from '@/stores/tools'

function tool(overrides: Partial<Tool> = {}): Tool {
  return {
    id: 'tool-1',
    name: 'Figma',
    url: 'https://www.figma.com',
    description: '在线设计工具',
    category: '设计资源',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

const figma = tool()
const mdn = tool({
  id: 'tool-2',
  name: 'MDN',
  url: 'https://developer.mozilla.org',
  description: 'Web 文档',
  category: '开发工具',
})

const input: ToolInput = {
  name: 'Excalidraw',
  url: 'https://excalidraw.com',
  description: '白板',
  category: '设计资源',
  icon: '✏️',
}

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
})

describe('loading', () => {
  it('loads tools and clears the error state', async () => {
    api.list.mockResolvedValue([figma, mdn])
    const store = useToolsStore()

    await store.load()

    expect(store.tools).toEqual([figma, mdn])
    expect(store.loading).toBe(false)
    expect(store.loadError).toBe('')
  })

  it('records load failures', async () => {
    api.list.mockRejectedValue(new Error('接口挂了'))
    const store = useToolsStore()

    await store.load()

    expect(store.loadError).toBe('接口挂了')
    expect(store.loading).toBe(false)
  })

  it('orders categories by the default category order', async () => {
    api.list.mockResolvedValue([figma, mdn, tool({ id: '3', name: 'X', category: '自定义' })])
    const store = useToolsStore()
    await store.load()

    expect(store.categories).toEqual(['开发工具', '设计资源', '自定义'])
  })
})

describe('filtering', () => {
  beforeEach(async () => {
    api.list.mockResolvedValue([figma, mdn])
    const store = useToolsStore()
    await store.load()
  })

  it('matches keyword against name, description, category and url', () => {
    const store = useToolsStore()

    store.keyword = '文档'
    expect(store.filteredTools).toEqual([mdn])

    store.keyword = 'developer.mozilla'
    expect(store.filteredTools).toEqual([mdn])

    store.keyword = '设计'
    expect(store.filteredTools).toEqual([figma])

    store.keyword = ''
    expect(store.filteredTools).toHaveLength(2)
  })

  it('filters by category and reset restores everything', () => {
    const store = useToolsStore()

    store.activeCategory = '开发工具'
    expect(store.filteredTools).toEqual([mdn])
    expect(store.isFiltering).toBe(true)

    store.resetFilters()
    expect(store.activeCategory).toBe(ALL_CATEGORIES)
    expect(store.isFiltering).toBe(false)
    expect(store.filteredTools).toHaveLength(2)
  })
})

describe('save', () => {
  it('creates a tool, puts it first, and resets filters', async () => {
    const created = tool({ id: 'new', name: 'Excalidraw', category: '设计资源' })
    api.list.mockResolvedValue([figma])
    api.create.mockResolvedValue(created)

    const store = useToolsStore()
    await store.load()
    store.keyword = 'fig'
    store.activeCategory = '开发工具'

    store.openCreate()
    expect(store.dialogVisible).toBe(true)
    expect(store.editing).toBeNull()

    await store.save(input)

    expect(api.create).toHaveBeenCalledWith(input)
    expect(store.tools[0]).toEqual(created)
    expect(store.keyword).toBe('')
    expect(store.activeCategory).toBe(ALL_CATEGORIES)
    expect(store.dialogVisible).toBe(false)
    expect(store.saving).toBe(false)
  })

  it('updates the edited tool in place', async () => {
    const updated = { ...figma, name: 'Figma 网页版' }
    api.list.mockResolvedValue([figma, mdn])
    api.update.mockResolvedValue(updated)

    const store = useToolsStore()
    await store.load()
    store.openEdit(figma)

    await store.save(input)

    expect(api.update).toHaveBeenCalledWith(figma.id, input)
    expect(store.tools[0]).toEqual(updated)
    expect(store.tools[1]).toEqual(mdn)
    expect(store.dialogVisible).toBe(false)
  })

  it('propagates errors and resets the saving flag', async () => {
    api.create.mockRejectedValue(new Error('该链接已注册'))
    const store = useToolsStore()
    store.openCreate()

    await expect(store.save(input)).rejects.toThrow('该链接已注册')

    expect(store.saving).toBe(false)
    expect(store.dialogVisible).toBe(true)
  })
})

describe('remove', () => {
  it('deletes the tool and drops a filter that no longer matches', async () => {
    api.list.mockResolvedValue([figma, mdn])
    api.remove.mockResolvedValue(undefined)

    const store = useToolsStore()
    await store.load()
    store.activeCategory = '设计资源'

    await store.remove(figma)

    expect(api.remove).toHaveBeenCalledWith(figma.id)
    expect(store.tools).toEqual([mdn])
    expect(store.activeCategory).toBe(ALL_CATEGORIES)
    expect(store.removingId).toBeNull()
  })
})
