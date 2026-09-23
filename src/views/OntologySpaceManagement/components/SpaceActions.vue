<template>
  <div class="space-actions">
    <el-button class="aircas-button aircas-button--tone-primary" type="primary" plain size="small" :icon="Right" @click="$emit('action', 'enter', space)"
      >进入</el-button
    >
    <el-button class="aircas-button aircas-button--tone-secondary" type="primary" plain size="small" :icon="Edit" @click="$emit('action', 'edit', space)"
      >编辑</el-button
    >
    <el-dropdown class="aircas-dropdown" popper-class="aircas-dropdown-popper" trigger="click" @command="command">
      <el-button class="aircas-button aircas-button--tone-ghost" type="primary" plain size="small"
        >更多<el-icon> <ArrowDown /> </el-icon
      ></el-button>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item command="subspace">子空间</el-dropdown-item>
          <el-dropdown-item v-if="canBuildConceptualModel" command="conceptual-model">概念构建</el-dropdown-item>
          <el-dropdown-item command="export">导出</el-dropdown-item>
          <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>
<script setup lang="ts">
import { computed } from "vue";
import { ArrowDown, Edit, Right } from "@element-plus/icons-vue";
import type { OntologySpaceAction, OntologySpaceItem } from "@/types";
const props = defineProps<{ space: OntologySpaceItem }>();
const emit = defineEmits<{ action: [action: OntologySpaceAction, space: OntologySpaceItem] }>();
const canBuildConceptualModel = computed(() => props.space.metrics.ontology === 0);
/**
 * @description 将下拉命令转成空间运维动作。对象数量不为 0 时不进入概念构建。
 * @param value 下拉菜单提交的未知命令。
 */
function command(value: unknown) {
  if (value === "conceptual-model") {
    if (!canBuildConceptualModel.value) return;
    emit("action", value, props.space);
    return;
  }
  if (value === "subspace" || value === "export" || value === "delete") emit("action", value, props.space);
}
</script>
<style scoped lang="scss">
.space-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.space-actions .el-button + .el-button {
  margin-left: 0;
}
</style>
