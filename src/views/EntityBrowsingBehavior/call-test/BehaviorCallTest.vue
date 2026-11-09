<template>
  <section class="behavior-call-test">
    <header class="behavior-call-test__header">
      <el-button class="behavior-call-test__back" title="返回实例行为" @click="emit('back')"
        ><i class="fa fa-angle-left" aria-hidden="true"></i>返回实例行为</el-button
      >
      <span class="behavior-call-test__icon-wrap" aria-hidden="true"><span class="behavior-call-test__icon" :style="iconStyle(instance.icon)"></span></span>
      <div class="behavior-call-test__heading">
        <h3>{{ instance.name }}</h3>
        <p>{{ instance.type }} · {{ instance.mountedFunction }}</p>
      </div>
    </header>

    <div v-if="isTrajectoryPrediction" class="behavior-call-test__workspace">
      <CallTestInputPanel
        :profile="profile"
        :input="input"
        :source="source"
        :write-back="writeBack"
        :input-json="inputJson"
        :disabled="isBusy"
        :checking="checking"
        :running="status === 'running'"
        :service-healthy="serviceHealthy"
        @update:input="input = $event"
        @update:source="changeSource"
        @update:write-back="writeBack = $event"
        @reset="resetParameters"
        @check-service="checkService"
        @execute="executeTest"
      />
      <CallTestResultPanel
        :status="status"
        :steps="steps"
        :summary="summary"
        :trajectory="trajectory"
        :input="input"
        :metrics="metrics"
        :logs="logs"
        :failure="failure"
        @show-output="outputVisible = true"
        @show-history="historyVisible = true"
        @show-logs="logsVisible = true"
        @export="exportResult"
      />
    </div>
    <div v-else class="behavior-call-test__empty"><el-empty description="该行为暂未配置调用测试" /></div>

    <CallTestOutputDialog v-model:visible="outputVisible" :trajectory="trajectory" />
    <CallTestHistoryDialog v-model:visible="historyVisible" :execution-id="historyBaseline.executionId" :comparison="historyComparison" />
    <CallTestLogDialog v-model:visible="logsVisible" :logs="logs" />
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from "vue";
import type { CSSProperties } from "vue";
import { ElMessage } from "element-plus";
import CallTestHistoryDialog from "./CallTestHistoryDialog.vue";
import CallTestInputPanel from "./CallTestInputPanel.vue";
import CallTestLogDialog from "./CallTestLogDialog.vue";
import CallTestOutputDialog from "./CallTestOutputDialog.vue";
import CallTestResultPanel from "./CallTestResultPanel.vue";
import { useCallTestExecution } from "./useCallTestExecution";
import {
  CALL_TEST_FUNCTION_PROFILE,
  CALL_TEST_HISTORY_BASELINE,
  buildCallTestInputJson,
  cloneCallTestInput,
  createHistoryComparison,
  createServiceCheckResult,
} from "@/mocks/entityBrowsingDeweyBehavior/deweyCallTestMock";
import type { PowerBehaviorInstance } from "@/types/entityBrowsingDeweyBehavior";
import type { CallTestFunctionProfile, CallTestHistoryComparison, CallTestInput, CallTestInputSource } from "@/types/entityBrowsingDeweyCallTest";

const props = defineProps<{ instance: PowerBehaviorInstance }>();
const emit = defineEmits<{ back: [] }>();
const source = ref<CallTestInputSource>("current");
const input = ref<CallTestInput>(cloneCallTestInput("current"));
const writeBack = ref(false);
const profile = ref<CallTestFunctionProfile>({ ...CALL_TEST_FUNCTION_PROFILE });
const checking = ref(false);
const outputVisible = ref(false);
const historyVisible = ref(false);
const logsVisible = ref(false);
const historyBaseline = CALL_TEST_HISTORY_BASELINE;
let serviceTimer: ReturnType<typeof setTimeout> | null = null;

const { status, steps, summary, trajectory, metrics, logs, failure, execute, reset } = useCallTestExecution();
const isTrajectoryPrediction = computed(() => props.instance.mountedFunction === CALL_TEST_FUNCTION_PROFILE.mountedFunction);
const serviceHealthy = computed(() => profile.value.serviceStatus === "在线" && profile.value.healthStatus === "正常");
const isBusy = computed(() => checking.value || status.value === "running");
const inputJson = computed(() => JSON.stringify(buildCallTestInputJson(input.value, source.value, writeBack.value), null, 2));
const historyComparison = computed<CallTestHistoryComparison | null>(() =>
  metrics.value ? createHistoryComparison(trajectory.value, metrics.value, source.value) : null,
);
const iconStyle = (icon: string): CSSProperties => ({ maskImage: `url(${icon})`, WebkitMaskImage: `url(${icon})` });

const changeSource = (value: CallTestInputSource): void => {
  source.value = value;
  input.value = cloneCallTestInput(value);
  reset();
};

const resetParameters = (): void => {
  input.value = cloneCallTestInput(source.value);
  writeBack.value = false;
  reset();
  ElMessage({ type: "info", message: "已恢复当前输入来源的默认参数" });
};

const checkService = (): void => {
  checking.value = true;
  serviceTimer = setTimeout(() => {
    const result = createServiceCheckResult();
    profile.value = { ...profile.value, serviceStatus: result.serviceStatus, healthStatus: result.healthStatus };
    checking.value = false;
    serviceTimer = null;
    ElMessage({ type: result.success ? "success" : "error", message: `${result.message}${result.errorCode ? `（${result.errorCode}）` : ""}` });
  }, 650);
};

const executeTest = async (): Promise<void> => {
  const succeeded = await execute({ ...input.value }, source.value, writeBack.value, serviceHealthy.value);
  ElMessage({ type: succeeded ? "success" : "error", message: succeeded ? "调用测试执行成功" : (failure.value?.summary ?? "调用测试执行失败") });
};

const escapeCsvCell = (value: string | number): string => `"${String(value).replaceAll('"', '""')}"`;
const exportResult = (): void => {
  if (status.value !== "success" || !summary.value || trajectory.value.length === 0) return;
  const header = ["序号", "时间", "经度", "纬度", "速度（节）", "航向（°）", "误差半径（海里）"];
  const rows = trajectory.value.map((point) => [
    point.index,
    point.displayTime,
    point.longitude,
    point.latitude,
    point.speedKnots,
    point.heading,
    point.errorRadiusNm,
  ]);
  const csv = `\uFEFF${[header, ...rows].map((row) => row.map(escapeCsvCell).join(",")).join("\r\n")}`;
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `杜威号-轨迹预测-${summary.value.testId}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

onBeforeUnmount(() => {
  if (serviceTimer) clearTimeout(serviceTimer);
});
</script>

<style scoped lang="scss">
.behavior-call-test {
  display: grid;
  min-width: 0;
  min-height: 0;
  height: 100%;
  grid-template-rows: 56px minmax(0, 1fr);
  overflow: hidden;
  border: 1px solid var(--aircas-color-border-soft);
  border-radius: 6px;
  background: var(--aircas-color-page-background);
}
.behavior-call-test__header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 12px;
  border-bottom: 1px solid var(--aircas-color-divider);
  background: var(--aircas-color-section-header);
}
.behavior-call-test__back {
  height: 28px;
  padding: 0 10px;
  border-color: var(--aircas-color-border-highlight);
  color: var(--aircas-color-accent-cyan);
  background: var(--aircas-color-blue-soft);
}
.behavior-call-test__icon-wrap {
  display: grid;
  width: 38px;
  height: 38px;
  flex: 0 0 auto;
  place-items: center;
  border: 1px solid var(--aircas-color-cyan-border);
  border-radius: 50%;
  color: var(--aircas-color-accent-cyan);
  background: var(--aircas-color-cyan-soft);
}
.behavior-call-test__icon {
  width: 22px;
  height: 22px;
  background: currentColor;
  mask-position: center;
  mask-repeat: no-repeat;
  mask-size: contain;
}
.behavior-call-test__heading {
  min-width: 0;
  h3,
  p {
    margin: 0;
  }
  h3 {
    color: var(--aircas-color-text-primary);
    font-size: 16px;
  }
  p {
    margin-top: 2px;
    color: var(--aircas-color-text-muted);
    font-size: 12px;
  }
}
.behavior-call-test__workspace {
  display: grid;
  min-width: 0;
  min-height: 0;
  grid-template-columns: minmax(480px, 35fr) minmax(0, 65fr);
  gap: 8px;
  padding: 8px;
  overflow: hidden;
}
.behavior-call-test__empty {
  display: grid;
  min-height: 0;
  place-items: center;
}
@media (max-width: 1600px) {
  .behavior-call-test__workspace {
    grid-template-columns: minmax(420px, 38fr) minmax(0, 62fr);
  }
}
</style>
