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

    <template v-if="isRelationInstanceTest">
      <section class="behavior-test-dialog__section">
        <h4 class="behavior-test-dialog__section-title">关系两端对象</h4>
        <p v-if="relationContextLoading" class="behavior-test-dialog__state" role="status">正在加载关系信息…</p>
        <p v-else-if="relationContextError" class="behavior-test-dialog__state" role="alert">{{ relationContextError }}</p>
        <p v-else class="behavior-test-dialog__state" role="status">{{ ontologyNameFrom || "—" }} → {{ ontologyNameTo || "—" }}</p>
      </section>

      <section v-if="!relationContextLoading && !relationContextError" class="behavior-test-dialog__section">
        <h4 class="behavior-test-dialog__section-title">选择 {{ ontologyNameFrom || "From" }} 实例</h4>
        <p v-if="fromEntityLoading" class="behavior-test-dialog__state" role="status">正在加载实体列表…</p>
        <p v-else-if="fromEntityError" class="behavior-test-dialog__state" role="alert">{{ fromEntityError }}</p>
        <template v-else>
          <el-table
            class="behavior-test-dialog__table"
            :data="fromEntityRows"
            row-key="rowKey"
            size="small"
            highlight-current-row
            :empty-text="fromEntityRows.length ? undefined : '暂无实体实例'"
            @row-click="handleFromEntityRowClick"
          >
            <el-table-column width="48" align="center">
              <template #default="{ row }">
                <el-radio :model-value="selectedFromEntityRowKey" :value="asEntityRow(row).rowKey" @change="selectFromEntityRow(asEntityRow(row))" />
              </template>
            </el-table-column>
            <el-table-column prop="displayName" label="实体名称" min-width="160" show-overflow-tooltip />
            <el-table-column prop="primaryKeyLabel" label="实体主键" min-width="160" show-overflow-tooltip />
            <el-table-column prop="propertySummary" label="主属性摘要" min-width="200" show-overflow-tooltip />
          </el-table>
          <div class="behavior-test-dialog__pagination">
            <el-pagination
              background
              layout="total, prev, pager, next, sizes"
              :total="fromEntityTotal"
              :current-page="fromEntityPage"
              :page-size="fromEntityPageSize"
              :page-sizes="[10, 20, 50]"
              @current-change="changeFromEntityPage"
              @size-change="changeFromEntityPageSize"
            />
          </div>
        </template>
      </section>

      <section v-if="!relationContextLoading && !relationContextError" class="behavior-test-dialog__section">
        <h4 class="behavior-test-dialog__section-title">选择 {{ ontologyNameTo || "To" }} 实例</h4>
        <p v-if="toEntityLoading" class="behavior-test-dialog__state" role="status">正在加载实体列表…</p>
        <p v-else-if="toEntityError" class="behavior-test-dialog__state" role="alert">{{ toEntityError }}</p>
        <template v-else>
          <el-table
            class="behavior-test-dialog__table"
            :data="toEntityRows"
            row-key="rowKey"
            size="small"
            highlight-current-row
            :empty-text="toEntityRows.length ? undefined : '暂无实体实例'"
            @row-click="handleToEntityRowClick"
          >
            <el-table-column width="48" align="center">
              <template #default="{ row }">
                <el-radio :model-value="selectedToEntityRowKey" :value="asEntityRow(row).rowKey" @change="selectToEntityRow(asEntityRow(row))" />
              </template>
            </el-table-column>
            <el-table-column prop="displayName" label="实体名称" min-width="160" show-overflow-tooltip />
            <el-table-column prop="primaryKeyLabel" label="实体主键" min-width="160" show-overflow-tooltip />
            <el-table-column prop="propertySummary" label="主属性摘要" min-width="200" show-overflow-tooltip />
          </el-table>
          <div class="behavior-test-dialog__pagination">
            <el-pagination
              background
              layout="total, prev, pager, next, sizes"
              :total="toEntityTotal"
              :current-page="toEntityPage"
              :page-size="toEntityPageSize"
              :page-sizes="[10, 20, 50]"
              @current-change="changeToEntityPage"
              @size-change="changeToEntityPageSize"
            />
          </div>
        </template>
      </section>
    </template>

    <section v-else-if="!isBasicFunctionOperatorTest" class="behavior-test-dialog__section">
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
        <el-table-column prop="propertySummary" label="属性摘要" min-width="220" show-overflow-tooltip />
      </el-table>
    </section>

    <section v-if="isAttributeValueTest && !isDeleteTest" class="behavior-test-dialog__section">
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
    <p v-else-if="isAttributeValueTest && detailError" class="behavior-test-dialog__state" role="alert">{{ detailError }}</p>

    <p v-if="submitError" class="behavior-test-dialog__state" role="alert">{{ submitError }}</p>

    <template #footer>
      <el-button v-if="isRelationInstanceTest" :disabled="submitLoading" @click="openEntityLinkData">查看实例关系数据</el-button>
      <el-button v-else-if="!isBasicFunctionOperatorTest" :disabled="submitLoading" @click="openEntityRowDetail">查看实例数据</el-button>
      <el-button :disabled="submitLoading" @click="emit('update:modelValue', false)">关闭</el-button>
      <el-button type="primary" :loading="submitLoading" @click="submitBehaviorTest">开始测试</el-button>
    </template>
  </el-dialog>

  <BehaviorEntityRowDetailDialog
    v-model="entityRowDetailVisible"
    :ontology-unique-identifier="detailOntologyUniqueIdentifier"
    :entity-primary-key="detailEntityPrimaryKey"
    :entity-display-name="detailEntityDisplayName"
  />

  <BehaviorEntityLinkDataDialog v-model="entityLinkDataVisible" :query-params="entityLinkDataQueryParams" />
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import {
  getOntologyActionInfoInterface,
  getOntologyEntitiesInterface,
  getOntologyLinkByUniqueIdentifierInterface,
  postGetOntologyEntityRowDetailInterface,
  postTestOntologyActionInterface,
} from "@/apis";
import type { OntologyEntityInfo, PostOntologyEntityAllLinkParams, SpaceBehaviorItem } from "@/types";
import BehaviorEntityLinkDataDialog from "./BehaviorEntityLinkDataDialog.vue";
import BehaviorEntityRowDetailDialog from "./BehaviorEntityRowDetailDialog.vue";
import { coerceBehaviorTestParamValue } from "../utils/coerceBehaviorTestParamValue";
import { mapOntologyEntityRowDetailToDataRows, type BehaviorTestEntityDataRow } from "../utils/mapOntologyEntityRowDetailToDataRows";
import { mapOntologyActionInfoToViewState, type SpaceBehaviorActionInfoViewParamRow } from "../utils/mapOntologyActionInfoToViewState";
import { isMainStorageGroup } from "../utils/resolveAttributeValueSelection";

/** 关系实例测试挂载侧。 */
type RelationMountSide = "from" | "to" | "";

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
const selectedGroupDataRowKey = ref("");
let groupRowLoadToken = 0;

const relationContextLoading = ref(false);
const relationContextError = ref("");
const ontologyLinkUniqIdentifier = ref("");
const ontologyNameFrom = ref("");
const ontologyNameTo = ref("");
const ontologyUniqueIdentifierFrom = ref("");
const ontologyUniqueIdentifierTo = ref("");
const relationMountSide = ref<RelationMountSide>("");
let relationContextLoadToken = 0;

const fromEntityLoading = ref(false);
const fromEntityError = ref("");
const fromEntityRows = ref<BehaviorTestEntityRow[]>([]);
const fromEntityTotal = ref(0);
const fromEntityPage = ref(1);
const fromEntityPageSize = ref(10);
const selectedFromEntityRowKey = ref("");
let fromEntityLoadToken = 0;

const toEntityLoading = ref(false);
const toEntityError = ref("");
const toEntityRows = ref<BehaviorTestEntityRow[]>([]);
const toEntityTotal = ref(0);
const toEntityPage = ref(1);
const toEntityPageSize = ref(10);
const selectedToEntityRowKey = ref("");
let toEntityLoadToken = 0;

const dialogTitle = computed(() => {
  const name = props.behavior?.displayName.trim() || "行为";
  return `测试行为 · ${name}`;
});

const isBasicFunctionOperatorTest = computed(() => props.behavior?.valueType === "basicFunctionOperator");
const isAttributeValueTest = computed(() => props.behavior?.valueType === "attributeValue");
const isRelationInstanceTest = computed(() => props.behavior?.valueType === "relationInstance");
const isCreateTest = computed(() => isAttributeValueTest.value && props.behavior?.basicAction === "create");
const isUpdateTest = computed(() => isAttributeValueTest.value && props.behavior?.basicAction === "update");
const isDeleteTest = computed(() => isAttributeValueTest.value && props.behavior?.basicAction === "delete");
const needsDataRowSelection = computed(() => isUpdateTest.value || isDeleteTest.value);
/** 属性值-编辑且存储分组为 main 时，数据行默认勾选且不可取消。 */
const isMainGroupDataRowLocked = computed(() => isUpdateTest.value && isMainStorageGroup(resolvedStorageGroup.value));

const dialogHint = computed(() => {
  if (isRelationInstanceTest.value) return "选择关系两端对象实例后执行关系实例测试。";
  if (isBasicFunctionOperatorTest.value) return "确认后直接执行基础函数算子测试。";
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

const selectedFromEntityRow = computed(() => fromEntityRows.value.find((item) => item.rowKey === selectedFromEntityRowKey.value) ?? null);
const selectedToEntityRow = computed(() => toEntityRows.value.find((item) => item.rowKey === selectedToEntityRowKey.value) ?? null);

const selectedMountEntityRow = computed(() => {
  if (relationMountSide.value === "from") return selectedFromEntityRow.value;
  if (relationMountSide.value === "to") return selectedToEntityRow.value;
  return null;
});

const selectedOppositeEntityRow = computed(() => {
  if (relationMountSide.value === "from") return selectedToEntityRow.value;
  if (relationMountSide.value === "to") return selectedFromEntityRow.value;
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
 * @description 清空关系实例测试上下文与双端实体列表。
 */
function clearRelationTestState(): void {
  relationContextLoading.value = false;
  relationContextError.value = "";
  ontologyLinkUniqIdentifier.value = "";
  ontologyNameFrom.value = "";
  ontologyNameTo.value = "";
  ontologyUniqueIdentifierFrom.value = "";
  ontologyUniqueIdentifierTo.value = "";
  relationMountSide.value = "";
  fromEntityRows.value = [];
  fromEntityTotal.value = 0;
  fromEntityError.value = "";
  fromEntityLoading.value = false;
  fromEntityPage.value = 1;
  fromEntityPageSize.value = 10;
  selectedFromEntityRowKey.value = "";
  toEntityRows.value = [];
  toEntityTotal.value = 0;
  toEntityError.value = "";
  toEntityLoading.value = false;
  toEntityPage.value = 1;
  toEntityPageSize.value = 10;
  selectedToEntityRowKey.value = "";
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
 * @description 单选关系 From 侧实体行。
 * @param row 实体行。
 */
function selectFromEntityRow(row: BehaviorTestEntityRow): void {
  selectedFromEntityRowKey.value = row.rowKey;
}

/**
 * @description 点击 From 实体行时同步单选。
 * @param row 表格行。
 */
function handleFromEntityRowClick(row: unknown): void {
  selectFromEntityRow(asEntityRow(row));
}

/**
 * @description 单选关系 To 侧实体行。
 * @param row 实体行。
 */
function selectToEntityRow(row: BehaviorTestEntityRow): void {
  selectedToEntityRowKey.value = row.rowKey;
}

/**
 * @description 点击 To 实体行时同步单选。
 * @param row 表格行。
 */
function handleToEntityRowClick(row: unknown): void {
  selectToEntityRow(asEntityRow(row));
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
 * @description 按对象标识分页加载关系 From 侧实体列表。
 */
async function loadFromEntityList(): Promise<void> {
  const ontologyUniqueIdentifier = ontologyUniqueIdentifierFrom.value.trim();
  if (!ontologyUniqueIdentifier) {
    fromEntityRows.value = [];
    fromEntityTotal.value = 0;
    fromEntityError.value = "关系缺少 From 对象标识，无法加载实体列表";
    return;
  }
  const requestToken = ++fromEntityLoadToken;
  fromEntityLoading.value = true;
  fromEntityError.value = "";
  try {
    const response = await getOntologyEntitiesInterface({
      ontologyUniqueIdentifier,
      pageNum: fromEntityPage.value,
      pageSize: fromEntityPageSize.value,
    });
    if (requestToken !== fromEntityLoadToken) return;
    if (response.code !== 200 || !response.data) throw new Error(response.message || "实体列表加载失败");
    const records = Array.isArray(response.data.records) ? response.data.records : [];
    fromEntityRows.value = records.map((item, index) => mapEntityRecordToRow(item, index));
    fromEntityTotal.value = Number(response.data.total) || records.length;
    if (selectedFromEntityRowKey.value && !fromEntityRows.value.some((item) => item.rowKey === selectedFromEntityRowKey.value)) {
      selectedFromEntityRowKey.value = "";
    }
  } catch (error) {
    if (requestToken !== fromEntityLoadToken) return;
    fromEntityRows.value = [];
    fromEntityTotal.value = 0;
    fromEntityError.value = error instanceof Error ? error.message : "实体列表加载失败";
  } finally {
    if (requestToken === fromEntityLoadToken) fromEntityLoading.value = false;
  }
}

/**
 * @description 按对象标识分页加载关系 To 侧实体列表。
 */
async function loadToEntityList(): Promise<void> {
  const ontologyUniqueIdentifier = ontologyUniqueIdentifierTo.value.trim();
  if (!ontologyUniqueIdentifier) {
    toEntityRows.value = [];
    toEntityTotal.value = 0;
    toEntityError.value = "关系缺少 To 对象标识，无法加载实体列表";
    return;
  }
  const requestToken = ++toEntityLoadToken;
  toEntityLoading.value = true;
  toEntityError.value = "";
  try {
    const response = await getOntologyEntitiesInterface({
      ontologyUniqueIdentifier,
      pageNum: toEntityPage.value,
      pageSize: toEntityPageSize.value,
    });
    if (requestToken !== toEntityLoadToken) return;
    if (response.code !== 200 || !response.data) throw new Error(response.message || "实体列表加载失败");
    const records = Array.isArray(response.data.records) ? response.data.records : [];
    toEntityRows.value = records.map((item, index) => mapEntityRecordToRow(item, index));
    toEntityTotal.value = Number(response.data.total) || records.length;
    if (selectedToEntityRowKey.value && !toEntityRows.value.some((item) => item.rowKey === selectedToEntityRowKey.value)) {
      selectedToEntityRowKey.value = "";
    }
  } catch (error) {
    if (requestToken !== toEntityLoadToken) return;
    toEntityRows.value = [];
    toEntityTotal.value = 0;
    toEntityError.value = error instanceof Error ? error.message : "实体列表加载失败";
  } finally {
    if (requestToken === toEntityLoadToken) toEntityLoading.value = false;
  }
}

/**
 * @description 切换 From 实体列表页码。
 * @param page 页码。
 */
function changeFromEntityPage(page: number): void {
  fromEntityPage.value = page;
  void loadFromEntityList();
}

/**
 * @description 切换 From 实体列表每页条数。
 * @param size 每页条数。
 */
function changeFromEntityPageSize(size: number): void {
  fromEntityPageSize.value = size;
  fromEntityPage.value = 1;
  void loadFromEntityList();
}

/**
 * @description 切换 To 实体列表页码。
 * @param page 页码。
 */
function changeToEntityPage(page: number): void {
  toEntityPage.value = page;
  void loadToEntityList();
}

/**
 * @description 切换 To 实体列表每页条数。
 * @param size 每页条数。
 */
function changeToEntityPageSize(size: number): void {
  toEntityPageSize.value = size;
  toEntityPage.value = 1;
  void loadToEntityList();
}

/**
 * @description 加载关系实例测试上下文：行为详情取 link id，再查关系两端并加载实体列表。
 */
async function loadRelationTestContext(): Promise<void> {
  const actionApi = (props.behavior?.behaviorApiName ?? "").trim();
  const ontologySpaceId = props.spaceId.trim();
  const mountOntologyId = behaviorOntologyUniqueIdentifier.value;
  if (!actionApi) {
    clearRelationTestState();
    relationContextError.value = "当前行为缺少 apiName，无法加载关系信息";
    return;
  }
  if (!ontologySpaceId) {
    clearRelationTestState();
    relationContextError.value = "缺少对象空间 id，无法加载关系信息";
    return;
  }
  const requestToken = ++relationContextLoadToken;
  relationContextLoading.value = true;
  relationContextError.value = "";
  submitError.value = "";
  try {
    const detailResponse = await getOntologyActionInfoInterface({ actionApi, ontologySpaceId });
    if (requestToken !== relationContextLoadToken) return;
    if (detailResponse.code !== 200 || !detailResponse.data) throw new Error(detailResponse.message || "行为详情加载失败");
    resolvedActionApi.value = (detailResponse.data.actionApi ?? "").trim() || actionApi;
    const linkId = (detailResponse.data.linkMapping?.ontologyLinkUniqIdentifier ?? "").trim();
    if (!linkId) throw new Error("行为未配置关系唯一标识，无法测试");
    ontologyLinkUniqIdentifier.value = linkId;
    const linkResponse = await getOntologyLinkByUniqueIdentifierInterface({ uniqueIdentifier: linkId });
    if (requestToken !== relationContextLoadToken) return;
    if (linkResponse.code !== 200 || !linkResponse.data) throw new Error(linkResponse.message || "关系详情加载失败");
    const linkData = linkResponse.data;
    ontologyNameFrom.value = (linkData.ontologyNameFrom ?? "").trim();
    ontologyNameTo.value = (linkData.ontologyNameTo ?? "").trim();
    ontologyUniqueIdentifierFrom.value = (linkData.ontologyUniqueIdentifierFrom ?? "").trim();
    ontologyUniqueIdentifierTo.value = (linkData.ontologyUniqueIdentifierTo ?? "").trim();
    if (mountOntologyId && mountOntologyId === ontologyUniqueIdentifierFrom.value) {
      relationMountSide.value = "from";
    } else if (mountOntologyId && mountOntologyId === ontologyUniqueIdentifierTo.value) {
      relationMountSide.value = "to";
    } else {
      relationMountSide.value = "";
      throw new Error("行为挂载对象与关系两端不匹配，无法确定挂载侧实例");
    }
    fromEntityPage.value = 1;
    toEntityPage.value = 1;
    selectedFromEntityRowKey.value = "";
    selectedToEntityRowKey.value = "";
    void loadFromEntityList();
    void loadToEntityList();
  } catch (error) {
    if (requestToken !== relationContextLoadToken) return;
    ontologyLinkUniqIdentifier.value = "";
    ontologyNameFrom.value = "";
    ontologyNameTo.value = "";
    ontologyUniqueIdentifierFrom.value = "";
    ontologyUniqueIdentifierTo.value = "";
    relationMountSide.value = "";
    fromEntityRows.value = [];
    toEntityRows.value = [];
    relationContextError.value = error instanceof Error ? error.message : "关系信息加载失败";
  } finally {
    if (requestToken === relationContextLoadToken) relationContextLoading.value = false;
  }
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
    if (isMainGroupDataRowLocked.value) {
      applyLockedMainGroupDataRowSelection();
    } else if (selectedGroupDataRowKey.value && !groupDataRows.value.some((item) => item.rowKey === selectedGroupDataRowKey.value)) {
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
  if (detailEntityPrimaryKey.value === null) {
    ElMessage.warning("请先选择实体实例");
    return;
  }
  if (!detailOntologyUniqueIdentifier.value) {
    ElMessage.warning("当前行为缺少对象标识，无法查看实例数据");
    return;
  }
  entityRowDetailVisible.value = true;
}

/**
 * @description 打开关系实例两侧实体的关联关系数据弹框，并组装 link_between 请求体。
 */
function openEntityLinkData(): void {
  const fromId = ontologyUniqueIdentifierFrom.value.trim();
  const toId = ontologyUniqueIdentifierTo.value.trim();
  const fromRow = selectedFromEntityRow.value;
  const toRow = selectedToEntityRow.value;
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
 * @description 提交行为测试：属性值、基础函数算子或关系实例。
 */
async function submitBehaviorTest(): Promise<void> {
  if (submitLoading.value) return;
  submitError.value = "";
  if (
    !props.behavior ||
    (!isRelationInstanceTest.value && !isBasicFunctionOperatorTest.value && !isCreateTest.value && !isUpdateTest.value && !isDeleteTest.value)
  ) {
    ElMessage.info("当前仅支持属性值-新增/编辑/删除、基础函数算子或关系实例测试");
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
    try {
      const response = await postTestOntologyActionInterface({
        ontologySpaceId,
        actionApi,
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
  } catch (error) {
    if (requestToken !== submitToken) return;
    submitError.value = error instanceof Error ? error.message : "行为测试失败";
    ElMessage.error(submitError.value);
  } finally {
    if (requestToken === submitToken) submitLoading.value = false;
  }
}

watch(
  () =>
    [
      props.modelValue,
      props.behavior?.id,
      props.behavior?.ontologyUniqIdentifier,
      props.spaceId,
      props.behavior?.basicAction,
      props.behavior?.valueType,
    ] as const,
  ([visible]) => {
    if (!visible) {
      entityLoadToken += 1;
      detailLoadToken += 1;
      groupRowLoadToken += 1;
      relationContextLoadToken += 1;
      fromEntityLoadToken += 1;
      toEntityLoadToken += 1;
      submitToken += 1;
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
      entityPage.value = 1;
      entityPageSize.value = 10;
      return;
    }
    entityPage.value = 1;
    selectedEntityRowKey.value = "";
    selectedGroupDataRowKey.value = "";
    submitError.value = "";
    clearGroupDataRowState();
    clearDetailParamState();
    clearRelationTestState();
    if (isRelationInstanceTest.value) {
      void loadRelationTestContext();
      return;
    }
    if (isBasicFunctionOperatorTest.value) {
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
