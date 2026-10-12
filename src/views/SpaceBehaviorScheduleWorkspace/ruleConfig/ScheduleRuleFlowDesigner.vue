<template>
  <div class="rule-flow-designer">
    <div class="rule-flow-designer__main">
      <ScheduleRuleFlowPalette />
      <section class="rule-flow-designer__canvas-panel">
        <ScheduleRuleFlowToolbar
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
          <div v-if="canvasEmpty" class="rule-flow-designer__canvas-empty">从左侧拖入「条件分支 / 执行行为 / Switch 分支」到画布，再拖动节点端口完成连线</div>
        </div>
        <div class="rule-flow-designer__message" :class="{ 'is-error': Boolean(connectionMessage) }">
          {{ connectionMessage || "画布支持拖动、Ctrl/Command + 滚轮缩放；保存后写回调度草稿" }}
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import type { ScheduleRuleFlowDocument } from "@/types";
import { ScheduleRuleFlowGraphSession, type ScheduleRulePaletteKind } from "../utils/scheduleRuleFlowGraphSession";
import ScheduleRuleFlowPalette from "./ScheduleRuleFlowPalette.vue";
import ScheduleRuleFlowToolbar from "./ScheduleRuleFlowToolbar.vue";

const PALETTE_MIME = "application/x-rule-node";

const props = defineProps<{
  modelValue: ScheduleRuleFlowDocument;
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

/**
 * @description 把画布序列化结果写回规则流文档。
 * @param doc 序列化文档。
 */
function commitRuleFlowDocument(doc: ScheduleRuleFlowDocument) {
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
  const kind = event.dataTransfer?.getData(PALETTE_MIME);
  if (kind !== "condition" && kind !== "action" && kind !== "switch") return;
  session?.dropPaletteNode(kind satisfies ScheduleRulePaletteKind, event.clientX, event.clientY);
}

/**
 * @description 把删除快捷键交给画布会话。
 * @param event 键盘事件。
 */
function onCanvasKeydown(event: KeyboardEvent) {
  session?.handleCanvasKeydown(event);
}

onMounted(() => {
  void nextTick(() => {
    const container = canvasRef.value;
    if (!container) return;
    session = new ScheduleRuleFlowGraphSession({
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
    });
    session.mount(container, props.modelValue);
  });
});

onBeforeUnmount(() => {
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
