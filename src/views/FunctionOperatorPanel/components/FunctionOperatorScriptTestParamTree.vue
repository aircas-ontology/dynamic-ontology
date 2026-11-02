<template>
  <ul class="function-operator-script-test-param-tree" :aria-label="ariaLabel">
    <li v-for="(row, index) in rows" :key="buildScriptTestParamKey(row, index)" class="function-operator-script-test-param-tree__item">
      <div class="function-operator-script-test-param-tree__label">{{ formatScriptTestParamLabel(row.paramName, row.paramType) }}</div>
      <el-input
        v-if="!(row.fields && row.fields.length > 0)"
        :model-value="row.paramValue ?? ''"
        clearable
        placeholder="请输入参数值"
        @update:model-value="emit('update-param', [index], String($event ?? ''))"
      />
      <FunctionOperatorScriptTestParamTree
        v-if="row.fields && row.fields.length > 0"
        :rows="row.fields"
        @update-param="(path, paramValue) => forwardScriptTestParamUpdate(index, path, paramValue)"
      />
    </li>
  </ul>
</template>

<script setup lang="ts">
import type { OntologyFunctionScriptTestInputRow } from "@/utils/mapOntologyFunctionTest";

defineProps<{
  rows: OntologyFunctionScriptTestInputRow[];
  /** 仅根列表提供，供读屏识别测试入参区域。 */
  ariaLabel?: string;
}>();

const emit = defineEmits<{
  "update-param": [path: number[], paramValue: string];
}>();

/**
 * @description 组装脚本测试入参标签：参数名与类型。
 * @param paramName 参数名。
 * @param paramType 参数类型。
 * @returns 展示标签。
 */
function formatScriptTestParamLabel(paramName: string, paramType: string): string {
  const typeLabel = paramType.trim();
  return typeLabel ? `${paramName}（${typeLabel}）` : paramName;
}

/**
 * @description 生成同层参数的列表键。
 * @param row 入参行。
 * @param index 同层序号。
 * @returns 列表键。
 */
function buildScriptTestParamKey(row: OntologyFunctionScriptTestInputRow, index: number): string {
  return `${row.paramName}-${row.paramType}-${index}`;
}

/**
 * @description 把子树更新路径补上当前层序号后继续上抛。
 * @param index 当前层序号。
 * @param path 子树序号路径。
 * @param paramValue 参数值。
 */
function forwardScriptTestParamUpdate(index: number, path: number[], paramValue: string): void {
  emit("update-param", [index, ...path], paramValue);
}
</script>

<style scoped lang="scss">
.function-operator-script-test-param-tree {
  display: flex;
  margin: 0;
  padding: 0;
  flex-direction: column;
  gap: 8px;
  list-style: none;
}

.function-operator-script-test-param-tree .function-operator-script-test-param-tree {
  margin-top: 8px;
  margin-left: 12px;
  padding-left: 8px;
  border-left: 1px solid var(--aircas-color-border);
}

.function-operator-script-test-param-tree__label {
  margin-bottom: 4px;
  color: var(--aircas-color-text-primary);
  font-size: 13px;
  word-break: break-word;
}
</style>
