import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ToolCard from '@/components/ToolCard.vue'
import type { Tool } from '@/types/tool'

const tool: Tool = {
  id: 'tool-1',
  name: 'Figma',
  url: 'https://www.figma.com',
  description: '在线设计工具',
  category: '设计资源',
  icon: '🎨',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

function mountCard(overrides: Partial<Tool> = {}) {
  const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
  const wrapper = mount(ToolCard, { props: { tool: { ...tool, ...overrides } } })
  return { wrapper, openSpy }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ToolCard', () => {
  it('renders the tool name, description, category and host', () => {
    const { wrapper } = mountCard()

    expect(wrapper.text()).toContain('Figma')
    expect(wrapper.text()).toContain('在线设计工具')
    expect(wrapper.text()).toContain('设计资源')
    expect(wrapper.text()).toContain('figma.com')
  })

  it('opens the tool in a new tab when the card is clicked', async () => {
    const { wrapper, openSpy } = mountCard()

    await wrapper.find('article').trigger('click')

    expect(openSpy).toHaveBeenCalledWith('https://www.figma.com', '_blank', 'noopener,noreferrer')
  })

  it('opens the tool with the keyboard', async () => {
    const { wrapper, openSpy } = mountCard()
    const card = wrapper.find('article')

    await card.trigger('keydown', { key: 'Enter' })
    await card.trigger('keydown', { key: ' ' })

    expect(openSpy).toHaveBeenCalledTimes(2)
  })

  it('falls back to the first character when no icon is set', () => {
    const { wrapper } = mountCard({ icon: undefined })

    expect(wrapper.find('.avatar').text()).toBe('F')
  })

  it('emits edit without opening the link', async () => {
    const { wrapper, openSpy } = mountCard()

    await wrapper.findAll('button')[0]!.trigger('click')

    expect(wrapper.emitted('edit')?.[0]).toEqual([expect.objectContaining({ id: 'tool-1' })])
    expect(openSpy).not.toHaveBeenCalled()
  })

  it('emits remove without opening the link', async () => {
    const { wrapper, openSpy } = mountCard()

    await wrapper.findAll('button')[1]!.trigger('click')

    expect(wrapper.emitted('remove')?.[0]).toEqual([expect.objectContaining({ id: 'tool-1' })])
    expect(openSpy).not.toHaveBeenCalled()
  })
})
