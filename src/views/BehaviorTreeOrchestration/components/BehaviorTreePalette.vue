<template>
  <aside class="behavior-tree-palette" aria-label="行为树节点面板">
    <section class="behavior-tree-palette__section">
      <h3>节点种类</h3>
      <div v-for="group in groupedKinds" :key="group.category" class="behavior-tree-palette__group">
        <div class="behavior-tree-palette__group-title">{{ group.label }}</div>
        <button
          v-for="item in group.items"
          :key="item.kind"
          type="button"
          class="behavior-tree-palette__item"
          draggable="true"
          @dragstart="emitDragStart($event, { kind: item.kind })"
          @click="emit('add-kind', item.kind)"
        >
          {{ item.name }}
        </button>
      </div>
    </section>
    <section class="behavior-tree-palette__section">
      <h3>可绑定行为</h3>
      <p v-if="defsStatus === 'loading'" class="behavior-tree-palette__hint">正在加载节点目录…</p>
      <p v-else-if="defsStatus === 'error'" class="behavior-tree-palette__hint behavior-tree-palette__hint--error" role="alert">
        {{ defsError || "节点目录加载失败" }}
        <el-button link type="primary" @click="emit('retry-defs')">重试</el-button>
      </p>
      <p v-else-if="!availableActions.length" class="behavior-tree-palette__hint">当前空间暂无可绑定的已发布行为</p>
      <button
        v-for="action in availableActions"
        :key="action.actionApi"
        type="button"
        class="behavior-tree-palette__item behavior-tree-palette__item--action"
        draggable="true"
        :title="`${action.displayName || action.actionApi}\n${action.actionApi}`"
        @dragstart="emitDragStart($event, { kind: 'ACTION', actionApi: action.actionApi })"
        @click="emit('add-action', action.actionApi)"
      >
        <strong :title="action.displayName || action.actionApi">{{ action.displayName || action.actionApi }}</strong>
        <span :title="action.actionApi">{{ action.actionApi }}</span>
      </button>
    </section>
  </aside>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type {
  ActionTreeBindableAction,
  BehaviorTreeDragPayload,
  BehaviorTreeKindMeta,
  BehaviorTreeNodeKind,
  BehaviorTreeOrchestrationLoadStatus,
} from "@/types";
import { BEHAVIOR_TREE_CATEGORY_LABELS, BEHAVIOR_TREE_DRAG_MIME, BEHAVIOR_TREE_LOCAL_KINDS } from "../utils/behaviorTreeConstants";

const props = defineProps<{
  kindMeta: Record<BehaviorTreeNodeKind, BehaviorTreeKindMeta>;
  availableActions: ActionTreeBindableAction[];
  defsStatus: BehaviorTreeOrchestrationLoadStatus;
  defsError: string;
}>();

const emit = defineEmits<{
  "add-kind": [kind: BehaviorTreeNodeKind];
  "add-action": [actionApi: string];
  "retry-defs": [];
}>();

const groupedKinds = computed(() => {
  const categories: Array<"COMPOSITE" | "DECORATOR" | "LEAF"> = ["COMPOSITE", "DECORATOR", "LEAF"];
  return categories.map((category) => ({
    category,
    label: BEHAVIOR_TREE_CATEGORY_LABELS[category] || category,
    items: BEHAVIOR_TREE_LOCAL_KINDS.map((item) => props.kindMeta[item.kind]).filter((item) => item.category === category),
  }));
});

/**
 * @description 写入调色板拖拽载荷。
 * @param event 拖拽事件。
 * @param payload 载荷。
 */
function emitDragStart(event: DragEvent, payload: BehaviorTreeDragPayload): void {
  if (!event.dataTransfer) return;
  const raw = JSON.stringify(payload);
  event.dataTransfer.setData(BEHAVIOR_TREE_DRAG_MIME, raw);
  event.dataTransfer.setData("text/plain", raw);
  event.dataTransfer.effectAllowed = "copy";
}
</script>

<style scoped lang="scss">
.behavior-tree-palette {
  display: flex;
  min-width: 0;
  min-height: 0;
  flex-direction: column;
  gap: 12px;
  overflow: auto;
  padding: 12px;
  border-right: 1px solid var(--aircas-color-border);
  background: var(--aircas-color-panel-background);
}

.behavior-tree-palette__section {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 6px;
}

.behavior-tree-palette__section h3 {
  margin: 0;
  color: var(--aircas-color-text-primary);
  font-size: 13px;
  font-weight: 600;
}

.behavior-tree-palette__group {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 6px;
}

.behavior-tree-palette__group-title {
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
}

.behavior-tree-palette__item {
  display: flex;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  flex-direction: column;
  align-items: stretch;
  gap: 2px;
  box-sizing: border-box;
  padding: 8px 10px;
  border: 1px solid var(--aircas-color-border);
  border-radius: 6px;
  background: color-mix(in srgb, var(--aircas-color-panel-background-deep) 88%, transparent);
  color: var(--aircas-color-text-primary);
  text-align: left;
  cursor: grab;
}

.behavior-tree-palette__item:hover {
  border-color: var(--aircas-color-primary);
}

.behavior-tree-palette__item--action {
  flex: 0 0 52px;
  height: 52px;
  justify-content: center;
  overflow: hidden;
}

.behavior-tree-palette__item--action strong,
.behavior-tree-palette__item--action span {
  display: block;
  width: 100%;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.behavior-tree-palette__item--action strong {
  font-size: 13px;
  font-weight: 600;
  line-height: 18px;
}

.behavior-tree-palette__item--action span {
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
  line-height: 16px;
}

.behavior-tree-palette__hint {
  margin: 0;
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
  line-height: 1.5;
}

.behavior-tree-palette__hint--error {
  color: var(--aircas-color-danger);
}
</style>
