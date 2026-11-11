import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import type { Tool } from '@/types/tool'
import {
  ApiError,
  createToolRecord,
  deleteToolRecord,
  readTools,
  updateToolRecord,
  writeTools,
} from '../vite/toolsJsonStore'

let dir: string

beforeEach(async () => {
  dir = await mkdtemp(path.join(os.tmpdir(), 'onion-tools-'))
})

afterEach(async () => {
  await rm(dir, { recursive: true, force: true })
})

function file() {
  return path.join(dir, 'tools.json')
}

function tool(overrides: Partial<Tool> = {}): Tool {
  return {
    id: 'tool-1',
    name: 'Figma',
    url: 'https://www.figma.com',
    category: '设计资源',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('readTools / writeTools', () => {
  it('round-trips tools with stable formatting', async () => {
    const tools = [tool(), tool({ id: 'tool-2', name: 'MDN', url: 'https://developer.mozilla.org' })]
    await writeTools(file(), tools)

    expect(await readTools(file())).toEqual(tools)
    const raw = await readFile(file(), 'utf8')
    expect(raw.endsWith('\n')).toBe(true)
    expect(raw).toContain('\n  {\n')
  })

  it('fails with a helpful message for missing files', async () => {
    await expect(readTools(path.join(dir, 'nope.json'))).rejects.toThrow(ApiError)
  })

  it('fails when the file is not valid JSON', async () => {
    await writeFile(file(), '{ broken', 'utf8')
    await expect(readTools(file())).rejects.toThrow('数据文件不是合法 JSON')
  })

  it('fails when the JSON is not an array of tools', async () => {
    await writeFile(file(), JSON.stringify([{ id: 1 }]), 'utf8')
    await expect(readTools(file())).rejects.toThrow('数据文件格式错误')
  })
})

describe('createToolRecord', () => {
  it('normalizes input and assigns id and timestamps', () => {
    const now = new Date('2026-05-01T08:00:00.000Z')
    const { tool: created, tools } = createToolRecord(
      [],
      { name: '  Example ', url: 'example.com', category: '其他' },
      now,
    )

    expect(created.id).toBeTruthy()
    expect(created.url).toBe('https://example.com')
    expect(created.name).toBe('Example')
    expect(created.description).toBeUndefined()
    expect(created.icon).toBeUndefined()
    expect(created.createdAt).toBe(now.toISOString())
    expect(created.updatedAt).toBe(now.toISOString())
    expect(tools).toEqual([created])
  })

  it('rejects invalid drafts', () => {
    expect(() => createToolRecord([], { name: '', url: 'example.com', category: '其他' })).toThrow(
      '请输入工具名称',
    )
    expect(() =>
      createToolRecord([], { name: 'X', url: 'javascript:alert(1)', category: '其他' }),
    ).toThrow('仅支持 http/https 链接')
  })

  it('rejects duplicate urls, ignoring trailing slashes', () => {
    expect(() =>
      createToolRecord([tool()], { name: 'Copy', url: 'https://www.figma.com/', category: '其他' }),
    ).toThrow('该链接已注册为「Figma」')
  })
})

describe('updateToolRecord', () => {
  it('merges changes and preserves id / createdAt', () => {
    const existing = tool({ description: '旧描述', icon: '🎨' })
    const now = new Date('2026-06-01T00:00:00.000Z')
    const { tool: updated, tools } = updateToolRecord(
      [existing],
      existing.id,
      { name: 'Figma 2', url: 'https://www.figma.com', category: '效率办公', description: '', icon: '' },
      now,
    )

    expect(updated.id).toBe(existing.id)
    expect(updated.createdAt).toBe(existing.createdAt)
    expect(updated.updatedAt).toBe(now.toISOString())
    expect(updated.name).toBe('Figma 2')
    expect(updated.category).toBe('效率办公')
    expect(updated.description).toBeUndefined()
    expect(updated.icon).toBeUndefined()
    expect(tools[0]).toEqual(updated)
  })

  it('returns 404 for unknown ids', () => {
    expect(() =>
      updateToolRecord([tool()], 'missing', { name: 'X', url: 'x.com', category: '其他' }),
    ).toThrow('工具不存在或已被删除')
  })

  it('rejects urls used by another tool', () => {
    const first = tool()
    const second = tool({ id: 'tool-2', name: 'MDN', url: 'https://developer.mozilla.org' })
    expect(() =>
      updateToolRecord([first, second], second.id, {
        name: 'MDN',
        url: 'https://www.figma.com',
        category: '开发工具',
      }),
    ).toThrow('该链接已注册为「Figma」')
  })
})

describe('deleteToolRecord', () => {
  it('removes the matching tool', () => {
    const { tools } = deleteToolRecord([tool(), tool({ id: 'tool-2' })], 'tool-1')
    expect(tools.map((item) => item.id)).toEqual(['tool-2'])
  })

  it('returns 404 for unknown ids', () => {
    expect(() => deleteToolRecord([tool()], 'missing')).toThrow('工具不存在或已被删除')
  })
})
