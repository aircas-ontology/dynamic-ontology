<template>
  <div class="space-actions">
    <el-button class="aircas-button" type="primary" plain size="small" :icon="Right" @click="$emit('action', 'enter', space)">进入</el-button>
    <el-button class="aircas-button aircas-button--edit" size="small" :icon="Edit" @click="$emit('action', 'edit', space)">编辑</el-button>
    <el-dropdown class="aircas-dropdown" popper-class="aircas-dropdown-popper" trigger="click" @command="command">
      <el-button class="aircas-button" size="small">更多<el-icon><ArrowDown /></el-icon></el-button>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item command="subspace">子空间</el-dropdown-item>
          <el-dropdown-item command="export">导出</el-dropdown-item>
          <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>
<script setup lang="ts">
import { ArrowDown, Edit, Right } from "@element-plus/icons-vue";
import type { OntologySpaceItem } from "@/types";
const props = defineProps<{ space: OntologySpaceItem }>();
const emit = defineEmits<{ action: [action: string, space: OntologySpaceItem] }>();
function command(value: unknown) {
  if (typeof value === "string") emit("action", value, props.space);
}
</script>
<style scoped lang="scss">
.space-actions { display: flex; align-items: center; gap: 8px; }
.space-actions .el-button + .el-button { margin-left: 0; }
</style>
