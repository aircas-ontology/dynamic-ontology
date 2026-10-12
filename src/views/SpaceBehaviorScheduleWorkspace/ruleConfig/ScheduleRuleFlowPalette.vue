<template>
  <aside class="rule-flow-designer__palette">
    <div class="rule-flow-designer__palette-title">节点</div>
    <div class="rule-flow-designer__palette-item" draggable="true" @dragstart="startPaletteDrag($event, 'condition')">
      <strong>条件分支</strong>
      <small>IF / ELSE IF 判断</small>
    </div>
    <div class="rule-flow-designer__palette-item" draggable="true" @dragstart="startPaletteDrag($event, 'action')">
      <strong>执行行为</strong>
      <small>顺序执行的行为</small>
    </div>
    <div class="rule-flow-designer__palette-item" draggable="true" @dragstart="startPaletteDrag($event, 'switch')">
      <strong>Switch 分支</strong>
      <small>按变量值分发多路</small>
    </div>
    <p class="rule-flow-designer__palette-hint">拖拽节点到画布，拖动端口连线。多路连线汇入同一节点即为汇合后执行。</p>
  </aside>
</template>

<script setup lang="ts">
import type { ScheduleRulePaletteKind } from "../utils/scheduleRuleFlowGraphSession";

const PALETTE_MIME = "application/x-rule-node";

/**
 * @description 把节点类型写入拖拽数据，供画布 drop 识别。
 * @param event 拖拽开始事件。
 * @param kind 节点类型。
 */
function startPaletteDrag(event: DragEvent, kind: ScheduleRulePaletteKind) {
  event.dataTransfer?.setData(PALETTE_MIME, kind);
  if (event.dataTransfer) event.dataTransfer.effectAllowed = "copy";
}
</script>

<style scoped lang="scss">
.rule-flow-designer__palette {
  display: flex;
  width: 168px;
  flex-shrink: 0;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
  border: 1px solid var(--aircas-color-border-soft);
  border-radius: 8px;
  background: var(--aircas-color-panel-background);
}

.rule-flow-designer__palette-title {
  color: var(--aircas-color-text-primary);
  font-size: 13px;
  font-weight: 650;
}

.rule-flow-designer__palette-item {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 9px 10px;
  border: 1px solid var(--aircas-color-border-soft);
  border-radius: 6px;
  background: var(--aircas-color-input-background);
  cursor: grab;
  transition: border-color 0.15s ease;

  &:hover {
    border-color: var(--aircas-color-accent-cyan);
  }

  &:active {
    cursor: grabbing;
  }

  strong {
    color: var(--aircas-color-text-primary);
    font-size: 12px;
  }

  small {
    color: var(--aircas-color-text-muted);
    font-size: 10px;
  }
}

.rule-flow-designer__palette-hint {
  margin-top: auto;
  color: var(--aircas-color-text-muted);
  font-size: 10px;
  line-height: 1.6;
}
</style>
