<template>
  <ul class="function-operator-script-param-tree" :aria-label="ariaLabel">
    <li v-for="(item, index) in nodes" :key="buildParameterKey(item, index)" class="function-operator-script-param-tree__item">
      <div class="function-operator-script-param-tree__row">
        <span class="function-operator-script-param-tree__name">{{ item.paramName }}</span>
        <span class="function-operator-script-param-tree__type">{{ item.paramType }}</span>
      </div>
      <FunctionOperatorScriptParamTree v-if="item.fields && item.fields.length > 0" :nodes="item.fields" />
    </li>
  </ul>
</template>

<script setup lang="ts">
import type { ParseOntologyFunctionParamItem } from "@/types";

defineProps<{
  nodes: ParseOntologyFunctionParamItem[];
  /** 仅根列表提供，供读屏识别输入或输出区域。 */
  ariaLabel?: string;
}>();

/**
 * @description 生成同层参数的列表键。
 * @param item 参数节点。
 * @param index 同层序号。
 * @returns 列表键。
 */
function buildParameterKey(item: ParseOntologyFunctionParamItem, index: number): string {
  return `${item.category}-${item.paramOrder}-${item.paramName}-${index}`;
}
</script>

<style scoped lang="scss">
.function-operator-script-param-tree {
  display: flex;
  margin: 0;
  padding: 0;
  flex-direction: column;
  gap: 8px;
  list-style: none;
}

.function-operator-script-param-tree .function-operator-script-param-tree {
  margin-top: 8px;
  margin-left: 12px;
  padding-left: 8px;
  border-left: 1px solid var(--aircas-color-border);
}

.function-operator-script-param-tree__row {
  display: flex;
  min-width: 0;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 10px;
  border: 1px solid var(--aircas-color-border);
  border-radius: 6px;
  background: var(--aircas-color-panel-background-deep);
}

.function-operator-script-param-tree__name {
  min-width: 0;
  color: var(--aircas-color-text-primary);
  font-size: 12px;
  word-break: break-word;
}

.function-operator-script-param-tree__type {
  flex-shrink: 0;
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
}
</style>
