<template>
  <ul class="function-operator-script-test-param-tree" :aria-label="ariaLabel">
    <li v-for="(row, index) in rows" :key="buildScriptTestParamKey(row, index)" class="function-operator-script-test-param-tree__item">
      <div class="function-operator-script-test-param-tree__label-row">
        <div class="function-operator-script-test-param-tree__label">{{ formatScriptTestParamLabel(row.paramName, row.paramType) }}</div>
        <el-button
          v-if="isScriptTestListRow(row)"
          type="primary"
          link
          class="function-operator-script-test-param-tree__add"
          @click="emit('add-list-item', [index])"
        >
          添加一组
        </el-button>
      </div>

      <template v-if="isScriptTestListRow(row)">
        <div
          v-for="(itemFields, itemIndex) in row.listItems ?? []"
          :key="`${buildScriptTestParamKey(row, index)}-item-${itemIndex}`"
          class="function-operator-script-test-param-tree__list-item"
        >
          <div class="function-operator-script-test-param-tree__list-item-header">
            <div class="function-operator-script-test-param-tree__list-item-heading">
              <span class="function-operator-script-test-param-tree__list-item-title">第 {{ itemIndex + 1 }} 组</span>
              <el-button
                type="primary"
                link
                class="function-operator-script-test-param-tree__collapse"
                :aria-expanded="!isScriptTestListItemCollapsed(buildScriptTestListItemKey(row, index, itemIndex))"
                :aria-label="
                  isScriptTestListItemCollapsed(buildScriptTestListItemKey(row, index, itemIndex))
                    ? `展开第 ${itemIndex + 1} 组参数`
                    : `折叠第 ${itemIndex + 1} 组参数`
                "
                @click="toggleScriptTestListItemCollapse(buildScriptTestListItemKey(row, index, itemIndex))"
              >
                <el-icon>
                  <ArrowRight v-if="isScriptTestListItemCollapsed(buildScriptTestListItemKey(row, index, itemIndex))" />
                  <ArrowDown v-else />
                </el-icon>
              </el-button>
            </div>
            <el-button type="danger" link @click="emit('remove-list-item', [index], itemIndex)">删除</el-button>
          </div>
          <FunctionOperatorScriptTestParamTree
            v-show="!isScriptTestListItemCollapsed(buildScriptTestListItemKey(row, index, itemIndex))"
            :rows="itemFields"
            @update-param="(path, paramValue) => forwardScriptTestParamUpdate(index, [itemIndex, ...path], paramValue)"
            @add-list-item="(path) => forwardScriptTestListAdd(index, [itemIndex, ...path])"
            @remove-list-item="(path, nestedItemIndex) => forwardScriptTestListRemove(index, [itemIndex, ...path], nestedItemIndex)"
          />
        </div>
        <p v-if="!(row.listItems && row.listItems.length)" class="function-operator-script-test-param-tree__empty">暂无元素，请添加一组</p>
      </template>

      <el-input
        v-else-if="!(row.fields && row.fields.length > 0)"
        :model-value="row.paramValue ?? ''"
        clearable
        placeholder="请输入参数值"
        @update:model-value="emit('update-param', [index], String($event ?? ''))"
      />
      <FunctionOperatorScriptTestParamTree
        v-else
        :rows="row.fields"
        @update-param="(path, paramValue) => forwardScriptTestParamUpdate(index, path, paramValue)"
        @add-list-item="(path) => forwardScriptTestListAdd(index, path)"
        @remove-list-item="(path, itemIndex) => forwardScriptTestListRemove(index, path, itemIndex)"
      />
    </li>
  </ul>
</template>

<script setup lang="ts">
import { ArrowDown, ArrowRight } from "@element-plus/icons-vue";
import { ref } from "vue";

import type { OntologyFunctionScriptTestInputRow } from "@/utils/mapOntologyFunctionTest";

defineProps<{
  rows: OntologyFunctionScriptTestInputRow[];
  /** 仅根列表提供，供读屏识别测试入参区域。 */
  ariaLabel?: string;
}>();

const emit = defineEmits<{
  "update-param": [path: number[], paramValue: string];
  "add-list-item": [path: number[]];
  "remove-list-item": [path: number[], itemIndex: number];
}>();

/** 已折叠的 LIST 元素组键集合。 */
const collapsedScriptTestListItemKeys = ref<Set<string>>(new Set());

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
 * @description 生成 LIST 某一组元素的折叠态键。
 * @param row LIST 入参行。
 * @param index 同层序号。
 * @param itemIndex 元素组下标。
 * @returns 折叠态键。
 */
function buildScriptTestListItemKey(row: OntologyFunctionScriptTestInputRow, index: number, itemIndex: number): string {
  return `${buildScriptTestParamKey(row, index)}-item-${itemIndex}`;
}

/**
 * @description 判断 LIST 元素组是否已折叠。
 * @param itemKey 元素组折叠态键。
 * @returns 是否折叠。
 */
function isScriptTestListItemCollapsed(itemKey: string): boolean {
  return collapsedScriptTestListItemKeys.value.has(itemKey);
}

/**
 * @description 切换 LIST 元素组折叠态。
 * @param itemKey 元素组折叠态键。
 */
function toggleScriptTestListItemCollapse(itemKey: string): void {
  const next = new Set(collapsedScriptTestListItemKeys.value);
  if (next.has(itemKey)) {
    next.delete(itemKey);
  } else {
    next.add(itemKey);
  }
  collapsedScriptTestListItemKeys.value = next;
}

/**
 * @description 判断入参行是否为可多组编辑的 LIST/ARRAY。
 * @param row 入参行。
 * @returns 是否展示多组编辑。
 */
function isScriptTestListRow(row: OntologyFunctionScriptTestInputRow): boolean {
  const normalized = row.paramType.trim().toUpperCase();
  return (normalized === "LIST" || normalized === "ARRAY") && Array.isArray(row.listItems);
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

/**
 * @description 把子树添加 LIST 元素路径补上当前层序号后继续上抛。
 * @param index 当前层序号。
 * @param path 子树指向 LIST 的路径。
 */
function forwardScriptTestListAdd(index: number, path: number[]): void {
  emit("add-list-item", [index, ...path]);
}

/**
 * @description 把子树删除 LIST 元素路径补上当前层序号后继续上抛。
 * @param index 当前层序号。
 * @param path 子树指向 LIST 的路径。
 * @param itemIndex 元素下标。
 */
function forwardScriptTestListRemove(index: number, path: number[], itemIndex: number): void {
  emit("remove-list-item", [index, ...path], itemIndex);
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

.function-operator-script-test-param-tree__label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 4px;
}

.function-operator-script-test-param-tree__label {
  color: var(--aircas-color-text-primary);
  font-size: 13px;
  word-break: break-word;
}

.function-operator-script-test-param-tree__list-item {
  margin-top: 8px;
  padding: 8px;
  border: 1px solid var(--aircas-color-border);
  border-radius: 4px;
  background: var(--aircas-color-panel-background-deep);
}

.function-operator-script-test-param-tree__list-item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 4px;
}

.function-operator-script-test-param-tree__list-item-heading {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.function-operator-script-test-param-tree__list-item-title {
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
}

.function-operator-script-test-param-tree__empty {
  margin: 4px 0 0;
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
}
</style>
