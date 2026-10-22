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
      <el-form-item label="集合（上游输出）">
        <el-select
          v-model="loopCollectionPathKey"
          filterable
          clearable
          :disabled="!hasUpstream"
          :placeholder="hasUpstream ? '选择上游输出' : '无上游节点'"
          style="width: 100%"
        >
          <el-option v-for="item in upstreamOutputOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="最大迭代次数">
        <el-input-number :model-value="loopMaxIterations" :min="1" :max="10000" @update:model-value="onLoopMaxIterationsChange" />
      </el-form-item>
      <p class="composite-logic-node-drawer__hint">右侧「循环体」出口进入循环体；下侧「结束后」出口在循环完成后继续。</p>
    </el-form>

    <el-form v-else-if="localKind === 'branch'" label-position="top">
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

    <el-form v-else-if="localKind === 'switch'" label-position="top">
      <el-form-item label="Switch 值（上游输出）">
        <el-select
          v-model="switchPathKey"
          filterable
          clearable
          :disabled="!hasUpstream"
          :placeholder="hasUpstream ? '选择上游输出' : '无上游节点'"
          style="width: 100%"
        >
          <el-option v-for="item in upstreamOutputOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="Case 列表">
        <div class="composite-logic-node-drawer__cases">
          <div v-for="(caseItem, index) in switchCases" :key="caseItem.id" class="composite-logic-node-drawer__case-row">
            <el-input v-model="caseItem.value" :placeholder="`case ${index + 1}`" />
            <el-button :disabled="switchCases.length <= 1" @click="removeSwitchCase(index)">删除</el-button>
          </div>
          <el-button type="primary" plain @click="addSwitchCase">添加 case</el-button>
        </div>
      </el-form-item>
      <p class="composite-logic-node-drawer__hint">节点右侧会为每个 case 生成出口，并固定提供 default 出口。</p>
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
import { ElMessage } from "element-plus";

import type { CompositeWorkflowBranchOperator, CompositeWorkflowSwitchCaseItem } from "@/types";

import type { CompositeWorkflowLogicNodeEditContext } from "../composables/useCompositeWorkflowCanvas";
import { compositeWorkflowParamPathKey, listCompositeWorkflowParamNodes, parseCompositeWorkflowParamPathKey } from "../utils/compositeWorkflowGraph.ts";
import { createDefaultCompositeWorkflowLoopConfig, normalizeCompositeWorkflowLoopConfig } from "../utils/compositeWorkflowLoopDefaults.ts";
import { createCompositeWorkflowSwitchCaseItem } from "../utils/compositeWorkflowSwitchDefaults.ts";

const props = defineProps<{
  modelValue: boolean;
  context: CompositeWorkflowLogicNodeEditContext | null;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  confirm: [context: CompositeWorkflowLogicNodeEditContext];
}>();

const localKind = ref<"loop" | "branch" | "switch">("loop");
const loopCollectionPathKey = ref("");
const loopMaxIterations = ref(100);
const branchLeftPathKey = ref("");
const branchOperator = ref<CompositeWorkflowBranchOperator>("eq");
const branchRightManual = ref("");
const switchPathKey = ref("");
const switchCases = ref<CompositeWorkflowSwitchCaseItem[]>([createCompositeWorkflowSwitchCaseItem()]);
const hasUpstream = ref(false);

const branchOperatorOptions: { value: CompositeWorkflowBranchOperator; label: string }[] = [
  { value: "eq", label: "==" },
  { value: "ne", label: "!==" },
  { value: "gt", label: ">" },
  { value: "gte", label: ">=" },
  { value: "lt", label: "<" },
  { value: "lte", label: "<=" },
];

const dialogTitle = computed(() => {
  if (localKind.value === "loop") {
    return "循环节点配置";
  }
  if (localKind.value === "switch") {
    return "Switch Case 配置";
  }
  return "条件分支配置";
});

const upstreamOutputOptions = computed(() => {
  const outputs = props.context?.upstreamOutputs ?? [];
  return listCompositeWorkflowParamNodes(outputs).map((node) => ({
    value: compositeWorkflowParamPathKey(node.paramPath),
    label: `${compositeWorkflowParamPathKey(node.paramPath)}（${node.brief.paramType}）`,
  }));
});

/**
 * @description 更新最大迭代次数。
 * @param value 输入值。
 */
function onLoopMaxIterationsChange(value: number | undefined): void {
  loopMaxIterations.value = typeof value === "number" && Number.isFinite(value) ? value : 100;
}

/**
 * @description 追加一条空 case。
 */
function addSwitchCase(): void {
  switchCases.value = [...switchCases.value, createCompositeWorkflowSwitchCaseItem()];
}

/**
 * @description 删除指定下标的 case（至少保留一条）。
 * @param index case 下标。
 */
function removeSwitchCase(index: number): void {
  if (switchCases.value.length <= 1) {
    return;
  }
  switchCases.value = switchCases.value.filter((_, itemIndex) => itemIndex !== index);
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
    const config = normalizeCompositeWorkflowLoopConfig(context.loopConfig ?? createDefaultCompositeWorkflowLoopConfig());
    loopMaxIterations.value = config.maxIterations ?? 100;
    const path = config.collection.upstreamParamPath;
    loopCollectionPathKey.value = path.length > 0 ? compositeWorkflowParamPathKey(path) : "";
    return;
  }
  if (context.kind === "switch") {
    const config = context.switchConfig;
    const path = config?.switchOn.upstreamParamPath ?? [];
    switchPathKey.value = path.length > 0 ? compositeWorkflowParamPathKey(path) : "";
    switchCases.value =
      config?.cases && config.cases.length > 0 ? config.cases.map((item) => ({ id: item.id, value: item.value })) : [createCompositeWorkflowSwitchCaseItem()];
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
    if (!loopCollectionPathKey.value.trim()) {
      ElMessage.error("请选择集合（上游输出）");
      return;
    }
    const upstreamParamPath = parseCompositeWorkflowParamPathKey(loopCollectionPathKey.value);
    emit("confirm", {
      nodeId: context.nodeId,
      kind: "loop",
      loopConfig: {
        kind: "loop",
        collection: {
          mode: "fromUpstream",
          upstreamParamName: upstreamParamPath[upstreamParamPath.length - 1] ?? "",
          upstreamParamPath,
        },
        itemParamName: "item",
        maxIterations: loopMaxIterations.value,
      },
      hasUpstream: context.hasUpstream,
      upstreamOutputs: context.upstreamOutputs,
    });
    emit("update:modelValue", false);
    return;
  }
  if (localKind.value === "switch") {
    const trimmedCases = switchCases.value.map((item) => ({ id: item.id, value: item.value.trim() }));
    const nonEmpty = trimmedCases.filter((item) => item.value.length > 0);
    if (nonEmpty.length === 0) {
      ElMessage.error("请至少填写一个 case 值");
      return;
    }
    const seen = new Set<string>();
    for (const item of nonEmpty) {
      if (seen.has(item.value)) {
        ElMessage.error(`case 值「${item.value}」重复`);
        return;
      }
      seen.add(item.value);
    }
    if (!switchPathKey.value.trim()) {
      ElMessage.error("请选择 Switch 值（上游输出）");
      return;
    }
    const upstreamParamPath = parseCompositeWorkflowParamPathKey(switchPathKey.value);
    emit("confirm", {
      nodeId: context.nodeId,
      kind: "switch",
      switchConfig: {
        kind: "switch",
        switchOn: {
          mode: "fromUpstream",
          upstreamParamName: upstreamParamPath[upstreamParamPath.length - 1] ?? "",
          upstreamParamPath,
        },
        cases: nonEmpty,
      },
      hasUpstream: context.hasUpstream,
      upstreamOutputs: context.upstreamOutputs,
    });
    emit("update:modelValue", false);
    return;
  }
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

.composite-logic-node-drawer__cases {
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 8px;
}

.composite-logic-node-drawer__case-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.composite-logic-node-drawer__hint {
  margin: 0;
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
  line-height: 1.5;
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
