<template>
  <section class="rule-condition-branch" :data-rule-node-id="node.id">
    <article class="rule-condition-card" :class="conditionCardClass">
      <span class="rule-condition-port rule-condition-port--in" data-rule-port="in" aria-hidden="true"></span>
      <template v-if="node.type === 'composite'">
        <el-select v-model="node.logic" ariaLabel="条件组合方式" :disabled="readonly">
          <el-option label="并且" value="and" />
          <el-option label="或者" value="or" />
        </el-select>
        <el-button class="rule-condition-card__add rule-condition-card__add--leaf" :disabled="readonly" @click="appendConditionChild('leaf')"
          >添加子条件</el-button
        >
        <el-button class="rule-condition-card__add rule-condition-card__add--composite" :disabled="readonly" @click="appendConditionChild('composite')"
          >添加子复合条件</el-button
        >
        <el-button v-if="!isRoot" type="danger" :disabled="readonly" @click="emit('remove')">删除</el-button>
        <span class="rule-condition-port rule-condition-port--out" data-rule-port="out" aria-hidden="true"></span>
      </template>
      <template v-else>
        <el-select
          class="rule-condition-card__change-type"
          :model-value="changeType"
          ariaLabel="变更类型"
          :disabled="readonly"
          @update:model-value="applyChangeType"
        >
          <el-option label="属性比较" value="compare" />
          <el-option label="新增实例或子表行" value="insert" />
          <el-option label="删除实例或子表行" value="delete" />
        </el-select>
        <template v-if="node.type === 'monitor'">
          <ScheduleRuleMonitorLeafEditor :node="node" :readonly="readonly" />
        </template>
        <template v-else>
          <ScheduleRuleValueEditor v-model="node.left" label="条件左值" compact />
          <el-select v-model="node.operator" ariaLabel="比较运算符" :disabled="readonly">
            <el-option v-for="item in operators" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
          <ScheduleRuleValueEditor v-model="node.right" label="条件右值" compact />
        </template>
        <el-button type="danger" :disabled="readonly" @click="emit('remove')">删除</el-button>
      </template>
    </article>
    <div v-if="node.type === 'composite'" class="rule-condition-children">
      <p v-if="!node.children.length" class="rule-condition-children__empty">暂无子条件，请添加</p>
      <ScheduleRuleConditionEditor
        v-for="(child, index) in node.children"
        :key="child.id"
        :node="child"
        :readonly="readonly"
        @remove="node.children.splice(index, 1)"
        @replace="(next) => (node.children[index] = next)"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { RuleCompareOperator, RuleConditionNode } from "@/types";
import {
  createEmptyCompositeCondition,
  createEmptyLeafCondition,
  createEmptyMonitorLeafCondition,
} from "@/views/SpaceBehaviorScheduleWorkspace/utils/scheduleRuleFlowFactory";
import ScheduleRuleMonitorLeafEditor from "./ScheduleRuleMonitorLeafEditor.vue";
import ScheduleRuleValueEditor from "./ScheduleRuleValueEditor.vue";

const props = withDefaults(defineProps<{ node: RuleConditionNode; isRoot?: boolean; readonly?: boolean }>(), {
  isRoot: false,
  readonly: false,
});
const emit = defineEmits<{ remove: []; replace: [node: RuleConditionNode] }>();
const operators: { value: RuleCompareOperator; label: string }[] = [
  { value: "eq", label: "等于" },
  { value: "neq", label: "不等于" },
  { value: "gt", label: "大于" },
  { value: "lt", label: "小于" },
  { value: "gte", label: "大于或等于" },
  { value: "lte", label: "小于或等于" },
  { value: "contains", label: "包含" },
  { value: "notContains", label: "不包含" },
];

const conditionCardClass = computed(() => {
  if (props.node.type === "composite") return "rule-condition-card--composite";
  if (props.node.type === "monitor") return "rule-condition-card--monitor";
  return "rule-condition-card--leaf";
});

const changeType = computed<"compare" | "insert" | "delete">(() => {
  if (props.node.type === "monitor") return props.node.monitorType;
  return "compare";
});

/**
 * @description 切换当前条件行的变更类型并替换节点形态。
 * @param mode 变更类型。
 */
function applyChangeType(mode: string | number | boolean | undefined): void {
  if (props.readonly || props.node.type === "composite") return;
  if (mode === "compare") {
    if (props.node.type === "leaf") return;
    emit("replace", { ...createEmptyLeafCondition(), id: props.node.id });
    return;
  }
  if (mode === "insert" || mode === "delete") {
    if (props.node.type === "monitor" && props.node.monitorType === mode) return;
    const next = createEmptyMonitorLeafCondition(mode);
    next.id = props.node.id;
    if (props.node.type === "monitor") {
      next.objectId = props.node.objectId;
      next.objectName = props.node.objectName;
      next.storageGroup = props.node.storageGroup;
    }
    emit("replace", next);
  }
}

/**
 * @description 追加属性比较子条件或子复合条件。
 * @param kind 子节点形态。
 */
function appendConditionChild(kind: "leaf" | "composite"): void {
  if (props.node.type !== "composite" || props.readonly) return;
  if (kind === "composite") {
    const child = createEmptyCompositeCondition(false);
    child.children.push(createEmptyLeafCondition());
    props.node.children.push(child);
    return;
  }
  props.node.children.push(createEmptyLeafCondition());
}
</script>

<style scoped lang="scss">
.rule-condition-branch {
  display: flex;
  align-items: flex-start;
  gap: 36px;
  min-width: 0;
}
.rule-condition-card {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  padding: 12px 16px;
  border: 1px solid var(--aircas-color-border-soft);
  border-radius: 8px;
  background: linear-gradient(135deg, var(--aircas-color-panel-background), var(--aircas-color-panel-background-deep));
}
.rule-condition-card--composite {
  width: 238px;
  border-color: var(--aircas-color-accent-cyan);
}
.rule-condition-card--leaf {
  width: 640px;
}
.rule-condition-card--monitor {
  width: 560px;
}
.rule-condition-card--composite > .el-select {
  width: 96px;
}
.rule-condition-card__change-type {
  width: 148px;
}
.rule-condition-card--leaf > .el-select:not(.rule-condition-card__change-type) {
  width: 128px;
}
.rule-condition-port {
  position: absolute;
  top: 50%;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--aircas-color-accent-cyan);
  transform: translateY(-50%);
}
.rule-condition-port--in {
  left: -6px;
}
.rule-condition-port--out {
  right: -6px;
}
.rule-condition-children {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.rule-condition-children__empty {
  margin: 0;
  color: var(--aircas-color-text-muted);
}
.rule-condition-card .el-button + .el-button {
  margin-left: 0;
}
.rule-condition-card__add {
  height: 28px;
  margin: 0;
  padding: 0 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}
.rule-condition-card__add--leaf {
  --el-button-text-color: var(--aircas-color-text-secondary);
  --el-button-bg-color: var(--aircas-color-panel-background-deep);
  --el-button-border-color: var(--aircas-color-border);
  --el-button-hover-text-color: var(--aircas-color-text-primary);
  --el-button-hover-bg-color: var(--aircas-color-panel-background-deep);
  --el-button-hover-border-color: var(--aircas-color-primary);
  --el-button-active-text-color: var(--aircas-color-text-primary);
  --el-button-active-bg-color: var(--aircas-color-active);
  --el-button-active-border-color: var(--aircas-color-primary);
}
.rule-condition-card__add--composite {
  --el-button-text-color: var(--aircas-color-category-blue);
  --el-button-bg-color: var(--aircas-color-effect-blue-soft);
  --el-button-border-color: var(--aircas-color-effect-blue-border);
  --el-button-hover-text-color: var(--aircas-color-text-primary);
  --el-button-hover-bg-color: var(--aircas-color-effect-blue-fill);
  --el-button-hover-border-color: var(--aircas-color-category-blue);
  --el-button-active-text-color: var(--aircas-color-text-primary);
  --el-button-active-bg-color: var(--aircas-color-effect-blue-fill);
  --el-button-active-border-color: var(--aircas-color-category-blue);
}
</style>
