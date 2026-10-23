<template>
  <section class="function-operator-container-runtime-panel" aria-label="运行配置">
    <header class="function-operator-container-runtime-panel__header">
      <strong class="function-operator-container-runtime-panel__title">运行配置</strong>
      <el-button @click="emit('back')">返回</el-button>
    </header>
    <div class="function-operator-container-runtime-panel__body">
      <div v-if="loadStatus === 'loading'" class="function-operator-container-runtime-panel__state">
        <AircasLoading />
      </div>
      <div v-else-if="loadStatus === 'error'" class="function-operator-container-runtime-panel__state function-operator-container-runtime-panel__state--error">
        {{ errorMessage }}
      </div>
      <div v-else-if="loadStatus === 'empty'" class="function-operator-container-runtime-panel__state">暂无容器运行实例</div>
      <el-table
        v-else
        class="aircas-table--accent-header function-operator-container-runtime-panel__table"
        :data="rows"
        row-key="containerKey"
        stripe
        height="100%"
      >
        <el-table-column type="expand">
          <template #default="{ row }">
            <div class="function-operator-container-runtime-panel__expand">
              <section class="function-operator-container-runtime-panel__section" aria-label="容器生命周期">
                <div class="function-operator-container-runtime-panel__section-head">
                  <h3 class="function-operator-container-runtime-panel__section-title">容器生命周期</h3>
                  <div class="function-operator-container-runtime-panel__section-actions">
                    <el-button
                      size="small"
                      :disabled="!canStartRuntime(asRuntimeRow(row)) || isRuntimeActionSubmitting(asRuntimeRow(row).containerKey)"
                      @click="startContainerRuntime(asRuntimeRow(row))"
                    >
                      启动
                    </el-button>
                    <el-button
                      size="small"
                      type="danger"
                      plain
                      :disabled="!canStopRuntime(asRuntimeRow(row)) || isRuntimeActionSubmitting(asRuntimeRow(row).containerKey)"
                      @click="stopContainerRuntime(asRuntimeRow(row))"
                    >
                      停止
                    </el-button>
                    <el-button
                      size="small"
                      :disabled="!canRestartRuntime(asRuntimeRow(row)) || isRuntimeActionSubmitting(asRuntimeRow(row).containerKey)"
                      @click="restartContainerRuntime(asRuntimeRow(row))"
                    >
                      重启
                    </el-button>
                  </div>
                </div>
                <div class="function-operator-container-runtime-panel__lifecycle-grid">
                  <div class="function-operator-container-runtime-panel__lifecycle-item">
                    <span class="function-operator-container-runtime-panel__lifecycle-label">最近操作</span>
                    <span class="function-operator-container-runtime-panel__lifecycle-value">{{ formatRuntimeLastAction(asRuntimeRow(row)) }}</span>
                  </div>
                  <div class="function-operator-container-runtime-panel__lifecycle-item">
                    <span class="function-operator-container-runtime-panel__lifecycle-label">说明</span>
                    <span class="function-operator-container-runtime-panel__lifecycle-value">{{ formatRuntimeDisplayText(asRuntimeRow(row).message) }}</span>
                  </div>
                </div>
              </section>

              <section class="function-operator-container-runtime-panel__section" aria-label="部署信息">
                <div class="function-operator-container-runtime-panel__section-head">
                  <h3 class="function-operator-container-runtime-panel__section-title">部署信息</h3>
                </div>
                <el-table
                  class="aircas-table--accent-header function-operator-container-runtime-panel__deploy-table"
                  :data="[asRuntimeRow(row)]"
                  row-key="containerKey"
                  size="small"
                  border
                >
                  <el-table-column label="容器名" min-width="160" show-overflow-tooltip>
                    <template #default="{ row: deployRow }">{{ formatRuntimeDisplayText(asRuntimeRow(deployRow).containerName) }}</template>
                  </el-table-column>
                  <el-table-column label="宿主机 IP" min-width="140" show-overflow-tooltip>
                    <template #default="{ row: deployRow }">{{ formatRuntimeDisplayText(asRuntimeRow(deployRow).nodeIp) }}</template>
                  </el-table-column>
                  <el-table-column label="宿主机端口" width="110">
                    <template #default="{ row: deployRow }">{{ formatRuntimePort(asRuntimeRow(deployRow).nodePort) }}</template>
                  </el-table-column>
                  <el-table-column label="容器端口" width="100">
                    <template #default="{ row: deployRow }">{{ formatRuntimePort(asRuntimeRow(deployRow).containerPort) }}</template>
                  </el-table-column>
                  <el-table-column label="宿主映射端口" width="120">
                    <template #default="{ row: deployRow }">{{ formatRuntimePort(asRuntimeRow(deployRow).hostPort) }}</template>
                  </el-table-column>
                </el-table>
              </section>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="displayName" label="容器算子名" min-width="240" show-overflow-tooltip />
        <el-table-column prop="phaseLabel" label="运行状态" width="160" />
      </el-table>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { ElMessage } from "element-plus";

import {
  getOntologyFunctionContainerRuntimeListInterface,
  postOntologyFunctionContainerRuntimeRestartInterface,
  postOntologyFunctionContainerRuntimeStartInterface,
  postOntologyFunctionContainerRuntimeStopInterface,
} from "@/apis";
import AircasLoading from "@/components/AircasLoading.vue";
import type { OntologyFunctionContainerRuntimeItem, OntologyFunctionContainerRuntimePhase } from "@/types";

const props = defineProps<{
  active: boolean;
  spaceId: number;
}>();

const emit = defineEmits<{ back: [] }>();

type RuntimeLoadStatus = "idle" | "loading" | "success" | "empty" | "error";

const loadStatus = ref<RuntimeLoadStatus>("idle");
const errorMessage = ref("");
const rows = ref<OntologyFunctionContainerRuntimeItem[]>([]);
const submittingKeys = ref<string[]>([]);
let requestSequence = 0;
let actionSequence = 0;

/**
 * @description 将表格行断言为容器运行实例（规避 el-table DefaultRow）。
 * @param row 表格行。
 * @returns 运行实例。
 */
function asRuntimeRow(row: unknown): OntologyFunctionContainerRuntimeItem {
  return row as OntologyFunctionContainerRuntimeItem;
}

/**
 * @description 空文案统一显示为破折号。
 * @param value 原始字符串。
 * @returns 展示文案。
 */
function formatRuntimeDisplayText(value: string | null | undefined): string {
  const text = typeof value === "string" ? value.trim() : "";
  return text || "—";
}

/**
 * @description 端口展示；非法或缺省显示破折号。
 * @param value 端口值。
 * @returns 展示文案。
 */
function formatRuntimePort(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return "—";
  }
  return String(value);
}

/**
 * @description 将最近操作时间格式化为 `YYYY-MM-DD HH:mm:ss`；非法值回落原文或空串。
 * @param value 接口 ISO 时间字符串。
 * @returns 展示时间。
 */
function formatRuntimeActionAt(value: string): string {
  const raw = value.trim();
  if (!raw) {
    return "";
  }
  const matched = /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2}:\d{2})/.exec(raw);
  if (matched) {
    return `${matched[1]} ${matched[2]}`;
  }
  return raw;
}

/**
 * @description 组装最近操作展示（操作名 + 可选时间）。
 * @param row 运行实例。
 * @returns 展示文案。
 */
function formatRuntimeLastAction(row: OntologyFunctionContainerRuntimeItem): string {
  const action = typeof row.lastAction === "string" ? row.lastAction.trim() : "";
  const actionAtRaw = typeof row.lastActionAt === "string" ? row.lastActionAt.trim() : "";
  const actionAt = actionAtRaw ? formatRuntimeActionAt(actionAtRaw) : "";
  if (!action && !actionAt) {
    return "—";
  }
  if (action && actionAt) {
    return `${action} · ${actionAt}`;
  }
  return action || actionAt;
}

/**
 * @description 判断当前 phase 是否允许启动。
 * @param row 运行实例行。
 * @returns 允许启动时 true。
 */
function canStartRuntime(row: OntologyFunctionContainerRuntimeItem): boolean {
  const phase: OntologyFunctionContainerRuntimePhase = row.phase;
  return phase === "CREATED" || phase === "STOPPED" || phase === "FAILED";
}

/**
 * @description 判断当前 phase 是否允许停止。
 * @param row 运行实例行。
 * @returns 允许停止时 true。
 */
function canStopRuntime(row: OntologyFunctionContainerRuntimeItem): boolean {
  return row.phase === "RUNNING";
}

/**
 * @description 判断当前 phase 是否允许重启（与停止相同，仅 RUNNING）。
 * @param row 运行实例行。
 * @returns 允许重启时 true。
 */
function canRestartRuntime(row: OntologyFunctionContainerRuntimeItem): boolean {
  return row.phase === "RUNNING";
}

/**
 * @description 判断指定容器是否正在执行启停命令。
 * @param containerKey 容器实例归组键。
 * @returns 提交中时 true。
 */
function isRuntimeActionSubmitting(containerKey: string): boolean {
  return submittingKeys.value.includes(containerKey);
}

/**
 * @description 标记容器进入或离开提交中状态。
 * @param containerKey 容器实例归组键。
 * @param submitting 是否提交中。
 */
function setRuntimeActionSubmitting(containerKey: string, submitting: boolean): void {
  if (submitting) {
    if (!submittingKeys.value.includes(containerKey)) {
      submittingKeys.value = [...submittingKeys.value, containerKey];
    }
    return;
  }
  submittingKeys.value = submittingKeys.value.filter((key) => key !== containerKey);
}

/**
 * @description 用接口返回的实例更新表格对应行；无有效 data 时重新拉取列表。
 * @param nextItem 更新后的实例；可为空。
 */
function applyRuntimeItemOrReload(nextItem: OntologyFunctionContainerRuntimeItem | null | undefined): void {
  if (nextItem && typeof nextItem.containerKey === "string" && nextItem.containerKey.trim()) {
    const index = rows.value.findIndex((item) => item.containerKey === nextItem.containerKey);
    if (index >= 0) {
      const nextRows = [...rows.value];
      nextRows[index] = nextItem;
      rows.value = nextRows;
      return;
    }
  }
  void loadContainerRuntimeList();
}

/**
 * @description 按当前空间拉取容器运行实例列表，忽略过期响应。
 */
async function loadContainerRuntimeList(): Promise<void> {
  const currentSequence = ++requestSequence;
  if (!Number.isFinite(props.spaceId) || props.spaceId <= 0) {
    loadStatus.value = "error";
    errorMessage.value = "无效的空间标识，无法加载运行配置";
    rows.value = [];
    return;
  }

  loadStatus.value = "loading";
  errorMessage.value = "";
  try {
    const response = await getOntologyFunctionContainerRuntimeListInterface({ spaceId: props.spaceId });
    if (currentSequence !== requestSequence) return;
    if (response.code !== 200) {
      loadStatus.value = "error";
      errorMessage.value = response.message || "容器运行实例加载失败";
      rows.value = [];
      return;
    }
    const data = Array.isArray(response.data) ? response.data : [];
    rows.value = data;
    loadStatus.value = data.length ? "success" : "empty";
  } catch (cause) {
    if (currentSequence !== requestSequence) return;
    loadStatus.value = "error";
    errorMessage.value = cause instanceof Error ? cause.message : "容器运行实例加载失败";
    rows.value = [];
  }
}

/**
 * @description 启动指定容器运行实例。
 * @param row 运行实例行。
 */
async function startContainerRuntime(row: OntologyFunctionContainerRuntimeItem): Promise<void> {
  if (!canStartRuntime(row) || isRuntimeActionSubmitting(row.containerKey)) {
    return;
  }
  const currentAction = ++actionSequence;
  setRuntimeActionSubmitting(row.containerKey, true);
  try {
    const response = await postOntologyFunctionContainerRuntimeStartInterface({ containerKey: row.containerKey });
    if (currentAction !== actionSequence || !props.active) {
      return;
    }
    if (response.code !== 200) {
      ElMessage.error(response.message || "启动失败");
      return;
    }
    applyRuntimeItemOrReload(response.data);
    ElMessage.success(response.message?.trim() || "启动成功");
  } catch (cause) {
    if (currentAction === actionSequence && props.active) {
      ElMessage.error(cause instanceof Error && cause.message.trim() ? cause.message : "启动失败");
    }
  } finally {
    if (currentAction === actionSequence) {
      setRuntimeActionSubmitting(row.containerKey, false);
    }
  }
}

/**
 * @description 停止指定容器运行实例。
 * @param row 运行实例行。
 */
async function stopContainerRuntime(row: OntologyFunctionContainerRuntimeItem): Promise<void> {
  if (!canStopRuntime(row) || isRuntimeActionSubmitting(row.containerKey)) {
    return;
  }
  const currentAction = ++actionSequence;
  setRuntimeActionSubmitting(row.containerKey, true);
  try {
    const response = await postOntologyFunctionContainerRuntimeStopInterface({ containerKey: row.containerKey });
    if (currentAction !== actionSequence || !props.active) {
      return;
    }
    if (response.code !== 200) {
      ElMessage.error(response.message || "停止失败");
      return;
    }
    applyRuntimeItemOrReload(response.data);
    ElMessage.success(response.message?.trim() || "停止成功");
  } catch (cause) {
    if (currentAction === actionSequence && props.active) {
      ElMessage.error(cause instanceof Error && cause.message.trim() ? cause.message : "停止失败");
    }
  } finally {
    if (currentAction === actionSequence) {
      setRuntimeActionSubmitting(row.containerKey, false);
    }
  }
}

/**
 * @description 重启指定容器运行实例（先停后启）。
 * @param row 运行实例行。
 */
async function restartContainerRuntime(row: OntologyFunctionContainerRuntimeItem): Promise<void> {
  if (!canRestartRuntime(row) || isRuntimeActionSubmitting(row.containerKey)) {
    return;
  }
  const currentAction = ++actionSequence;
  setRuntimeActionSubmitting(row.containerKey, true);
  try {
    const response = await postOntologyFunctionContainerRuntimeRestartInterface({ containerKey: row.containerKey });
    if (currentAction !== actionSequence || !props.active) {
      return;
    }
    if (response.code !== 200) {
      ElMessage.error(response.message || "重启失败");
      return;
    }
    applyRuntimeItemOrReload(response.data);
    ElMessage.success(response.message?.trim() || "重启成功");
  } catch (cause) {
    if (currentAction === actionSequence && props.active) {
      ElMessage.error(cause instanceof Error && cause.message.trim() ? cause.message : "重启失败");
    }
  } finally {
    if (currentAction === actionSequence) {
      setRuntimeActionSubmitting(row.containerKey, false);
    }
  }
}

watch(
  () => props.active,
  (active) => {
    if (!active) {
      requestSequence += 1;
      actionSequence += 1;
      loadStatus.value = "idle";
      errorMessage.value = "";
      rows.value = [];
      submittingKeys.value = [];
      return;
    }
    void loadContainerRuntimeList();
  },
  { immediate: true },
);
</script>

<style scoped lang="scss">
.function-operator-container-runtime-panel {
  display: flex;
  min-width: 0;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  overflow: hidden;
}

.function-operator-container-runtime-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex: none;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--aircas-color-border);
}

.function-operator-container-runtime-panel__title {
  color: var(--aircas-color-text-primary);
  font-size: 16px;
}

.function-operator-container-runtime-panel__body {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  padding-top: 12px;
  overflow: hidden;
}

.function-operator-container-runtime-panel__state {
  display: grid;
  flex: 1;
  place-items: center;
  color: var(--aircas-color-text-secondary);
  font-size: 13px;
}

.function-operator-container-runtime-panel__state--error {
  color: var(--aircas-color-danger);
}

.function-operator-container-runtime-panel__table {
  flex: 1;
  min-height: 0;
}

.function-operator-container-runtime-panel__expand {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 8px 12px 16px 48px;
}

.function-operator-container-runtime-panel__section {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}

.function-operator-container-runtime-panel__section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.function-operator-container-runtime-panel__section-title {
  margin: 0;
  color: var(--aircas-color-text-primary);
  font-size: 14px;
  font-weight: 600;
}

.function-operator-container-runtime-panel__section-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.function-operator-container-runtime-panel__lifecycle-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 24px;
}

.function-operator-container-runtime-panel__lifecycle-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.function-operator-container-runtime-panel__lifecycle-label {
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
}

.function-operator-container-runtime-panel__lifecycle-value {
  color: var(--aircas-color-text-primary);
  font-size: 13px;
  word-break: break-word;
}

.function-operator-container-runtime-panel__deploy-table {
  width: 100%;
}

@media (max-width: 720px) {
  .function-operator-container-runtime-panel__lifecycle-grid {
    grid-template-columns: 1fr;
  }
}
</style>
