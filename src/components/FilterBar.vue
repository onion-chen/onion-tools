<script setup lang="ts">
import { computed } from 'vue'
import { ALL_CATEGORIES, useToolsStore } from '@/stores/tools'

const store = useToolsStore()

const chips = computed(() => [
  { label: '全部', value: ALL_CATEGORIES },
  ...store.categories.map((category) => ({ label: category, value: category })),
])
</script>

<template>
  <section class="filter-bar">
    <el-input
      v-model="store.keyword"
      class="search"
      size="large"
      clearable
      placeholder="搜索名称、描述、分类或链接…"
    />

    <div class="chips" role="group" aria-label="按分类筛选">
      <button
        v-for="chip in chips"
        :key="chip.value"
        type="button"
        class="chip"
        :class="{ active: store.activeCategory === chip.value }"
        @click="store.activeCategory = chip.value"
      >
        {{ chip.label }}
      </button>
    </div>

    <div class="result">
      <span>显示 {{ store.filteredTools.length }} / {{ store.total }} 个工具</span>
      <el-button v-if="store.isFiltering" link type="primary" @click="store.resetFilters()">
        清除筛选
      </el-button>
    </div>
  </section>
</template>

<style scoped>
.filter-bar {
  display: grid;
  grid-template-columns: minmax(240px, 340px) 1fr auto;
  align-items: center;
  gap: 16px 24px;
  padding: 18px 20px;
  margin-bottom: 24px;
  background: var(--onion-surface);
  border: 1px solid var(--onion-border);
  border-radius: var(--onion-radius);
  box-shadow: var(--onion-shadow);
}

.search {
  min-width: 0;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip {
  padding: 6px 14px;
  border: 1px solid var(--onion-border);
  border-radius: 999px;
  background: transparent;
  color: var(--onion-text-soft);
  font-size: 13px;
  cursor: pointer;
  transition:
    background 0.15s ease,
    color 0.15s ease,
    border-color 0.15s ease;
}

.chip:hover {
  color: var(--onion-brand);
  border-color: #d6cff5;
}

.chip.active {
  background: var(--onion-brand);
  border-color: var(--onion-brand);
  color: #fff;
}

.result {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--onion-text-soft);
  font-size: 13px;
  white-space: nowrap;
}

@media (max-width: 900px) {
  .filter-bar {
    grid-template-columns: 1fr;
  }
}
</style>
