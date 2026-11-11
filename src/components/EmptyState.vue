<script setup lang="ts">
defineProps<{ filtered: boolean }>()
const emit = defineEmits<{ clear: [] }>()
</script>

<template>
  <div class="empty">
    <div class="empty-icon">{{ filtered ? '🔍' : '🗂️' }}</div>
    <h3>{{ filtered ? '没有匹配的工具' : '工具箱还是空的' }}</h3>
    <p>
      {{
        filtered
          ? '换个关键词或分类试试，也可以清除筛选查看全部。'
          : '点击右上角「添加工具」，把你常用的站点收进来。'
      }}
    </p>
    <el-button v-if="filtered" type="primary" plain round @click="emit('clear')">
      清除筛选
    </el-button>
  </div>
</template>

<style scoped>
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 72px 24px;
  background: var(--onion-surface);
  border: 1px dashed #d9dced;
  border-radius: var(--onion-radius);
  text-align: center;
}

.empty-icon {
  font-size: 40px;
  margin-bottom: 6px;
}

h3 {
  margin: 0;
  font-size: 17px;
}

p {
  margin: 0 0 14px;
  max-width: 360px;
  color: var(--onion-text-soft);
  font-size: 13px;
  line-height: 1.7;
}
</style>
