<template>
  <div class="rule-flow-designer__toolbar">
    <span class="rule-flow-designer__toolbar-tip">
      「满足」连条件成立路径；「否则」连下一条件/行为；空路径可停在画布上
      <template v-if="disconnectedCount > 0">（{{ disconnectedCount }} 个节点未接入流程）</template>
    </span>
    <div class="rule-flow-designer__toolbar-actions">
      <el-button class="aircas-button aircas-button--tone-danger" type="danger" :disabled="canvasEmpty" @click.stop="emit('clear')">清空画布</el-button>
      <el-button class="aircas-button aircas-button--tone-ghost" @click.stop="emit('layout')">自动布局</el-button>
      <el-button class="aircas-button aircas-button--tone-ghost" @click.stop="emit('fit')">适应画布</el-button>
      <el-button class="aircas-button aircas-button--tone-danger" type="danger" :disabled="!selectedRemovable" @click.stop="emit('remove')">删除选中</el-button>
    </div>
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
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.rule-flow-designer__toolbar-tip {
  color: var(--aircas-color-text-muted);
  font-size: 11px;
}

.rule-flow-designer__toolbar-actions {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 8px;
}
</style>
