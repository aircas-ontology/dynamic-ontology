<template>
  <el-dialog
    :model-value="visible"
    class="call-test-dialog"
    title="调用日志（沙箱测试，不写回实例）"
    width="1050px"
    append-to-body
    destroy-on-close
    @update:model-value="emit('update:visible', $event)"
  >
    <el-table :data="tableData" height="540" stripe>
      <el-table-column prop="timestamp" label="时间" width="190" />
      <el-table-column label="级别" width="90"
        ><template #default="scope"
          ><el-tag :type="tagType(scope.row.level)" size="small">{{ scope.row.level }}</el-tag></template
        ></el-table-column
      >
      <el-table-column prop="step" label="阶段" width="100" />
      <el-table-column prop="message" label="详细消息" min-width="270" />
      <el-table-column prop="errorCode" label="错误码" min-width="150"
        ><template #default="scope">{{ scope.row.errorCode ?? "--" }}</template></el-table-column
      >
      <el-table-column label="上下文" min-width="220"
        ><template #default="scope"
          ><code>{{ scope.row.context ? JSON.stringify(scope.row.context) : "--" }}</code></template
        ></el-table-column
      >
    </el-table>
  </el-dialog>
</template>
<script setup lang="ts">
import { computed } from "vue";
import type { CallTestLogEntry, CallTestLogLevel } from "@/types";
const props = defineProps<{ visible: boolean; logs: readonly CallTestLogEntry[] }>();
const emit = defineEmits<{ "update:visible": [value: boolean] }>();
const tableData = computed(() => [...props.logs]);
const tagType = (level: CallTestLogLevel): "success" | "warning" | "danger" | "info" => {
  if (level === "SUCCESS") return "success";
  if (level === "WARNING") return "warning";
  if (level === "ERROR") return "danger";
  return "info";
};
</script>
<style scoped lang="scss">
code {
  color: var(--aircas-color-accent-cyan);
  white-space: normal;
  word-break: break-all;
}
:global(.call-test-dialog) {
  border: 1px solid var(--aircas-color-border-soft);
  background: var(--aircas-color-panel-background-deep);
}
</style>
