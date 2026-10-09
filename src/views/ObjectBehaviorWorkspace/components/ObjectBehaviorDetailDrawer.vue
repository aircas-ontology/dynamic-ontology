<template>
  <el-drawer :model-value="modelValue" class="aircas-drawer" title="行为详情" size="680px" @update:model-value="emit('update:modelValue', $event)">
    <template v-if="behavior"
      ><el-descriptions :column="2" border
        ><el-descriptions-item label="行为名称">{{ behavior.displayName }}</el-descriptions-item
        ><el-descriptions-item label="行为 ID">{{ behavior.id }}</el-descriptions-item
        ><el-descriptions-item label="函数算子">{{ behavior.functionOperatorName }}</el-descriptions-item
        ><el-descriptions-item label="状态">{{ SPACE_BEHAVIOR_STATUS_LABELS[behavior.status] }}</el-descriptions-item
        ><el-descriptions-item label="执行范围">{{ behavior.singleObject ? "单对象" : "多对象" }}</el-descriptions-item
        ><el-descriptions-item label="更新时间">{{ behavior.updatedAt }}</el-descriptions-item
        ><el-descriptions-item label="描述" :span="2">{{ behavior.description || "—" }}</el-descriptions-item
        ><el-descriptions-item label="变更说明" :span="2">{{ behavior.changeNote || "—" }}</el-descriptions-item></el-descriptions
      >
      <h3>输入参数</h3>
      <el-empty v-if="!behavior.inputParameters.length" description="暂无输入参数" /><el-table
        v-else
        :data="behavior.inputParameters"
        class="aircas-table aircas-table--flat"
        ><el-table-column prop="name" label="参数" /><el-table-column prop="type" label="类型" /><el-table-column prop="description" label="描述"
      /></el-table>
      <h3>状态操作记录</h3>
      <el-timeline
        ><el-timeline-item v-for="item in behavior.statusLogs" :key="item">{{ item }}</el-timeline-item
        ><el-timeline-item v-if="!behavior.statusLogs.length">暂无状态操作记录</el-timeline-item></el-timeline
      ></template
    >
  </el-drawer>
</template>
<script setup lang="ts">
import type { SpaceBehaviorItem } from "@/types";
import { SPACE_BEHAVIOR_STATUS_LABELS } from "@/types";
defineProps<{ modelValue: boolean; behavior: SpaceBehaviorItem | null }>();
const emit = defineEmits<{ "update:modelValue": [value: boolean] }>();
</script>
<style scoped lang="scss">
h3 {
  margin: 24px 0 12px;
  color: var(--aircas-color-text-primary);
  font-size: 16px;
}
</style>
