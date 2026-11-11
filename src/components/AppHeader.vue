<script setup lang="ts">
import { useToolsStore } from '@/stores/tools'

const store = useToolsStore()
</script>

<template>
  <header class="app-header">
    <div class="brand">
      <div class="brand-mark">🧅</div>
      <div>
        <h1>洋葱工具箱</h1>
        <p>把常用工具收进一个入口 · 已收录 {{ store.total }} 个</p>
      </div>
    </div>

    <div class="header-actions">
      <el-tag v-if="!store.canWrite" type="info" effect="plain" round>静态预览 · 只读</el-tag>
      <el-tooltip
        :disabled="store.canWrite"
        content="静态构建版本只读，新增工具请在本地 npm run dev 环境中操作"
        placement="bottom"
      >
        <span>
          <el-button
            type="primary"
            size="large"
            round
            :disabled="!store.canWrite"
            @click="store.openCreate()"
          >
            + 添加工具
          </el-button>
        </span>
      </el-tooltip>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 32px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
}

.brand-mark {
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
  border-radius: 18px;
  background: var(--onion-surface);
  box-shadow: var(--onion-shadow);
  font-size: 28px;
  flex-shrink: 0;
}

h1 {
  margin: 0;
  font-size: 26px;
  letter-spacing: -0.02em;
}

p {
  margin: 4px 0 0;
  color: var(--onion-text-soft);
  font-size: 13px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

@media (max-width: 640px) {
  .app-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .header-actions {
    width: 100%;
    justify-content: space-between;
  }

  h1 {
    font-size: 22px;
  }
}
</style>
