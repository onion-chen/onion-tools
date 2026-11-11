import { describe, expect, it } from 'vitest'
import {
  isHttpUrl,
  normalizeToolInput,
  normalizeUrl,
  urlKey,
  validateToolInput,
} from '@/shared/toolSchema'

function draft(overrides: Partial<Record<string, string>> = {}) {
  return normalizeToolInput({
    name: 'Figma',
    url: 'https://www.figma.com',
    description: '设计工具',
    category: '设计资源',
    icon: '🎨',
    ...overrides,
  })
}

describe('normalizeUrl', () => {
  it('keeps explicit http/https urls', () => {
    expect(normalizeUrl('https://example.com/a')).toBe('https://example.com/a')
    expect(normalizeUrl('http://example.com')).toBe('http://example.com')
  })

  it('prepends https when the scheme is missing', () => {
    expect(normalizeUrl('example.com')).toBe('https://example.com')
    expect(normalizeUrl('  example.com/path  ')).toBe('https://example.com/path')
  })

  it('returns empty string for blank input', () => {
    expect(normalizeUrl('   ')).toBe('')
  })
})

describe('isHttpUrl', () => {
  it('accepts http and https only', () => {
    expect(isHttpUrl('https://example.com')).toBe(true)
    expect(isHttpUrl('http://example.com')).toBe(true)
    expect(isHttpUrl('ftp://example.com')).toBe(false)
    expect(isHttpUrl('javascript:alert(1)')).toBe(false)
    expect(isHttpUrl('not a url')).toBe(false)
  })
})

describe('urlKey', () => {
  it('ignores trailing slashes and casing differences', () => {
    expect(urlKey('https://example.com/')).toBe(urlKey('https://example.com'))
    expect(urlKey('https://Example.com')).toBe(urlKey('https://example.com'))
    expect(urlKey('https://example.com/a/')).not.toBe(urlKey('https://example.com/b'))
  })
})

describe('validateToolInput', () => {
  it('accepts a complete draft', () => {
    expect(validateToolInput(draft()).valid).toBe(true)
  })

  it('reports missing required fields', () => {
    const result = validateToolInput(draft({ name: '', url: '', category: '' }))
    expect(result.valid).toBe(false)
    expect(result.errors).toMatchObject({
      name: '请输入工具名称',
      url: '请输入工具链接',
      category: '请选择分类',
    })
  })

  it('rejects non-http protocols', () => {
    const result = validateToolInput(draft({ url: 'javascript:alert(1)' }))
    expect(result.valid).toBe(false)
    expect(result.errors.url).toBe('仅支持 http/https 链接')
  })

  it('enforces length limits by code point', () => {
    expect(validateToolInput(draft({ name: '🧅'.repeat(31) })).errors.name).toBe('名称最多 30 个字符')
    expect(validateToolInput(draft({ description: '字'.repeat(81) })).errors.description).toBe(
      '描述最多 80 个字符',
    )
    expect(validateToolInput(draft({ icon: '🧅'.repeat(5) })).errors.icon).toBe('图标最多 4 个字符')
  })

  it('normalizes whitespace while collecting the draft', () => {
    const normalized = draft({ name: '  Figma  ', icon: '  🎨 ' })
    expect(normalized.name).toBe('Figma')
    expect(normalized.icon).toBe('🎨')
  })
})
