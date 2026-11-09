<template>
  <el-dialog :model-value="modelValue" width="760px" append-to-body destroy-on-close :close-on-click-modal="false" @close="emit('update:modelValue', false)">
    <template #header>
      <div class="behavior-test-dialog__header">
        <span class="behavior-test-dialog__title">{{ dialogTitle }}</span>
        <el-tag v-if="behaviorCategoryLabel" size="small" effect="plain" type="info">{{ behaviorCategoryLabel }}</el-tag>
        <el-tag v-if="behaviorBasicActionLabel" size="small" effect="plain">{{ behaviorBasicActionLabel }}</el-tag>
      </div>
    </template>
    <p class="behavior-test-dialog__hint">{{ dialogHint }}</p>

    <template v-if="isApplicationTest">
      <section class="behavior-test-dialog__section">
        <h4 class="behavior-test-dialog__section-title">测试入参</h4>
        <p v-if="detailLoading" class="behavior-test-dialog__state" role="status">正在加载行为参数…</p>
        <p v-else-if="detailError" class="behavior-test-dialog__state" role="alert">{{ detailError }}</p>
        <el-table v-else-if="applicationInputRows.length" class="behavior-test-dialog__table" :data="applicationInputRows" row-key="rowKey" size="small">
          <el-table-column prop="paramName" label="参数名" min-width="120" show-overflow-tooltip />
          <el-table-column prop="propertyDisplayName" label="展示名称" min-width="120" show-overflow-tooltip />
          <el-table-column label="来源" width="100" show-overflow-tooltip>
            <template #default="{ row }">{{ formatApplicationInputSourceTypeLabel(asApplicationInputRow(row).sourceType) }}</template>
          </el-table-column>
          <el-table-column prop="paramType" label="类型" width="100" show-overflow-tooltip />
          <el-table-column label="参数值" min-width="260">
            <template #default="{ row }">
              <el-input
                v-if="normalizeApplicationSourceType(asApplicationInputRow(row).sourceType) === 'EXTERNAL'"
                :model-value="paramValues[asApplicationInputRow(row).paramName] ?? ''"
                :placeholder="`请输入 ${asApplicationInputRow(row).propertyDisplayName || asApplicationInputRow(row).paramName}`"
                clearable
                @update:model-value="updateParamValue(asApplicationInputRow(row).paramName, $event)"
              />
              <span v-else-if="normalizeApplicationSourceType(asApplicationInputRow(row).sourceType) === 'FIXED'">{{
                asApplicationInputRow(row).sourceConfig || "—"
              }}</span>
              <template v-else-if="normalizeApplicationSourceType(asApplicationInputRow(row).sourceType) === 'PROPERTY'">
                <div class="behavior-test-dialog__param-value-stack">
                  <el-select
                    v-if="findApplicationOntologyPicker(asApplicationInputRow(row).ontologyUniqueIdentifier)"
                    class="behavior-test-dialog__entity-select"
                    :model-value="findApplicationOntologyPicker(asApplicationInputRow(row).ontologyUniqueIdentifier)?.selectedRowKey || ''"
                    filterable
                    clearable
                    :loading="findApplicationOntologyPicker(asApplicationInputRow(row).ontologyUniqueIdentifier)?.loading"
                    :placeholder="`请选择 ${asApplicationInputRow(row).propertyDisplayName || asApplicationInputRow(row).paramName || '实例'}`"
                    @update:model-value="
                      (value) => updateApplicationOntologyEntitySelection(asApplicationInputRow(row).ontologyUniqueIdentifier, String(value ?? ''))
                    "
                  >
                    <el-option
                      v-for="option in listApplicationOntologySelectOptions(findApplicationOntologyPicker(asApplicationInputRow(row).ontologyUniqueIdentifier))"
                      :key="option.rowKey"
                      :label="formatApplicationEntityOptionLabel(option)"
                      :value="option.rowKey"
                    />
                    <template #footer>
                      <div
                        v-if="(findApplicationOntologyPicker(asApplicationInputRow(row).ontologyUniqueIdentifier)?.total ?? 0) > 0"
                        class="behavior-test-dialog__select-footer"
                        @mousedown.prevent
                      >
                        <el-pagination
                          small
                          layout="total, prev, pager, next"
                          :total="findApplicationOntologyPicker(asApplicationInputRow(row).ontologyUniqueIdentifier)?.total ?? 0"
                          :current-page="findApplicationOntologyPicker(asApplicationInputRow(row).ontologyUniqueIdentifier)?.page ?? 1"
                          :page-size="findApplicationOntologyPicker(asApplicationInputRow(row).ontologyUniqueIdentifier)?.pageSize ?? 10"
                          @current-change="(page) => changeApplicationOntologyEntityPage(asApplicationInputRow(row).ontologyUniqueIdentifier, page)"
                        />
                      </div>
                      <p
                        v-else-if="findApplicationOntologyPicker(asApplicationInputRow(row).ontologyUniqueIdentifier)?.error"
                        class="behavior-test-dialog__select-footer-error"
                        role="alert"
                      >
                        {{ findApplicationOntologyPicker(asApplicationInputRow(row).ontologyUniqueIdentifier)?.error }}
                      </p>
                    </template>
                  </el-select>
                  <span v-else class="behavior-test-dialog__state">缺少对象标识，无法选择实例</span>
                  <el-select
                    v-if="findApplicationStorageGroupPickerForRow(asApplicationInputRow(row))"
                    class="behavior-test-dialog__entity-select"
                    :model-value="findApplicationStorageGroupPickerForRow(asApplicationInputRow(row))?.selectedRowKey || ''"
                    filterable
                    clearable
                    :disabled="!findApplicationOntologyPicker(asApplicationInputRow(row).ontologyUniqueIdentifier)?.selectedEntity"
                    :loading="findApplicationStorageGroupPickerForRow(asApplicationInputRow(row))?.loading"
                    :placeholder="
                      findApplicationOntologyPicker(asApplicationInputRow(row).ontologyUniqueIdentifier)?.selectedEntity
                        ? `请选择 ${findApplicationStorageGroupPickerForRow(asApplicationInputRow(row))?.storageGroup || '分组'} 数据行`
                        : '请先选择实例'
                    "
                    @update:model-value="
                      (value) =>
                        updateApplicationStorageGroupRowSelection(
                          findApplicationStorageGroupPickerForRow(asApplicationInputRow(row))?.pickerKey || '',
                          String(value ?? ''),
                        )
                    "
                  >
                    <el-option
                      v-for="option in listApplicationStorageGroupSelectOptions(findApplicationStorageGroupPickerForRow(asApplicationInputRow(row)))"
                      :key="option.rowKey"
                      :label="formatApplicationStorageGroupOptionLabel(option)"
                      :value="option.rowKey"
                    />
                    <template #footer>
                      <div
                        v-if="(findApplicationStorageGroupPickerForRow(asApplicationInputRow(row))?.total ?? 0) > 0"
                        class="behavior-test-dialog__select-footer"
                        @mousedown.prevent
                      >
                        <el-pagination
                          small
                          layout="total, prev, pager, next"
                          :total="findApplicationStorageGroupPickerForRow(asApplicationInputRow(row))?.total ?? 0"
                          :current-page="findApplicationStorageGroupPickerForRow(asApplicationInputRow(row))?.page ?? 1"
                          :page-size="findApplicationStorageGroupPickerForRow(asApplicationInputRow(row))?.pageSize ?? 10"
                          @current-change="
                            (page) =>
                              changeApplicationStorageGroupRowPage(findApplicationStorageGroupPickerForRow(asApplicationInputRow(row))?.pickerKey || '', page)
                          "
                        />
                      </div>
                      <p
                        v-else-if="findApplicationStorageGroupPickerForRow(asApplicationInputRow(row))?.error"
                        class="behavior-test-dialog__select-footer-error"
                        role="alert"
                      >
                        {{ findApplicationStorageGroupPickerForRow(asApplicationInputRow(row))?.error }}
                      </p>
                    </template>
                  </el-select>
                </div>
              </template>
              <span v-else>—</span>
            </template>
          </el-table-column>
        </el-table>
        <p v-else class="behavior-test-dialog__state" role="status">暂无输入参数</p>
      </section>

      <section v-if="!detailLoading && !detailError && applicationWritePropertyOutputRows.length" class="behavior-test-dialog__section">
        <h4 class="behavior-test-dialog__section-title">写回属性出参</h4>
        <el-table class="behavior-test-dialog__table" :data="applicationWritePropertyOutputRows" row-key="rowKey" size="small">
          <el-table-column prop="paramName" label="参数名" min-width="120" show-overflow-tooltip />
          <el-table-column prop="propertyDisplayName" label="展示名称" min-width="120" show-overflow-tooltip />
          <el-table-column label="输出方式" width="120" show-overflow-tooltip>
            <template #default="{ row }">{{ formatApplicationOutputModeLabel(asApplicationInputRow(row).outputMode) }}</template>
          </el-table-column>
          <el-table-column label="参数值" min-width="260">
            <template #default="{ row }">
              <div class="behavior-test-dialog__param-value-stack">
                <el-select
                  v-if="findApplicationOntologyPicker(asApplicationInputRow(row).ontologyUniqueIdentifier)"
                  class="behavior-test-dialog__entity-select"
                  :model-value="findApplicationOntologyPicker(asApplicationInputRow(row).ontologyUniqueIdentifier)?.selectedRowKey || ''"
                  filterable
                  clearable
                  :loading="findApplicationOntologyPicker(asApplicationInputRow(row).ontologyUniqueIdentifier)?.loading"
                  :placeholder="`请选择 ${asApplicationInputRow(row).propertyDisplayName || asApplicationInputRow(row).paramName || '实例'}`"
                  @update:model-value="
                    (value) => updateApplicationOntologyEntitySelection(asApplicationInputRow(row).ontologyUniqueIdentifier, String(value ?? ''))
                  "
                >
                  <el-option
                    v-for="option in listApplicationOntologySelectOptions(findApplicationOntologyPicker(asApplicationInputRow(row).ontologyUniqueIdentifier))"
                    :key="option.rowKey"
                    :label="formatApplicationEntityOptionLabel(option)"
                    :value="option.rowKey"
                  />
                  <template #footer>
                    <div
                      v-if="(findApplicationOntologyPicker(asApplicationInputRow(row).ontologyUniqueIdentifier)?.total ?? 0) > 0"
                      class="behavior-test-dialog__select-footer"
                      @mousedown.prevent
                    >
                      <el-pagination
                        small
                        layout="total, prev, pager, next"
                        :total="findApplicationOntologyPicker(asApplicationInputRow(row).ontologyUniqueIdentifier)?.total ?? 0"
                        :current-page="findApplicationOntologyPicker(asApplicationInputRow(row).ontologyUniqueIdentifier)?.page ?? 1"
                        :page-size="findApplicationOntologyPicker(asApplicationInputRow(row).ontologyUniqueIdentifier)?.pageSize ?? 10"
                        @current-change="(page) => changeApplicationOntologyEntityPage(asApplicationInputRow(row).ontologyUniqueIdentifier, page)"
                      />
                    </div>
                    <p
                      v-else-if="findApplicationOntologyPicker(asApplicationInputRow(row).ontologyUniqueIdentifier)?.error"
                      class="behavior-test-dialog__select-footer-error"
                      role="alert"
                    >
                      {{ findApplicationOntologyPicker(asApplicationInputRow(row).ontologyUniqueIdentifier)?.error }}
                    </p>
                  </template>
                </el-select>
                <span v-else class="behavior-test-dialog__state">缺少对象标识，无法选择实例</span>
                <el-select
                  v-if="findApplicationStorageGroupPickerForRow(asApplicationInputRow(row))"
                  class="behavior-test-dialog__entity-select"
                  :model-value="findApplicationStorageGroupPickerForRow(asApplicationInputRow(row))?.selectedRowKey || ''"
                  filterable
                  clearable
                  :disabled="!findApplicationOntologyPicker(asApplicationInputRow(row).ontologyUniqueIdentifier)?.selectedEntity"
                  :loading="findApplicationStorageGroupPickerForRow(asApplicationInputRow(row))?.loading"
                  :placeholder="
                    findApplicationOntologyPicker(asApplicationInputRow(row).ontologyUniqueIdentifier)?.selectedEntity
                      ? `请选择 ${findApplicationStorageGroupPickerForRow(asApplicationInputRow(row))?.storageGroup || '分组'} 数据行`
                      : '请先选择实例'
                  "
                  @update:model-value="
                    (value) =>
                      updateApplicationStorageGroupRowSelection(
                        findApplicationStorageGroupPickerForRow(asApplicationInputRow(row))?.pickerKey || '',
                        String(value ?? ''),
                      )
                  "
                >
                  <el-option
                    v-for="option in listApplicationStorageGroupSelectOptions(findApplicationStorageGroupPickerForRow(asApplicationInputRow(row)))"
                    :key="option.rowKey"
                    :label="formatApplicationStorageGroupOptionLabel(option)"
                    :value="option.rowKey"
                  />
                  <template #footer>
                    <div
                      v-if="(findApplicationStorageGroupPickerForRow(asApplicationInputRow(row))?.total ?? 0) > 0"
                      class="behavior-test-dialog__select-footer"
                      @mousedown.prevent
                    >
                      <el-pagination
                        small
                        layout="total, prev, pager, next"
                        :total="findApplicationStorageGroupPickerForRow(asApplicationInputRow(row))?.total ?? 0"
                        :current-page="findApplicationStorageGroupPickerForRow(asApplicationInputRow(row))?.page ?? 1"
                        :page-size="findApplicationStorageGroupPickerForRow(asApplicationInputRow(row))?.pageSize ?? 10"
                        @current-change="
                          (page) =>
                            changeApplicationStorageGroupRowPage(findApplicationStorageGroupPickerForRow(asApplicationInputRow(row))?.pickerKey || '', page)
                        "
                      />
                    </div>
                    <p
                      v-else-if="findApplicationStorageGroupPickerForRow(asApplicationInputRow(row))?.error"
                      class="behavior-test-dialog__select-footer-error"
                      role="alert"
                    >
                      {{ findApplicationStorageGroupPickerForRow(asApplicationInputRow(row))?.error }}
                    </p>
                  </template>
                </el-select>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </section>
    </template>

    <section v-else-if="isBasicFunctionOperatorTest" class="behavior-test-dialog__section">
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

    <template v-if="showRelationLinkForm">
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

    <section v-if="isApplicationTest && applicationTestResultText" class="behavior-test-dialog__section">
      <h4 class="behavior-test-dialog__section-title">测试结果</h4>
      <el-input class="behavior-test-dialog__result" type="textarea" :model-value="applicationTestResultText" :rows="10" readonly resize="vertical" />
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
      <el-button v-if="showRelationLinkForm" :disabled="submitLoading" @click="openEntityLinkData">查看实例关系数据</el-button>
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
import { computed, reactive, ref, watch } from "vue";
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
  type OntologyEntityInfo,
  type OntologyEntityRowDetailPageData,
  type OntologyEntityRowDetailVO,
  type PostOntologyEntityAllLinkParams,
  type SpaceBehaviorItem,
  type TestOntologyActionData,
} from "@/types";
import BehaviorEntityLinkDataDialog from "./BehaviorEntityLinkDataDialog.vue";
import BehaviorEntityRowDetailDialog from "./BehaviorEntityRowDetailDialog.vue";
import { buildApplicationTestRequestParams, type ApplicationTestEntityBindingSelection } from "../utils/buildApplicationTestRequestParams";
import { coerceBehaviorTestParamValue } from "../utils/coerceBehaviorTestParamValue";
import {
  buildApplicationStorageGroupPickerKey,
  collectApplicationPropertyOntologyPickers,
  collectApplicationStorageGroupPickers,
  formatApplicationInputSourceTypeLabel,
  formatApplicationOutputModeLabel,
} from "../utils/collectApplicationPropertyOntologyPickers";
import {
  mapOntologyEntityRowDetailPageToDataRows,
  mapOntologyEntityRowDetailPageToViewDetail,
  type BehaviorTestEntityDataRow,
} from "../utils/mapOntologyEntityRowDetailToDataRows";
import { mapOntologyActionInfoToViewState, type SpaceBehaviorActionInfoViewParamRow } from "../utils/mapOntologyActionInfoToViewState";
import { isMainStorageGroup, normalizeStorageGroup } from "../utils/resolveAttributeValueSelection";

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

/** 应用行为 PROPERTY 入参对应的对象实例选择器状态。 */
interface ApplicationOntologyEntityPicker {
  ontologyUniqueIdentifier: string;
  label: string;
  loading: boolean;
  error: string;
  rows: BehaviorTestEntityRow[];
  total: number;
  page: number;
  pageSize: number;
  selectedRowKey: string;
  /** 已选实体；跨页保留，供下拉回显。 */
  selectedEntity: BehaviorTestEntityRow | null;
}

/** 应用行为非 main 存储分组数据行选择器状态。 */
interface ApplicationStorageGroupPicker {
  pickerKey: string;
  ontologyUniqueIdentifier: string;
  storageGroup: string;
  label: string;
  loading: boolean;
  error: string;
  rows: BehaviorTestEntityDataRow[];
  total: number;
  page: number;
  pageSize: number;
  selectedRowKey: string;
  /** 已选数据行；跨页保留，供下拉回显。 */
  selectedDataRow: BehaviorTestEntityDataRow | null;
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
/** 行为详情顶层对象标识；应用测试组装 entityPrimaryKey 时使用。 */
const resolvedOntologyUniqIdentifier = ref("");
let detailLoadToken = 0;

/** 应用行为测试 INPUT 行。 */
const applicationInputRows = ref<SpaceBehaviorActionInfoViewParamRow[]>([]);
/** 应用行为测试 WRITE_PROPERTY 出参行。 */
const applicationWritePropertyOutputRows = ref<SpaceBehaviorActionInfoViewParamRow[]>([]);
/** 应用行为 PROPERTY / WRITE_PROPERTY 对象实例选择器。 */
const applicationOntologyPickers = ref<ApplicationOntologyEntityPicker[]>([]);
const applicationOntologyLoadTokens: Record<string, number> = {};
/** 应用行为非 main 存储分组数据行选择器。 */
const applicationStorageGroupPickers = ref<ApplicationStorageGroupPicker[]>([]);
const applicationStorageGroupLoadTokens: Record<string, number> = {};
/** 应用行为详情是否配置了关系 linkMapping。 */
const applicationHasLinkMapping = ref(false);
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

const isApplicationTest = computed(() => props.behavior?.kind === "application");
const isBasicFunctionOperatorTest = computed(() => !isApplicationTest.value && props.behavior?.valueType === "basicFunctionOperator");
const isAttributeValueTest = computed(() => !isApplicationTest.value && props.behavior?.valueType === "attributeValue");
const isRelationInstanceTest = computed(() => !isApplicationTest.value && props.behavior?.valueType === "relationInstance");
const isCreateTest = computed(() => isAttributeValueTest.value && props.behavior?.basicAction === "create");
const isUpdateTest = computed(() => isAttributeValueTest.value && props.behavior?.basicAction === "update");
const isDeleteTest = computed(() => isAttributeValueTest.value && props.behavior?.basicAction === "delete");
const needsDataRowSelection = computed(() => isUpdateTest.value || isDeleteTest.value);
/** 属性值-编辑且存储分组为 main 时，数据行默认勾选且不可取消。 */
const isMainGroupDataRowLocked = computed(() => isUpdateTest.value && isMainStorageGroup(resolvedStorageGroup.value));
/** 关系实例测试，或应用行为配置了 linkMapping 时展示关系两端表单。 */
const showRelationLinkForm = computed(() => isRelationInstanceTest.value || (isApplicationTest.value && applicationHasLinkMapping.value));

const dialogHint = computed(() => {
  if (isApplicationTest.value && applicationHasLinkMapping.value) {
    return "填写入参并选择关系两端实例后开始测试。";
  }
  if (isApplicationTest.value) return "根据入参来源填写外部值或选择对象实例后开始测试。";
  if (isRelationInstanceTest.value) return "选择关系两端对象实例后执行关系实例测试。";
  if (isBasicFunctionOperatorTest.value) return "确认后直接执行基础函数算子测试。";
  if (isUpdateTest.value) return "选择实体实例与数据行后，在「查看实例数据」中填写测试参数并开始测试。";
  if (isCreateTest.value) return "选择实体实例后，在「查看实例数据」中填写测试参数并开始测试。";
  if (isDeleteTest.value) return "选择实体实例与数据行，用于属性值-删除测试。";
  return "选择实体实例后开始测试。";
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

function clearDetailParamState(): void {
  paramRows.value = [];
  resetParamValues([]);
  detailError.value = "";
  detailLoading.value = false;
  resolvedActionApi.value = "";
  resolvedStorageGroup.value = "";
  resolvedOntologyUniqIdentifier.value = "";
  submitError.value = "";
  submitLoading.value = false;
  clearApplicationTestFormState();
  clearApplicationTestResult();
}

/**
 * @description 清空应用行为测试入参、写回出参与对象实例选择器。
 */
function clearApplicationTestFormState(): void {
  applicationInputRows.value = [];
  applicationWritePropertyOutputRows.value = [];
  applicationOntologyPickers.value = [];
  applicationStorageGroupPickers.value = [];
  applicationHasLinkMapping.value = false;
  for (const key of Object.keys(applicationOntologyLoadTokens)) delete applicationOntologyLoadTokens[key];
  for (const key of Object.keys(applicationStorageGroupLoadTokens)) delete applicationStorageGroupLoadTokens[key];
}

/**
 * @description 从出参行过滤 WRITE_PROPERTY 写回属性行。
 * @param outputRows 行为详情出参行。
 * @returns WRITE_PROPERTY 行列表。
 */
function filterWritePropertyOutputRows(outputRows: SpaceBehaviorActionInfoViewParamRow[]): SpaceBehaviorActionInfoViewParamRow[] {
  return outputRows.filter((row) => (row.outputMode ?? "").trim().toUpperCase() === "WRITE_PROPERTY");
}

/**
 * @description 规范化应用入参 sourceType。
 * @param sourceType 原始来源。
 * @returns 大写来源；空为 "".
 */
function normalizeApplicationSourceType(sourceType: string): string {
  return sourceType.trim().toUpperCase();
}

/**
 * @description 将表格行收窄为应用行为 INPUT 行。
 * @param row 表格行。
 * @returns INPUT 行。
 */
function asApplicationInputRow(row: unknown): SpaceBehaviorActionInfoViewParamRow {
  return row as SpaceBehaviorActionInfoViewParamRow;
}

/**
 * @description 按对象标识查找应用行为实例选择器。
 * @param ontologyUniqueIdentifier 对象唯一标识。
 * @returns 选择器；未找到为 null。
 */
function findApplicationOntologyPicker(ontologyUniqueIdentifier: string): ApplicationOntologyEntityPicker | null {
  const ontologyId = ontologyUniqueIdentifier.trim();
  if (!ontologyId) return null;
  return applicationOntologyPickers.value.find((item) => item.ontologyUniqueIdentifier === ontologyId) ?? null;
}

/**
 * @description 按选择器键查找非 main 存储分组数据行选择器。
 * @param pickerKey ontology::storageGroup。
 * @returns 选择器；未找到为 null。
 */
function findApplicationStorageGroupPicker(pickerKey: string): ApplicationStorageGroupPicker | null {
  const key = pickerKey.trim();
  if (!key) return null;
  return applicationStorageGroupPickers.value.find((item) => item.pickerKey === key) ?? null;
}

/**
 * @description 按参数行查找对应的非 main 存储分组数据行选择器。
 * @param row 入参或写回出参行。
 * @returns 选择器；main/空或不存在时为 null。
 */
function findApplicationStorageGroupPickerForRow(row: SpaceBehaviorActionInfoViewParamRow): ApplicationStorageGroupPicker | null {
  const ontologyId = (row.ontologyUniqueIdentifier ?? "").trim();
  const storageGroup = normalizeStorageGroup(row.storageGroup);
  if (!ontologyId || !storageGroup || isMainStorageGroup(storageGroup)) return null;
  return findApplicationStorageGroupPicker(buildApplicationStorageGroupPickerKey(ontologyId, storageGroup));
}

/**
 * @description 更新指定存储分组数据行选择器的部分字段。
 * @param pickerKey 选择器键。
 * @param patch 部分字段。
 */
function patchApplicationStorageGroupPicker(pickerKey: string, patch: Partial<ApplicationStorageGroupPicker>): void {
  const key = pickerKey.trim();
  applicationStorageGroupPickers.value = applicationStorageGroupPickers.value.map((item) => (item.pickerKey === key ? { ...item, ...patch } : item));
}

/**
 * @description 格式化存储分组数据行下拉选项文案。
 * @param row 数据行。
 * @returns 选项文案。
 */
function formatApplicationStorageGroupOptionLabel(row: BehaviorTestEntityDataRow): string {
  const primaryKey = row.dataPrimaryKeyLabel.trim() || "—";
  const summary = row.propertySummary.trim();
  return summary && summary !== "—" ? `${primaryKey} · ${summary}` : primaryKey;
}

/**
 * @description 组装存储分组数据行下拉选项；已选行不在当前页时前置保留以便回显。
 * @param picker 存储分组选择器。
 * @returns 选项列表。
 */
function listApplicationStorageGroupSelectOptions(picker: ApplicationStorageGroupPicker | null | undefined): BehaviorTestEntityDataRow[] {
  if (!picker) return [];
  const selected = picker.selectedDataRow;
  if (!selected || !picker.selectedRowKey) return picker.rows;
  if (picker.rows.some((item) => item.rowKey === selected.rowKey)) return picker.rows;
  return [selected, ...picker.rows];
}

/**
 * @description 清空指定对象下所有非 main 分组数据行选中态（保留列表缓存）。
 * @param ontologyUniqueIdentifier 对象唯一标识。
 */
function clearApplicationStorageGroupSelectionsForOntology(ontologyUniqueIdentifier: string): void {
  const ontologyId = ontologyUniqueIdentifier.trim();
  applicationStorageGroupPickers.value = applicationStorageGroupPickers.value.map((item) =>
    item.ontologyUniqueIdentifier === ontologyId
      ? { ...item, selectedRowKey: "", selectedDataRow: null, rows: [], total: 0, page: 1, error: "", loading: false }
      : item,
  );
}

/**
 * @description 加载应用行为非 main 存储分组数据行分页列表。
 * @param pickerKey 选择器键。
 */
async function loadApplicationStorageGroupDataRows(pickerKey: string): Promise<void> {
  const key = pickerKey.trim();
  const picker = findApplicationStorageGroupPicker(key);
  if (!picker) return;
  const ontologyPicker = findApplicationOntologyPicker(picker.ontologyUniqueIdentifier);
  const selectedEntity = ontologyPicker?.selectedEntity ?? null;
  if (!selectedEntity || selectedEntity.primaryKey === "") {
    patchApplicationStorageGroupPicker(key, {
      loading: false,
      error: "",
      rows: [],
      total: 0,
      selectedRowKey: "",
      selectedDataRow: null,
    });
    return;
  }
  const requestToken = (applicationStorageGroupLoadTokens[key] ?? 0) + 1;
  applicationStorageGroupLoadTokens[key] = requestToken;
  patchApplicationStorageGroupPicker(key, { loading: true, error: "" });
  try {
    const response = await postGetOntologyEntityRowDetailPageInterface({
      ontologyUniqueIdentifier: picker.ontologyUniqueIdentifier,
      entityPrimaryKey: selectedEntity.primaryKey,
      sort: "DESC",
      storageGroup: picker.storageGroup,
      pageNum: picker.page,
      pageSize: picker.pageSize,
    });
    if (applicationStorageGroupLoadTokens[key] !== requestToken) return;
    if (response.code !== 200) throw new Error(response.message || "实体行数据加载失败");
    const pageData = response.data ?? null;
    const rows = mapOntologyEntityRowDetailPageToDataRows(pageData, picker.storageGroup);
    const selectedOnPage = picker.selectedRowKey ? (rows.find((item) => item.rowKey === picker.selectedRowKey) ?? null) : null;
    patchApplicationStorageGroupPicker(key, {
      loading: false,
      error: "",
      rows,
      total: typeof pageData?.total === "number" ? pageData.total : 0,
      selectedDataRow: selectedOnPage ?? picker.selectedDataRow,
    });
  } catch (error) {
    if (applicationStorageGroupLoadTokens[key] !== requestToken) return;
    patchApplicationStorageGroupPicker(key, {
      loading: false,
      error: error instanceof Error ? error.message : "实体行数据加载失败",
      rows: [],
      total: 0,
    });
  }
}

/**
 * @description 切换应用行为存储分组数据行列表页码。
 * @param pickerKey 选择器键。
 * @param page 页码。
 */
function changeApplicationStorageGroupRowPage(pickerKey: string, page: number): void {
  patchApplicationStorageGroupPicker(pickerKey, { page });
  void loadApplicationStorageGroupDataRows(pickerKey);
}

/**
 * @description 更新应用行为存储分组数据行下拉选中值。
 * @param pickerKey 选择器键。
 * @param selectedRowKey 选中行键；空串表示清空。
 */
function updateApplicationStorageGroupRowSelection(pickerKey: string, selectedRowKey: string): void {
  const picker = findApplicationStorageGroupPicker(pickerKey);
  if (!picker) return;
  const nextKey = selectedRowKey.trim();
  if (!nextKey) {
    patchApplicationStorageGroupPicker(pickerKey, { selectedRowKey: "", selectedDataRow: null });
    return;
  }
  const matched =
    listApplicationStorageGroupSelectOptions(picker).find((item) => item.rowKey === nextKey) ?? picker.rows.find((item) => item.rowKey === nextKey) ?? null;
  patchApplicationStorageGroupPicker(pickerKey, {
    selectedRowKey: nextKey,
    selectedDataRow: matched,
  });
}

/**
 * @description 按 PROPERTY / WRITE_PROPERTY 行组装对象绑定选择快照。
 * @param rows 参数行。
 * @param sideLabel 错误文案侧别名。
 * @returns 选择列表或错误。
 */
function collectApplicationEntityBindingSelections(
  rows: SpaceBehaviorActionInfoViewParamRow[],
  sideLabel: string,
): { ok: true; selections: ApplicationTestEntityBindingSelection[] } | { ok: false; error: string } {
  const selections: ApplicationTestEntityBindingSelection[] = [];
  for (const row of rows) {
    const ontologyId = (row.ontologyUniqueIdentifier ?? "").trim();
    if (!ontologyId) return { ok: false, error: `${sideLabel}缺少对象标识，无法测试` };
    const ontologyPicker = findApplicationOntologyPicker(ontologyId);
    if (!ontologyPicker) return { ok: false, error: `${sideLabel}缺少对象「${ontologyId}」实例选择器` };
    if (ontologyPicker.loading) return { ok: false, error: "请等待对象实例列表加载完成后再测试" };
    const selectedEntity = ontologyPicker.selectedEntity;
    if (!selectedEntity || selectedEntity.primaryKey === "") {
      return { ok: false, error: `请先选择「${ontologyPicker.label || ontologyId}」实例` };
    }
    const storageGroup = normalizeStorageGroup(row.storageGroup);
    let dataPrimaryKey: ApplicationTestEntityBindingSelection["dataPrimaryKey"];
    if (!isMainStorageGroup(storageGroup) && storageGroup) {
      const storagePicker = findApplicationStorageGroupPicker(buildApplicationStorageGroupPickerKey(ontologyId, storageGroup));
      if (!storagePicker) return { ok: false, error: `请先选择${sideLabel}对象「${ontologyId}」存储分组「${storageGroup}」的数据行` };
      if (storagePicker.loading) return { ok: false, error: "请等待数据行列表加载完成后再测试" };
      if (!storagePicker.selectedDataRow) {
        return { ok: false, error: `请先选择${sideLabel}对象「${ontologyId}」存储分组「${storageGroup}」的数据行` };
      }
      dataPrimaryKey = storagePicker.selectedDataRow.dataPrimaryKey;
    }
    selections.push({
      ontologyUniqueIdentifier: ontologyId,
      entityPrimaryKey: selectedEntity.primaryKey,
      storageGroup,
      dataPrimaryKey,
    });
  }
  return { ok: true, selections };
}

/**
 * @description 更新指定对象实例选择器的部分字段。
 * @param ontologyUniqueIdentifier 对象唯一标识。
 * @param patch 部分字段。
 */
function patchApplicationOntologyPicker(ontologyUniqueIdentifier: string, patch: Partial<ApplicationOntologyEntityPicker>): void {
  const ontologyId = ontologyUniqueIdentifier.trim();
  applicationOntologyPickers.value = applicationOntologyPickers.value.map((item) =>
    item.ontologyUniqueIdentifier === ontologyId ? { ...item, ...patch } : item,
  );
}

/**
 * @description 格式化应用行为实例下拉选项文案。
 * @param row 实体行。
 * @returns 选项文案。
 */
function formatApplicationEntityOptionLabel(row: BehaviorTestEntityRow): string {
  const name = row.displayName.trim() || "未命名实体";
  const primaryKey = row.primaryKeyLabel.trim() || "—";
  return `${name} · ${primaryKey}`;
}

/**
 * @description 组装下拉选项；已选实体不在当前页时前置保留以便回显。
 * @param picker 对象实例选择器。
 * @returns 选项列表。
 */
function listApplicationOntologySelectOptions(picker: ApplicationOntologyEntityPicker | null | undefined): BehaviorTestEntityRow[] {
  if (!picker) return [];
  const selected = picker.selectedEntity;
  if (!selected || !picker.selectedRowKey) return picker.rows;
  if (picker.rows.some((item) => item.rowKey === selected.rowKey)) return picker.rows;
  return [selected, ...picker.rows];
}

/**
 * @description 加载应用行为 PROPERTY 对象下的实体分页列表。
 * @param ontologyUniqueIdentifier 对象唯一标识。
 */
async function loadApplicationOntologyEntityList(ontologyUniqueIdentifier: string): Promise<void> {
  const ontologyId = ontologyUniqueIdentifier.trim();
  const picker = findApplicationOntologyPicker(ontologyId);
  if (!picker) return;
  if (!ontologyId) {
    patchApplicationOntologyPicker(ontologyId, {
      loading: false,
      error: "缺少对象标识，无法加载实体列表",
      rows: [],
      total: 0,
    });
    return;
  }
  const requestToken = (applicationOntologyLoadTokens[ontologyId] ?? 0) + 1;
  applicationOntologyLoadTokens[ontologyId] = requestToken;
  patchApplicationOntologyPicker(ontologyId, { loading: true, error: "" });
  try {
    const response = await getOntologyEntitiesInterface({
      ontologyUniqueIdentifier: ontologyId,
      pageNum: picker.page,
      pageSize: picker.pageSize,
    });
    if (applicationOntologyLoadTokens[ontologyId] !== requestToken) return;
    if (response.code !== 200 || !response.data) throw new Error(response.message || "实体列表加载失败");
    const records = Array.isArray(response.data.records) ? response.data.records : [];
    const rows = records.map((item, index) => mapEntityRecordToRow(item, index));
    const selectedOnPage = picker.selectedRowKey ? (rows.find((item) => item.rowKey === picker.selectedRowKey) ?? null) : null;
    patchApplicationOntologyPicker(ontologyId, {
      loading: false,
      error: "",
      rows,
      total: Number(response.data.total) || records.length,
      selectedEntity: selectedOnPage ?? picker.selectedEntity,
    });
  } catch (error) {
    if (applicationOntologyLoadTokens[ontologyId] !== requestToken) return;
    patchApplicationOntologyPicker(ontologyId, {
      loading: false,
      error: error instanceof Error ? error.message : "实体列表加载失败",
      rows: [],
      total: 0,
    });
  }
}

/**
 * @description 切换应用行为对象实例列表页码。
 * @param ontologyUniqueIdentifier 对象唯一标识。
 * @param page 页码。
 */
function changeApplicationOntologyEntityPage(ontologyUniqueIdentifier: string, page: number): void {
  patchApplicationOntologyPicker(ontologyUniqueIdentifier, { page });
  void loadApplicationOntologyEntityList(ontologyUniqueIdentifier);
}

/**
 * @description 更新应用行为对象实例下拉选中值；变更后重置并按需加载非 main 分组数据行。
 * @param ontologyUniqueIdentifier 对象唯一标识。
 * @param selectedRowKey 选中行键；空串表示清空。
 */
function updateApplicationOntologyEntitySelection(ontologyUniqueIdentifier: string, selectedRowKey: string): void {
  const picker = findApplicationOntologyPicker(ontologyUniqueIdentifier);
  if (!picker) return;
  const nextKey = selectedRowKey.trim();
  if (!nextKey) {
    patchApplicationOntologyPicker(ontologyUniqueIdentifier, { selectedRowKey: "", selectedEntity: null });
    clearApplicationStorageGroupSelectionsForOntology(ontologyUniqueIdentifier);
    return;
  }
  const matched =
    listApplicationOntologySelectOptions(picker).find((item) => item.rowKey === nextKey) ?? picker.rows.find((item) => item.rowKey === nextKey) ?? null;
  patchApplicationOntologyPicker(ontologyUniqueIdentifier, {
    selectedRowKey: nextKey,
    selectedEntity: matched,
  });
  clearApplicationStorageGroupSelectionsForOntology(ontologyUniqueIdentifier);
  if (!matched) return;
  for (const storagePicker of applicationStorageGroupPickers.value) {
    if (storagePicker.ontologyUniqueIdentifier !== ontologyUniqueIdentifier.trim()) continue;
    void loadApplicationStorageGroupDataRows(storagePicker.pickerKey);
  }
}

/**
 * @description 按关系唯一标识加载应用行为关系两端上下文（不强制挂载侧匹配）。
 * @param linkId 关系唯一标识。
 */
async function loadApplicationLinkContext(linkId: string): Promise<void> {
  const uniqueIdentifier = linkId.trim();
  if (!uniqueIdentifier) {
    applicationHasLinkMapping.value = false;
    clearRelationTestState();
    return;
  }
  const requestToken = ++relationContextLoadToken;
  applicationHasLinkMapping.value = true;
  relationContextLoading.value = true;
  relationContextError.value = "";
  try {
    ontologyLinkUniqIdentifier.value = uniqueIdentifier;
    const linkResponse = await getOntologyLinkByUniqueIdentifierInterface({ uniqueIdentifier });
    if (requestToken !== relationContextLoadToken) return;
    if (linkResponse.code !== 200 || !linkResponse.data) throw new Error(linkResponse.message || "关系详情加载失败");
    const linkData = linkResponse.data;
    ontologyNameFrom.value = (linkData.ontologyNameFrom ?? "").trim();
    ontologyNameTo.value = (linkData.ontologyNameTo ?? "").trim();
    ontologyUniqueIdentifierFrom.value = (linkData.ontologyUniqueIdentifierFrom ?? "").trim();
    ontologyUniqueIdentifierTo.value = (linkData.ontologyUniqueIdentifierTo ?? "").trim();
    const mountOntologyId = behaviorOntologyUniqueIdentifier.value;
    if (mountOntologyId && mountOntologyId === ontologyUniqueIdentifierFrom.value) {
      relationMountSide.value = "from";
    } else if (mountOntologyId && mountOntologyId === ontologyUniqueIdentifierTo.value) {
      relationMountSide.value = "to";
    } else {
      relationMountSide.value = "";
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
 * @description 加载应用行为测试表单：详情 INPUT 行、PROPERTY 实例选择，以及可选关系两端。
 */
async function loadApplicationTestForm(): Promise<void> {
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
  applicationInputRows.value = [];
  applicationWritePropertyOutputRows.value = [];
  applicationOntologyPickers.value = [];
  applicationStorageGroupPickers.value = [];
  applicationHasLinkMapping.value = false;
  clearRelationTestState();
  try {
    const response = await getOntologyActionInfoInterface({ actionApi, ontologySpaceId });
    if (requestToken !== detailLoadToken) return;
    if (response.code !== 200 || !response.data) throw new Error(response.message || "行为详情加载失败");
    const viewState = mapOntologyActionInfoToViewState(response.data);
    resolvedActionApi.value = viewState.actionApi || actionApi;
    resolvedStorageGroup.value = viewState.storageGroup.trim();
    resolvedOntologyUniqIdentifier.value = viewState.ontologyUniqIdentifier.trim();
    applicationInputRows.value = viewState.inputRows;
    const writePropertyOutputRows = filterWritePropertyOutputRows(viewState.outputRows);
    applicationWritePropertyOutputRows.value = writePropertyOutputRows;
    const externalRows = mapExternalParamRows(viewState.inputRows);
    paramRows.value = externalRows;
    resetParamValues(externalRows);
    clearApplicationTestResult();
    const pickerSeeds = collectApplicationPropertyOntologyPickers(viewState.inputRows, writePropertyOutputRows);
    applicationOntologyPickers.value = pickerSeeds.map((seed) => ({
      ontologyUniqueIdentifier: seed.ontologyUniqueIdentifier,
      label: seed.label,
      loading: false,
      error: "",
      rows: [],
      total: 0,
      page: 1,
      pageSize: 10,
      selectedRowKey: "",
      selectedEntity: null,
    }));
    const storageGroupSeeds = collectApplicationStorageGroupPickers(viewState.inputRows, writePropertyOutputRows);
    applicationStorageGroupPickers.value = storageGroupSeeds.map((seed) => ({
      pickerKey: seed.pickerKey,
      ontologyUniqueIdentifier: seed.ontologyUniqueIdentifier,
      storageGroup: seed.storageGroup,
      label: seed.label,
      loading: false,
      error: "",
      rows: [],
      total: 0,
      page: 1,
      pageSize: 10,
      selectedRowKey: "",
      selectedDataRow: null,
    }));
    for (const seed of pickerSeeds) {
      void loadApplicationOntologyEntityList(seed.ontologyUniqueIdentifier);
    }
    const linkId = viewState.linkRelationId.trim();
    if (linkId) {
      void loadApplicationLinkContext(linkId);
    }
  } catch (error) {
    if (requestToken !== detailLoadToken) return;
    applicationInputRows.value = [];
    applicationWritePropertyOutputRows.value = [];
    applicationOntologyPickers.value = [];
    applicationStorageGroupPickers.value = [];
    applicationHasLinkMapping.value = false;
    paramRows.value = [];
    resetParamValues([]);
    resolvedActionApi.value = "";
    resolvedStorageGroup.value = "";
    resolvedOntologyUniqIdentifier.value = "";
    clearApplicationTestResult();
    detailError.value = error instanceof Error ? error.message : "行为详情加载失败";
  } finally {
    if (requestToken === detailLoadToken) detailLoading.value = false;
  }
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
 * @description 将表格行收窄为测试实体行类型。
 * @param row 表格行。
 * @returns 实体行。
 */
function asEntityRow(row: unknown): BehaviorTestEntityRow {
  return row as BehaviorTestEntityRow;
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
 * @description 提交应用行为测试：组装 params / inputEntities / outputEntities / entityPrimaryKeys.from|to。
 */
async function submitApplicationBehaviorTest(): Promise<void> {
  if (detailLoading.value || detailError.value) {
    ElMessage.warning("请等待行为参数加载完成后再测试");
    return;
  }
  if (applicationHasLinkMapping.value && (relationContextLoading.value || relationContextError.value)) {
    ElMessage.warning("请等待关系信息加载完成后再测试");
    return;
  }
  const propertyInputRows = applicationInputRows.value.filter((row) => normalizeApplicationSourceType(row.sourceType) === "PROPERTY");
  const inputSelections = collectApplicationEntityBindingSelections(propertyInputRows, "入参");
  if (!inputSelections.ok) {
    submitError.value = inputSelections.error;
    ElMessage.warning(inputSelections.error);
    return;
  }
  const outputSelections = collectApplicationEntityBindingSelections(applicationWritePropertyOutputRows.value, "出参");
  if (!outputSelections.ok) {
    submitError.value = outputSelections.error;
    ElMessage.warning(outputSelections.error);
    return;
  }
  const selectedFrom = selectedFromEntityRow.value;
  const selectedTo = selectedToEntityRow.value;
  if (applicationHasLinkMapping.value) {
    if (!selectedFrom || selectedFrom.primaryKey === "") {
      ElMessage.warning("请先选择 From 侧实体实例");
      return;
    }
    if (!selectedTo || selectedTo.primaryKey === "") {
      ElMessage.warning("请先选择 To 侧实体实例");
      return;
    }
  }
  const paramsPayload = buildExternalParamsPayload();
  if ("error" in paramsPayload) {
    submitError.value = paramsPayload.error;
    ElMessage.warning(paramsPayload.error);
    return;
  }
  const actionApi = resolvedActionApi.value.trim() || (props.behavior?.behaviorApiName ?? "").trim();
  const ontologySpaceId = props.spaceId.trim();
  const built = buildApplicationTestRequestParams({
    ontologySpaceId,
    actionApi,
    params: paramsPayload.params,
    inputEntitySelections: inputSelections.selections,
    outputEntitySelections: outputSelections.selections,
    linkEntitySelection:
      applicationHasLinkMapping.value && selectedFrom && selectedTo
        ? {
            ontologyUniqueIdentifierFrom: ontologyUniqueIdentifierFrom.value,
            ontologyUniqueIdentifierTo: ontologyUniqueIdentifierTo.value,
            primaryKeyFrom: selectedFrom.primaryKey,
            primaryKeyTo: selectedTo.primaryKey,
            mountSide: relationMountSide.value,
          }
        : null,
  });
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
      const response = await postTestOntologyActionInterface({
        ontologySpaceId,
        actionApi,
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
      entityLoadToken += 1;
      detailLoadToken += 1;
      groupRowLoadToken += 1;
      relationContextLoadToken += 1;
      fromEntityLoadToken += 1;
      toEntityLoadToken += 1;
      submitToken += 1;
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
    entityPage.value = 1;
    groupRowPage.value = 1;
    groupRowPageSize.value = 10;
    selectedEntityRowKey.value = "";
    selectedGroupDataRowKey.value = "";
    submitError.value = "";
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
