<template>
  <div class="behavior-tree-json">
    <div v-if="errors.length" class="behavior-tree-json__errors" role="alert">
      <div v-for="(item, index) in errors" :key="`e-${index}`">{{ item }}</div>
    </div>
    <div v-if="warnings.length" class="behavior-tree-json__warnings">
      <div v-for="(item, index) in warnings" :key="`w-${index}`">{{ item }}</div>
    </div>
    <div class="behavior-tree-json__toolbar">
      <el-button @click="emit('refresh')">刷新预览</el-button>
      <el-button type="primary" @click="emit('apply', draft)">应用定义 JSON</el-button>
      <el-button @click="copyText(definitionJson, '定义')">复制定义</el-button>
      <el-button @click="copyText(payloadJson, '请求体')">复制完整请求体</el-button>
    </div>
    <h4>treeDefinition</h4>
    <el-input v-model="draft" type="textarea" :rows="14" class="behavior-tree-json__box" />
    <h4>POST/PUT /action 请求体</h4>
    <el-input :model-value="payloadJson" type="textarea" :rows="10" readonly class="behavior-tree-json__box" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { ElMessage } from "element-plus";

const props = defineProps<{
  definitionJson: string;
  payloadJson: string;
  errors: string[];
  warnings: string[];
}>();

const emit = defineEmits<{
  refresh: [];
  apply: [raw: string];
}>();

const draft = ref(props.definitionJson);

watch(
  () => props.definitionJson,
  (value) => {
    draft.value = value;
  },
);

/**
 * @description 复制文本到剪贴板。
 * @param text 文本。
 * @param label 提示标签。
 */
async function copyText(text: string, label: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    ElMessage.success(`已复制${label}`);
  } catch {
    ElMessage.error("复制失败");
  }
}
</script>

<style scoped lang="scss">
.behavior-tree-json__toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
}

.behavior-tree-json h4 {
  margin: 12px 0 6px;
  color: var(--aircas-color-text-primary);
  font-size: 13px;
}

.behavior-tree-json__box :deep(textarea) {
  font-family: Consolas, "Courier New", monospace;
  font-size: 12px;
}

.behavior-tree-json__errors,
.behavior-tree-json__warnings {
  margin-bottom: 10px;
  padding: 8px 10px;
  border-radius: 6px;
  font-size: 12px;
  line-height: 1.5;
}

.behavior-tree-json__errors {
  border: 1px solid color-mix(in srgb, var(--aircas-color-danger) 45%, transparent);
  background: color-mix(in srgb, var(--aircas-color-danger) 12%, transparent);
  color: var(--aircas-color-danger);
}

.behavior-tree-json__warnings {
  border: 1px solid color-mix(in srgb, var(--aircas-color-warning) 45%, transparent);
  background: color-mix(in srgb, var(--aircas-color-warning) 12%, transparent);
  color: var(--aircas-color-warning);
}
</style>
