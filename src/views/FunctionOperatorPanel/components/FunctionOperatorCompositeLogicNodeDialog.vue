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

    <el-form v-else-if="localKind === 'branch'" label-position="top">
      <el-form-item label="左值来源">
        <el-radio-group :model-value="branchLeftMode" @update:model-value="onBranchLeftModeChange">
          <el-radio value="manual">手动</el-radio>
          <el-radio value="fromUpstream">上游输出</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item v-if="branchLeftMode === 'manual'" label="左值">
        <el-input v-model="branchLeftManual" />
      </el-form-item>
      <el-form-item v-else label="上游输出名">
        <el-input v-model="branchLeftUpstream" />
      </el-form-item>
      <el-form-item label="运算符">
        <el-select v-model="branchOperator">
          <el-option v-for="item in branchOperatorOptions" :key="item" :label="item" :value="item" />
        </el-select>
      </el-form-item>
      <el-form-item v-if="branchOperator !== 'truthy'" label="右值">
        <el-input v-model="branchRightManual" />
      </el-form-item>
    </el-form>

    <el-form v-else-if="localKind === 'transform'" label-position="top">
      <el-form-item label="语言">
        <el-input model-value="javascript" disabled />
      </el-form-item>
      <el-form-item label="转换脚本">
        <el-input v-model="transformCode" type="textarea" :rows="10" />
      </el-form-item>
      <el-form-item label="输出字段（逗号分隔）">
        <el-input v-model="transformOutputKeysText" placeholder="result" />
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

const props = defineProps<{
  modelValue: boolean;
  context: CompositeWorkflowLogicNodeEditContext | null;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  confirm: [context: CompositeWorkflowLogicNodeEditContext];
}>();

const localKind = ref<"loop" | "branch" | "transform">("loop");
const loopCollectionMode = ref<"manual" | "fromUpstream">("manual");
const loopJsonText = ref("[]");
const loopUpstreamParamName = ref("");
const loopItemParamName = ref("item");
const loopMaxIterations = ref(100);
const branchLeftMode = ref<"manual" | "fromUpstream">("manual");
const branchLeftManual = ref("");
const branchLeftUpstream = ref("");
const branchOperator = ref<CompositeWorkflowBranchOperator>("truthy");
const branchRightManual = ref("");
const transformCode = ref("function transform(input) {\n  return { result: input };\n}\n");
const transformOutputKeysText = ref("result");

const branchOperatorOptions: CompositeWorkflowBranchOperator[] = ["eq", "ne", "gt", "gte", "lt", "lte", "truthy"];

const dialogTitle = computed(() => {
  if (localKind.value === "loop") {
    return "循环节点配置";
  }
  if (localKind.value === "branch") {
    return "条件分支配置";
  }
  return "数据格式转换配置";
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
 * @description 更新分支左值来源模式。
 * @param value 单选值。
 */
function onBranchLeftModeChange(value: string | number | boolean | undefined): void {
  if (value === "manual" || value === "fromUpstream") {
    branchLeftMode.value = value;
  }
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
  if (context.kind === "branch") {
    const config = context.branchConfig;
    branchOperator.value = config?.operator ?? "truthy";
    branchRightManual.value = config?.right?.value ?? "";
    if (config?.left.mode === "fromUpstream") {
      branchLeftMode.value = "fromUpstream";
      branchLeftUpstream.value = config.left.upstreamParamName;
    } else {
      branchLeftMode.value = "manual";
      branchLeftManual.value = config?.left.mode === "manual" ? config.left.value : "";
    }
    return;
  }
  const config = context.transformConfig;
  transformCode.value = config?.code ?? transformCode.value;
  transformOutputKeysText.value = (config?.outputKeys ?? ["result"]).join(",");
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
    });
  } else if (localKind.value === "branch") {
    emit("confirm", {
      nodeId: context.nodeId,
      kind: "branch",
      branchConfig: {
        kind: "branch",
        left:
          branchLeftMode.value === "fromUpstream"
            ? { mode: "fromUpstream", upstreamParamName: branchLeftUpstream.value.trim() }
            : { mode: "manual", value: branchLeftManual.value },
        operator: branchOperator.value,
        right: branchOperator.value === "truthy" ? undefined : { mode: "manual", value: branchRightManual.value },
      },
    });
  } else {
    emit("confirm", {
      nodeId: context.nodeId,
      kind: "transform",
      transformConfig: {
        kind: "transform",
        language: "javascript",
        code: transformCode.value,
        outputKeys: transformOutputKeysText.value
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      },
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
