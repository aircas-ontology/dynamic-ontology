<template>
  <el-dialog
    :model-value="modelValue"
    class="behavior-test-dialog"
    :class="{ 'behavior-test-dialog--with-detail': showBehaviorDetailPanel }"
    :width="showBehaviorDetailPanel ? 'min(1200px, 94vw)' : 'min(960px, 94vw)'"
    append-to-body
    destroy-on-close
    :close-on-click-modal="false"
    @close="emit('update:modelValue', false)"
  >
    <template #header>
      <div class="behavior-test-dialog__header">
        <span class="behavior-test-dialog__title">{{ dialogTitle }}</span>
        <el-tag v-if="behaviorCategoryLabel" size="small" effect="plain" type="info">{{ behaviorCategoryLabel }}</el-tag>
        <el-tag v-if="behaviorBasicActionLabel" size="small" effect="plain">{{ behaviorBasicActionLabel }}</el-tag>
      </div>
    </template>
    <p v-if="dialogHint" class="behavior-test-dialog__hint">{{ dialogHint }}</p>

    <div class="behavior-test-dialog__layout" :class="{ 'behavior-test-dialog__layout--params-only': !showBehaviorDetailPanel }">
      <aside v-if="showBehaviorDetailPanel" class="behavior-test-dialog__detail" aria-label="行为详情">
        <h4 class="behavior-test-dialog__section-title">行为详情</h4>
        <p v-if="detailSummaryLoading" class="behavior-test-dialog__state" role="status">正在加载行为详情…</p>
        <p v-else-if="detailSummaryError" class="behavior-test-dialog__state" role="alert">{{ detailSummaryError }}</p>
        <template v-else-if="actionInfoViewState">
          <p class="behavior-test-dialog__description" :title="actionInfoViewState.description || '暂无描述'">
            {{ actionInfoViewState.description || "暂无描述" }}
          </p>
          <el-descriptions class="behavior-test-dialog__summary" :column="1" border size="small">
            <el-descriptions-item label="行为名称">{{ actionInfoViewState.displayName || "—" }}</el-descriptions-item>
            <el-descriptions-item label="行为 API">{{ actionInfoViewState.actionApi || "—" }}</el-descriptions-item>
            <el-descriptions-item label="状态">{{ SPACE_BEHAVIOR_STATUS_LABELS[actionInfoViewState.status] }}</el-descriptions-item>
            <el-descriptions-item label="行为类别">{{ actionInfoViewState.actionKindLabel || "—" }}</el-descriptions-item>
            <el-descriptions-item v-if="actionInfoViewState.subjectTypeLabel !== '—'" label="行为类型">
              {{ actionInfoViewState.subjectTypeLabel }}
            </el-descriptions-item>
            <el-descriptions-item v-if="actionInfoViewState.operationLabel !== '—'" label="基础操作">
              {{ actionInfoViewState.operationLabel }}
            </el-descriptions-item>
            <el-descriptions-item v-if="actionInfoViewState.functionApi" label="挂载函数">
              <div class="behavior-test-dialog__function-summary">
                <div class="behavior-test-dialog__field-with-desc">
                  <span :title="mountedFunctionDisplayName">名称：{{ mountedFunctionDisplayName }}</span>
                  <span class="behavior-test-dialog__field-desc" :title="mountedFunctionApi">函数 API：{{ mountedFunctionApi }}</span>
                  <span class="behavior-test-dialog__field-desc" :title="mountedFunctionDescription || undefined">
                    描述：{{ mountedFunctionDescription || "暂无描述" }}
                  </span>
                  <span v-if="mountedFunctionTypeText" class="behavior-test-dialog__field-desc" :title="mountedFunctionTypeText">
                    {{ mountedFunctionTypeText }}
                  </span>
                </div>
                <p v-if="mountedFunctionProtocolText" class="behavior-test-dialog__field-desc" :title="mountedFunctionProtocolText">
                  {{ mountedFunctionProtocolText }}
                </p>
                <p v-if="mountedFunctionVersionText" class="behavior-test-dialog__field-desc" :title="mountedFunctionVersionText">
                  {{ mountedFunctionVersionText }}
                </p>
                <p v-if="mountedFunctionLoading" class="behavior-test-dialog__field-desc" role="status">正在加载函数详情…</p>
                <p v-else-if="mountedFunctionError" class="behavior-test-dialog__field-error" role="alert">
                  {{ mountedFunctionError }}
                </p>
                <div class="behavior-test-dialog__function-footer">
                  <span class="behavior-test-dialog__field-desc" :title="mountedFunctionUpdatedAt || undefined">
                    更新时间：{{ mountedFunctionUpdatedAt || "—" }}
                  </span>
                  <el-button
                    class="behavior-test-dialog__function-detail-btn"
                    text
                    type="primary"
                    :disabled="!canOpenMountedFunctionDetail"
                    @click="openMountedFunctionDetail"
                  >
                    详情
                  </el-button>
                </div>
              </div>
            </el-descriptions-item>
            <el-descriptions-item v-if="actionInfoViewState.storageGroup" label="存储分组">{{ actionInfoViewState.storageGroup }}</el-descriptions-item>
            <el-descriptions-item v-if="actionInfoViewState.outputMode" label="输出方式">{{ actionInfoViewState.outputMode }}</el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ actionInfoViewState.createTime || "—" }}</el-descriptions-item>
            <el-descriptions-item label="更新时间">{{ behaviorUpdatedAt || "—" }}</el-descriptions-item>
            <el-descriptions-item v-if="actionInfoViewState.linkRelationId" label="关系标识">{{ actionInfoViewState.linkRelationId }}</el-descriptions-item>
            <el-descriptions-item v-if="actionInfoViewState.linkTargetStatus" label="关系状态">{{ actionInfoViewState.linkTargetStatus }}</el-descriptions-item>
          </el-descriptions>
        </template>
        <p v-else class="behavior-test-dialog__state" role="status">暂无行为详情</p>
      </aside>

      <div class="behavior-test-dialog__execution">
        <h4 class="behavior-test-dialog__section-title">行为参数</h4>
        <BehaviorParameterConfig v-if="isApplicationTest" :controller="parameterConfig" :readonly="submitLoading" />

        <BehaviorParameterConfig v-if="!isApplicationTest && showRelationLinkForm" :controller="parameterConfig" :readonly="submitLoading" />

        <section v-if="isApplicationTest && applicationTestResultText" class="behavior-test-dialog__section">
          <h4 class="behavior-test-dialog__section-title">测试结果</h4>
          <el-input class="behavior-test-dialog__result" type="textarea" :model-value="applicationTestResultText" :rows="10" readonly resize="vertical" />
        </section>

        <section v-if="isBasicFunctionOperatorTest" class="behavior-test-dialog__section">
          <p v-if="basicFunctionDetailLoading" class="behavior-test-dialog__state" role="status">正在加载行为详情…</p>
          <p v-else-if="basicFunctionDetailError" class="behavior-test-dialog__state" role="alert">{{ basicFunctionDetailError }}</p>
          <template v-else>
            <template v-if="showBasicFunctionEntityPicker">
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
                placeholder="不选则查询全部实例"
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
            </template>

            <template v-if="showBasicFunctionMultiEntityPickers">
              <h4 class="behavior-test-dialog__section-title">选择各对象实体实例（可选）</h4>
              <div v-for="picker in basicFunctionMultiEntityPickers" :key="picker.ontologyUniqueIdentifier" class="behavior-test-dialog__multi-entity-picker">
                <p class="behavior-test-dialog__multi-entity-picker-label">{{ formatBasicFunctionOntologyLabel(picker.ontologyUniqueIdentifier) }}</p>
                <p v-if="picker.loading && !picker.rows.length" class="behavior-test-dialog__state" role="status">正在加载实体列表…</p>
                <p v-else-if="picker.error && !picker.rows.length" class="behavior-test-dialog__state" role="alert">{{ picker.error }}</p>
                <el-select
                  v-else
                  class="behavior-test-dialog__entity-select"
                  :model-value="picker.selectedRowKey"
                  filterable
                  clearable
                  :loading="picker.loading"
                  placeholder="不选则查询全部实例"
                  @update:model-value="(value) => updateBasicFunctionMultiEntitySelection(picker.ontologyUniqueIdentifier, value)"
                >
                  <el-option
                    v-for="option in listBasicFunctionMultiEntitySelectOptions(picker)"
                    :key="option.rowKey"
                    :label="formatBasicOperatorEntityOptionLabel(option)"
                    :value="option.rowKey"
                  />
                  <template #footer>
                    <div v-if="picker.total > 0" class="behavior-test-dialog__select-footer" @mousedown.prevent>
                      <el-pagination
                        small
                        layout="total, prev, pager, next"
                        :total="picker.total"
                        :current-page="picker.page"
                        :page-size="picker.pageSize"
                        @current-change="(page) => changeBasicFunctionMultiEntityPage(picker.ontologyUniqueIdentifier, page)"
                      />
                    </div>
                    <p v-else-if="picker.error" class="behavior-test-dialog__select-footer-error" role="alert">{{ picker.error }}</p>
                  </template>
                </el-select>
              </div>
            </template>

            <template v-if="showBasicFunctionWriteBackEntityPicker">
              <h4 class="behavior-test-dialog__section-title">回写目标实例</h4>
              <p class="behavior-test-dialog__multi-entity-picker-label">
                {{ formatBasicFunctionOntologyLabel(basicFunctionWriteBackOntologyId) }}
              </p>
              <p v-if="writeBackEntityLoading && !writeBackEntityRows.length" class="behavior-test-dialog__state" role="status">正在加载回写实体列表…</p>
              <p v-else-if="writeBackEntityError && !writeBackEntityRows.length" class="behavior-test-dialog__state" role="alert">{{ writeBackEntityError }}</p>
              <el-select
                v-else
                class="behavior-test-dialog__entity-select"
                :model-value="selectedWriteBackEntityRowKey"
                filterable
                clearable
                :loading="writeBackEntityLoading"
                placeholder="请选择回写目标实例"
                @update:model-value="updateBasicFunctionWriteBackEntitySelection"
              >
                <el-option
                  v-for="option in listBasicFunctionWriteBackEntitySelectOptions()"
                  :key="option.rowKey"
                  :label="formatBasicOperatorEntityOptionLabel(option)"
                  :value="option.rowKey"
                />
                <template #footer>
                  <div v-if="writeBackEntityTotal > 0" class="behavior-test-dialog__select-footer" @mousedown.prevent>
                    <el-pagination
                      small
                      layout="total, prev, pager, next"
                      :total="writeBackEntityTotal"
                      :current-page="writeBackEntityPage"
                      :page-size="writeBackEntityPageSize"
                      @current-change="changeWriteBackEntityPage"
                    />
                  </div>
                  <p v-else-if="writeBackEntityError" class="behavior-test-dialog__select-footer-error" role="alert">{{ writeBackEntityError }}</p>
                </template>
              </el-select>
            </template>
          </template>
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
      </div>
    </div>

    <template #footer>
      <el-button v-if="isRelationInstanceTest" :disabled="submitLoading" @click="openEntityLinkData">查看实例关系数据</el-button>
      <el-button v-else-if="isAttributeValueTest" :disabled="submitLoading" @click="openEntityRowDetail">查看实例数据</el-button>
      <el-button :disabled="submitLoading" @click="emit('update:modelValue', false)">关闭</el-button>
      <el-button v-if="!isUpdateTest && !isCreateTest" type="primary" :loading="submitLoading" @click="submitBehaviorTest">执行</el-button>
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

  <BehaviorEntityLinkDataDialog
    v-model="entityLinkDataVisible"
    :query-params="entityLinkDataQueryParams"
    :query-links="apis.postOntologyEntityAllLinkInterface"
  />

  <FunctionOperatorDetailDrawer
    readonly
    v-model="mountedFunctionDetailVisible"
    :operator="mountedFunctionOperator"
    :loading="mountedFunctionDetailLoading"
    :versions="mountedFunctionVersions"
    :detail-version="mountedFunctionDetailVersion"
    :versions-loading="mountedFunctionVersionsLoading"
    @change-version="changeMountedFunctionDetailVersion"
  />
</template>

<script setup lang="ts">
import BehaviorParameterConfig from "@/components/BehaviorParameterConfig/BehaviorParameterConfig.vue";
import FunctionOperatorDetailDrawer from "@/components/FunctionOperatorDetailDrawer/FunctionOperatorDetailDrawer.vue";
import { useBehaviorParameters } from "@/composables/behavior/useBehaviorParameters";
import type { BehaviorTestEntityRow, BehaviorTestEntityDataRow } from "@/types";
import { computed, onScopeDispose, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import type * as BehaviorTestApis from "@/apis";
import { getOntologyFunctionDetailInterface, getOntologyFunctionVersionsInterface } from "@/apis";
import { mergeBehaviorTestEntityRows } from "@/utils/behaviorParameters/createBehaviorTestInitialEntity";
import { mapOntologyFunctionDetailToOperator } from "@/utils/mapOntologyFunctionDetail";
import {
  FUNCTION_OPERATOR_TYPE_LABELS,
  SPACE_BEHAVIOR_BASIC_ACTION_LABELS,
  SPACE_BEHAVIOR_KIND_LABELS,
  SPACE_BEHAVIOR_STATUS_LABELS,
  SPACE_BEHAVIOR_VALUE_TYPE_LABELS,
  type FunctionOperator,
  type OntologyEntityRowDetailPageData,
  type OntologyEntityRowDetailVO,
  type PostOntologyEntityAllLinkParams,
  type SpaceBehaviorItem,
  type TestOntologyActionData,
  type TestOntologyActionParams,
} from "@/types";

/** 基础函数多对象测试：按对象缓存的实体下拉状态。 */
interface BasicFunctionMultiEntityPickerState {
  ontologyUniqueIdentifier: string;
  rows: BehaviorTestEntityRow[];
  total: number;
  page: number;
  pageSize: number;
  loading: boolean;
  error: string;
  selectedRowKey: string;
  selectedSnapshot: BehaviorTestEntityRow | null;
  loadToken: number;
}
import BehaviorEntityLinkDataDialog from "./BehaviorEntityLinkDataDialog.vue";
import BehaviorEntityRowDetailDialog from "./BehaviorEntityRowDetailDialog.vue";
import {
  mapOntologyEntityRowDetailPageToDataRows,
  mapOntologyEntityRowDetailPageToViewDetail,
} from "@/utils/behaviorParameters/mapOntologyEntityRowDetailToDataRows";
import { isMainStorageGroup } from "@/utils/behaviorParameters/resolveAttributeValueSelection";

const props = withDefaults(
  defineProps<{
    apis: Pick<
      typeof BehaviorTestApis,
      | "getOntologyActionInfoInterface"
      | "getOntologyEntitiesInterface"
      | "getOntologyLinkByUniqueIdentifierInterface"
      | "postGetOntologyEntityRowDetailPageInterface"
      | "postTestOntologyActionInterface"
      | "postOntologyEntityAllLinkInterface"
    >;
    initialEntity?: BehaviorTestEntityRow;
    modelValue: boolean;
    spaceId: string;
    behavior: SpaceBehaviorItem | null;
    /** 为 true 时展示左侧行为详情栏；仅空间浏览行为详情使用，管理侧测试默认关闭。 */
    showBehaviorDetailPanel?: boolean;
  }>(),
  { showBehaviorDetailPanel: false },
);

const {
  getOntologyActionInfoInterface,
  getOntologyEntitiesInterface,
  getOntologyLinkByUniqueIdentifierInterface,
  postGetOntologyEntityRowDetailPageInterface,
  postTestOntologyActionInterface,
} = props.apis;

const parameterConfig = useBehaviorParameters(props, {
  getOntologyActionInfoInterface,
  getOntologyEntitiesInterface,
  getOntologyLinkByUniqueIdentifierInterface,
  postGetOntologyEntityRowDetailPageInterface,
});
const {
  applyActionInfoViewState,
  loadApplicationTestForm,
  loadRelationTestContext,
  updateParamValue,
  isApplicationTest,
  detailLoading,
  detailError,
  actionInfoViewState,
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
/** 基础函数详情中的对象 id 列表。 */
const basicFunctionOntologyIds = ref<string[]>([]);
/** 基础函数详情对象 id → 展示名称（来自 ontologyNames / targetOntologyName）。 */
const basicFunctionOntologyNameById = ref<Record<string, string>>({});
/** 单对象测试时用于拉实体列表的对象 id。 */
const basicFunctionTestOntologyId = ref("");
/** 基础函数回写目标对象 id；空表示无 writeBack。 */
const basicFunctionWriteBackOntologyId = ref("");
/** 多对象基础函数：各对象实体下拉。 */
const basicFunctionMultiEntityPickers = ref<BasicFunctionMultiEntityPickerState[]>([]);
const writeBackEntityLoading = ref(false);
const writeBackEntityError = ref("");
const writeBackEntityRows = ref<BehaviorTestEntityRow[]>([]);
const writeBackEntityTotal = ref(0);
const writeBackEntityPage = ref(1);
const writeBackEntityPageSize = ref(10);
const selectedWriteBackEntityRowKey = ref("");
const selectedWriteBackEntitySnapshot = ref<BehaviorTestEntityRow | null>(null);
let writeBackEntityLoadToken = 0;
const basicFunctionDetailLoading = ref(false);
const basicFunctionDetailError = ref("");
let basicFunctionDetailLoadToken = 0;
/** 左栏挂载函数详情（摘要与只读抽屉共用）。 */
const mountedFunctionOperator = ref<FunctionOperator | null>(null);
const mountedFunctionLoading = ref(false);
const mountedFunctionError = ref("");
const mountedFunctionVersions = ref<string[]>([]);
const mountedFunctionDetailVersion = ref("");
const mountedFunctionVersionsLoading = ref(false);
const mountedFunctionDetailVisible = ref(false);
const mountedFunctionDetailLoading = ref(false);
let mountedFunctionLoadToken = 0;
let submitToken = 0;
let contextToken = 0;

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

/** @description 列表或卡片带回的更新时间，详情接口无该字段时作为回退。 */
const behaviorUpdatedAt = computed(() => props.behavior?.updatedAt?.trim() || "");

/** @description 挂载函数主展示名：优先详情 displayName；回退时避免把行为描述当成函数名。 */
const mountedFunctionDisplayName = computed(() => {
  const fromDetail = mountedFunctionOperator.value?.name.trim() || "";
  if (fromDetail) return fromDetail;
  const view = actionInfoViewState.value;
  const name = (view?.functionDescription || "").trim();
  const api = (view?.functionApi || "").trim();
  const behaviorDescription = (view?.description || "").trim();
  if (name && name !== behaviorDescription) return name;
  return api || "—";
});

/** @description 挂载函数 API：优先详情 functionApi，否则回退行为详情字段。 */
const mountedFunctionApi = computed(() => {
  const fromDetail = mountedFunctionOperator.value?.functionApi.trim() || "";
  if (fromDetail) return fromDetail;
  return (actionInfoViewState.value?.functionApi || "").trim() || "—";
});

/** @description 挂载函数描述：优先详情 description。 */
const mountedFunctionDescription = computed(() => {
  const fromDetail = mountedFunctionOperator.value?.description.trim() || "";
  if (fromDetail) return fromDetail;
  return (actionInfoViewState.value?.functionDescription || "").trim();
});

/** @description 挂载函数类型行；详情未加载或无类型时不展示。 */
const mountedFunctionTypeText = computed(() => {
  const type = mountedFunctionOperator.value?.type;
  if (!type) return "";
  const label = FUNCTION_OPERATOR_TYPE_LABELS[type] || type;
  return label ? `类型：${label}` : "";
});

/** @description 挂载函数协议行；无协议时不展示。 */
const mountedFunctionProtocolText = computed(() => {
  const protocol = mountedFunctionOperator.value?.protocol.trim() || "";
  return protocol ? `协议：${protocol}` : "";
});

/** @description 挂载函数版本行。 */
const mountedFunctionVersionText = computed(() => {
  const version = (mountedFunctionOperator.value?.version || mountedFunctionDetailVersion.value).trim();
  return version ? `版本：${version}` : "";
});

/** @description 挂载函数更新时间；详情无值时为空。 */
const mountedFunctionUpdatedAt = computed(() => mountedFunctionOperator.value?.updatedAt.trim() || "");

/** @description 可否打开挂载函数只读详情抽屉。 */
const canOpenMountedFunctionDetail = computed(() => {
  const functionApi = (actionInfoViewState.value?.functionApi || mountedFunctionOperator.value?.functionApi || "").trim();
  return Boolean(functionApi) && !mountedFunctionLoading.value;
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
/** 基础函数仅绑定单个对象时，测试弹窗展示可选实例。 */
const showBasicFunctionEntityPicker = computed(() => isBasicFunctionOperatorTest.value && basicFunctionOntologyIds.value.length === 1);
/** 基础函数多对象时，按对象展示实例下拉。 */
const showBasicFunctionMultiEntityPickers = computed(() => isBasicFunctionOperatorTest.value && basicFunctionOntologyIds.value.length > 1);
/** 基础函数配置了 writeBack 时展示回写目标实例。 */
const showBasicFunctionWriteBackEntityPicker = computed(() => isBasicFunctionOperatorTest.value && Boolean(basicFunctionWriteBackOntologyId.value.trim()));
const selectedWriteBackEntityRow = computed(() => {
  const onPage = writeBackEntityRows.value.find((item) => item.rowKey === selectedWriteBackEntityRowKey.value) ?? null;
  if (onPage) return onPage;
  if (selectedWriteBackEntitySnapshot.value?.rowKey === selectedWriteBackEntityRowKey.value) return selectedWriteBackEntitySnapshot.value;
  return null;
});
const selectedWriteBackEntityPrimaryKey = computed(() => {
  const primaryKey = selectedWriteBackEntityRow.value?.savedPrimaryKey ?? selectedWriteBackEntityRow.value?.primaryKey;
  return primaryKey === undefined || primaryKey === null || primaryKey === "" ? null : primaryKey;
});
const isAttributeValueTest = computed(() => !isApplicationTest.value && props.behavior?.valueType === "attributeValue");
const isCreateTest = computed(() => isAttributeValueTest.value && props.behavior?.basicAction === "create");
const isUpdateTest = computed(() => isAttributeValueTest.value && props.behavior?.basicAction === "update");
const isDeleteTest = computed(() => isAttributeValueTest.value && props.behavior?.basicAction === "delete");
const needsDataRowSelection = computed(() => isUpdateTest.value || isDeleteTest.value);
/** 属性值-编辑且存储分组为 main 时，数据行默认勾选且不可取消。 */
const isMainGroupDataRowLocked = computed(() => isUpdateTest.value && isMainStorageGroup(resolvedStorageGroup.value));

/** @description 左侧行为详情摘要加载态：合并各测试路径的详情请求状态。 */
const detailSummaryLoading = computed(
  () => detailLoading.value || basicFunctionDetailLoading.value || (isRelationInstanceTest.value && relationContextLoading.value),
);

/** @description 左侧行为详情摘要错误文案。 */
const detailSummaryError = computed(() => {
  if (isBasicFunctionOperatorTest.value && basicFunctionDetailError.value) return basicFunctionDetailError.value;
  if (isRelationInstanceTest.value && relationContextError.value && !actionInfoViewState.value) return relationContextError.value;
  if (detailError.value && !actionInfoViewState.value) return detailError.value;
  return "";
});

const dialogHint = computed(() => {
  if (isApplicationTest.value && applicationHasLinkMapping.value) {
    return "填写入参并选择关系两端实例后开始测试。";
  }
  if (isApplicationTest.value) return "根据入参来源填写外部值或选择对象实例后开始测试。";
  if (isRelationInstanceTest.value) return "选择关系两端对象实例后执行关系实例测试。";
  if (isBasicFunctionOperatorTest.value) {
    if (basicFunctionDetailLoading.value) return "正在加载基础函数测试上下文…";
    if (basicFunctionDetailError.value) return basicFunctionDetailError.value;
    if (showBasicFunctionWriteBackEntityPicker.value && showBasicFunctionMultiEntityPickers.value) {
      return "可选择各对象实体实例（可选），并选择回写目标实例后开始测试。";
    }
    if (showBasicFunctionWriteBackEntityPicker.value && showBasicFunctionEntityPicker.value) {
      return "可选择查询实例（可选），并选择回写目标实例后开始测试。";
    }
    if (showBasicFunctionEntityPicker.value) return "可选择单个实体实例后开始测试；不选则查询全部。";
    if (showBasicFunctionMultiEntityPickers.value) return "可选择各对象实体实例后开始测试；不选则查询全部。";
    return "确认后直接执行基础函数测试。";
  }
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
  const primaryKey = selectedEntityRow.value?.savedPrimaryKey ?? selectedEntityRow.value?.primaryKey;
  if (primaryKey === undefined || primaryKey === null || primaryKey === "") return null;
  return primaryKey;
});

const selectedEntityDisplayName = computed(() => selectedEntityRow.value?.displayName ?? "");

const detailOntologyUniqueIdentifier = computed(() => behaviorOntologyUniqueIdentifier.value);

const detailEntityPrimaryKey = computed(() => {
  if (isRelationInstanceTest.value) {
    const primaryKey = selectedFromEntityRows.value[0]?.primaryKey;
    if (primaryKey === undefined || primaryKey === null || primaryKey === "") return null;
    return primaryKey;
  }
  return selectedEntityPrimaryKey.value;
});

const detailEntityDisplayName = computed(() => {
  if (isRelationInstanceTest.value) return selectedFromEntityRows.value[0]?.displayName ?? "";
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
 * @description 清空基础函数回写实体列表与选中态。
 */
function clearBasicFunctionWriteBackEntityState(): void {
  writeBackEntityLoadToken += 1;
  writeBackEntityRows.value = [];
  writeBackEntityTotal.value = 0;
  writeBackEntityError.value = "";
  writeBackEntityLoading.value = false;
  writeBackEntityPage.value = 1;
  selectedWriteBackEntityRowKey.value = "";
  selectedWriteBackEntitySnapshot.value = null;
}

/**
 * @description 清空基础函数多对象实体下拉状态。
 */
function clearBasicFunctionMultiEntityPickers(): void {
  for (const picker of basicFunctionMultiEntityPickers.value) {
    picker.loadToken += 1;
  }
  basicFunctionMultiEntityPickers.value = [];
}

/**
 * @description 清空基础函数测试上下文（详情对象 id、回写与多对象选择态）。
 */
function clearBasicFunctionTestContext(): void {
  basicFunctionOntologyIds.value = [];
  basicFunctionOntologyNameById.value = {};
  basicFunctionTestOntologyId.value = "";
  basicFunctionWriteBackOntologyId.value = "";
  clearBasicFunctionMultiEntityPickers();
  clearBasicFunctionWriteBackEntityState();
  basicFunctionDetailLoading.value = false;
  basicFunctionDetailError.value = "";
}

/**
 * @description 按标识与同序名称列表构建对象名称映射。
 * @param ontologyIdentifiers 对象唯一标识列表。
 * @param ontologyNames 与标识同序的对象名称；缺失项跳过。
 * @returns identifier → name。
 */
function buildBasicFunctionOntologyNameMap(ontologyIdentifiers: string[], ontologyNames: unknown): Record<string, string> {
  const names = Array.isArray(ontologyNames) ? ontologyNames : [];
  const map: Record<string, string> = {};
  ontologyIdentifiers.forEach((ontologyId, index) => {
    const name = typeof names[index] === "string" ? names[index].trim() : "";
    if (ontologyId && name) map[ontologyId] = name;
  });
  return map;
}

/**
 * @description 清空左栏挂载函数详情与只读抽屉状态。
 */
function clearMountedFunctionDetailState(): void {
  mountedFunctionOperator.value = null;
  mountedFunctionLoading.value = false;
  mountedFunctionError.value = "";
  mountedFunctionVersions.value = [];
  mountedFunctionDetailVersion.value = "";
  mountedFunctionVersionsLoading.value = false;
  mountedFunctionDetailVisible.value = false;
  mountedFunctionDetailLoading.value = false;
}

/**
 * @description 合并版本列表并保证当前版本在选项中。
 * @param versions 接口版本列表。
 * @param currentVersion 当前版本。
 * @returns 去重后的版本列表。
 */
function mergeMountedFunctionVersionOptions(versions: string[], currentVersion: string): string[] {
  const normalized = versions.map((item) => item.trim()).filter(Boolean);
  const current = currentVersion.trim();
  if (!current) return Array.from(new Set(normalized));
  if (!normalized.includes(current)) return [current, ...Array.from(new Set(normalized))];
  return Array.from(new Set(normalized));
}

/**
 * @description 解析挂载函数版本：优先行为项版本，否则取 versions 列表末项。
 * @param functionApi 函数 API。
 * @returns 版本号；无法解析时为空串。
 */
async function resolveMountedFunctionVersion(functionApi: string): Promise<string> {
  const fromBehavior = props.behavior?.functionOperatorVersion.trim() || "";
  if (fromBehavior) return fromBehavior;
  const spaceId = props.spaceId.trim();
  if (!spaceId) return "";
  const response = await getOntologyFunctionVersionsInterface({ functionApi, spaceId });
  if (response.code !== 200 || !Array.isArray(response.data)) {
    throw new Error(response.message || "函数版本列表加载失败");
  }
  const versions = response.data.map((item) => (typeof item === "string" ? item.trim() : "")).filter(Boolean);
  mountedFunctionVersions.value = versions;
  return versions[versions.length - 1] ?? "";
}

/**
 * @description 按 functionApi 与版本拉取挂载函数详情，供左栏摘要与只读抽屉使用。
 * @param functionApi 函数 API。
 * @param version 目标版本；空则先解析版本。
 * @param options 是否同步更新抽屉 loading。
 */
async function loadMountedFunctionDetail(functionApi: string, version = "", options: { forDrawer?: boolean } = {}): Promise<void> {
  const api = functionApi.trim();
  const spaceId = props.spaceId.trim();
  if (!api || !spaceId) {
    clearMountedFunctionDetailState();
    return;
  }
  const requestToken = ++mountedFunctionLoadToken;
  mountedFunctionLoading.value = true;
  mountedFunctionError.value = "";
  if (options.forDrawer) mountedFunctionDetailLoading.value = true;
  try {
    let resolvedVersion = version.trim();
    if (!resolvedVersion) {
      mountedFunctionVersionsLoading.value = true;
      try {
        resolvedVersion = await resolveMountedFunctionVersion(api);
      } finally {
        if (requestToken === mountedFunctionLoadToken) mountedFunctionVersionsLoading.value = false;
      }
    }
    if (requestToken !== mountedFunctionLoadToken) return;
    if (!resolvedVersion) throw new Error("缺少函数版本，无法加载函数详情");
    if (!mountedFunctionVersions.value.includes(resolvedVersion)) {
      mountedFunctionVersions.value = mergeMountedFunctionVersionOptions(mountedFunctionVersions.value, resolvedVersion);
    }
    const response = await getOntologyFunctionDetailInterface({ functionApi: api, version: resolvedVersion, spaceId });
    if (requestToken !== mountedFunctionLoadToken) return;
    if (response.code !== 200 || !response.data) throw new Error(response.message || "函数详情加载失败");
    mountedFunctionOperator.value = mapOntologyFunctionDetailToOperator(response.data, mountedFunctionOperator.value);
    mountedFunctionDetailVersion.value = mountedFunctionOperator.value.version.trim() || resolvedVersion;
    mountedFunctionVersions.value = mergeMountedFunctionVersionOptions(mountedFunctionVersions.value, mountedFunctionDetailVersion.value);
  } catch (error) {
    if (requestToken !== mountedFunctionLoadToken) return;
    mountedFunctionOperator.value = null;
    mountedFunctionError.value = error instanceof Error ? error.message : "函数详情加载失败";
  } finally {
    if (requestToken === mountedFunctionLoadToken) {
      mountedFunctionLoading.value = false;
      if (options.forDrawer) mountedFunctionDetailLoading.value = false;
    }
  }
}

/**
 * @description 打开挂载函数只读详情抽屉；必要时补拉详情。
 */
function openMountedFunctionDetail(): void {
  const functionApi = (actionInfoViewState.value?.functionApi || mountedFunctionOperator.value?.functionApi || "").trim();
  if (!functionApi) {
    ElMessage.warning("缺少函数 API，无法查看详情");
    return;
  }
  mountedFunctionDetailVisible.value = true;
  if (!mountedFunctionOperator.value || mountedFunctionError.value) {
    void loadMountedFunctionDetail(functionApi, mountedFunctionDetailVersion.value, { forDrawer: true });
    return;
  }
  if (!mountedFunctionVersions.value.length) {
    void (async () => {
      const snapshotToken = mountedFunctionLoadToken;
      mountedFunctionVersionsLoading.value = true;
      try {
        const response = await getOntologyFunctionVersionsInterface({ functionApi, spaceId: props.spaceId.trim() });
        if (snapshotToken !== mountedFunctionLoadToken) return;
        if (response.code === 200 && Array.isArray(response.data)) {
          const versions = response.data.map((item) => (typeof item === "string" ? item.trim() : "")).filter(Boolean);
          mountedFunctionVersions.value = mergeMountedFunctionVersionOptions(versions, mountedFunctionDetailVersion.value);
        }
      } finally {
        if (snapshotToken === mountedFunctionLoadToken) mountedFunctionVersionsLoading.value = false;
      }
    })();
  }
}

/**
 * @description 只读详情抽屉切换版本并重新拉取详情。
 * @param version 目标版本。
 */
async function changeMountedFunctionDetailVersion(version: string): Promise<void> {
  const nextVersion = version.trim();
  const functionApi = (mountedFunctionOperator.value?.functionApi || actionInfoViewState.value?.functionApi || "").trim();
  if (!functionApi || !nextVersion || nextVersion === mountedFunctionDetailVersion.value.trim()) return;
  mountedFunctionDetailVersion.value = nextVersion;
  await loadMountedFunctionDetail(functionApi, nextVersion, { forDrawer: true });
}

/**
 * @description 格式化基础函数对象标识展示文案；优先详情返回的对象名称。
 * @param ontologyUniqueIdentifier 对象唯一标识。
 * @returns 展示文案。
 */
function formatBasicFunctionOntologyLabel(ontologyUniqueIdentifier: string): string {
  const ontologyId = ontologyUniqueIdentifier.trim();
  if (!ontologyId) return "未命名对象";
  const named = basicFunctionOntologyNameById.value[ontologyId]?.trim() ?? "";
  if (named) return named;
  return ontologyId.length > 12 ? `对象 ${ontologyId.slice(0, 8)}…` : `对象 ${ontologyId}`;
}

/**
 * @description 创建空的多对象实体下拉状态。
 * @param ontologyUniqueIdentifier 对象唯一标识。
 * @returns 下拉状态。
 */
function createBasicFunctionMultiEntityPickerState(ontologyUniqueIdentifier: string): BasicFunctionMultiEntityPickerState {
  return {
    ontologyUniqueIdentifier: ontologyUniqueIdentifier.trim(),
    rows: [],
    total: 0,
    page: 1,
    pageSize: 10,
    loading: false,
    error: "",
    selectedRowKey: "",
    selectedSnapshot: null,
    loadToken: 0,
  };
}

/**
 * @description 读取多对象下拉选项；已选不在当前页时前置保留。
 * @param picker 下拉状态。
 * @returns 选项列表。
 */
function listBasicFunctionMultiEntitySelectOptions(picker: BasicFunctionMultiEntityPickerState): BehaviorTestEntityRow[] {
  const selected = picker.selectedSnapshot;
  if (!selected || !picker.selectedRowKey) return picker.rows;
  if (picker.rows.some((item) => item.rowKey === selected.rowKey)) return picker.rows;
  return [selected, ...picker.rows];
}

/**
 * @description 更新多对象某一对象的实体选中值。
 * @param ontologyUniqueIdentifier 对象唯一标识。
 * @param selectedRowKey 选中行键。
 */
function updateBasicFunctionMultiEntitySelection(ontologyUniqueIdentifier: string, selectedRowKey: string | number | null | undefined): void {
  const ontologyId = ontologyUniqueIdentifier.trim();
  const nextKey = String(selectedRowKey ?? "").trim();
  basicFunctionMultiEntityPickers.value = basicFunctionMultiEntityPickers.value.map((picker) => {
    if (picker.ontologyUniqueIdentifier !== ontologyId) return picker;
    if (!nextKey) {
      return { ...picker, selectedRowKey: "", selectedSnapshot: null };
    }
    const matched =
      listBasicFunctionMultiEntitySelectOptions(picker).find((item) => item.rowKey === nextKey) ?? picker.rows.find((item) => item.rowKey === nextKey) ?? null;
    return { ...picker, selectedRowKey: nextKey, selectedSnapshot: matched };
  });
}

/**
 * @description 切换多对象某一对象的实体分页。
 * @param ontologyUniqueIdentifier 对象唯一标识。
 * @param page 目标页码。
 */
function changeBasicFunctionMultiEntityPage(ontologyUniqueIdentifier: string, page: number): void {
  const ontologyId = ontologyUniqueIdentifier.trim();
  const nextPage = Number(page);
  if (!Number.isFinite(nextPage) || nextPage < 1) return;
  const picker = basicFunctionMultiEntityPickers.value.find((item) => item.ontologyUniqueIdentifier === ontologyId);
  if (!picker || picker.page === nextPage) return;
  picker.page = nextPage;
  void loadBasicFunctionMultiEntityList(ontologyId);
}

/**
 * @description 按对象分页加载多对象基础函数实体列表。
 * @param ontologyUniqueIdentifier 对象唯一标识。
 */
async function loadBasicFunctionMultiEntityList(ontologyUniqueIdentifier: string): Promise<void> {
  const ontologyId = ontologyUniqueIdentifier.trim();
  const pickerIndex = basicFunctionMultiEntityPickers.value.findIndex((item) => item.ontologyUniqueIdentifier === ontologyId);
  if (pickerIndex < 0) return;
  const picker = basicFunctionMultiEntityPickers.value[pickerIndex];
  if (!picker) return;
  const requestToken = picker.loadToken + 1;
  picker.loadToken = requestToken;
  picker.loading = true;
  picker.error = "";
  try {
    const response = await getOntologyEntitiesInterface({
      ontologyUniqueIdentifier: ontologyId,
      pageNum: picker.page,
      pageSize: picker.pageSize,
    });
    if (picker.loadToken !== requestToken) return;
    if (response.code !== 200 || !response.data) throw new Error(response.message || "实体列表加载失败");
    const records = Array.isArray(response.data.records) ? response.data.records : [];
    const rows = records.map((item, index) => mapEntityRecordToRow(item, index));
    picker.rows = rows;
    picker.total = Number(response.data.total) || records.length;
    if (picker.selectedRowKey) {
      const onPage = rows.find((item) => item.rowKey === picker.selectedRowKey) ?? null;
      if (onPage) picker.selectedSnapshot = onPage;
    }
  } catch (error) {
    if (picker.loadToken !== requestToken) return;
    picker.rows = [];
    picker.total = 0;
    picker.error = error instanceof Error ? error.message : "实体列表加载失败";
  } finally {
    if (picker.loadToken === requestToken) picker.loading = false;
  }
}

/**
 * @description 读取回写实体下拉选项；已选不在当前页时前置保留。
 * @returns 选项列表。
 */
function listBasicFunctionWriteBackEntitySelectOptions(): BehaviorTestEntityRow[] {
  const selected = selectedWriteBackEntityRow.value;
  if (!selected || !selectedWriteBackEntityRowKey.value) return writeBackEntityRows.value;
  if (writeBackEntityRows.value.some((item) => item.rowKey === selected.rowKey)) return writeBackEntityRows.value;
  return [selected, ...writeBackEntityRows.value];
}

/**
 * @description 更新回写目标实体选中值。
 * @param selectedRowKey 选中行键。
 */
function updateBasicFunctionWriteBackEntitySelection(selectedRowKey: string | number | null | undefined): void {
  const nextKey = String(selectedRowKey ?? "").trim();
  if (!nextKey) {
    selectedWriteBackEntityRowKey.value = "";
    selectedWriteBackEntitySnapshot.value = null;
    return;
  }
  const matched =
    listBasicFunctionWriteBackEntitySelectOptions().find((item) => item.rowKey === nextKey) ??
    writeBackEntityRows.value.find((item) => item.rowKey === nextKey) ??
    null;
  selectedWriteBackEntityRowKey.value = nextKey;
  selectedWriteBackEntitySnapshot.value = matched;
}

/**
 * @description 切换回写实体分页。
 * @param page 目标页码。
 */
function changeWriteBackEntityPage(page: number): void {
  const nextPage = Number(page);
  if (!Number.isFinite(nextPage) || nextPage < 1 || nextPage === writeBackEntityPage.value) return;
  writeBackEntityPage.value = nextPage;
  void loadBasicFunctionWriteBackEntityList();
}

/**
 * @description 按 writeBack 目标对象加载回写实体列表。
 */
async function loadBasicFunctionWriteBackEntityList(): Promise<void> {
  const ontologyUniqueIdentifier = basicFunctionWriteBackOntologyId.value.trim();
  if (!ontologyUniqueIdentifier) {
    clearBasicFunctionWriteBackEntityState();
    return;
  }
  const requestToken = ++writeBackEntityLoadToken;
  writeBackEntityLoading.value = true;
  writeBackEntityError.value = "";
  try {
    const response = await getOntologyEntitiesInterface({
      ontologyUniqueIdentifier,
      pageNum: writeBackEntityPage.value,
      pageSize: writeBackEntityPageSize.value,
    });
    if (requestToken !== writeBackEntityLoadToken) return;
    if (response.code !== 200 || !response.data) throw new Error(response.message || "回写实体列表加载失败");
    const records = Array.isArray(response.data.records) ? response.data.records : [];
    const rows = records.map((item, index) => mapEntityRecordToRow(item, index));
    writeBackEntityRows.value = rows;
    writeBackEntityTotal.value = Number(response.data.total) || records.length;
    if (selectedWriteBackEntityRowKey.value) {
      const onPage = rows.find((item) => item.rowKey === selectedWriteBackEntityRowKey.value) ?? null;
      if (onPage) selectedWriteBackEntitySnapshot.value = onPage;
    }
  } catch (error) {
    if (requestToken !== writeBackEntityLoadToken) return;
    writeBackEntityRows.value = [];
    writeBackEntityTotal.value = 0;
    writeBackEntityError.value = error instanceof Error ? error.message : "回写实体列表加载失败";
  } finally {
    if (requestToken === writeBackEntityLoadToken) writeBackEntityLoading.value = false;
  }
}

/**
 * @description 组装基础函数测试请求参数。
 * @returns 请求体；校验失败时返回 error。
 */
function buildBasicFunctionTestRequestParams(): TestOntologyActionParams | { error: string } {
  const actionApi = (props.behavior?.behaviorApiName ?? "").trim();
  const ontologySpaceId = props.spaceId.trim();
  if (!actionApi || !ontologySpaceId) {
    return { error: "缺少行为 api 或对象空间 id，无法测试" };
  }
  const request: TestOntologyActionParams = { ontologySpaceId, actionApi };
  if (showBasicFunctionEntityPicker.value) {
    const selectedPrimaryKey = selectedEntityPrimaryKey.value;
    if (selectedPrimaryKey !== null) request.entityPrimaryKey = selectedPrimaryKey;
  }
  if (showBasicFunctionMultiEntityPickers.value) {
    const entityPrimaryKeys: Record<string, string | number | boolean | Record<string, unknown>> = {};
    for (const picker of basicFunctionMultiEntityPickers.value) {
      const primaryKey = picker.selectedSnapshot?.savedPrimaryKey ?? picker.selectedSnapshot?.primaryKey;
      if (primaryKey === undefined || primaryKey === null || primaryKey === "" || !picker.selectedRowKey) {
        continue;
      }
      entityPrimaryKeys[picker.ontologyUniqueIdentifier] = primaryKey;
    }
    if (Object.keys(entityPrimaryKeys).length > 0) {
      request.entityPrimaryKeys = entityPrimaryKeys;
    }
  }
  if (showBasicFunctionWriteBackEntityPicker.value) {
    const writeBackPrimaryKey = selectedWriteBackEntityPrimaryKey.value;
    if (writeBackPrimaryKey === null) {
      return { error: "请选择回写目标实例" };
    }
    request.writeBackEntityPrimaryKey = writeBackPrimaryKey;
  }
  return request;
}

/**
 * @description 规范化详情返回的基础函数对象 id 列表。
 * @param raw 原始 ontologyIdentifiers。
 * @returns 去空白后的唯一 id 列表。
 */
function normalizeBasicFunctionOntologyIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const ids: string[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    if (typeof item !== "string") continue;
    const id = item.trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }
  return ids;
}

/**
 * @description 打开基础函数测试时加载行为详情，按 ontologyIdentifiers / writeBack 初始化实例选择。
 */
async function loadBasicFunctionTestContext(): Promise<void> {
  clearEntityListState();
  clearBasicFunctionTestContext();
  const actionApi = (props.behavior?.behaviorApiName ?? "").trim();
  const ontologySpaceId = props.spaceId.trim();
  if (!actionApi) {
    basicFunctionDetailError.value = "当前行为缺少 apiName，无法加载测试上下文";
    return;
  }
  if (!ontologySpaceId) {
    basicFunctionDetailError.value = "缺少对象空间 id，无法加载测试上下文";
    return;
  }
  const requestToken = ++basicFunctionDetailLoadToken;
  basicFunctionDetailLoading.value = true;
  basicFunctionDetailError.value = "";
  try {
    const response = await getOntologyActionInfoInterface({ actionApi, ontologySpaceId });
    if (requestToken !== basicFunctionDetailLoadToken) return;
    if (response.code !== 200 || !response.data) throw new Error(response.message || "行为详情加载失败");
    applyActionInfoViewState(response.data, actionApi);
    const ontologyIds = normalizeBasicFunctionOntologyIds(response.data.basicFunction?.ontologyIdentifiers);
    basicFunctionOntologyIds.value = ontologyIds;
    const ontologyNameById = buildBasicFunctionOntologyNameMap(ontologyIds, response.data.basicFunction?.ontologyNames);
    const writeBackOntologyId =
      typeof response.data.basicFunction?.writeBack?.targetOntologyIdentifier === "string"
        ? response.data.basicFunction.writeBack.targetOntologyIdentifier.trim()
        : "";
    const writeBackOntologyName =
      typeof response.data.basicFunction?.writeBack?.targetOntologyName === "string" ? response.data.basicFunction.writeBack.targetOntologyName.trim() : "";
    if (writeBackOntologyId && writeBackOntologyName) {
      ontologyNameById[writeBackOntologyId] = writeBackOntologyName;
    }
    basicFunctionOntologyNameById.value = ontologyNameById;
    basicFunctionWriteBackOntologyId.value = writeBackOntologyId;
    const loadTasks: Array<Promise<void>> = [];
    if (ontologyIds.length === 1) {
      basicFunctionTestOntologyId.value = ontologyIds[0] ?? "";
      loadTasks.push(loadEntityList());
    } else if (ontologyIds.length > 1) {
      basicFunctionMultiEntityPickers.value = ontologyIds.map((ontologyId) => createBasicFunctionMultiEntityPickerState(ontologyId));
      loadTasks.push(...ontologyIds.map((ontologyId) => loadBasicFunctionMultiEntityList(ontologyId)));
    }
    if (writeBackOntologyId) {
      writeBackEntityPage.value = 1;
      loadTasks.push(loadBasicFunctionWriteBackEntityList());
    }
    await Promise.all(loadTasks);
  } catch (error) {
    if (requestToken !== basicFunctionDetailLoadToken) return;
    basicFunctionOntologyIds.value = [];
    basicFunctionOntologyNameById.value = {};
    basicFunctionTestOntologyId.value = "";
    actionInfoViewState.value = null;
    basicFunctionWriteBackOntologyId.value = "";
    clearBasicFunctionMultiEntityPickers();
    clearBasicFunctionWriteBackEntityState();
    basicFunctionDetailError.value = error instanceof Error ? error.message : "行为详情加载失败";
  } finally {
    if (requestToken === basicFunctionDetailLoadToken) basicFunctionDetailLoading.value = false;
  }
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
  const ontologyUniqueIdentifier = isBasicFunctionOperatorTest.value
    ? basicFunctionTestOntologyId.value.trim()
    : (props.behavior?.ontologyUniqIdentifier ?? "").trim();
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
    const rows = records.map((item, index) => mapEntityRecordToRow(item, index));
    const snapshot = selectedEntitySnapshot.value;
    entityRows.value = props.initialEntity && snapshot ? mergeBehaviorTestEntityRows(rows, snapshot) : rows;
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
    const viewState = applyActionInfoViewState(response.data, actionApi);
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
        entityPrimaryKey: fromRow.savedPrimaryKey ?? fromRow.primaryKey,
        linkEntityPrimaryKey: toRow.savedPrimaryKey ?? toRow.primaryKey,
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
    if (basicFunctionDetailLoading.value || basicFunctionDetailError.value) {
      ElMessage.warning("请等待基础函数测试上下文加载完成后再测试");
      return;
    }
    const requestParams = buildBasicFunctionTestRequestParams();
    if ("error" in requestParams) {
      ElMessage.warning(requestParams.error);
      return;
    }
    const requestToken = ++submitToken;
    submitLoading.value = true;
    basicOperatorTestResultText.value = "";
    try {
      const response = await postTestOntologyActionInterface(requestParams);
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
      entityPrimaryKey: selected.savedPrimaryKey ?? selected.primaryKey,
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
  contextToken += 1;
  entityLoadToken += 1;
  groupRowLoadToken += 1;
  basicFunctionDetailLoadToken += 1;
  mountedFunctionLoadToken += 1;
  submitToken += 1;
}

onScopeDispose(disposeBehaviorTest);

/** @description 加载测试上下文后预选当前实例，切换或关闭后拒绝旧初始化结果。 @param token 当前打开周期标识。 */
async function initializeBehaviorTestContext(token: number): Promise<void> {
  const initial = props.initialEntity;
  if (isApplicationTest.value || isRelationInstanceTest.value) {
    if (isApplicationTest.value) await loadApplicationTestForm();
    else await loadRelationTestContext();
    if (token !== contextToken || !props.modelValue) return;
    if (initial) parameterConfig.applyInitialEntitySelection(initial);
    return;
  }
  if (initial && initial.raw.ontologyUniqueIdentifier === props.behavior?.ontologyUniqIdentifier) {
    selectedEntityRowKey.value = initial.rowKey;
    selectedEntitySnapshot.value = initial;
  }
  await Promise.all([loadEntityList(), ...(isAttributeValueTest.value ? [loadBehaviorDetailParams()] : [])]);
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
      props.behavior?.kind,
      props.initialEntity,
    ] as const,
  ([visible]) => {
    const token = ++contextToken;
    if (!visible) {
      parameterConfig.cancelParameterRequests();
      entityLoadToken += 1;
      detailLoadToken.value += 1;
      groupRowLoadToken += 1;
      basicFunctionDetailLoadToken += 1;
      mountedFunctionLoadToken += 1;
      writeBackEntityLoadToken += 1;
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
      clearBasicFunctionTestContext();
      clearMountedFunctionDetailState();
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
    clearBasicFunctionTestContext();
    clearMountedFunctionDetailState();
    if (isBasicFunctionOperatorTest.value) {
      void loadBasicFunctionTestContext();
      return;
    }
    void initializeBehaviorTestContext(token);
  },
  { immediate: true },
);

watch(
  () => [props.modelValue, actionInfoViewState.value?.functionApi, props.spaceId, props.behavior?.functionOperatorVersion] as const,
  ([visible, functionApi]) => {
    if (!visible) return;
    const api = typeof functionApi === "string" ? functionApi.trim() : "";
    if (!api) {
      clearMountedFunctionDetailState();
      return;
    }
    void loadMountedFunctionDetail(api);
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
  flex-shrink: 0;
  margin: 0 0 12px;
  color: var(--aircas-color-text-secondary);
  font-size: 13px;
  line-height: 1.6;
}
.behavior-test-dialog__layout {
  display: grid;
  grid-template-columns: minmax(280px, 380px) minmax(0, 1fr);
  gap: 16px;
  flex: 1 1 auto;
  min-height: 0;
  height: min(70vh, 720px);
  max-height: min(70vh, 720px);
  overflow: hidden;
}
.behavior-test-dialog__layout--params-only {
  grid-template-columns: minmax(0, 1fr);
}
@media (max-width: 900px) {
  .behavior-test-dialog__layout {
    grid-template-columns: 1fr;
    height: auto;
    max-height: none;
  }
  .behavior-test-dialog__detail {
    max-height: 280px;
  }
  .behavior-test-dialog__execution {
    max-height: min(55vh, 520px);
  }
}
.behavior-test-dialog__detail,
.behavior-test-dialog__execution {
  min-width: 0;
  min-height: 0;
  padding: 12px;
  border: 1px solid var(--aircas-color-border);
  border-radius: 8px;
  background: var(--aircas-color-panel-background);
}
.behavior-test-dialog__detail {
  overflow-x: hidden;
  overflow-y: auto;
}
.behavior-test-dialog__execution {
  overflow-x: hidden;
  overflow-y: auto;
}
.behavior-test-dialog__description {
  margin: 0 0 12px;
  color: var(--aircas-color-text-secondary);
  font-size: 13px;
  line-height: 1.6;
  overflow-wrap: anywhere;
  word-break: break-word;
  white-space: normal;
}
.behavior-test-dialog__field-with-desc {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  max-width: 100%;
}
.behavior-test-dialog__field-with-desc > span:first-child {
  color: var(--aircas-color-text-primary);
  overflow-wrap: anywhere;
  word-break: break-word;
  white-space: normal;
}
.behavior-test-dialog__field-desc {
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
  line-height: 1.5;
  overflow-wrap: anywhere;
  word-break: break-word;
  white-space: normal;
}
.behavior-test-dialog__field-error {
  margin: 0;
  color: var(--aircas-color-danger);
  font-size: 12px;
  line-height: 1.5;
}
.behavior-test-dialog__function-summary {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}
.behavior-test-dialog__function-footer {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
}
.behavior-test-dialog__function-footer .behavior-test-dialog__field-desc {
  flex: 1;
  min-width: 0;
}
.behavior-test-dialog__function-detail-btn {
  flex-shrink: 0;
  padding: 0;
  height: auto;
  min-height: 0;
  font-size: 12px;
  line-height: 1.2;

  :deep(span) {
    font-size: 12px;
  }
}
.behavior-test-dialog__summary {
  width: 100%;
  max-width: 100%;

  :deep(.el-descriptions__body),
  :deep(.el-descriptions__table),
  :deep(table) {
    width: 100%;
    max-width: 100%;
    table-layout: fixed;
  }

  :deep(.el-descriptions__label) {
    width: 88px;
    white-space: normal;
    overflow-wrap: anywhere;
    word-break: break-word;
  }

  :deep(.el-descriptions__content) {
    min-width: 0;
    white-space: normal;
    overflow-wrap: anywhere;
    word-break: break-word;
  }
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
.behavior-test-dialog__multi-entity-picker {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0 0 12px;
}

.behavior-test-dialog__multi-entity-picker-label {
  margin: 0;
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
  line-height: 1.4;
}

.behavior-test-dialog__multi-entity-picker {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0 0 12px;
}
.behavior-test-dialog__multi-entity-picker-label {
  margin: 0;
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
  line-height: 1.4;
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

<style lang="scss">
.behavior-test-dialog.el-dialog {
  display: flex;
  flex-direction: column;
  max-height: min(92vh, 960px);
  margin-top: 4vh !important;
  overflow: hidden;
}
.behavior-test-dialog.el-dialog .el-dialog__header,
.behavior-test-dialog.el-dialog .el-dialog__footer {
  flex-shrink: 0;
}
.behavior-test-dialog.el-dialog .el-dialog__body {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 0;
  min-height: 0;
  overflow: hidden;
}
</style>
