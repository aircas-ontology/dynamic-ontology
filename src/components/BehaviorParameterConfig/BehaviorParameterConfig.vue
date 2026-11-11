<template>
  <div class="behavior-parameter-config" :inert="readonly" :aria-disabled="readonly">
    <el-alert v-if="configurationError" :title="configurationError" type="warning" show-icon />
    <el-button v-if="hasParameterError" @click="retryParameterConfig">重新加载参数</el-button>
    <template v-if="isApplicationTest">
      <section class="behavior-test-dialog__section">
        <h4 class="behavior-test-dialog__section-title">行为入参</h4>
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
                  <div v-if="findApplicationOntologyPicker(asApplicationInputRow(row).paramName)" class="behavior-test-dialog__param-draft-group">
                    <el-select
                      class="behavior-test-dialog__entity-select"
                      :model-value="findApplicationOntologyPicker(asApplicationInputRow(row).paramName)?.selectedRowKeys[0] || ''"
                      filterable
                      clearable
                      :loading="findApplicationOntologyPicker(asApplicationInputRow(row).paramName)?.loading"
                      :placeholder="`请选择 ${asApplicationInputRow(row).propertyDisplayName || asApplicationInputRow(row).paramName || '实例'}`"
                      @update:model-value="
                        (value) => updateApplicationOntologyEntitySelection(asApplicationInputRow(row).paramName, value ? [String(value)] : [])
                      "
                    >
                      <el-option
                        v-for="option in listApplicationOntologySelectOptions(findApplicationOntologyPicker(asApplicationInputRow(row).paramName))"
                        :key="option.rowKey"
                        :label="formatApplicationEntityOptionLabel(option)"
                        :value="option.rowKey"
                      />
                      <template #footer>
                        <div
                          v-if="(findApplicationOntologyPicker(asApplicationInputRow(row).paramName)?.total ?? 0) > 0"
                          class="behavior-test-dialog__select-footer"
                          @mousedown.prevent
                        >
                          <el-pagination
                            small
                            layout="total, prev, pager, next"
                            :total="findApplicationOntologyPicker(asApplicationInputRow(row).paramName)?.total ?? 0"
                            :current-page="findApplicationOntologyPicker(asApplicationInputRow(row).paramName)?.page ?? 1"
                            :page-size="findApplicationOntologyPicker(asApplicationInputRow(row).paramName)?.pageSize ?? 10"
                            @current-change="(page) => changeApplicationOntologyEntityPage(asApplicationInputRow(row).paramName, page)"
                          />
                        </div>
                        <p
                          v-else-if="findApplicationOntologyPicker(asApplicationInputRow(row).paramName)?.error"
                          class="behavior-test-dialog__select-footer-error"
                          role="alert"
                        >
                          {{ findApplicationOntologyPicker(asApplicationInputRow(row).paramName)?.error }}
                        </p>
                      </template>
                    </el-select>
                    <template v-if="findApplicationStorageGroupPickerForRow(asApplicationInputRow(row))">
                      <div
                        v-for="slot in findApplicationStorageGroupPickerForRow(asApplicationInputRow(row))?.entitySlots || []"
                        :key="slot.entityRowKey"
                        class="behavior-test-dialog__entity-data-slot"
                      >
                        <span class="behavior-test-dialog__entity-data-slot-label">{{ slot.entityDisplayName }}</span>
                        <el-select
                          class="behavior-test-dialog__entity-select"
                          :model-value="slot.selectedRowKey || ''"
                          filterable
                          clearable
                          :loading="slot.loading"
                          :placeholder="`请选择 ${findApplicationStorageGroupPickerForRow(asApplicationInputRow(row))?.storageGroup || '分组'} 数据行`"
                          @update:model-value="
                            (value) =>
                              updateApplicationStorageGroupRowSelection(
                                findApplicationStorageGroupPickerForRow(asApplicationInputRow(row))?.pickerKey || '',
                                slot.entityRowKey,
                                String(value ?? ''),
                              )
                          "
                        >
                          <el-option
                            v-for="option in listApplicationStorageGroupSlotOptions(slot)"
                            :key="option.rowKey"
                            :label="formatApplicationStorageGroupOptionLabel(option)"
                            :value="option.rowKey"
                          />
                          <template #footer>
                            <div v-if="slot.total > 0" class="behavior-test-dialog__select-footer" @mousedown.prevent>
                              <el-pagination
                                small
                                layout="total, prev, pager, next"
                                :total="slot.total"
                                :current-page="slot.page"
                                :page-size="slot.pageSize"
                                @current-change="
                                  (page) =>
                                    changeApplicationStorageGroupRowPage(
                                      findApplicationStorageGroupPickerForRow(asApplicationInputRow(row))?.pickerKey || '',
                                      slot.entityRowKey,
                                      page,
                                    )
                                "
                              />
                            </div>
                            <p v-else-if="slot.error" class="behavior-test-dialog__select-footer-error" role="alert">{{ slot.error }}</p>
                          </template>
                        </el-select>
                      </div>
                      <el-select
                        v-if="!(findApplicationStorageGroupPickerForRow(asApplicationInputRow(row))?.entitySlots || []).length"
                        class="behavior-test-dialog__entity-select"
                        model-value=""
                        disabled
                        placeholder="请先选择上一级表单"
                      />
                    </template>
                    <div class="behavior-test-dialog__param-draft-actions">
                      <el-button type="primary" plain @click="addApplicationInputBindingRecords(asApplicationInputRow(row).paramName)">添加</el-button>
                    </div>
                  </div>
                  <span v-else class="behavior-test-dialog__state">缺少对象标识，无法选择实例</span>
                  <div class="behavior-test-dialog__binding-records">
                    <p class="behavior-test-dialog__binding-records-hint" role="status">
                      {{ formatApplicationInputBindingRecordsHint(asApplicationInputRow(row).paramName) }}
                    </p>
                    <ul
                      v-if="listApplicationInputBindingRecords(asApplicationInputRow(row).paramName).length"
                      class="behavior-test-dialog__binding-records-list"
                    >
                      <li
                        v-for="record in listApplicationInputBindingRecords(asApplicationInputRow(row).paramName)"
                        :key="record.recordKey"
                        class="behavior-test-dialog__binding-record"
                      >
                        <span class="behavior-test-dialog__binding-record-label">{{ formatApplicationInputBindingRecordLabel(record) }}</span>
                        <el-button link type="danger" @click="removeApplicationInputBindingRecord(asApplicationInputRow(row).paramName, record.recordKey)"
                          >删除</el-button
                        >
                      </li>
                    </ul>
                  </div>
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
                  v-if="findApplicationOntologyPicker(asApplicationInputRow(row).paramName)"
                  class="behavior-test-dialog__entity-select"
                  :model-value="findApplicationOntologyPicker(asApplicationInputRow(row).paramName)?.selectedRowKeys[0] || ''"
                  filterable
                  clearable
                  :loading="findApplicationOntologyPicker(asApplicationInputRow(row).paramName)?.loading"
                  :placeholder="`请选择 ${asApplicationInputRow(row).propertyDisplayName || asApplicationInputRow(row).paramName || '实例'}`"
                  @update:model-value="(value) => updateApplicationOntologyEntitySelection(asApplicationInputRow(row).paramName, value ? [String(value)] : [])"
                >
                  <el-option
                    v-for="option in listApplicationOntologySelectOptions(findApplicationOntologyPicker(asApplicationInputRow(row).paramName))"
                    :key="option.rowKey"
                    :label="formatApplicationEntityOptionLabel(option)"
                    :value="option.rowKey"
                  />
                  <template #footer>
                    <div
                      v-if="(findApplicationOntologyPicker(asApplicationInputRow(row).paramName)?.total ?? 0) > 0"
                      class="behavior-test-dialog__select-footer"
                      @mousedown.prevent
                    >
                      <el-pagination
                        small
                        layout="total, prev, pager, next"
                        :total="findApplicationOntologyPicker(asApplicationInputRow(row).paramName)?.total ?? 0"
                        :current-page="findApplicationOntologyPicker(asApplicationInputRow(row).paramName)?.page ?? 1"
                        :page-size="findApplicationOntologyPicker(asApplicationInputRow(row).paramName)?.pageSize ?? 10"
                        @current-change="(page) => changeApplicationOntologyEntityPage(asApplicationInputRow(row).paramName, page)"
                      />
                    </div>
                    <p
                      v-else-if="findApplicationOntologyPicker(asApplicationInputRow(row).paramName)?.error"
                      class="behavior-test-dialog__select-footer-error"
                      role="alert"
                    >
                      {{ findApplicationOntologyPicker(asApplicationInputRow(row).paramName)?.error }}
                    </p>
                  </template>
                </el-select>
                <span v-else class="behavior-test-dialog__state">缺少对象标识，无法选择实例</span>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </section>
    </template>

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
            :empty-text="fromEntityRows.length ? undefined : '暂无实体实例'"
            @row-click="handleFromEntityRowClick"
          >
            <el-table-column width="48" align="center">
              <template #default="{ row }">
                <span @click.stop>
                  <el-checkbox
                    :model-value="selectedFromEntityRowKeys.includes(asEntityRow(row).rowKey)"
                    @change="() => toggleFromEntityRow(asEntityRow(row))"
                  />
                </span>
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
            :empty-text="toEntityRows.length ? undefined : '暂无实体实例'"
            @row-click="handleToEntityRowClick"
          >
            <el-table-column width="48" align="center">
              <template #default="{ row }">
                <span @click.stop>
                  <el-checkbox :model-value="selectedToEntityRowKeys.includes(asEntityRow(row).rowKey)" @change="() => toggleToEntityRow(asEntityRow(row))" />
                </span>
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
  </div>
</template>
<script setup lang="ts">
import { computed, reactive, toRefs } from "vue";
import type { useBehaviorParameters } from "@/composables/behavior/useBehaviorParameters";
const props = defineProps<{ controller: ReturnType<typeof useBehaviorParameters>; readonly?: boolean }>();
const hasParameterError = computed(() => {
  const state = props.controller;
  return Boolean(
    state.detailError.value ||
    state.relationContextError.value ||
    state.fromEntityError.value ||
    state.toEntityError.value ||
    state.applicationOntologyPickers.value.some((item) => item.error) ||
    state.applicationStorageGroupPickers.value.some((item) => item.entitySlots.some((slot) => slot.error)),
  );
});
const {
  isApplicationTest,
  detailLoading,
  detailError,
  applicationInputRows,
  formatApplicationInputSourceTypeLabel,
  asApplicationInputRow,
  normalizeApplicationSourceType,
  paramValues,
  updateParamValue,
  findApplicationOntologyPicker,
  updateApplicationOntologyEntitySelection,
  listApplicationOntologySelectOptions,
  formatApplicationEntityOptionLabel,
  changeApplicationOntologyEntityPage,
  findApplicationStorageGroupPickerForRow,
  updateApplicationStorageGroupRowSelection,
  listApplicationStorageGroupSlotOptions,
  formatApplicationStorageGroupOptionLabel,
  changeApplicationStorageGroupRowPage,
  addApplicationInputBindingRecords,
  formatApplicationInputBindingRecordsHint,
  listApplicationInputBindingRecords,
  formatApplicationInputBindingRecordLabel,
  removeApplicationInputBindingRecord,
  applicationWritePropertyOutputRows,
  formatApplicationOutputModeLabel,
  showRelationLinkForm,
  relationContextLoading,
  relationContextError,
  ontologyNameFrom,
  ontologyNameTo,
  fromEntityLoading,
  fromEntityError,
  fromEntityRows,
  handleFromEntityRowClick,
  selectedFromEntityRowKeys,
  asEntityRow,
  toggleFromEntityRow,
  fromEntityTotal,
  fromEntityPage,
  fromEntityPageSize,
  changeFromEntityPage,
  changeFromEntityPageSize,
  toEntityLoading,
  toEntityError,
  toEntityRows,
  handleToEntityRowClick,
  selectedToEntityRowKeys,
  toggleToEntityRow,
  toEntityTotal,
  toEntityPage,
  toEntityPageSize,
  changeToEntityPage,
  changeToEntityPageSize,
  configurationError,
} = toRefs(reactive(props.controller));
/** @description 根据当前行为类别重新加载失败的参数配置。 */
function retryParameterConfig(): void {
  if (props.readonly) return;
  if (props.controller.isApplicationTest.value) void props.controller.loadApplicationTestForm();
  else void props.controller.loadRelationTestContext();
}
</script>
<style scoped lang="scss">
.behavior-parameter-config {
  width: 100%;
  min-width: 0;
  overflow-x: auto;
}
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
