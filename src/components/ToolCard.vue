<script setup lang="ts">
import { computed } from 'vue'
import type { Tool } from '@/types/tool'

const props = defineProps<{ tool: Tool }>()
const emit = defineEmits<{ edit: [tool: Tool]; remove: [tool: Tool] }>()

const initial = computed(() => {
  const chars = Array.from(props.tool.name.trim())
  return chars[0]?.toUpperCase() ?? '?'
})

const hue = computed(() => {
  let value = 0
  for (const char of props.tool.name) {
    value = (value * 31 + (char.codePointAt(0) ?? 0)) % 360
  }
  return value
})

const avatarStyle = computed(() => ({
  background: `hsl(${hue.value} 70% 93%)`,
  color: `hsl(${hue.value} 55% 35%)`,
}))

const host = computed(() => {
  try {
    return new URL(props.tool.url).host.replace(/^www\./, '')
  } catch {
    return props.tool.url
  }
})

function openTool() {
  window.open(props.tool.url, '_blank', 'noopener,noreferrer')
}
</script>

<template>
  <article
    class="tool-card"
    role="link"
    tabindex="0"
    :aria-label="`打开 ${tool.name}`"
    @click="openTool"
    @keydown.enter.prevent="openTool"
    @keydown.space.prevent="openTool"
  >
    <div class="tool-top">
      <div class="avatar" :style="avatarStyle">{{ tool.icon || initial }}</div>
      <div class="tool-actions" @click.stop>
        <button type="button" @click="emit('edit', tool)">编辑</button>
        <button type="button" class="danger" @click="emit('remove', tool)">删除</button>
      </div>
    </div>

    <h3>{{ tool.name }}</h3>
    <p class="desc">{{ tool.description || '暂无描述' }}</p>

    <div class="tool-meta">
      <span class="category">{{ tool.category }}</span>
      <span class="host">{{ host }}</span>
    </div>
  </article>
</template>

<style scoped>
.tool-card {
  display: flex;
  flex-direction: column;
  padding: 18px;
  min-height: 168px;
  background: var(--onion-surface);
  border: 1px solid var(--onion-border);
  border-radius: var(--onion-radius);
  box-shadow: var(--onion-shadow);
  cursor: pointer;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease;
}

.tool-card:hover,
.tool-card:focus-visible {
  transform: translateY(-3px);
  border-color: #d6cff5;
  box-shadow: 0 14px 32px rgba(109, 91, 208, 0.14);
  outline: none;
}

.tool-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.avatar {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 13px;
  font-size: 22px;
  font-weight: 700;
  flex-shrink: 0;
}

.tool-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.tool-card:hover .tool-actions,
.tool-card:focus-within .tool-actions {
  opacity: 1;
}

.tool-actions button {
  padding: 4px 8px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--onion-text-soft);
  font-size: 12px;
  cursor: pointer;
}

.tool-actions button:hover {
  background: var(--onion-brand-soft);
  color: var(--onion-brand);
}

.tool-actions button.danger:hover {
  background: #fdecec;
  color: #d24a4a;
}

h3 {
  margin: 14px 0 0;
  font-size: 17px;
  letter-spacing: -0.01em;
}

.desc {
  flex: 1;
  margin: 6px 0 16px;
  color: var(--onion-text-soft);
  font-size: 13px;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.tool-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 12px;
}

.category {
  padding: 3px 9px;
  border-radius: 999px;
  background: var(--onion-brand-soft);
  color: var(--onion-brand);
}

.host {
  color: #a0a6b4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (hover: none) {
  .tool-actions {
    opacity: 1;
  }
}
</style>
