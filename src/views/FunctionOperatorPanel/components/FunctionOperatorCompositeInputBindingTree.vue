<template>
  <ul class="composite-input-binding-tree" :aria-label="ariaLabel">
    <li v-for="node in nodes" :key="bindingPathKey(node)" class="composite-input-binding-tree__item">
      <div class="composite-input-binding-tree__label">
        <span class="composite-input-binding-tree__name">{{ node.paramName }}</span>
        <span class="composite-input-binding-tree__type">{{ node.paramType }}</span>
      </div>
      <FunctionOperatorCompositeInputBindingTree
        v-if="node.fields && node.fields.length > 0"
        :nodes="node.fields"
        :path-prefix="childPath(node.paramName)"
        :bindings="bindings"
        :has-upstream="hasUpstream"
        :upstream-options="upstreamOptions"
        @update-mode="(paramPath, mode) => emit('update-mode', paramPath, mode)"
        @update-value="(paramPath, value) => emit('update-value', paramPath, value)"
        @update-upstream="(paramPath, upstreamPathKey) => emit('update-upstream', paramPath, upstreamPathKey)"
      />
      <div v-else class="composite-input-binding-tree__controls">
        <el-select
          :model-value="leafBinding(node.paramName).mode"
          class="composite-input-binding-tree__mode"
          @update:model-value="emit('update-mode', childPath(node.paramName), String($event))"
        >
          <el-option label="手动输入" value="manual" />
          <el-option label="来自上游" value="fromUpstream" :disabled="!hasUpstream || upstreamOptions.length === 0" />
        </el-select>
        <el-input
          v-if="leafBinding(node.paramName).mode === 'manual'"
          :model-value="manualValue(node.paramName)"
          placeholder="参数值"
          @update:model-value="emit('update-value', childPath(node.paramName), String($event ?? ''))"
        />
        <el-select
          v-else
          :model-value="upstreamValue(node.paramName)"
          placeholder="请选择上游参数"
          filterable
          @update:model-value="emit('update-upstream', childPath(node.paramName), String($event ?? ''))"
        >
          <el-option v-for="item in upstreamOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </div>
    </li>
  </ul>
</template>

<script setup lang="ts">
import type { CompositeWorkflowInputBinding, CompositeWorkflowParamBrief } from "@/types";

import { compositeWorkflowParamPathKey } from "../utils/compositeWorkflowGraph.ts";

/** 上游 OUTPUT 叶子下拉项。 */
export interface CompositeWorkflowUpstreamLeafOption {
  value: string;
  label: string;
  paramPath: string[];
  paramName: string;
  paramType: string;
}

const props = defineProps<{
  nodes: CompositeWorkflowParamBrief[];
  /** 当前层之前的参数名。 */
  pathPrefix?: string[];
  bindings: CompositeWorkflowInputBinding[];
  hasUpstream: boolean;
  upstreamOptions: CompositeWorkflowUpstreamLeafOption[];
  /** 仅根列表提供。 */
  ariaLabel?: string;
}>();

const emit = defineEmits<{
  "update-mode": [paramPath: string[], mode: string];
  "update-value": [paramPath: string[], value: string];
  "update-upstream": [paramPath: string[], upstreamPathKey: string];
}>();

/**
 * @description 拼接当前节点的完整参数路径。
 * @param paramName 当前参数名。
 * @returns 从根到当前节点的路径。
 */
function childPath(paramName: string): string[] {
  return [...(props.pathPrefix ?? []), paramName];
}

/**
 * @description 生成当前层列表键。
 * @param node 参数节点。
 * @returns 路径键。
 */
function bindingPathKey(node: CompositeWorkflowParamBrief): string {
  return compositeWorkflowParamPathKey(childPath(node.paramName));
}

/**
 * @description 判断绑定是否对应当前叶子路径。
 * @param binding 入参绑定。
 * @param paramPath 叶子路径。
 * @returns 匹配返回 true。
 */
function matchesBindingPath(binding: CompositeWorkflowInputBinding, paramPath: string[]): boolean {
  const current = binding.paramPath.length > 0 ? binding.paramPath : [binding.paramName];
  return current.length === paramPath.length && current.every((item, index) => item === paramPath[index]);
}

/**
 * @description 查找叶子绑定；没有保存值时按手动空值展示。
 * @param paramName 叶子参数名。
 * @returns 叶子绑定。
 */
function leafBinding(paramName: string): CompositeWorkflowInputBinding {
  const paramPath = childPath(paramName);
  return (
    props.bindings.find((item) => matchesBindingPath(item, paramPath)) ?? {
      mode: "manual",
      paramName,
      paramPath,
      value: "",
    }
  );
}

/**
 * @description 读取叶子的手动值。
 * @param paramName 叶子参数名。
 * @returns 手动输入值。
 */
function manualValue(paramName: string): string {
  const binding = leafBinding(paramName);
  return binding.mode === "manual" ? binding.value : "";
}

/**
 * @description 读取叶子映射的上游输出路径键。
 * @param paramName 叶子参数名。
 * @returns 上游路径键。
 */
function upstreamValue(paramName: string): string {
  const binding = leafBinding(paramName);
  if (binding.mode !== "fromUpstream") {
    return "";
  }
  if (Array.isArray(binding.upstreamParamPath) && binding.upstreamParamPath.length > 0) {
    return compositeWorkflowParamPathKey(binding.upstreamParamPath);
  }
  return binding.upstreamParamName;
}
</script>

<style scoped lang="scss">
.composite-input-binding-tree {
  display: flex;
  margin: 0;
  padding: 0;
  flex-direction: column;
  gap: 8px;
  list-style: none;
}

.composite-input-binding-tree .composite-input-binding-tree {
  margin-top: 8px;
  margin-left: 12px;
  padding-left: 8px;
  border-left: 1px solid var(--aircas-color-border);
}

.composite-input-binding-tree__label {
  display: flex;
  min-width: 0;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}

.composite-input-binding-tree__name {
  min-width: 0;
  color: var(--aircas-color-text-primary);
  font-size: 13px;
  word-break: break-word;
}

.composite-input-binding-tree__type {
  flex-shrink: 0;
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
}

.composite-input-binding-tree__controls {
  display: grid;
  grid-template-columns: 120px minmax(0, 1fr);
  gap: 8px;
  margin-top: 8px;
}

.composite-input-binding-tree__mode {
  width: 100%;
}
</style>
