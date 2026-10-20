<template>
  <el-drawer
    :model-value="modelValue"
    class="composite-transform-node-drawer"
    title="数据格式转换配置"
    size="640px"
    append-to-body
    destroy-on-close
    @update:model-value="emit('update:modelValue', $event)"
  >
    <el-form label-position="top" class="composite-transform-node-dialog__form">
      <el-form-item label="语言">
        <el-input model-value="TypeScript" disabled />
      </el-form-item>
      <el-form-item label="转换脚本">
        <div class="composite-transform-node-dialog__editor">
          <FunctionOperatorScriptCodeEditor v-model="transformCode" language="typescript" />
        </div>
      </el-form-item>
    </el-form>

    <h4 class="composite-transform-node-dialog__section-title">输入参数</h4>
    <FunctionOperatorScriptParamTree :nodes="inputParameterTree" ariaLabel="转换节点输入参数" />

    <h4 class="composite-transform-node-dialog__section-title">输出参数</h4>
    <FunctionOperatorScriptParamTree :nodes="outputParameterTree" ariaLabel="转换节点输出参数" />

    <h4 class="composite-transform-node-dialog__section-title">入参绑定</h4>
    <p v-if="!context?.hasUpstream" class="composite-transform-node-dialog__hint">当前无前驱，入参仅支持手动输入</p>
    <FunctionOperatorCompositeInputBindingTree
      v-if="inputs.length"
      :nodes="inputs"
      :bindings="bindings"
      :has-upstream="Boolean(context?.hasUpstream)"
      :upstream-options="upstreamOptions"
      ariaLabel="转换节点入参绑定"
      @update-mode="onBindingModeChange"
      @update-value="onManualValueChange"
      @update-upstream="onUpstreamParamChange"
    />
    <p v-else class="composite-transform-node-dialog__hint">{{ parseHint }}</p>

    <template #footer>
      <div class="composite-transform-node-drawer__footer">
        <el-button :disabled="parsing" @click="emit('update:modelValue', false)">取消</el-button>
        <el-button :loading="parsing" @click="onParseTransformScriptClick">解析</el-button>
        <el-button type="primary" :loading="parsing" @click="emitConfirm">确定</el-button>
      </div>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { ElMessage } from "element-plus";

import { postParseOntologyFunctionParamsInterface } from "@/apis";
import type { CompositeWorkflowInputBinding, CompositeWorkflowParamBrief, CompositeWorkflowTransformConfig } from "@/types";
import { mapScriptLanguageToApi } from "@/utils/mapFunctionOperatorScriptLanguage";

import type { CompositeWorkflowTransformNodeEditContext } from "../composables/useCompositeWorkflowCanvas";
import {
  alignCompositeWorkflowInputBindings,
  compositeWorkflowParamPathKey,
  findCompositeWorkflowParamLeaf,
  listCompositeWorkflowParamNodes,
  parseCompositeWorkflowParamPathKey,
} from "../utils/compositeWorkflowGraph.ts";
import { compareCompositeWorkflowParamTypes } from "../utils/compositeWorkflowParamType.ts";
import { COMPOSITE_WORKFLOW_TRANSFORM_DEFAULT_CODE, mapParsedScriptParametersToCompositeBriefs } from "../utils/compositeWorkflowTransformDefaults.ts";
import { mapCompositeParamBriefsToScriptParamTree } from "../utils/mapOperatorParametersToScriptParamTree";
import { splitParsedScriptParameters } from "../utils/splitParsedScriptParameters";
import FunctionOperatorCompositeInputBindingTree from "./FunctionOperatorCompositeInputBindingTree.vue";
import FunctionOperatorScriptCodeEditor from "./FunctionOperatorScriptCodeEditor.vue";
import FunctionOperatorScriptParamTree from "./FunctionOperatorScriptParamTree.vue";

const props = defineProps<{
  modelValue: boolean;
  context: CompositeWorkflowTransformNodeEditContext | null;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  confirm: [context: CompositeWorkflowTransformNodeEditContext];
}>();

const transformCode = ref(COMPOSITE_WORKFLOW_TRANSFORM_DEFAULT_CODE);
const inputs = ref<CompositeWorkflowParamBrief[]>([]);
const outputs = ref<CompositeWorkflowParamBrief[]>([]);
const bindings = ref<CompositeWorkflowInputBinding[]>([]);
const parsing = ref(false);
let parseGeneration = 0;

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
 * @description 输入参数树展示。
 */
const inputParameterTree = computed(() => mapCompositeParamBriefsToScriptParamTree(inputs.value, "INPUT"));

/**
 * @description 输出参数树展示。
 */
const outputParameterTree = computed(() => mapCompositeParamBriefsToScriptParamTree(outputs.value, "OUTPUT"));

/**
 * @description 无 INPUT 时的提示文案。
 */
const parseHint = computed(() => (inputs.value.length || outputs.value.length ? "该脚本无 INPUT 参数" : "点击解析识别脚本输入输出"));

/**
 * @description 从上下文回填表单与已解析参数。
 */
function hydrateFromContext(): void {
  const context = props.context;
  if (!context) {
    return;
  }
  const config = context.transformConfig;
  transformCode.value = config.code?.trim() ? config.code : COMPOSITE_WORKFLOW_TRANSFORM_DEFAULT_CODE;
  inputs.value = config.paramsSnapshot?.inputs ?? [];
  outputs.value = config.paramsSnapshot?.outputs ?? [];
  bindings.value = alignCompositeWorkflowInputBindings(inputs.value, config.inputBindings ?? [], context.upstreamOutputs, context.hasUpstream);
}

/**
 * @description 判断绑定路径是否相同。
 * @param left 路径。
 * @param right 路径。
 * @returns 相同返回 true。
 */
function isSameParamPath(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((item, index) => item === right[index]);
}

/**
 * @description 按路径查找入参叶子。
 * @param items 当前层。
 * @param paramPath 路径。
 * @returns 叶子；未找到返回空。
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
 * @description 替换或追加一条叶子绑定。
 * @param paramPath 路径。
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
 * @description 切换绑定模式；来自上游时不预选。
 * @param paramPath 路径。
 * @param mode 模式。
 */
function onBindingModeChange(paramPath: string[], mode: string): void {
  const paramName = paramPath[paramPath.length - 1] ?? "";
  if (mode === "fromUpstream") {
    replaceBinding(paramPath, { mode: "fromUpstream", paramName, paramPath, upstreamParamName: "", upstreamParamPath: [] });
    return;
  }
  replaceBinding(paramPath, { mode: "manual", paramName, paramPath, value: "" });
}

/**
 * @description 更新手动值。
 * @param paramPath 路径。
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
 * @description 更新上游节点映射。
 * @param paramPath 下游路径。
 * @param upstreamPathKey 上游路径键。
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
 * @description 解析脚本并写回参数树与绑定。
 * @returns 是否解析成功。
 */
async function parseTransformScript(): Promise<boolean> {
  const source = transformCode.value;
  if (!source.trim()) {
    ElMessage.warning("请输入脚本代码");
    return false;
  }
  const requestId = ++parseGeneration;
  parsing.value = true;
  try {
    const response = await postParseOntologyFunctionParamsInterface({
      language: mapScriptLanguageToApi("typescript"),
      code: source,
    });
    if (requestId !== parseGeneration) {
      return false;
    }
    if (response.code !== 200 || !response.data?.parsed) {
      throw new Error(typeof response.message === "string" && response.message.trim() ? response.message : "脚本解析失败");
    }
    const split = splitParsedScriptParameters(response.data.parameters);
    const nextInputs = mapParsedScriptParametersToCompositeBriefs(split.inputParameters);
    const nextOutputs = mapParsedScriptParametersToCompositeBriefs(split.outputParameters);
    inputs.value = nextInputs;
    outputs.value = nextOutputs;
    const context = props.context;
    bindings.value = alignCompositeWorkflowInputBindings(nextInputs, bindings.value, context?.upstreamOutputs ?? [], Boolean(context?.hasUpstream));
    return true;
  } catch (error) {
    if (requestId !== parseGeneration) {
      return false;
    }
    ElMessage.error(error instanceof Error && error.message.trim() ? error.message : "脚本解析失败");
    return false;
  } finally {
    if (requestId === parseGeneration) {
      parsing.value = false;
    }
  }
}

/**
 * @description 点击解析：调用解析接口刷新输入输出，不关闭抽屉。
 */
async function onParseTransformScriptClick(): Promise<void> {
  if (parsing.value) {
    return;
  }
  const parsed = await parseTransformScript();
  if (parsed) {
    ElMessage.success("解析成功");
  }
}

/**
 * @description 先解析再校验绑定并确认写回。
 */
async function emitConfirm(): Promise<void> {
  const context = props.context;
  if (!context || parsing.value) {
    return;
  }
  const parsed = await parseTransformScript();
  if (!parsed) {
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
  const transformConfig: CompositeWorkflowTransformConfig = {
    kind: "transform",
    language: "typescript",
    code: transformCode.value,
    paramsSnapshot: { inputs: inputs.value, outputs: outputs.value },
    inputBindings: bindings.value,
  };
  emit("confirm", {
    nodeId: context.nodeId,
    transformConfig,
    hasUpstream: context.hasUpstream,
    upstreamOutputs: context.upstreamOutputs,
  });
  emit("update:modelValue", false);
}

watch(
  () => [props.modelValue, props.context?.nodeId] as const,
  ([visible]) => {
    if (visible && props.context) {
      hydrateFromContext();
    }
  },
);
</script>

<style scoped lang="scss">
.composite-transform-node-dialog__form {
  margin-bottom: 8px;

  :deep(.el-form-item__content) {
    display: block;
    width: 100%;
    min-width: 0;
  }
}

.composite-transform-node-dialog__editor {
  width: 100%;
  min-width: 0;
  height: 280px;
  border: 1px solid var(--aircas-color-border-light);
  border-radius: 4px;
  overflow: hidden;
}

.composite-transform-node-dialog__section-title {
  margin: 16px 0 8px;
  font-size: 14px;
  color: var(--aircas-color-text-primary);
}

.composite-transform-node-dialog__hint {
  margin: 0 0 8px;
  font-size: 12px;
  color: var(--aircas-color-text-secondary);
}

.composite-transform-node-drawer__footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>

<style lang="scss">
.composite-transform-node-drawer.el-drawer .el-drawer__header {
  margin-bottom: 0;
  padding: 14px 16px;
  border-bottom: 1px solid var(--aircas-color-border-light);
  background: var(--aircas-color-section-header);
  color: var(--aircas-color-text-primary);
}

.composite-transform-node-drawer.el-drawer .el-drawer__title {
  color: var(--aircas-color-text-primary);
  font-weight: 600;
}

.composite-transform-node-drawer.el-drawer .el-drawer__body {
  padding-top: 16px;
}
</style>
