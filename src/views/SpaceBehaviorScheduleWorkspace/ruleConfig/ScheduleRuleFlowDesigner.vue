<template>
  <div class="rule-flow-designer">
    <div class="rule-flow-designer__main">
      <ScheduleRuleFlowPalette v-if="!readonly" />
      <section class="rule-flow-designer__canvas-panel">
        <ScheduleRuleFlowToolbar
          v-if="!readonly"
          :disconnected-count="disconnectedCount"
          :canvas-empty="canvasEmpty"
          :selected-removable="selectedRemovable"
          @clear="confirmClearCanvas"
          @layout="autoLayoutCanvas"
          @fit="fitCanvas"
          @remove="removeSelectedCanvasCells"
        />
        <div class="rule-flow-designer__canvas-shell">
          <div
            ref="canvasRef"
            class="rule-flow-designer__canvas"
            tabindex="0"
            aria-label="规则配置画布"
            @dragover.prevent
            @drop="dropPaletteNode"
            @keydown="onCanvasKeydown"
          ></div>
          <div v-if="canvasEmpty && !readonly" class="rule-flow-designer__canvas-empty">
            从左侧拖入「条件分支 / 执行行为 / Switch 分支」到画布，再拖动节点端口完成连线
          </div>
        </div>
        <div class="rule-flow-designer__message" :class="{ 'is-error': Boolean(connectionMessage) }">
          {{
            readonly
              ? "双击节点查看详情；Ctrl/Command + 滚轮缩放"
              : connectionMessage || "双击条件分支或执行行为进行配置；Ctrl/Command + 滚轮缩放；保存后写回调度草稿"
          }}
        </div>
      </section>
    </div>
    <ElConfigProvider :z-index="5300">
      <el-dialog
        v-model="nodeEditorVisible"
        :title="editingNode?.kind === 'condition' ? '配置条件' : editingNode?.kind === 'switch' ? '配置 Switch 分支' : '配置执行行为'"
        width="880px"
        append-to-body
        destroy-on-close
        :z-index="5100"
        :close-on-click-modal="false"
      >
        <div class="rule-flow-designer__node-editor">
          <el-form v-if="editingNode?.condition" :disabled="readonly"><ScheduleRuleConditionWireSurface :condition="editingNode.condition" /></el-form>
          <el-form v-if="editingNode?.switchStep" :disabled="readonly"><ScheduleRuleSwitchConfig :step="editingNode.switchStep" /></el-form>
          <el-form v-if="editingNode?.action" label-width="100px">
            <el-form-item label="行为">
              <el-select
                :model-value="selectedActionOption?.id || editingNode.action.behaviorId"
                :disabled="readonly"
                filterable
                placeholder="请选择行为"
                :no-data-text="actionObjectIds.length ? '条件对象没有关联行为' : '暂无可选行为'"
                @update:model-value="changeNodeBehavior"
              >
                <el-option v-for="option in filteredBehaviorOptions" :key="option.id" :value="option.id" :label="option.displayName" />
                <el-option
                  v-if="readonly && selectedActionOption && !filteredBehaviorOptions.some((option) => option.id === selectedActionOption?.id)"
                  :value="selectedActionOption.id"
                  :label="selectedActionOption.displayName"
                />
              </el-select>
            </el-form-item>
            <section class="rule-flow-designer__parameters" aria-label="行为参数">
              <h3 class="rule-flow-designer__parameters-title">行为参数</h3>
              <el-alert v-if="readonly && !actionDetails?.[editingNode.action.id]?.entityJson" title="未保存行为参数" type="info" :closable="false" />
              <p v-if="readonly && actionDetails?.[editingNode.action.id]?.entityId">目标实例：{{ actionDetails[editingNode.action.id]?.entityId }}</p>
              <BehaviorParameterConfig v-if="selectedActionOption" :controller="parameterConfig" :readonly="readonly || parameterBusy" />
              <p v-else>请选择行为以配置参数</p>
              <el-alert v-if="parameterError" :title="parameterError" type="error" :closable="false" />
              <el-button v-if="parameterError" :disabled="parameterBusy" link @click="initializeActionParameters">重新加载行为参数</el-button>
            </section>
          </el-form>
        </div>
        <template #footer
          ><el-button @click="nodeEditorVisible = false">{{ readonly ? "关闭" : "取消" }}</el-button
          ><el-button v-if="!readonly" type="primary" :disabled="!!editingNode?.action && parameterBusy" @click="confirmNodeEditor">确定</el-button></template
        >
      </el-dialog>
    </ElConfigProvider>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { ElConfigProvider, ElMessage, ElMessageBox } from "element-plus";
import type { RuleConditionNode, ScheduleBehaviorOption, ScheduleRuleDetailGroup, ScheduleRuleFlowDocument } from "@/types";
import type { ScheduleRuleGraphNodeData } from "../utils/scheduleRuleFlowGraphCells";
import { cloneRuleFlowValue } from "../utils/scheduleRuleFlowFactory";
import ScheduleRuleConditionWireSurface from "./ScheduleRuleConditionWireSurface.vue";
import ScheduleRuleSwitchConfig from "./ScheduleRuleSwitchConfig.vue";
import BehaviorParameterConfig from "@/components/BehaviorParameterConfig/BehaviorParameterConfig.vue";
import { useRuleActionParameters } from "../composables/useRuleActionParameters";
import { filterBehaviorsByObjects } from "../utils/filterRuleBehaviorsByObject";
import { buildSavedActionEntityJson } from "../utils/restoreRuleScheduleDetail";
import { ScheduleRuleFlowGraphSession, type ScheduleRulePaletteKind } from "../utils/scheduleRuleFlowGraphSession";
import ScheduleRuleFlowPalette from "./ScheduleRuleFlowPalette.vue";
import ScheduleRuleFlowToolbar from "./ScheduleRuleFlowToolbar.vue";

const PALETTE_MIME = "application/x-rule-node";

const props = defineProps<{
  modelValue: ScheduleRuleFlowDocument;
  behaviorOptions: readonly ScheduleBehaviorOption[];
  readonly?: boolean;
  viewportReady?: boolean;
  actionDetails?: Readonly<ScheduleRuleDetailGroup["actionDetails"]>;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: ScheduleRuleFlowDocument];
}>();

const canvasRef = ref<HTMLElement | null>(null);
const connectionMessage = ref("");
const selectedRemovable = ref(false);
const disconnectedCount = ref(0);
const canvasEmpty = ref(true);
let session: ScheduleRuleFlowGraphSession | null = null;
let disposed = false;
const savedBehaviorIds = new Map<string, string>();
const nodeEditorVisible = ref(false);
const editingNode = ref<ScheduleRuleGraphNodeData | null>(null);
let editingNodeId = "";
const actionObjectIds = ref<string[]>([]);
const filteredBehaviorOptions = computed(() => filterBehaviorsByObjects(props.behaviorOptions, actionObjectIds.value));
const route = useRoute();
const selectedActionOption = computed(() => {
  const action = editingNode.value?.action;
  if (!action) return undefined;
  const option = props.behaviorOptions.find((item) => item.id === action.behaviorId);
  if (option || !props.readonly) return option;
  const detail = props.actionDetails?.[action.id];
  return detail
    ? { id: action.id, actionApi: detail.actionApi, displayName: action.behaviorName || detail.actionApi, ontologyUniqIdentifier: detail.ontologyIdentifier }
    : undefined;
});
const { parameterConfig, parameterBusy, parameterError, clearActionParameters, initializeActionParameters, captureActionParameters } = useRuleActionParameters(
  () => String(route.params.spaceId ?? ""),
  () => selectedActionOption.value,
  () => editingNode.value?.action,
  () => nodeEditorVisible.value,
  () => {
    const action = editingNode.value?.action;
    if (!action || action.behaviorParameters) return "";
    const detail = props.actionDetails?.[action.id];
    if (!detail || detail.actionApi !== selectedActionOption.value?.actionApi) return "";
    return buildSavedActionEntityJson(detail);
  },
);
watch(nodeEditorVisible, (visible) => {
  if (!visible) clearActionParameters();
});
watch(
  () => route.params.spaceId,
  () => {
    void initializeActionParameters();
  },
);

/** @description 双击时读取图节点副本，取消编辑不影响原图。 @param nodeId 双击节点标识。 */
function openNodeEditor(nodeId: string): void {
  const data = session?.getNodeData(nodeId);
  if (!data || (data.kind !== "condition" && data.kind !== "action" && data.kind !== "switch")) return;
  clearActionParameters();
  editingNodeId = nodeId;
  editingNode.value = cloneRuleFlowValue(data);
  if (props.readonly) {
    nodeEditorVisible.value = true;
    if (data.action) void initializeActionParameters();
    return;
  }
  actionObjectIds.value = data.action ? (session?.getActionConditionObjectIds(nodeId) ?? []) : [];
  if (editingNode.value.action?.behaviorId && actionObjectIds.value.length) {
    const selected = props.behaviorOptions.find((option) => option.id === editingNode.value?.action?.behaviorId);
    if (selected && !filteredBehaviorOptions.value.some((option) => option.id === selected.id)) {
      editingNode.value.action.behaviorId = "";
      editingNode.value.action.behaviorName = "";
      editingNode.value.action.params = [];
      editingNode.value.action.behaviorParameters = undefined;
      ElMessage.warning("已选行为与条件对象不匹配，请重新选择");
    }
  }
  nodeEditorVisible.value = true;
  if (data.action) void initializeActionParameters();
}

/** @description 使用当前空间行为更新节点行为标识及展示名称。 @param value 行为选项标识。 */
function changeNodeBehavior(value: unknown): void {
  const option = filteredBehaviorOptions.value.find((item) => item.id === value);
  const action = editingNode.value?.action;
  if (!action || !option) return;
  if (action.behaviorId === option.id) return;
  action.params = [];
  action.behaviorParameters = undefined;
  action.behaviorId = option.id;
  action.behaviorName = option.displayName;
  void initializeActionParameters();
}

/** @description 递归检测条件中已停用的值类型。 @param condition 当前条件。 @returns 是否含停用类型。 */
function hasUnsupportedConditionValue(condition: RuleConditionNode): boolean {
  if (condition.type === "composite") return condition.children.some(hasUnsupportedConditionValue);
  return [condition.left, condition.right].some((value) => value.kind !== "input" && value.kind !== "variable");
}

/** @description 拦截未重新选择的停用值，确认后仅更新目标节点，保留位置和边。 */
function confirmNodeEditor(): void {
  if (props.readonly) return;
  if (!editingNode.value) return;
  const { condition, action, switchStep } = editingNode.value;
  if (action && !filteredBehaviorOptions.value.some((option) => option.id === action.behaviorId)) {
    ElMessage.warning("请选择与条件对象匹配的行为");
    return;
  }
  if (
    (condition && hasUnsupportedConditionValue(condition)) ||
    action?.params.some((param) => param.value.kind !== "input" && param.value.kind !== "variable") ||
    (switchStep && [switchStep.switchOn, ...switchStep.cases.map((item) => item.value)].some((value) => value.kind !== "input" && value.kind !== "variable"))
  ) {
    ElMessage.warning("存在已停用的值类型，请重新选择输入值或变量后再确定");
    return;
  }
  if (action && !captureActionParameters()) return;
  session?.updateNodeData(editingNodeId, cloneRuleFlowValue(editingNode.value));
  nodeEditorVisible.value = false;
}

/**
 * @description 把画布序列化结果写回规则流文档。
 * @param doc 序列化文档。
 */
function commitRuleFlowDocument(doc: ScheduleRuleFlowDocument) {
  if (props.readonly) return;
  emit("update:modelValue", doc);
}

/**
 * @description 对当前画布执行自动布局。
 */
function autoLayoutCanvas() {
  session?.autoLayout();
}

/**
 * @description 缩放画布使节点可见。
 */
function fitCanvas() {
  session?.fitGraph();
}

/**
 * @description 删除当前选中的节点或边。
 */
function removeSelectedCanvasCells() {
  session?.removeSelected();
}

/**
 * @description 确认后清空为只剩规则开始。
 */
async function confirmClearCanvas() {
  if (canvasEmpty.value) return;
  try {
    await ElMessageBox.confirm("清空后画布将只剩「规则开始」，所有条件分支、执行行为与 Switch 分支都将被移除，是否继续？", "清空画布", {
      type: "warning",
      confirmButtonText: "清空",
      cancelButtonText: "取消",
    });
  } catch {
    return;
  }
  session?.clearCanvas();
}

/**
 * @description 接收面板拖入的节点并落到画布。
 * @param event 放置事件。
 */
function dropPaletteNode(event: DragEvent) {
  if (props.readonly) return;
  const kind = event.dataTransfer?.getData(PALETTE_MIME);
  if (kind !== "condition" && kind !== "action" && kind !== "switch") return;
  session?.dropPaletteNode(kind satisfies ScheduleRulePaletteKind, event.clientX, event.clientY);
}

/**
 * @description 把删除快捷键交给画布会话。
 * @param event 键盘事件。
 */
function onCanvasKeydown(event: KeyboardEvent) {
  if (props.readonly) return;
  session?.handleCanvasKeydown(event);
}

onMounted(() => {
  void nextTick(() => {
    const container = canvasRef.value;
    if (!container || disposed) return;
    session = new ScheduleRuleFlowGraphSession({
      getBehaviorOptions: () => props.behaviorOptions,
      getSavedAction: (action) => {
        const detail = props.actionDetails?.[action.id];
        const option = props.behaviorOptions.find((item) => item.id === action.behaviorId);
        if (!savedBehaviorIds.has(action.id)) savedBehaviorIds.set(action.id, action.behaviorId);
        return detail && savedBehaviorIds.get(action.id) === action.behaviorId && (!option || option.actionApi === detail.actionApi) ? detail : undefined;
      },
      onCommit: commitRuleFlowDocument,
      onConnectionMessage: (message) => {
        connectionMessage.value = message;
      },
      onSelectionChange: (removable) => {
        selectedRemovable.value = removable;
      },
      onCanvasState: (state) => {
        disconnectedCount.value = state.disconnectedCount;
        canvasEmpty.value = state.canvasEmpty;
      },
      onWarning: (message) => {
        ElMessage.warning(message);
      },
      onNodeDoubleClick: openNodeEditor,
    });
    session.mount(container, props.modelValue, props.readonly);
    if (props.viewportReady !== false) session.adaptViewport();
  });
});

watch(
  () => props.viewportReady,
  (ready) => {
    if (ready) session?.adaptViewport();
  },
);

onBeforeUnmount(() => {
  disposed = true;
  session?.dispose();
  session = null;
});
</script>

<style scoped lang="scss">
.rule-flow-designer {
  display: flex;
  min-width: 0;
  min-height: 0;
  height: 100%;
  flex-direction: column;
}
.rule-flow-designer__node-editor {
  min-height: 240px;
  max-height: 62vh;
  padding: 4px;
  overflow: auto;
}
.rule-flow-designer__parameters {
  margin-top: 16px;
  padding: 16px;
  border: 1px solid var(--aircas-color-border-soft);
  border-radius: 8px;
  background: var(--aircas-color-panel-background-deep);
}
.rule-flow-designer__parameters-title {
  margin: 0 0 12px;
  color: var(--aircas-color-text-primary);
  font-size: 14px;
  font-weight: 600;
}

.rule-flow-designer__main {
  display: flex;
  min-width: 0;
  min-height: 0;
  flex: 1;
  gap: 10px;
}

.rule-flow-designer__canvas-panel {
  display: flex;
  min-width: 0;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  gap: 8px;
}

.rule-flow-designer__canvas-shell {
  position: relative;
  min-height: 360px;
  flex: 1;
  overflow: hidden;
  border: 1px solid var(--aircas-color-border-soft);
  border-radius: 8px;
  background: var(--aircas-color-panel-background-deep);
}

.rule-flow-designer__canvas {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  outline: none;

  &:focus-visible {
    border-color: var(--aircas-color-accent-cyan);
  }
}

.rule-flow-designer__canvas-empty {
  position: absolute;
  top: 50%;
  left: 50%;
  z-index: 2;
  width: 380px;
  transform: translate(-50%, -50%);
  color: var(--aircas-color-text-muted);
  font-size: 12px;
  text-align: center;
  pointer-events: none;
}

.rule-flow-designer__message {
  flex-shrink: 0;
  min-height: 18px;
  color: var(--aircas-color-text-muted);
  font-size: 11px;

  &.is-error {
    color: var(--aircas-color-accent-orange);
  }
}
</style>
