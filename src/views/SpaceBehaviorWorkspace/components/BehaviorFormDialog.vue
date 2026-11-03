<template>
  <el-dialog
    :model-value="modelValue"
    class="behavior-form-dialog"
    :title="dialogTitle"
    width="min(1120px, 94vw)"
    top="4vh"
    append-to-body
    destroy-on-close
    :close-on-click-modal="false"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <el-alert
      v-if="saveAsCopy"
      title="另存为独立草稿副本"
      description="保存将创建新的行为 ID；原已发布行为及其行为树、调度引用保持不变。此操作不是发布新版本。"
      type="info"
      show-icon
      :closable="false"
    />
    <el-alert v-if="readonly" title="已停用行为为只读，请先通过状态管理转为草稿" type="warning" show-icon :closable="false" />

    <el-form class="behavior-form-dialog__form" label-position="top" :disabled="readonly">
      <section class="behavior-form-dialog__section">
        <h3>基本信息</h3>

        <template v-if="kind === 'behaviorTree'">
          <el-form-item label="类别" required>
            <el-select v-model="kind" placeholder="选择类别" style="width: 100%" @change="handleKindChange">
              <el-option v-for="item in SPACE_BEHAVIOR_KIND_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <div class="behavior-form-dialog__tree-panel">
            <el-button :disabled="readonly" @click="openBehaviorTreeBuilder">构建行为树</el-button>
          </div>
        </template>

        <template v-else>
          <div class="behavior-form-dialog__grid behavior-form-dialog__grid--three">
            <el-form-item label="类别" required>
              <el-select v-model="kind" placeholder="选择类别" style="width: 100%" @change="handleKindChange">
                <el-option v-for="item in SPACE_BEHAVIOR_KIND_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="行为名称" required>
              <el-input v-model="displayName" maxlength="64" show-word-limit placeholder="输入行为名称" />
            </el-form-item>
            <el-form-item label="行为分类" required>
              <el-tree-select
                v-model="categoryId"
                :data="categoryTree"
                check-strictly
                default-expand-all
                :render-after-expand="false"
                filterable
                node-key="id"
                :props="{ label: 'label', children: 'children' }"
                placeholder="选择行为分类"
                style="width: 100%"
              />
            </el-form-item>
          </div>
          <el-form-item label="行为描述">
            <el-input v-model="description" type="textarea" :rows="3" maxlength="240" show-word-limit placeholder="说明业务目的、执行场景与预期结果" />
          </el-form-item>

          <div v-if="kind === 'basic'" class="behavior-form-dialog__grid">
            <el-form-item label="行为类型" required>
              <el-select v-model="valueType" placeholder="选择行为类型" style="width: 100%">
                <el-option v-for="item in SPACE_BEHAVIOR_VALUE_TYPE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="基础操作" required>
              <el-select :model-value="basicAction" placeholder="选择基础操作" style="width: 100%" @change="handleBasicActionChange">
                <el-option v-for="item in SPACE_BEHAVIOR_BASIC_ACTION_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </div>

          <el-form-item v-else-if="kind === 'application'" label="关联函数算子" required>
            <el-select
              :model-value="functionOperatorId"
              filterable
              :loading="operatorLoading"
              :disabled="operatorLoading || operatorError !== ''"
              :placeholder="operatorLoading ? '正在加载函数算子' : operatorError || (operatorCatalog.length ? '选择函数算子' : '当前空间暂无函数算子')"
              style="width: 100%"
              @change="handleOperatorChange"
            >
              <el-option v-for="item in operatorCatalog" :key="item.id" :label="`${item.name} · ${item.version}`" :value="item.id" />
            </el-select>
          </el-form-item>
        </template>
      </section>
    </el-form>

    <template #footer>
      <el-button @click="emit('update:modelValue', false)">{{ readonly ? "关闭" : "取消" }}</el-button>
      <el-button v-if="saveAsCopy && kind !== 'behaviorTree'" :loading="loading" @click="submitBehaviorForm('copy')">另存草稿副本</el-button>
      <el-button v-else-if="!readonly && kind !== 'behaviorTree'" :loading="loading" @click="submitBehaviorForm('save')">保存行为</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import { getOntologyFunctionListInterface } from "@/apis";
import type {
  GetOntologyFunctionListItem,
  SpaceBehaviorBasicAction,
  SpaceBehaviorCategoryNode,
  SpaceBehaviorDraft,
  SpaceBehaviorItem,
  SpaceBehaviorKind,
  SpaceBehaviorOperatorOption,
  SpaceBehaviorStatus,
  SpaceBehaviorValueType,
} from "@/types";
import { ROOT_SPACE_BEHAVIOR_CATEGORY_ID, SPACE_BEHAVIOR_BASIC_ACTION_OPTIONS, SPACE_BEHAVIOR_KIND_OPTIONS, SPACE_BEHAVIOR_VALUE_TYPE_OPTIONS } from "@/types";

const props = defineProps<{
  modelValue: boolean;
  mode: "create" | "edit";
  spaceId: string;
  categoryTree: SpaceBehaviorCategoryNode[];
  defaultCategoryId: string;
  behavior: SpaceBehaviorItem | null;
}>();
const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  submit: [draft: SpaceBehaviorDraft];
  "save-copy": [draft: SpaceBehaviorDraft];
}>();

const operatorCatalog = ref<SpaceBehaviorOperatorOption[]>([]);
const operatorLoading = ref(false);
const operatorError = ref("");
let operatorLoadToken = 0;
const kind = ref<SpaceBehaviorKind>("basic");
const valueType = ref<SpaceBehaviorValueType>("attributeValue");
const displayName = ref("");
const functionOperatorId = ref("");
const functionOperatorName = ref("");
const description = ref("");
const categoryId = ref(ROOT_SPACE_BEHAVIOR_CATEGORY_ID);
const status = ref<SpaceBehaviorStatus>("draft");
const basicAction = ref<SpaceBehaviorBasicAction>("create");
const loading = ref(false);
const dialogTitle = computed(() => (props.mode === "edit" ? "编辑行为" : "创建行为"));
const saveAsCopy = computed(() => props.mode === "edit" && props.behavior?.status === "published");
const readonly = computed(() => props.mode === "edit" && props.behavior?.status === "disabled");

/**
 * @description 清空当前关联的函数算子。
 */
function clearSelectedOperator(): void {
  functionOperatorId.value = "";
  functionOperatorName.value = "";
}

/**
 * @description 按选中的函数算子回填标识与名称。
 * @param operatorId 函数算子 id。
 */
function applySelectedOperator(operatorId: string): void {
  const operator = operatorCatalog.value.find((item) => item.id === operatorId);
  if (!operator) {
    clearSelectedOperator();
    return;
  }
  functionOperatorId.value = operator.id;
  functionOperatorName.value = operator.name;
}

/**
 * @description 切换顶层类别时清理不适用字段。
 * @param value 新的类别。
 */
function handleKindChange(value: string | number | boolean | undefined): void {
  if (value !== "basic" && value !== "application" && value !== "behaviorTree") return;
  kind.value = value;
  if (value === "basic") {
    clearSelectedOperator();
    valueType.value = "attributeValue";
    return;
  }
  if (value === "application") {
    basicAction.value = "create";
    return;
  }
  displayName.value = "";
  description.value = "";
  categoryId.value = props.defaultCategoryId || ROOT_SPACE_BEHAVIOR_CATEGORY_ID;
  valueType.value = "attributeValue";
  basicAction.value = "create";
  clearSelectedOperator();
}

/**
 * @description 切换基础操作。
 * @param value 基础操作。
 */
function handleBasicActionChange(value: string | number | boolean | undefined): void {
  if (value !== "create" && value !== "update" && value !== "delete") return;
  basicAction.value = value;
}

/**
 * @description 选择关联函数算子。
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
 * @description 行为树构建入口占位；后续接入真实构建流程。
 */
function openBehaviorTreeBuilder(): void {
  ElMessage.info("行为树构建后续接入");
}

/**
 * @description 组装当前表单草稿。
 * @param nextStatus 提交后的行为状态。
 * @returns 行为草稿。
 */
function buildBehaviorDraft(nextStatus: SpaceBehaviorStatus): SpaceBehaviorDraft {
  return {
    displayName: displayName.value.trim(),
    kind: kind.value,
    valueType: valueType.value,
    functionOperatorId: functionOperatorId.value,
    functionOperatorName: functionOperatorName.value.trim(),
    description: description.value.trim(),
    categoryId: categoryId.value,
    status: nextStatus,
    basicAction: basicAction.value,
  };
}

/**
 * @description 按类别校验后提交保存或另存草稿副本。
 * @param action 保存动作。
 */
function submitBehaviorForm(action: "save" | "copy"): void {
  if (readonly.value || kind.value === "behaviorTree") return;
  if (!displayName.value.trim() || !categoryId.value) {
    ElMessage.warning("请完整填写行为名称和行为分类");
    return;
  }
  if (kind.value === "basic" && (!valueType.value || !basicAction.value)) {
    ElMessage.warning("请完整填写行为类型和基础操作");
    return;
  }
  if (kind.value === "application" && !functionOperatorId.value) {
    ElMessage.warning("请选择关联函数算子");
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

/**
 * @description 查询当前对象空间已发布的函数算子。
 */
async function loadOperatorCatalog(): Promise<void> {
  const requestToken = ++operatorLoadToken;
  operatorLoading.value = true;
  operatorError.value = "";
  try {
    const numericSpaceId = Number(props.spaceId);
    if (!Number.isInteger(numericSpaceId)) throw new Error("当前对象空间无效");
    const response = await getOntologyFunctionListInterface({
      ontologySpaceId: numericSpaceId,
      type: "BASIC_QUERY",
      publishStatus: 1,
      pageNum: 1,
      pageSize: 100,
    });
    if (requestToken !== operatorLoadToken) return;
    if (response.code !== 0 && response.code !== 200) throw new Error(response.message || "函数算子加载失败");
    operatorCatalog.value = (response.data?.records ?? []).map((item: GetOntologyFunctionListItem) => mapFunctionOperator(item));
  } catch (error) {
    if (requestToken !== operatorLoadToken) return;
    operatorCatalog.value = [];
    operatorError.value = error instanceof Error ? error.message : "函数算子加载失败";
  } finally {
    if (requestToken === operatorLoadToken) operatorLoading.value = false;
  }
}

/**
 * @description 将函数列表记录映射为行为弹框使用的算子选项。
 * @param item 函数列表记录。
 * @returns 算子选项。
 */
function mapFunctionOperator(item: GetOntologyFunctionListItem): SpaceBehaviorOperatorOption {
  return {
    id: item.functionApi,
    name: item.displayName,
    version: item.version,
    basicAction: basicAction.value,
    objectName: item.displayName,
    inputParameters: [],
    outputParameters: [],
  };
}

watch(
  () => props.modelValue,
  (visible) => {
    if (!visible) return;
    void loadOperatorCatalog();
    loading.value = false;
    if (props.behavior) {
      kind.value = props.behavior.kind;
      valueType.value = props.behavior.valueType;
      displayName.value = props.behavior.displayName;
      functionOperatorId.value = props.behavior.functionOperatorId;
      functionOperatorName.value = props.behavior.functionOperatorName;
      description.value = props.behavior.description;
      categoryId.value = props.behavior.categoryId;
      status.value = props.behavior.status;
      basicAction.value = props.behavior.basicAction;
      return;
    }
    kind.value = "basic";
    valueType.value = "attributeValue";
    displayName.value = "";
    description.value = "";
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
.behavior-form-dialog__form {
  max-height: min(68vh, 640px);
  overflow: auto;
}

.behavior-form-dialog__section {
  margin-bottom: 12px;
}

.behavior-form-dialog__section h3 {
  margin: 0 0 12px;
  color: var(--aircas-color-text-primary);
  font-size: 14px;
  font-weight: 600;
}

.behavior-form-dialog__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.behavior-form-dialog__grid--three {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.behavior-form-dialog__tree-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 220px;
  margin-top: 8px;
  border-top: 1px solid var(--aircas-color-border);
}

@media (max-width: 900px) {
  .behavior-form-dialog__grid,
  .behavior-form-dialog__grid--three {
    grid-template-columns: 1fr;
  }
}
</style>
