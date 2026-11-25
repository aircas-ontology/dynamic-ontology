<template>
  <el-dialog
    :model-value="visible"
    title="隐含关系校验"
    width="min(1200px, 94vw)"
    append-to-body
    destroy-on-close
    :close-on-click-modal="false"
    @update:model-value="$emit('update:visible', $event)"
  >
    <div v-if="task" class="implicit-verify">
      <p class="implicit-verify__meta">
        <span class="implicit-verify__subject">{{ task.nodeName }} · {{ task.relationTypes.join("、") }} · {{ task.hops.join("、") }} 跳</span>
        <span class="implicit-verify__count">共 {{ summary.total }} 条隐含关系，{{ summary.pending }} 条待校验</span>
      </p>
      <el-table class="aircas-table--accent-header implicit-verify__table" :data="rows" max-height="440" stripe empty-text="暂无隐含关系">
        <el-table-column label="起始节点" min-width="150">
          <template #default="{ row }">
            <div class="implicit-verify__node">
              <span class="implicit-verify__node-name" :title="row.startNodeName">{{ row.startNodeName }}</span>
              <span class="implicit-verify__node-id">{{ row.startNodeInstance }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="隐含关系" width="110">
          <template #default="{ row }">
            <span class="implicit-verify__badge">{{ row.relationLabel }}</span>
          </template>
        </el-table-column>
        <el-table-column label="终止节点" min-width="170">
          <template #default="{ row }">
            <div class="implicit-verify__node">
              <span class="implicit-verify__node-name" :title="row.endNodeName">{{ row.endNodeName }}</span>
              <span class="implicit-verify__node-id">{{ row.endNodeInstance }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="关系链路" min-width="340">
          <template #default="{ row }">
            <div class="implicit-verify__chain">
              <span class="implicit-verify__chain-path" :title="row.chainPath">{{ row.chainPath }}</span>
              <span class="implicit-verify__chain-meta">{{ row.chainSummary }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <span class="implicit-verify__status" :class="`implicit-verify__status--${row.status === '已保存' ? 'saved' : 'pending'}`">{{ row.status }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100">
          <template #default>
            <div class="implicit-verify__actions">
              <el-button link type="primary">保存</el-button>
              <el-button link type="danger">忽略</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <template #footer>
      <el-button @click="$emit('update:visible', false)">关闭</el-button>
    </template>
  </el-dialog>
</template>
<script setup lang="ts">
import { computed } from "vue";
import type { ImplicitRelationTask, ImplicitRelationVerificationRow } from "@/types";
import { summarizeVerificationRows } from "../utils/implicitRelationVerification";

const props = defineProps<{ visible: boolean; task: ImplicitRelationTask | null; rows: ImplicitRelationVerificationRow[] }>();
defineEmits<{ "update:visible": [value: boolean] }>();
const summary = computed(() => summarizeVerificationRows(props.rows));
</script>
<style scoped lang="scss">
.implicit-verify__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 4px 24px;
  margin: 0 0 10px;
}
.implicit-verify__subject {
  color: var(--aircas-color-text-primary);
  font-size: 13px;
  font-weight: 500;
}
.implicit-verify__count {
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
}
.implicit-verify__table :deep(.el-table__cell) {
  padding: 6px 0;
  font-size: 12px;
}
.implicit-verify__node {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
}
.implicit-verify__node-name {
  overflow: hidden;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.implicit-verify__node-id {
  color: var(--aircas-color-text-secondary);
  font-size: 11px;
}
.implicit-verify__badge {
  display: inline-block;
  padding: 1px 6px;
  border: 1px solid var(--aircas-color-accent-cyan-border);
  border-radius: 3px;
  color: var(--aircas-color-accent-cyan);
  font-size: 11px;
  white-space: nowrap;
}
.implicit-verify__chain {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
}
.implicit-verify__chain-path {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.implicit-verify__chain-meta {
  color: var(--aircas-color-text-secondary);
  font-size: 11px;
}
.implicit-verify__status {
  display: inline-block;
  padding: 1px 8px;
  border: 1px solid currentColor;
  border-radius: 3px;
  font-size: 11px;
}
.implicit-verify__status--saved {
  color: var(--aircas-color-accent-green);
}
.implicit-verify__status--pending {
  color: var(--aircas-color-accent-orange);
}
.implicit-verify__actions {
  display: flex;
  gap: 12px;
}
.implicit-verify__actions :deep(.el-button) {
  margin-left: 0;
  padding: 0;
  font-size: 12px;
}
</style>
