import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import type { Tool, ToolInput } from '@/types/tool'
import { toolApi } from '@/services/toolApi'
import { DEFAULT_CATEGORIES } from '@/constants/categories'

export const ALL_CATEGORIES = 'all'

export const useToolsStore = defineStore('tools', () => {
  const tools = ref<Tool[]>([])
  const loading = ref(false)
  const loadError = ref('')
  const saving = ref(false)
  const removingId = ref<string | null>(null)

  const keyword = ref('')
  const activeCategory = ref<string>(ALL_CATEGORIES)
  const dialogVisible = ref(false)
  const editing = ref<Tool | null>(null)

  const canWrite = toolApi.canWrite

  watch(dialogVisible, (open) => {
    if (!open) editing.value = null
  })

  const categories = computed(() => {
    const order = new Map<string, number>(
      DEFAULT_CATEGORIES.map((category, index): [string, number] => [category, index]),
    )
    const unique = Array.from(new Set(tools.value.map((tool) => tool.category)))
    return unique.sort(
      (a, b) => (order.get(a) ?? Number.MAX_SAFE_INTEGER) - (order.get(b) ?? Number.MAX_SAFE_INTEGER) || a.localeCompare(b, 'zh-CN'),
    )
  })

  const filteredTools = computed(() => {
    const needle = keyword.value.trim().toLowerCase()
    return tools.value.filter((tool) => {
      if (activeCategory.value !== ALL_CATEGORIES && tool.category !== activeCategory.value) {
        return false
      }
      if (!needle) return true
      const haystack = `${tool.name} ${tool.description ?? ''} ${tool.category} ${tool.url}`.toLowerCase()
      return haystack.includes(needle)
    })
  })

  const isFiltering = computed(
    () => keyword.value.trim().length > 0 || activeCategory.value !== ALL_CATEGORIES,
  )

  const total = computed(() => tools.value.length)

  async function load(): Promise<void> {
    loading.value = true
    loadError.value = ''
    try {
      tools.value = await toolApi.list()
    } catch (error) {
      loadError.value = error instanceof Error ? error.message : '加载工具列表失败'
    } finally {
      loading.value = false
    }
  }

  function openCreate(): void {
    editing.value = null
    dialogVisible.value = true
  }

  function openEdit(tool: Tool): void {
    editing.value = tool
    dialogVisible.value = true
  }

  function closeDialog(): void {
    dialogVisible.value = false
    editing.value = null
  }

  async function save(input: ToolInput): Promise<Tool> {
    saving.value = true
    try {
      const tool = editing.value
        ? await toolApi.update(editing.value.id, input)
        : await toolApi.create(input)

      if (editing.value) {
        const index = tools.value.findIndex((item) => item.id === tool.id)
        if (index !== -1) tools.value[index] = tool
      } else {
        tools.value = [tool, ...tools.value]
        activeCategory.value = ALL_CATEGORIES
        keyword.value = ''
      }

      closeDialog()
      return tool
    } finally {
      saving.value = false
    }
  }

  async function remove(tool: Tool): Promise<void> {
    removingId.value = tool.id
    try {
      await toolApi.remove(tool.id)
      tools.value = tools.value.filter((item) => item.id !== tool.id)
      if (activeCategory.value !== ALL_CATEGORIES && !categories.value.includes(activeCategory.value)) {
        activeCategory.value = ALL_CATEGORIES
      }
    } finally {
      removingId.value = null
    }
  }

  function resetFilters(): void {
    keyword.value = ''
    activeCategory.value = ALL_CATEGORIES
  }

  return {
    tools,
    loading,
    loadError,
    saving,
    removingId,
    keyword,
    activeCategory,
    dialogVisible,
    editing,
    canWrite,
    categories,
    filteredTools,
    isFiltering,
    total,
    load,
    openCreate,
    openEdit,
    closeDialog,
    save,
    remove,
    resetFilters,
  }
})
