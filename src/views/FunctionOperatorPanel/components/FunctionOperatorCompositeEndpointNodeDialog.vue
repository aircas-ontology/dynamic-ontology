<template>
  <el-drawer
    :model-value="modelValue"
    class="composite-endpoint-node-drawer"
    :title="dialogTitle"
    size="560px"
    append-to-body
    destroy-on-close
    @update:model-value="emit('update:modelValue', $event)"
  >
    <el-form label-position="top">
      <el-form-item v-if="localKind === 'start'" label="编排入参">
        <p class="composite-endpoint-node-drawer__hint">定义编排的输入参数，外部调用或测试时通过这些参数传入数据。</p>
      </el-form-item>
      <el-form-item v-else label="编排出参">
        <p class="composite-endpoint-node-drawer__hint">定义编排的输出参数，绑定上游节点的输出作为最终结果。</p>
      </el-form-item>

      <div class="composite-endpoint-node-drawer__param-list">
        <div v-for="(param, index) in params" :key="param.id" class="composite-endpoint-node-drawer__param-row">
          <el-input v-model="param.name" placeholder="参数名" class="composite-endpoint-node-drawer__param-name" />
          <el-select v-model="param.type" class="composite-endpoint-node-drawer__param-type">
            <el-option v-for="item in paramTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
          <el-button @click="removeParam(index)">删除</el-button>
        </div>
        <el-button type="primary" plain @click="addParam">添加参数</el-button>
      </div>

      <template v-if="localKind === 'end'">
        <h4 class="composite-endpoint-node-drawer__section-title">出参绑定</h4>
        <p v-if="!hasUpstream" class="composite-endpoint-node-drawer__hint">当前无前驱节点，出参仅支持手动输入</p>
        <FunctionOperatorCompositeInputBindingTree
          v-if="bindingNodes.length"
          :nodes="bindingNodes"
          :bindings="bindings"
          :has-upstream="hasUpstream"
          :upstream-options="upstreamOptions"
          ariaLabel="出参绑定"
          @update-mode="onBindingModeChange"
          @update-value="onManualValueChange"
          @update-upstream="onUpstreamParamChange"
        />
        <p v-else-if="hasUpstream" class="composite-endpoint-node-drawer__hint">请先添加出参</p>
      </template>
    </el-form>

    <template #footer>
      <div class="composite-endpoint-node-drawer__footer">
        <el-button @click="emit('update:modelValue', false)">取消</el-button>
        <el-button type="primary" @click="emitConfirm">确定</el-button>
      </div>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";

import type { CompositeWorkflowInputBinding, CompositeWorkflowParamBrief } from "@/types";

import type { CompositeWorkflowEndpointNodeEditContext } from "../composables/useCompositeWorkflowCanvas";
import { alignCompositeWorkflowInputBindings, compositeWorkflowParamPathKey, listCompositeWorkflowParamNodes } from "../utils/compositeWorkflowGraph.ts";
import FunctionOperatorCompositeInputBindingTree from "./FunctionOperatorCompositeInputBindingTree.vue";

/** 参数行。 */
interface EndpointParamRow {
  id: string;
  name: string;
  type: string;
}

/** 上游选项（带来源节点标识）。 */
interface UpstreamOption {
  value: string;
  label: string;
  paramPath: string[];
  paramName: string;
  paramType: string;
  sourceNodeId?: string;
}

const props = defineProps<{
  modelValue: boolean;
  context: CompositeWorkflowEndpointNodeEditContext | null;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  confirm: [
    payload: {
      nodeId: string;
      kind: "start" | "end";
      params: Array<{ id: string; name: string; type: string }>;
      inputBindings?: CompositeWorkflowInputBinding[];
    },
  ];
}>();

/** 开始节点仅允许标量类型。 */
const START_PARAM_TYPE_OPTIONS = [
  { label: "数字", value: "number" },
  { label: "字符串", value: "string" },
  { label: "布尔", value: "boolean" },
] as const;

/** 结束节点保留五类基础类型。 */
const END_PARAM_TYPE_OPTIONS = [
  { label: "数字", value: "number" },
  { label: "字符串", value: "string" },
  { label: "布尔", value: "boolean" },
  { label: "对象", value: "object" },
  { label: "数组", value: "array" },
] as const;

const localKind = ref<"start" | "end">("start");
const localNodeId = ref("");
const params = ref<EndpointParamRow[]>([]);
const hasUpstream = ref(false);
const upstreamOutputs = ref<CompositeWorkflowParamBrief[]>([]);
const bindings = ref<CompositeWorkflowInputBinding[]>([]);

const dialogTitle = computed(() => (localKind.value === "start" ? "开始节点 — 配置入参" : "结束节点 — 配置出参"));

/**
 * @description 按节点 kind 返回可选参数类型。
 */
const paramTypeOptions = computed(() => (localKind.value === "start" ? START_PARAM_TYPE_OPTIONS : END_PARAM_TYPE_OPTIONS));

/**
 * @description 规范化开始节点参数类型：object/array 回落为 string。
 * @param type 原始类型。
 * @returns 允许的类型。
 */
function normalizeStartParamType(type: string): string {
  if (type === "number" || type === "string" || type === "boolean") {
    return type;
  }
  return "string";
}

/**
 * @description 将出参列表转为绑定树节点。
 */
const bindingNodes = computed(() =>
  params.value
    .filter((item) => item.name.trim().length > 0)
    .map((item) => ({
      paramName: item.name.trim(),
      paramType: item.type === "number" ? "double" : item.type,
    })),
);

/**
 * @description 上游输出下拉选项（含来源节点标识）。
 */
const upstreamOptions = computed(() =>
  listCompositeWorkflowParamNodes(upstreamOutputs.value).map((node) => {
    const pathKey = compositeWorkflowParamPathKey(node.paramPath);
    const sourceLabel = node.brief.sourceNodeId ? ` [${node.brief.sourceNodeId.slice(0, 6)}]` : "";
    return {
      value: `${node.brief.sourceNodeId ?? ""}:${pathKey}`,
      label: `${pathKey}${sourceLabel}（${node.brief.paramType}）`,
      paramPath: node.paramPath,
      paramName: node.brief.paramName,
      paramType: node.brief.paramType,
      sourceNodeId: node.brief.sourceNodeId,
    };
  }),
);

watch(
  () => props.context,
  (ctx) => {
    if (!ctx) {
      localKind.value = "start";
      localNodeId.value = "";
      params.value = [];
      hasUpstream.value = false;
      upstreamOutputs.value = [];
      bindings.value = [];
      return;
    }
    localKind.value = ctx.kind;
    localNodeId.value = ctx.nodeId;
    params.value = ctx.params.map((item, index) => ({
      id: item.id || `p_${Date.now()}_${index}`,
      name: item.name,
      type: ctx.kind === "start" ? normalizeStartParamType(item.type) : item.type,
    }));
    if (ctx.kind === "end") {
      hasUpstream.value = ctx.hasUpstream ?? false;
      upstreamOutputs.value = ctx.upstreamOutputs ?? [];
      const paramBriefs: CompositeWorkflowParamBrief[] = params.value
        .filter((item) => item.name.trim().length > 0)
        .map((item) => ({
          paramName: item.name.trim(),
          paramType: item.type === "number" ? "double" : item.type,
        }));
      bindings.value = alignCompositeWorkflowInputBindings(paramBriefs, ctx.inputBindings ?? [], ctx.upstreamOutputs ?? [], ctx.hasUpstream ?? false);
    } else {
      hasUpstream.value = false;
      upstreamOutputs.value = [];
      bindings.value = [];
    }
  },
  { immediate: true },
);

/**
 * @description 添加一行空参数。
 */
function addParam(): void {
  params.value.push({ id: `p_${Date.now()}`, name: "", type: "string" });
}

/**
 * @description 删除指定行。
 * @param index 行索引。
 */
function removeParam(index: number): void {
  params.value.splice(index, 1);
}

/**
 * @description 判断绑定路径是否相同。
 */
function isSameParamPath(left: string[], right: string[]): boolean {
  const normalizedLeft = left.length > 0 ? left : [];
  return normalizedLeft.length === right.length && normalizedLeft.every((item, index) => item === right[index]);
}

/**
 * @description 按路径替换或追加一条叶子绑定。
 */
function replaceBinding(paramPath: string[], next: CompositeWorkflowInputBinding): void {
  const index = bindings.value.findIndex((item) => isSameParamPath(item.paramPath.length > 0 ? item.paramPath : [item.paramName], paramPath));
  if (index < 0) {
    bindings.value = [...bindings.value, next];
    return;
  }
  const copy = [...bindings.value];
  copy[index] = next;
  bindings.value = copy;
}

/**
 * @description 切换绑定模式。
 */
function onBindingModeChange(paramPath: string[], mode: string): void {
  const paramName = paramPath[paramPath.length - 1] ?? "";
  if (mode === "fromUpstream") {
    replaceBinding(paramPath, {
      mode: "fromUpstream",
      paramName,
      paramPath,
      upstreamParamName: "",
      upstreamParamPath: [],
    });
    return;
  }
  replaceBinding(paramPath, { mode: "manual", paramName, paramPath, value: "" });
}

/**
 * @description 更新手动值。
 */
function onManualValueChange(paramPath: string[], value: string): void {
  const current = bindings.value.find((item) => isSameParamPath(item.paramPath, paramPath) && item.mode === "manual");
  if (!current || current.mode !== "manual") {
    return;
  }
  replaceBinding(paramPath, { ...current, value });
}

/**
 * @description 更新上游输出节点映射。
 */
function onUpstreamParamChange(paramPath: string[], upstreamValue: string): void {
  const current = bindings.value.find((item) => isSameParamPath(item.paramPath, paramPath) && item.mode === "fromUpstream");
  if (!current || current.mode !== "fromUpstream") {
    return;
  }
  const option = upstreamOptions.value.find((item) => item.value === upstreamValue);
  if (!option) {
    return;
  }
  replaceBinding(paramPath, {
    mode: "fromUpstream",
    paramName: current.paramName,
    paramPath: current.paramPath,
    upstreamParamName: option.paramName,
    upstreamParamPath: option.paramPath,
    sourceNodeId: option.sourceNodeId,
  });
}

/**
 * @description 确认后提交。
 */
function emitConfirm(): void {
  const validParams = params.value.filter((item) => item.name.trim().length > 0);
  const payload: {
    nodeId: string;
    kind: "start" | "end";
    params: Array<{ id: string; name: string; type: string }>;
    inputBindings?: CompositeWorkflowInputBinding[];
  } = {
    nodeId: localNodeId.value,
    kind: localKind.value,
    params: validParams.map((item) => ({
      id: item.id,
      name: item.name.trim(),
      type: localKind.value === "start" ? normalizeStartParamType(item.type) : item.type,
    })),
  };
  if (localKind.value === "end") {
    payload.inputBindings = bindings.value;
  }
  emit("confirm", payload);
  emit("update:modelValue", false);
}
</script>

<style lang="scss">
.composite-endpoint-node-drawer {
  &__hint {
    color: var(--el-text-color-secondary, #909399);
    font-size: 12px;
    margin: 0 0 8px;
  }

  &__section-title {
    margin: 16px 0 8px;
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary, #303133);
  }

  &__param-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__param-row {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  &__param-name {
    flex: 1;
  }

  &__param-type {
    width: 120px;
    flex-shrink: 0;
  }

  &__footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }
}
</style>
