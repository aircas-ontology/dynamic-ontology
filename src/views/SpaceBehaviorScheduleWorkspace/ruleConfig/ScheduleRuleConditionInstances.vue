<template>
  <section class="condition-instances" aria-label="前置条件实例数据">
    <h3>前置条件实例数据</h3>
    <p class="condition-instances__hint">实例配置由引用同一条件的行为共享，确认后同步生效。</p>
    <p v-if="!paths.length">当前行为没有前置条件</p>
    <p v-for="(path, index) in paths" :key="index" class="condition-instances__path">路径 {{ index + 1 }}：{{ path.map(formatSourceTitle).join(" → ") }}</p>
    <el-collapse v-model="expandedSources">
      <el-collapse-item v-for="source in sources" :key="source.nodeId" :name="source.nodeId" :title="formatSourceTitle(source)">
        <p class="condition-instances__summary">{{ summarizeSourceCondition(source) }}</p>
        <div class="condition-instances__rows">
          <ScheduleRuleConditionInstanceRow
            v-for="row in source.rows"
            :key="row.key"
            :value="row.value"
            :label="row.label"
            :readonly="readonly"
            @validity="setBindingValidity(source.nodeId, row.key, $event)"
          />
        </div>
        <p v-if="!source.rows.length">固定值条件，无需选择实例</p>
      </el-collapse-item>
    </el-collapse>
  </section>
</template>
<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import type { CollapseModelValue } from "element-plus";
import type { ActionConditionSource } from "../utils/ruleConditionInstanceBindings";
import { validateConditionBindings } from "../utils/ruleConditionInstanceBindings";
import { summarizeRuleCondition } from "../utils/scheduleRuleFlowFactory";
import ScheduleRuleConditionInstanceRow from "./ScheduleRuleConditionInstanceRow.vue";

const props = defineProps<{ paths: ActionConditionSource[][]; readonly?: boolean }>();
const sources = computed(() => {
  const result = new Map<string, ActionConditionSource>();
  props.paths.flat().forEach((source) => {
    const existing = result.get(source.nodeId);
    if (!existing) result.set(source.nodeId, { ...source, rows: [...source.rows] });
    else {
      source.rows.forEach((row) => {
        if (!existing.rows.some((item) => item.key === row.key)) existing.rows.push(row);
      });
      if (!existing.label.includes(source.label)) existing.label += ` / ${source.label}`;
    }
  });
  return [...result.values()];
});
const expandedSources = ref<CollapseModelValue>(sources.value.map((source) => source.nodeId));
const bindingValidity = reactive<Record<string, boolean>>({});

/** @description 使用弹窗内一致的条件序号显示路径来源，不暴露画布内部节点标识。 @param source 条件来源。 @returns 可读标题。 */
function formatSourceTitle(source: ActionConditionSource): string {
  return `条件${sources.value.findIndex((item) => item.nodeId === source.nodeId) + 1} · ${source.label}`;
}

/** @description 记录每个独立变量查询及选项有效状态。 @param nodeId 源条件标识。 @param rowKey 变量引用键。 @param valid 是否可确认。 */
function setBindingValidity(nodeId: string, rowKey: string, valid: boolean): void {
  bindingValidity[JSON.stringify([nodeId, rowKey])] = valid;
}
/** @description 展示原条件的完整分组表达式。 @param source 源条件。 @returns 摘要。 */
function summarizeSourceCondition(source: ActionConditionSource): string {
  if (source.data.condition) return summarizeRuleCondition(source.data.condition);
  return "按 Switch 判断字段与当前分支匹配值选择实例；默认分支需要配置全部匹配条件。";
}
/** @description 验证全部路径共享变量及异步选项，防止未加载或失效数据提交。 @returns 用户可读错误或空字符串。 */
function validateInstances(): string {
  for (const source of sources.value) {
    const error = validateConditionBindings(source.rows);
    if (error) return error;
    const invalid = source.rows.find((row) => !bindingValidity[JSON.stringify([source.nodeId, row.key])]);
    if (invalid) return `请完成「${invalid.value.objectName} · ${invalid.value.propertyName}」的实例和数据行选择，或等待加载完成`;
  }
  return "";
}
defineExpose({ validateInstances });
</script>
<style scoped lang="scss">
.condition-instances {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}
.condition-instances h3 {
  margin: 0;
  color: var(--aircas-color-text-primary);
  font-size: 16px;
  font-weight: 600;
}
.condition-instances__path,
.condition-instances__summary {
  margin: 0 0 8px;
  overflow-wrap: anywhere;
  color: var(--aircas-color-text-secondary);
}
.condition-instances__rows {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-left: 12px;
}
.condition-instances__hint {
  margin: 0;
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
  line-height: 1.5;
}
</style>
