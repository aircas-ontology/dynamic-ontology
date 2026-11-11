<template>
  <el-dialog :model-value="modelValue" width="760px" append-to-body destroy-on-close :close-on-click-modal="false" @close="emit('update:modelValue', false)">
    <template #header>
      <div class="behavior-test-dialog__header">
        <span class="behavior-test-dialog__title">{{ dialogTitle }}</span>
        <el-tag v-if="behaviorCategoryLabel" size="small" effect="plain" type="info">{{ behaviorCategoryLabel }}</el-tag>
        <el-tag v-if="behaviorBasicActionLabel" size="small" effect="plain">{{ behaviorBasicActionLabel }}</el-tag>
      </div>
    </template>
    <p v-if="dialogHint" class="behavior-test-dialog__hint">{{ dialogHint }}</p>

    <BehaviorParameterConfig v-if="isApplicationTest" :controller="parameterConfig" :readonly="submitLoading" />

    <BehaviorParameterConfig v-if="!isApplicationTest && showRelationLinkForm" :controller="parameterConfig" :readonly="submitLoading" />

    <section v-if="isApplicationTest && applicationTestResultText" class="behavior-test-dialog__section">
      <h4 class="behavior-test-dialog__section-title">测试结果</h4>
      <el-input class="behavior-test-dialog__result" type="textarea" :model-value="applicationTestResultText" :rows="10" readonly resize="vertical" />
    </section>

    <section v-if="isBasicFunctionOperatorTest" class="behavior-test-dialog__section">
      <h4 class="behavior-test-dialog__section-title">选择实体实例（可选）</h4>
      <p v-if="entityLoading && !entityRows.length" class="behavior-test-dialog__state" role="status">正在加载实体列表…</p>
      <p v-else-if="entityError && !entityRows.length" class="behavior-test-dialog__state" role="alert">{{ entityError }}</p>
      <el-select
        v-else
        class="behavior-test-dialog__entity-select"
        :model-value="selectedEntityRowKey"
        filterable
        clearable
        :loading="entityLoading"
        placeholder="请选择实体实例"
        @update:model-value="updateBasicOperatorEntitySelection"
      >
        <el-option
          v-for="option in listBasicOperatorEntitySelectOptions()"
          :key="option.rowKey"
          :label="formatBasicOperatorEntityOptionLabel(option)"
          :value="option.rowKey"
        />
        <template #footer>
          <div v-if="entityTotal > 0" class="behavior-test-dialog__select-footer" @mousedown.prevent>
            <el-pagination
              small
              layout="total, prev, pager, next"
              :total="entityTotal"
              :current-page="entityPage"
              :page-size="entityPageSize"
              @current-change="changeEntityPage"
            />
          </div>
          <p v-else-if="entityError" class="behavior-test-dialog__select-footer-error" role="alert">{{ entityError }}</p>
        </template>
      </el-select>
    </section>

    <section v-if="isBasicFunctionOperatorTest" class="behavior-test-dialog__section">
      <el-input
        class="behavior-test-dialog__result"
        type="textarea"
        :model-value="basicOperatorTestResultText"
        :rows="10"
        readonly
        resize="vertical"
        placeholder="开始测试后将在此展示接口返回 data"
      />
    </section>

    <section v-if="isAttributeValueTest" class="behavior-test-dialog__section">
      <h4 class="behavior-test-dialog__section-title">选择实体实例</h4>
      <p v-if="entityLoading" class="behavior-test-dialog__state" role="status">正在加载实体列表…</p>
      <p v-else-if="entityError" class="behavior-test-dialog__state" role="alert">{{ entityError }}</p>
      <template v-else>
        <el-table
          class="behavior-test-dialog__table"
          :data="entityRows"
          row-key="rowKey"
          size="small"
          highlight-current-row
          :empty-text="entityRows.length ? undefined : '暂无实体实例'"
          @row-click="handleEntityRowClick"
        >
          <el-table-column width="48" align="center">
            <template #default="{ row }">
              <el-radio :model-value="selectedEntityRowKey" :value="asEntityRow(row).rowKey" @change="selectEntityRow(asEntityRow(row))" />
            </template>
          </el-table-column>
          <el-table-column prop="displayName" label="实体名称" min-width="160" show-overflow-tooltip />
          <el-table-column prop="primaryKeyLabel" label="实体主键" min-width="160" show-overflow-tooltip />
          <el-table-column prop="ontologyName" label="对象名称" min-width="140" show-overflow-tooltip />
          <el-table-column prop="propertySummary" label="主属性摘要" min-width="200" show-overflow-tooltip />
        </el-table>
        <div class="behavior-test-dialog__pagination">
          <el-pagination
            background
            layout="total, prev, pager, next, sizes"
            :total="entityTotal"
            :current-page="entityPage"
            :page-size="entityPageSize"
            :page-sizes="[10, 20, 50]"
            @current-change="changeEntityPage"
            @size-change="changeEntityPageSize"
          />
        </div>
      </template>
    </section>

    <section v-if="isAttributeValueTest && needsDataRowSelection" class="behavior-test-dialog__section">
      <h4 class="behavior-test-dialog__section-title">选择数据行</h4>
      <p v-if="selectedEntityPrimaryKey === null" class="behavior-test-dialog__state" role="status">请先选择实体实例以加载行数据</p>
      <p v-else-if="groupRowLoading" class="behavior-test-dialog__state" role="status">正在加载实体行数据…</p>
      <p v-else-if="groupRowError" class="behavior-test-dialog__state" role="alert">{{ groupRowError }}</p>
      <el-table
        v-else
        class="behavior-test-dialog__table"
        :data="groupDataRows"
        row-key="rowKey"
        size="small"
        highlight-current-row
        :empty-text="groupDataRows.length ? undefined : '暂无数据行'"
        @row-click="handleGroupDataRowClick"
      >
        <el-table-column width="48" align="center">
          <template #default="{ row }">
            <el-radio
              :model-value="selectedGroupDataRowKey"
              :value="asGroupDataRow(row).rowKey"
              :disabled="isMainGroupDataRowLocked"
              @change="selectGroupDataRow(asGroupDataRow(row))"
            />
          </template>
        </el-table-column>
        <el-table-column prop="storageGroup" label="存储分组" min-width="120" show-overflow-tooltip />
        <el-table-column prop="dataPrimaryKeyLabel" label="数据行主键" min-width="140" show-overflow-tooltip />
        <el-table-column prop="propertySummary" label="属性数量" min-width="220" show-overflow-tooltip />
      </el-table>
      <div v-if="selectedEntityPrimaryKey !== null && !groupRowLoading && !groupRowError" class="behavior-test-dialog__pagination">
        <el-pagination
          background
          layout="total, prev, pager, next, sizes"
          :total="groupRowTotal"
          :current-page="groupRowPage"
          :page-size="groupRowPageSize"
          :page-sizes="[10, 20, 50]"
          @current-change="changeGroupDataRowPage"
          @size-change="changeGroupDataRowPageSize"
        />
      </div>
    </section>

    <p v-if="(isCreateTest || isUpdateTest) && detailError" class="behavior-test-dialog__state" role="alert">{{ detailError }}</p>

    <p v-if="submitError && !isUpdateTest && !isCreateTest" class="behavior-test-dialog__state" role="alert">{{ submitError }}</p>

    <template #footer>
      <el-button v-if="isRelationInstanceTest" :disabled="submitLoading" @click="openEntityLinkData">查看实例关系数据</el-button>
      <el-button v-else-if="isAttributeValueTest" :disabled="submitLoading" @click="openEntityRowDetail">查看实例数据</el-button>
      <el-button :disabled="submitLoading" @click="emit('update:modelValue', false)">关闭</el-button>
      <el-button v-if="!isUpdateTest && !isCreateTest" type="primary" :loading="submitLoading" @click="submitBehaviorTest">开始测试</el-button>
    </template>
  </el-dialog>

  <BehaviorEntityRowDetailDialog
    ref="entityRowDetailDialogRef"
    v-model="entityRowDetailVisible"
    :ontology-unique-identifier="detailOntologyUniqueIdentifier"
    :entity-primary-key="detailEntityPrimaryKey"
    :entity-display-name="detailEntityDisplayName"
    :external-detail="entityRowDetailFromPage"
    :enable-update-test="isUpdateTest"
    :enable-create-test="isCreateTest"
    :selected-data-primary-key="selectedGroupDataRow?.dataPrimaryKey ?? null"
    :param-rows="paramRows"
    :param-values="paramValues"
    :param-detail-loading="detailLoading"
    :param-detail-error="detailError"
    :submit-loading="submitLoading"
    :submit-error="submitError"
    @update-param-value="updateParamValue"
    @start-test="submitBehaviorTest"
    @detail-loaded="seedUpdateParamValuesFromDetail"
    @reload-detail="reloadEntityRowDetailFromPage"
  />

  <BehaviorEntityLinkDataDialog v-model="entityLinkDataVisible" :query-params="entityLinkDataQueryParams" />
</template>

<script setup lang="ts">
import BehaviorParameterConfig from "@/components/BehaviorParameterConfig/BehaviorParameterConfig.vue";
import { useBehaviorParameters } from "@/composables/behavior/useBehaviorParameters";
import type { BehaviorTestEntityRow, BehaviorTestEntityDataRow } from "@/types";
import { computed, onScopeDispose, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import {
  getOntologyActionInfoInterface,
  getOntologyEntitiesInterface,
  getOntologyLinkByUniqueIdentifierInterface,
  postGetOntologyEntityRowDetailPageInterface,
  postTestOntologyActionInterface,
} from "@/apis";
import {
  SPACE_BEHAVIOR_BASIC_ACTION_LABELS,
  SPACE_BEHAVIOR_KIND_LABELS,
  SPACE_BEHAVIOR_VALUE_TYPE_LABELS,
  type OntologyEntityRowDetailPageData,
  type OntologyEntityRowDetailVO,
  type PostOntologyEntityAllLinkParams,
  type SpaceBehaviorItem,
  type TestOntologyActionData,
} from "@/types";
import BehaviorEntityLinkDataDialog from "./BehaviorEntityLinkDataDialog.vue";
import BehaviorEntityRowDetailDialog from "./BehaviorEntityRowDetailDialog.vue";
import {
  mapOntologyEntityRowDetailPageToDataRows,
  mapOntologyEntityRowDetailPageToViewDetail,
} from "@/utils/behaviorParameters/mapOntologyEntityRowDetailToDataRows";
import { mapOntologyActionInfoToViewState } from "@/utils/behaviorParameters/mapOntologyActionInfoToViewState";
import { isMainStorageGroup } from "@/utils/behaviorParameters/resolveAttributeValueSelection";

const props = defineProps<{
  modelValue: boolean;
  spaceId: string;
  behavior: SpaceBehaviorItem | null;
}>();

const parameterConfig = useBehaviorParameters(props, {
  getOntologyActionInfoInterface,
  getOntologyEntitiesInterface,
  getOntologyLinkByUniqueIdentifierInterface,
  postGetOntologyEntityRowDetailPageInterface,
});
const {
  loadApplicationTestForm,
  loadRelationTestContext,
  updateParamValue,
  isApplicationTest,
  detailLoading,
  detailError,
  paramValues,
  showRelationLinkForm,
  relationContextLoading,
  relationContextError,
  ontologyNameFrom,
  ontologyNameTo,
  asEntityRow,
  clearDetailParamState,
  detailLoadToken,
  applicationHasLinkMapping,
  clearRelationTestState,
  resolvedActionApi,
  resolvedStorageGroup,
  mapExternalParamRows,
  paramRows,
  resetParamValues,
  behaviorOntologyUniqueIdentifier,
  relationContextLoadToken,
  ontologyUniqueIdentifierFrom,
  ontologyUniqueIdentifierTo,
  relationMountSide,
  selectedFromEntityRows,
  selectedToEntityRows,
  buildExternalParamsPayload,
  isRelationInstanceTest,
  applicationOntologyLoadTokens,
  mapEntityRecordToRow,
  fromEntityLoadToken,
  toEntityLoadToken,
} = parameterConfig;
const emit = defineEmits<{ "update:modelValue": [value: boolean] }>();

const entityLoading = ref(false);
const entityError = ref("");
const entityRows = ref<BehaviorTestEntityRow[]>([]);
const entityTotal = ref(0);
const entityPage = ref(1);
const entityPageSize = ref(10);
const selectedEntityRowKey = ref("");
let entityLoadToken = 0;
/** 应用行为测试成功后展示的接口 data 文本。 */
const applicationTestResultText = ref("");

const submitLoading = ref(false);
const submitError = ref("");
/** 基础函数算子测试成功后展示的接口 data 文本。 */
const basicOperatorTestResultText = ref("");
let submitToken = 0;

const entityRowDetailVisible = ref(false);
/** 实例数据弹框引用，用于修改测试成功后刷新详情。 */
const entityRowDetailDialogRef = ref<{ reloadEntityRowDetail: () => void } | null>(null);
const entityLinkDataVisible = ref(false);
const entityLinkDataQueryParams = ref<PostOntologyEntityAllLinkParams>({
  ontologyUniqueIdentifierFrom: "",
  entityPrimaryKeyFrom: "",
  ontologyUniqueIdentifierTo: "",
  entityPrimaryKeyTo: "",
});

const groupRowLoading = ref(false);
const groupRowError = ref("");
const groupDataRows = ref<BehaviorTestEntityDataRow[]>([]);
const groupRowPageData = ref<OntologyEntityRowDetailPageData | null>(null);
const groupRowTotal = ref(0);
const groupRowPage = ref(1);
const groupRowPageSize = ref(10);
const selectedGroupDataRowKey = ref("");
let groupRowLoadToken = 0;

const dialogTitle = computed(() => {
  const name = props.behavior?.displayName.trim() || "行为";
  return `测试行为 · ${name}`;
});

/**
 * @description 格式化测试弹框行为类别标签；基础行为追加行为类型。
 * @returns 类别文案；无行为时为空。
 */
const behaviorCategoryLabel = computed(() => {
  const item = props.behavior;
  if (!item) return "";
  const kindLabel = SPACE_BEHAVIOR_KIND_LABELS[item.kind];
  if (item.kind !== "basic") return kindLabel;
  const valueTypeLabel = SPACE_BEHAVIOR_VALUE_TYPE_LABELS[item.valueType];
  return valueTypeLabel ? `${kindLabel}-${valueTypeLabel}` : kindLabel;
});

/**
 * @description 格式化测试弹框基础操作标签。
 * @returns 操作文案；缺失时为空（不展示标签）。
 */
const behaviorBasicActionLabel = computed(() => {
  const basicAction = props.behavior?.basicAction;
  if (!basicAction) return "";
  return SPACE_BEHAVIOR_BASIC_ACTION_LABELS[basicAction] || "";
});
const isBasicFunctionOperatorTest = computed(() => !isApplicationTest.value && props.behavior?.valueType === "basicFunctionOperator");
const isAttributeValueTest = computed(() => !isApplicationTest.value && props.behavior?.valueType === "attributeValue");
const isCreateTest = computed(() => isAttributeValueTest.value && props.behavior?.basicAction === "create");
const isUpdateTest = computed(() => isAttributeValueTest.value && props.behavior?.basicAction === "update");
const isDeleteTest = computed(() => isAttributeValueTest.value && props.behavior?.basicAction === "delete");
const needsDataRowSelection = computed(() => isUpdateTest.value || isDeleteTest.value);
/** 属性值-编辑且存储分组为 main 时，数据行默认勾选且不可取消。 */
const isMainGroupDataRowLocked = computed(() => isUpdateTest.value && isMainStorageGroup(resolvedStorageGroup.value));

const dialogHint = computed(() => {
  if (isApplicationTest.value && applicationHasLinkMapping.value) {
    return "填写入参并选择关系两端实例后开始测试。";
  }
  if (isApplicationTest.value) return "根据入参来源填写外部值或选择对象实例后开始测试。";
  if (isRelationInstanceTest.value) return "选择关系两端对象实例后执行关系实例测试。";
  if (isBasicFunctionOperatorTest.value) return "";
  if (isUpdateTest.value) return "选择实体实例与数据行后，在「查看实例数据」中填写测试参数并开始测试。";
  if (isCreateTest.value) return "选择实体实例后，在「查看实例数据」中填写测试参数并开始测试。";
  if (isDeleteTest.value) return "选择实体实例与数据行，用于属性值-删除测试。";
  return "选择实体实例后开始测试。";
});

/** 基础算子下拉跨页保留的已选实体。 */
const selectedEntitySnapshot = ref<BehaviorTestEntityRow | null>(null);

const selectedEntityRow = computed(() => {
  const onPage = entityRows.value.find((item) => item.rowKey === selectedEntityRowKey.value) ?? null;
  if (onPage) return onPage;
  if (selectedEntitySnapshot.value?.rowKey === selectedEntityRowKey.value) return selectedEntitySnapshot.value;
  return null;
});

const selectedEntityPrimaryKey = computed(() => {
  const primaryKey = selectedEntityRow.value?.primaryKey;
  if (primaryKey === undefined || primaryKey === null || primaryKey === "") return null;
  return primaryKey;
});

const selectedEntityDisplayName = computed(() => selectedEntityRow.value?.displayName ?? "");

const selectedMountEntityRow = computed(() => {
  if (relationMountSide.value === "from") return selectedFromEntityRows.value[0] ?? null;
  if (relationMountSide.value === "to") return selectedToEntityRows.value[0] ?? null;
  return null;
});

const selectedOppositeEntityRow = computed(() => {
  if (relationMountSide.value === "from") return selectedToEntityRows.value[0] ?? null;
  if (relationMountSide.value === "to") return selectedFromEntityRows.value[0] ?? null;
  return null;
});

const detailOntologyUniqueIdentifier = computed(() => behaviorOntologyUniqueIdentifier.value);

const detailEntityPrimaryKey = computed(() => {
  if (isRelationInstanceTest.value) {
    const primaryKey = selectedMountEntityRow.value?.primaryKey;
    if (primaryKey === undefined || primaryKey === null || primaryKey === "") return null;
    return primaryKey;
  }
  return selectedEntityPrimaryKey.value;
});

const detailEntityDisplayName = computed(() => {
  if (isRelationInstanceTest.value) return selectedMountEntityRow.value?.displayName ?? "";
  return selectedEntityDisplayName.value;
});

const selectedGroupDataRow = computed(() => groupDataRows.value.find((item) => item.rowKey === selectedGroupDataRowKey.value) ?? null);

/** 由 page 缓存适配出的实例详情，供查看实例数据弹框使用。 */
const entityRowDetailFromPage = computed(() => {
  const entityPrimaryKey = detailEntityPrimaryKey.value;
  const ontologyUniqueIdentifier = detailOntologyUniqueIdentifier.value;
  const storageGroup = resolvedStorageGroup.value.trim();
  if (entityPrimaryKey === null || !ontologyUniqueIdentifier || !storageGroup || !groupRowPageData.value) return null;
  return mapOntologyEntityRowDetailPageToViewDetail(groupRowPageData.value, {
    ontologyUniqueIdentifier,
    entityPrimaryKey,
    storageGroup,
  });
});

/**
 * @description 将属性值转为参数输入字符串。
 * @param value 属性原值。
 * @returns 字符串形式；空值返回空串。
 */
function formatPropertyValueForParam(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

/**
 * @description 比较两个数据行主键是否同一行。
 * @param left 左侧主键。
 * @param right 右侧主键。
 * @returns 相等时为 true。
 */
function isSameDataPrimaryKey(left: unknown, right: unknown): boolean {
  if (left === null || left === undefined || left === "" || right === null || right === undefined || right === "") return false;
  if (left === right) return true;
  if (
    (typeof left === "string" || typeof left === "number" || typeof left === "boolean") &&
    (typeof right === "string" || typeof right === "number" || typeof right === "boolean")
  ) {
    return String(left) === String(right);
  }
  try {
    return JSON.stringify(left) === JSON.stringify(right);
  } catch {
    return false;
  }
}

/**
 * @description 按详情中选中数据行的原属性值回填 EXTERNAL 测试参数。
 * @param detail 实例数据详情；为空时跳过。
 */
function seedUpdateParamValuesFromDetail(detail: OntologyEntityRowDetailVO | null): void {
  if (!isUpdateTest.value || !detail) return;
  const selectedKey = selectedGroupDataRow.value?.dataPrimaryKey;
  if (selectedKey === null || selectedKey === undefined || selectedKey === "") return;

  let selectedProps: { propertyApiName: string; propertyValue: unknown }[] | null = null;
  for (const group of detail.propertyGroups ?? []) {
    for (const row of group.groupDataList ?? []) {
      if (isSameDataPrimaryKey(row.dataPrimaryKey, selectedKey)) {
        selectedProps = Array.isArray(row.props) ? row.props : [];
        break;
      }
    }
    if (selectedProps) break;
  }
  if (!selectedProps) return;

  const valueByApiName = new Map(selectedProps.map((item) => [(item.propertyApiName ?? "").trim(), formatPropertyValueForParam(item.propertyValue)]));
  paramRows.value.forEach((row) => {
    paramValues[row.paramName] = valueByApiName.get(row.paramName.trim()) ?? "";
  });
}

/**
 * @description 清空实体列表与选中态。
 */
function clearEntityListState(): void {
  entityRows.value = [];
  entityTotal.value = 0;
  entityError.value = "";
  entityLoading.value = false;
  selectedEntityRowKey.value = "";
  selectedEntitySnapshot.value = null;
}

/**
 * @description 格式化基础算子实体下拉选项（仅实体名称）。
 * @param row 实体行。
 * @returns 选项文案。
 */
function formatBasicOperatorEntityOptionLabel(row: BehaviorTestEntityRow): string {
  return row.displayName.trim() || "未命名实体";
}

/**
 * @description 组装基础算子实体下拉选项；已选不在当前页时前置保留。
 * @returns 选项列表。
 */
function listBasicOperatorEntitySelectOptions(): BehaviorTestEntityRow[] {
  const selected = selectedEntityRow.value;
  if (!selected || !selectedEntityRowKey.value) return entityRows.value;
  if (entityRows.value.some((item) => item.rowKey === selected.rowKey)) return entityRows.value;
  return [selected, ...entityRows.value];
}

/**
 * @description 更新基础算子实体下拉选中值。
 * @param selectedRowKey 选中行键；空串表示清空。
 */
function updateBasicOperatorEntitySelection(selectedRowKey: string | number | null | undefined): void {
  const nextKey = String(selectedRowKey ?? "").trim();
  if (!nextKey) {
    selectedEntityRowKey.value = "";
    selectedEntitySnapshot.value = null;
    return;
  }
  const matched =
    listBasicOperatorEntitySelectOptions().find((item) => item.rowKey === nextKey) ?? entityRows.value.find((item) => item.rowKey === nextKey) ?? null;
  selectedEntityRowKey.value = nextKey;
  selectedEntitySnapshot.value = matched;
}

/**
 * @description 清空详情参数与提交态。
 */
/**
 * @description 将基础函数测试接口 data 格式化为只读文本。
 * @param data 测试响应 data。
 * @returns 展示文本。
 */
function formatBasicOperatorTestResultData(data: TestOntologyActionData): string {
  if (data === null || data === undefined) return "null";
  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data);
  }
}

/**
 * @description 清空基础函数测试结果展示。
 */
function clearBasicOperatorTestResult(): void {
  basicOperatorTestResultText.value = "";
}

/**
 * @description 清空应用行为测试结果展示。
 */
function clearApplicationTestResult(): void {
  applicationTestResultText.value = "";
}

/**
 * @description 清空实体行数据选择态。
 */
function clearGroupDataRowState(): void {
  groupDataRows.value = [];
  groupRowPageData.value = null;
  groupRowTotal.value = 0;
  groupRowError.value = "";
  groupRowLoading.value = false;
  selectedGroupDataRowKey.value = "";
}

/**
 * @description 将表格行收窄为实体数据行类型。
 * @param row 表格行。
 * @returns 数据行。
 */
function asGroupDataRow(row: unknown): BehaviorTestEntityDataRow {
  return row as BehaviorTestEntityDataRow;
}

/**
 * @description 单选实体行；属性值编辑测试时触发加载数据行。
 * @param row 实体行。
 */
function selectEntityRow(row: BehaviorTestEntityRow): void {
  selectedEntityRowKey.value = row.rowKey;
  selectedEntitySnapshot.value = row;
  selectedGroupDataRowKey.value = "";
  groupRowPage.value = 1;
  if (isAttributeValueTest.value) void loadEntityGroupDataRows();
}

/**
 * @description 点击实体行时同步单选。
 * @param row 表格行。
 */
function handleEntityRowClick(row: unknown): void {
  selectEntityRow(asEntityRow(row));
}

/**
 * @description 编辑-main 分组锁定时自动选中第一条数据行。
 */
function applyLockedMainGroupDataRowSelection(): void {
  if (!isMainGroupDataRowLocked.value) return;
  const firstRow = groupDataRows.value[0];
  selectedGroupDataRowKey.value = firstRow ? firstRow.rowKey : "";
}

/**
 * @description 按数据行主键在刷新后的列表中恢复选中；匹配不到则清空。
 * @param dataPrimaryKey 刷新前选中的数据行主键。
 */
function restoreSelectedGroupDataRowByPrimaryKey(dataPrimaryKey: unknown): void {
  if (dataPrimaryKey === null || dataPrimaryKey === undefined || dataPrimaryKey === "") {
    selectedGroupDataRowKey.value = "";
    return;
  }
  const matched = groupDataRows.value.find((item) => isSameDataPrimaryKey(item.dataPrimaryKey, dataPrimaryKey));
  selectedGroupDataRowKey.value = matched ? matched.rowKey : "";
}

/**
 * @description 单选实体属性数据行；编辑-main 分组锁定时忽略切换。
 * @param row 数据行。
 */
function selectGroupDataRow(row: BehaviorTestEntityDataRow): void {
  if (isMainGroupDataRowLocked.value) return;
  selectedGroupDataRowKey.value = row.rowKey;
}

/**
 * @description 点击数据行时同步单选；编辑-main 分组锁定时忽略。
 * @param row 表格行。
 */
function handleGroupDataRowClick(row: unknown): void {
  if (isMainGroupDataRowLocked.value) return;
  selectGroupDataRow(asGroupDataRow(row));
}

/**
 * @description 按当前行为对象标识分页加载实体列表。
 */
async function loadEntityList(): Promise<void> {
  const ontologyUniqueIdentifier = (props.behavior?.ontologyUniqIdentifier ?? "").trim();
  if (!ontologyUniqueIdentifier) {
    clearEntityListState();
    entityError.value = "当前行为缺少对象标识，无法加载实体列表";
    return;
  }
  const requestToken = ++entityLoadToken;
  entityLoading.value = true;
  entityError.value = "";
  try {
    const response = await getOntologyEntitiesInterface({
      ontologyUniqueIdentifier,
      pageNum: entityPage.value,
      pageSize: entityPageSize.value,
    });
    if (requestToken !== entityLoadToken) return;
    if (response.code !== 200 || !response.data) throw new Error(response.message || "实体列表加载失败");
    const records = Array.isArray(response.data.records) ? response.data.records : [];
    entityRows.value = records.map((item, index) => mapEntityRecordToRow(item, index));
    entityTotal.value = Number(response.data.total) || records.length;
    if (selectedEntityRowKey.value) {
      const onPage = entityRows.value.find((item) => item.rowKey === selectedEntityRowKey.value) ?? null;
      if (onPage) {
        selectedEntitySnapshot.value = onPage;
      } else if (!isBasicFunctionOperatorTest.value) {
        selectedEntityRowKey.value = "";
        selectedEntitySnapshot.value = null;
        clearGroupDataRowState();
      }
    }
  } catch (error) {
    if (requestToken !== entityLoadToken) return;
    entityRows.value = [];
    entityTotal.value = 0;
    entityError.value = error instanceof Error ? error.message : "实体列表加载失败";
    if (!isBasicFunctionOperatorTest.value) clearGroupDataRowState();
  } finally {
    if (requestToken === entityLoadToken) entityLoading.value = false;
  }
}

/**
 * @description 加载行为详情并提取外部输入参数。
 */
async function loadBehaviorDetailParams(): Promise<void> {
  const actionApi = (props.behavior?.behaviorApiName ?? "").trim();
  const ontologySpaceId = props.spaceId.trim();
  if (!actionApi) {
    clearDetailParamState();
    detailError.value = "当前行为缺少 apiName，无法加载参数";
    return;
  }
  if (!ontologySpaceId) {
    clearDetailParamState();
    detailError.value = "缺少对象空间 id，无法加载参数";
    return;
  }
  const requestToken = ++detailLoadToken.value;
  detailLoading.value = true;
  detailError.value = "";
  submitError.value = "";
  try {
    const response = await getOntologyActionInfoInterface({ actionApi, ontologySpaceId });
    if (requestToken !== detailLoadToken.value) return;
    if (response.code !== 200 || !response.data) throw new Error(response.message || "行为详情加载失败");
    const viewState = mapOntologyActionInfoToViewState(response.data);
    resolvedActionApi.value = viewState.actionApi || actionApi;
    resolvedStorageGroup.value = viewState.storageGroup.trim();
    const rows = mapExternalParamRows(viewState.inputRows);
    paramRows.value = rows;
    resetParamValues(rows);
    if (needsDataRowSelection.value && selectedEntityPrimaryKey.value !== null) {
      void loadEntityGroupDataRows();
    }
  } catch (error) {
    if (requestToken !== detailLoadToken.value) return;
    paramRows.value = [];
    resetParamValues([]);
    resolvedActionApi.value = "";
    resolvedStorageGroup.value = "";
    detailError.value = error instanceof Error ? error.message : "行为详情加载失败";
  } finally {
    if (requestToken === detailLoadToken.value) detailLoading.value = false;
  }
}

/**
 * @description 切换实体列表页码。
 * @param page 页码。
 */
function changeEntityPage(page: number): void {
  entityPage.value = page;
  void loadEntityList();
}

/**
 * @description 切换实体列表每页条数。
 * @param size 每页条数。
 */
function changeEntityPageSize(size: number): void {
  entityPageSize.value = size;
  entityPage.value = 1;
  void loadEntityList();
}

/**
 * @description 按所选实体分页加载指定存储分组的属性行（供选择数据行与查看实例数据复用）。
 */
async function loadEntityGroupDataRows(): Promise<void> {
  if (!isAttributeValueTest.value) {
    clearGroupDataRowState();
    return;
  }
  const ontologyUniqueIdentifier = behaviorOntologyUniqueIdentifier.value;
  const entityPrimaryKey = selectedEntityPrimaryKey.value;
  if (!ontologyUniqueIdentifier) {
    clearGroupDataRowState();
    groupRowError.value = "当前行为缺少对象标识，无法加载行数据";
    return;
  }
  if (entityPrimaryKey === null) {
    clearGroupDataRowState();
    return;
  }
  const storageGroup = resolvedStorageGroup.value.trim();
  if (!storageGroup) {
    clearGroupDataRowState();
    groupRowError.value = "行为未配置存储分组，无法选择数据行";
    return;
  }
  const requestToken = ++groupRowLoadToken;
  groupRowLoading.value = true;
  groupRowError.value = "";
  const previousSelectedDataPrimaryKey = selectedGroupDataRow.value?.dataPrimaryKey;
  try {
    const response = await postGetOntologyEntityRowDetailPageInterface({
      ontologyUniqueIdentifier,
      entityPrimaryKey,
      sort: "DESC",
      storageGroup,
      pageNum: groupRowPage.value,
      pageSize: groupRowPageSize.value,
    });
    if (requestToken !== groupRowLoadToken) return;
    if (response.code !== 200) throw new Error(response.message || "实体行数据加载失败");
    const pageData = response.data ?? null;
    groupRowPageData.value = pageData;
    groupDataRows.value = mapOntologyEntityRowDetailPageToDataRows(pageData, storageGroup);
    groupRowTotal.value = typeof pageData?.total === "number" ? pageData.total : 0;
    if (needsDataRowSelection.value) {
      if (isMainGroupDataRowLocked.value) {
        applyLockedMainGroupDataRowSelection();
      } else {
        restoreSelectedGroupDataRowByPrimaryKey(previousSelectedDataPrimaryKey);
      }
    }
  } catch (error) {
    if (requestToken !== groupRowLoadToken) return;
    groupDataRows.value = [];
    groupRowPageData.value = null;
    groupRowTotal.value = 0;
    selectedGroupDataRowKey.value = "";
    groupRowError.value = error instanceof Error ? error.message : "实体行数据加载失败";
  } finally {
    if (requestToken === groupRowLoadToken) groupRowLoading.value = false;
  }
}

/**
 * @description 切换数据行分页页码。
 * @param page 页码。
 */
function changeGroupDataRowPage(page: number): void {
  groupRowPage.value = page;
  void loadEntityGroupDataRows();
}

/**
 * @description 切换数据行分页每页条数并回到第一页。
 * @param size 每页条数。
 */
function changeGroupDataRowPageSize(size: number): void {
  groupRowPageSize.value = size;
  groupRowPage.value = 1;
  void loadEntityGroupDataRows();
}

/**
 * @description 打开所选实体的属性行详情弹框（使用已缓存的 page 数据）。
 */
async function openEntityRowDetail(): Promise<void> {
  if (detailEntityPrimaryKey.value === null) {
    ElMessage.warning("请先选择实体实例");
    return;
  }
  if (!detailOntologyUniqueIdentifier.value) {
    ElMessage.warning("当前行为缺少对象标识，无法查看实例数据");
    return;
  }
  if (!resolvedStorageGroup.value.trim()) {
    ElMessage.warning("行为未配置存储分组，无法查看实例数据");
    return;
  }
  if (!groupRowPageData.value) {
    await loadEntityGroupDataRows();
  }
  if (!entityRowDetailFromPage.value) {
    ElMessage.warning(groupRowError.value || "暂无实例数据，请先加载属性行");
    return;
  }
  entityRowDetailVisible.value = true;
}

/**
 * @description 重新拉取 page 数据以刷新实例详情弹框。
 */
async function reloadEntityRowDetailFromPage(): Promise<void> {
  await loadEntityGroupDataRows();
}

/**
 * @description 打开关系实例两侧实体的关联关系数据弹框，并组装 link_between 请求体。
 */
function openEntityLinkData(): void {
  const fromId = ontologyUniqueIdentifierFrom.value.trim();
  const toId = ontologyUniqueIdentifierTo.value.trim();
  const fromRow = selectedFromEntityRows.value[0] ?? null;
  const toRow = selectedToEntityRows.value[0] ?? null;
  if (!fromRow || fromRow.primaryKey === "") {
    ElMessage.warning(`请先选择 ${ontologyNameFrom.value || "From"} 实例`);
    return;
  }
  if (!toRow || toRow.primaryKey === "") {
    ElMessage.warning(`请先选择 ${ontologyNameTo.value || "To"} 实例`);
    return;
  }
  if (!fromId || !toId) {
    ElMessage.warning("关系两端对象标识缺失，无法查看实例关系数据");
    return;
  }
  entityLinkDataQueryParams.value = {
    ontologyUniqueIdentifierFrom: fromId,
    entityPrimaryKeyFrom: fromRow.primaryKey,
    ontologyUniqueIdentifierTo: toId,
    entityPrimaryKeyTo: toRow.primaryKey,
  };
  entityLinkDataVisible.value = true;
}

/**
 * @description 提交应用行为测试：组装 params / inputParams / outputParams / entityPrimaryKeys.from|to。
 */
async function submitApplicationBehaviorTest(): Promise<void> {
  const built = parameterConfig.buildParameterRequest();
  if (!built.ok) {
    submitError.value = built.error;
    ElMessage.warning(built.error);
    return;
  }
  const requestToken = ++submitToken;
  submitLoading.value = true;
  applicationTestResultText.value = "";
  try {
    const response = await postTestOntologyActionInterface(built.request);
    if (requestToken !== submitToken) return;
    if (response.code !== 200) throw new Error(response.message || "行为测试失败");
    applicationTestResultText.value = formatBasicOperatorTestResultData(response.data);
    const resultMessage = response.data?.message?.trim() || response.message || "行为测试成功";
    ElMessage.success(resultMessage);
  } catch (error) {
    if (requestToken !== submitToken) return;
    submitError.value = error instanceof Error ? error.message : "行为测试失败";
    ElMessage.error(submitError.value);
  } finally {
    if (requestToken === submitToken) submitLoading.value = false;
  }
}

/**
 * @description 提交行为测试：应用行为、属性值、基础函数算子或关系实例。
 */
async function submitBehaviorTest(): Promise<void> {
  if (submitLoading.value) return;
  submitError.value = "";
  if (isApplicationTest.value) {
    await submitApplicationBehaviorTest();
    return;
  }
  if (
    !props.behavior ||
    (!isRelationInstanceTest.value && !isBasicFunctionOperatorTest.value && !isCreateTest.value && !isUpdateTest.value && !isDeleteTest.value)
  ) {
    ElMessage.info("当前仅支持应用行为、属性值-新增/编辑/删除、基础函数算子或关系实例测试");
    return;
  }
  if (isRelationInstanceTest.value) {
    if (relationContextLoading.value || relationContextError.value) {
      ElMessage.warning("请等待关系信息加载完成后再测试");
      return;
    }
    const mountRow = selectedMountEntityRow.value;
    const oppositeRow = selectedOppositeEntityRow.value;
    if (!mountRow || mountRow.primaryKey === "") {
      ElMessage.warning("请先选择挂载侧实体实例");
      return;
    }
    if (!oppositeRow || oppositeRow.primaryKey === "") {
      ElMessage.warning("请先选择对端实体实例");
      return;
    }
    const actionApi = resolvedActionApi.value.trim() || (props.behavior.behaviorApiName ?? "").trim();
    const ontologySpaceId = props.spaceId.trim();
    if (!actionApi || !ontologySpaceId) {
      submitError.value = "缺少行为 api 或对象空间 id，无法测试";
      return;
    }
    const requestToken = ++submitToken;
    submitLoading.value = true;
    try {
      const response = await postTestOntologyActionInterface({
        ontologySpaceId,
        actionApi,
        entityPrimaryKey: mountRow.primaryKey,
        linkEntityPrimaryKey: oppositeRow.primaryKey,
      });
      if (requestToken !== submitToken) return;
      if (response.code !== 200) throw new Error(response.message || "行为测试失败");
      const resultMessage = response.data?.message?.trim() || response.message || "行为测试成功";
      ElMessage.success(resultMessage);
    } catch (error) {
      if (requestToken !== submitToken) return;
      submitError.value = error instanceof Error ? error.message : "行为测试失败";
      ElMessage.error(submitError.value);
    } finally {
      if (requestToken === submitToken) submitLoading.value = false;
    }
    return;
  }
  if (isBasicFunctionOperatorTest.value) {
    const actionApi = (props.behavior.behaviorApiName ?? "").trim();
    const ontologySpaceId = props.spaceId.trim();
    if (!actionApi || !ontologySpaceId) {
      submitError.value = "缺少行为 api 或对象空间 id，无法测试";
      return;
    }
    const requestToken = ++submitToken;
    submitLoading.value = true;
    basicOperatorTestResultText.value = "";
    try {
      const selectedPrimaryKey = selectedEntityPrimaryKey.value;
      const response = await postTestOntologyActionInterface({
        ontologySpaceId,
        actionApi,
        ...(selectedPrimaryKey === null ? {} : { entityPrimaryKey: selectedPrimaryKey }),
      });
      if (requestToken !== submitToken) return;
      if (response.code !== 200) throw new Error(response.message || "行为测试失败");
      basicOperatorTestResultText.value = formatBasicOperatorTestResultData(response.data);
      const resultMessage = response.data?.message?.trim() || response.message || "行为测试成功";
      ElMessage.success(resultMessage);
    } catch (error) {
      if (requestToken !== submitToken) return;
      submitError.value = error instanceof Error ? error.message : "行为测试失败";
      ElMessage.error(submitError.value);
    } finally {
      if (requestToken === submitToken) submitLoading.value = false;
    }
    return;
  }
  const selected = selectedEntityRow.value;
  if (!selected || selected.primaryKey === "") {
    ElMessage.warning("请先选择实体实例");
    return;
  }
  if (needsDataRowSelection.value) {
    if (groupRowLoading.value || groupRowError.value) {
      ElMessage.warning("请等待实体行数据加载完成后再测试");
      return;
    }
    if (!selectedGroupDataRow.value) {
      ElMessage.warning("请先选择数据行");
      return;
    }
  }
  const actionApi = resolvedActionApi.value.trim() || (props.behavior.behaviorApiName ?? "").trim();
  const ontologySpaceId = props.spaceId.trim();
  if (!actionApi || !ontologySpaceId) {
    submitError.value = "缺少行为 api 或对象空间 id，无法测试";
    return;
  }
  if (!isDeleteTest.value && (detailLoading.value || detailError.value)) {
    ElMessage.warning("请等待行为参数加载完成后再测试");
    return;
  }
  if (isDeleteTest.value && (detailLoading.value || detailError.value)) {
    ElMessage.warning("请等待行为详情加载完成后再测试");
    return;
  }
  let params: Record<string, unknown> | undefined;
  if (!isDeleteTest.value) {
    const paramsPayload = buildExternalParamsPayload();
    if ("error" in paramsPayload) {
      submitError.value = paramsPayload.error;
      ElMessage.warning(paramsPayload.error);
      return;
    }
    params = paramsPayload.params;
  }
  const requestToken = ++submitToken;
  submitLoading.value = true;
  try {
    const response = await postTestOntologyActionInterface({
      ontologySpaceId,
      actionApi,
      entityPrimaryKey: selected.primaryKey,
      ...(needsDataRowSelection.value && selectedGroupDataRow.value ? { dataPrimaryKey: selectedGroupDataRow.value.dataPrimaryKey } : {}),
      ...(params ? { params } : {}),
    });
    if (requestToken !== submitToken) return;
    if (response.code !== 200) throw new Error(response.message || "行为测试失败");
    const resultMessage = response.data?.message?.trim() || response.message || "行为测试成功";
    ElMessage.success(resultMessage);
    if (isUpdateTest.value) {
      resetParamValues(paramRows.value);
      await reloadEntityRowDetailFromPage();
    }
  } catch (error) {
    if (requestToken !== submitToken) return;
    submitError.value = error instanceof Error ? error.message : "行为测试失败";
    ElMessage.error(submitError.value);
  } finally {
    if (requestToken === submitToken) submitLoading.value = false;
  }
}

/** @description 销毁弹窗时使页面侧实体、数据行和测试请求的响应失效。 */
function disposeBehaviorTest(): void {
  entityLoadToken += 1;
  groupRowLoadToken += 1;
  submitToken += 1;
}

onScopeDispose(disposeBehaviorTest);

watch(
  () =>
    [
      props.modelValue,
      props.behavior?.id,
      props.behavior?.ontologyUniqIdentifier,
      props.spaceId,
      props.behavior?.basicAction,
      props.behavior?.valueType,
      props.behavior?.kind,
    ] as const,
  ([visible]) => {
    if (!visible) {
      parameterConfig.cancelParameterRequests();
      entityLoadToken += 1;
      detailLoadToken.value += 1;
      groupRowLoadToken += 1;
      relationContextLoadToken.value += 1;
      fromEntityLoadToken.value += 1;
      toEntityLoadToken.value += 1;
      submitToken += 1;
      submitLoading.value = false;
      clearApplicationTestResult();
      for (const key of Object.keys(applicationOntologyLoadTokens)) {
        applicationOntologyLoadTokens[key] = (applicationOntologyLoadTokens[key] ?? 0) + 1;
      }
      entityRowDetailVisible.value = false;
      entityLinkDataVisible.value = false;
      entityLinkDataQueryParams.value = {
        ontologyUniqueIdentifierFrom: "",
        entityPrimaryKeyFrom: "",
        ontologyUniqueIdentifierTo: "",
        entityPrimaryKeyTo: "",
      };
      clearEntityListState();
      clearDetailParamState();
      clearGroupDataRowState();
      clearRelationTestState();
      clearBasicOperatorTestResult();
      entityPage.value = 1;
      entityPageSize.value = 10;
      groupRowPage.value = 1;
      groupRowPageSize.value = 10;
      return;
    }
    parameterConfig.cancelParameterRequests();
    entityPage.value = 1;
    groupRowPage.value = 1;
    groupRowPageSize.value = 10;
    selectedEntityRowKey.value = "";
    selectedEntitySnapshot.value = null;
    selectedGroupDataRowKey.value = "";
    submitError.value = "";
    clearApplicationTestResult();
    clearGroupDataRowState();
    clearDetailParamState();
    clearRelationTestState();
    clearBasicOperatorTestResult();
    if (isApplicationTest.value) {
      void loadApplicationTestForm();
      return;
    }
    if (isRelationInstanceTest.value) {
      void loadRelationTestContext();
      return;
    }
    if (isBasicFunctionOperatorTest.value) {
      void loadEntityList();
      return;
    }
    void loadEntityList();
    if (isAttributeValueTest.value) {
      void loadBehaviorDetailParams();
    }
  },
);
</script>

<style scoped lang="scss">
.behavior-test-dialog__header {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding-right: 24px;
}
.behavior-test-dialog__title {
  color: var(--aircas-color-text-primary);
  font-size: 16px;
  font-weight: 600;
  line-height: 1.4;
}
.behavior-test-dialog__hint {
  margin: 0 0 12px;
  color: var(--aircas-color-text-secondary);
  font-size: 13px;
  line-height: 1.6;
}
.behavior-test-dialog__section {
  margin-bottom: 16px;
}
.behavior-test-dialog__section-title {
  margin: 0 0 8px;
  color: var(--aircas-color-text-primary);
  font-size: 14px;
  font-weight: 600;
  line-height: 1.4;
}
.behavior-test-dialog__state {
  margin: 0;
  color: var(--aircas-color-text-secondary);
  font-size: 13px;
  line-height: 1.6;
}
.behavior-test-dialog__table {
  width: 100%;
}
.behavior-test-dialog__pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}
.behavior-test-dialog__param-value-stack {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}
.behavior-test-dialog__param-draft-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  padding: 8px;
  border: 1px solid var(--aircas-color-border-light);
  border-radius: 4px;
  box-sizing: border-box;
}
.behavior-test-dialog__param-draft-actions {
  display: flex;
  justify-content: flex-start;
}
.behavior-test-dialog__entity-data-slot {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
}
.behavior-test-dialog__entity-data-slot-label {
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
  line-height: 1.4;
}
.behavior-test-dialog__binding-records {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
}
.behavior-test-dialog__binding-records-hint {
  margin: 0;
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
  line-height: 1.5;
}
.behavior-test-dialog__binding-records-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin: 0;
  padding: 0;
  list-style: none;
  width: 100%;
}
.behavior-test-dialog__binding-record {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 4px 8px;
  border: 1px solid var(--aircas-color-border-light);
  border-radius: 4px;
  background-color: var(--aircas-color-input-background);
}
.behavior-test-dialog__binding-record-label {
  flex: 1;
  min-width: 0;
  color: var(--aircas-color-text-primary);
  font-size: 12px;
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.behavior-test-dialog__entity-select {
  width: 100%;
}
.behavior-test-dialog__select-footer {
  display: flex;
  justify-content: center;
  padding: 4px 8px 8px;
}
.behavior-test-dialog__select-footer-error {
  margin: 0;
  padding: 4px 8px 8px;
  color: var(--aircas-color-danger, #f56c6c);
  font-size: 12px;
  line-height: 1.5;
}
.behavior-test-dialog__result {
  width: 100%;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
  line-height: 1.5;
}
</style>
