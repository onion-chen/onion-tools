<script setup lang="ts">
import type { Tool } from '@/types/tool'
import ToolCard from './ToolCard.vue'

defineProps<{ tools: Tool[] }>()
const emit = defineEmits<{ edit: [tool: Tool]; remove: [tool: Tool] }>()
</script>

<template>
  <div class="tool-grid">
    <ToolCard
      v-for="tool in tools"
      :key="tool.id"
      :tool="tool"
      @edit="emit('edit', $event)"
      @remove="emit('remove', $event)"
    />
  </div>
</template>

<style scoped>
.tool-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 18px;
}
</style>
