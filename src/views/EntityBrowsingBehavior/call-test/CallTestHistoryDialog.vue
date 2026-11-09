<template>
  <el-dialog
    :model-value="visible"
    class="call-test-dialog"
    :title="`与历史记录对比（${executionId}）`"
    width="720px"
    append-to-body
    destroy-on-close
    @update:model-value="emit('update:visible', $event)"
  >
    <dl v-if="comparison" class="call-test-history">
      <div>
        <dt>历史置信度</dt>
        <dd>{{ comparison.historicalConfidence }}</dd>
      </div>
      <div>
        <dt>测试置信度</dt>
        <dd class="is-success">{{ comparison.currentConfidence }}</dd>
      </div>
      <div>
        <dt>终点偏差</dt>
        <dd>{{ comparison.endpointDeviation }}</dd>
      </div>
      <div>
        <dt>轨迹差异</dt>
        <dd class="is-success">{{ comparison.trajectoryDifference }}</dd>
      </div>
      <div>
        <dt>平均速度</dt>
        <dd>{{ comparison.averageSpeedComparison }}</dd>
      </div>
      <div>
        <dt>函数版本</dt>
        <dd class="is-success">{{ comparison.versionComparison }}</dd>
      </div>
      <div>
        <dt>输入差异</dt>
        <dd>{{ comparison.inputDifference }}</dd>
      </div>
    </dl>
  </el-dialog>
</template>
<script setup lang="ts">
import type { CallTestHistoryComparison } from "@/types";
defineProps<{ visible: boolean; executionId: string; comparison: CallTestHistoryComparison | null }>();
const emit = defineEmits<{ "update:visible": [value: boolean] }>();
</script>
<style scoped lang="scss">
.call-test-history {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  margin: 0;
  border: 1px solid var(--aircas-color-border-soft);
  div {
    display: grid;
    grid-template-columns: 120px 1fr;
    padding: 12px 14px;
    border-right: 1px solid var(--aircas-color-border-light);
    border-bottom: 1px solid var(--aircas-color-border-light);
    &:nth-child(2n) {
      border-right: 0;
    }
  }
  dt {
    color: var(--aircas-color-text-muted);
  }
  dd {
    margin: 0;
    color: var(--aircas-color-text-secondary);
  }
  .is-success {
    color: var(--aircas-color-success);
  }
}
:global(.call-test-dialog) {
  border: 1px solid var(--aircas-color-border-soft);
  background: var(--aircas-color-panel-background-deep);
}
</style>
