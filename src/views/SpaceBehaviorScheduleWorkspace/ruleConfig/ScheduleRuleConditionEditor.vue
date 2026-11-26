<template>
  <section class="rule-condition-branch" :data-rule-node-id="node.id">
    <article class="rule-condition-card" :class="conditionCardClass">
      <span class="rule-condition-port rule-condition-port--in" data-rule-port="in" aria-hidden="true"></span>
      <template v-if="node.type === 'composite'">
        <el-select v-model="node.logic" class="rule-condition-card__logic" ariaLabel="条件组合方式" :disabled="readonly">
          <el-option label="并且" value="and" />
          <el-option label="或者" value="or" />
        </el-select>
        <el-select
          v-if="isRoot"
          class="rule-condition-card__change-type"
          :model-value="changeType"
          ariaLabel="变更类型"
          :disabled="readonly"
          @update:model-value="applyChangeType"
        >
          <el-option label="新增实例或子表行" value="insert" />
          <el-option label="更新实例或子表行" value="update" />
          <el-option label="删除实例或子表行" value="delete" />
        </el-select>
        <el-button class="rule-condition-card__add rule-condition-card__add--leaf" :disabled="readonly" @click="appendConditionChild('leaf')"
          >添加子条件</el-button
        >
        <el-button class="rule-condition-card__add rule-condition-card__add--composite" :disabled="readonly" @click="appendConditionChild('composite')"
          >添加子复合条件</el-button
        >
        <el-button v-if="!isRoot" class="rule-condition-card__remove" type="danger" :disabled="readonly" @click="emit('remove')">删除</el-button>
        <span class="rule-condition-port rule-condition-port--out" data-rule-port="out" aria-hidden="true"></span>
      </template>
      <template v-else>
        <div class="rule-condition-card__body">
          <template v-if="node.type === 'monitor'">
            <ScheduleRuleMonitorLeafEditor :node="node" :readonly="readonly" />
          </template>
          <template v-else>
            <ScheduleRuleValueEditor v-model="node.left" label="条件左值" compact />
            <el-select v-model="node.operator" class="rule-condition-card__operator" ariaLabel="比较运算符" :disabled="readonly">
              <el-option v-for="item in operators" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
            <ScheduleRuleValueEditor v-model="node.right" label="条件右值" compact />
          </template>
          <el-button class="rule-condition-card__remove" type="danger" :disabled="readonly" @click="emit('remove')">删除</el-button>
        </div>
      </template>
    </article>
    <div v-if="node.type === 'composite'" class="rule-condition-children">
      <p v-if="!node.children.length" class="rule-condition-children__empty">暂无子条件，请添加</p>
      <ScheduleRuleConditionEditor
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        :readonly="readonly"
        @remove="removeConditionChild(child.id)"
        @replace="(next) => replaceConditionChild(child.id, next)"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, inject, type Ref } from "vue";
import type { RuleCompareOperator, RuleCompositeCondition, RuleConditionMonitorType, RuleConditionNode, RuleMonitorLeafCondition } from "@/types";
import { createEmptyCompositeCondition, createEmptyLeafCondition } from "@/views/SpaceBehaviorScheduleWorkspace/utils/scheduleRuleFlowFactory";
import { RULE_CONDITION_ROOT_KEY } from "./ruleConditionRootKey";
import ScheduleRuleMonitorLeafEditor from "./ScheduleRuleMonitorLeafEditor.vue";
import ScheduleRuleValueEditor from "./ScheduleRuleValueEditor.vue";

const props = withDefaults(defineProps<{ node: RuleConditionNode; isRoot?: boolean; readonly?: boolean }>(), {
  isRoot: false,
  readonly: false,
});
const emit = defineEmits<{ remove: []; replace: [node: RuleConditionNode] }>();
const rootCondition = inject<Ref<RuleCompositeCondition> | null>(RULE_CONDITION_ROOT_KEY, null);
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
  return "rule-condition-card--leaf";
});

const changeType = computed<RuleConditionMonitorType>(() => {
  const monitorType = rootCondition?.value.monitorType ?? (props.isRoot && props.node.type === "composite" ? props.node.monitorType : undefined);
  if (monitorType === "insert" || monitorType === "update" || monitorType === "delete") return monitorType;
  return "update";
});

/**
 * @description 将历史监测叶子转为比较叶子，尽量保留对象标识到左值变量。
 * @param monitor 监测叶子。
 * @returns 比较叶子。
 */
function convertMonitorNodeToLeaf(monitor: RuleMonitorLeafCondition): ReturnType<typeof createEmptyLeafCondition> {
  const next = createEmptyLeafCondition();
  next.id = monitor.id;
  if (monitor.objectId.trim()) {
    next.left = {
      kind: "variable",
      objectId: monitor.objectId,
      objectName: monitor.objectName || monitor.objectId,
      objectKind: "object",
      propertyId: "",
      propertyName: "",
      instanceIds: [],
      storageGroup: monitor.storageGroup || "main",
    };
  }
  return next;
}

/**
 * @description 递归将子树中的旧监测叶子转为比较叶子。
 * @param composite 组合条件。
 */
function convertMonitorDescendants(composite: RuleCompositeCondition): void {
  for (let index = 0; index < composite.children.length; index++) {
    const child = composite.children[index];
    if (!child) continue;
    if (child.type === "monitor") composite.children[index] = convertMonitorNodeToLeaf(child);
    else if (child.type === "composite") convertMonitorDescendants(child);
  }
}

/**
 * @description 在根组合上切换监测事件类型；新增/更新/删除共用比较表单。
 * @param mode 变更类型。
 */
function applyChangeType(mode: string | number | boolean | undefined): void {
  if (props.readonly || !props.isRoot || props.node.type !== "composite") return;
  if (mode !== "insert" && mode !== "update" && mode !== "delete") return;
  props.node.monitorType = mode;
  convertMonitorDescendants(props.node);
}

/**
 * @description 追加比较子条件或子复合条件。
 * @param kind 子节点形态。
 */
function appendConditionChild(kind: "leaf" | "composite"): void {
  if (props.node.type !== "composite" || props.readonly) return;
  if (kind === "composite") {
    const child = createEmptyCompositeCondition(false);
    delete child.monitorType;
    child.children.push(createEmptyLeafCondition());
    props.node.children.push(child);
    return;
  }
  props.node.children.push(createEmptyLeafCondition());
}

/**
 * @description 按子条件标识删除直属子节点。
 * @param childId 子条件标识。
 */
function removeConditionChild(childId: string): void {
  if (props.node.type !== "composite" || props.readonly) return;
  const index = props.node.children.findIndex((child) => child.id === childId);
  if (index < 0) return;
  props.node.children.splice(index, 1);
}

/**
 * @description 按子条件标识替换直属子节点。
 * @param childId 子条件标识。
 * @param next 替换后的子条件。
 */
function replaceConditionChild(childId: string, next: RuleConditionNode): void {
  if (props.node.type !== "composite" || props.readonly) return;
  const index = props.node.children.findIndex((child) => child.id === childId);
  if (index < 0) return;
  props.node.children[index] = next;
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
  flex-wrap: nowrap;
  align-items: flex-start;
  gap: 8px;
  flex-shrink: 0;
  padding: 12px 16px;
  border: 1px solid var(--aircas-color-border-soft);
  border-radius: 8px;
  background: linear-gradient(135deg, var(--aircas-color-panel-background), var(--aircas-color-panel-background-deep));
}
.rule-condition-card--composite {
  width: 312px;
  flex-wrap: wrap;
  align-items: center;
  border-color: var(--aircas-color-accent-cyan);
}
.rule-condition-card--leaf {
  width: max-content;
  max-width: 100%;
}
.rule-condition-card__logic {
  width: 96px;
}
.rule-condition-card__change-type {
  width: 180px;
}
.rule-condition-card__body {
  display: flex;
  flex: 0 1 auto;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  width: max-content;
  max-width: 100%;
  min-width: 0;
}
.rule-condition-card__remove {
  flex: 0 0 auto;
  margin: 0;
}
.rule-condition-card__operator {
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
