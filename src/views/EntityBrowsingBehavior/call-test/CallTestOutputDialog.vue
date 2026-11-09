<template>
  <el-dialog
    :model-value="visible"
    class="call-test-dialog"
    title="完整测试输出"
    width="980px"
    append-to-body
    destroy-on-close
    @update:model-value="emit('update:visible', $event)"
  >
    <el-table :data="tableData" height="520" stripe>
      <el-table-column prop="index" label="序号" width="70" />
      <el-table-column prop="displayTime" label="时间" min-width="175" />
      <el-table-column prop="longitude" label="经度" min-width="110" />
      <el-table-column prop="latitude" label="纬度" min-width="110" />
      <el-table-column prop="speedKnots" label="速度（节）" min-width="110" />
      <el-table-column prop="heading" label="航向（°）" min-width="100" />
      <el-table-column prop="errorRadiusNm" label="误差半径（海里）" min-width="150" />
    </el-table>
  </el-dialog>
</template>
<script setup lang="ts">
import { computed } from "vue";
import type { CallTestTrajectoryPoint } from "@/types";
const props = defineProps<{ visible: boolean; trajectory: readonly CallTestTrajectoryPoint[] }>();
const emit = defineEmits<{ "update:visible": [value: boolean] }>();
const tableData = computed(() => [...props.trajectory]);
</script>
<style scoped lang="scss">
:global(.call-test-dialog) {
  border: 1px solid var(--aircas-color-border-soft);
  background: var(--aircas-color-panel-background-deep);
}
:global(.call-test-dialog .el-dialog__header) {
  margin: 0;
  padding: 14px 18px;
  border-bottom: 1px solid var(--aircas-color-border-light);
}
:global(.call-test-dialog .el-dialog__title) {
  color: var(--aircas-color-text-primary);
}
:global(.call-test-dialog .el-dialog__body) {
  padding: 14px 18px 18px;
}
</style>
