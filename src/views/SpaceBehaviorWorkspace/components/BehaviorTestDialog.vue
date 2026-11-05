<template>
  <el-dialog
    :model-value="modelValue"
    :title="dialogTitle"
    width="760px"
    append-to-body
    destroy-on-close
    :close-on-click-modal="false"
    @close="emit('update:modelValue', false)"
  >
    <p class="behavior-test-dialog__hint">{{ dialogHint }}</p>

    <section class="behavior-test-dialog__section">
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

    <section v-if="needsDataRowSelection" class="behavior-test-dialog__section">
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
            <el-radio :model-value="selectedGroupDataRowKey" :value="asGroupDataRow(row).rowKey" @change="selectGroupDataRow(asGroupDataRow(row))" />
          </template>
        </el-table-column>
        <el-table-column prop="storageGroup" label="存储分组" min-width="120" show-overflow-tooltip />
        <el-table-column prop="dataPrimaryKeyLabel" label="数据行主键" min-width="140" show-overflow-tooltip />
        <el-table-column prop="propertySummary" label="属性摘要" min-width="220" show-overflow-tooltip />
      </el-table>
    </section>

    <section v-if="!isDeleteTest" class="behavior-test-dialog__section">
      <h4 class="behavior-test-dialog__section-title">测试参数</h4>
      <p v-if="detailLoading" class="behavior-test-dialog__state" role="status">正在加载行为参数…</p>
      <p v-else-if="detailError" class="behavior-test-dialog__state" role="alert">{{ detailError }}</p>
      <el-table v-else-if="paramRows.length" class="behavior-test-dialog__table" :data="paramRows" row-key="rowKey" size="small">
        <el-table-column prop="propertyDisplayName" label="属性名称" min-width="140" show-overflow-tooltip />
        <el-table-column prop="propertyType" label="类型" width="120" show-overflow-tooltip />
        <el-table-column label="参数值" min-width="220">
          <template #default="{ row }">
            <el-input
              :model-value="paramValues[asParamRow(row).paramName] ?? ''"
              :placeholder="`请输入 ${asParamRow(row).propertyDisplayName || asParamRow(row).paramName}`"
              clearable
              @update:model-value="updateParamValue(asParamRow(row).paramName, $event)"
            />
          </template>
        </el-table-column>
      </el-table>
      <p v-else class="behavior-test-dialog__state" role="status">暂无外部输入参数</p>
    </section>
    <p v-else-if="detailError" class="behavior-test-dialog__state" role="alert">{{ detailError }}</p>

    <p v-if="submitError" class="behavior-test-dialog__state" role="alert">{{ submitError }}</p>

    <template #footer>
      <el-button :disabled="submitLoading" @click="openEntityRowDetail">查看实例数据</el-button>
      <el-button :disabled="submitLoading" @click="emit('update:modelValue', false)">关闭</el-button>
      <el-button type="primary" :loading="submitLoading" @click="submitBehaviorTest">开始测试</el-button>
    </template>
  </el-dialog>

  <BehaviorEntityRowDetailDialog
    v-model="entityRowDetailVisible"
    :ontology-unique-identifier="behaviorOntologyUniqueIdentifier"
    :entity-primary-key="selectedEntityPrimaryKey"
    :entity-display-name="selectedEntityDisplayName"
  />
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import { getOntologyActionInfoInterface, getOntologyEntitiesInterface, postGetOntologyEntityRowDetailInterface, postTestOntologyActionInterface } from "@/apis";
import type { OntologyEntityInfo, SpaceBehaviorItem } from "@/types";
import BehaviorEntityRowDetailDialog from "./BehaviorEntityRowDetailDialog.vue";
import { coerceBehaviorTestParamValue } from "../utils/coerceBehaviorTestParamValue";
import { mapOntologyEntityRowDetailToDataRows, type BehaviorTestEntityDataRow } from "../utils/mapOntologyEntityRowDetailToDataRows";
import { mapOntologyActionInfoToViewState, type SpaceBehaviorActionInfoViewParamRow } from "../utils/mapOntologyActionInfoToViewState";

/** 测试弹窗实体表格行。 */
interface BehaviorTestEntityRow {
  rowKey: string;
  displayName: string;
  primaryKeyLabel: string;
  ontologyName: string;
  propertySummary: string;
  primaryKey: string | number;
  raw: OntologyEntityInfo;
}

/** 测试弹窗外部输入参数行。 */
interface BehaviorTestParamRow {
  rowKey: string;
  /** params 提交用的参数名（parameterName）。 */
  paramName: string;
  /** 属性展示名称。 */
  propertyDisplayName: string;
  /** 属性类型。 */
  propertyType: string;
}

const props = defineProps<{
  modelValue: boolean;
  spaceId: string;
  behavior: SpaceBehaviorItem | null;
}>();

const emit = defineEmits<{ "update:modelValue": [value: boolean] }>();

const entityLoading = ref(false);
const entityError = ref("");
const entityRows = ref<BehaviorTestEntityRow[]>([]);
const entityTotal = ref(0);
const entityPage = ref(1);
const entityPageSize = ref(10);
const selectedEntityRowKey = ref("");
let entityLoadToken = 0;

const detailLoading = ref(false);
const detailError = ref("");
const paramRows = ref<BehaviorTestParamRow[]>([]);
const paramValues = reactive<Record<string, string>>({});
const resolvedActionApi = ref("");
const resolvedStorageGroup = ref("");
let detailLoadToken = 0;

const submitLoading = ref(false);
const submitError = ref("");
let submitToken = 0;

const entityRowDetailVisible = ref(false);

const groupRowLoading = ref(false);
const groupRowError = ref("");
const groupDataRows = ref<BehaviorTestEntityDataRow[]>([]);
const selectedGroupDataRowKey = ref("");
let groupRowLoadToken = 0;

const dialogTitle = computed(() => {
  const name = props.behavior?.displayName.trim() || "行为";
  return `测试行为 · ${name}`;
});

const isCreateTest = computed(() => props.behavior?.basicAction === "create");
const isUpdateTest = computed(() => props.behavior?.basicAction === "update");
const isDeleteTest = computed(() => props.behavior?.basicAction === "delete");
const needsDataRowSelection = computed(() => isUpdateTest.value || isDeleteTest.value);

const dialogHint = computed(() => {
  if (isUpdateTest.value) return "选择实体实例与数据行，并填写外部输入参数，用于属性值-编辑测试。";
  if (isDeleteTest.value) return "选择实体实例与数据行，用于属性值-删除测试。";
  return "选择实体实例并填写外部输入参数，用于属性值-新增测试。";
});

const behaviorOntologyUniqueIdentifier = computed(() => (props.behavior?.ontologyUniqIdentifier ?? "").trim());

const selectedEntityRow = computed(() => entityRows.value.find((item) => item.rowKey === selectedEntityRowKey.value) ?? null);

const selectedEntityPrimaryKey = computed(() => {
  const primaryKey = selectedEntityRow.value?.primaryKey;
  if (primaryKey === undefined || primaryKey === null || primaryKey === "") return null;
  return primaryKey;
});

const selectedEntityDisplayName = computed(() => selectedEntityRow.value?.displayName ?? "");

const selectedGroupDataRow = computed(() => groupDataRows.value.find((item) => item.rowKey === selectedGroupDataRowKey.value) ?? null);

/**
 * @description 将未知主键值格式化为表格文案。
 * @param value 主键值。
 * @returns 展示文案。
 */
function formatPrimaryKeyLabel(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

/**
 * @description 从实体记录读取显示名称。
 * @param record 实体记录。
 * @returns 显示名称。
 */
function readEntityDisplayName(record: OntologyEntityInfo): string {
  const direct = typeof record.displayName === "string" ? record.displayName.trim() : "";
  if (direct) return direct;
  const properties = record.properties;
  if (properties && typeof properties === "object" && !Array.isArray(properties)) {
    const name = properties.name;
    if (typeof name === "string" && name.trim()) return name.trim();
  }
  return "—";
}

/**
 * @description 从实体记录读取对象名称。
 * @param record 实体记录。
 * @returns 对象名称。
 */
function readEntityOntologyName(record: OntologyEntityInfo): string {
  const direct = typeof record.ontologyName === "string" ? record.ontologyName.trim() : "";
  return direct || "—";
}

/**
 * @description 从实体记录读取主键。
 * @param record 实体记录。
 * @returns 主键值。
 */
function readEntityPrimaryKey(record: OntologyEntityInfo): string | number {
  if (record.entityPrimaryKey !== undefined && record.entityPrimaryKey !== null && record.entityPrimaryKey !== "") {
    return record.entityPrimaryKey;
  }
  if (record.primaryKey !== undefined && record.primaryKey !== null && record.primaryKey !== "") {
    const primaryKey = record.primaryKey;
    if (typeof primaryKey === "string" || typeof primaryKey === "number") return primaryKey;
    return formatPrimaryKeyLabel(primaryKey);
  }
  if (record.id !== undefined && record.id !== null && record.id !== "") return record.id;
  return "";
}

/**
 * @description 汇总实体主属性为短文案。
 * @param record 实体记录。
 * @returns 摘要。
 */
function buildEntityPropertySummary(record: OntologyEntityInfo): string {
  const properties = record.properties;
  if (!properties || typeof properties !== "object") return "—";
  if (Array.isArray(properties)) {
    return properties.length ? `${properties.length} 项属性` : "—";
  }
  const entries = Object.entries(properties)
    .filter(([, value]) => value !== null && value !== undefined && String(value).trim() !== "")
    .slice(0, 3)
    .map(([key, value]) => `${key}=${formatPrimaryKeyLabel(value)}`);
  return entries.length ? entries.join("；") : "—";
}

/**
 * @description 将接口实体记录映射为表格行。
 * @param record 实体记录。
 * @param index 行序号。
 * @returns 表格行。
 */
function mapEntityRecordToRow(record: OntologyEntityInfo, index: number): BehaviorTestEntityRow {
  const primaryKey = readEntityPrimaryKey(record);
  const rowKey = String(primaryKey || record.id || `entity-${index}`);
  return {
    rowKey,
    displayName: readEntityDisplayName(record),
    primaryKeyLabel: formatPrimaryKeyLabel(primaryKey) || "—",
    ontologyName: readEntityOntologyName(record),
    propertySummary: buildEntityPropertySummary(record),
    primaryKey,
    raw: record,
  };
}

/**
 * @description 将查看态入参行映射为测试参数行；仅保留外部输入。
 * @param rows 查看态入参行。
 * @returns 外部输入参数行。
 */
function mapExternalParamRows(rows: SpaceBehaviorActionInfoViewParamRow[]): BehaviorTestParamRow[] {
  return rows
    .filter((item) => item.sourceType === "EXTERNAL")
    .map((item) => {
      const paramName = item.paramName;
      const propertyDisplayName = item.propertyDisplayName.trim() || paramName;
      const propertyType = item.propertyType.trim() || item.paramType || "—";
      return {
        rowKey: item.rowKey,
        paramName,
        propertyDisplayName,
        propertyType,
      };
    })
    .filter((item) => item.paramName && item.paramName !== "—");
}

/**
 * @description 重置参数输入值。
 * @param rows 外部输入参数行。
 */
function resetParamValues(rows: BehaviorTestParamRow[]): void {
  Object.keys(paramValues).forEach((key) => {
    delete paramValues[key];
  });
  rows.forEach((row) => {
    paramValues[row.paramName] = "";
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
}

/**
 * @description 清空详情参数与提交态。
 */
function clearDetailParamState(): void {
  paramRows.value = [];
  resetParamValues([]);
  detailError.value = "";
  detailLoading.value = false;
  resolvedActionApi.value = "";
  resolvedStorageGroup.value = "";
  submitError.value = "";
  submitLoading.value = false;
}

/**
 * @description 清空实体行数据选择态。
 */
function clearGroupDataRowState(): void {
  groupDataRows.value = [];
  groupRowError.value = "";
  groupRowLoading.value = false;
  selectedGroupDataRowKey.value = "";
}

/**
 * @description 将表格行收窄为测试实体行类型。
 * @param row 表格行。
 * @returns 实体行。
 */
function asEntityRow(row: unknown): BehaviorTestEntityRow {
  return row as BehaviorTestEntityRow;
}

/**
 * @description 将表格行收窄为测试参数行类型。
 * @param row 表格行。
 * @returns 参数行。
 */
function asParamRow(row: unknown): BehaviorTestParamRow {
  return row as BehaviorTestParamRow;
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
 * @description 单选实体行；编辑测试时触发加载数据行。
 * @param row 实体行。
 */
function selectEntityRow(row: BehaviorTestEntityRow): void {
  selectedEntityRowKey.value = row.rowKey;
  selectedGroupDataRowKey.value = "";
  if (needsDataRowSelection.value) void loadEntityGroupDataRows();
}

/**
 * @description 点击实体行时同步单选。
 * @param row 表格行。
 */
function handleEntityRowClick(row: unknown): void {
  selectEntityRow(asEntityRow(row));
}

/**
 * @description 单选实体属性数据行。
 * @param row 数据行。
 */
function selectGroupDataRow(row: BehaviorTestEntityDataRow): void {
  selectedGroupDataRowKey.value = row.rowKey;
}

/**
 * @description 点击数据行时同步单选。
 * @param row 表格行。
 */
function handleGroupDataRowClick(row: unknown): void {
  selectGroupDataRow(asGroupDataRow(row));
}

/**
 * @description 更新外部输入参数值。
 * @param paramName 参数名。
 * @param value 输入值。
 */
function updateParamValue(paramName: string, value: string): void {
  paramValues[paramName] = value;
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
    if (selectedEntityRowKey.value && !entityRows.value.some((item) => item.rowKey === selectedEntityRowKey.value)) {
      selectedEntityRowKey.value = "";
      clearGroupDataRowState();
    }
  } catch (error) {
    if (requestToken !== entityLoadToken) return;
    entityRows.value = [];
    entityTotal.value = 0;
    entityError.value = error instanceof Error ? error.message : "实体列表加载失败";
    clearGroupDataRowState();
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
  const requestToken = ++detailLoadToken;
  detailLoading.value = true;
  detailError.value = "";
  submitError.value = "";
  try {
    const response = await getOntologyActionInfoInterface({ actionApi, ontologySpaceId });
    if (requestToken !== detailLoadToken) return;
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
    if (requestToken !== detailLoadToken) return;
    paramRows.value = [];
    resetParamValues([]);
    resolvedActionApi.value = "";
    resolvedStorageGroup.value = "";
    detailError.value = error instanceof Error ? error.message : "行为详情加载失败";
  } finally {
    if (requestToken === detailLoadToken) detailLoading.value = false;
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
 * @description 按所选实体加载属性行详情并扁平为可选数据行。
 */
async function loadEntityGroupDataRows(): Promise<void> {
  if (!needsDataRowSelection.value) {
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
  try {
    const response = await postGetOntologyEntityRowDetailInterface({
      ontologyUniqueIdentifier,
      entityPrimaryKey,
      sort: "DESC",
    });
    if (requestToken !== groupRowLoadToken) return;
    if (response.code !== 200) throw new Error(response.message || "实体行数据加载失败");
    groupDataRows.value = mapOntologyEntityRowDetailToDataRows(response.data, storageGroup);
    if (selectedGroupDataRowKey.value && !groupDataRows.value.some((item) => item.rowKey === selectedGroupDataRowKey.value)) {
      selectedGroupDataRowKey.value = "";
    }
  } catch (error) {
    if (requestToken !== groupRowLoadToken) return;
    groupDataRows.value = [];
    selectedGroupDataRowKey.value = "";
    groupRowError.value = error instanceof Error ? error.message : "实体行数据加载失败";
  } finally {
    if (requestToken === groupRowLoadToken) groupRowLoading.value = false;
  }
}

/**
 * @description 打开所选实体的属性行详情弹框。
 */
function openEntityRowDetail(): void {
  if (selectedEntityPrimaryKey.value === null) {
    ElMessage.warning("请先选择实体实例");
    return;
  }
  if (!behaviorOntologyUniqueIdentifier.value) {
    ElMessage.warning("当前行为缺少对象标识，无法查看实例数据");
    return;
  }
  entityRowDetailVisible.value = true;
}

/**
 * @description 按属性类型组装外部输入 params；失败时返回错误文案。
 * @returns 成功时返回 params；失败时返回 error。
 */
function buildExternalParamsPayload(): { params: Record<string, unknown> } | { error: string } {
  const payload: Record<string, unknown> = {};
  for (const row of paramRows.value) {
    const rawValue = paramValues[row.paramName] ?? "";
    const coerced = coerceBehaviorTestParamValue(rawValue, row.propertyType, row.propertyDisplayName || row.paramName);
    if (!coerced.ok) return { error: coerced.error };
    payload[row.paramName] = coerced.value;
  }
  return { params: payload };
}

/**
 * @description 提交属性值新增/编辑/删除行为测试。
 */
async function submitBehaviorTest(): Promise<void> {
  if (submitLoading.value) return;
  submitError.value = "";
  if (!props.behavior || (!isCreateTest.value && !isUpdateTest.value && !isDeleteTest.value)) {
    ElMessage.info("当前仅支持属性值-新增/编辑/删除测试");
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
    if (response.data?.result?.trim()) {
      ElMessage.info(response.data.result.trim());
    }
  } catch (error) {
    if (requestToken !== submitToken) return;
    submitError.value = error instanceof Error ? error.message : "行为测试失败";
    ElMessage.error(submitError.value);
  } finally {
    if (requestToken === submitToken) submitLoading.value = false;
  }
}

watch(
  () => [props.modelValue, props.behavior?.id, props.behavior?.ontologyUniqIdentifier, props.spaceId, props.behavior?.basicAction] as const,
  ([visible]) => {
    if (!visible) {
      entityLoadToken += 1;
      detailLoadToken += 1;
      groupRowLoadToken += 1;
      submitToken += 1;
      entityRowDetailVisible.value = false;
      clearEntityListState();
      clearDetailParamState();
      clearGroupDataRowState();
      entityPage.value = 1;
      entityPageSize.value = 10;
      return;
    }
    entityPage.value = 1;
    selectedEntityRowKey.value = "";
    selectedGroupDataRowKey.value = "";
    submitError.value = "";
    clearGroupDataRowState();
    void loadEntityList();
    void loadBehaviorDetailParams();
  },
);
</script>

<style scoped lang="scss">
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
</style>
