<template>
  <el-drawer
    :model-value="modelValue"
    class="composite-logic-node-drawer"
    :title="dialogTitle"
    size="520px"
    append-to-body
    destroy-on-close
    @update:model-value="emit('update:modelValue', $event)"
  >
    <el-form v-if="localKind === 'loop'" label-position="top">
      <el-form-item label="集合来源">
        <el-radio-group :model-value="loopCollectionMode" @update:model-value="onLoopCollectionModeChange">
          <el-radio value="manual">手动 JSON 数组</el-radio>
          <el-radio value="fromUpstream">上游输出</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item v-if="loopCollectionMode === 'manual'" label="JSON 数组">
        <el-input v-model="loopJsonText" type="textarea" :rows="4" />
      </el-form-item>
      <el-form-item v-else label="上游输出名">
        <el-input v-model="loopUpstreamParamName" placeholder="例如：items" />
      </el-form-item>
      <el-form-item label="单项变量名">
        <el-input v-model="loopItemParamName" placeholder="item" />
      </el-form-item>
      <el-form-item label="最大迭代次数">
        <el-input-number :model-value="loopMaxIterations" :min="1" :max="10000" @update:model-value="onLoopMaxIterationsChange" />
      </el-form-item>
    </el-form>

    <el-form v-else label-position="top">
      <el-form-item label="上游输出">
        <el-select
          v-model="branchLeftPathKey"
          filterable
          clearable
          :disabled="!hasUpstream"
          :placeholder="hasUpstream ? '选择上游输出' : '无上游节点'"
          style="width: 100%"
        >
          <el-option v-for="item in upstreamOutputOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="运算符">
        <el-select v-model="branchOperator" style="width: 100%">
          <el-option v-for="item in branchOperatorOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="比较值">
        <el-input v-model="branchRightManual" placeholder="填写具体数值或字符串" />
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="composite-logic-node-drawer__footer">
        <el-button @click="emit('update:modelValue', false)">取消</el-button>
        <el-button type="primary" @click="emitConfirm">确定</el-button>
      </div>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";

import type { CompositeWorkflowBranchOperator } from "@/types";

import type { CompositeWorkflowLogicNodeEditContext } from "../composables/useCompositeWorkflowCanvas";
import { compositeWorkflowParamPathKey, listCompositeWorkflowParamNodes, parseCompositeWorkflowParamPathKey } from "../utils/compositeWorkflowGraph.ts";

const props = defineProps<{
  modelValue: boolean;
  context: CompositeWorkflowLogicNodeEditContext | null;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  confirm: [context: CompositeWorkflowLogicNodeEditContext];
}>();

const localKind = ref<"loop" | "branch">("loop");
const loopCollectionMode = ref<"manual" | "fromUpstream">("manual");
const loopJsonText = ref("[]");
const loopUpstreamParamName = ref("");
const loopItemParamName = ref("item");
const loopMaxIterations = ref(100);
const branchLeftPathKey = ref("");
const branchOperator = ref<CompositeWorkflowBranchOperator>("eq");
const branchRightManual = ref("");
const hasUpstream = ref(false);

const branchOperatorOptions: { value: CompositeWorkflowBranchOperator; label: string }[] = [
  { value: "eq", label: "==" },
  { value: "ne", label: "!==" },
  { value: "gt", label: ">" },
  { value: "gte", label: ">=" },
  { value: "lt", label: "<" },
  { value: "lte", label: "<=" },
];

const dialogTitle = computed(() => (localKind.value === "loop" ? "循环节点配置" : "条件分支配置"));

const upstreamOutputOptions = computed(() => {
  const outputs = props.context?.upstreamOutputs ?? [];
  return listCompositeWorkflowParamNodes(outputs).map((node) => ({
    value: compositeWorkflowParamPathKey(node.paramPath),
    label: `${compositeWorkflowParamPathKey(node.paramPath)}（${node.brief.paramType}）`,
  }));
});

/**
 * @description 更新循环集合来源模式。
 * @param value 单选值。
 */
function onLoopCollectionModeChange(value: string | number | boolean | undefined): void {
  if (value === "manual" || value === "fromUpstream") {
    loopCollectionMode.value = value;
  }
}

/**
 * @description 更新最大迭代次数。
 * @param value 输入值。
 */
function onLoopMaxIterationsChange(value: number | undefined): void {
  loopMaxIterations.value = typeof value === "number" && Number.isFinite(value) ? value : 100;
}

/**
 * @description 从上下文回填表单。
 */
function hydrateFromContext(): void {
  const context = props.context;
  if (!context) {
    return;
  }
  localKind.value = context.kind;
  hasUpstream.value = context.hasUpstream;
  if (context.kind === "loop") {
    const config = context.loopConfig;
    loopItemParamName.value = config?.itemParamName ?? "item";
    loopMaxIterations.value = config?.maxIterations ?? 100;
    if (config?.collection.mode === "fromUpstream") {
      loopCollectionMode.value = "fromUpstream";
      loopUpstreamParamName.value = config.collection.upstreamParamName;
    } else {
      loopCollectionMode.value = "manual";
      loopJsonText.value = config?.collection.mode === "manual" ? config.collection.jsonText : "[]";
    }
    return;
  }
  const config = context.branchConfig;
  branchOperator.value = config?.operator ?? "eq";
  branchRightManual.value = config?.right?.value ?? "";
  const path = config?.left.upstreamParamPath ?? [];
  branchLeftPathKey.value = path.length > 0 ? compositeWorkflowParamPathKey(path) : "";
}

/**
 * @description 确认写回逻辑配置。
 */
function emitConfirm(): void {
  const context = props.context;
  if (!context) {
    return;
  }
  if (localKind.value === "loop") {
    emit("confirm", {
      nodeId: context.nodeId,
      kind: "loop",
      loopConfig: {
        kind: "loop",
        collection:
          loopCollectionMode.value === "fromUpstream"
            ? { mode: "fromUpstream", upstreamParamName: loopUpstreamParamName.value.trim() }
            : { mode: "manual", jsonText: loopJsonText.value },
        itemParamName: loopItemParamName.value.trim() || "item",
        maxIterations: loopMaxIterations.value,
      },
      hasUpstream: context.hasUpstream,
      upstreamOutputs: context.upstreamOutputs,
    });
  } else {
    const upstreamParamPath = parseCompositeWorkflowParamPathKey(branchLeftPathKey.value);
    emit("confirm", {
      nodeId: context.nodeId,
      kind: "branch",
      branchConfig: {
        kind: "branch",
        left: {
          mode: "fromUpstream",
          upstreamParamName: upstreamParamPath[upstreamParamPath.length - 1] ?? "",
          upstreamParamPath,
        },
        operator: branchOperator.value,
        right: { mode: "manual", value: branchRightManual.value },
      },
      hasUpstream: context.hasUpstream,
      upstreamOutputs: context.upstreamOutputs,
    });
  }
  emit("update:modelValue", false);
}

watch(
  () => [props.modelValue, props.context?.nodeId] as const,
  ([visible]) => {
    if (visible) {
      hydrateFromContext();
    }
  },
);
</script>

<style scoped lang="scss">
.composite-logic-node-drawer__footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>

<style lang="scss">
.composite-logic-node-drawer.el-drawer .el-drawer__header {
  margin-bottom: 0;
  padding: 14px 16px;
  border-bottom: 1px solid var(--aircas-color-border-light);
  background: var(--aircas-color-section-header);
  color: var(--aircas-color-text-primary);
}

.composite-logic-node-drawer.el-drawer .el-drawer__title {
  color: var(--aircas-color-text-primary);
  font-weight: 600;
}

.composite-logic-node-drawer.el-drawer .el-drawer__body {
  padding-top: 16px;
}
</style>
