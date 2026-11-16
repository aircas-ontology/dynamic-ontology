<template>
  <section class="rule-condition-branch" :data-rule-node-id="node.id">
    <article class="rule-condition-card" :class="node.type === 'composite' ? 'rule-condition-card--composite' : 'rule-condition-card--leaf'">
      <span class="rule-condition-port rule-condition-port--in" data-rule-port="in" aria-hidden="true"></span>
      <template v-if="node.type === 'composite'">
        <el-select v-model="node.logic" ariaLabel="条件组合方式">
          <el-option label="并且" value="and" />
          <el-option label="或者" value="or" />
        </el-select>
        <el-button class="rule-condition-card__add rule-condition-card__add--leaf" @click="node.children.push(createEmptyLeafCondition())"
          >添加子条件</el-button
        >
        <el-button class="rule-condition-card__add rule-condition-card__add--composite" @click="node.children.push(createEmptyCompositeCondition())"
          >添加子复合条件</el-button
        >
        <el-button v-if="!isRoot" type="danger" @click="emit('remove')">删除</el-button>
        <span class="rule-condition-port rule-condition-port--out" data-rule-port="out" aria-hidden="true"></span>
      </template>
      <template v-else>
        <ScheduleRuleValueEditor v-model="node.left" label="条件左值" compact />
        <el-select v-model="node.operator" ariaLabel="比较运算符">
          <el-option v-for="item in operators" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
        <ScheduleRuleValueEditor v-model="node.right" label="条件右值" compact />
        <el-button type="danger" @click="emit('remove')">删除</el-button>
      </template>
    </article>
    <div v-if="node.type === 'composite'" class="rule-condition-children">
      <p v-if="!node.children.length" class="rule-condition-children__empty">暂无子条件，请添加</p>
      <ScheduleRuleConditionEditor v-for="(child, index) in node.children" :key="child.id" :node="child" @remove="node.children.splice(index, 1)" />
    </div>
  </section>
</template>

<script setup lang="ts">
import type { RuleCompareOperator, RuleConditionNode } from "@/types";
import { createEmptyCompositeCondition, createEmptyLeafCondition } from "@/views/SpaceBehaviorScheduleWorkspace/utils/scheduleRuleFlowFactory";
import ScheduleRuleValueEditor from "./ScheduleRuleValueEditor.vue";
withDefaults(defineProps<{ node: RuleConditionNode; isRoot?: boolean }>(), { isRoot: false });
const emit = defineEmits<{ remove: [] }>();
const operators: { value: RuleCompareOperator; label: string }[] = [
  { value: "eq", label: "等于" },
  { value: "neq", label: "不等于" },
  { value: "gt", label: "大于" },
  { value: "lt", label: "小于" },
  { value: "gte", label: "大于或等于" },
  { value: "lte", label: "小于或等于" },
  { value: "contains", label: "包含" },
  { value: "notContains", label: "不包含" },
  { value: "prefixContains", label: "前置包含" },
];
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
  width: 550px;
}
.rule-condition-card--composite > .el-select {
  width: 96px;
}
.rule-condition-card--leaf > .el-select {
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
