<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import type { Tool, ToolDraft, ToolInput } from '@/types/tool'
import { FALLBACK_CATEGORY } from '@/constants/categories'
import {
  DESCRIPTION_MAX,
  ICON_MAX,
  NAME_MAX,
  isHttpUrl,
  normalizeUrl,
  validateToolInput,
} from '@/shared/toolSchema'

const props = defineProps<{
  modelValue: boolean
  tool: Tool | null
  saving: boolean
  categories: string[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submit: [input: ToolInput]
}>()

const formRef = ref<FormInstance>()

const emptyDraft = (): ToolDraft => ({
  name: '',
  url: '',
  description: '',
  category: FALLBACK_CATEGORY,
  icon: '',
})

const form = ref<ToolDraft>(emptyDraft())

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
})

const title = computed(() => (props.tool ? '编辑工具' : '添加工具'))

watch(
  () => [props.modelValue, props.tool] as const,
  ([open]) => {
    if (!open) return
    Object.assign(
      form.value,
      props.tool
        ? {
            name: props.tool.name,
            url: props.tool.url,
            description: props.tool.description ?? '',
            category: props.tool.category,
            icon: props.tool.icon ?? '',
          }
        : emptyDraft(),
    )
    void nextTick(() => formRef.value?.clearValidate())
  },
  { immediate: true },
)

const urlValidator = (_rule: unknown, value: string, callback: (error?: Error) => void) => {
  const normalized = normalizeUrl(value ?? '')
  if (!normalized || isHttpUrl(normalized)) {
    callback()
  } else {
    callback(new Error('仅支持 http/https 链接'))
  }
}

const charCount = (value: string) => Array.from(value ?? '').length
const maxValidator = (max: number, label: string) =>
  (_rule: unknown, value: string, callback: (error?: Error) => void) => {
    if (!value || charCount(value) <= max) callback()
    else callback(new Error(`${label}最多 ${max} 个字符`))
  }

const rules: FormRules<ToolDraft> = {
  name: [
    { required: true, message: '请输入工具名称', trigger: 'blur' },
    { validator: maxValidator(NAME_MAX, '名称'), trigger: 'blur' },
  ],
  url: [
    { required: true, message: '请输入工具链接', trigger: 'blur' },
    { validator: urlValidator, trigger: 'blur' },
  ],
  category: [{ required: true, message: '请选择分类', trigger: 'change' }],
  description: [{ validator: maxValidator(DESCRIPTION_MAX, '描述'), trigger: 'blur' }],
  icon: [{ validator: maxValidator(ICON_MAX, '图标'), trigger: 'blur' }],
}

function normalizeUrlField() {
  form.value.url = normalizeUrl(form.value.url)
}

async function handleSubmit() {
  if (props.saving) return
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  const draft: ToolDraft = {
    name: form.value.name.trim(),
    url: normalizeUrl(form.value.url),
    description: form.value.description.trim(),
    category: form.value.category.trim(),
    icon: form.value.icon.trim(),
  }

  const result = validateToolInput(draft)
  if (!result.valid) return

  emit('submit', draft)
}
</script>

<template>
  <el-dialog
    v-model="visible"
    :title="title"
    width="520px"
    append-to-body
    :close-on-click-modal="!saving"
    :close-on-press-escape="!saving"
    :show-close="!saving"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-position="top"
      @submit.prevent="handleSubmit"
    >
      <div class="form-row">
        <el-form-item label="图标（可选）" prop="icon" class="icon-field">
          <el-input v-model="form.icon" placeholder="如 🧰" />
        </el-form-item>
        <el-form-item label="分类" prop="category" class="category-field">
          <el-select
            v-model="form.category"
            filterable
            allow-create
            default-first-option
            placeholder="选择或输入分类"
          >
            <el-option v-for="category in categories" :key="category" :label="category" :value="category" />
          </el-select>
        </el-form-item>
      </div>

      <el-form-item label="名称" prop="name">
        <el-input
          v-model="form.name"
          :maxlength="NAME_MAX"
          show-word-limit
          placeholder="例如：Figma"
          @keyup.enter.prevent="handleSubmit"
        />
      </el-form-item>

      <el-form-item label="链接" prop="url">
        <el-input
          v-model="form.url"
          placeholder="https://example.com 或 example.com"
          @blur="normalizeUrlField"
          @keyup.enter.prevent="handleSubmit"
        />
      </el-form-item>

      <el-form-item label="描述（可选）" prop="description">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="3"
          :maxlength="DESCRIPTION_MAX"
          show-word-limit
          placeholder="一句话说明这个工具能做什么"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button :disabled="saving" @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="handleSubmit">
        {{ tool ? '保存修改' : '添加工具' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.form-row {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 16px;
}

@media (max-width: 560px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
