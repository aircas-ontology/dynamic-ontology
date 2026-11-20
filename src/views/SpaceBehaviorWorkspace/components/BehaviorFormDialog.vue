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
    <el-alert v-if="detailLoading" title="正在加载行为详情…" type="info" show-icon :closable="false" />
    <el-alert v-else-if="detailError" :title="detailError" type="error" show-icon :closable="false" />
    <el-alert v-else-if="unsupportedEditReason" :title="unsupportedEditReason" type="warning" show-icon :closable="false" />
    <el-alert v-if="readonly" title="已发布或已失效行为为只读" type="warning" show-icon :closable="false" />

    <el-form class="behavior-form-dialog__form" label-position="top" :disabled="readonly">
      <section class="behavior-form-dialog__section">
        <h3>基本信息</h3>

        <div class="behavior-form-dialog__grid">
          <el-form-item label="类别" required>
            <el-select v-model="kind" placeholder="选择类别" style="width: 100%" :disabled="mode === 'edit'" @change="handleKindChange">
              <el-option v-for="item in SPACE_BEHAVIOR_KIND_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="行为名称" required>
            <el-input v-model="displayName" maxlength="64" show-word-limit placeholder="输入行为名称" />
          </el-form-item>
          <el-form-item label="行为api名称" required>
            <el-input v-model="behaviorApiName" maxlength="64" show-word-limit placeholder="例如：act.pv.weapon.add" :disabled="mode === 'edit'" />
          </el-form-item>
          <el-form-item label="行为分类" required>
            <el-tree-select
              v-model="categoryId"
              :data="categorySelectTree"
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

        <template v-if="kind !== 'behaviorTree'">
          <div v-if="kind === 'basic'" class="behavior-form-dialog__grid">
            <el-form-item label="行为类型" required>
              <el-select v-model="valueType" placeholder="选择行为类型" style="width: 100%" @change="handleValueTypeChange">
                <el-option v-for="item in SPACE_BEHAVIOR_VALUE_TYPE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item v-if="!showBasicFunctionOperatorSection" label="基础操作" required>
              <el-select :model-value="basicAction" placeholder="选择基础操作" style="width: 100%" @change="handleBasicActionChange">
                <el-option v-for="item in SPACE_BEHAVIOR_BASIC_ACTION_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item v-else label="选择对象" required>
              <el-tree-select
                class="behavior-form-dialog__basic-function-objects"
                :model-value="basicFunctionOntologyIds"
                multiple
                show-checkbox
                check-strictly
                filterable
                clearable
                default-expand-all
                :render-after-expand="false"
                node-key="id"
                :data="basicFunctionObjectTree"
                :props="{ label: 'label', children: 'children', disabled: 'disabled' }"
                :loading="objectLoading"
                :disabled="objectLoading || objectError !== ''"
                :placeholder="objectLoading ? '正在加载对象' : objectError || (objectOptions.length ? '选择同一目录下的对象' : '当前空间暂无对象')"
                style="width: 100%"
                @update:model-value="handleBasicFunctionOntologyIdsChange"
              />
            </el-form-item>
          </div>
          <el-form-item v-if="showBasicFunctionSingleResultModeToggle" label="结果配置">
            <el-radio-group :model-value="basicFunctionSingleResultMode" @update:model-value="handleBasicFunctionSingleResultModeChange">
              <el-radio-button value="query">展示字段</el-radio-button>
              <el-radio-button value="aggregate">聚合</el-radio-button>
            </el-radio-group>
          </el-form-item>
          <el-form-item v-if="showBasicFunctionSelectFields" label="展示字段">
            <el-select
              class="behavior-form-dialog__basic-function-select-fields"
              v-model="basicFunctionSelectFields"
              multiple
              filterable
              clearable
              :loading="basicFunctionSelectFieldLoading"
              :disabled="basicFunctionSelectFieldLoading || basicFunctionSelectFieldError !== ''"
              :placeholder="
                basicFunctionSelectFieldLoading
                  ? '正在加载属性'
                  : basicFunctionSelectFieldError || (basicFunctionSelectFieldOptions.length ? '选择展示字段' : '当前对象暂无属性')
              "
              style="width: 100%"
              @change="syncBasicFunctionWriteFieldsBySelectFields"
            >
              <el-option v-for="item in basicFunctionSelectFieldOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item v-if="showBasicFunctionSelectFields && basicFunctionSelectFields.length" label="写入字段">
            <div class="behavior-form-dialog__basic-function-write-fields">
              <div v-for="selectField in basicFunctionSelectFields" :key="selectField" class="behavior-form-dialog__basic-function-write-field">
                <div class="behavior-form-dialog__basic-function-write-field-title">
                  {{ resolveBasicFunctionSelectFieldLabel(selectField) }}
                </div>
                <div class="behavior-form-dialog__object-property-pickers">
                  <el-select
                    :model-value="readBasicFunctionWriteFieldBinding(selectField).ontologyUniqueIdentifier"
                    filterable
                    clearable
                    :loading="objectLoading"
                    :disabled="objectLoading || objectError !== ''"
                    :placeholder="objectLoading ? '正在加载对象' : objectError || (objectOptions.length ? '选择对象' : '当前空间暂无对象')"
                    style="width: 100%"
                    @change="(value) => updateBasicFunctionWriteFieldOntologyId(selectField, value)"
                  >
                    <el-option v-for="item in objectOptions" :key="item.value" :label="item.label" :value="item.value" />
                  </el-select>
                  <el-select
                    :model-value="readBasicFunctionWriteFieldBinding(selectField).propertyUniqueIdentifier"
                    filterable
                    clearable
                    :loading="isApplicationPropertyLoading(readBasicFunctionWriteFieldBinding(selectField).ontologyUniqueIdentifier)"
                    :disabled="!readBasicFunctionWriteFieldBinding(selectField).ontologyUniqueIdentifier"
                    :placeholder="
                      !readBasicFunctionWriteFieldBinding(selectField).ontologyUniqueIdentifier
                        ? '请先选择对象'
                        : readApplicationPropertyError(readBasicFunctionWriteFieldBinding(selectField).ontologyUniqueIdentifier) ||
                          (readBasicFunctionChildPropertyOptions(readBasicFunctionWriteFieldBinding(selectField).ontologyUniqueIdentifier).length
                            ? '选择写入属性'
                            : '当前对象暂无子表属性')
                    "
                    style="width: 100%"
                    @change="(value) => updateBasicFunctionWriteFieldPropertyId(selectField, value)"
                  >
                    <el-option
                      v-for="item in readBasicFunctionChildPropertyOptions(readBasicFunctionWriteFieldBinding(selectField).ontologyUniqueIdentifier)"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                    />
                  </el-select>
                </div>
              </div>
            </div>
          </el-form-item>
          <div v-if="showBasicFunctionAggregateFields" class="behavior-form-dialog__grid">
            <el-form-item label="聚合类型">
              <el-select
                v-model="basicFunctionAggFunc"
                clearable
                placeholder="请选择聚合类型"
                style="width: 100%"
                @clear="clearBasicFunctionTargetField"
                @change="handleBasicFunctionAggFuncChange"
              >
                <el-option v-for="item in FUNCTION_OPERATOR_AGG_FUNC_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="聚合参数名">
              <el-select
                v-model="basicFunctionTargetField"
                filterable
                clearable
                :disabled="!basicFunctionAggFunc"
                :loading="basicFunctionSelectFieldLoading"
                :placeholder="
                  !basicFunctionAggFunc
                    ? '请先选择聚合类型'
                    : basicFunctionSelectFieldLoading
                      ? '正在加载属性'
                      : basicFunctionSelectFieldError || (basicFunctionSelectFieldOptions.length ? '选择聚合参数名' : '当前对象暂无属性')
                "
                style="width: 100%"
              >
                <el-option v-for="item in basicFunctionSelectFieldOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </div>
          <el-form-item v-if="showBasicFunctionMultiWriteField" label="写入字段">
            <div class="behavior-form-dialog__basic-function-write-fields">
              <div class="behavior-form-dialog__basic-function-write-field behavior-form-dialog__basic-function-write-field--multi">
                <div class="behavior-form-dialog__object-property-pickers">
                  <el-select
                    :model-value="basicFunctionMultiWriteField.ontologyUniqueIdentifier"
                    filterable
                    clearable
                    :loading="objectLoading"
                    :disabled="objectLoading || objectError !== ''"
                    :placeholder="objectLoading ? '正在加载对象' : objectError || (objectOptions.length ? '选择对象' : '当前空间暂无对象')"
                    style="width: 100%"
                    @change="updateBasicFunctionMultiWriteFieldOntologyId"
                  >
                    <el-option v-for="item in objectOptions" :key="item.value" :label="item.label" :value="item.value" />
                  </el-select>
                  <el-select
                    :model-value="basicFunctionMultiWriteField.propertyUniqueIdentifier"
                    filterable
                    clearable
                    :loading="isBasicFunctionMainPropertyLoading(basicFunctionMultiWriteField.ontologyUniqueIdentifier)"
                    :disabled="!basicFunctionMultiWriteField.ontologyUniqueIdentifier"
                    :placeholder="
                      !basicFunctionMultiWriteField.ontologyUniqueIdentifier
                        ? '请先选择对象'
                        : readBasicFunctionMainPropertyError(basicFunctionMultiWriteField.ontologyUniqueIdentifier) ||
                          (readBasicFunctionMainPropertyOptions(basicFunctionMultiWriteField.ontologyUniqueIdentifier).length
                            ? '选择写入属性'
                            : '当前对象暂无 main 属性')
                    "
                    style="width: 100%"
                    @change="updateBasicFunctionMultiWriteFieldPropertyId"
                  >
                    <el-option
                      v-for="item in readBasicFunctionMainPropertyOptions(basicFunctionMultiWriteField.ontologyUniqueIdentifier)"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                    />
                  </el-select>
                </div>
              </div>
            </div>
          </el-form-item>
          <el-form-item v-if="showBasicFunctionOperatorSection" label="参数配置">
            <FunctionOperatorBasicFilterBuilder
              v-model="basicFunctionParameterConfig"
              property-placeholder="选择属性名"
              :property-options="basicFunctionFilterPropertyOptions"
              :show-value-type-select="false"
            />
          </el-form-item>

          <section v-if="showAttributeValueObjectSection" class="behavior-form-dialog__object-section">
            <h3>对象信息</h3>
            <el-form-item label="对象" required>
              <el-select
                :model-value="ontologyIdentifier"
                filterable
                :clearable="!isOntologySelectorLocked"
                :loading="objectLoading"
                :disabled="isOntologySelectorLocked || objectLoading || objectError !== ''"
                :placeholder="objectLoading ? '正在加载对象' : objectError || (objectOptions.length ? '选择对象' : '当前空间暂无对象')"
                style="width: 100%"
                @change="handleOntologyChange"
              >
                <el-option v-for="item in objectOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <div class="behavior-form-dialog__attribute-head">
              <div class="behavior-form-dialog__attribute-title">
                <span>属性选择</span>
                <el-tag size="small" effect="plain">{{ selectedPropertyIds.length }} 项</el-tag>
              </div>
              <span class="behavior-form-dialog__attribute-hint">{{ attributeSelectionHint }}</span>
            </div>
            <el-table
              ref="attributeTableRef"
              class="behavior-form-dialog__attribute-table"
              :data="attributeLoading ? [] : attributeRows"
              row-key="uniqueIdentifier"
              :empty-text="attributeLoading ? '正在加载属性' : attributeError || (ontologyIdentifier ? '暂无属性' : '请先选择对象')"
              @selection-change="handleAttributeSelectionChange"
            >
              <el-table-column type="selection" width="48" :selectable="isAttributeRowSelectable" />
              <el-table-column prop="displayName" label="属性" min-width="160" show-overflow-tooltip />
              <el-table-column prop="description" label="属性描述" min-width="160" show-overflow-tooltip />
              <el-table-column label="是否为主键" width="110">
                <template #default="{ row }">{{ row.isPrimaryKey ? "是" : "否" }}</template>
              </el-table-column>
              <el-table-column prop="propertyType" label="类型" width="120" show-overflow-tooltip />
              <el-table-column prop="storageGroup" label="存储分组" width="140" show-overflow-tooltip />
            </el-table>
          </section>

          <section v-else-if="showRelationInstanceSection" class="behavior-form-dialog__object-section">
            <div class="behavior-form-dialog__attribute-head">
              <div class="behavior-form-dialog__attribute-title">
                <span>关系选择</span>
                <el-tag size="small" effect="plain">{{ relationTotal }}项</el-tag>
              </div>
              <span class="behavior-form-dialog__attribute-hint">从当前空间关系中单选一条</span>
            </div>
            <form class="behavior-form-dialog__relation-toolbar" @submit.prevent="searchRelationRows">
              <el-input
                v-model="relationSearchKeyword"
                class="behavior-form-dialog__relation-search"
                clearable
                placeholder="按关系名称搜索"
                @clear="searchRelationRows"
              />
              <el-button native-type="submit">查询</el-button>
            </form>
            <el-table
              class="behavior-form-dialog__attribute-table"
              :data="relationLoading ? [] : relationRows"
              row-key="id"
              :empty-text="relationLoading ? '正在加载关系' : relationError || '暂无关系'"
              @row-click="handleRelationRowClick"
            >
              <el-table-column width="48" align="center">
                <template #default="{ row }">
                  <el-radio :model-value="selectedRelationId" :value="row.id" :disabled="readonly" @change="selectRelationRow(row.id)" />
                </template>
              </el-table-column>
              <el-table-column prop="displayName" label="关系名称" min-width="140" show-overflow-tooltip />
              <el-table-column prop="sourceName" label="源对象" min-width="160" show-overflow-tooltip />
              <el-table-column prop="targetName" label="目标对象" min-width="160" show-overflow-tooltip />
              <el-table-column prop="description" label="说明" min-width="200" show-overflow-tooltip />
            </el-table>
            <el-pagination
              v-if="relationTotal > 0"
              class="behavior-form-dialog__relation-pagination"
              background
              layout="total, prev, pager, next"
              :total="relationTotal"
              :current-page="relationPageNum"
              :page-size="10"
              @current-change="changeRelationPage"
            />
            <div v-if="showRelationLinkMappingSection" class="behavior-form-dialog__link-mapping">
              <el-form-item label="状态" required>
                <el-select v-model="relationTargetStatus" placeholder="选择状态" style="width: 100%" :disabled="readonly">
                  <el-option v-for="item in relationTargetStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>
              <el-form-item label="持续时间" :required="basicAction === 'create'">
                <div class="behavior-form-dialog__visibility-windows">
                  <div v-for="(row, index) in visibilityWindowRows" :key="index" class="behavior-form-dialog__visibility-row">
                    <el-date-picker
                      class="behavior-form-dialog__visibility-picker"
                      :model-value="row"
                      type="datetimerange"
                      value-format="x"
                      range-separator="至"
                      start-placeholder="开始时间"
                      end-placeholder="结束时间"
                      :disabled="readonly"
                      @update:model-value="updateVisibilityWindowRow(index, $event)"
                    />
                    <el-button link type="danger" :disabled="readonly" @click="removeVisibilityWindowRow(index)">删除</el-button>
                  </div>
                  <el-button link type="primary" :disabled="readonly" @click="addVisibilityWindowRow">添加时段</el-button>
                </div>
              </el-form-item>
            </div>
          </section>

          <template v-else-if="kind === 'application'">
            <el-form-item label="关联函数算子" required>
              <el-select
                :model-value="functionOperatorId"
                filterable
                popper-class="behavior-form-dialog__operator-popper"
                :loading="operatorLoading"
                :disabled="operatorLoading || operatorError !== ''"
                :placeholder="operatorLoading ? '正在加载函数算子' : operatorError || (operatorCatalog.length ? '选择函数算子' : '当前空间暂无函数算子')"
                style="width: 100%"
                @change="handleOperatorChange"
              >
                <el-option v-for="item in operatorCatalog" :key="item.id" :label="`${item.name} · ${item.version}`" :value="item.id">
                  <div class="behavior-form-dialog__operator-option">
                    <span class="behavior-form-dialog__operator-option-title">{{ item.name }} · {{ item.version }}</span>
                    <span v-if="item.description.trim()" class="behavior-form-dialog__operator-option-meta">{{ item.description }}</span>
                    <span class="behavior-form-dialog__operator-option-meta">类型：{{ resolveOperatorTypeLabel(item.type) }}</span>
                  </div>
                </el-option>
              </el-select>
            </el-form-item>

            <template v-if="functionOperatorId">
              <section class="behavior-form-dialog__object-section">
                <div class="behavior-form-dialog__attribute-head">
                  <div class="behavior-form-dialog__attribute-title">
                    <span>输入参数</span>
                    <el-tag size="small" effect="plain">{{ applicationInputRows.length }}项</el-tag>
                  </div>
                </div>
                <p v-if="applicationDetailLoading" class="behavior-form-dialog__param-state" role="status">正在加载函数详情…</p>
                <p v-else-if="applicationDetailError" class="behavior-form-dialog__param-state" role="alert">{{ applicationDetailError }}</p>
                <el-table v-else class="behavior-form-dialog__attribute-table" :data="applicationInputRows" row-key="rowKey" empty-text="暂无输入参数">
                  <el-table-column label="参数" min-width="160" show-overflow-tooltip>
                    <template #default="{ row }">
                      <div class="behavior-form-dialog__param-name" :style="{ paddingLeft: `${row.depth * 16}px` }">
                        <span>{{ row.paramName }}</span>
                        <span v-if="row.paramPath" class="behavior-form-dialog__param-path">{{ row.fullPath }}</span>
                      </div>
                    </template>
                  </el-table-column>
                  <el-table-column label="类型" width="100">
                    <template #default="{ row }">
                      <el-tag size="small" effect="plain">{{ row.typeLabel }}</el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column label="输入来源" min-width="140">
                    <template #default="{ row }">
                      <el-select
                        v-if="!row.isObject"
                        :model-value="readApplicationInputBinding(row.rowKey).sourceType"
                        placeholder="选择输入来源"
                        style="width: 100%"
                        @change="(value) => updateApplicationInputSourceType(row.rowKey, value)"
                      >
                        <el-option v-for="item in SPACE_BEHAVIOR_APPLICATION_INPUT_SOURCE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
                      </el-select>
                    </template>
                  </el-table-column>
                  <el-table-column label="读取属性 / 参数值" min-width="260">
                    <template #default="{ row }">
                      <template v-if="!row.isObject">
                        <div v-if="readApplicationInputBinding(row.rowKey).sourceType === 'PROPERTY'" class="behavior-form-dialog__object-property-pickers">
                          <el-select
                            :model-value="readApplicationInputBinding(row.rowKey).ontologyUniqueIdentifier"
                            filterable
                            :loading="objectLoading"
                            :disabled="isOntologySelectorLocked || objectLoading || objectError !== ''"
                            :placeholder="objectLoading ? '正在加载对象' : objectError || (objectOptions.length ? '选择对象' : '当前空间暂无对象')"
                            style="width: 100%"
                            @change="(value) => updateApplicationInputOntologyId(row.rowKey, value)"
                          >
                            <el-option v-for="item in objectOptions" :key="item.value" :label="item.label" :value="item.value" />
                          </el-select>
                          <el-select
                            :model-value="readApplicationInputBinding(row.rowKey).propertyUniqueIdentifier"
                            filterable
                            :loading="isApplicationPropertyLoading(readApplicationInputBinding(row.rowKey).ontologyUniqueIdentifier)"
                            :disabled="!readApplicationInputBinding(row.rowKey).ontologyUniqueIdentifier"
                            :placeholder="
                              !readApplicationInputBinding(row.rowKey).ontologyUniqueIdentifier
                                ? '请先选择对象'
                                : readApplicationPropertyError(readApplicationInputBinding(row.rowKey).ontologyUniqueIdentifier) ||
                                  (readApplicationPropertyOptions(readApplicationInputBinding(row.rowKey).ontologyUniqueIdentifier).length
                                    ? '选择读取属性'
                                    : '当前对象暂无属性')
                            "
                            style="width: 100%"
                            @change="(value) => updateApplicationInputPropertyId(row.rowKey, value)"
                          >
                            <el-option
                              v-for="item in readApplicationPropertyOptions(readApplicationInputBinding(row.rowKey).ontologyUniqueIdentifier)"
                              :key="item.value"
                              :label="item.label"
                              :value="item.value"
                            />
                          </el-select>
                        </div>
                        <el-input
                          v-else-if="readApplicationInputBinding(row.rowKey).sourceType === 'FIXED'"
                          type="textarea"
                          :rows="2"
                          :model-value="readApplicationInputBinding(row.rowKey).fixedValue"
                          placeholder='例如: {"target":"A"}'
                          @update:model-value="(value) => updateApplicationInputFixedValue(row.rowKey, value)"
                        />
                        <div v-else class="behavior-form-dialog__external-default">
                          <el-checkbox
                            :model-value="readApplicationInputBinding(row.rowKey).enableDefaultValue"
                            @update:model-value="(value) => updateApplicationInputEnableDefaultValue(row.rowKey, value)"
                          >
                            启用默认值
                          </el-checkbox>
                          <el-input
                            v-if="readApplicationInputBinding(row.rowKey).enableDefaultValue"
                            type="textarea"
                            :rows="2"
                            :model-value="readApplicationInputBinding(row.rowKey).defaultValue"
                            placeholder='例如：{"target":"A"}'
                            @update:model-value="(value) => updateApplicationInputDefaultValue(row.rowKey, value)"
                          />
                        </div>
                      </template>
                    </template>
                  </el-table-column>
                </el-table>
              </section>

              <section class="behavior-form-dialog__object-section">
                <div class="behavior-form-dialog__attribute-head">
                  <div class="behavior-form-dialog__attribute-title">
                    <span>输出参数</span>
                    <el-tag size="small" effect="plain">{{ applicationOutputRows.length }}项</el-tag>
                  </div>
                </div>
                <p v-if="applicationDetailLoading" class="behavior-form-dialog__param-state" role="status">正在加载函数详情…</p>
                <p v-else-if="applicationDetailError" class="behavior-form-dialog__param-state" role="alert">{{ applicationDetailError }}</p>
                <el-table v-else class="behavior-form-dialog__attribute-table" :data="applicationOutputRows" row-key="rowKey" empty-text="暂无输出参数">
                  <el-table-column label="参数" min-width="160" show-overflow-tooltip>
                    <template #default="{ row }">
                      <div class="behavior-form-dialog__param-name" :style="{ paddingLeft: `${row.depth * 16}px` }">
                        <span>{{ row.paramName }}</span>
                        <span v-if="row.paramPath" class="behavior-form-dialog__param-path">{{ row.fullPath }}</span>
                      </div>
                    </template>
                  </el-table-column>
                  <el-table-column label="类型" width="100">
                    <template #default="{ row }">
                      <el-tag size="small" effect="plain">{{ row.typeLabel }}</el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column label="输出方式" min-width="140">
                    <template #default="{ row }">
                      <el-select
                        v-if="!row.isObject"
                        :model-value="readApplicationOutputBinding(row.rowKey).outputMode"
                        placeholder="选择输出方式"
                        style="width: 100%"
                        @change="(value) => updateApplicationOutputMode(row.rowKey, value)"
                      >
                        <el-option v-for="item in SPACE_BEHAVIOR_APPLICATION_OUTPUT_MODE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
                      </el-select>
                    </template>
                  </el-table-column>
                  <el-table-column label="写入目标" min-width="260">
                    <template #default="{ row }">
                      <template v-if="!row.isObject">
                        <p v-if="readApplicationOutputBinding(row.rowKey).outputMode === 'RESULT_ONLY'" class="behavior-form-dialog__output-target-hint">
                          返回算子结果，不写入本体属性
                        </p>
                        <div v-else class="behavior-form-dialog__object-property-pickers">
                          <el-select
                            :model-value="readApplicationOutputBinding(row.rowKey).ontologyUniqueIdentifier"
                            filterable
                            :loading="objectLoading"
                            :disabled="isOntologySelectorLocked || objectLoading || objectError !== ''"
                            :placeholder="objectLoading ? '正在加载对象' : objectError || (objectOptions.length ? '选择对象' : '当前空间暂无对象')"
                            style="width: 100%"
                            @change="(value) => updateApplicationOutputOntologyId(row.rowKey, value)"
                          >
                            <el-option v-for="item in objectOptions" :key="item.value" :label="item.label" :value="item.value" />
                          </el-select>
                          <el-select
                            :model-value="readApplicationOutputBinding(row.rowKey).propertyUniqueIdentifier"
                            filterable
                            :loading="isApplicationPropertyLoading(readApplicationOutputBinding(row.rowKey).ontologyUniqueIdentifier)"
                            :disabled="!readApplicationOutputBinding(row.rowKey).ontologyUniqueIdentifier"
                            :placeholder="
                              !readApplicationOutputBinding(row.rowKey).ontologyUniqueIdentifier
                                ? '请先选择对象'
                                : readApplicationPropertyError(readApplicationOutputBinding(row.rowKey).ontologyUniqueIdentifier) ||
                                  (readApplicationPropertyOptions(readApplicationOutputBinding(row.rowKey).ontologyUniqueIdentifier).length
                                    ? '选择写入属性'
                                    : '当前对象暂无属性')
                            "
                            style="width: 100%"
                            @change="(value) => updateApplicationOutputPropertyId(row.rowKey, value)"
                          >
                            <el-option
                              v-for="item in readApplicationPropertyOptions(readApplicationOutputBinding(row.rowKey).ontologyUniqueIdentifier)"
                              :key="item.value"
                              :label="item.label"
                              :value="item.value"
                            />
                          </el-select>
                        </div>
                      </template>
                    </template>
                  </el-table-column>
                </el-table>
              </section>
            </template>

            <section v-if="showApplicationRelationSection" class="behavior-form-dialog__object-section">
              <div class="behavior-form-dialog__attribute-head">
                <div class="behavior-form-dialog__attribute-title">
                  <span>绑定关系</span>
                  <el-tag size="small" effect="plain">{{ relationTotal }}项</el-tag>
                </div>
                <span class="behavior-form-dialog__attribute-hint">可选；从当前空间关系中单选一条，可再次点击取消</span>
              </div>
              <form class="behavior-form-dialog__relation-toolbar" @submit.prevent="searchRelationRows">
                <el-input
                  v-model="relationSearchKeyword"
                  class="behavior-form-dialog__relation-search"
                  clearable
                  placeholder="按关系名称搜索"
                  @clear="searchRelationRows"
                />
                <el-button native-type="submit">查询</el-button>
              </form>
              <el-table
                class="behavior-form-dialog__attribute-table"
                :data="relationLoading ? [] : relationRows"
                row-key="id"
                :show-header="false"
                :empty-text="relationLoading ? '正在加载关系' : relationError || '暂无关系'"
                @row-click="handleApplicationRelationRowClick"
              >
                <el-table-column width="48" align="center">
                  <template #default="{ row }">
                    <el-radio
                      :model-value="selectedRelationId"
                      :value="row.id"
                      :disabled="readonly || relationLoading"
                      @click.stop="selectApplicationRelationRow(row.id)"
                    />
                  </template>
                </el-table-column>
                <el-table-column min-width="140" show-overflow-tooltip>
                  <template #default="{ row }">
                    <span>{{ row.displayName }}</span>
                  </template>
                </el-table-column>
                <el-table-column min-width="220" show-overflow-tooltip>
                  <template #default="{ row }">
                    <span class="behavior-form-dialog__relation-mapping">{{ formatApplicationRelationMapping(row) }}</span>
                  </template>
                </el-table-column>
              </el-table>
              <el-pagination
                v-if="relationTotal > 0"
                class="behavior-form-dialog__relation-pagination"
                background
                layout="total, prev, pager, next"
                :total="relationTotal"
                :current-page="relationPageNum"
                :page-size="10"
                @current-change="changeRelationPage"
              />
            </section>
          </template>
        </template>
      </section>
    </el-form>

    <template #footer>
      <el-button @click="emit('update:modelValue', false)">{{ readonly ? "关闭" : "取消" }}</el-button>
      <el-button
        v-if="!readonly && kind === 'behaviorTree'"
        :disabled="detailLoading || Boolean(detailError) || Boolean(unsupportedEditReason)"
        type="primary"
        @click="openBehaviorTreeOrchestration"
      >
        行为树编排
      </el-button>
      <el-button
        v-else-if="!readonly"
        :loading="submitLoading || detailLoading"
        :disabled="detailLoading || Boolean(detailError) || Boolean(unsupportedEditReason)"
        @click="submitBehaviorForm('save')"
      >
        保存行为
      </el-button>
    </template>
  </el-dialog>

  <BehaviorTreeOrchestrationDialog
    v-if="behaviorTreeOrchestrationVisible"
    v-model="behaviorTreeOrchestrationVisible"
    :meta="behaviorTreeOrchestrationMeta"
    @persisted="handleBehaviorTreePersisted"
  />
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import { ElMessage, type TableInstance } from "element-plus";
import {
  getOntologyActionInfoInterface,
  getOntologyCategoryTreeInterface,
  getOntologyFunctionDetailInterface,
  getOntologyFunctionListInterface,
  getOntologyLinkListInterface,
  getOntologyObjectArrTypeTreeInterface,
  getOntologyPropertyByOntologyIdInterface,
} from "@/apis";
import type {
  BehaviorTreeOrchestrationMeta,
  BehaviorTreePersistMode,
  GetOntologyFunctionListItem,
  OntologyPropertyInfo,
  OntologyRelationClass,
  SpaceBehaviorApplicationInputBinding,
  SpaceBehaviorApplicationInputSourceType,
  SpaceBehaviorApplicationOutputBinding,
  SpaceBehaviorApplicationOutputMode,
  SpaceBehaviorApplicationParamRowSnapshot,
  SpaceBehaviorBasicAction,
  SpaceBehaviorBasicFunctionWriteFieldBinding,
  SpaceBehaviorCategoryNode,
  SpaceBehaviorDraft,
  SpaceBehaviorItem,
  SpaceBehaviorKind,
  SpaceBehaviorOperatorOption,
  SpaceBehaviorRelationTargetStatus,
  SpaceBehaviorRelationVisibilityWindow,
  SpaceBehaviorStatus,
  SpaceBehaviorValueType,
  SpaceRelationObjectOption,
} from "@/types";
import {
  ROOT_SPACE_BEHAVIOR_CATEGORY_ID,
  SPACE_BEHAVIOR_APPLICATION_INPUT_SOURCE_OPTIONS,
  SPACE_BEHAVIOR_APPLICATION_OUTPUT_MODE_OPTIONS,
  FUNCTION_OPERATOR_AGG_FUNC_OPTIONS,
  FUNCTION_OPERATOR_TYPE_LABELS,
  SPACE_BEHAVIOR_BASIC_ACTION_OPTIONS,
  SPACE_BEHAVIOR_KIND_OPTIONS,
  SPACE_BEHAVIOR_VALUE_TYPE_OPTIONS,
  listSpaceBehaviorRelationTargetStatusOptions,
  type FunctionOperatorAggFunc,
} from "@/types";
import { mapFunctionOperatorTypeFromApi } from "@/utils/mapFunctionOperatorTypeToApi";
import type { OntologyCategoryObjectOption, OntologyCategorySelectTreeNode } from "@/utils/mapOntologyObjectsToCategoryOptions";
import {
  applyOntologyCategorySelectTreeDisabled,
  mapOntologyCategoryTreeToSelectNodes,
  mapOntologyObjectsToCategoryOptions,
} from "@/utils/mapOntologyObjectsToCategoryOptions";
import { resolveSameCategoryOntologySelection } from "@/utils/resolveSameCategoryOntologySelection";
import { applyApplicationActionInfoBindings } from "../utils/applyApplicationActionInfoBindings.ts";
import { mapOntologyLinkListToRelationClass } from "../utils/mapOntologyLinkListToRelationClass";
import { buildApplicationCreateActionParams } from "../utils/buildApplicationCreateActionParams";
import { flattenPropertyInfosFromCategoryTree } from "../utils/flattenPropertyInfosFromCategoryTree";
import {
  isAttributeValueRowSelectable,
  isMainStorageGroup,
  listPropertyRowsByStorageGroup,
  normalizeStorageGroup,
  readPropertyRowId,
  resolveAttributeValueSelection,
} from "../utils/resolveAttributeValueSelection";
import {
  flattenApplicationFunctionInputRows,
  flattenApplicationFunctionOutputRows,
  type ApplicationFunctionParamRow,
} from "../utils/flattenApplicationFunctionParamRows";
import { mapOntologyActionInfoToFormState, type SpaceBehaviorActionInfoFormState } from "../utils/mapOntologyActionInfoToFormState";
import { omitActionLeavesFromCategoryTree } from "../utils/spaceBehaviorOperations";
import { sortPropertyInfosByStorageGroup } from "../utils/sortPropertyInfosByStorageGroup";
import {
  createBlankBasicFilterDocument,
  mapActionFiltersToBasicFilterDocument,
  stringifyBasicFilterConfig,
  validateBasicFilterDocument,
  parseBasicFilterConfig,
} from "@/utils/functionOperatorBasicFilter";
import BehaviorTreeOrchestrationDialog from "@/views/BehaviorTreeOrchestration/BehaviorTreeOrchestrationDialog.vue";
import FunctionOperatorBasicFilterBuilder from "@/views/FunctionOperatorPanel/components/FunctionOperatorBasicFilterBuilder.vue";

const props = defineProps<{
  modelValue: boolean;
  mode: "create" | "edit";
  spaceId: string;
  /** 对象详情创建时锁定的对象唯一标识；空串表示不锁定。 */
  lockedOntologyId?: string;
  categoryTree: SpaceBehaviorCategoryNode[];
  defaultCategoryId: string;
  behavior: SpaceBehaviorItem | null;
}>();
const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  submit: [draft: SpaceBehaviorDraft];
  "save-copy": [draft: SpaceBehaviorDraft];
  "tree-persisted": [mode: BehaviorTreePersistMode];
}>();

/** 分类选择器仅展示分类节点，不展示行为叶子。 */
const categorySelectTree = computed(() => omitActionLeavesFromCategoryTree(props.categoryTree));

/**
 * @description 读取创建态下锁定的对象唯一标识。
 * @returns 去空白后的锁定 id；非创建或未锁定时为空串。
 */
function resolveLockedOntologyId(): string {
  if (props.mode !== "create") return "";
  return (props.lockedOntologyId ?? "").trim();
}

/** 创建态且传入 lockedOntologyId 时锁定对象选择器。 */
const isOntologySelectorLocked = computed(() => Boolean(resolveLockedOntologyId()));

const operatorCatalog = ref<SpaceBehaviorOperatorOption[]>([]);
const operatorLoading = ref(false);
const operatorError = ref("");
let operatorLoadToken = 0;
const objectOptions = ref<OntologyCategoryObjectOption[]>([]);
/** 基础函数对象树（未应用跨目录禁用）。 */
const objectSelectTree = ref<OntologyCategorySelectTreeNode[]>([]);
const objectLoading = ref(false);
const objectError = ref("");
let objectLoadToken = 0;
/** 基础函数多选对象 id。 */
const basicFunctionOntologyIds = ref<string[]>([]);
/** 基础函数参数配置（过滤表达式序列化 JSON）。 */
const basicFunctionParameterConfig = ref(stringifyBasicFilterConfig(createBlankBasicFilterDocument()));
/** 单对象基础函数结果配置：展示字段（QUERY）或聚合（AGGREGATE）。 */
type BasicFunctionSingleResultMode = "query" | "aggregate";
/** 单对象时展示字段 / 聚合二选一；多对象忽略该值。 */
const basicFunctionSingleResultMode = ref<BasicFunctionSingleResultMode>("query");
/** 基础函数聚合类型；空表示未选（对应查询模式）。 */
const basicFunctionAggFunc = ref<FunctionOperatorAggFunc | "">("");
/** 基础函数聚合参数名（对应创建契约 targetField）。 */
const basicFunctionTargetField = ref("");
/** 基础函数展示字段（apiName 列表，对应 selectFields）。 */
const basicFunctionSelectFields = ref<string[]>([]);
/** 基础函数展示字段 → 写入字段绑定。 */
const basicFunctionWriteFields = ref<Record<string, SpaceBehaviorBasicFunctionWriteFieldBinding>>({});
/** 基础函数多对象写入字段（单行）。 */
const basicFunctionMultiWriteField = ref<SpaceBehaviorBasicFunctionWriteFieldBinding>({
  ontologyUniqueIdentifier: "",
  propertyUniqueIdentifier: "",
});
/** 单对象展示字段选项。 */
const basicFunctionSelectFieldOptions = ref<SpaceRelationObjectOption[]>([]);
const basicFunctionSelectFieldLoading = ref(false);
const basicFunctionSelectFieldError = ref("");
let basicFunctionSelectFieldLoadToken = 0;
/** 多对象写入字段：按对象缓存仅 storageGroup=main 的属性选项。 */
const basicFunctionMainPropertyOptionsByOntology = ref<Record<string, SpaceRelationObjectOption[]>>({});
const basicFunctionMainPropertyLoadingByOntology = ref<Record<string, boolean>>({});
const basicFunctionMainPropertyErrorByOntology = ref<Record<string, string>>({});
const basicFunctionMainPropertyLoadTokens: Record<string, number> = {};

/**
 * @description 重置基础函数参数配置为默认空过滤文档。
 */
function resetBasicFunctionParameterConfig(): void {
  basicFunctionParameterConfig.value = stringifyBasicFilterConfig(createBlankBasicFilterDocument());
}

/**
 * @description 清空基础函数聚合参数名。
 */
function clearBasicFunctionTargetField(): void {
  basicFunctionTargetField.value = "";
}

/**
 * @description 聚合类型变更：未选中时清空聚合参数名。
 * @param value 当前聚合类型。
 */
function handleBasicFunctionAggFuncChange(value: string | number | boolean | undefined): void {
  if (!value) {
    basicFunctionAggFunc.value = "";
    clearBasicFunctionTargetField();
  }
}

/**
 * @description 重置基础函数聚合类型与聚合参数名。
 */
function resetBasicFunctionAggFields(): void {
  basicFunctionAggFunc.value = "";
  clearBasicFunctionTargetField();
}

/**
 * @description 切换单对象结果配置：展示字段与聚合互斥清理。
 * @param value 目标模式。
 */
function handleBasicFunctionSingleResultModeChange(value: string | number | boolean | undefined): void {
  const nextMode: BasicFunctionSingleResultMode = value === "aggregate" ? "aggregate" : "query";
  basicFunctionSingleResultMode.value = nextMode;
  if (nextMode === "aggregate") {
    basicFunctionSelectFields.value = [];
    clearBasicFunctionWriteFields();
    return;
  }
  resetBasicFunctionAggFields();
  clearBasicFunctionMultiWriteField();
}

/**
 * @description 清空基础函数展示字段选择与选项状态，并同步清空写入字段。
 */
function resetBasicFunctionSelectFields(): void {
  basicFunctionSelectFieldLoadToken += 1;
  basicFunctionSelectFields.value = [];
  basicFunctionSelectFieldOptions.value = [];
  basicFunctionSelectFieldLoading.value = false;
  basicFunctionSelectFieldError.value = "";
  clearBasicFunctionWriteFields();
}

/**
 * @description 清空基础函数写入字段绑定。
 */
function clearBasicFunctionWriteFields(): void {
  basicFunctionWriteFields.value = {};
}

/**
 * @description 清空基础函数多对象写入字段绑定。
 */
function clearBasicFunctionMultiWriteField(): void {
  basicFunctionMultiWriteField.value = {
    ontologyUniqueIdentifier: "",
    propertyUniqueIdentifier: "",
    storageGroup: "",
  };
}

/**
 * @description 读取多对象写入字段的 main 属性选项。
 * @param ontologyUniqueIdentifier 对象唯一标识。
 * @returns 属性选项。
 */
function readBasicFunctionMainPropertyOptions(ontologyUniqueIdentifier: string): SpaceRelationObjectOption[] {
  const ontologyId = ontologyUniqueIdentifier.trim();
  if (!ontologyId) return [];
  return basicFunctionMainPropertyOptionsByOntology.value[ontologyId] ?? [];
}

/**
 * @description 多对象写入字段属性选项是否加载中。
 * @param ontologyUniqueIdentifier 对象唯一标识。
 * @returns 加载中为 true。
 */
function isBasicFunctionMainPropertyLoading(ontologyUniqueIdentifier: string): boolean {
  const ontologyId = ontologyUniqueIdentifier.trim();
  if (!ontologyId) return false;
  return Boolean(basicFunctionMainPropertyLoadingByOntology.value[ontologyId]);
}

/**
 * @description 读取多对象写入字段属性加载错误。
 * @param ontologyUniqueIdentifier 对象唯一标识。
 * @returns 错误文案。
 */
function readBasicFunctionMainPropertyError(ontologyUniqueIdentifier: string): string {
  const ontologyId = ontologyUniqueIdentifier.trim();
  if (!ontologyId) return "";
  return basicFunctionMainPropertyErrorByOntology.value[ontologyId] ?? "";
}

/**
 * @description 按对象加载并缓存 storageGroup=main 的属性选项；已缓存则跳过。
 * @param ontologyUniqueIdentifier 对象唯一标识。
 */
async function ensureBasicFunctionMainPropertyOptions(ontologyUniqueIdentifier: string): Promise<void> {
  const ontologyId = ontologyUniqueIdentifier.trim();
  if (!ontologyId) return;
  if (Object.prototype.hasOwnProperty.call(basicFunctionMainPropertyOptionsByOntology.value, ontologyId)) return;
  if (basicFunctionMainPropertyLoadingByOntology.value[ontologyId]) return;
  const requestToken = (basicFunctionMainPropertyLoadTokens[ontologyId] ?? 0) + 1;
  basicFunctionMainPropertyLoadTokens[ontologyId] = requestToken;
  basicFunctionMainPropertyLoadingByOntology.value = {
    ...basicFunctionMainPropertyLoadingByOntology.value,
    [ontologyId]: true,
  };
  basicFunctionMainPropertyErrorByOntology.value = {
    ...basicFunctionMainPropertyErrorByOntology.value,
    [ontologyId]: "",
  };
  try {
    const response = await getOntologyPropertyByOntologyIdInterface({ ontologyUniqueIdentifier: ontologyId });
    if (basicFunctionMainPropertyLoadTokens[ontologyId] !== requestToken) return;
    if (response.code !== 200 || !response.data) throw new Error(response.message || "属性列表加载失败");
    const options = new Map<string, SpaceRelationObjectOption>();
    for (const item of response.data) {
      if (!isMainStorageGroup(item.storageGroup)) continue;
      const value = typeof item.uniqueIdentifier === "string" ? item.uniqueIdentifier.trim() : "";
      if (!value || options.has(value)) continue;
      const apiName = typeof item.apiName === "string" ? item.apiName.trim() : "";
      const displayName = typeof item.displayName === "string" ? item.displayName.trim() : "";
      const propertyType = typeof item.propertyType === "string" ? item.propertyType.trim() : "";
      const nameLabel = displayName ? (apiName ? `${displayName}（${apiName}）` : displayName) : apiName || value;
      const storageGroup = normalizeStorageGroup(item.storageGroup) || "main";
      const withType = propertyType ? `${nameLabel} · ${propertyType}` : nameLabel;
      const label = `${withType} · ${storageGroup}`;
      options.set(value, { value, label });
      cachePropertyStorageGroup(ontologyId, value, storageGroup);
    }
    basicFunctionMainPropertyOptionsByOntology.value = {
      ...basicFunctionMainPropertyOptionsByOntology.value,
      [ontologyId]: [...options.values()].sort((left, right) => left.label.localeCompare(right.label, "zh-CN") || left.value.localeCompare(right.value)),
    };
  } catch (error) {
    if (basicFunctionMainPropertyLoadTokens[ontologyId] !== requestToken) return;
    basicFunctionMainPropertyErrorByOntology.value = {
      ...basicFunctionMainPropertyErrorByOntology.value,
      [ontologyId]: error instanceof Error ? error.message : "属性列表加载失败",
    };
  } finally {
    if (basicFunctionMainPropertyLoadTokens[ontologyId] === requestToken) {
      basicFunctionMainPropertyLoadingByOntology.value = {
        ...basicFunctionMainPropertyLoadingByOntology.value,
        [ontologyId]: false,
      };
    }
  }
}

/**
 * @description 更新多对象写入字段目标对象并清空已选属性。
 * @param value 对象唯一标识。
 */
function updateBasicFunctionMultiWriteFieldOntologyId(value: string | number | boolean | undefined): void {
  const ontologyUniqueIdentifier = String(value ?? "").trim();
  basicFunctionMultiWriteField.value = {
    ontologyUniqueIdentifier,
    propertyUniqueIdentifier: "",
    storageGroup: "",
  };
  if (ontologyUniqueIdentifier) {
    void ensureBasicFunctionMainPropertyOptions(ontologyUniqueIdentifier);
  }
}

/**
 * @description 更新多对象写入字段目标属性。
 * @param value 属性唯一标识。
 */
function updateBasicFunctionMultiWriteFieldPropertyId(value: string | number | boolean | undefined): void {
  const propertyUniqueIdentifier = String(value ?? "").trim();
  const ontologyUniqueIdentifier = basicFunctionMultiWriteField.value.ontologyUniqueIdentifier.trim();
  basicFunctionMultiWriteField.value = {
    ontologyUniqueIdentifier,
    propertyUniqueIdentifier,
    storageGroup: propertyUniqueIdentifier ? readCachedPropertyStorageGroup(ontologyUniqueIdentifier, propertyUniqueIdentifier) || "main" : "",
  };
}

/**
 * @description 读取展示字段对应的写入绑定；缺失时返回空绑定。
 * @param selectField 展示字段 apiName。
 * @returns 写入绑定。
 */
function readBasicFunctionWriteFieldBinding(selectField: string): SpaceBehaviorBasicFunctionWriteFieldBinding {
  return (
    basicFunctionWriteFields.value[selectField] ?? {
      ontologyUniqueIdentifier: "",
      propertyUniqueIdentifier: "",
      storageGroup: "",
    }
  );
}

/**
 * @description 读取已缓存的属性 storageGroup。
 * @param ontologyUniqueIdentifier 对象唯一标识。
 * @param propertyUniqueIdentifier 属性唯一标识。
 * @returns storageGroup；缺失时为空串。
 */
function readCachedPropertyStorageGroup(ontologyUniqueIdentifier: string, propertyUniqueIdentifier: string): string {
  const ontologyId = ontologyUniqueIdentifier.trim();
  const propertyId = propertyUniqueIdentifier.trim();
  if (!ontologyId || !propertyId) return "";
  return applicationPropertyStorageGroupByOntology.value[ontologyId]?.[propertyId] ?? "";
}

/**
 * @description 解析展示字段下拉展示文案。
 * @param selectField 展示字段 apiName。
 * @returns 选项 label，缺失时回退 apiName。
 */
function resolveBasicFunctionSelectFieldLabel(selectField: string): string {
  const matched = basicFunctionSelectFieldOptions.value.find((item) => item.value === selectField);
  return matched?.label || selectField;
}

/**
 * @description 读取单对象写入字段可用的子表属性选项（排除 storageGroup=main）。
 * @param ontologyUniqueIdentifier 对象唯一标识。
 * @returns 子表属性选项。
 */
function readBasicFunctionChildPropertyOptions(ontologyUniqueIdentifier: string): SpaceRelationObjectOption[] {
  const ontologyId = ontologyUniqueIdentifier.trim();
  if (!ontologyId) return [];
  return readApplicationPropertyOptions(ontologyId)
    .filter((item) => {
      const storageGroup = readCachedPropertyStorageGroup(ontologyId, item.value);
      return Boolean(storageGroup) && !isMainStorageGroup(storageGroup);
    })
    .map((item) => {
      const storageGroup = readCachedPropertyStorageGroup(ontologyId, item.value);
      return {
        ...item,
        label: storageGroup ? `${item.label} · ${storageGroup}` : item.label,
      };
    });
}

/**
 * @description 清空单对象写入字段中已选的 main / 非法属性，仅保留子表属性。
 * @param ontologyUniqueIdentifier 可选，仅处理该对象；空则处理全部。
 */
function pruneBasicFunctionWriteFieldsToChildProperties(ontologyUniqueIdentifier?: string): void {
  if (!showBasicFunctionSelectFields.value) return;
  const scopedOntologyId = ontologyUniqueIdentifier?.trim() ?? "";
  let changed = false;
  const next: Record<string, SpaceBehaviorBasicFunctionWriteFieldBinding> = { ...basicFunctionWriteFields.value };
  for (const [field, binding] of Object.entries(next)) {
    const ontologyId = binding.ontologyUniqueIdentifier.trim();
    if (scopedOntologyId && ontologyId !== scopedOntologyId) continue;
    const propertyId = binding.propertyUniqueIdentifier.trim();
    if (!ontologyId || !propertyId) continue;
    if (!Object.prototype.hasOwnProperty.call(applicationPropertyOptionsByOntology.value, ontologyId)) continue;
    const storageGroup = binding.storageGroup?.trim() || readCachedPropertyStorageGroup(ontologyId, propertyId);
    if (storageGroup && !isMainStorageGroup(storageGroup)) {
      if (binding.storageGroup?.trim() !== storageGroup) {
        next[field] = { ...binding, storageGroup };
        changed = true;
      }
      continue;
    }
    next[field] = {
      ontologyUniqueIdentifier: ontologyId,
      propertyUniqueIdentifier: "",
      storageGroup: "",
    };
    changed = true;
  }
  if (changed) basicFunctionWriteFields.value = next;
}

/**
 * @description 按展示字段列表同步写入字段行；新增行预填当前单对象并加载属性选项。
 */
function syncBasicFunctionWriteFieldsBySelectFields(): void {
  if (!showBasicFunctionSelectFields.value) {
    clearBasicFunctionWriteFields();
    return;
  }
  const defaultOntologyId = basicFunctionOntologyIds.value[0]?.trim() ?? "";
  const next: Record<string, SpaceBehaviorBasicFunctionWriteFieldBinding> = {};
  for (const selectField of basicFunctionSelectFields.value) {
    const field = selectField.trim();
    if (!field) continue;
    const previous = basicFunctionWriteFields.value[field];
    const ontologyUniqueIdentifier = (previous?.ontologyUniqueIdentifier || defaultOntologyId).trim();
    let propertyUniqueIdentifier = previous?.propertyUniqueIdentifier?.trim() ?? "";
    let storageGroup = propertyUniqueIdentifier
      ? previous?.storageGroup?.trim() || readCachedPropertyStorageGroup(ontologyUniqueIdentifier, propertyUniqueIdentifier)
      : "";
    if (propertyUniqueIdentifier && (!storageGroup || isMainStorageGroup(storageGroup))) {
      if (storageGroup && isMainStorageGroup(storageGroup)) {
        propertyUniqueIdentifier = "";
        storageGroup = "";
      } else if (Object.prototype.hasOwnProperty.call(applicationPropertyOptionsByOntology.value, ontologyUniqueIdentifier)) {
        propertyUniqueIdentifier = "";
        storageGroup = "";
      }
    }
    next[field] = {
      ontologyUniqueIdentifier,
      propertyUniqueIdentifier,
      storageGroup,
    };
    if (ontologyUniqueIdentifier) void ensureApplicationPropertyOptions(ontologyUniqueIdentifier);
  }
  basicFunctionWriteFields.value = next;
}

/**
 * @description 更新写入字段目标对象并清空已选属性。
 * @param selectField 展示字段 apiName。
 * @param value 对象 uniqueIdentifier。
 */
function updateBasicFunctionWriteFieldOntologyId(selectField: string, value: string | number | boolean | undefined): void {
  const ontologyUniqueIdentifier = typeof value === "string" ? value.trim() : "";
  basicFunctionWriteFields.value = {
    ...basicFunctionWriteFields.value,
    [selectField]: {
      ontologyUniqueIdentifier,
      propertyUniqueIdentifier: "",
      storageGroup: "",
    },
  };
  if (ontologyUniqueIdentifier) void ensureApplicationPropertyOptions(ontologyUniqueIdentifier);
}

/**
 * @description 更新写入字段目标属性。
 * @param selectField 展示字段 apiName。
 * @param value 属性 uniqueIdentifier。
 */
function updateBasicFunctionWriteFieldPropertyId(selectField: string, value: string | number | boolean | undefined): void {
  const propertyUniqueIdentifier = typeof value === "string" ? value.trim() : "";
  const previous = readBasicFunctionWriteFieldBinding(selectField);
  basicFunctionWriteFields.value = {
    ...basicFunctionWriteFields.value,
    [selectField]: {
      ontologyUniqueIdentifier: previous.ontologyUniqueIdentifier,
      propertyUniqueIdentifier,
      storageGroup: propertyUniqueIdentifier ? readCachedPropertyStorageGroup(previous.ontologyUniqueIdentifier, propertyUniqueIdentifier) : "",
    },
  };
}

/**
 * @description 按单对象加载展示字段选项（属性 apiName）。
 * @param ontologyUniqueIdentifier 对象唯一标识。
 */
async function loadBasicFunctionSelectFieldOptions(ontologyUniqueIdentifier: string): Promise<void> {
  const ontologyId = ontologyUniqueIdentifier.trim();
  if (!ontologyId) {
    resetBasicFunctionSelectFields();
    return;
  }
  const requestToken = ++basicFunctionSelectFieldLoadToken;
  basicFunctionSelectFieldLoading.value = true;
  basicFunctionSelectFieldError.value = "";
  basicFunctionSelectFieldOptions.value = [];
  try {
    const response = await getOntologyObjectArrTypeTreeInterface({ ontologyUniqueIdentifier: ontologyId });
    if (requestToken !== basicFunctionSelectFieldLoadToken) return;
    if (response.code !== 200) throw new Error(response.message || "属性列表加载失败");
    const options = new Map<string, SpaceRelationObjectOption>();
    for (const property of flattenPropertyInfosFromCategoryTree(response.data)) {
      const apiName = typeof property.apiName === "string" ? property.apiName.trim() : "";
      if (!apiName || options.has(apiName)) continue;
      const displayName = typeof property.displayName === "string" ? property.displayName.trim() : "";
      const label = displayName ? `${displayName}（${apiName}）` : apiName;
      options.set(apiName, { value: apiName, label });
    }
    basicFunctionSelectFieldOptions.value = [...options.values()].sort(
      (left, right) => left.label.localeCompare(right.label, "zh-CN") || left.value.localeCompare(right.value),
    );
    basicFunctionSelectFields.value = basicFunctionSelectFields.value.filter((apiName) => options.has(apiName));
    const currentTarget = (basicFunctionTargetField.value ?? "").trim();
    if (currentTarget && !options.has(currentTarget)) {
      basicFunctionTargetField.value = "";
    }
    syncBasicFunctionWriteFieldsBySelectFields();
  } catch (error) {
    if (requestToken !== basicFunctionSelectFieldLoadToken) return;
    basicFunctionSelectFieldOptions.value = [];
    basicFunctionSelectFields.value = [];
    clearBasicFunctionWriteFields();
    clearBasicFunctionTargetField();
    basicFunctionSelectFieldError.value = error instanceof Error ? error.message : "属性列表加载失败";
  } finally {
    if (requestToken === basicFunctionSelectFieldLoadToken) {
      basicFunctionSelectFieldLoading.value = false;
    }
  }
}

/**
 * @description 按当前基础函数对象选择同步属性选项：单对象默认展示字段模式；多对象走聚合并清空展示字段；无对象时清空选项。
 */
function syncBasicFunctionSelectFieldsByOntologySelection(): void {
  if (!showBasicFunctionOperatorSection.value || basicFunctionOntologyIds.value.length === 0) {
    basicFunctionSingleResultMode.value = "query";
    resetBasicFunctionSelectFields();
    resetBasicFunctionAggFields();
    clearBasicFunctionMultiWriteField();
    return;
  }
  if (basicFunctionOntologyIds.value.length === 1) {
    basicFunctionSingleResultMode.value = "query";
    resetBasicFunctionAggFields();
    clearBasicFunctionMultiWriteField();
    const ontologyId = basicFunctionOntologyIds.value[0]?.trim() ?? "";
    void loadBasicFunctionSelectFieldOptions(ontologyId);
    syncBasicFunctionWriteFieldsBySelectFields();
    return;
  }
  basicFunctionSingleResultMode.value = "aggregate";
  clearBasicFunctionTargetField();
  clearBasicFunctionMultiWriteField();
  basicFunctionSelectFields.value = [];
  clearBasicFunctionWriteFields();
  const firstOntologyId = basicFunctionOntologyIds.value[0]?.trim() ?? "";
  void loadBasicFunctionSelectFieldOptions(firstOntologyId);
}
const attributeRows = ref<OntologyPropertyInfo[]>([]);
const attributeLoading = ref(false);
const attributeError = ref("");
let attributeLoadToken = 0;
const attributeTableRef = ref<TableInstance>();
let syncingAttributeSelection = false;
const relationRows = ref<OntologyRelationClass[]>([]);
const relationLoading = ref(false);
const relationError = ref("");
const relationSearchKeyword = ref("");
const relationPageNum = ref(1);
const relationTotal = ref(0);
let relationLoadToken = 0;
const selectedRelationId = ref("");
/** 应用行为「绑定关系」多选 id 列表。 */
const relationTargetStatus = ref<SpaceBehaviorRelationTargetStatus | "">("");
/** 时段选择器行；value-format=x 时用数字毫秒时间戳，避免字符串被解析为年份。 */
const visibilityWindowRows = ref<Array<[number, number] | null>>([]);
const kind = ref<SpaceBehaviorKind>("basic");
const valueType = ref<SpaceBehaviorValueType>("attributeValue");
const displayName = ref("");
const behaviorApiName = ref("");
const functionOperatorId = ref("");
const functionOperatorName = ref("");
const functionOperatorVersion = ref("");
const applicationInputRows = ref<ApplicationFunctionParamRow[]>([]);
const applicationOutputRows = ref<ApplicationFunctionParamRow[]>([]);
const applicationInputBindings = ref<Record<string, SpaceBehaviorApplicationInputBinding>>({});
const applicationDetailLoading = ref(false);
const applicationDetailError = ref("");
let applicationDetailToken = 0;

/**
 * @description 创建应用行为入参绑定的默认草稿。
 * @returns 默认绑定。
 */
function createDefaultApplicationInputBinding(): SpaceBehaviorApplicationInputBinding {
  const lockedOntologyId = resolveLockedOntologyId();
  return {
    sourceType: "PROPERTY",
    ontologyUniqueIdentifier: lockedOntologyId,
    propertyUniqueIdentifier: "",
    fixedValue: "",
    enableDefaultValue: false,
    defaultValue: "",
  };
}

/**
 * @description 读取指定入参行的本地绑定；缺失时回退默认草稿。
 * @param rowKey 入参行键。
 * @returns 绑定草稿。
 */
function readApplicationInputBinding(rowKey: string): SpaceBehaviorApplicationInputBinding {
  return applicationInputBindings.value[rowKey] ?? createDefaultApplicationInputBinding();
}

/**
 * @description 按非对象入参行初始化本地绑定状态。
 * @param rows 入参扁平行。
 */
function syncApplicationInputBindings(rows: ApplicationFunctionParamRow[]): void {
  const lockedOntologyId = resolveLockedOntologyId();
  const next: Record<string, SpaceBehaviorApplicationInputBinding> = {};
  for (const row of rows) {
    if (row.isObject) continue;
    const binding = applicationInputBindings.value[row.rowKey] ?? createDefaultApplicationInputBinding();
    if (lockedOntologyId && binding.sourceType === "PROPERTY" && !binding.ontologyUniqueIdentifier.trim()) {
      binding.ontologyUniqueIdentifier = lockedOntologyId;
    }
    next[row.rowKey] = binding;
    if (binding.ontologyUniqueIdentifier.trim()) void ensureApplicationPropertyOptions(binding.ontologyUniqueIdentifier);
  }
  applicationInputBindings.value = next;
}

/**
 * @description 写入单个入参绑定的局部字段。
 * @param rowKey 入参行键。
 * @param patch 局部更新。
 */
function patchApplicationInputBinding(rowKey: string, patch: Partial<SpaceBehaviorApplicationInputBinding>): void {
  applicationInputBindings.value = {
    ...applicationInputBindings.value,
    [rowKey]: {
      ...readApplicationInputBinding(rowKey),
      ...patch,
    },
  };
}

/**
 * @description 更新入参输入来源，并清空不适用的取值字段。
 * @param rowKey 入参行键。
 * @param value 新来源。
 */
function updateApplicationInputSourceType(rowKey: string, value: string | number | boolean | undefined): void {
  if (value !== "PROPERTY" && value !== "FIXED" && value !== "EXTERNAL") return;
  const sourceType = value as SpaceBehaviorApplicationInputSourceType;
  const lockedOntologyId = resolveLockedOntologyId();
  const ontologyUniqueIdentifier = sourceType === "PROPERTY" ? lockedOntologyId : "";
  patchApplicationInputBinding(rowKey, {
    sourceType,
    ontologyUniqueIdentifier,
    propertyUniqueIdentifier: "",
    fixedValue: "",
    enableDefaultValue: false,
    defaultValue: "",
  });
  if (ontologyUniqueIdentifier) void ensureApplicationPropertyOptions(ontologyUniqueIdentifier);
}

/**
 * @description 更新对象属性来源下选中的对象，并加载属性选项。
 * @param rowKey 入参行键。
 * @param value 对象 uniqueIdentifier。
 */
function updateApplicationInputOntologyId(rowKey: string, value: string | number | boolean | undefined): void {
  const ontologyUniqueIdentifier = typeof value === "string" ? value.trim() : "";
  patchApplicationInputBinding(rowKey, {
    ontologyUniqueIdentifier,
    propertyUniqueIdentifier: "",
  });
  if (ontologyUniqueIdentifier) void ensureApplicationPropertyOptions(ontologyUniqueIdentifier);
}

/**
 * @description 更新对象属性来源下选中的属性标识。
 * @param rowKey 入参行键。
 * @param value 属性 uniqueIdentifier。
 */
function updateApplicationInputPropertyId(rowKey: string, value: string | number | boolean | undefined): void {
  const propertyUniqueIdentifier = typeof value === "string" ? value.trim() : "";
  patchApplicationInputBinding(rowKey, { propertyUniqueIdentifier });
}

/**
 * @description 更新固定值来源下的字面量。
 * @param rowKey 入参行键。
 * @param value 固定值文本。
 */
function updateApplicationInputFixedValue(rowKey: string, value: string): void {
  patchApplicationInputBinding(rowKey, { fixedValue: value });
}

/**
 * @description 更新外部输入是否启用默认值。
 * @param rowKey 入参行键。
 * @param value 是否启用。
 */
function updateApplicationInputEnableDefaultValue(rowKey: string, value: string | number | boolean): void {
  const enableDefaultValue = value === true;
  patchApplicationInputBinding(rowKey, {
    enableDefaultValue,
    defaultValue: enableDefaultValue ? readApplicationInputBinding(rowKey).defaultValue : "",
  });
}

/**
 * @description 更新外部输入默认值字面量。
 * @param rowKey 入参行键。
 * @param value 默认值文本。
 */
function updateApplicationInputDefaultValue(rowKey: string, value: string): void {
  patchApplicationInputBinding(rowKey, { defaultValue: value });
}

const applicationOutputBindings = ref<Record<string, SpaceBehaviorApplicationOutputBinding>>({});

/**
 * @description 创建应用行为出参绑定的默认草稿。
 * @returns 默认绑定。
 */
function createDefaultApplicationOutputBinding(): SpaceBehaviorApplicationOutputBinding {
  return {
    outputMode: "RESULT_ONLY",
    ontologyUniqueIdentifier: "",
    propertyUniqueIdentifier: "",
  };
}

/**
 * @description 读取指定出参行的本地绑定；缺失时回退默认草稿。
 * @param rowKey 出参行键。
 * @returns 绑定草稿。
 */
function readApplicationOutputBinding(rowKey: string): SpaceBehaviorApplicationOutputBinding {
  return applicationOutputBindings.value[rowKey] ?? createDefaultApplicationOutputBinding();
}

/**
 * @description 按非对象出参行初始化本地绑定状态。
 * @param rows 出参扁平行。
 */
function syncApplicationOutputBindings(rows: ApplicationFunctionParamRow[]): void {
  const next: Record<string, SpaceBehaviorApplicationOutputBinding> = {};
  for (const row of rows) {
    if (row.isObject) continue;
    next[row.rowKey] = applicationOutputBindings.value[row.rowKey] ?? createDefaultApplicationOutputBinding();
  }
  applicationOutputBindings.value = next;
}

/**
 * @description 写入单个出参绑定的局部字段。
 * @param rowKey 出参行键。
 * @param patch 局部更新。
 */
function patchApplicationOutputBinding(rowKey: string, patch: Partial<SpaceBehaviorApplicationOutputBinding>): void {
  applicationOutputBindings.value = {
    ...applicationOutputBindings.value,
    [rowKey]: {
      ...readApplicationOutputBinding(rowKey),
      ...patch,
    },
  };
}

/**
 * @description 更新出参输出方式，并清空不适用的写入属性。
 * @param rowKey 出参行键。
 * @param value 新输出方式。
 */
function updateApplicationOutputMode(rowKey: string, value: string | number | boolean | undefined): void {
  if (value !== "RESULT_ONLY" && value !== "WRITE_PROPERTY") return;
  const outputMode = value as SpaceBehaviorApplicationOutputMode;
  const lockedOntologyId = resolveLockedOntologyId();
  const ontologyUniqueIdentifier = outputMode === "WRITE_PROPERTY" ? lockedOntologyId : "";
  patchApplicationOutputBinding(rowKey, {
    outputMode,
    ontologyUniqueIdentifier,
    propertyUniqueIdentifier: "",
  });
  if (ontologyUniqueIdentifier) void ensureApplicationPropertyOptions(ontologyUniqueIdentifier);
}

/**
 * @description 更新写入对象属性时选中的对象，并加载属性选项。
 * @param rowKey 出参行键。
 * @param value 对象 uniqueIdentifier。
 */
function updateApplicationOutputOntologyId(rowKey: string, value: string | number | boolean | undefined): void {
  const ontologyUniqueIdentifier = typeof value === "string" ? value.trim() : "";
  patchApplicationOutputBinding(rowKey, {
    ontologyUniqueIdentifier,
    propertyUniqueIdentifier: "",
  });
  if (ontologyUniqueIdentifier) void ensureApplicationPropertyOptions(ontologyUniqueIdentifier);
}

/**
 * @description 更新写入对象属性时选中的属性标识。
 * @param rowKey 出参行键。
 * @param value 属性 uniqueIdentifier。
 */
function updateApplicationOutputPropertyId(rowKey: string, value: string | number | boolean | undefined): void {
  const propertyUniqueIdentifier = typeof value === "string" ? value.trim() : "";
  patchApplicationOutputBinding(rowKey, { propertyUniqueIdentifier });
}

/** 应用行为按对象缓存的属性选项（value=uniqueIdentifier）。 */
const applicationPropertyOptionsByOntology = ref<Record<string, SpaceRelationObjectOption[]>>({});
/** 按对象缓存属性 uniqueIdentifier → storageGroup，供基础函数 writeBack 组装。 */
const applicationPropertyStorageGroupByOntology = ref<Record<string, Record<string, string>>>({});
const applicationPropertyLoadingByOntology = ref<Record<string, boolean>>({});
const applicationPropertyErrorByOntology = ref<Record<string, string>>({});
const applicationPropertyLoadTokens: Record<string, number> = {};

/**
 * @description 写入属性 storageGroup 缓存。
 * @param ontologyId 对象唯一标识。
 * @param propertyId 属性唯一标识。
 * @param storageGroup 存储分组。
 */
function cachePropertyStorageGroup(ontologyId: string, propertyId: string, storageGroup: string): void {
  const ontologyKey = ontologyId.trim();
  const propertyKey = propertyId.trim();
  if (!ontologyKey || !propertyKey) return;
  const previous = applicationPropertyStorageGroupByOntology.value[ontologyKey] ?? {};
  applicationPropertyStorageGroupByOntology.value = {
    ...applicationPropertyStorageGroupByOntology.value,
    [ontologyKey]: {
      ...previous,
      [propertyKey]: normalizeStorageGroup(storageGroup),
    },
  };
}

/**
 * @description 清空应用行为属性选项缓存。
 */
function clearApplicationPropertyOptionCache(): void {
  applicationPropertyOptionsByOntology.value = {};
  applicationPropertyStorageGroupByOntology.value = {};
  applicationPropertyLoadingByOntology.value = {};
  applicationPropertyErrorByOntology.value = {};
  for (const key of Object.keys(applicationPropertyLoadTokens)) delete applicationPropertyLoadTokens[key];
}

/**
 * @description 读取对象下的属性选项。
 * @param ontologyUniqueIdentifier 对象唯一标识。
 * @returns 属性选项。
 */
function readApplicationPropertyOptions(ontologyUniqueIdentifier: string): SpaceRelationObjectOption[] {
  const ontologyId = ontologyUniqueIdentifier.trim();
  if (!ontologyId) return [];
  return applicationPropertyOptionsByOntology.value[ontologyId] ?? [];
}

/**
 * @description 判断对象属性选项是否加载中。
 * @param ontologyUniqueIdentifier 对象唯一标识。
 * @returns 加载中为 true。
 */
function isApplicationPropertyLoading(ontologyUniqueIdentifier: string): boolean {
  const ontologyId = ontologyUniqueIdentifier.trim();
  if (!ontologyId) return false;
  return Boolean(applicationPropertyLoadingByOntology.value[ontologyId]);
}

/**
 * @description 读取对象属性选项加载错误。
 * @param ontologyUniqueIdentifier 对象唯一标识。
 * @returns 错误文案。
 */
function readApplicationPropertyError(ontologyUniqueIdentifier: string): string {
  const ontologyId = ontologyUniqueIdentifier.trim();
  if (!ontologyId) return "";
  return applicationPropertyErrorByOntology.value[ontologyId] ?? "";
}

/**
 * @description 按对象加载并缓存属性选项（uniqueIdentifier）；已缓存则跳过。
 * @param ontologyUniqueIdentifier 对象唯一标识。
 */
async function ensureApplicationPropertyOptions(ontologyUniqueIdentifier: string): Promise<void> {
  const ontologyId = ontologyUniqueIdentifier.trim();
  if (!ontologyId) return;
  if (Object.prototype.hasOwnProperty.call(applicationPropertyOptionsByOntology.value, ontologyId)) return;
  if (applicationPropertyLoadingByOntology.value[ontologyId]) return;
  const requestToken = (applicationPropertyLoadTokens[ontologyId] ?? 0) + 1;
  applicationPropertyLoadTokens[ontologyId] = requestToken;
  applicationPropertyLoadingByOntology.value = {
    ...applicationPropertyLoadingByOntology.value,
    [ontologyId]: true,
  };
  applicationPropertyErrorByOntology.value = {
    ...applicationPropertyErrorByOntology.value,
    [ontologyId]: "",
  };
  try {
    const response = await getOntologyPropertyByOntologyIdInterface({ ontologyUniqueIdentifier: ontologyId });
    if (applicationPropertyLoadTokens[ontologyId] !== requestToken) return;
    if (response.code !== 200 || !response.data) throw new Error(response.message || "属性列表加载失败");
    const options = new Map<string, SpaceRelationObjectOption>();
    for (const item of response.data) {
      const value = typeof item.uniqueIdentifier === "string" ? item.uniqueIdentifier.trim() : "";
      if (!value || options.has(value)) continue;
      const apiName = typeof item.apiName === "string" ? item.apiName.trim() : "";
      const displayName = typeof item.displayName === "string" ? item.displayName.trim() : "";
      const propertyType = typeof item.propertyType === "string" ? item.propertyType.trim() : "";
      const nameLabel = displayName ? (apiName ? `${displayName}（${apiName}）` : displayName) : apiName || value;
      const label = propertyType ? `${nameLabel} · ${propertyType}` : nameLabel;
      options.set(value, { value, label });
      cachePropertyStorageGroup(ontologyId, value, item.storageGroup ?? "");
    }
    applicationPropertyOptionsByOntology.value = {
      ...applicationPropertyOptionsByOntology.value,
      [ontologyId]: [...options.values()].sort((left, right) => left.label.localeCompare(right.label, "zh-CN") || left.value.localeCompare(right.value)),
    };
    pruneBasicFunctionWriteFieldsToChildProperties(ontologyId);
  } catch (error) {
    if (applicationPropertyLoadTokens[ontologyId] !== requestToken) return;
    applicationPropertyErrorByOntology.value = {
      ...applicationPropertyErrorByOntology.value,
      [ontologyId]: error instanceof Error ? error.message : "属性列表加载失败",
    };
  } finally {
    if (applicationPropertyLoadTokens[ontologyId] === requestToken) {
      applicationPropertyLoadingByOntology.value = {
        ...applicationPropertyLoadingByOntology.value,
        [ontologyId]: false,
      };
    }
  }
}

const description = ref("");
const categoryId = ref(ROOT_SPACE_BEHAVIOR_CATEGORY_ID);
const status = ref<SpaceBehaviorStatus>("draft");
const basicAction = ref<SpaceBehaviorBasicAction>("create");
const ontologyIdentifier = ref("");
const selectedPropertyIds = ref<string[]>([]);
const selectedPropertyValues = ref<Record<string, string>>({});
const storageGroup = ref("");
const submitLoading = ref(false);
const detailLoading = ref(false);
const detailError = ref("");
const unsupportedEditReason = ref("");
let detailLoadToken = 0;
const readonly = computed(() => props.mode === "edit" && (props.behavior?.status === "published" || props.behavior?.status === "disabled"));
const dialogTitle = computed(() => {
  if (props.mode !== "edit") return "创建行为";
  return readonly.value ? "查看行为" : "编辑行为";
});
const showAttributeValueObjectSection = computed(() => kind.value === "basic" && valueType.value === "attributeValue");
const showRelationInstanceSection = computed(() => kind.value === "basic" && valueType.value === "relationInstance");
const showBasicFunctionOperatorSection = computed(() => kind.value === "basic" && valueType.value === "basicFunctionOperator");
/** 基础函数仅选中单个对象时展示「展示字段 / 聚合」二选一切换。 */
const showBasicFunctionSingleResultModeToggle = computed(() => showBasicFunctionOperatorSection.value && basicFunctionOntologyIds.value.length === 1);
/** 单对象且结果配置为展示字段时展示 selectFields。 */
const showBasicFunctionSelectFields = computed(() => showBasicFunctionSingleResultModeToggle.value && basicFunctionSingleResultMode.value === "query");
/** 多对象，或单对象选择聚合时展示聚合表单。 */
const showBasicFunctionAggregateFields = computed(
  () =>
    showBasicFunctionOperatorSection.value &&
    (basicFunctionOntologyIds.value.length > 1 || (basicFunctionOntologyIds.value.length === 1 && basicFunctionSingleResultMode.value === "aggregate")),
);
/** 聚合模式下展示单行回写写入字段（多对象或单对象聚合）。 */
const showBasicFunctionMultiWriteField = computed(() => showBasicFunctionAggregateFields.value);
/** 已选对象时参数配置属性列使用首对象属性选项（与聚合参数名同源）。 */
const basicFunctionFilterPropertyOptions = computed(() =>
  showBasicFunctionOperatorSection.value && basicFunctionOntologyIds.value.length >= 1 ? basicFunctionSelectFieldOptions.value : [],
);
const basicFunctionSelectedCategoryId = computed(() => {
  const firstId = basicFunctionOntologyIds.value[0]?.trim() ?? "";
  if (!firstId) return null;
  return objectOptions.value.find((item) => item.value === firstId)?.categoryId ?? null;
});
/** 基础函数对象树：按已选目录禁用跨目录对象。 */
const basicFunctionObjectTree = computed(() => applyOntologyCategorySelectTreeDisabled(objectSelectTree.value, basicFunctionSelectedCategoryId.value));
const showRelationLinkMappingSection = computed(
  () => showRelationInstanceSection.value && Boolean(selectedRelationId.value.trim()) && (basicAction.value === "create" || basicAction.value === "update"),
);
/** 应用行为始终展示绑定关系，且非必选（含出参为 WRITE_PROPERTY 时）。 */
const showApplicationRelationSection = computed(() => kind.value === "application");
const relationTargetStatusOptions = computed(() => listSpaceBehaviorRelationTargetStatusOptions(basicAction.value));
const attributeSelectionHint = computed(() => {
  if (basicAction.value === "create") return "不可选择 main 分组；选中同组任一属性将全选该组";
  if (basicAction.value === "delete") return "不可选择 main 分组；选中同组任一属性将全选该组";
  return "仅可多选同一存储分组下的属性";
});

/**
 * @description 清空对象与属性选择及相关列表状态。
 */
function clearObjectInfoSelection(): void {
  ontologyIdentifier.value = "";
  selectedPropertyIds.value = [];
  selectedPropertyValues.value = {};
  storageGroup.value = "";
  attributeRows.value = [];
  attributeError.value = "";
  attributeLoadToken += 1;
  attributeLoading.value = false;
}

/**
 * @description 创建态下将主对象选择锁定为 lockedOntologyId，并预加载属性选项。
 */
function applyLockedOntologyIdentifier(): void {
  const lockedId = resolveLockedOntologyId();
  if (!lockedId) return;
  ontologyIdentifier.value = lockedId;
  void loadAttributeRows(lockedId);
  void ensureApplicationPropertyOptions(lockedId);
}

/**
 * @description 清空应用行为绑定关系单选。
 */
function clearApplicationRelationSelection(): void {
  selectedRelationId.value = "";
}

/**
 * @description 清空关系实例选中项、linkMapping 字段与关系列表加载状态。
 */
function clearRelationSelection(): void {
  selectedRelationId.value = "";
  ontologyIdentifier.value = "";
  clearApplicationRelationSelection();
  clearRelationLinkMappingFields();
  relationRows.value = [];
  relationSearchKeyword.value = "";
  relationPageNum.value = 1;
  relationTotal.value = 0;
  relationError.value = "";
  relationLoadToken += 1;
  relationLoading.value = false;
}

/**
 * @description 按关系名称搜索并回到第一页。
 */
function searchRelationRows(): void {
  relationPageNum.value = 1;
  void loadRelationRows();
}

/**
 * @description 切换关系列表页码并重新加载。
 * @param page 目标页码。
 */
function changeRelationPage(page: number): void {
  relationPageNum.value = page;
  void loadRelationRows();
}

/**
 * @description 格式化应用行为关系行的源→目标展示文案。
 * @param row 关系行。
 * @returns 映射文案。
 */
function formatApplicationRelationMapping(row: { sourceName?: string; targetName?: string }): string {
  const sourceName = (row.sourceName ?? "").trim() || "—";
  const targetName = (row.targetName ?? "").trim() || "—";
  return `${sourceName} → ${targetName}`;
}

/**
 * @description 单选或取消单选应用行为绑定关系；再次点击已选项则清空。
 * @param relationId 关系 uniqueIdentifier。
 */
function selectApplicationRelationRow(relationId: string): void {
  if (readonly.value) return;
  const nextId = relationId.trim();
  if (!nextId) {
    selectedRelationId.value = "";
    return;
  }
  selectedRelationId.value = selectedRelationId.value === nextId ? "" : nextId;
}

/**
 * @description 点击应用行为关系行时同步单选。
 * @param row 关系行。
 */
function handleApplicationRelationRowClick(row: Pick<OntologyRelationClass, "id">): void {
  selectApplicationRelationRow(row.id);
}

/**
 * @description 清空关系目标状态与持续时段录入。
 */
function clearRelationLinkMappingFields(): void {
  relationTargetStatus.value = "";
  visibilityWindowRows.value = [];
}

/**
 * @description 新增时保证至少有一行空时段便于录入。
 */
function ensureDefaultVisibilityWindowRow(): void {
  if (visibilityWindowRows.value.length === 0) {
    visibilityWindowRows.value = [null];
  }
}

/**
 * @description 追加一条空持续时段。
 */
function addVisibilityWindowRow(): void {
  if (readonly.value) return;
  visibilityWindowRows.value = [...visibilityWindowRows.value, null];
}

/**
 * @description 删除指定持续时段行。
 * @param index 行下标。
 */
function removeVisibilityWindowRow(index: number): void {
  if (readonly.value) return;
  visibilityWindowRows.value = visibilityWindowRows.value.filter((_, rowIndex) => rowIndex !== index);
}

/**
 * @description 将选择器返回值规范为毫秒时间戳数字。
 * @param value 选择器单项。
 * @returns 有限数字毫秒；无法解析时为 NaN。
 */
function readVisibilityWindowTimestamp(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : Number.NaN;
  if (typeof value === "string" && value.trim()) {
    const trimmed = value.trim();
    const asNumber = Number(trimmed);
    if (Number.isFinite(asNumber)) return asNumber;
    const parsed = Date.parse(trimmed);
    return Number.isFinite(parsed) ? parsed : Number.NaN;
  }
  if (value instanceof Date) {
    const time = value.getTime();
    return Number.isFinite(time) ? time : Number.NaN;
  }
  return Number.NaN;
}

/**
 * @description 更新指定持续时段行的起止时间。
 * @param index 行下标。
 * @param value 选择器返回值。
 */
function updateVisibilityWindowRow(index: number, value: unknown): void {
  if (readonly.value) return;
  const nextRows = [...visibilityWindowRows.value];
  if (Array.isArray(value) && value.length === 2) {
    const startTime = readVisibilityWindowTimestamp(value[0]);
    const endTime = readVisibilityWindowTimestamp(value[1]);
    nextRows[index] = Number.isFinite(startTime) && Number.isFinite(endTime) ? [startTime, endTime] : null;
  } else {
    nextRows[index] = null;
  }
  visibilityWindowRows.value = nextRows;
}

/**
 * @description 将时段选择器行映射为草稿 visibilityWindows。
 * @returns 完整时段列表。
 */
function buildRelationVisibilityWindowsForDraft(): SpaceBehaviorRelationVisibilityWindow[] {
  const windows: SpaceBehaviorRelationVisibilityWindow[] = [];
  for (const row of visibilityWindowRows.value) {
    if (!row) continue;
    windows.push({ startTime: row[0], endTime: row[1] });
  }
  return windows;
}

/**
 * @description 单选一条关系；切换关系时重置 linkMapping 录入。
 * @param relationId 关系 uniqueIdentifier。
 */
function selectRelationRow(relationId: string): void {
  if (readonly.value) return;
  const nextId = relationId.trim();
  if (!nextId) return;
  if (selectedRelationId.value === nextId) return;
  selectedRelationId.value = nextId;
  const row = relationRows.value.find((item) => item.id === nextId);
  ontologyIdentifier.value = row?.sourceOntologyId.trim() ?? "";
  clearRelationLinkMappingFields();
  if (basicAction.value === "create" || basicAction.value === "update") {
    ensureDefaultVisibilityWindowRow();
  }
}

/**
 * @description 点击关系行时同步单选。
 * @param row 关系行。
 */
function handleRelationRowClick(row: OntologyRelationClass): void {
  selectRelationRow(row.id);
}

/**
 * @description 属性值行为不再录入固定值，草稿中返回空映射以保持类型兼容。
 * @returns 空的属性值映射。
 */
function buildSelectedPropertyValuesForDraft(): Record<string, string> {
  return {};
}

/**
 * @description 从当前属性行回填勾选属性的 apiName，供创建行为 mappingIns.parameterName。
 * @returns 勾选属性 id 到 apiName 的映射。
 */
function buildSelectedPropertyApiNamesForDraft(): Record<string, string> {
  const names: Record<string, string> = {};
  for (const propertyId of selectedPropertyIds.value) {
    const row = attributeRows.value.find((item) => readPropertyRowId(item) === propertyId);
    const apiName = typeof row?.apiName === "string" ? row.apiName.trim() : "";
    names[propertyId] = apiName;
  }
  return names;
}

/**
 * @description 清空应用行为函数详情入出参展示。
 */
function clearApplicationOperatorDetail(): void {
  applicationDetailToken += 1;
  applicationInputRows.value = [];
  applicationOutputRows.value = [];
  applicationInputBindings.value = {};
  applicationOutputBindings.value = {};
  applicationDetailError.value = "";
  applicationDetailLoading.value = false;
}

/**
 * @description 清空当前关联的函数算子与参数绑定。
 */
function clearSelectedOperator(): void {
  functionOperatorId.value = "";
  functionOperatorName.value = "";
  functionOperatorVersion.value = "";
  clearApplicationOperatorDetail();
}

/**
 * @description 按选中的函数算子回填标识、名称与版本。
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
  functionOperatorVersion.value = operator.version;
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
    clearRelationSelection();
    valueType.value = "attributeValue";
    return;
  }
  clearObjectInfoSelection();
  clearRelationSelection();
  if (value === "application") {
    basicAction.value = "create";
    clearSelectedOperator();
    void loadOperatorCatalog();
    void loadRelationRows();
    return;
  }
  displayName.value = "";
  behaviorApiName.value = "";
  description.value = "";
  categoryId.value = props.defaultCategoryId || ROOT_SPACE_BEHAVIOR_CATEGORY_ID;
  valueType.value = "attributeValue";
  basicAction.value = "create";
  clearSelectedOperator();
}

/**
 * @description 创建态锁定对象时预填基础函数多选（仅单对象）。
 */
function applyLockedBasicFunctionOntologyIds(): void {
  const lockedId = resolveLockedOntologyId();
  if (!lockedId) return;
  basicFunctionOntologyIds.value = [lockedId];
  syncBasicFunctionSelectFieldsByOntologySelection();
}

/**
 * @description 更新基础函数多选对象；跨目录时提示并回退。
 * @param value 选中 id 列表。
 */
function handleBasicFunctionOntologyIdsChange(value: string | number | boolean | unknown[] | undefined): void {
  const candidateIds = Array.isArray(value) ? value.map((item) => String(item ?? "")).filter((id) => id && !id.startsWith("cat:")) : [];
  const resolved = resolveSameCategoryOntologySelection(basicFunctionOntologyIds.value, candidateIds, objectOptions.value);
  basicFunctionOntologyIds.value = resolved.nextIds;
  if (resolved.error) ElMessage.warning(resolved.error);
  syncBasicFunctionSelectFieldsByOntologySelection();
}

/**
 * @description 切换行为类型；离开属性值时清空对象信息，进入/离开关系实例时同步关系列表。
 * @param value 行为类型。
 */
function handleValueTypeChange(value: string | number | boolean | undefined): void {
  if (value !== "attributeValue" && value !== "relationInstance" && value !== "basicFunctionOperator") return;
  valueType.value = value;
  if (value !== "attributeValue" && value !== "basicFunctionOperator") clearObjectInfoSelection();
  if (value === "attributeValue") clearSelectedOperator();
  if (value === "relationInstance") {
    clearSelectedOperator();
    clearObjectInfoSelection();
    selectedRelationId.value = "";
    void loadRelationRows();
    return;
  }
  clearRelationSelection();
  if (value === "basicFunctionOperator") {
    clearObjectInfoSelection();
    clearSelectedOperator();
    basicFunctionOntologyIds.value = [];
    basicFunctionSingleResultMode.value = "query";
    resetBasicFunctionParameterConfig();
    resetBasicFunctionAggFields();
    resetBasicFunctionSelectFields();
    clearBasicFunctionMultiWriteField();
    applyLockedBasicFunctionOntologyIds();
    return;
  }
  basicFunctionOntologyIds.value = [];
  basicFunctionSingleResultMode.value = "query";
  resetBasicFunctionParameterConfig();
  resetBasicFunctionAggFields();
  resetBasicFunctionSelectFields();
  clearBasicFunctionMultiWriteField();
  if (value === "attributeValue") {
    applyLockedOntologyIdentifier();
  }
}

/**
 * @description 切换基础操作；在新增/修改/删除间按规则重算属性勾选，不清空对象。
 * @param value 基础操作。
 */
function handleBasicActionChange(value: string | number | boolean | undefined): void {
  if (value !== "create" && value !== "update" && value !== "delete") return;
  basicAction.value = value;
  if (showRelationInstanceSection.value) {
    if (value === "delete") {
      clearRelationLinkMappingFields();
    } else if (selectedRelationId.value.trim()) {
      ensureDefaultVisibilityWindowRow();
      const allowed = listSpaceBehaviorRelationTargetStatusOptions(value).map((item) => item.value);
      if (relationTargetStatus.value && !allowed.includes(relationTargetStatus.value)) {
        relationTargetStatus.value = "";
      }
    }
    return;
  }
  if (!showAttributeValueObjectSection.value) {
    clearObjectInfoSelection();
    return;
  }
  reapplyAttributeSelectionForBasicAction();
}

/**
 * @description 拉取应用行为所选算子详情并展开入出参行。
 * @param functionApi 函数 api。
 * @param version 函数版本。
 */
async function loadApplicationOperatorDetail(functionApi: string, version: string): Promise<void> {
  const requestToken = ++applicationDetailToken;
  applicationDetailLoading.value = true;
  applicationDetailError.value = "";
  applicationInputRows.value = [];
  applicationOutputRows.value = [];
  try {
    const response = await getOntologyFunctionDetailInterface({ functionApi, version, spaceId: props.spaceId.trim() });
    if (requestToken !== applicationDetailToken) return;
    if (response.code !== 200 || !response.data) throw new Error(response.message || "函数详情加载失败");
    const params = response.data.params ?? [];
    const inputRows = flattenApplicationFunctionInputRows(params);
    const outputRows = flattenApplicationFunctionOutputRows(params);
    applicationInputRows.value = inputRows;
    applicationOutputRows.value = outputRows;
    syncApplicationInputBindings(inputRows);
    syncApplicationOutputBindings(outputRows);
  } catch (error) {
    if (requestToken !== applicationDetailToken) return;
    applicationInputRows.value = [];
    applicationOutputRows.value = [];
    applicationInputBindings.value = {};
    applicationOutputBindings.value = {};
    applicationDetailError.value = error instanceof Error ? error.message : "函数详情加载失败";
  } finally {
    if (requestToken === applicationDetailToken) applicationDetailLoading.value = false;
  }
}

/**
 * @description 选择关联函数算子（应用行为）并加载入出参。
 * @param value 函数算子 id。
 */
function handleOperatorChange(value: string | number | boolean | undefined): void {
  if (typeof value !== "string" || !value.trim()) {
    clearSelectedOperator();
    return;
  }
  applySelectedOperator(value);
  clearApplicationOperatorDetail();
  if (!functionOperatorId.value || !functionOperatorVersion.value) return;
  void loadApplicationOperatorDetail(functionOperatorId.value, functionOperatorVersion.value);
}

/**
 * @description 选择对象并重载属性表。
 * @param value 对象 uniqueIdentifier。
 */
function handleOntologyChange(value: string | number | boolean | undefined): void {
  const nextId = typeof value === "string" ? value.trim() : "";
  ontologyIdentifier.value = nextId;
  selectedPropertyIds.value = [];
  selectedPropertyValues.value = {};
  storageGroup.value = "";
  attributeRows.value = [];
  attributeError.value = "";
  if (!nextId) return;
  void loadAttributeRows(nextId);
}

/**
 * @description 按当前基础操作判断属性行是否可勾选。
 * @param row 属性行。
 * @returns 可勾选时为 true。
 */
function isAttributeRowSelectable(row: OntologyPropertyInfo): boolean {
  return isAttributeValueRowSelectable(basicAction.value, row, readonly.value);
}

/**
 * @description 将决议后的属性勾选同步到表格与草稿字段。
 * @param selectedRows 决议后的属性行。
 * @param nextStorageGroup 决议后的存储分组。
 * @param warning 可选警告文案。
 */
function applyResolvedAttributeSelection(selectedRows: OntologyPropertyInfo[], nextStorageGroup: string, warning = ""): void {
  selectedPropertyIds.value = selectedRows.map((row) => readPropertyRowId(row)).filter(Boolean);
  storageGroup.value = nextStorageGroup;
  if (warning) ElMessage.warning(warning);
  syncingAttributeSelection = true;
  void nextTick(() => {
    const table = attributeTableRef.value;
    if (!table) {
      syncingAttributeSelection = false;
      return;
    }
    table.clearSelection();
    const selectedIdSet = new Set(selectedPropertyIds.value);
    for (const row of attributeRows.value) {
      if (selectedIdSet.has(readPropertyRowId(row))) {
        table.toggleRowSelection(row, true);
      }
    }
    void nextTick(() => {
      syncingAttributeSelection = false;
    });
  });
}

/**
 * @description 切换基础操作后，按新规则重算当前属性勾选。
 */
function reapplyAttributeSelectionForBasicAction(): void {
  if (!selectedPropertyIds.value.length) {
    storageGroup.value = "";
    return;
  }
  if ((basicAction.value === "create" || basicAction.value === "delete") && isMainStorageGroup(storageGroup.value)) {
    applyResolvedAttributeSelection([], "", basicAction.value === "create" ? "新增不可选择 main 分组属性" : "删除不可选择 main 分组属性");
    return;
  }
  const selectedRows = attributeRows.value.filter((row) => selectedPropertyIds.value.includes(readPropertyRowId(row)));
  const resolved = resolveAttributeValueSelection({
    basicAction: basicAction.value,
    previousIds: [],
    selection: selectedRows,
    allRows: attributeRows.value,
  });
  applyResolvedAttributeSelection(resolved.selectedRows, resolved.storageGroup, resolved.warning);
}

/**
 * @description 同步表格勾选到 selectedPropertyIds，并按基础操作规则限制同组/全选/禁 main。
 * @param selection 当前勾选行。
 */
function handleAttributeSelectionChange(selection: OntologyPropertyInfo[]): void {
  if (syncingAttributeSelection) return;
  const resolved = resolveAttributeValueSelection({
    basicAction: basicAction.value,
    previousIds: selectedPropertyIds.value,
    selection,
    allRows: attributeRows.value,
  });
  const nextIds = resolved.selectedRows.map((row) => readPropertyRowId(row));
  const sameIds = nextIds.length === selectedPropertyIds.value.length && nextIds.every((id, index) => id === selectedPropertyIds.value[index]);
  if (sameIds && normalizeStorageGroup(resolved.storageGroup) === normalizeStorageGroup(storageGroup.value) && !resolved.warning) {
    return;
  }
  applyResolvedAttributeSelection(resolved.selectedRows, resolved.storageGroup, resolved.warning);
}

const behaviorTreeOrchestrationVisible = ref(false);
const behaviorTreeActionPersisted = ref(false);
const behaviorTreeOrchestrationMeta = ref<BehaviorTreeOrchestrationMeta>({
  spaceId: "",
  categoryId: "",
  actionApi: "",
  displayName: "",
  description: "",
  isEditMode: false,
});

/**
 * @description 校验基础字段后打开行为树编排全屏弹框。
 */
function openBehaviorTreeOrchestration(): void {
  if (readonly.value) return;
  if (!displayName.value.trim() || !behaviorApiName.value.trim() || !categoryId.value) {
    ElMessage.warning("请完整填写行为名称、行为api名称和行为分类");
    return;
  }
  if (!props.spaceId.trim()) {
    ElMessage.warning("空间标识无效，无法打开行为树编排");
    return;
  }
  behaviorTreeOrchestrationMeta.value = {
    spaceId: props.spaceId.trim(),
    categoryId: categoryId.value.trim(),
    actionApi: behaviorApiName.value.trim(),
    displayName: displayName.value.trim(),
    description: description.value.trim(),
    isEditMode: props.mode === "edit" || behaviorTreeActionPersisted.value,
  };
  behaviorTreeOrchestrationVisible.value = true;
}

/**
 * @description 行为树保存成功后同步为更新态，并通知工作区刷新列表。
 * @param mode 创建或更新。
 */
function handleBehaviorTreePersisted(mode: BehaviorTreePersistMode): void {
  behaviorTreeActionPersisted.value = true;
  behaviorTreeOrchestrationMeta.value = {
    ...behaviorTreeOrchestrationMeta.value,
    isEditMode: true,
  };
  emit("tree-persisted", mode);
}

/**
 * @description 将应用行为参数表行压缩为草稿快照。
 * @param rows 表格行。
 * @returns 草稿快照列表。
 */
function snapshotApplicationParamRows(rows: ApplicationFunctionParamRow[]): SpaceBehaviorApplicationParamRowSnapshot[] {
  return rows.map((row) => ({
    rowKey: row.rowKey,
    functionParamId: row.functionParamId,
    paramName: row.paramName,
    paramPath: row.paramPath,
    fullPath: row.fullPath,
    isObject: row.isObject,
  }));
}

/**
 * @description 组装当前表单草稿。
 * @param nextStatus 提交后的行为状态。
 * @returns 行为草稿。
 */
function buildBehaviorDraft(nextStatus: SpaceBehaviorStatus): SpaceBehaviorDraft {
  const isApplication = kind.value === "application";
  return {
    displayName: displayName.value.trim(),
    behaviorApiName: behaviorApiName.value.trim(),
    kind: kind.value,
    valueType: valueType.value,
    functionOperatorId: functionOperatorId.value,
    functionOperatorName: functionOperatorName.value.trim(),
    functionOperatorVersion: functionOperatorVersion.value.trim(),
    description: description.value.trim(),
    categoryId: categoryId.value,
    status: nextStatus,
    basicAction: basicAction.value,
    ontologyIdentifier: ontologyIdentifier.value.trim(),
    ontologyIdentifiers: showBasicFunctionOperatorSection.value ? [...basicFunctionOntologyIds.value] : [],
    basicFunctionAggFunc: showBasicFunctionOperatorSection.value ? basicFunctionAggFunc.value || "" : "",
    basicFunctionTargetField: showBasicFunctionOperatorSection.value ? (basicFunctionTargetField.value ?? "").trim() : "",
    basicFunctionSelectFields: showBasicFunctionOperatorSection.value ? [...(basicFunctionSelectFields.value ?? [])] : [],
    basicFunctionWriteFields: showBasicFunctionOperatorSection.value ? { ...basicFunctionWriteFields.value } : {},
    basicFunctionMultiWriteField: showBasicFunctionOperatorSection.value
      ? { ...basicFunctionMultiWriteField.value }
      : { ontologyUniqueIdentifier: "", propertyUniqueIdentifier: "", storageGroup: "" },
    basicFunctionParameterConfig: showBasicFunctionOperatorSection.value ? basicFunctionParameterConfig.value || "" : "",
    operatorParamBindings: {},
    operatorParamIds: {},
    selectedPropertyIds: [...selectedPropertyIds.value],
    selectedPropertyValues: buildSelectedPropertyValuesForDraft(),
    selectedPropertyApiNames: buildSelectedPropertyApiNamesForDraft(),
    storageGroup: storageGroup.value,
    selectedRelationId: isApplication ? (showApplicationRelationSection.value ? selectedRelationId.value.trim() : "") : selectedRelationId.value.trim(),
    relationTargetStatus: showRelationLinkMappingSection.value ? relationTargetStatus.value : "",
    relationVisibilityWindows: showRelationLinkMappingSection.value ? buildRelationVisibilityWindowsForDraft() : [],
    applicationInputRows: isApplication ? snapshotApplicationParamRows(applicationInputRows.value) : [],
    applicationOutputRows: isApplication ? snapshotApplicationParamRows(applicationOutputRows.value) : [],
    applicationInputBindings: isApplication ? { ...applicationInputBindings.value } : {},
    applicationOutputBindings: isApplication ? { ...applicationOutputBindings.value } : {},
  };
}

/**
 * @description 将详情映射结果写入表单基础字段。
 * @param state 详情映射状态。
 */
function applyActionInfoBaseFields(state: SpaceBehaviorActionInfoFormState): void {
  kind.value = state.kind;
  valueType.value = state.valueType;
  displayName.value = state.displayName;
  behaviorApiName.value = state.behaviorApiName;
  description.value = state.description;
  categoryId.value = state.categoryId || ROOT_SPACE_BEHAVIOR_CATEGORY_ID;
  status.value = state.status;
  basicAction.value = state.basicAction;
  functionOperatorId.value = state.functionOperatorId;
  functionOperatorName.value = state.functionOperatorName;
  unsupportedEditReason.value = state.unsupportedEditReason;
}

/**
 * @description 按详情映射结果回填对象属性 / 关系 / 基础算子分区。
 * @param state 详情映射状态。
 */
async function hydrateActionInfoSections(state: SpaceBehaviorActionInfoFormState): Promise<void> {
  if (state.valueType === "attributeValue" && state.kind === "basic") {
    ontologyIdentifier.value = state.ontologyIdentifier;
    storageGroup.value = state.storageGroup;
    selectedPropertyIds.value = [...state.selectedPropertyIds];
    selectedPropertyValues.value = { ...state.selectedPropertyValues };
    if (!state.ontologyIdentifier) return;
    await loadAttributeRows(state.ontologyIdentifier);
    const selectedRows = attributeRows.value.filter((row) => selectedPropertyIds.value.includes(readPropertyRowId(row)));
    applyResolvedAttributeSelection(selectedRows, state.storageGroup);
    return;
  }
  if (state.valueType === "relationInstance") {
    selectedRelationId.value = state.selectedRelationId;
    ontologyIdentifier.value = state.ontologyIdentifier;
    relationTargetStatus.value = state.relationTargetStatus;
    visibilityWindowRows.value = state.relationVisibilityWindows.map((item) => [item.startTime, item.endTime]);
    await loadRelationRows();
    return;
  }
  if (state.valueType === "basicFunctionOperator") {
    basicFunctionOntologyIds.value = [...state.ontologyIdentifiers];
    const matchedAgg = FUNCTION_OPERATOR_AGG_FUNC_OPTIONS.find((item) => item.value === state.basicFunctionAggFunc);
    basicFunctionAggFunc.value = matchedAgg ? matchedAgg.value : "";
    basicFunctionTargetField.value = state.basicFunctionTargetField;
    basicFunctionSelectFields.value = [...state.basicFunctionSelectFields];
    basicFunctionWriteFields.value = { ...(state.basicFunctionWriteFields ?? {}) };
    basicFunctionMultiWriteField.value = {
      ontologyUniqueIdentifier: state.basicFunctionMultiWriteField?.ontologyUniqueIdentifier?.trim() ?? "",
      propertyUniqueIdentifier: state.basicFunctionMultiWriteField?.propertyUniqueIdentifier?.trim() ?? "",
    };
    basicFunctionParameterConfig.value = state.basicFunctionParameterConfig || stringifyBasicFilterConfig(createBlankBasicFilterDocument());
    if (basicFunctionOntologyIds.value.length === 1) {
      if (basicFunctionAggFunc.value) {
        basicFunctionSingleResultMode.value = "aggregate";
        basicFunctionSelectFields.value = [];
        clearBasicFunctionWriteFields();
        void loadBasicFunctionSelectFieldOptions(basicFunctionOntologyIds.value[0] ?? "");
        if (basicFunctionMultiWriteField.value.ontologyUniqueIdentifier) {
          void ensureBasicFunctionMainPropertyOptions(basicFunctionMultiWriteField.value.ontologyUniqueIdentifier);
        }
      } else {
        basicFunctionSingleResultMode.value = "query";
        resetBasicFunctionAggFields();
        clearBasicFunctionMultiWriteField();
        void loadBasicFunctionSelectFieldOptions(basicFunctionOntologyIds.value[0] ?? "");
        syncBasicFunctionWriteFieldsBySelectFields();
      }
    } else if (basicFunctionOntologyIds.value.length >= 1) {
      basicFunctionSingleResultMode.value = "aggregate";
      basicFunctionSelectFields.value = [];
      clearBasicFunctionWriteFields();
      void loadBasicFunctionSelectFieldOptions(basicFunctionOntologyIds.value[0] ?? "");
      if (basicFunctionMultiWriteField.value.ontologyUniqueIdentifier) {
        void ensureBasicFunctionMainPropertyOptions(basicFunctionMultiWriteField.value.ontologyUniqueIdentifier);
      }
    } else {
      basicFunctionSingleResultMode.value = "query";
      resetBasicFunctionSelectFields();
      clearBasicFunctionMultiWriteField();
    }
    return;
  }
  if (state.kind === "application") {
    selectedRelationId.value = state.selectedRelationId;
    if (!state.functionOperatorId) return;
    const matched = operatorCatalog.value.find((item) => item.id === state.functionOperatorId);
    if (matched) {
      functionOperatorVersion.value = matched.version;
      functionOperatorName.value = matched.name || state.functionOperatorName;
    }
    if (functionOperatorVersion.value) {
      await loadApplicationOperatorDetail(state.functionOperatorId, functionOperatorVersion.value);
    }
    if (!state.applicationBindingSeeds.length) return;
    const applied = applyApplicationActionInfoBindings(state.applicationBindingSeeds, applicationInputRows.value, applicationOutputRows.value);
    applicationInputBindings.value = {
      ...applicationInputBindings.value,
      ...applied.applicationInputBindings,
    };
    applicationOutputBindings.value = {
      ...applicationOutputBindings.value,
      ...applied.applicationOutputBindings,
    };
    const ontologyIds = new Set<string>();
    for (const binding of Object.values(applied.applicationInputBindings)) {
      const ontologyId = binding.ontologyUniqueIdentifier.trim();
      if (ontologyId) ontologyIds.add(ontologyId);
    }
    for (const binding of Object.values(applied.applicationOutputBindings)) {
      const ontologyId = binding.ontologyUniqueIdentifier.trim();
      if (ontologyId) ontologyIds.add(ontologyId);
    }
    await Promise.all([...ontologyIds].map((ontologyId) => ensureApplicationPropertyOptions(ontologyId)));
  }
}

/**
 * @description 编辑态拉取行为详情并回显；失败时保留列表行基础字段。
 */
async function loadActionInfoForEdit(): Promise<void> {
  const actionApi = (props.behavior?.behaviorApiName ?? behaviorApiName.value).trim();
  if (!actionApi) {
    detailError.value = "行为 api 名称无效，无法加载详情";
    return;
  }
  const ontologySpaceId = props.spaceId.trim();
  if (!ontologySpaceId) {
    detailError.value = "当前对象空间无效，无法加载详情";
    return;
  }
  const requestToken = ++detailLoadToken;
  detailLoading.value = true;
  detailError.value = "";
  unsupportedEditReason.value = "";
  try {
    const response = await getOntologyActionInfoInterface({ actionApi, ontologySpaceId });
    if (requestToken !== detailLoadToken) return;
    if (response.code !== 200 || !response.data) throw new Error(response.message || "行为详情加载失败");
    const state = mapOntologyActionInfoToFormState(response.data);
    clearObjectInfoSelection();
    clearRelationSelection();
    clearSelectedOperator();
    applyActionInfoBaseFields(state);
    if (state.kind === "application") {
      await loadOperatorCatalog();
      if (requestToken !== detailLoadToken) return;
      await loadRelationRows();
      if (requestToken !== detailLoadToken) return;
    }
    await hydrateActionInfoSections(state);
  } catch (error) {
    if (requestToken !== detailLoadToken) return;
    detailError.value = error instanceof Error ? error.message : "行为详情加载失败";
  } finally {
    if (requestToken === detailLoadToken) detailLoading.value = false;
  }
}

/**
 * @description 按类别校验后提交保存。
 * @param action 保存动作。
 */
function submitBehaviorForm(action: "save" | "copy"): void {
  if (readonly.value || kind.value === "behaviorTree") return;
  if (action !== "save") return;
  if (detailLoading.value) {
    ElMessage.warning("行为详情加载中，请稍候");
    return;
  }
  if (detailError.value) {
    ElMessage.warning(detailError.value);
    return;
  }
  if (unsupportedEditReason.value && props.mode === "edit") {
    ElMessage.warning(unsupportedEditReason.value);
    return;
  }
  if (!displayName.value.trim() || !behaviorApiName.value.trim() || !categoryId.value) {
    ElMessage.warning("请完整填写行为名称、行为api名称和行为分类");
    return;
  }
  if (kind.value === "basic" && !valueType.value) {
    ElMessage.warning("请选择行为类型");
    return;
  }
  if (showBasicFunctionOperatorSection.value) {
    if (!basicFunctionOntologyIds.value.length) {
      ElMessage.warning("请选择对象");
      return;
    }
    if (showBasicFunctionSelectFields.value) {
      if (!basicFunctionSelectFields.value.length) {
        ElMessage.warning("请选择展示字段");
        return;
      }
    }
    if (showBasicFunctionAggregateFields.value) {
      if (!basicFunctionAggFunc.value) {
        ElMessage.warning(basicFunctionOntologyIds.value.length > 1 ? "多对象时请选择聚合类型" : "请选择聚合类型");
        return;
      }
      if (!basicFunctionTargetField.value.trim()) {
        ElMessage.warning("请选择聚合参数名");
        return;
      }
    }
    const filterError = validateBasicFilterDocument(parseBasicFilterConfig(basicFunctionParameterConfig.value));
    if (filterError) {
      ElMessage.warning(filterError);
      return;
    }
  } else if (kind.value === "basic" && !basicAction.value) {
    ElMessage.warning("请完整填写行为类型和基础操作");
    return;
  }
  if (showAttributeValueObjectSection.value) {
    if (!ontologyIdentifier.value.trim()) {
      ElMessage.warning("请选择对象");
      return;
    }
    if (selectedPropertyIds.value.length === 0) {
      ElMessage.warning("请至少选择一项属性");
      return;
    }
    if (
      (basicAction.value === "create" || basicAction.value === "delete") &&
      (isMainStorageGroup(storageGroup.value) ||
        selectedPropertyIds.value.length !== listPropertyRowsByStorageGroup(attributeRows.value, storageGroup.value).length)
    ) {
      ElMessage.warning(basicAction.value === "create" ? "新增须全选同一非 main 存储分组属性" : "删除须全选同一非 main 存储分组属性");
      return;
    }
  }
  if (showRelationInstanceSection.value && !selectedRelationId.value.trim()) {
    ElMessage.warning("请选择一条关系");
    return;
  }
  if (showRelationLinkMappingSection.value) {
    if (!relationTargetStatus.value) {
      ElMessage.warning("请选择状态");
      return;
    }
    if (basicAction.value === "create" && buildRelationVisibilityWindowsForDraft().length === 0) {
      ElMessage.warning("请至少添加一条持续时段");
      return;
    }
  }
  if (kind.value === "application") {
    if (!functionOperatorId.value) {
      ElMessage.warning("请选择关联函数算子");
      return;
    }
    if (applicationDetailLoading.value) {
      ElMessage.warning("正在加载函数详情，请稍后再试");
      return;
    }
    if (applicationDetailError.value) {
      ElMessage.warning(applicationDetailError.value);
      return;
    }
  }
  submitLoading.value = true;
  const nextStatus = props.mode === "create" ? "draft" : status.value;
  const draft = buildBehaviorDraft(nextStatus);
  if (kind.value === "application") {
    const params = buildApplicationCreateActionParams(draft);
    if ("error" in params) {
      submitLoading.value = false;
      ElMessage.warning(params.error);
      return;
    }
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
      excludeTypes: "BASIC_QUERY",
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
 * @description 加载当前空间可选对象列表。
 */
async function loadObjectOptions(): Promise<void> {
  const requestToken = ++objectLoadToken;
  objectLoading.value = true;
  objectError.value = "";
  try {
    const spaceId = props.spaceId.trim();
    if (!spaceId) throw new Error("当前对象空间无效");
    const response = await getOntologyCategoryTreeInterface({ spaceId });
    if (requestToken !== objectLoadToken) return;
    if (response.code !== 200 || !response.data) throw new Error(response.message || "对象列表加载失败");
    objectOptions.value = mapOntologyObjectsToCategoryOptions(response.data);
    objectSelectTree.value = mapOntologyCategoryTreeToSelectNodes(response.data);
  } catch (error) {
    if (requestToken !== objectLoadToken) return;
    objectOptions.value = [];
    objectSelectTree.value = [];
    objectError.value = error instanceof Error ? error.message : "对象列表加载失败";
  } finally {
    if (requestToken === objectLoadToken) objectLoading.value = false;
  }
}

/**
 * @description 按对象标识加载属性分类树并扁平化为可选属性行。
 * @param ontologyUniqueIdentifier 对象唯一标识。
 */
async function loadAttributeRows(ontologyUniqueIdentifier: string): Promise<void> {
  const requestToken = ++attributeLoadToken;
  attributeLoading.value = true;
  attributeError.value = "";
  try {
    const response = await getOntologyObjectArrTypeTreeInterface({ ontologyUniqueIdentifier });
    if (requestToken !== attributeLoadToken) return;
    if (response.code !== 200) throw new Error(response.message || "属性列表加载失败");
    attributeRows.value = sortPropertyInfosByStorageGroup(flattenPropertyInfosFromCategoryTree(response.data));
  } catch (error) {
    if (requestToken !== attributeLoadToken) return;
    attributeRows.value = [];
    attributeError.value = error instanceof Error ? error.message : "属性列表加载失败";
  } finally {
    if (requestToken === attributeLoadToken) attributeLoading.value = false;
  }
}

/**
 * @description 按当前空间分页加载关系列表，支持按关系名称搜索。
 */
async function loadRelationRows(): Promise<void> {
  const requestToken = ++relationLoadToken;
  relationLoading.value = true;
  relationError.value = "";
  try {
    const spaceIdText = props.spaceId.trim();
    const spaceId = Number(spaceIdText);
    if (!spaceIdText || !Number.isFinite(spaceId)) throw new Error("当前对象空间无效");
    const relationName = relationSearchKeyword.value.trim();
    const response = await getOntologyLinkListInterface({
      spaceId,
      ...(relationName ? { relationName } : {}),
      pageNum: relationPageNum.value,
      pageSize: 10,
    });
    if (requestToken !== relationLoadToken) return;
    if (response.code !== 200) throw new Error(response.message || "关系列表加载失败");
    if (!response.data) {
      relationRows.value = [];
      relationTotal.value = 0;
      return;
    }
    relationRows.value = mapOntologyLinkListToRelationClass(response.data.records ?? []);
    relationTotal.value = typeof response.data.total === "number" ? response.data.total : 0;
  } catch (error) {
    if (requestToken !== relationLoadToken) return;
    relationRows.value = [];
    relationTotal.value = 0;
    relationError.value = error instanceof Error ? error.message : "关系列表加载失败";
  } finally {
    if (requestToken === relationLoadToken) relationLoading.value = false;
  }
}

/**
 * @description 将函数列表 type 转为下拉展示用中文标签。
 * @param apiType 列表接口原始 type。
 * @returns 类型中文标签。
 */
function resolveOperatorTypeLabel(apiType: string): string {
  return FUNCTION_OPERATOR_TYPE_LABELS[mapFunctionOperatorTypeFromApi(apiType)] || apiType.trim() || "未知类型";
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
    description: (item.description ?? "").trim(),
    type: (item.type ?? "").trim(),
    basicAction: basicAction.value,
    objectName: item.displayName,
    inputParameters: [],
    outputParameters: [],
  };
}

watch(showApplicationRelationSection, (visible) => {
  if (!visible) clearApplicationRelationSelection();
});

watch(
  () => props.modelValue,
  (visible) => {
    if (!visible) {
      detailLoadToken += 1;
      detailLoading.value = false;
      detailError.value = "";
      unsupportedEditReason.value = "";
      behaviorTreeActionPersisted.value = false;
      behaviorTreeOrchestrationVisible.value = false;
      clearApplicationPropertyOptionCache();
      return;
    }
    behaviorTreeActionPersisted.value = props.mode === "edit";
    void loadObjectOptions();
    submitLoading.value = false;
    clearObjectInfoSelection();
    clearRelationSelection();
    basicFunctionOntologyIds.value = [];
    basicFunctionSingleResultMode.value = "query";
    resetBasicFunctionParameterConfig();
    resetBasicFunctionAggFields();
    resetBasicFunctionSelectFields();
    clearBasicFunctionMultiWriteField();
    detailError.value = "";
    unsupportedEditReason.value = "";
    if (props.behavior) {
      kind.value = props.behavior.kind;
      valueType.value = props.behavior.valueType;
      displayName.value = props.behavior.displayName;
      behaviorApiName.value = props.behavior.behaviorApiName;
      functionOperatorId.value = props.behavior.functionOperatorId;
      functionOperatorName.value = props.behavior.functionOperatorName;
      functionOperatorVersion.value = props.behavior.functionOperatorVersion;
      description.value = props.behavior.description;
      categoryId.value = props.behavior.categoryId;
      status.value = props.behavior.status;
      basicAction.value = props.behavior.basicAction || "create";
      clearApplicationRelationSelection();
      if (kind.value === "basic" && valueType.value === "basicFunctionOperator") {
        applyLockedBasicFunctionOntologyIds();
      }
      if (kind.value === "application") {
        void loadOperatorCatalog();
        void loadRelationRows();
      }
      if (props.mode === "edit") {
        void loadActionInfoForEdit();
      }
      return;
    }
    kind.value = "basic";
    valueType.value = "attributeValue";
    displayName.value = "";
    behaviorApiName.value = "";
    description.value = "";
    categoryId.value = props.defaultCategoryId || ROOT_SPACE_BEHAVIOR_CATEGORY_ID;
    status.value = "draft";
    basicAction.value = "create";
    clearSelectedOperator();
    applyLockedOntologyIdentifier();
  },
);

defineExpose({
  /**
   * @description 同步弹窗确认按钮的 loading 状态。
   * @param value 是否处于提交中
   */
  setLoading(value: boolean) {
    submitLoading.value = value;
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

.behavior-form-dialog__basic-function-objects,
.behavior-form-dialog__basic-function-select-fields {
  :deep(.el-select__wrapper) {
    min-height: var(--aircas-size-control);
    max-height: 96px;
    overflow-y: auto;
    align-items: center;
  }

  :deep(.el-select__selection) {
    flex-wrap: wrap;
  }
}

.behavior-form-dialog__basic-function-write-fields {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 0 0 12px;
  width: 100%;
}

.behavior-form-dialog__basic-function-write-field {
  display: grid;
  grid-template-columns: minmax(100px, 0.9fr) minmax(0, 1fr) minmax(0, 1fr);
  gap: 8px 12px;
  align-items: center;
  min-width: 0;
  width: 100%;
}

.behavior-form-dialog__basic-function-write-field--multi {
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
}

.behavior-form-dialog__basic-function-write-field .behavior-form-dialog__object-property-pickers {
  display: contents;
}

.behavior-form-dialog__basic-function-write-field-title {
  min-width: 0;
  overflow: hidden;
  color: var(--aircas-color-text-primary);
  font-size: 13px;
  font-weight: 600;
  line-height: 1.4;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.behavior-form-dialog__section h3,
.behavior-form-dialog__object-section h3 {
  margin: 0 0 12px;
  color: var(--aircas-color-text-primary);
  font-size: 14px;
  font-weight: 600;
}

.behavior-form-dialog__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  align-items: start;
}

.behavior-form-dialog__object-section {
  margin-top: 4px;
}

.behavior-form-dialog__attribute-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 4px 0 8px;
}

.behavior-form-dialog__attribute-title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--aircas-color-text-primary);
  font-size: 13px;
  font-weight: 600;
}

.behavior-form-dialog__attribute-hint {
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
}

.behavior-form-dialog__attribute-table {
  width: 100%;
}

.behavior-form-dialog__link-mapping {
  margin-top: 16px;
}

.behavior-form-dialog__param-state {
  margin: 0 0 12px;
  color: var(--aircas-color-text-secondary);
  font-size: 13px;
}

.behavior-form-dialog__param-name {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.behavior-form-dialog__param-path {
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
}

.behavior-form-dialog__operator-option {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  width: 100%;
  line-height: 1.4;
}

.behavior-form-dialog__operator-option-title {
  display: block;
  color: var(--aircas-color-text-primary);
  font-size: 13px;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.behavior-form-dialog__operator-option-meta {
  display: block;
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.behavior-form-dialog__external-default {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.behavior-form-dialog__object-property-pickers {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.behavior-form-dialog__output-target-hint {
  margin: 0;
  color: var(--aircas-color-text-secondary);
  font-size: 13px;
  line-height: 1.5;
}

.behavior-form-dialog__relation-mapping {
  color: var(--aircas-color-text-secondary);
}

.behavior-form-dialog__relation-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 8px;
}

.behavior-form-dialog__relation-search {
  width: 240px;
  max-width: 100%;
  flex: 0 0 auto;
}

.behavior-form-dialog__relation-pagination {
  margin-top: 12px;
  justify-content: flex-end;
}

.behavior-form-dialog__visibility-windows {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.behavior-form-dialog__visibility-row {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.behavior-form-dialog__visibility-picker {
  flex: 1;
  min-width: 0;
}

@media (max-width: 900px) {
  .behavior-form-dialog__grid {
    grid-template-columns: 1fr;
  }

  .behavior-form-dialog__basic-function-write-field {
    grid-template-columns: 1fr;
    align-items: stretch;
  }

  .behavior-form-dialog__attribute-head {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>

<!-- 下拉挂载到 body，需非 scoped 才能放开固定行高。 -->
<style lang="scss">
.behavior-form-dialog__operator-popper .el-select-dropdown__item {
  height: auto;
  min-height: var(--aircas-size-control);
  padding-top: 8px;
  padding-bottom: 8px;
  line-height: normal;
}
</style>
