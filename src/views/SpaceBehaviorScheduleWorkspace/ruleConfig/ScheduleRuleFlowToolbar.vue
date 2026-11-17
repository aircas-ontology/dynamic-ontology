<template>
  <div class="rule-flow-designer__toolbar">
    <div class="rule-flow-designer__toolbar-actions">
      <el-button class="aircas-button aircas-button--tone-danger" type="danger" :disabled="canvasEmpty" @click.stop="emit('clear')">清空画布</el-button>
      <el-button class="aircas-button aircas-button--tone-ghost" @click.stop="emit('layout')">自动布局</el-button>
      <el-button class="aircas-button aircas-button--tone-ghost" @click.stop="emit('fit')">适应画布</el-button>
      <el-button class="aircas-button aircas-button--tone-danger" type="danger" :disabled="!selectedRemovable" @click.stop="emit('remove')">删除选中</el-button>
    </div>
    <div v-if="$slots['document-actions']" class="rule-flow-designer__document-actions"><slot name="document-actions" /></div>
    <span class="rule-flow-designer__toolbar-tip">
      「满足」连条件成立路径；「否则」连下一条件/行为；空路径可停在画布上
      <template v-if="disconnectedCount > 0">（{{ disconnectedCount }} 个节点未接入流程）</template>
    </span>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  disconnectedCount: number;
  canvasEmpty: boolean;
  selectedRemovable: boolean;
}>();

const emit = defineEmits<{
  clear: [];
  layout: [];
  fit: [];
  remove: [];
}>();
</script>

<style scoped lang="scss">
.rule-flow-designer__toolbar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  flex-shrink: 0;
  align-items: center;
  gap: 10px;
}

.rule-flow-designer__toolbar-tip {
  grid-column: 1 / -1;
  min-width: 0;
  overflow-wrap: anywhere;
  color: var(--aircas-color-text-muted);
  font-size: 11px;
}

.rule-flow-designer__toolbar-actions {
  grid-column: 2;
  grid-row: 1;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  flex-shrink: 0;
  align-items: center;
  gap: 8px;
}

.rule-flow-designer__document-actions {
  display: flex;
  grid-column: 3;
  grid-row: 1;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
}

@media (max-width: 1100px) {
  .rule-flow-designer__toolbar {
    grid-template-columns: minmax(0, 1fr);
  }

  .rule-flow-designer__document-actions {
    grid-column: 1;
    flex-wrap: wrap;
  }

  .rule-flow-designer__toolbar-actions {
    grid-column: 1;
    grid-row: 2;
  }
}
</style>
