<script setup lang="ts">
import { onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { errorMessage } from '@/services/toolApi'
import { useToolsStore } from '@/stores/tools'
import type { Tool, ToolInput } from '@/types/tool'
import AppHeader from '@/components/AppHeader.vue'
import FilterBar from '@/components/FilterBar.vue'
import ToolGrid from '@/components/ToolGrid.vue'
import ToolFormDialog from '@/components/ToolFormDialog.vue'
import EmptyState from '@/components/EmptyState.vue'

const store = useToolsStore()

onMounted(() => {
  void store.load()
})

async function handleSubmit(input: ToolInput) {
  const editing = store.editing !== null
  try {
    await store.save(input)
    ElMessage.success(editing ? '修改已保存' : '工具已添加')
  } catch (error) {
    ElMessage.error(errorMessage(error))
  }
}

async function handleRemove(tool: Tool) {
  try {
    await ElMessageBox.confirm(`删除后不可恢复，确定要删除「${tool.name}」吗？`, '删除工具', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      confirmButtonClass: 'el-button--danger',
    })
  } catch {
    return
  }

  try {
    await store.remove(tool)
    ElMessage.success('已删除')
  } catch (error) {
    ElMessage.error(errorMessage(error))
  }
}
</script>

<template>
  <main class="page-shell">
    <AppHeader />

    <el-alert
      v-if="!store.canWrite"
      class="readonly-hint"
      type="info"
      :closable="false"
      show-icon
      title="静态预览模式：数据来自构建时的 tools.json，新增、编辑、删除请在本地 npm run dev 中使用。"
    />

    <FilterBar />

    <div v-if="store.loadError" class="load-error">
      <el-alert type="error" :closable="false" show-icon :title="store.loadError" />
      <el-button type="primary" plain round @click="store.load()">重新加载</el-button>
    </div>

    <section v-else v-loading="store.loading" class="content">
      <EmptyState
        v-if="!store.loading && store.filteredTools.length === 0"
        :filtered="store.isFiltering"
        @clear="store.resetFilters()"
      />
      <ToolGrid
        v-else
        :tools="store.filteredTools"
        @edit="store.openEdit"
        @remove="handleRemove"
      />
    </section>

    <ToolFormDialog
      v-model="store.dialogVisible"
      :tool="store.editing"
      :saving="store.saving"
      :categories="store.categories"
      @submit="handleSubmit"
    />
  </main>
</template>

<style scoped>
.readonly-hint {
  margin-bottom: 16px;
}

.content {
  min-height: 240px;
}

.load-error {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
}
</style>
