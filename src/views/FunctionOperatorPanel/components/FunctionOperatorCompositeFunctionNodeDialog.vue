<template>
  <el-drawer
    :model-value="modelValue"
    class="composite-fn-node-drawer"
    title="函数节点配置"
    size="520px"
    append-to-body
    destroy-on-close
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div v-if="detailLoading" class="composite-fn-node-dialog__state" role="status"><AircasLoading>正在加载函数详情...</AircasLoading></div>
    <template v-else-if="context">
      <p v-if="detailError" class="composite-fn-node-dialog__error" role="alert">{{ detailError }}</p>
      <el-descriptions :column="2" border size="small" class="composite-fn-node-dialog__meta">
        <el-descriptions-item label="名称">{{ context.displayName }}</el-descriptions-item>
        <el-descriptions-item label="版本">{{ context.version }}</el-descriptions-item>
        <el-descriptions-item label="函数 API" :span="2">{{ context.functionApi }}</el-descriptions-item>
        <el-descriptions-item v-if="description" label="说明" :span="2">{{ description }}</el-descriptions-item>
      </el-descriptions>

      <h4 class="composite-fn-node-dialog__section-title">输入参数</h4>
      <el-table :data="inputs" class="aircas-table--accent-header" size="small">
        <el-table-column prop="paramName" label="名称" min-width="100" />
        <el-table-column prop="paramType" label="类型" width="100" />
      </el-table>

      <h4 class="composite-fn-node-dialog__section-title">输出参数</h4>
      <el-table :data="outputs" class="aircas-table--accent-header" size="small">
        <el-table-column prop="paramName" label="名称" min-width="100" />
        <el-table-column prop="paramType" label="类型" width="100" />
      </el-table>

      <h4 class="composite-fn-node-dialog__section-title">脚本代码{{ scriptLanguage ? `（${scriptLanguage}）` : "" }}</h4>
      <pre class="composite-fn-node-dialog__code">{{ scriptCode.trim() ? scriptCode : "暂无代码" }}</pre>

      <h4 class="composite-fn-node-dialog__section-title">入参绑定</h4>
      <p v-if="!context.hasUpstream" class="composite-fn-node-dialog__hint">当前无前驱，入参仅支持手动输入</p>
      <el-form v-if="bindings.length" label-position="top" class="composite-fn-node-dialog__bindings">
        <div v-for="binding in bindings" :key="binding.paramName" class="composite-fn-node-dialog__binding-row">
          <div class="composite-fn-node-dialog__binding-name">{{ binding.paramName }}</div>
          <el-select
            :model-value="binding.mode"
            class="composite-fn-node-dialog__binding-mode"
            @update:model-value="onBindingModeChange(binding.paramName, String($event))"
          >
            <el-option label="手动输入" value="manual" />
            <el-option label="来自上游" value="fromUpstream" :disabled="!context.hasUpstream || upstreamOptions.length === 0" />
          </el-select>
          <el-input
            v-if="binding.mode === 'manual'"
            :model-value="binding.value"
            placeholder="参数值"
            @update:model-value="onManualValueChange(binding.paramName, String($event ?? ''))"
          />
          <el-select
            v-else
            :model-value="binding.upstreamParamName"
            placeholder="选择上游输出"
            filterable
            @update:model-value="onUpstreamParamChange(binding.paramName, String($event ?? ''))"
          >
            <el-option v-for="item in upstreamOptions" :key="item.paramName" :label="`${item.paramName}（${item.paramType}）`" :value="item.paramName" />
          </el-select>
        </div>
      </el-form>
      <p v-else class="composite-fn-node-dialog__hint">该函数无 INPUT 参数</p>
    </template>
    <template #footer>
      <div class="composite-fn-node-drawer__footer">
        <el-button @click="emit('update:modelValue', false)">取消</el-button>
        <el-button type="primary" :disabled="detailLoading || Boolean(detailError)" @click="emitConfirm">确定</el-button>
      </div>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { ElMessage } from "element-plus";

import { getOntologyFunctionDetailInterface } from "@/apis";
import AircasLoading from "@/components/AircasLoading.vue";
import type { CompositeWorkflowInputBinding, CompositeWorkflowParamBrief } from "@/types";

import type { CompositeWorkflowFunctionNodeEditContext } from "../composables/useCompositeWorkflowCanvas";
import { buildDefaultCompositeWorkflowInputBindings, repairCompositeWorkflowInputBindings } from "../utils/compositeWorkflowGraph.ts";
import { compareCompositeWorkflowParamTypes } from "../utils/compositeWorkflowParamType.ts";

const props = defineProps<{
  modelValue: boolean;
  context: CompositeWorkflowFunctionNodeEditContext | null;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  confirm: [
    payload: {
      nodeId: string;
      inputBindings: CompositeWorkflowInputBinding[];
      paramsSnapshot: { inputs: CompositeWorkflowParamBrief[]; outputs: CompositeWorkflowParamBrief[] };
    },
  ];
}>();

const detailLoading = ref(false);
const detailError = ref("");
const description = ref("");
const inputs = ref<CompositeWorkflowParamBrief[]>([]);
const outputs = ref<CompositeWorkflowParamBrief[]>([]);
const bindings = ref<CompositeWorkflowInputBinding[]>([]);
const scriptLanguage = ref("");
const scriptCode = ref("");
let detailGeneration = 0;

const upstreamOptions = computed(() => props.context?.upstreamOutputs ?? []);

/**
 * @description 拉取详情并初始化绑定表单。
 */
async function loadFunctionDetail(): Promise<void> {
  const context = props.context;
  if (!context) {
    return;
  }
  const requestId = ++detailGeneration;
  detailLoading.value = true;
  detailError.value = "";
  description.value = "";
  scriptLanguage.value = "";
  scriptCode.value = "";
  try {
    const hasParamsSnapshot = Boolean(context.paramsSnapshot?.inputs);
    if (hasParamsSnapshot && context.paramsSnapshot) {
      inputs.value = context.paramsSnapshot.inputs;
      outputs.value = context.paramsSnapshot.outputs ?? [];
      bindings.value =
        context.inputBindings.length > 0
          ? repairCompositeWorkflowInputBindings(context.inputBindings, context.upstreamOutputs, context.hasUpstream)
          : buildDefaultCompositeWorkflowInputBindings(context.paramsSnapshot.inputs, context.upstreamOutputs, context.hasUpstream);
    }
    const response = await getOntologyFunctionDetailInterface({
      functionApi: context.functionApi,
      version: context.version,
    });
    if (requestId !== detailGeneration) {
      return;
    }
    if (response.code !== 200 || !response.data) {
      throw new Error(typeof response.message === "string" && response.message.trim() ? response.message : "函数详情查询失败");
    }
    description.value = typeof response.data.description === "string" ? response.data.description : "";
    scriptLanguage.value = typeof response.data.language === "string" ? response.data.language.trim() : "";
    scriptCode.value = typeof response.data.code === "string" ? response.data.code : "";
    if (hasParamsSnapshot) {
      return;
    }
    const nextInputs: CompositeWorkflowParamBrief[] = [];
    const nextOutputs: CompositeWorkflowParamBrief[] = [];
    for (const item of response.data.params ?? []) {
      const category = typeof item.category === "string" ? item.category.trim().toUpperCase() : "";
      const paramName = typeof item.paramName === "string" ? item.paramName.trim() : "";
      if (!paramName) {
        continue;
      }
      const brief = { paramName, paramType: typeof item.paramType === "string" ? item.paramType : "" };
      if (category === "INPUT") {
        nextInputs.push(brief);
      } else if (category === "OUTPUT") {
        nextOutputs.push(brief);
      }
    }
    inputs.value = nextInputs;
    outputs.value = nextOutputs;
    bindings.value =
      context.inputBindings.length > 0
        ? repairCompositeWorkflowInputBindings(context.inputBindings, context.upstreamOutputs, context.hasUpstream)
        : buildDefaultCompositeWorkflowInputBindings(nextInputs, context.upstreamOutputs, context.hasUpstream);
  } catch (error) {
    if (requestId !== detailGeneration) {
      return;
    }
    detailError.value = error instanceof Error && error.message.trim() ? error.message : "函数详情查询失败";
    ElMessage.error(detailError.value);
  } finally {
    if (requestId === detailGeneration) {
      detailLoading.value = false;
    }
  }
}

/**
 * @description 切换绑定模式。
 * @param paramName 入参名。
 * @param mode 模式。
 */
function onBindingModeChange(paramName: string, mode: string): void {
  bindings.value = bindings.value.map((item) => {
    if (item.paramName !== paramName) {
      return item;
    }
    if (mode === "fromUpstream") {
      const first = upstreamOptions.value[0]?.paramName ?? "";
      return { mode: "fromUpstream", paramName, upstreamParamName: first };
    }
    return { mode: "manual", paramName, value: "" };
  });
}

/**
 * @description 更新手动值。
 * @param paramName 入参名。
 * @param value 值。
 */
function onManualValueChange(paramName: string, value: string): void {
  bindings.value = bindings.value.map((item) => (item.paramName === paramName && item.mode === "manual" ? { ...item, value } : item));
}

/**
 * @description 更新上游输出映射。
 * @param paramName 入参名。
 * @param upstreamParamName 上游输出名。
 */
function onUpstreamParamChange(paramName: string, upstreamParamName: string): void {
  bindings.value = bindings.value.map((item) => (item.paramName === paramName && item.mode === "fromUpstream" ? { ...item, upstreamParamName } : item));
}

/**
 * @description 校验类型后确认写回。
 */
function emitConfirm(): void {
  const context = props.context;
  if (!context) {
    return;
  }
  for (const binding of bindings.value) {
    if (binding.mode !== "fromUpstream") {
      continue;
    }
    const input = inputs.value.find((item) => item.paramName === binding.paramName);
    const upstream = upstreamOptions.value.find((item) => item.paramName === binding.upstreamParamName);
    if (!input || !upstream) {
      ElMessage.error(`入参「${binding.paramName}」上游映射无效`);
      return;
    }
    const compared = compareCompositeWorkflowParamTypes(upstream.paramType, input.paramType);
    if (!compared.compatible) {
      ElMessage.error(`入参「${binding.paramName}」与上游「${upstream.paramName}」类型不兼容`);
      return;
    }
  }
  emit("confirm", {
    nodeId: context.nodeId,
    inputBindings: bindings.value,
    paramsSnapshot: { inputs: inputs.value, outputs: outputs.value },
  });
  emit("update:modelValue", false);
}

watch(
  () => [props.modelValue, props.context?.nodeId] as const,
  ([visible]) => {
    if (!visible || !props.context) {
      return;
    }
    void loadFunctionDetail();
  },
);
</script>

<style scoped lang="scss">
.composite-fn-node-dialog__state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 120px;
}

.composite-fn-node-dialog__error {
  margin: 0 0 8px;
  color: var(--aircas-color-danger);
  font-size: 13px;
}

.composite-fn-node-dialog__meta {
  margin-bottom: 12px;
}

.composite-fn-node-dialog__section-title {
  margin: 16px 0 8px;
  font-size: 14px;
  color: var(--aircas-color-text-primary);
}

.composite-fn-node-dialog__hint {
  margin: 0 0 8px;
  font-size: 12px;
  color: var(--aircas-color-text-secondary);
}

.composite-fn-node-dialog__bindings {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.composite-fn-node-dialog__binding-row {
  display: grid;
  grid-template-columns: 100px 120px minmax(0, 1fr);
  gap: 8px;
  align-items: center;
}

.composite-fn-node-dialog__binding-name {
  font-size: 13px;
  color: var(--aircas-color-text-primary);
  word-break: break-all;
}

.composite-fn-node-dialog__binding-mode {
  width: 100%;
}

.composite-fn-node-dialog__code {
  margin: 0;
  max-height: 280px;
  overflow: auto;
  padding: 8px;
  border: 1px solid var(--aircas-color-border-light);
  border-radius: 4px;
  background: var(--aircas-color-panel-background-deep);
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-word;
}

.composite-fn-node-drawer__footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>

<style lang="scss">
.composite-fn-node-drawer.el-drawer .el-drawer__header {
  margin-bottom: 0;
  padding: 14px 16px;
  border-bottom: 1px solid var(--aircas-color-border-light);
  background: var(--aircas-color-section-header);
  color: var(--aircas-color-text-primary);
}

.composite-fn-node-drawer.el-drawer .el-drawer__title {
  color: var(--aircas-color-text-primary);
  font-weight: 600;
}

.composite-fn-node-drawer.el-drawer .el-drawer__body {
  padding-top: 16px;
}
</style>
