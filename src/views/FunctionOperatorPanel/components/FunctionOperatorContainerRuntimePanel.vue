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
        <el-table-column prop="displayName" label="容器算子名" min-width="240" show-overflow-tooltip />
        <el-table-column prop="phaseLabel" label="运行状态" width="160" />
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button
              link
              type="primary"
              :disabled="!canStartRuntime(asRuntimeRow(row)) || isRuntimeActionSubmitting(asRuntimeRow(row).containerKey)"
              @click.stop="startContainerRuntime(asRuntimeRow(row))"
            >
              启动
            </el-button>
            <el-button
              link
              type="danger"
              :disabled="!canStopRuntime(asRuntimeRow(row)) || isRuntimeActionSubmitting(asRuntimeRow(row).containerKey)"
              @click.stop="stopContainerRuntime(asRuntimeRow(row))"
            >
              停止
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { ElMessage } from "element-plus";

import {
  getOntologyFunctionContainerRuntimeListInterface,
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
</style>
