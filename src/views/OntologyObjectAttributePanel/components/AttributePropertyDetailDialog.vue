<template>
  <el-dialog
    title="属性详情"
    width="min(760px, 94vw)"
    append-to-body
    destroy-on-close
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
  >
    <el-descriptions v-if="attribute" :column="2" border>
      <el-descriptions-item label="属性名称">{{ attribute.displayName || "—" }}</el-descriptions-item>
      <el-descriptions-item label="API">{{ attribute.apiName || "—" }}</el-descriptions-item>
      <el-descriptions-item label="属性分类">{{ categoryName || "未分类" }}</el-descriptions-item>
      <el-descriptions-item label="数据类型">{{ attribute.dataType || "—" }}</el-descriptions-item>
      <el-descriptions-item label="存储分组">{{ attribute.storageGroup || "—" }}</el-descriptions-item>
      <el-descriptions-item label="默认值">{{ attribute.defaultValue || "—" }}</el-descriptions-item>
      <el-descriptions-item label="主键">{{ attribute.isPrimary ? "是" : "否" }}</el-descriptions-item>
      <el-descriptions-item label="名称键">{{ attribute.isNameKey ? "是" : "否" }}</el-descriptions-item>
      <el-descriptions-item label="属性描述" :span="2">{{ attribute.description || "—" }}</el-descriptions-item>
    </el-descriptions>
    <el-empty v-else description="暂无属性详情" />
    <template #footer>
      <el-button @click="$emit('update:visible', false)">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import type { OntologyAttributeItem } from "@/types";

defineProps<{
  visible: boolean;
  attribute: OntologyAttributeItem | null;
  categoryName: string;
}>();

defineEmits<{
  "update:visible": [value: boolean];
}>();
</script>
