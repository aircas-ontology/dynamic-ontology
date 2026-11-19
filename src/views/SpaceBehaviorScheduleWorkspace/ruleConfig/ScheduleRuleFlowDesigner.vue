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
        >
          <template #document-actions><slot name="toolbar-actions" /></template>
        </ScheduleRuleFlowToolbar>
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
      <ScheduleRuleConditionEditorDialog
        v-model="conditionEditorVisible"
        :condition="editingConditionNode?.condition ?? null"
        :readonly="conditionEditorReadonly"
        @confirm="confirmConditionEditor"
      />
      <ScheduleRuleActionEditorDialog
        ref="actionDialogRef"
        v-model="actionEditorVisible"
        :action="editingActionNode?.action ?? null"
        :action-node-id="actionNodeId"
        :paths="actionConditionPaths"
        :readonly="readonly"
        :filtered-behavior-options="filteredBehaviorOptions"
        :selected-action-option="selectedActionOption"
        :action-object-ids="actionObjectIds"
        :action-detail="editingActionNode?.action ? actionDetails?.[editingActionNode.action.id] : undefined"
        :parameter-config="parameterConfig"
        :tree-parameters="treeParameters"
        :parameter-busy="parameterBusy"
        :parameter-error="parameterError"
        @confirm="confirmActionEditor"
        @change-behavior="changeNodeBehavior"
        @reload-parameters="initializeActionParameters"
      />
      <ScheduleRuleSwitchEditorDialog
        v-model="switchEditorVisible"
        :step="editingSwitchNode?.switchStep ?? null"
        :readonly="readonly"
        @confirm="confirmSwitchEditor"
      />
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
import { useRuleActionParameters } from "../composables/useRuleActionParameters";
import { filterBehaviorsByObjects } from "../utils/filterRuleBehaviorsByObject";
import { buildSavedActionEntityJson } from "../utils/restoreRuleScheduleDetail";
import { ScheduleRuleFlowGraphSession, type ScheduleRulePaletteKind } from "../utils/scheduleRuleFlowGraphSession";
import ScheduleRuleFlowPalette from "./ScheduleRuleFlowPalette.vue";
import ScheduleRuleFlowToolbar from "./ScheduleRuleFlowToolbar.vue";
import ScheduleRuleConditionEditorDialog from "./ScheduleRuleConditionEditorDialog.vue";
import ScheduleRuleActionEditorDialog from "./ScheduleRuleActionEditorDialog.vue";
import ScheduleRuleSwitchEditorDialog from "./ScheduleRuleSwitchEditorDialog.vue";
import type { ActionConditionSource } from "../utils/ruleConditionInstanceBindings";

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
const actionDialogRef = ref<InstanceType<typeof ScheduleRuleActionEditorDialog> | null>(null);
const actionEditorRef = ref<HTMLElement | null>(null);
const connectionMessage = ref("");
const selectedRemovable = ref(false);
const disconnectedCount = ref(0);
const canvasEmpty = ref(true);
let session: ScheduleRuleFlowGraphSession | null = null;
let disposed = false;
const savedBehaviorIds = new Map<string, string>();

const conditionEditorVisible = ref(false);
const editingConditionNode = ref<ScheduleRuleGraphNodeData | null>(null);
const conditionCompanionReadonly = ref(false);
let conditionNodeId = "";
const conditionEditorReadonly = computed(() => Boolean(props.readonly) || conditionCompanionReadonly.value);

const actionEditorVisible = ref(false);
const editingActionNode = ref<ScheduleRuleGraphNodeData | null>(null);
const actionNodeId = ref("");
const actionConditionPaths = ref<ActionConditionSource[][]>([]);
const actionObjectIds = ref<string[]>([]);

const switchEditorVisible = ref(false);
const editingSwitchNode = ref<ScheduleRuleGraphNodeData | null>(null);
let switchNodeId = "";

const filteredBehaviorOptions = computed(() => filterBehaviorsByObjects(props.behaviorOptions, actionObjectIds.value));
const route = useRoute();
const selectedActionOption = computed(() => {
  const action = editingActionNode.value?.action;
  if (!action) return undefined;
  const option = props.behaviorOptions.find((item) => item.id === action.behaviorId);
  if (option || !props.readonly) return option;
  const detail = props.actionDetails?.[action.id];
  return detail
    ? {
        id: action.id,
        actionApi: detail.actionApi,
        displayName: action.behaviorName || detail.actionApi,
        ontologyUniqIdentifier: detail.ontologyIdentifier,
        kind: Boolean(action.treeParameters) || detail.entityJson.includes('"treeApi"') ? ("behaviorTree" as const) : ("application" as const),
      }
    : undefined;
});
const { parameterConfig, treeParameters, parameterBusy, parameterError, clearActionParameters, initializeActionParameters, captureActionParameters } =
  useRuleActionParameters(
    () => String(route.params.spaceId ?? ""),
    () => selectedActionOption.value,
    () => editingActionNode.value?.action,
    () => actionEditorVisible.value,
    () => {
      const action = editingActionNode.value?.action;
      if (!action || action.behaviorParameters || action.treeParameters) return "";
      const detail = props.actionDetails?.[action.id];
      if (!detail || detail.actionApi !== selectedActionOption.value?.actionApi) return "";
      return buildSavedActionEntityJson(detail);
    },
  );

watch(actionEditorVisible, (visible) => {
  if (!visible) clearActionParameters();
});
watch(conditionEditorVisible, (visible) => {
  if (!visible) conditionCompanionReadonly.value = false;
});
watch(
  () => route.params.spaceId,
  () => {
    void initializeActionParameters();
  },
);

/**
 * @description 打开条件配置弹窗；行为参数已打开时以只读对照打开，可并存。
 * @param nodeId 条件节点标识。
 * @param data 节点数据副本。
 */
function openConditionEditor(nodeId: string, data: ScheduleRuleGraphNodeData): void {
  conditionNodeId = nodeId;
  editingConditionNode.value = cloneRuleFlowValue(data);
  conditionCompanionReadonly.value = actionEditorVisible.value;
  conditionEditorVisible.value = true;
}

/**
 * @description 打开行为参数弹窗；条件配置已打开时拒绝打开，避免反向并存编辑。
 * @param nodeId 行为节点标识。
 * @param data 节点数据副本。
 */
function openActionEditor(nodeId: string, data: ScheduleRuleGraphNodeData): void {
  if (conditionEditorVisible.value && !actionEditorVisible.value) {
    ElMessage.warning("请先关闭条件配置后再打开行为参数");
    return;
  }
  clearActionParameters();
  actionNodeId.value = nodeId;
  editingActionNode.value = cloneRuleFlowValue(data);
  actionConditionPaths.value = session?.getActionConditionPaths(nodeId) ?? [];
  void nextTick(() => {
    if (actionEditorRef.value) actionEditorRef.value.scrollTop = 0;
  });
  if (!props.readonly) {
    actionObjectIds.value = session?.getActionConditionObjectIds(nodeId) ?? [];
    if (editingActionNode.value.action?.behaviorId && actionObjectIds.value.length) {
      const selected = props.behaviorOptions.find((option) => option.id === editingActionNode.value?.action?.behaviorId);
      if (selected && !filteredBehaviorOptions.value.some((option) => option.id === selected.id)) {
        editingActionNode.value.action.behaviorId = "";
        editingActionNode.value.action.behaviorName = "";
        editingActionNode.value.action.params = [];
        editingActionNode.value.action.behaviorParameters = undefined;
        ElMessage.warning("已选行为与条件对象不匹配，请重新选择");
      }
    }
  }
  actionEditorVisible.value = true;
  void initializeActionParameters();
}

/** @description 打开 Switch 配置弹窗，保持原有单独编辑行为。 @param nodeId Switch 节点标识。 @param data 节点数据副本。 */
function openSwitchEditor(nodeId: string, data: ScheduleRuleGraphNodeData): void {
  switchNodeId = nodeId;
  editingSwitchNode.value = cloneRuleFlowValue(data);
  switchEditorVisible.value = true;
}

/** @description 双击节点时按非对称规则打开条件或行为弹窗。 @param nodeId 双击节点标识。 */
function openNodeEditor(nodeId: string): void {
  const data = session?.getNodeData(nodeId);
  if (!data) return;
  if (data.kind === "condition") {
    openConditionEditor(nodeId, data);
    return;
  }
  if (data.kind === "action") {
    openActionEditor(nodeId, data);
    return;
  }
  if (data.kind === "switch") {
    openSwitchEditor(nodeId, data);
  }
}

/** @description 使用当前空间行为更新节点行为标识及展示名称。 @param value 行为选项标识。 */
function changeNodeBehavior(value: unknown): void {
  const option = filteredBehaviorOptions.value.find((item) => item.id === value);
  const action = editingActionNode.value?.action;
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

/** @description 确认条件配置并写回目标条件节点；只读对照态仅关闭不写回。 */
function confirmConditionEditor(): void {
  if (conditionEditorReadonly.value || !editingConditionNode.value?.condition) {
    conditionEditorVisible.value = false;
    return;
  }
  if (hasUnsupportedConditionValue(editingConditionNode.value.condition)) {
    ElMessage.warning("存在已停用的值类型，请重新选择输入值或变量后再确定");
    return;
  }
  session?.updateNodeData(conditionNodeId, cloneRuleFlowValue(editingConditionNode.value));
  conditionEditorVisible.value = false;
}

/** @description 确认行为参数配置并写回目标行为节点。 */
function confirmActionEditor(): void {
  if (props.readonly || !editingActionNode.value?.action) return;
  const action = editingActionNode.value.action;
  if (!filteredBehaviorOptions.value.some((option) => option.id === action.behaviorId)) {
    ElMessage.warning("请选择与条件对象匹配的行为");
    return;
  }
  if (action.params.some((param) => param.value.kind !== "input" && param.value.kind !== "variable")) {
    ElMessage.warning("存在已停用的值类型，请重新选择输入值或变量后再确定");
    return;
  }
  const exposedInstances = actionDialogRef.value?.conditionInstancesRef as
    { validateInstances?: () => string | undefined } | { value?: { validateInstances?: () => string | undefined } | null } | null | undefined;
  const instances = exposedInstances && typeof exposedInstances === "object" && "value" in exposedInstances ? exposedInstances.value : exposedInstances;
  const bindingError = instances?.validateInstances?.();
  if (bindingError) {
    ElMessage.warning(bindingError);
    return;
  }
  if (!captureActionParameters()) return;
  session?.updateActionWithConditions(actionNodeId.value, cloneRuleFlowValue(editingActionNode.value), actionConditionPaths.value);
  actionEditorVisible.value = false;
}

/** @description 确认 Switch 配置并写回目标节点。 */
function confirmSwitchEditor(): void {
  if (props.readonly || !editingSwitchNode.value?.switchStep) return;
  const switchStep = editingSwitchNode.value.switchStep;
  if ([switchStep.switchOn, ...switchStep.cases.map((item) => item.value)].some((value) => value.kind !== "input" && value.kind !== "variable")) {
    ElMessage.warning("存在已停用的值类型，请重新选择输入值或变量后再确定");
    return;
  }
  session?.updateNodeData(switchNodeId, cloneRuleFlowValue(editingSwitchNode.value));
  switchEditorVisible.value = false;
}

/**
 * @description 把画布序列化结果写回规则流文档。
 * @param doc 序列化文档。
 */
function commitRuleFlowDocument(doc: ScheduleRuleFlowDocument) {
  if (props.readonly) return;
  emit("update:modelValue", doc);
}

/** @description 对当前画布执行自动布局。 */
function autoLayoutCanvas() {
  session?.autoLayout();
}

/** @description 缩放画布使节点可见。 */
function fitCanvas() {
  session?.fitGraph();
}

/** @description 删除当前选中的节点或边。 */
function removeSelectedCanvasCells() {
  session?.removeSelected();
}

/** @description 确认后清空为只剩规则开始。 */
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
