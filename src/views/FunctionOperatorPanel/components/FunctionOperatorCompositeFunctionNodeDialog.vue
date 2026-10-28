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
      <FunctionOperatorScriptParamTree :nodes="inputParameterTree" ariaLabel="输入参数列表" />

      <h4 class="composite-fn-node-dialog__section-title">输出参数</h4>
      <FunctionOperatorScriptParamTree :nodes="outputParameterTree" ariaLabel="输出参数列表" />

      <h4 class="composite-fn-node-dialog__section-title">脚本代码{{ scriptLanguage ? `（${scriptLanguage}）` : "" }}</h4>
      <pre class="composite-fn-node-dialog__code">{{ scriptCode.trim() ? scriptCode : "暂无代码" }}</pre>

      <h4 class="composite-fn-node-dialog__section-title">入参绑定</h4>
      <p v-if="!context.hasUpstream" class="composite-fn-node-dialog__hint">当前无前驱，入参仅支持手动输入</p>
      <FunctionOperatorCompositeInputBindingTree
        v-if="inputs.length"
        :nodes="inputs"
        :bindings="bindings"
        :has-upstream="context.hasUpstream"
        :upstream-options="upstreamOptions"
        ariaLabel="入参绑定"
        @update-mode="onBindingModeChange"
        @update-value="onManualValueChange"
        @update-upstream="onUpstreamParamChange"
      />
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
import {
  alignCompositeWorkflowInputBindings,
  compositeWorkflowParamPathKey,
  findCompositeWorkflowParamLeaf,
  listCompositeWorkflowParamNodes,
  parseCompositeWorkflowParamPathKey,
  resolveCompositeWorkflowParamsFromSnapshotAndDetail,
} from "../utils/compositeWorkflowGraph.ts";
import { compareCompositeWorkflowParamTypes } from "../utils/compositeWorkflowParamType.ts";
import { mapCompositeParamBriefsToScriptParamTree } from "../utils/mapOperatorParametersToScriptParamTree";
import FunctionOperatorCompositeInputBindingTree from "./FunctionOperatorCompositeInputBindingTree.vue";
import FunctionOperatorScriptParamTree from "./FunctionOperatorScriptParamTree.vue";

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

/**
 * @description 上游 OUTPUT 全节点选项（多参数、多级结构均可选），不自动预选。
 */
const upstreamOptions = computed(() =>
  listCompositeWorkflowParamNodes(props.context?.upstreamOutputs ?? []).map((node) => ({
    value: compositeWorkflowParamPathKey(node.paramPath),
    label: `${compositeWorkflowParamPathKey(node.paramPath)}（${node.brief.paramType}）`,
    paramPath: node.paramPath,
    paramName: node.brief.paramName,
    paramType: node.brief.paramType,
  })),
);

/**
 * @description 输入参数树，展示方式与脚本 IDE 解析结果一致。
 */
const inputParameterTree = computed(() => mapCompositeParamBriefsToScriptParamTree(inputs.value, "INPUT"));

/**
 * @description 输出参数树，展示方式与脚本 IDE 解析结果一致。
 */
const outputParameterTree = computed(() => mapCompositeParamBriefsToScriptParamTree(outputs.value, "OUTPUT"));

/**
 * @description 拉取详情并初始化绑定表单。空 inputs 快照不会挡住详情 INPUT。
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
    const resolved = resolveCompositeWorkflowParamsFromSnapshotAndDetail(context.paramsSnapshot, response.data.params ?? []);
    inputs.value = resolved.inputs;
    outputs.value = resolved.outputs;
    bindings.value = alignCompositeWorkflowInputBindings(resolved.inputs, context.inputBindings, context.upstreamOutputs, context.hasUpstream);
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
 * @description 判断绑定路径是否相同。
 * @param left 路径。
 * @param right 路径。
 * @returns 相同返回 true。
 */
function isSameParamPath(left: string[], right: string[]): boolean {
  const normalizedLeft = left.length > 0 ? left : [];
  return normalizedLeft.length === right.length && normalizedLeft.every((item, index) => item === right[index]);
}

/**
 * @description 按路径查找叶子参数。
 * @param items 当前层参数。
 * @param paramPath 从根到叶子的路径。
 * @returns 叶子参数；路径指向仍有下级的节点时返回空。
 */
function findLeafInput(items: CompositeWorkflowParamBrief[], paramPath: string[]): CompositeWorkflowParamBrief | undefined {
  const [head, ...rest] = paramPath;
  if (!head) {
    return undefined;
  }
  const current = items.find((item) => item.paramName === head);
  if (!current) {
    return undefined;
  }
  if (rest.length === 0) {
    return current.fields && current.fields.length > 0 ? undefined : current;
  }
  return findLeafInput(current.fields ?? [], rest);
}

/**
 * @description 按路径替换或追加一条叶子绑定。
 * @param paramPath 叶子路径。
 * @param next 新绑定。
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
 * @param paramPath 叶子路径。
 * @param mode 模式。
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
 * @param paramPath 叶子路径。
 * @param value 值。
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
 * @param paramPath 下游入参叶子路径。
 * @param upstreamPathKey 上游节点路径键。
 */
function onUpstreamParamChange(paramPath: string[], upstreamPathKey: string): void {
  const current = bindings.value.find((item) => isSameParamPath(item.paramPath, paramPath) && item.mode === "fromUpstream");
  if (!current || current.mode !== "fromUpstream") {
    return;
  }
  const upstreamParamPath = parseCompositeWorkflowParamPathKey(upstreamPathKey);
  const option = upstreamOptions.value.find((item) => item.value === upstreamPathKey);
  replaceBinding(paramPath, {
    ...current,
    upstreamParamName: option?.paramName ?? upstreamParamPath[upstreamParamPath.length - 1] ?? "",
    upstreamParamPath,
  });
}

/**
 * @description 校验类型后确认写回。
 */
function emitConfirm(): void {
  const context = props.context;
  if (!context) {
    return;
  }
  const outputNodes = listCompositeWorkflowParamNodes(context.upstreamOutputs);
  for (const binding of bindings.value) {
    if (binding.mode !== "fromUpstream") {
      continue;
    }
    const input = findLeafInput(inputs.value, binding.paramPath.length > 0 ? binding.paramPath : [binding.paramName]);
    const upstreamPath = Array.isArray(binding.upstreamParamPath) && binding.upstreamParamPath.length > 0 ? binding.upstreamParamPath : [];
    const upstream = upstreamPath.length > 0 ? findCompositeWorkflowParamLeaf(outputNodes, upstreamPath) : undefined;
    const label = (binding.paramPath.length > 0 ? binding.paramPath : [binding.paramName]).join(".");
    if (!input || !upstream) {
      ElMessage.error(`入参「${label}」请选择上游参数`);
      return;
    }
    const compared = compareCompositeWorkflowParamTypes(upstream.brief.paramType, input.paramType);
    if (!compared.compatible) {
      ElMessage.error(`入参「${label}」与上游「${compositeWorkflowParamPathKey(upstream.paramPath)}」类型不兼容`);
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
