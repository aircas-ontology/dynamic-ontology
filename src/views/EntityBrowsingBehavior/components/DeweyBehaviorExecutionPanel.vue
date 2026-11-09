<template>
  <section class="dewey-behavior-execution" aria-label="执行记录">
    <header class="dewey-behavior-execution__header">
      <el-button type="primary" plain @click="emit('back')">
        <el-icon><ArrowLeft /></el-icon>
        返回实例行为
      </el-button>
      <div>
        <h2>{{ instance.name }} · 执行记录</h2>
        <p>共 {{ statistics.total }} 次 · 成功 {{ statistics.success }} · 失败 {{ statistics.failed }} · 最近 {{ statistics.latestExecution || "—" }}</p>
      </div>
    </header>

    <el-table :data="records" row-key="executionId" height="100%" class="dewey-behavior-execution__table" empty-text="暂无执行记录">
      <el-table-column label="执行 ID" prop="executionId" min-width="180" show-overflow-tooltip />
      <el-table-column label="时间" prop="time" min-width="160" />
      <el-table-column label="触发方式" prop="trigger" min-width="120" />
      <el-table-column label="输入说明" prop="inputDescription" min-width="160" show-overflow-tooltip />
      <el-table-column label="版本" prop="version" width="100" />
      <el-table-column label="耗时(s)" width="90">
        <template #default="{ row }">{{ row.duration ?? "—" }}</template>
      </el-table-column>
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.status === 'success' ? 'success' : row.status === 'failed' ? 'danger' : 'warning'" size="small">
            {{ row.status === "success" ? "成功" : row.status === "failed" ? "失败" : "运行中" }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="输出摘要" prop="detail.outputSummary" min-width="220" show-overflow-tooltip />
    </el-table>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { ArrowLeft } from "@element-plus/icons-vue";
import { createDeweyBehaviorExecutionData } from "@/mocks/entityBrowsingDeweyBehavior/deweyBehaviorExecutionMock";
import type { PowerBehaviorInstance } from "@/types/entityBrowsingDeweyBehavior";

const props = defineProps<{
  instance: PowerBehaviorInstance;
}>();

const emit = defineEmits<{
  back: [];
}>();

const data = computed(() => createDeweyBehaviorExecutionData(props.instance.mountedFunction, props.instance.name));
const statistics = computed(() => data.value.statistics);
const records = computed(() => data.value.records);
</script>

<style scoped lang="scss">
.dewey-behavior-execution {
  display: flex;
  min-width: 0;
  min-height: 0;
  height: 100%;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--aircas-color-border);
  border-radius: 8px;
  background: linear-gradient(135deg, var(--aircas-color-panel-background), var(--aircas-color-panel-background-deep));
}

.dewey-behavior-execution__header {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 16px;
}

.dewey-behavior-execution__header h2 {
  margin: 0;
  color: var(--aircas-color-text-primary);
  font-size: 16px;
  font-weight: 600;
}

.dewey-behavior-execution__header p {
  margin: 4px 0 0;
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
}

.dewey-behavior-execution__table {
  min-height: 0;
  flex: 1;
  width: 100%;
}
</style>
