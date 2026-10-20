<template>
  <el-dialog
    :model-value="modelValue"
    class="function-operator-composite-workflow-dialog"
    fullscreen
    destroy-on-close
    :show-close="true"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <template #header>
      <div class="function-operator-composite-workflow__header">
        <div class="function-operator-composite-workflow__title-block">
          <strong class="function-operator-composite-workflow__title">函数编排工作流</strong>
          <span class="function-operator-composite-workflow__meta">{{ subtitleText }}</span>
        </div>
        <div class="function-operator-composite-workflow__actions">
          <el-button @click="goBackPreviousStep">返回上一步</el-button>
          <el-button @click="notifyFeatureUnavailable('测试')">测试</el-button>
          <el-button type="primary" @click="saveCompositeWorkflowToConsole">保存</el-button>
        </div>
      </div>
    </template>

    <div class="function-operator-composite-workflow__body">
      <aside class="function-operator-composite-workflow__side function-operator-composite-workflow__side--left" aria-label="逻辑与空间函数">
        <section class="function-operator-composite-workflow__section">
          <div class="function-operator-composite-workflow__section-head">
            <h3 class="function-operator-composite-workflow__section-title">逻辑</h3>
          </div>
          <ul class="function-operator-composite-workflow__logic-list">
            <li v-for="item in logicNodeItems" :key="item.nodeKind" class="function-operator-composite-workflow__logic-card">
              <button
                type="button"
                class="function-operator-composite-workflow__logic-button"
                @pointerdown="onLogicPointerDown($event, item.nodeKind)"
                @click="onLogicClick(item.nodeKind)"
              >
                <strong>{{ item.title }}</strong>
                <span>{{ item.description }}</span>
              </button>
            </li>
          </ul>
        </section>

        <section class="function-operator-composite-workflow__section function-operator-composite-workflow__section--grow">
          <div class="function-operator-composite-workflow__section-head">
            <h3 class="function-operator-composite-workflow__section-title">当前空间函数</h3>
            <span class="function-operator-composite-workflow__section-meta">{{ spaceFunctionAvailableCount }}可用</span>
          </div>
          <el-input v-model="functionSearchKeyword" clearable placeholder="搜索函数" class="function-operator-composite-workflow__search" />
          <p v-if="spaceFunctionLoading" class="function-operator-composite-workflow__list-state" role="status">正在加载函数列表...</p>
          <p
            v-else-if="spaceFunctionError"
            class="function-operator-composite-workflow__list-state function-operator-composite-workflow__list-state--error"
            role="alert"
          >
            {{ spaceFunctionError }}
          </p>
          <p v-else-if="filteredSpaceFunctionItems.length === 0" class="function-operator-composite-workflow__list-state">
            {{ functionSearchKeyword.trim() ? "未找到匹配的函数" : "当前空间暂无脚本函数" }}
          </p>
          <ul v-else class="function-operator-composite-workflow__function-list" aria-label="当前空间函数列表">
            <li
              v-for="item in filteredSpaceFunctionItems"
              :key="`${item.functionApi}-${item.version}`"
              class="function-operator-composite-workflow__function-card"
            >
              <button
                type="button"
                class="function-operator-composite-workflow__function-button"
                @pointerdown="onFunctionPointerDown($event, item)"
                @click="onFunctionClick(item)"
              >
                <strong class="function-operator-composite-workflow__function-name">{{ item.displayName }}</strong>
                <span class="function-operator-composite-workflow__function-meta">{{ item.typeLabel }} · {{ item.versionLabel }}</span>
              </button>
            </li>
          </ul>
          <p class="function-operator-composite-workflow__hint">点击或拖入画布添加函数/逻辑节点</p>
        </section>
      </aside>

      <section class="function-operator-composite-workflow__canvas-pane" aria-label="组合工作流画布">
        <div class="function-operator-composite-workflow__canvas-toolbar">
          <p class="function-operator-composite-workflow__canvas-guide">左入右出连线；双击节点在右侧抽屉配置；条件分支菱形：右侧 true、下侧 false</p>
          <div class="function-operator-composite-workflow__canvas-tools">
            <el-button size="small" @click="autoLayoutCompositeWorkflowCanvas">自动布局</el-button>
            <el-button size="small" @click="fitCompositeWorkflowCanvas">适应画布</el-button>
            <el-button size="small" @click="zoomCompositeWorkflowCanvas(-0.1)">缩小</el-button>
            <span class="function-operator-composite-workflow__zoom" aria-label="缩放比例">{{ zoomPercent }}%</span>
            <el-button size="small" @click="zoomCompositeWorkflowCanvas(0.1)">放大</el-button>
            <el-button size="small" type="danger" plain @click="deleteSelectedElements">删除选中</el-button>
          </div>
        </div>
        <div ref="canvasHostRef" class="function-operator-composite-workflow__canvas" />
      </section>

      <aside class="function-operator-composite-workflow__side function-operator-composite-workflow__side--right" aria-label="测试与结果">
        <div class="function-operator-composite-workflow__field function-operator-composite-workflow__field--grow">
          <div class="function-operator-composite-workflow__label">测试参数</div>
          <el-input v-model="testParamsText" type="textarea" :rows="8" class="function-operator-composite-workflow__test-input" resize="none" />
          <p class="function-operator-composite-workflow__status">尚未测试</p>
        </div>
        <div class="function-operator-composite-workflow__field function-operator-composite-workflow__field--grow">
          <div class="function-operator-composite-workflow__label">运行结果</div>
          <div class="function-operator-composite-workflow__result" aria-live="polite">测试结果将在这里显示</div>
        </div>
      </aside>
    </div>

    <FunctionOperatorCompositeFunctionNodeDialog v-model="functionNodeDialogVisible" :context="functionNodeEdit" @confirm="onFunctionNodeConfirm" />
    <FunctionOperatorCompositeLogicNodeDialog v-model="logicNodeDialogVisible" :context="logicNodeEdit" @confirm="applyLogicNodeEdit" />
    <FunctionOperatorCompositeTransformNodeDialog v-model="transformNodeDialogVisible" :context="transformNodeEdit" @confirm="applyTransformNodeEdit" />
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, toRef, watch } from "vue";
import { ElMessage } from "element-plus";
import "@logicflow/core/dist/index.css";

import { getOntologyFunctionListInterface } from "@/apis";
import { FUNCTION_OPERATOR_TYPE_LABELS, type CompositeWorkflowDndPayload, type GetOntologyFunctionListItem } from "@/types";
import { mapFunctionOperatorTypeFromApi } from "@/utils/mapFunctionOperatorTypeToApi";

import { useCompositeWorkflowCanvas } from "../composables/useCompositeWorkflowCanvas";
import FunctionOperatorCompositeFunctionNodeDialog from "./FunctionOperatorCompositeFunctionNodeDialog.vue";
import FunctionOperatorCompositeLogicNodeDialog from "./FunctionOperatorCompositeLogicNodeDialog.vue";
import FunctionOperatorCompositeTransformNodeDialog from "./FunctionOperatorCompositeTransformNodeDialog.vue";

/** 左侧逻辑节点展示项。 */
interface CompositeWorkflowLogicItem {
  nodeKind: "loop" | "branch" | "transform";
  title: string;
  description: string;
}

/** 左侧空间函数列表展示项。 */
interface CompositeWorkflowSpaceFunctionItem {
  functionApi: string;
  displayName: string;
  typeLabel: string;
  versionLabel: string;
  version: string;
}

const props = defineProps<{
  modelValue: boolean;
  /** 当前本体空间 id。 */
  spaceId: number;
  /** 编排函数 API 名称。 */
  functionApi: string;
  /** 函数展示名称。 */
  displayName: string;
  /** 版本号。 */
  version: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
}>();

const functionSearchKeyword = ref("");
const testParamsText = ref("{\n  \n}");
const spaceFunctionItems = ref<CompositeWorkflowSpaceFunctionItem[]>([]);
const spaceFunctionTotal = ref(0);
const spaceFunctionLoading = ref(false);
const spaceFunctionError = ref("");
const functionNodeDialogVisible = ref(false);
const logicNodeDialogVisible = ref(false);
const transformNodeDialogVisible = ref(false);
let spaceFunctionGeneration = 0;
let disposed = false;

const logicNodeItems: ReadonlyArray<CompositeWorkflowLogicItem> = [
  { nodeKind: "loop", title: "循环", description: "遍历集合或固定次数执行" },
  { nodeKind: "branch", title: "条件分支", description: "按条件走 true / false 分支" },
  { nodeKind: "transform", title: "数据格式转换", description: "用脚本转换节点间数据" },
];

const {
  canvasHostRef,
  zoomPercent,
  functionNodeEdit,
  logicNodeEdit,
  transformNodeEdit,
  initCompositeWorkflowCanvas,
  destroyCompositeWorkflowCanvas,
  startCompositeWorkflowNodeDrag,
  addCompositeWorkflowNodeAtCanvasCenter,
  consumeSidebarDndAddedFlag,
  deleteSelectedElements,
  fitCompositeWorkflowCanvas,
  zoomCompositeWorkflowCanvas,
  autoLayoutCompositeWorkflowCanvas,
  saveCompositeWorkflowToConsole,
  applyFunctionNodeEdit,
  applyLogicNodeEdit,
  applyTransformNodeEdit,
  clearNodeEditState,
} = useCompositeWorkflowCanvas({
  displayName: toRef(props, "displayName"),
  functionApi: toRef(props, "functionApi"),
  version: toRef(props, "version"),
  spaceId: toRef(props, "spaceId"),
});

const subtitleText = computed(() => {
  const name = props.displayName.trim() || "-";
  const versionText = props.version.trim() ? `v${props.version.trim()}` : "v-";
  return `${name} · ${versionText}`;
});

const spaceFunctionAvailableCount = computed(() => spaceFunctionTotal.value);

const filteredSpaceFunctionItems = computed(() => {
  const keyword = functionSearchKeyword.value.trim().toLowerCase();
  if (!keyword) {
    return spaceFunctionItems.value;
  }
  return spaceFunctionItems.value.filter((item) => item.displayName.toLowerCase().includes(keyword));
});

/**
 * @description 将列表记录映射为编排画布左侧卡片展示项。
 * @param item 列表接口单条记录。
 * @returns 展示项。
 */
function mapSpaceFunctionListItem(item: GetOntologyFunctionListItem): CompositeWorkflowSpaceFunctionItem {
  const pageType = mapFunctionOperatorTypeFromApi(item.type);
  const typeLabel = FUNCTION_OPERATOR_TYPE_LABELS[pageType] || item.type || "-";
  const version = typeof item.version === "string" ? item.version.trim() : "";
  const displayName = typeof item.displayName === "string" && item.displayName.trim() ? item.displayName.trim() : item.functionApi;
  return {
    functionApi: item.functionApi,
    displayName,
    typeLabel,
    version,
    versionLabel: version ? `v${version}` : "v-",
  };
}

/**
 * @description 清空当前空间函数列表状态。
 */
function resetSpaceFunctionListState(): void {
  spaceFunctionItems.value = [];
  spaceFunctionTotal.value = 0;
  spaceFunctionError.value = "";
  spaceFunctionLoading.value = false;
  functionSearchKeyword.value = "";
}

/**
 * @description 拉取当前空间 CUSTOMIZE 脚本函数列表（pageSize=1000）。
 */
async function loadSpaceFunctionList(): Promise<void> {
  const spaceId = props.spaceId;
  if (!Number.isFinite(spaceId) || spaceId <= 0) {
    resetSpaceFunctionListState();
    spaceFunctionError.value = "无效的空间标识";
    return;
  }
  const requestId = ++spaceFunctionGeneration;
  spaceFunctionLoading.value = true;
  spaceFunctionError.value = "";
  try {
    const response = await getOntologyFunctionListInterface({
      pageNum: 1,
      pageSize: 1000,
      ontologySpaceId: spaceId,
      type: "CUSTOMIZE",
    });
    if (disposed || requestId !== spaceFunctionGeneration) {
      return;
    }
    if (response.code !== 200 || !response.data) {
      throw new Error(typeof response.message === "string" && response.message.trim() ? response.message : "函数列表加载失败");
    }
    const records = Array.isArray(response.data.records) ? response.data.records : [];
    spaceFunctionItems.value = records.map(mapSpaceFunctionListItem);
    spaceFunctionTotal.value = typeof response.data.total === "number" && Number.isFinite(response.data.total) ? response.data.total : records.length;
  } catch (error) {
    if (disposed || requestId !== spaceFunctionGeneration) {
      return;
    }
    spaceFunctionItems.value = [];
    spaceFunctionTotal.value = 0;
    const message = error instanceof Error && error.message.trim() ? error.message : "函数列表加载失败";
    spaceFunctionError.value = message;
    ElMessage.error(message);
  } finally {
    if (requestId === spaceFunctionGeneration) {
      spaceFunctionLoading.value = false;
    }
  }
}

/**
 * @description 逻辑节点按住后走 LogicFlow 原生拖入。
 * @param event 指针事件。
 * @param nodeKind 逻辑 kind。
 */
function onLogicPointerDown(event: PointerEvent, nodeKind: "loop" | "branch" | "transform"): void {
  if (event.button !== 0) {
    return;
  }
  startCompositeWorkflowNodeDrag({ nodeKind });
}

/**
 * @description 点击逻辑节点：未拖入画布时在中心添加。
 * @param nodeKind 逻辑 kind。
 */
function onLogicClick(nodeKind: "loop" | "branch" | "transform"): void {
  if (consumeSidebarDndAddedFlag()) {
    return;
  }
  addCompositeWorkflowNodeAtCanvasCenter({ nodeKind });
}

/**
 * @description 空间函数按住后走 LogicFlow 原生拖入。
 * @param event 指针事件。
 * @param item 函数卡片。
 */
function onFunctionPointerDown(event: PointerEvent, item: CompositeWorkflowSpaceFunctionItem): void {
  if (event.button !== 0) {
    return;
  }
  startCompositeWorkflowNodeDrag({
    nodeKind: "function",
    functionApi: item.functionApi,
    version: item.version,
    displayName: item.displayName,
  });
}

/**
 * @description 点击空间函数：未拖入画布时在中心添加。
 * @param item 函数卡片。
 */
function onFunctionClick(item: CompositeWorkflowSpaceFunctionItem): void {
  if (consumeSidebarDndAddedFlag()) {
    return;
  }
  addCompositeWorkflowNodeAtCanvasCenter({
    nodeKind: "function",
    functionApi: item.functionApi,
    version: item.version,
    displayName: item.displayName,
  });
}

/**
 * @description 关闭编排画布并返回上一步通用配置表单。
 */
function goBackPreviousStep(): void {
  emit("update:modelValue", false);
}

/**
 * @description P0 测试仍提示暂未开放。
 * @param featureName 功能名称。
 */
function notifyFeatureUnavailable(featureName: string): void {
  ElMessage.info(`${featureName}功能暂未开放`);
}

/**
 * @description 函数节点配置确认写回画布。
 * @param payload 确认载荷。
 */
function onFunctionNodeConfirm(payload: {
  nodeId: string;
  inputBindings: Parameters<typeof applyFunctionNodeEdit>[1]["inputBindings"];
  paramsSnapshot: Parameters<typeof applyFunctionNodeEdit>[1]["paramsSnapshot"];
}): void {
  applyFunctionNodeEdit(payload.nodeId, {
    inputBindings: payload.inputBindings,
    paramsSnapshot: payload.paramsSnapshot,
  });
}

watch(functionNodeEdit, (value) => {
  functionNodeDialogVisible.value = Boolean(value);
});

watch(logicNodeEdit, (value) => {
  logicNodeDialogVisible.value = Boolean(value);
});

watch(transformNodeEdit, (value) => {
  transformNodeDialogVisible.value = Boolean(value);
});

watch(functionNodeDialogVisible, (visible) => {
  if (!visible) {
    clearNodeEditState();
  }
});

watch(logicNodeDialogVisible, (visible) => {
  if (!visible) {
    clearNodeEditState();
  }
});

watch(transformNodeDialogVisible, (visible) => {
  if (!visible) {
    clearNodeEditState();
  }
});

watch(
  () => props.modelValue,
  async (visible) => {
    if (!visible) {
      spaceFunctionGeneration += 1;
      resetSpaceFunctionListState();
      destroyCompositeWorkflowCanvas();
      clearNodeEditState();
      functionNodeDialogVisible.value = false;
      logicNodeDialogVisible.value = false;
      transformNodeDialogVisible.value = false;
      return;
    }
    void loadSpaceFunctionList();
    await nextTick();
    await nextTick();
    // 全屏弹框布局完成后再初始化，避免 LogicFlow 以过小宽高创建导致节点落在可视区外。
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          resolve();
        });
      });
    });
    if (!props.modelValue || disposed) {
      return;
    }
    initCompositeWorkflowCanvas();
  },
);

onUnmounted(() => {
  disposed = true;
  spaceFunctionGeneration += 1;
  destroyCompositeWorkflowCanvas();
});
</script>

<style scoped lang="scss">
.function-operator-composite-workflow__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  padding-right: 36px;
}

.function-operator-composite-workflow__title-block {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
}

.function-operator-composite-workflow__title {
  font-size: 16px;
  font-weight: 600;
  color: var(--aircas-color-text-primary);
}

.function-operator-composite-workflow__meta {
  font-size: 12px;
  color: var(--aircas-color-text-secondary);
}

.function-operator-composite-workflow__actions {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 8px;
}

.function-operator-composite-workflow__body {
  display: grid;
  grid-template-columns: minmax(240px, 280px) minmax(0, 1fr) minmax(240px, 300px);
  gap: 12px;
  width: 100%;
  height: 100%;
  min-height: 0;
}

.function-operator-composite-workflow__side {
  display: flex;
  min-width: 0;
  min-height: 0;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  overflow: auto;
  border: 1px solid var(--aircas-color-border);
  border-radius: 8px;
  background: var(--aircas-color-panel-background);
}

.function-operator-composite-workflow__side--right {
  overflow: hidden;
}

.function-operator-composite-workflow__section {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 8px;
}

.function-operator-composite-workflow__section--grow {
  flex: 1 1 auto;
  min-height: 0;
}

.function-operator-composite-workflow__section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.function-operator-composite-workflow__section-title {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--aircas-color-text-primary);
}

.function-operator-composite-workflow__section-meta {
  font-size: 12px;
  color: var(--aircas-color-text-secondary);
}

.function-operator-composite-workflow__logic-list,
.function-operator-composite-workflow__function-list {
  display: flex;
  margin: 0;
  padding: 0;
  flex-direction: column;
  gap: 8px;
  list-style: none;
}

.function-operator-composite-workflow__function-list {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
}

.function-operator-composite-workflow__logic-button,
.function-operator-composite-workflow__function-button {
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 4px;
  padding: 10px;
  border: 1px solid var(--aircas-color-border);
  border-radius: 6px;
  background: var(--aircas-color-panel-background-deep);
  color: var(--aircas-color-text-secondary);
  text-align: left;
  cursor: pointer;
}

.function-operator-composite-workflow__logic-button:hover,
.function-operator-composite-workflow__function-button:hover {
  border-color: var(--aircas-color-primary);
}

.function-operator-composite-workflow__logic-button strong,
.function-operator-composite-workflow__function-name {
  color: var(--aircas-color-text-primary);
  font-size: 13px;
}

.function-operator-composite-workflow__logic-button span,
.function-operator-composite-workflow__function-meta {
  font-size: 12px;
  line-height: 1.4;
}

.function-operator-composite-workflow__list-state {
  margin: 0;
  font-size: 12px;
  color: var(--aircas-color-text-secondary);
}

.function-operator-composite-workflow__list-state--error {
  color: var(--aircas-color-danger);
}

.function-operator-composite-workflow__search {
  width: 100%;
}

.function-operator-composite-workflow__hint {
  margin: 0;
  font-size: 12px;
  color: var(--aircas-color-text-secondary);
}

.function-operator-composite-workflow__canvas-pane {
  display: flex;
  min-width: 0;
  min-height: 0;
  flex-direction: column;
  gap: 8px;
}

.function-operator-composite-workflow__canvas-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.function-operator-composite-workflow__canvas-guide {
  margin: 0;
  flex: 1 1 240px;
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
  line-height: 1.5;
}

.function-operator-composite-workflow__canvas-tools {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.function-operator-composite-workflow__zoom {
  min-width: 40px;
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
  text-align: center;
}

.function-operator-composite-workflow__canvas {
  position: relative;
  flex: 1 1 auto;
  width: 100%;
  min-height: 280px;
  height: 100%;
  overflow: hidden;
  border: 1px solid var(--aircas-color-border);
  border-radius: 8px;
  background: #071925;
}

.function-operator-composite-workflow__canvas :deep(> div) {
  width: 100% !important;
  height: 100% !important;
  background: #071925;
}

.function-operator-composite-workflow__canvas :deep(.lf-graph) {
  width: 100%;
  height: 100%;
  background: #071925;
}

.function-operator-composite-workflow__canvas :deep(.lf-background),
.function-operator-composite-workflow__canvas :deep(.lf-background-area) {
  background: #071925;
}

.function-operator-composite-workflow__field {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 8px;
}

.function-operator-composite-workflow__field--grow {
  flex: 1 1 0;
  min-height: 0;
}

.function-operator-composite-workflow__label {
  font-size: 13px;
  font-weight: 600;
  color: var(--aircas-color-text-primary);
}

.function-operator-composite-workflow__status {
  margin: 0;
  font-size: 12px;
  color: var(--aircas-color-text-secondary);
}

.function-operator-composite-workflow__result {
  flex: 1 1 auto;
  min-height: 120px;
  padding: 10px;
  overflow: auto;
  border: 1px solid var(--aircas-color-border);
  border-radius: 6px;
  background: var(--aircas-color-panel-background-deep);
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
}

.function-operator-composite-workflow__test-input {
  flex: 1 1 auto;
}

:deep(.function-operator-composite-workflow__test-input .el-textarea__inner) {
  height: 100%;
  min-height: 0;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  background: var(--aircas-color-panel-background-deep);
}

:deep(.function-operator-composite-workflow__test-input.el-textarea) {
  flex: 1 1 auto;
  height: 100%;
  min-height: 0;
}
</style>

<style lang="scss">
.function-operator-composite-workflow-dialog.el-dialog.is-fullscreen {
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-height: 100vh;
  margin: 0;
  overflow: hidden;
  background: var(--aircas-color-page-background);
}

.function-operator-composite-workflow-dialog.el-dialog.is-fullscreen .el-dialog__header {
  flex-shrink: 0;
  margin-right: 0;
  padding: 12px 16px;
  border-bottom: 1px solid var(--aircas-color-border);
}

.function-operator-composite-workflow-dialog.el-dialog.is-fullscreen .el-dialog__body {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
  padding: 12px 16px 16px;
  overflow: hidden;
}
</style>
