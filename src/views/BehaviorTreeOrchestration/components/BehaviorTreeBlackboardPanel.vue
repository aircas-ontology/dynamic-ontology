<template>
  <div class="behavior-tree-board">
    <div class="behavior-tree-board__toolbar">
      <el-button type="primary" @click="emit('add-row')">新增黑板键</el-button>
    </div>
    <el-table :data="rows" empty-text="暂无黑板键" size="small">
      <el-table-column label="键名" min-width="120">
        <template #default="{ row, $index }">
          <el-input :model-value="row.key" @update:model-value="emit('update-field', $index, 'key', String($event))" />
        </template>
      </el-table-column>
      <el-table-column label="类型" width="120">
        <template #default="{ row, $index }">
          <el-select :model-value="row.valueType" style="width: 100%" @change="emit('update-field', $index, 'valueType', String($event))">
            <el-option v-for="type in BEHAVIOR_TREE_VALUE_TYPES" :key="type" :label="type" :value="type" />
          </el-select>
        </template>
      </el-table-column>
      <el-table-column label="绑定属性" min-width="140">
        <template #default="{ row, $index }">
          <el-input
            :model-value="row.bindPropertyUniqueIdentifier"
            placeholder="可选"
            @update:model-value="emit('update-field', $index, 'bindPropertyUniqueIdentifier', String($event))"
          />
        </template>
      </el-table-column>
      <el-table-column label="默认值" min-width="120">
        <template #default="{ row, $index }">
          <el-input :model-value="row.defaultValueText" @update:model-value="emit('update-field', $index, 'defaultValueText', String($event))" />
        </template>
      </el-table-column>
      <el-table-column label="描述" min-width="140">
        <template #default="{ row, $index }">
          <el-input :model-value="row.description" @update:model-value="emit('update-field', $index, 'description', String($event))" />
        </template>
      </el-table-column>
      <el-table-column label="" width="64">
        <template #default="{ $index }">
          <el-button link type="danger" @click="emit('delete-row', $index)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import type { BehaviorTreeBlackboardItem } from "@/types";
import { BEHAVIOR_TREE_VALUE_TYPES } from "../utils/behaviorTreeConstants";

defineProps<{
  rows: BehaviorTreeBlackboardItem[];
}>();

const emit = defineEmits<{
  "add-row": [];
  "delete-row": [index: number];
  "update-field": [index: number, field: keyof BehaviorTreeBlackboardItem, value: string];
}>();
</script>

<style scoped lang="scss">
.behavior-tree-board__toolbar {
  margin-bottom: 10px;
}
</style>
