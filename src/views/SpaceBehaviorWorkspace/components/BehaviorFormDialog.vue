<template>
  <el-dialog
    :model-value="modelValue"
    class="aircas-dialog behavior-form-dialog"
    :title="dialogTitle"
    width="min(1120px, 94vw)"
    top="4vh"
    append-to-body
    destroy-on-close
    :close-on-click-modal="false"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="behavior-form-dialog__intro">
      <span>基本信息 / 输入参数 / 输出参数</span>
      <el-tag class="aircas-tag" size="small" type="warning">{{ configTag }}</el-tag>
    </div>
    <el-alert
      v-if="saveAsCopy"
      title="另存为独立草稿副本"
      description="保存将创建新的行为 ID；原已发布行为及其行为树、调度引用保持不变。此操作不是发布新版本。"
      type="info"
      show-icon
      :closable="false"
    />
    <el-alert v-if="readonly" title="已停用行为为只读，请先通过状态管理转为草稿" type="warning" show-icon :closable="false" />

    <el-form class="aircas-form behavior-form-dialog__form" label-position="top" :disabled="readonly">
      <section class="behavior-form-dialog__section">
        <h3>基本信息</h3>
        <div class="behavior-form-dialog__grid">
          <el-form-item label="行为名称" required>
            <el-input v-model="displayName" class="aircas-input" maxlength="64" show-word-limit placeholder="输入行为名称" />
          </el-form-item>
          <el-form-item label="行为分类" required>
            <el-select v-model="categoryId" class="aircas-select" popper-class="aircas-select-popper" filterable placeholder="选择行为分类" style="width: 100%">
              <el-option v-for="item in categoryOptions" :key="item.id" :label="item.label" :value="item.id" />
            </el-select>
          </el-form-item>
        </div>
        <el-form-item label="行为描述">
          <el-input
            v-model="description"
            class="aircas-input"
            type="textarea"
            :rows="2"
            maxlength="240"
            show-word-limit
            placeholder="说明业务目的、执行场景与预期结果"
          />
        </el-form-item>
        <div class="behavior-form-dialog__grid">
          <el-form-item label="基础操作" required>
            <el-select
              :model-value="basicAction"
              class="aircas-select"
              popper-class="aircas-select-popper"
              placeholder="选择基础操作"
              style="width: 100%"
              @change="handleBasicActionChange"
            >
              <el-option v-for="item in SPACE_BEHAVIOR_BASIC_ACTION_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="关联基础函数算子" required>
            <el-select
              :model-value="functionOperatorId"
              class="aircas-select"
              popper-class="aircas-select-popper"
              filterable
              placeholder="选择基础函数算子"
              style="width: 100%"
              @change="handleOperatorChange"
            >
              <el-option v-for="item in filteredOperatorOptions" :key="item.id" :label="`${item.name} · ${item.version}`" :value="item.id" />
            </el-select>
          </el-form-item>
        </div>
      </section>

      <section v-for="direction in parameterDirections" :key="direction" class="behavior-form-dialog__section">
        <header class="behavior-form-dialog__heading">
          <h3>
            {{ direction === "input" ? "输入参数" : "输出参数" }}
            <el-tag class="aircas-tag" size="small" effect="plain">{{ parameterList(direction).length }} 项</el-tag>
          </h3>
          <span>{{ direction === "input" ? "声明来源；对象 / List 内字段需逐项配置" : "使用返回字段路径与目标属性建立一一映射" }}</span>
        </header>
        <div v-if="parameterRows(direction).length" class="behavior-form-dialog__table-wrap">
          <table class="behavior-form-dialog__table" :aria-label="direction === 'input' ? '输入参数配置' : '输出参数配置'">
            <thead>
              <tr>
                <th>参数 / 描述</th>
                <th>类型 / 契约</th>
                <th>{{ direction === "input" ? "输入来源" : "输出方式" }}</th>
                <th v-if="direction === 'output'">返回结果字段</th>
                <th>{{ direction === "input" ? "读取属性 / 参数值" : "写入目标" }}</th>
                <th>配置状态</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in parameterRows(direction)"
                :key="`${direction}-${row.parameter.id}`"
                :class="{ 'is-group': row.isGroup, 'is-nested': row.depth > 0 }"
              >
                <td>
                  <strong :style="{ paddingLeft: `${row.depth * 16}px` }">{{ row.parameter.name }}</strong>
                  <small>{{ row.parameter.path }}</small>
                  <small>{{ row.parameter.description || "暂无描述" }}</small>
                </td>
                <td>
                  <el-tag class="aircas-tag" size="small" effect="plain">{{ row.parameter.type }}</el-tag>
                  <small>{{ row.parameter.required ? (direction === "input" ? "必填输入" : "算子必返") : "可选" }}</small>
                </td>
                <template v-if="row.isGroup">
                  <td :colspan="direction === 'output' ? 4 : 3">
                    <span class="behavior-form-dialog__muted">{{ row.parameter.type }} 字段按下方配置逐项{{ direction === "input" ? "组装" : "映射" }}</span>
                  </td>
                </template>
                <template v-else>
                  <td>{{ row.parameter.sourceLabel || "—" }}</td>
                  <td v-if="direction === 'output'">{{ row.parameter.path || "—" }}</td>
                  <td>{{ row.parameter.bindLabel || "—" }}</td>
                  <td>
                    <el-tag class="aircas-tag" size="small" :type="row.parameter.configured ? 'success' : 'warning'">
                      {{ row.parameter.configured ? "已配置" : "待完善" }}
                    </el-tag>
                  </td>
                </template>
              </tr>
            </tbody>
          </table>
        </div>
        <el-empty v-else class="aircas-empty" :description="functionOperatorId ? '该算子无参数' : '请选择函数算子以加载参数'" :image-size="48" />
      </section>

      <section class="behavior-form-dialog__section">
        <h3>变更信息</h3>
        <el-form-item label="变更说明">
          <el-input v-model="changeNote" class="aircas-input" maxlength="240" show-word-limit placeholder="说明参数、绑定或关系变化" />
        </el-form-item>
        <p class="behavior-form-dialog__muted">
          此处只保存配置，不改变状态。保存后请在列表或详情的“状态管理”中发布；当前为 Mock 生命周期，不执行真实行为或生产审批。
        </p>
      </section>
    </el-form>

    <template #footer>
      <el-button class="aircas-button aircas-button--tone-ghost" @click="emit('update:modelValue', false)">{{ readonly ? "关闭" : "取消" }}</el-button>
      <el-button v-if="saveAsCopy" class="aircas-button aircas-button--tone-primary" :loading="loading" @click="submitBehaviorForm('copy')">
        另存草稿副本
      </el-button>
      <el-button v-else-if="!readonly" class="aircas-button aircas-button--tone-primary" :loading="loading" @click="submitBehaviorForm('save')">
        保存行为
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import type { SpaceBehaviorBasicAction, SpaceBehaviorDraft, SpaceBehaviorItem, SpaceBehaviorParameter, SpaceBehaviorStatus } from "@/types";
import { ROOT_SPACE_BEHAVIOR_CATEGORY_ID, SPACE_BEHAVIOR_BASIC_ACTION_OPTIONS } from "@/types";
import { listSpaceBehaviorOperatorOptionsMock } from "@/mocks/ontologySpaceBehaviorMock/ontologySpaceBehaviorMock";
import { cloneSpaceBehaviorParameters, flattenSpaceBehaviorParameterRows } from "../utils/spaceBehaviorOperations";

const parameterDirections = ["input", "output"] as const;

const props = defineProps<{
  modelValue: boolean;
  mode: "create" | "edit";
  categoryOptions: Array<{ id: string; label: string }>;
  defaultCategoryId: string;
  behavior: SpaceBehaviorItem | null;
}>();
const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  submit: [draft: SpaceBehaviorDraft];
  "save-copy": [draft: SpaceBehaviorDraft];
}>();

const operatorCatalog = listSpaceBehaviorOperatorOptionsMock();
const displayName = ref("");
const functionOperatorId = ref("");
const functionOperatorName = ref("");
const description = ref("");
const changeNote = ref("");
const categoryId = ref(ROOT_SPACE_BEHAVIOR_CATEGORY_ID);
const status = ref<SpaceBehaviorStatus>("draft");
const basicAction = ref<SpaceBehaviorBasicAction>("create");
const inputParameters = ref<SpaceBehaviorParameter[]>([]);
const outputParameters = ref<SpaceBehaviorParameter[]>([]);
const loading = ref(false);
const dialogTitle = computed(() => (props.mode === "edit" ? "编辑行为" : "创建行为"));
const saveAsCopy = computed(() => props.mode === "edit" && props.behavior?.status === "published");
const readonly = computed(() => props.mode === "edit" && props.behavior?.status === "disabled");
const configTag = computed(() => (readonly.value ? "已停用" : "草稿配置"));
const filteredOperatorOptions = computed(() => operatorCatalog.filter((item) => item.basicAction === basicAction.value));

/**
 * @description 读取指定方向的参数列表。
 * @param direction 输入或输出。
 * @returns 参数树。
 */
function parameterList(direction: (typeof parameterDirections)[number]): SpaceBehaviorParameter[] {
  return direction === "input" ? inputParameters.value : outputParameters.value;
}

/**
 * @description 读取指定方向的展平参数行。
 * @param direction 输入或输出。
 * @returns 参数展示行。
 */
function parameterRows(direction: (typeof parameterDirections)[number]) {
  return flattenSpaceBehaviorParameterRows(parameterList(direction));
}

/**
 * @description 清空当前关联的函数算子与参数。
 */
function clearSelectedOperator(): void {
  functionOperatorId.value = "";
  functionOperatorName.value = "";
  inputParameters.value = [];
  outputParameters.value = [];
}

/**
 * @description 按选中的函数算子回填名称与参数。
 * @param operatorId 函数算子 id。
 */
function applySelectedOperator(operatorId: string): void {
  const operator = operatorCatalog.find((item) => item.id === operatorId);
  if (!operator) {
    clearSelectedOperator();
    return;
  }
  functionOperatorId.value = operator.id;
  functionOperatorName.value = operator.name;
  basicAction.value = operator.basicAction;
  inputParameters.value = structuredClone(operator.inputParameters);
  outputParameters.value = structuredClone(operator.outputParameters);
}

/**
 * @description 切换基础操作时，清除不匹配的函数算子。
 * @param value 基础操作。
 */
function handleBasicActionChange(value: string | number | boolean | undefined): void {
  if (value !== "create" && value !== "update" && value !== "delete" && value !== "query") return;
  basicAction.value = value;
  const current = operatorCatalog.find((item) => item.id === functionOperatorId.value);
  if (!current || current.basicAction !== value) clearSelectedOperator();
}

/**
 * @description 选择关联基础函数算子。
 * @param value 函数算子 id。
 */
function handleOperatorChange(value: string | number | boolean | undefined): void {
  if (typeof value !== "string") {
    clearSelectedOperator();
    return;
  }
  applySelectedOperator(value);
}

/**
 * @description 组装当前表单草稿。
 * @param nextStatus 提交后的行为状态。
 * @returns 行为草稿。
 */
function buildBehaviorDraft(nextStatus: SpaceBehaviorStatus): SpaceBehaviorDraft {
  return {
    displayName: displayName.value.trim(),
    functionOperatorId: functionOperatorId.value,
    functionOperatorName: functionOperatorName.value.trim(),
    description: description.value.trim(),
    categoryId: categoryId.value,
    status: nextStatus,
    basicAction: basicAction.value,
    changeNote: changeNote.value.trim(),
  };
}

/**
 * @description 校验行为表单后提交保存或另存草稿副本。
 * @param action 保存动作。
 */
function submitBehaviorForm(action: "save" | "copy"): void {
  if (readonly.value) return;
  if (!displayName.value.trim() || !categoryId.value || !functionOperatorId.value) {
    ElMessage.warning("请完整填写行为名称、行为分类和关联基础函数算子");
    return;
  }
  loading.value = true;
  const nextStatus = action === "copy" || props.mode === "create" ? "draft" : status.value;
  const draft = buildBehaviorDraft(nextStatus);
  if (action === "copy") {
    emit("save-copy", draft);
    return;
  }
  emit("submit", draft);
}

watch(
  () => props.modelValue,
  (visible) => {
    if (!visible) return;
    loading.value = false;
    if (props.behavior) {
      displayName.value = props.behavior.displayName;
      functionOperatorId.value = props.behavior.functionOperatorId;
      functionOperatorName.value = props.behavior.functionOperatorName;
      description.value = props.behavior.description;
      changeNote.value = props.behavior.changeNote;
      categoryId.value = props.behavior.categoryId;
      status.value = props.behavior.status;
      basicAction.value = props.behavior.basicAction;
      inputParameters.value = cloneSpaceBehaviorParameters(props.behavior.inputParameters);
      outputParameters.value = cloneSpaceBehaviorParameters(props.behavior.outputParameters);
      return;
    }
    displayName.value = "";
    description.value = "";
    changeNote.value = "";
    categoryId.value = props.defaultCategoryId || ROOT_SPACE_BEHAVIOR_CATEGORY_ID;
    status.value = "draft";
    basicAction.value = "create";
    clearSelectedOperator();
  },
);

defineExpose({
  /**
   * @description 同步弹窗确认按钮的 loading 状态。
   * @param value 是否处于提交中
   */
  setLoading(value: boolean) {
    loading.value = value;
  },
});
</script>

<style scoped lang="scss">
.behavior-form-dialog__intro {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 12px;
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
}
.behavior-form-dialog__form {
  max-height: min(68vh, 640px);
  overflow: auto;
}
.behavior-form-dialog__section {
  margin-bottom: 20px;
}
.behavior-form-dialog__section h3 {
  margin: 0 0 12px;
  color: var(--aircas-color-text-primary);
  font-size: 14px;
  font-weight: 600;
}
.behavior-form-dialog__heading {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}
.behavior-form-dialog__heading h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
}
.behavior-form-dialog__heading span {
  color: var(--aircas-color-text-muted);
  font-size: 12px;
}
.behavior-form-dialog__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
.behavior-form-dialog__muted {
  color: var(--aircas-color-text-muted);
  font-size: 12px;
  line-height: 1.6;
}
.behavior-form-dialog__table-wrap {
  overflow: auto;
  border: 1px solid var(--aircas-color-border);
  border-radius: 8px;
}
.behavior-form-dialog__table {
  width: 100%;
  border-collapse: collapse;
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
}
.behavior-form-dialog__table th,
.behavior-form-dialog__table td {
  padding: 8px 12px;
  border-bottom: 1px solid var(--aircas-color-border-soft);
  text-align: left;
  vertical-align: top;
}
.behavior-form-dialog__table th {
  background: var(--aircas-color-panel-background-deep);
  color: var(--aircas-color-text-muted);
  font-weight: 600;
  white-space: nowrap;
}
.behavior-form-dialog__table td strong,
.behavior-form-dialog__table td small {
  display: block;
}
.behavior-form-dialog__table td strong {
  color: var(--aircas-color-text-primary);
  font-size: 13px;
}
.behavior-form-dialog__table td small {
  margin-top: 2px;
  color: var(--aircas-color-text-muted);
}
.behavior-form-dialog__table tr.is-group td {
  background: var(--aircas-color-panel-background-deep);
}
</style>
