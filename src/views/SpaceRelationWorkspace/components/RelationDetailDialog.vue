<template>
  <el-dialog
    title="关系详情"
    width="min(760px, 94vw)"
    append-to-body
    destroy-on-close
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <el-descriptions v-if="relation" :column="2" border>
      <el-descriptions-item label="关系名称">{{ relation.displayName || "—" }}</el-descriptions-item>
      <el-descriptions-item label="API">{{ relation.apiName || "—" }}</el-descriptions-item>
      <el-descriptions-item label="关系分类">{{ relation.categoryName || "未分类" }}</el-descriptions-item>
      <el-descriptions-item label="基数">{{ relation.cardinality || "—" }}</el-descriptions-item>
      <el-descriptions-item label="源对象">{{ relation.sourceName || "—" }}</el-descriptions-item>
      <el-descriptions-item label="目标对象">{{ relation.targetName || "—" }}</el-descriptions-item>
      <el-descriptions-item label="关系描述" :span="2">{{ relation.description || "—" }}</el-descriptions-item>
    </el-descriptions>
    <el-empty v-else description="暂无关系详情" />
    <template #footer>
      <el-button @click="$emit('update:modelValue', false)">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import type { OntologyRelationClass } from "@/types";

defineProps<{
  modelValue: boolean;
  relation: OntologyRelationClass | null;
}>();

defineEmits<{
  "update:modelValue": [value: boolean];
}>();
</script>
