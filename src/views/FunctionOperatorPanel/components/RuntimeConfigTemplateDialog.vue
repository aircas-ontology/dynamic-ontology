<template>
  <el-dialog
    :model-value="modelValue"
    title="运行配置模板"
    width="min(1200px, 94vw)"
    :show-close="!state.submitting"
    :close-on-click-modal="!state.submitting"
    :close-on-press-escape="!state.submitting"
    @update:model-value="closeDialog"
  >
    <div class="runtime-template__toolbar">
      <el-button type="primary" :disabled="state.editing || state.loading || state.submitting || !!state.queryError" @click="state.beginCreate()"
        >新增模板</el-button
      >
    </div>
    <el-table :data="rows" row-key="id" v-loading="state.submitting || state.loading" :empty-text="state.queryError ? '查询失败，请重试' : '暂无运行配置模板'">
      <el-table-column label="模板名称" min-width="180"
        ><template #default="{ row }"
          ><el-input v-if="isEditing(row.id)" v-model="state.draft.name" maxlength="80" placeholder="模板名称" /><span v-else>{{ row.name }}</span></template
        ></el-table-column
      >
      <el-table-column v-for="field in fields" :key="field.key" :label="field.label" min-width="150"
        ><template #default="{ row }"
          ><el-input-number
            v-if="isEditing(row.id)"
            :model-value="state.draft[field.key]"
            @update:model-value="state.draft[field.key] = $event ?? Number.NaN"
            :min="field.min"
            :max="2147483647"
            :precision="0"
            controls-position="right"
            class="runtime-template__number"
          /><span v-else>{{ row[field.key] }}</span></template
        ></el-table-column
      >
      <el-table-column label="状态" width="110" fixed="right">
        <template #default="{ row }">
          <el-switch
            v-if="isEditing(row.id)"
            :model-value="state.draft.enabled"
            @update:model-value="state.draft.enabled = $event === true"
            inline-prompt
            active-text="启用"
            inactive-text="停用"
            ariaLabel="模板启用状态"
          />
          <el-switch
            v-else
            :model-value="row.enabled"
            :disabled="state.editing || state.loading || state.submitting || !!state.queryError"
            inline-prompt
            active-text="启用"
            inactive-text="停用"
            ariaLabel="模板启用状态"
            @update:model-value="changeTemplateEnabled(row.id, $event === true)"
          />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150" fixed="right"
        ><template #default="{ row }"
          ><template v-if="isEditing(row.id)"
            ><el-button link type="primary" :loading="state.submitting" @click="commitTemplate">保存</el-button
            ><el-button link :disabled="state.submitting" @click="state.cancelEdit()">取消</el-button></template
          ><template v-else
            ><el-button
              link
              type="primary"
              :disabled="state.editing || state.loading || state.submitting || !!state.queryError"
              @click="state.beginEdit(row.id)"
              >编辑</el-button
            ><el-button link type="danger" :disabled="state.editing || state.loading || state.submitting || !!state.queryError" @click="deleteTemplate(row.id)"
              >删除</el-button
            ></template
          ></template
        ></el-table-column
      >
    </el-table>
    <p v-if="state.queryError" role="alert" class="runtime-template__error">
      {{ state.queryError }}<el-button link type="primary" :disabled="state.loading" @click="queryTemplates">重新查询</el-button>
    </p>
    <p v-if="error" role="alert" class="runtime-template__error">{{ error }}</p>
  </el-dialog>
</template>
<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, watch } from "vue";
import {
  deleteFunctionRateLimitTemplateInterface,
  getListFunctionRateLimitTemplateInterface,
  postCreateFunctionRateLimitTemplateInterface,
  putDisableFunctionRateLimitTemplateInterface,
  putEnableFunctionRateLimitTemplateInterface,
  putUpdateFunctionRateLimitTemplateInterface,
} from "@/apis";
import { ElMessage, ElMessageBox, vLoading } from "element-plus";
import { createRuntimeTemplateState } from "../utils/runtimeTemplateState";
const props = defineProps<{ modelValue: boolean }>();
const emit = defineEmits<{ "update:modelValue": [value: boolean] }>();
const state = reactive(createRuntimeTemplateState());
const error = ref("");
/** @description 查询全部运行配置模板，错误由列表状态展示。 */
async function queryTemplates(): Promise<void> {
  try {
    await state.queryRemoteTemplates(getListFunctionRateLimitTemplateInterface);
  } catch {
    /* 列表显示错误与重试入口。 */
  }
}
watch(
  () => props.modelValue,
  (visible) => {
    state.invalidateQuery();
    if (visible) {
      state.cancelEdit();
      error.value = "";
      state.records = [];
      void queryTemplates();
    }
  },
  { immediate: true },
);
onBeforeUnmount(() => state.invalidateQuery());
const fields: { key: "timeout" | "retries" | "retryInterval" | "tps" | "concurrency"; label: string; min: number }[] = [
  { key: "timeout", label: "超时（毫秒）", min: 1 },
  { key: "retries", label: "重试次数", min: 0 },
  { key: "retryInterval", label: "重试间隔（毫秒）", min: 0 },
  { key: "tps", label: "TPS 限流", min: 0 },
  { key: "concurrency", label: "最大并发", min: 1 },
];
const rows = computed(() => (state.editing && state.draft.id === 0 ? [...state.records, state.draft] : state.records));
/** @description 判断当前行是否显示草稿。 @param id 行标识。 @returns 是否编辑中。 */
function isEditing(id: number): boolean {
  return state.editing && state.draft.id === id;
}
/** @description 保存校验后的配置模板。 */
async function commitTemplate(): Promise<void> {
  if (state.submitting || state.loading || !state.editing) return;
  try {
    await state.saveRemoteTemplate(
      postCreateFunctionRateLimitTemplateInterface,
      putUpdateFunctionRateLimitTemplateInterface,
      getListFunctionRateLimitTemplateInterface,
    );
    error.value = "";
    ElMessage.success("模板已保存");
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : "保存失败";
  }
}
const confirmingDelete = ref(false);
/** @description 确认后删除远程模板，取消不发送请求，接口失败展示错误。 @param id 模板标识。 */
async function deleteTemplate(id: number): Promise<void> {
  if (confirmingDelete.value || state.submitting || state.loading || state.editing) return;
  confirmingDelete.value = true;
  try {
    await ElMessageBox.confirm("确定删除此运行配置模板吗？", "删除模板", { type: "warning" });
  } catch {
    return;
  } finally {
    confirmingDelete.value = false;
  }
  if (!props.modelValue) return;
  try {
    const executed = await state.executeRemoteCommand(id, deleteFunctionRateLimitTemplateInterface, getListFunctionRateLimitTemplateInterface);
    if (executed) {
      error.value = "";
      ElMessage.success("模板已删除");
    }
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : "删除失败";
  }
}
/** @description 调用启停接口，成功刷新列表，失败保留原状态。 @param id 模板标识。 @param enabled 目标启用状态。 */
async function changeTemplateEnabled(id: number, enabled: boolean): Promise<void> {
  try {
    const executed = await state.changeRemoteEnabled(
      id,
      enabled,
      putEnableFunctionRateLimitTemplateInterface,
      putDisableFunctionRateLimitTemplateInterface,
      getListFunctionRateLimitTemplateInterface,
    );
    if (executed) {
      error.value = "";
      ElMessage.success(enabled ? "模板已启用" : "模板已停用");
    }
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : "状态修改失败";
  }
}
/** @description 关闭弹窗时丢弃未保存的草稿。 @param visible 弹窗状态。 */
function closeDialog(visible: boolean): void {
  if (state.submitting) return;
  if (!visible) {
    state.invalidateQuery();
    state.cancelEdit();
    error.value = "";
  }
  emit("update:modelValue", visible);
}
</script>
<style scoped lang="scss">
.runtime-template__toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 12px;
}
.runtime-template__number {
  width: 100%;
}
.runtime-template__error {
  color: var(--aircas-color-danger);
}
</style>
