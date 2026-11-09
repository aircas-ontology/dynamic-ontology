<template>
  <section class="call-test-result">
    <header class="call-test-result__title"><h3>测试结果</h3></header>
    <ol class="call-test-result__steps">
      <li v-for="step in steps" :key="step.id" :class="`is-${step.status}`">
        <span class="call-test-result__step-node"><i v-if="step.status === 'success'" class="fa fa-check" aria-hidden="true"></i><template v-else>{{ step.index }}</template></span>
        <strong>{{ step.name }}</strong>
        <i v-if="step.index < steps.length" class="fa fa-long-arrow-right call-test-result__arrow" aria-hidden="true"></i>
      </li>
    </ol>
    <section class="call-test-result__summary" :class="`is-${status}`">
      <div class="call-test-result__summary-title"><i class="fa" :class="statusIcon" aria-hidden="true"></i><strong>{{ statusLabel }}</strong><span v-if="failure">{{ failure.summary }}</span></div>
      <dl>
        <div><dt>测试编号</dt><dd>{{ summary?.testId ?? "--" }}</dd></div>
        <div><dt>开始时间</dt><dd>{{ formatTime(summary?.startedAt) }}</dd></div>
        <div><dt>执行耗时</dt><dd>{{ summary?.durationSeconds !== undefined ? `${summary.durationSeconds.toFixed(2)}秒` : "--" }}</dd></div>
        <div><dt>输出类型</dt><dd>{{ status === "success" ? summary?.outputType : "--" }}</dd></div>
        <div><dt>输出点数</dt><dd>{{ summary?.outputPointCount ?? "--" }}</dd></div>
        <div><dt>置信度</dt><dd>{{ summary?.confidence?.toFixed(2) ?? "--" }}</dd></div>
        <div><dt>写回状态</dt><dd>{{ summary?.writeBackStatus ?? "--" }}</dd></div>
      </dl>
    </section>
    <section class="call-test-result__map-panel">
      <h4>自适应测试结果 <small>（轨迹预测 · GIS轨迹）</small></h4>
      <CallTestTrajectoryMap :status="status" :trajectory="trajectory" :input="input" />
    </section>
    <dl class="call-test-result__metrics">
      <div><dt>预测终点</dt><dd>{{ metrics?.endGrid ?? "--" }}</dd></div>
      <div><dt>预测航向</dt><dd>{{ metrics?.predictedHeading ?? "--" }}</dd></div>
      <div><dt>平均速度</dt><dd>{{ metrics?.averageSpeed ?? "--" }}</dd></div>
      <div><dt>置信度</dt><dd>{{ metrics ? metrics.confidence.toFixed(2) : "--" }}</dd></div>
      <div><dt>风险区交叠</dt><dd>{{ metrics?.riskOverlap ?? "--" }}</dd></div>
    </dl>
    <footer class="call-test-result__actions">
      <el-button :disabled="status !== 'success'" @click="emit('showOutput')"><i class="fa fa-code" aria-hidden="true"></i>查看完整输出</el-button>
      <el-button :disabled="status !== 'success'" @click="emit('showHistory')"><i class="fa fa-clone" aria-hidden="true"></i>对比历史结果</el-button>
      <el-button :disabled="logs.length === 0" @click="emit('showLogs')"><i class="fa fa-file-text-o" aria-hidden="true"></i>查看调用日志</el-button>
      <el-button :disabled="status !== 'success'" @click="emit('export')"><i class="fa fa-download" aria-hidden="true"></i>导出测试结果</el-button>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import CallTestTrajectoryMap from "./CallTestTrajectoryMap.vue";
import type { CallTestFailureScenario, CallTestInput, CallTestLogEntry, CallTestMetrics, CallTestRunStatus, CallTestStep, CallTestSummary, CallTestTrajectoryPoint } from "@/types/entityBrowsingDeweyCallTest";

const props = defineProps<{ status: CallTestRunStatus; steps: readonly CallTestStep[]; summary: CallTestSummary | null; trajectory: readonly CallTestTrajectoryPoint[]; input: CallTestInput; metrics: CallTestMetrics | null; logs: readonly CallTestLogEntry[]; failure: CallTestFailureScenario | null }>();
const emit = defineEmits<{ showOutput: []; showHistory: []; showLogs: []; export: [] }>();
const statusLabel = computed(() => ({ idle: "测试未开始", running: "测试执行中", success: "测试执行成功", failed: "测试执行失败" })[props.status]);
const statusIcon = computed(() => ({ idle: "fa-clock-o", running: "fa-spinner fa-spin", success: "fa-check-circle-o", failed: "fa-times-circle-o" })[props.status]);
const formatTime = (value?: string): string => value ? value.replace("T", " ").slice(0, 19) : "--";
</script>

<style scoped lang="scss">
.call-test-result { display: grid; min-width: 0; min-height: 0; height: 100%; grid-template-rows: auto auto auto minmax(260px, 1fr) auto auto; gap: 7px; padding: 8px; border: 1px solid var(--aircas-color-border-soft); border-radius: 6px; background: var(--aircas-color-panel-overlay-deep); overflow: hidden; }
.call-test-result__title { h3 { margin: 0; color: var(--aircas-color-text-primary); font-size: 17px; } }
.call-test-result__steps { display: grid; grid-template-columns: repeat(4, 1fr); margin: 0; padding: 8px 12px; border: 1px solid var(--aircas-color-border-soft); border-radius: 5px; background: var(--aircas-color-section-background); list-style: none; li { position: relative; display: flex; align-items: center; gap: 8px; min-width: 0; color: var(--aircas-color-neutral); } strong { font-size: 13px; white-space: nowrap; } .is-running { color: var(--aircas-color-accent-cyan); } .is-success { color: var(--aircas-color-success); } .is-failed { color: var(--aircas-color-warning); } }
.call-test-result__step-node { display: grid; width: 25px; height: 25px; flex: 0 0 auto; place-items: center; border: 1px solid currentColor; border-radius: 50%; }
.call-test-result__arrow { margin-left: auto; margin-right: 8px; color: var(--aircas-color-border-highlight); }
.call-test-result__summary { padding: 8px 11px; border: 1px solid var(--aircas-color-border-soft); border-radius: 5px; background: var(--aircas-color-section-background); &.is-success { border-color: var(--aircas-color-green-border); } &.is-failed { border-color: var(--aircas-color-orange-border); } dl { display: flex; flex-wrap: wrap; gap: 6px 18px; margin: 6px 0 0; } dl div { display: flex; gap: 6px; } dt { color: var(--aircas-color-text-muted); } dd { margin: 0; color: var(--aircas-color-text-secondary); } }
.call-test-result__summary-title { display: flex; align-items: center; gap: 8px; color: var(--aircas-color-neutral); .is-running & { color: var(--aircas-color-accent-cyan); } .is-success & { color: var(--aircas-color-success); } .is-failed & { color: var(--aircas-color-warning); } span { color: var(--aircas-color-text-secondary); font-size: 12px; } }
.call-test-result__map-panel { display: grid; min-height: 0; grid-template-rows: auto minmax(0, 1fr); gap: 6px; h4 { margin: 0; color: var(--aircas-color-text-primary); font-size: 14px; } small { color: var(--aircas-color-text-muted); font-weight: 400; } }
.call-test-result__metrics { display: grid; grid-template-columns: repeat(5, 1fr); margin: 0; padding: 7px 0; border: 1px solid var(--aircas-color-border-soft); border-radius: 5px; background: var(--aircas-color-section-background); div { text-align: center; border-right: 1px solid var(--aircas-color-divider); &:last-child { border-right: 0; } } dt { color: var(--aircas-color-text-muted); font-size: 12px; } dd { margin: 3px 0 0; color: var(--aircas-color-success); font-size: 14px; font-weight: 600; } }
.call-test-result__actions { display: grid; grid-template-columns: repeat(4, 1fr); gap: 7px; .el-button { margin: 0; } i { margin-right: 6px; } }
</style>
