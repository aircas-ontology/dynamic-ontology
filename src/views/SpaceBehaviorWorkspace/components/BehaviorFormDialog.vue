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
    <el-alert v-if="readonly" title="已失效行为为只读" type="warning" show-icon :closable="false" />

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
          <div class="behavior-form-dialog__grid">
            <el-form-item label="类别" required>
              <el-select v-model="kind" placeholder="选择类别" style="width: 100%" @change="handleKindChange">
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
            <el-form-item v-else label="函数基础算子" required>
              <el-select
                :model-value="functionOperatorId"
                filterable
                :loading="operatorLoading"
                :disabled="operatorLoading || operatorError !== ''"
                :placeholder="operatorLoading ? '正在加载基础函数' : operatorError || (operatorCatalog.length ? '选择基础函数算子' : '当前空间暂无基础函数')"
                style="width: 100%"
                @change="handleBasicFunctionOperatorChange"
              >
                <el-option v-for="item in operatorCatalog" :key="item.id" :label="`${item.name} · ${item.version}`" :value="item.id" />
              </el-select>
            </el-form-item>
          </div>

          <section v-if="showAttributeValueObjectSection" class="behavior-form-dialog__object-section">
            <h3>对象信息</h3>
            <el-form-item label="对象" required>
              <el-select
                :model-value="ontologyIdentifier"
                filterable
                clearable
                :loading="objectLoading"
                :disabled="objectLoading || objectError !== ''"
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
                <el-tag size="small" effect="plain">{{ relationRows.length }}项</el-tag>
              </div>
              <span class="behavior-form-dialog__attribute-hint">从当前空间关系中单选一条</span>
            </div>
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

          <section v-else-if="showBasicFunctionOperatorSection && functionOperatorId" class="behavior-form-dialog__object-section">
            <h3>参数配置</h3>
            <p v-if="operatorDetailLoading" class="behavior-form-dialog__param-state" role="status">正在加载函数详情…</p>
            <p v-else-if="operatorDetailError" class="behavior-form-dialog__param-state" role="alert">{{ operatorDetailError }}</p>
            <template v-else>
              <el-form-item label="选择对象" required>
                <el-select
                  :model-value="ontologyIdentifier"
                  filterable
                  clearable
                  :loading="objectLoading"
                  :disabled="objectLoading || objectError !== ''"
                  :placeholder="objectLoading ? '正在加载对象' : objectError || (objectOptions.length ? '选择对象' : '当前空间暂无对象')"
                  style="width: 100%"
                  @change="handleOperatorOntologyChange"
                >
                  <el-option v-for="item in objectOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>
              <el-form-item v-for="bindingKey in operatorBindingKeys" :key="bindingKey" :label="`参数 ${bindingKey}`" required>
                <el-select
                  :model-value="operatorParamBindings[bindingKey] ?? ''"
                  filterable
                  clearable
                  :disabled="!ontologyIdentifier || operatorPropertyLoading"
                  :loading="operatorPropertyLoading"
                  :placeholder="
                    !ontologyIdentifier ? '请先选择对象' : operatorPropertyError || (operatorPropertyOptions.length ? '请选择对象属性' : '当前对象暂无属性')
                  "
                  style="width: 100%"
                  @change="updateOperatorParamBinding(bindingKey, $event)"
                >
                  <el-option
                    v-for="item in operatorPropertyOptions"
                    :key="`${bindingKey}-${item.value}`"
                    :label="`${item.label}（${item.value}）`"
                    :value="item.value"
                  />
                </el-select>
              </el-form-item>
            </template>
          </section>

          <template v-else-if="kind === 'application'">
            <el-form-item label="关联函数算子" required>
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
                            :disabled="objectLoading || objectError !== ''"
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
                            :disabled="objectLoading || objectError !== ''"
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
                  <el-tag size="small" effect="plain">{{ relationRows.length }}项</el-tag>
                </div>
                <span class="behavior-form-dialog__attribute-hint">可选；从当前空间关系中单选一条，可再次点击取消</span>
              </div>
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
            </section>
          </template>
        </template>
      </section>
    </el-form>

    <template #footer>
      <el-button @click="emit('update:modelValue', false)">{{ readonly ? "关闭" : "取消" }}</el-button>
      <el-button
        v-if="!readonly && kind !== 'behaviorTree'"
        :loading="submitLoading || detailLoading"
        :disabled="detailLoading || Boolean(detailError) || Boolean(unsupportedEditReason)"
        @click="submitBehaviorForm('save')"
      >
        保存行为
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import { ElMessage, type TableInstance } from "element-plus";
import {
  getOntologyActionInfoInterface,
  getOntologyCategoryTreeInterface,
  getOntologyFunctionDetailInterface,
  getOntologyFunctionListInterface,
  getOntologyObjectArrTypeTreeInterface,
  getOntologyPropertyByOntologyIdInterface,
  getOntologyRelationCategoryTreeInterface,
} from "@/apis";
import type {
  GetOntologyFunctionListItem,
  OntologyPropertyInfo,
  OntologyRelationClass,
  SpaceBehaviorApplicationInputBinding,
  SpaceBehaviorApplicationInputSourceType,
  SpaceBehaviorApplicationOutputBinding,
  SpaceBehaviorApplicationOutputMode,
  SpaceBehaviorApplicationParamRowSnapshot,
  SpaceBehaviorBasicAction,
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
  SPACE_BEHAVIOR_BASIC_ACTION_OPTIONS,
  SPACE_BEHAVIOR_KIND_OPTIONS,
  SPACE_BEHAVIOR_VALUE_TYPE_OPTIONS,
  listSpaceBehaviorRelationTargetStatusOptions,
} from "@/types";
import { buildOntologyFunctionTestBindingKeys, buildOntologyFunctionTestBindingParamIds } from "@/utils/mapOntologyFunctionTest";
import { mapOntologyObjectsToRelationOptions } from "@/utils/mapOntologyObjectsToRelationOptions";
import { mapOntologyRelationLinks } from "@/views/SpaceRelationWorkspace/utils/mapOntologyRelationCategoryTree";
import { applyApplicationActionInfoBindings } from "../utils/applyApplicationActionInfoBindings.ts";
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

/** 分类选择器仅展示分类节点，不展示行为叶子。 */
const categorySelectTree = computed(() => omitActionLeavesFromCategoryTree(props.categoryTree));

const operatorCatalog = ref<SpaceBehaviorOperatorOption[]>([]);
const operatorLoading = ref(false);
const operatorError = ref("");
let operatorLoadToken = 0;
const objectOptions = ref<SpaceRelationObjectOption[]>([]);
const objectLoading = ref(false);
const objectError = ref("");
let objectLoadToken = 0;
const attributeRows = ref<OntologyPropertyInfo[]>([]);
const attributeLoading = ref(false);
const attributeError = ref("");
let attributeLoadToken = 0;
const attributeTableRef = ref<TableInstance>();
let syncingAttributeSelection = false;
const relationRows = ref<OntologyRelationClass[]>([]);
const relationLoading = ref(false);
const relationError = ref("");
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
const operatorBindingKeys = ref<string[]>([]);
const operatorParamBindings = ref<Record<string, string>>({});
const operatorParamIds = ref<Record<string, number>>({});
const operatorDetailLoading = ref(false);
const operatorDetailError = ref("");
let operatorDetailToken = 0;
const operatorPropertyOptions = ref<SpaceRelationObjectOption[]>([]);
const operatorPropertyLoading = ref(false);
const operatorPropertyError = ref("");
let operatorPropertyToken = 0;
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
  return {
    sourceType: "PROPERTY",
    ontologyUniqueIdentifier: "",
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
  const next: Record<string, SpaceBehaviorApplicationInputBinding> = {};
  for (const row of rows) {
    if (row.isObject) continue;
    next[row.rowKey] = applicationInputBindings.value[row.rowKey] ?? createDefaultApplicationInputBinding();
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
  patchApplicationInputBinding(rowKey, {
    sourceType,
    ontologyUniqueIdentifier: "",
    propertyUniqueIdentifier: "",
    fixedValue: "",
    enableDefaultValue: false,
    defaultValue: "",
  });
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
  patchApplicationOutputBinding(rowKey, {
    outputMode,
    ontologyUniqueIdentifier: "",
    propertyUniqueIdentifier: "",
  });
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
const applicationPropertyLoadingByOntology = ref<Record<string, boolean>>({});
const applicationPropertyErrorByOntology = ref<Record<string, string>>({});
const applicationPropertyLoadTokens: Record<string, number> = {};

/**
 * @description 清空应用行为属性选项缓存。
 */
function clearApplicationPropertyOptionCache(): void {
  applicationPropertyOptionsByOntology.value = {};
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
    }
    applicationPropertyOptionsByOntology.value = {
      ...applicationPropertyOptionsByOntology.value,
      [ontologyId]: [...options.values()].sort((left, right) => left.label.localeCompare(right.label, "zh-CN") || left.value.localeCompare(right.value)),
    };
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
const dialogTitle = computed(() => (props.mode === "edit" ? "编辑行为" : "创建行为"));
const readonly = computed(() => props.mode === "edit" && props.behavior?.status === "disabled");
const showAttributeValueObjectSection = computed(() => kind.value === "basic" && valueType.value === "attributeValue");
const showRelationInstanceSection = computed(() => kind.value === "basic" && valueType.value === "relationInstance");
const showBasicFunctionOperatorSection = computed(() => kind.value === "basic" && valueType.value === "basicFunctionOperator");
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
  relationError.value = "";
  relationLoadToken += 1;
  relationLoading.value = false;
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
  operatorBindingKeys.value = [];
  operatorParamBindings.value = {};
  operatorParamIds.value = {};
  operatorDetailError.value = "";
  operatorDetailToken += 1;
  operatorDetailLoading.value = false;
  operatorPropertyOptions.value = [];
  operatorPropertyError.value = "";
  operatorPropertyToken += 1;
  operatorPropertyLoading.value = false;
  clearApplicationOperatorDetail();
}

/**
 * @description 按绑定键重置参数绑定为空。
 * @param keys 参数绑定键。
 */
function resetOperatorParamBindings(keys: string[]): void {
  const next: Record<string, string> = {};
  for (const key of keys) next[key] = "";
  operatorParamBindings.value = next;
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
 * @description 拉取基础函数详情并生成参数绑定键。
 * @param functionApi 函数 api。
 * @param version 函数版本。
 */
async function loadOperatorDetailBindings(functionApi: string, version: string): Promise<void> {
  const requestToken = ++operatorDetailToken;
  operatorDetailLoading.value = true;
  operatorDetailError.value = "";
  operatorBindingKeys.value = [];
  operatorParamBindings.value = {};
  operatorParamIds.value = {};
  try {
    const response = await getOntologyFunctionDetailInterface({ functionApi, version, spaceId: props.spaceId.trim() });
    if (requestToken !== operatorDetailToken) return;
    if (response.code !== 200 || !response.data) throw new Error(response.message || "函数详情加载失败");
    const params = response.data.params ?? [];
    const keys = buildOntologyFunctionTestBindingKeys(params);
    operatorBindingKeys.value = keys;
    operatorParamIds.value = buildOntologyFunctionTestBindingParamIds(params);
    resetOperatorParamBindings(keys);
  } catch (error) {
    if (requestToken !== operatorDetailToken) return;
    operatorBindingKeys.value = [];
    operatorParamBindings.value = {};
    operatorParamIds.value = {};
    operatorDetailError.value = error instanceof Error ? error.message : "函数详情加载失败";
  } finally {
    if (requestToken === operatorDetailToken) operatorDetailLoading.value = false;
  }
}

/**
 * @description 按对象加载可供参数绑定的属性 apiName 选项。
 * @param ontologyUniqueIdentifier 对象唯一标识。
 */
async function loadOperatorPropertyOptions(ontologyUniqueIdentifier: string): Promise<void> {
  const requestToken = ++operatorPropertyToken;
  operatorPropertyLoading.value = true;
  operatorPropertyError.value = "";
  try {
    const response = await getOntologyPropertyByOntologyIdInterface({ ontologyUniqueIdentifier });
    if (requestToken !== operatorPropertyToken) return;
    if (response.code !== 200 || !response.data) throw new Error(response.message || "属性列表加载失败");
    const options = new Map<string, SpaceRelationObjectOption>();
    for (const item of response.data) {
      const value = typeof item.apiName === "string" ? item.apiName.trim() : "";
      if (!value || options.has(value)) continue;
      const label = typeof item.displayName === "string" && item.displayName.trim() ? item.displayName.trim() : value;
      options.set(value, { value, label });
    }
    operatorPropertyOptions.value = [...options.values()].sort((a, b) => a.label.localeCompare(b.label, "zh-CN") || a.value.localeCompare(b.value));
  } catch (error) {
    if (requestToken !== operatorPropertyToken) return;
    operatorPropertyOptions.value = [];
    operatorPropertyError.value = error instanceof Error ? error.message : "属性列表加载失败";
  } finally {
    if (requestToken === operatorPropertyToken) operatorPropertyLoading.value = false;
  }
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
    void loadOperatorCatalog();
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
 * @description 选择基础函数算子并加载参数绑定键。
 * @param value 函数算子 id。
 */
function handleBasicFunctionOperatorChange(value: string | number | boolean | undefined): void {
  if (typeof value !== "string" || !value.trim()) {
    clearSelectedOperator();
    ontologyIdentifier.value = "";
    operatorPropertyOptions.value = [];
    return;
  }
  applySelectedOperator(value);
  ontologyIdentifier.value = "";
  operatorPropertyOptions.value = [];
  operatorPropertyError.value = "";
  void loadOperatorDetailBindings(functionOperatorId.value, functionOperatorVersion.value);
}

/**
 * @description 基础函数参数配置中选择对象并加载属性选项。
 * @param value 对象 uniqueIdentifier。
 */
function handleOperatorOntologyChange(value: string | number | boolean | undefined): void {
  const nextId = typeof value === "string" ? value.trim() : "";
  ontologyIdentifier.value = nextId;
  resetOperatorParamBindings(operatorBindingKeys.value);
  operatorPropertyOptions.value = [];
  operatorPropertyError.value = "";
  if (!nextId) return;
  void loadOperatorPropertyOptions(nextId);
}

/**
 * @description 更新基础函数单个参数的属性 apiName 绑定。
 * @param bindingKey 参数名。
 * @param value 属性 apiName。
 */
function updateOperatorParamBinding(bindingKey: string, value: string | number | boolean | undefined): void {
  const apiName = typeof value === "string" ? value.trim() : "";
  operatorParamBindings.value = {
    ...operatorParamBindings.value,
    [bindingKey]: apiName,
  };
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

/**
 * @description 行为树构建入口占位；后续接入真实构建流程。
 */
function openBehaviorTreeBuilder(): void {
  ElMessage.info("行为树构建后续接入");
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
    operatorParamBindings: showBasicFunctionOperatorSection.value ? { ...operatorParamBindings.value } : {},
    operatorParamIds: showBasicFunctionOperatorSection.value ? { ...operatorParamIds.value } : {},
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
    ontologyIdentifier.value = state.ontologyIdentifier;
    const savedBindings = { ...state.operatorParamBindings };
    const savedIds = { ...state.operatorParamIds };
    if (state.functionOperatorId) {
      const matched = operatorCatalog.value.find((item) => item.id === state.functionOperatorId);
      if (matched) {
        functionOperatorVersion.value = matched.version;
      }
      if (functionOperatorVersion.value) {
        await loadOperatorDetailBindings(state.functionOperatorId, functionOperatorVersion.value);
      } else {
        operatorBindingKeys.value = Object.keys(savedBindings);
        resetOperatorParamBindings(operatorBindingKeys.value);
        operatorParamIds.value = { ...savedIds };
      }
      operatorParamBindings.value = {
        ...operatorParamBindings.value,
        ...savedBindings,
      };
      operatorParamIds.value = {
        ...savedIds,
        ...operatorParamIds.value,
      };
    }
    if (state.ontologyIdentifier) {
      await loadOperatorPropertyOptions(state.ontologyIdentifier);
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
    if (state.valueType === "basicFunctionOperator" || state.kind === "application") {
      await loadOperatorCatalog();
      if (requestToken !== detailLoadToken) return;
    }
    if (state.kind === "application") {
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
  if (kind.value === "basic" && valueType.value !== "basicFunctionOperator" && !basicAction.value) {
    ElMessage.warning("请完整填写行为类型和基础操作");
    return;
  }
  if (showBasicFunctionOperatorSection.value) {
    if (!functionOperatorId.value) {
      ElMessage.warning("请选择函数基础算子");
      return;
    }
    if (operatorDetailLoading.value) {
      ElMessage.warning("函数详情加载中，请稍候");
      return;
    }
    if (operatorDetailError.value) {
      ElMessage.warning(operatorDetailError.value);
      return;
    }
    if (!ontologyIdentifier.value.trim()) {
      ElMessage.warning("请选择对象");
      return;
    }
    const missingBinding = operatorBindingKeys.value.find((key) => !(operatorParamBindings.value[key] ?? "").trim());
    if (missingBinding) {
      ElMessage.warning(`请为参数 ${missingBinding} 选择对象属性`);
      return;
    }
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
      ...(kind.value === "application" ? { excludeTypes: "BASIC_QUERY" } : { types: "BASIC_QUERY" as const }),
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
    objectOptions.value = mapOntologyObjectsToRelationOptions(response.data);
  } catch (error) {
    if (requestToken !== objectLoadToken) return;
    objectOptions.value = [];
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
 * @description 按当前空间加载关系分类树并映射为可选关系行。
 */
async function loadRelationRows(): Promise<void> {
  const requestToken = ++relationLoadToken;
  relationLoading.value = true;
  relationError.value = "";
  try {
    const spaceId = props.spaceId.trim();
    if (!spaceId) throw new Error("当前对象空间无效");
    const response = await getOntologyRelationCategoryTreeInterface({ spaceId });
    if (requestToken !== relationLoadToken) return;
    if (response.code !== 200) throw new Error(response.message || "关系列表加载失败");
    if (!response.data) {
      relationRows.value = [];
      return;
    }
    relationRows.value = mapOntologyRelationLinks(response.data);
  } catch (error) {
    if (requestToken !== relationLoadToken) return;
    relationRows.value = [];
    relationError.value = error instanceof Error ? error.message : "关系列表加载失败";
  } finally {
    if (requestToken === relationLoadToken) relationLoading.value = false;
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
      clearApplicationPropertyOptionCache();
      return;
    }
    void loadObjectOptions();
    submitLoading.value = false;
    clearObjectInfoSelection();
    clearRelationSelection();
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
      operatorBindingKeys.value = [];
      operatorParamBindings.value = {};
      operatorParamIds.value = {};
      operatorDetailError.value = "";
      operatorPropertyOptions.value = [];
      operatorPropertyError.value = "";
      description.value = props.behavior.description;
      categoryId.value = props.behavior.categoryId;
      status.value = props.behavior.status;
      basicAction.value = props.behavior.basicAction || "create";
      clearApplicationRelationSelection();
      void loadOperatorCatalog();
      if (kind.value === "application") {
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
    void loadOperatorCatalog();
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

.behavior-form-dialog__tree-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 220px;
  margin-top: 8px;
  border-top: 1px solid var(--aircas-color-border);
}

@media (max-width: 900px) {
  .behavior-form-dialog__grid {
    grid-template-columns: 1fr;
  }

  .behavior-form-dialog__attribute-head {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
