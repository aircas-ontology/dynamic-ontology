<template>
  <el-dialog
    :model-value="modelValue"
    class="function-operator-form-dialog"
    :title="operator ? '编辑函数算子' : '新建函数算子'"
    width="min(960px, calc(100vw - 48px))"
    align-center
    destroy-on-close
    @update:model-value="emit('update:modelValue', $event)"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top" class="function-operator-form">
      <section v-if="!operator" class="function-operator-form__section">
        <div class="function-operator-form__section-title">函数类型</div>
        <div class="function-operator-form__type-grid">
          <button
            v-for="item in FUNCTION_OPERATOR_TYPE_OPTIONS"
            :key="item.value"
            type="button"
            class="function-operator-form__type-card"
            :class="{ 'is-active': form.type === item.value }"
            @click="changeType(item.value)"
          >
            <strong>{{ item.label }}</strong>
            <span>{{ item.description }}</span>
          </button>
        </div>
      </section>

      <section v-if="form.type === 'basic'" class="function-operator-form__section">
        <div class="function-operator-form__section-title">通用配置</div>
        <template v-if="!operator">
          <div class="function-operator-form__section-subtitle">基于已有函数 (可选)</div>
          <div class="function-operator-form__name-grid">
            <el-form-item label="源函数">
              <el-select v-model="sourceFunctionId" clearable filterable placeholder="选择已有函数作为模板" @change="onSourceFunctionChange">
                <el-option v-for="item in sourceFunctionOptions" :key="item.functionApi" :label="item.displayName" :value="item.functionApi" />
              </el-select>
            </el-form-item>
            <el-form-item label="源版本">
              <el-select v-model="sourceVersion" placeholder="选择版本" :disabled="!sourceFunctionId" @change="onSourceVersionChange">
                <el-option v-for="item in sourceVersionOptions" :key="item" :label="item" :value="item" />
              </el-select>
            </el-form-item>
          </div>
        </template>
        <div class="function-operator-form__name-grid">
          <el-form-item label="函数名称" prop="name">
            <el-input v-model="form.name" maxlength="64" placeholder="例如：目标识别算子" :disabled="Boolean(operator) || isSourceTemplateLocked" />
          </el-form-item>
          <el-form-item label="函数api名称" prop="functionApi">
            <el-input
              v-model="form.functionApi"
              maxlength="64"
              placeholder="例如：target_recognition"
              :disabled="Boolean(operator) || isSourceTemplateLocked"
            />
          </el-form-item>
        </div>
        <el-form-item label="函数版本" prop="version">
          <el-input v-model="form.version" maxlength="32" placeholder="例如：1.0.0" :disabled="Boolean(operator)" />
        </el-form-item>
        <el-form-item label="函数说明" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="2" maxlength="240" show-word-limit />
        </el-form-item>
        <div v-if="form.definition.kind === 'basic'" class="function-operator-form__name-grid">
          <el-form-item label="聚合类型">
            <el-select v-model="form.definition.aggFunc" clearable placeholder="请选择聚合类型" @clear="clearTargetProperty" @change="onAggFuncChange">
              <el-option v-for="item in FUNCTION_OPERATOR_AGG_FUNC_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="聚合参数名">
            <el-input v-model="form.definition.targetProperty" maxlength="64" placeholder="例如：target" :disabled="!form.definition.aggFunc" />
          </el-form-item>
        </div>
        <el-form-item v-if="form.definition.kind === 'basic'" label="参数配置" prop="definition.parameterConfig">
          <FunctionOperatorBasicFilterBuilder v-model="form.definition.parameterConfig" />
        </el-form-item>
      </section>

      <section v-else-if="form.type === 'composite' || form.type === 'code'" class="function-operator-form__section">
        <template v-if="!operator">
          <div class="function-operator-form__section-title">基于已有函数 (可选)</div>
          <div class="function-operator-form__name-grid">
            <el-form-item label="源函数">
              <el-select v-model="sourceFunctionId" clearable filterable placeholder="选择已有函数作为模板" @change="onSourceFunctionChange">
                <el-option v-for="item in sourceFunctionOptions" :key="item.functionApi" :label="item.displayName" :value="item.functionApi" />
              </el-select>
            </el-form-item>
            <el-form-item label="源版本">
              <el-select v-model="sourceVersion" placeholder="选择版本" :disabled="!sourceFunctionId" @change="onSourceVersionChange">
                <el-option v-for="item in sourceVersionOptions" :key="item" :label="item" :value="item" />
              </el-select>
            </el-form-item>
          </div>
        </template>
        <div class="function-operator-form__section-title">通用配置</div>
        <el-form-item label="函数名称" prop="name">
          <el-input v-model="form.name" maxlength="64" placeholder="例如：目标识别算子" :disabled="Boolean(operator) || isSourceTemplateLocked" />
        </el-form-item>
        <div class="function-operator-form__name-grid">
          <el-form-item label="API名称" prop="functionApi">
            <el-input v-model="form.functionApi" maxlength="64" placeholder="例如：TargetDetectFn" :disabled="Boolean(operator) || isSourceTemplateLocked" />
          </el-form-item>
          <el-form-item label="版本号" prop="version">
            <el-input v-model="form.version" maxlength="32" placeholder="1.0.0" :disabled="Boolean(operator)" />
          </el-form-item>
        </div>
        <el-form-item label="调用协议" prop="protocol">
          <el-select v-model="form.protocol" placeholder="请选择调用协议" :disabled="scriptSessionGeneralLocked">
            <el-option v-for="item in PROTOCOL_OPTIONS" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="函数说明" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" maxlength="240" show-word-limit :disabled="scriptSessionGeneralLocked" />
        </el-form-item>
      </section>

      <section v-else-if="form.type === 'api'" class="function-operator-form__section">
        <template v-if="!operator">
          <div class="function-operator-form__section-title">基于已有函数 (可选)</div>
          <div class="function-operator-form__name-grid">
            <el-form-item label="源函数">
              <el-select v-model="sourceFunctionId" clearable filterable placeholder="选择已有函数作为模板" @change="onSourceFunctionChange">
                <el-option v-for="item in sourceFunctionOptions" :key="item.functionApi" :label="item.displayName" :value="item.functionApi" />
              </el-select>
            </el-form-item>
            <el-form-item label="源版本">
              <el-select v-model="sourceVersion" placeholder="选择版本" :disabled="!sourceFunctionId" @change="onSourceVersionChange">
                <el-option v-for="item in sourceVersionOptions" :key="item" :label="item" :value="item" />
              </el-select>
            </el-form-item>
          </div>
        </template>
        <div class="function-operator-form__section-title">通用配置</div>
        <el-form-item label="函数名称" prop="name">
          <el-input v-model="form.name" maxlength="64" placeholder="例如：目标识别算子" :disabled="Boolean(operator) || isSourceTemplateLocked" />
        </el-form-item>
        <div class="function-operator-form__name-grid">
          <el-form-item label="API名称" prop="functionApi">
            <el-input v-model="form.functionApi" maxlength="64" placeholder="例如：TargetDetectFn" :disabled="Boolean(operator) || isSourceTemplateLocked" />
          </el-form-item>
          <el-form-item label="版本号" prop="version">
            <el-input v-model="form.version" maxlength="32" placeholder="1.0.0" :disabled="Boolean(operator)" />
          </el-form-item>
        </div>
        <el-form-item label="调用协议" prop="protocol">
          <el-select v-model="form.protocol" placeholder="请选择调用协议">
            <el-option v-for="item in PROTOCOL_OPTIONS" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="函数说明" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" maxlength="240" show-word-limit />
        </el-form-item>
        <div class="function-operator-form__section-title">外部 API 函数配置</div>
        <el-form-item label="接口地址">
          <el-input v-model="externalApiEndpoint" maxlength="500" placeholder="https://service.example/api/run" />
        </el-form-item>
        <div class="function-operator-form__name-grid">
          <el-form-item label="请求方法">
            <el-select v-model="externalApiMethod" placeholder="请选择请求方法">
              <el-option v-for="item in EXTERNAL_API_METHOD_OPTIONS" :key="item" :label="item" :value="item" />
            </el-select>
          </el-form-item>
          <el-form-item label="认证方式">
            <el-select v-model="externalApiAuth" placeholder="请选择认证方式" @change="onExternalApiAuthChange">
              <el-option v-for="item in EXTERNAL_API_AUTH_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
        </div>
        <el-form-item label="认证 Header key">
          <el-input v-if="externalApiAuth === 'apiKey'" v-model="externalApiHeaderKey" maxlength="500" clearable placeholder="请输入认证 Header key" />
          <el-input v-else model-value="仅作原型展示，正式密钥由后端托管" disabled />
        </el-form-item>
        <el-form-item label="认证 Header value">
          <el-input v-if="externalApiAuth === 'apiKey'" v-model="externalApiHeader" maxlength="500" clearable placeholder="请输入认证 Header 值" />
          <el-input v-else model-value="仅作原型展示，正式密钥由后端托管" disabled />
        </el-form-item>

        <div class="function-operator-form__param-head">
          <div class="function-operator-form__section-title">输入参数</div>
          <el-button type="primary" plain native-type="button" @click="addExternalApiInputParameter">添加</el-button>
        </div>
        <el-table class="function-operator-form__param-table" :data="externalApiInputParameters" row-key="id" empty-text="暂无输入参数">
          <el-table-column label="name" min-width="140">
            <template #default="{ row }">
              <el-input v-model="row.name" maxlength="64" placeholder="请输入字段名称" />
            </template>
          </el-table-column>
          <el-table-column label="type" min-width="140">
            <template #default="{ row }">
              <el-select v-model="row.type" placeholder="请选择 type">
                <el-option v-for="item in EXTERNAL_API_PARAMETER_TYPE_OPTIONS" :key="item" :label="item" :value="item" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="description" min-width="180">
            <template #default="{ row }">
              <el-input v-model="row.description" maxlength="240" placeholder="请输入描述" />
            </template>
          </el-table-column>
          <el-table-column label="location" min-width="140">
            <template #default="{ row }">
              <el-select v-model="row.location" placeholder="请选择 location">
                <el-option v-for="item in EXTERNAL_API_PARAMETER_LOCATION_OPTIONS" :key="item" :label="item" :value="item" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="required" min-width="120">
            <template #default="{ row }">
              <el-select v-model="row.required" placeholder="请选择 required">
                <el-option label="是" value="yes" />
                <el-option label="否" value="no" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="88" fixed="right">
            <template #default="{ $index }">
              <el-button type="danger" plain native-type="button" @click="removeExternalApiInputParameter($index)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="function-operator-form__param-head">
          <div class="function-operator-form__section-title">输出参数</div>
          <el-button type="primary" plain native-type="button" @click="addExternalApiOutputParameter">添加</el-button>
        </div>
        <el-table class="function-operator-form__param-table" :data="externalApiOutputParameters" row-key="id" empty-text="暂无输出参数">
          <el-table-column label="name" min-width="160">
            <template #default="{ row }">
              <el-input v-model="row.name" maxlength="64" placeholder="请输入字段名称" />
            </template>
          </el-table-column>
          <el-table-column label="type" min-width="160">
            <template #default="{ row }">
              <el-select v-model="row.type" placeholder="请选择 type">
                <el-option v-for="item in EXTERNAL_API_PARAMETER_TYPE_OPTIONS" :key="`output-${item}`" :label="item" :value="item" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="description" min-width="220">
            <template #default="{ row }">
              <el-input v-model="row.description" maxlength="240" placeholder="请输入描述" />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="88" fixed="right">
            <template #default="{ $index }">
              <el-button type="danger" plain native-type="button" @click="removeExternalApiOutputParameter($index)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="function-operator-form__test">
          <div class="function-operator-form__param-head">
            <div class="function-operator-form__section-title">配置测试</div>
            <span class="function-operator-form__test-status">尚未测试</span>
          </div>
          <div class="function-operator-form__test-panes">
            <div class="function-operator-form__test-editor">
              <el-input v-model="externalApiTestInput" class="function-operator-form__test-input" type="textarea" :rows="8" resize="vertical" />
              <el-button type="primary" plain native-type="button" @click="notifyExternalApiTestUnavailable">运行测试</el-button>
            </div>
            <div class="function-operator-form__test-result" aria-live="polite">测试结果将在这里显示</div>
          </div>
        </div>
      </section>

      <section v-else class="function-operator-form__section function-operator-form__section--empty">
        <el-empty description="该函数类型本阶段暂未开放，请选择基础函数、脚本函数或函数编排" />
      </section>
    </el-form>

    <template #footer>
      <el-button @click="emit('update:modelValue', false)">取消</el-button>
      <el-button v-if="form.type === 'composite' || form.type === 'code'" type="primary" :loading="loading" @click="goGeneralConfigNextStep">下一步</el-button>
      <el-button v-else type="primary" :loading="loading" :disabled="form.type !== 'basic' && form.type !== 'api'" @click="submitCurrentDraft">保存</el-button>
    </template>
  </el-dialog>

  <FunctionOperatorScriptIdeDialog
    :model-value="scriptIdeVisible"
    v-model:code="scriptDraftCode"
    v-model:language="scriptDraftLanguage"
    v-model:test-params="scriptDraftTestParams"
    :function-api="form.functionApi"
    :version="form.version"
    :display-name="form.name"
    :description="form.description"
    :space-id="form.spaceId"
    :source-version="sourceVersion"
    :language-locked="Boolean(operator) || isSourceTemplateLocked"
    :saving="loading"
    v-model:parsed-input-parameters="scriptDraftInputParameters"
    v-model:parsed-output-parameters="scriptDraftOutputParameters"
    @update:model-value="onScriptIdeVisibleChange"
    @back="onScriptIdeBack"
    @save="emitSaveScript"
  />

  <FunctionOperatorCompositeWorkflowDialog
    v-model="compositeWorkflowVisible"
    :space-id="form.spaceId"
    :function-api="form.functionApi"
    :display-name="form.name"
    :version="form.version"
  />
</template>

<script setup lang="ts">
import { computed, nextTick, reactive, ref, toRaw, watch } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { ElMessage } from "element-plus";

import { getOntologyFunctionDetailInterface, getOntologyFunctionListInterface, getOntologyFunctionVersionsInterface } from "@/apis";
import {
  FUNCTION_OPERATOR_AGG_FUNC_OPTIONS,
  FUNCTION_OPERATOR_TYPE_OPTIONS,
  type CreateOntologyFunctionParams,
  type FunctionOperator,
  type FunctionOperatorDraft,
  type FunctionOperatorProtocol,
  type FunctionOperatorScriptLanguage,
  type FunctionOperatorType,
  type GetOntologyFunctionListItem,
  type ParseOntologyFunctionParamItem,
} from "@/types";
import { createEmptyBasicFilterDocument, stringifyBasicFilterConfig } from "@/utils/functionOperatorBasicFilter";
import { mapFunctionOperatorTypeToApi } from "@/utils/mapFunctionOperatorTypeToApi";
import { mapOntologyExternalApiConfigToForm, mapOntologyFunctionDetailToDraft } from "@/utils/mapOntologyFunctionDetail";

import FunctionOperatorBasicFilterBuilder from "./FunctionOperatorBasicFilterBuilder.vue";
import FunctionOperatorCompositeWorkflowDialog from "./FunctionOperatorCompositeWorkflowDialog.vue";
import FunctionOperatorScriptIdeDialog from "./FunctionOperatorScriptIdeDialog.vue";
import { createDefaultScriptFunctionCode, DEFAULT_SCRIPT_FUNCTION_LANGUAGE, DEFAULT_SCRIPT_FUNCTION_TEST_PARAMS } from "../utils/scriptFunctionStarters";
import { buildCreateOntologyExternalFunctionParams } from "../utils/buildCreateOntologyExternalFunctionParams";
import { mapOperatorParametersToScriptParamTree } from "../utils/mapOperatorParametersToScriptParamTree";

const PROTOCOL_OPTIONS: ReadonlyArray<Extract<FunctionOperatorProtocol, "HTTP">> = ["HTTP"];
const EXTERNAL_API_METHOD_OPTIONS = ["GET", "POST", "PUT", "DELETE"] as const;
const EXTERNAL_API_AUTH_OPTIONS = [
  { value: "none", label: "无认证" },
  { value: "apiKey", label: "API Key" },
] as const;
const EXTERNAL_API_PARAMETER_TYPE_OPTIONS = ["string", "number", "boolean", "array", "object"] as const;
const EXTERNAL_API_PARAMETER_LOCATION_OPTIONS = ["Body", "Path", "Query", "Header"] as const;

/** 外部 API 输入参数行。 */
interface ExternalApiInputParameterRow {
  id: string;
  name: string;
  type: (typeof EXTERNAL_API_PARAMETER_TYPE_OPTIONS)[number];
  description: string;
  location: (typeof EXTERNAL_API_PARAMETER_LOCATION_OPTIONS)[number];
  required: "yes" | "no";
}

/** 外部 API 输出参数行。 */
interface ExternalApiOutputParameterRow {
  id: string;
  name: string;
  type: (typeof EXTERNAL_API_PARAMETER_TYPE_OPTIONS)[number];
  description: string;
}

/** 外部 API 接口地址，仅表单展示，尚未提交创建接口。 */
const externalApiEndpoint = ref("");
/** 外部 API 请求方法，默认 POST。 */
const externalApiMethod = ref<(typeof EXTERNAL_API_METHOD_OPTIONS)[number]>("POST");
/** 外部 API 认证方式，默认无认证。 */
const externalApiAuth = ref<(typeof EXTERNAL_API_AUTH_OPTIONS)[number]["value"]>("none");
/** API Key 模式下的认证 Header 名。 */
const externalApiHeaderKey = ref("");
/** API Key 模式下的认证 Header 值。 */
const externalApiHeader = ref("");
/** 配置测试左侧默认 JSON。 */
const EXTERNAL_API_TEST_INPUT_DEFAULT = '{\n  "": ""\n}';
/** 配置测试输入，仅表单展示。 */
const externalApiTestInput = ref(EXTERNAL_API_TEST_INPUT_DEFAULT);
/** 外部 API 输入参数，仅表单展示。 */
const externalApiInputParameters = ref<ExternalApiInputParameterRow[]>([]);
/** 外部 API 输出参数，仅表单展示。 */
const externalApiOutputParameters = ref<ExternalApiOutputParameterRow[]>([]);
let externalApiParameterSerial = 0;

/**
 * @description 生成新建基础函数的默认 parameterConfig。
 * @returns 空过滤配置 JSON 文本。
 */
function createDefaultBasicParameterConfig(): string {
  return stringifyBasicFilterConfig(createEmptyBasicFilterDocument());
}

const props = defineProps<{
  modelValue: boolean;
  operator: FunctionOperator | null;
  draft: FunctionOperatorDraft | null;
  spaceId: number;
  loading: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  submit: [draft: FunctionOperatorDraft];
  "save-script": [params: CreateOntologyFunctionParams];
  "save-external": [params: CreateOntologyFunctionParams];
}>();

/**
 * @description 将脚本 IDE 组装的创建请求转发给工作区保存。
 * @param params CUSTOMIZE 创建参数。
 */
function emitSaveScript(params: CreateOntologyFunctionParams): void {
  emit("save-script", params);
}

const formRef = ref<FormInstance>();
const sourceFunctionId = ref("");
const sourceVersion = ref("");
/** 新建脚本在 IDE 创建成功后，置灰上一步通用配置中的协议与说明。 */
const scriptSessionGeneralLocked = ref(false);
/** 脚本函数 Web-IDE 全屏弹框是否可见。 */
const scriptIdeVisible = ref(false);
/** 函数编排流程画布全屏弹框是否可见。 */
const compositeWorkflowVisible = ref(false);
/** 脚本 IDE 代码草稿（返回上一步时保留，关闭新建弹框或离开脚本类型时清空）。 */
const scriptDraftCode = ref(createDefaultScriptFunctionCode());
/** 脚本 IDE 语言草稿。 */
const scriptDraftLanguage = ref<FunctionOperatorScriptLanguage>(DEFAULT_SCRIPT_FUNCTION_LANGUAGE);
/** 脚本 IDE 测试参数草稿。 */
const scriptDraftTestParams = ref(DEFAULT_SCRIPT_FUNCTION_TEST_PARAMS);
/** 脚本 IDE 已展示的输入参数树草稿。 */
const scriptDraftInputParameters = ref<ParseOntologyFunctionParamItem[]>([]);
/** 脚本 IDE 已展示的输出参数树草稿。 */
const scriptDraftOutputParameters = ref<ParseOntologyFunctionParamItem[]>([]);

/**
 * @description 将脚本 IDE 草稿重置为默认 starter。
 */
function resetScriptDraft(): void {
  scriptDraftCode.value = createDefaultScriptFunctionCode();
  scriptDraftLanguage.value = DEFAULT_SCRIPT_FUNCTION_LANGUAGE;
  scriptDraftTestParams.value = DEFAULT_SCRIPT_FUNCTION_TEST_PARAMS;
  scriptDraftInputParameters.value = [];
  scriptDraftOutputParameters.value = [];
}

/**
 * @description 从草稿 definition 回填脚本 IDE 草稿；非脚本类型不修改。
 * @param draft 表单或详情映射草稿。
 */
function applyScriptDraftFromDefinition(draft: FunctionOperatorDraft): void {
  if (draft.definition.kind !== "code") {
    return;
  }
  scriptDraftCode.value = draft.definition.code;
  scriptDraftLanguage.value = draft.definition.language;
  scriptDraftTestParams.value = DEFAULT_SCRIPT_FUNCTION_TEST_PARAMS;
  scriptDraftInputParameters.value = mapOperatorParametersToScriptParamTree(draft.inputParameters, "INPUT");
  scriptDraftOutputParameters.value = mapOperatorParametersToScriptParamTree(draft.outputParameters, "OUTPUT");
}

/**
 * @description 生成新建脚本类型的默认 definition。
 * @returns 含默认语言与 starter 的 code definition。
 */
function createDefaultCodeDefinition(): FunctionOperatorDraft["definition"] {
  return {
    kind: "code",
    language: DEFAULT_SCRIPT_FUNCTION_LANGUAGE,
    code: createDefaultScriptFunctionCode(),
  };
}
/** 源函数下拉选项（独立列表接口结果）。 */
const sourceFunctionOptions = ref<GetOntologyFunctionListItem[]>([]);
let sourceFunctionListGeneration = 0;
/** 源版本下拉选项（版本列表接口结果）。 */
const sourceVersionOptions = ref<string[]>([]);
let sourceVersionListGeneration = 0;
let sourceDetailGeneration = 0;

/** 新建且已选源版本时锁定名称与 api 名称。 */
const isSourceTemplateLocked = computed(() => Boolean(sourceVersion.value.trim()) && !props.operator);

/**
 * @description 清空模板回填的函数名称与 api 名称。
 */
function clearSourceTemplateIdentityFields(): void {
  form.name = "";
  form.functionApi = "";
}

/**
 * @description 切换源函数时清空源版本选择并按所选函数拉取版本列表。
 */
function onSourceFunctionChange(): void {
  sourceVersion.value = "";
  sourceDetailGeneration += 1;
  clearSourceTemplateIdentityFields();
  void loadSourceVersionOptions();
}

/**
 * @description 选择源版本后拉取详情并回填；清除源版本时解锁并置空名称与 api 名称。
 */
function onSourceVersionChange(): void {
  if (!sourceVersion.value.trim()) {
    sourceDetailGeneration += 1;
    clearSourceTemplateIdentityFields();
    return;
  }
  void loadSourceTemplateDetail();
}

/**
 * @description 重置基于已有函数的可选模板选择与版本选项。
 */
function resetSourceTemplateSelection(): void {
  sourceFunctionId.value = "";
  sourceVersion.value = "";
  sourceVersionListGeneration += 1;
  sourceDetailGeneration += 1;
  sourceVersionOptions.value = [];
}

/**
 * @description 按当前源函数独立拉取版本号列表；未选择源函数时清空选项。
 */
async function loadSourceVersionOptions(): Promise<void> {
  const requestId = ++sourceVersionListGeneration;
  const functionApi = sourceFunctionId.value.trim();
  if (!functionApi) {
    sourceVersionOptions.value = [];
    return;
  }
  try {
    const response = await getOntologyFunctionVersionsInterface({ functionApi });
    if (requestId !== sourceVersionListGeneration) {
      return;
    }
    if (response.code !== 200 || !response.data) {
      throw new Error(response.message || "源版本列表加载失败");
    }
    sourceVersionOptions.value = Array.isArray(response.data) ? response.data.filter((item) => typeof item === "string" && item.trim()) : [];
  } catch (error) {
    if (requestId !== sourceVersionListGeneration) {
      return;
    }
    sourceVersionOptions.value = [];
    ElMessage.error(error instanceof Error ? error.message : "源版本列表加载失败");
  }
}

/**
 * @description 将详情草稿中的模板字段写入当前表单；不覆盖新建 version、spaceId 与类型。
 * @param draft 详情映射草稿。
 */
function applySourceTemplateDraft(draft: FunctionOperatorDraft): void {
  form.name = draft.name;
  form.functionApi = draft.functionApi;
  form.description = draft.description;
  if (form.type === "basic" && form.definition.kind === "basic" && draft.definition.kind === "basic") {
    form.definition = structuredClone(toRaw(draft.definition));
  }
  if (form.type === "code" && draft.definition.kind === "code") {
    form.definition = structuredClone(toRaw(draft.definition));
    applyScriptDraftFromDefinition(draft);
  }
  void nextTick(() => {
    formRef.value?.clearValidate(["name", "functionApi"]);
  });
}

/**
 * @description 按源函数与源版本拉取详情并回填新建表单；缺参或编辑态不请求。
 */
async function loadSourceTemplateDetail(): Promise<void> {
  const requestId = ++sourceDetailGeneration;
  const functionApi = sourceFunctionId.value.trim();
  const version = sourceVersion.value.trim();
  if (props.operator || !functionApi || !version) {
    return;
  }
  try {
    const response = await getOntologyFunctionDetailInterface({ functionApi, version });
    if (requestId !== sourceDetailGeneration) {
      return;
    }
    if (response.code !== 200 || !response.data) {
      throw new Error(response.message || "源函数详情加载失败");
    }
    applySourceTemplateDraft(mapOntologyFunctionDetailToDraft(response.data, props.spaceId, version));
  } catch (error) {
    if (requestId !== sourceDetailGeneration) {
      return;
    }
    ElMessage.error(error instanceof Error ? error.message : "源函数详情加载失败");
  }
}

/**
 * @description 按当前表单类型独立拉取源函数列表（pageSize=1000）；无类型映射或非新建态时清空选项。
 */
async function loadSourceFunctionOptions(): Promise<void> {
  const requestId = ++sourceFunctionListGeneration;
  if (!props.modelValue || props.operator || props.draft?.id) {
    sourceFunctionOptions.value = [];
    return;
  }
  const apiType = mapFunctionOperatorTypeToApi(form.type);
  if (!apiType || !props.spaceId) {
    sourceFunctionOptions.value = [];
    return;
  }
  try {
    const response = await getOntologyFunctionListInterface({
      ontologySpaceId: props.spaceId,
      type: apiType,
      pageNum: 1,
      pageSize: 1000,
    });
    if (requestId !== sourceFunctionListGeneration) {
      return;
    }
    if (response.code !== 200 || !response.data) {
      throw new Error(response.message || "源函数列表加载失败");
    }
    sourceFunctionOptions.value = Array.isArray(response.data.records) ? response.data.records : [];
  } catch (error) {
    if (requestId !== sourceFunctionListGeneration) {
      return;
    }
    sourceFunctionOptions.value = [];
    ElMessage.error(error instanceof Error ? error.message : "源函数列表加载失败");
  }
}

/**
 * @description 创建空草稿，默认基础函数。
 * @returns 新建草稿。
 */
function createEmptyDraft(): FunctionOperatorDraft {
  return {
    spaceId: props.spaceId,
    name: "",
    functionApi: "",
    type: "basic",
    protocol: "HTTP",
    version: "1.0.0",
    description: "",
    createdBy: "admin",
    createdAt: "",
    status: "draft",
    category: "基础操作",
    inputParameters: [],
    outputParameters: [],
    timeout: 5000,
    retryCount: 0,
    retryInterval: 0,
    definition: { kind: "basic", parameterConfig: createDefaultBasicParameterConfig(), aggFunc: "", targetProperty: "" },
    dependencies: [],
    testStatus: "untested",
    testedAt: "",
  };
}

/**
 * @description 将已有算子转为可编辑草稿。
 * @param operator 源算子。
 * @returns 草稿。
 */
function toDraft(operator: FunctionOperator): FunctionOperatorDraft {
  return {
    id: operator.id,
    spaceId: operator.spaceId,
    name: operator.name,
    functionApi: operator.functionApi,
    type: operator.type,
    protocol: operator.protocol,
    version: operator.version,
    description: operator.description,
    createdBy: operator.createdBy,
    createdAt: operator.createdAt,
    status: operator.status,
    category: operator.category,
    inputParameters: operator.inputParameters.map((item) => ({ ...item })),
    outputParameters: operator.outputParameters.map((item) => ({ ...item })),
    timeout: operator.timeout,
    retryCount: operator.retryCount,
    retryInterval: operator.retryInterval,
    definition: structuredClone(toRaw(operator.definition)),
    dependencies: [...operator.dependencies],
    testStatus: operator.testStatus,
    testedAt: operator.testedAt,
  };
}

const form = reactive<FunctionOperatorDraft>(createEmptyDraft());

/**
 * @description 用详情 apiConfig 回填外部 API 表单。配置里的输入或输出为空时，改用详情 params。没有配置时清空这些字段，不改配置测试内容。
 * @param draft 外部 API 草稿；其他类型不传。
 */
function applyExternalApiConfig(draft: FunctionOperatorDraft | undefined): void {
  const formValues = mapOntologyExternalApiConfigToForm(draft?.externalApiConfig, {
    inputs: draft?.inputParameters,
    outputs: draft?.outputParameters,
  });
  if (!formValues) {
    externalApiEndpoint.value = "";
    externalApiMethod.value = "POST";
    externalApiAuth.value = "none";
    externalApiHeaderKey.value = "";
    externalApiHeader.value = "";
    externalApiInputParameters.value = [];
    externalApiOutputParameters.value = [];
    return;
  }
  externalApiEndpoint.value = formValues.endpoint;
  externalApiMethod.value = formValues.method;
  externalApiAuth.value = formValues.authType;
  externalApiHeaderKey.value = formValues.apiKeyHeader;
  externalApiHeader.value = formValues.apiKey;
  externalApiInputParameters.value = formValues.inputs.map((row) => ({
    id: createExternalApiParameterId("input"),
    ...row,
  }));
  externalApiOutputParameters.value = formValues.outputs.map((row) => ({
    id: createExternalApiParameterId("output"),
    ...row,
  }));
}
/**
 * @description 清空外部 API 表单中的接口地址、请求方法、认证方式、Header、参数行和配置测试内容。
 */
function resetExternalApiForm(): void {
  externalApiEndpoint.value = "";
  externalApiMethod.value = "POST";
  externalApiAuth.value = "none";
  externalApiHeaderKey.value = "";
  externalApiHeader.value = "";
  externalApiInputParameters.value = [];
  externalApiOutputParameters.value = [];
  externalApiTestInput.value = EXTERNAL_API_TEST_INPUT_DEFAULT;
}

/**
 * @description 提示外部 API 配置测试本阶段未开放，不调用测试接口。
 */
function notifyExternalApiTestUnavailable(): void {
  ElMessage.info("配置测试本阶段暂未开放");
}

/**
 * @description 生成外部 API 参数行的列表键。
 * @param prefix 输入或输出前缀。
 * @returns 不重复的行 id。
 */
function createExternalApiParameterId(prefix: "input" | "output"): string {
  externalApiParameterSerial += 1;
  return `${prefix}-${externalApiParameterSerial}`;
}

/**
 * @description 追加一行空的外部 API 输入参数。
 */
function addExternalApiInputParameter(): void {
  externalApiInputParameters.value = [
    ...externalApiInputParameters.value,
    {
      id: createExternalApiParameterId("input"),
      name: "",
      type: "string",
      description: "",
      location: "Body",
      required: "no",
    },
  ];
}

/**
 * @description 按序号删除一行外部 API 输入参数。
 * @param index 行序号。
 */
function removeExternalApiInputParameter(index: number): void {
  externalApiInputParameters.value = externalApiInputParameters.value.filter((_, rowIndex) => rowIndex !== index);
}

/**
 * @description 追加一行空的外部 API 输出参数。
 */
function addExternalApiOutputParameter(): void {
  externalApiOutputParameters.value = [
    ...externalApiOutputParameters.value,
    {
      id: createExternalApiParameterId("output"),
      name: "",
      type: "string",
      description: "",
    },
  ];
}

/**
 * @description 按序号删除一行外部 API 输出参数。
 * @param index 行序号。
 */
function removeExternalApiOutputParameter(index: number): void {
  externalApiOutputParameters.value = externalApiOutputParameters.value.filter((_, rowIndex) => rowIndex !== index);
}

/**
 * @description 切换认证方式时清空 Header key / 值，避免无认证模式残留已填内容。
 * @param value 当前认证方式。
 */
function onExternalApiAuthChange(value: string | number | boolean | undefined): void {
  if (value !== "apiKey") {
    externalApiHeaderKey.value = "";
    externalApiHeader.value = "";
  }
}

/** 按函数类型切换校验文案；编排、脚本与外部 API 额外校验协议与说明。 */
const rules = computed<FormRules>(() => {
  if (form.type === "composite" || form.type === "code" || form.type === "api") {
    return {
      name: [{ required: true, message: "请输入函数名称", trigger: "blur" }],
      functionApi: [{ required: true, message: "请输入API名称", trigger: "blur" }],
      version: [{ required: true, message: "请输入版本号", trigger: "blur" }],
      protocol: [{ required: true, message: "请选择调用协议", trigger: "change" }],
      description: [{ required: true, message: "请输入函数说明", trigger: "blur" }],
    };
  }
  return {
    name: [{ required: true, message: "请输入函数名称", trigger: "blur" }],
    functionApi: [{ required: true, message: "请输入函数api名称", trigger: "blur" }],
    version: [{ required: true, message: "请输入函数版本", trigger: "blur" }],
  };
});

/**
 * @description 切换函数类型并重置为空草稿，避免上一类型字段残留；同类型点击直接返回。
 * @param type 目标类型。
 */
function changeType(type: FunctionOperatorType): void {
  if (form.type === type) {
    return;
  }
  const previousType = form.type;
  const next = createEmptyDraft();
  next.type = type;
  if (type === "basic") {
    next.definition = { kind: "basic", parameterConfig: createDefaultBasicParameterConfig(), aggFunc: "", targetProperty: "" };
  } else if (type === "code") {
    next.protocol = "HTTP";
    next.definition = createDefaultCodeDefinition();
  } else if (type === "composite") {
    next.protocol = "HTTP";
    next.definition = { kind: "composite" };
  } else if (type === "api") {
    next.protocol = "HTTP";
    next.definition = { kind: "api" };
  } else {
    next.definition = { kind: type };
  }
  resetExternalApiForm();
  Object.assign(form, next);
  delete form.id;
  if (previousType === "code" && type !== "code") {
    scriptIdeVisible.value = false;
    resetScriptDraft();
  } else if (type === "code") {
    applyScriptDraftFromDefinition(next);
  }
  if (previousType === "composite" && type !== "composite") {
    compositeWorkflowVisible.value = false;
  }
  resetSourceTemplateSelection();
  void loadSourceFunctionOptions();
  void nextTick(() => {
    formRef.value?.clearValidate();
  });
}

/**
 * @description 清空聚合参数名（清除聚合类型时调用）。
 */
function clearTargetProperty(): void {
  if (form.definition.kind !== "basic") {
    return;
  }
  form.definition.targetProperty = "";
}

/**
 * @description 聚合类型变更：未选中时清空聚合参数名。
 * @param value 当前聚合类型。
 */
function onAggFuncChange(value: string | number | boolean | undefined): void {
  if (form.definition.kind !== "basic") {
    return;
  }
  if (!value) {
    form.definition.targetProperty = "";
  }
}

/**
 * @description 校验并提交基础函数草稿。
 */
async function submitDraft(): Promise<void> {
  if (form.type !== "basic" || form.definition.kind !== "basic") {
    ElMessage.warning("请选择基础函数");
    return;
  }
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) {
    return;
  }
  if (!form.definition.parameterConfig.trim()) {
    ElMessage.warning("请配置参数");
    return;
  }
  const aggFunc = form.definition.aggFunc || "";
  emit("submit", {
    ...form,
    name: form.name.trim(),
    functionApi: form.functionApi.trim(),
    version: form.version.trim(),
    description: form.description.trim(),
    type: "basic",
    definition: {
      ...form.definition,
      aggFunc,
      targetProperty: aggFunc ? (form.definition.targetProperty || "").trim() : "",
    },
  });
}

/**
 * @description 校验并提交外部 API 函数；新建与编辑使用同一套请求参数。
 */
async function submitExternalApi(): Promise<void> {
  if (form.type !== "api") {
    return;
  }
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) {
    return;
  }
  if (!externalApiEndpoint.value.trim()) {
    ElMessage.warning("请填写接口地址");
    return;
  }
  if (externalApiAuth.value === "apiKey" && !externalApiHeaderKey.value.trim()) {
    ElMessage.warning("请填写认证 Header key");
    return;
  }
  if (externalApiAuth.value === "apiKey" && !externalApiHeader.value.trim()) {
    ElMessage.warning("请填写认证 Header 值");
    return;
  }
  emit(
    "save-external",
    buildCreateOntologyExternalFunctionParams({
      functionApi: form.functionApi,
      version: form.version,
      displayName: form.name,
      description: form.description,
      ontologySpaceId: form.spaceId,
      sourceVersion: sourceVersion.value,
      endpoint: externalApiEndpoint.value,
      method: externalApiMethod.value,
      authType: externalApiAuth.value,
      apiKeyHeader: externalApiHeaderKey.value,
      apiKey: externalApiHeader.value,
      inputs: externalApiInputParameters.value,
      outputs: externalApiOutputParameters.value,
    }),
  );
}

/**
 * @description 按当前函数类型提交基础函数或外部 API 函数。
 */
function submitCurrentDraft(): void {
  if (form.type === "api") {
    void submitExternalApi();
    return;
  }
  void submitDraft();
}

/**
 * @description 校验编排 / 脚本通用配置后进入下一步；脚本打开 Web-IDE，编排打开流程画布。
 */
async function goGeneralConfigNextStep(): Promise<void> {
  if (form.type !== "composite" && form.type !== "code") {
    return;
  }
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) {
    return;
  }
  if (form.type === "code") {
    scriptIdeVisible.value = true;
    return;
  }
  compositeWorkflowVisible.value = true;
}

watch(
  () => props.operator,
  (operator, previous) => {
    if (props.modelValue && !previous && operator && scriptIdeVisible.value) {
      scriptSessionGeneralLocked.value = true;
    }
  },
);

/** 返回上一步关闭 IDE 时，忽略随后的 update:modelValue，避免误关上层表单。 */
let skipCloseFormOnScriptIdeHide = false;

/**
 * @description 脚本 IDE 通过右上角关闭时，一并关闭上层表单；返回上一步触发的关闭不处理表单。
 * @param visible IDE 是否打开。
 */
function onScriptIdeVisibleChange(visible: boolean): void {
  scriptIdeVisible.value = visible;
  if (visible) {
    return;
  }
  if (skipCloseFormOnScriptIdeHide) {
    skipCloseFormOnScriptIdeHide = false;
    return;
  }
  if (props.modelValue) {
    emit("update:modelValue", false);
  }
}

/**
 * @description 脚本 IDE 返回上一步时只关闭 IDE，保留上层表单。
 */
function onScriptIdeBack(): void {
  skipCloseFormOnScriptIdeHide = true;
  scriptIdeVisible.value = false;
}

watch(
  () => [props.modelValue, props.operator, props.draft, props.spaceId] as const,
  ([visible]) => {
    if (!visible) {
      scriptSessionGeneralLocked.value = false;
      scriptIdeVisible.value = false;
      compositeWorkflowVisible.value = false;
      resetScriptDraft();
      resetExternalApiForm();
      sourceFunctionListGeneration += 1;
      sourceFunctionOptions.value = [];
      resetSourceTemplateSelection();
      return;
    }
    const next = props.draft ? (structuredClone(toRaw(props.draft)) as FunctionOperatorDraft) : props.operator ? toDraft(props.operator) : createEmptyDraft();
    next.spaceId = props.spaceId;
    Object.assign(form, next);
    if (!next.id) {
      delete form.id;
    }
    if (next.definition.kind === "code") {
      applyScriptDraftFromDefinition(next);
    } else {
      resetScriptDraft();
    }
    applyExternalApiConfig(next.type === "api" ? next : undefined);
    resetSourceTemplateSelection();
    void loadSourceFunctionOptions();
  },
);
</script>

<style scoped lang="scss">
.function-operator-form__section {
  margin-bottom: 16px;
}

.function-operator-form__section-title {
  margin-bottom: 8px;
  color: var(--aircas-color-text-primary);
  font-size: 14px;
  font-weight: 600;
}

.function-operator-form__section-subtitle {
  margin: 4px 0 8px;
  color: var(--aircas-color-text-secondary);
  font-size: 13px;
  font-weight: 500;
}

.function-operator-form__name-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 16px;
}

.function-operator-form__type-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 8px;
}

.function-operator-form__type-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-height: 72px;
  padding: 10px;
  border: 1px solid var(--aircas-color-border-light);
  border-radius: 6px;
  background: var(--aircas-color-panel-background-deep);
  color: var(--aircas-color-text-primary);
  text-align: left;
  cursor: pointer;
}

.function-operator-form__type-card strong {
  font-size: 13px;
}

.function-operator-form__type-card span {
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
}

.function-operator-form__type-card.is-active {
  border-color: var(--aircas-color-primary);
  box-shadow: inset 0 0 0 1px var(--aircas-color-primary);
}

.function-operator-form__param-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 8px;
}

.function-operator-form__param-head .function-operator-form__section-title {
  margin-bottom: 0;
}

.function-operator-form__param-table {
  width: 100%;
  margin-bottom: 12px;
}

.function-operator-form__test {
  margin-top: 8px;
}

.function-operator-form__test-status {
  padding: 2px 8px;
  border-radius: 4px;
  background: var(--aircas-color-panel-background-deep);
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
}

.function-operator-form__test-panes {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  align-items: start;
}

.function-operator-form__test-editor {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}

.function-operator-form__test-input {
  width: 100%;
}

.function-operator-form__test-result {
  min-height: 168px;
  padding: 8px 12px;
  border: 1px solid var(--aircas-color-border);
  border-radius: 6px;
  background: var(--aircas-color-panel-background-deep);
  color: var(--aircas-color-text-secondary);
  font-size: 13px;
  white-space: pre-wrap;
}

.function-operator-form__section--empty {
  padding: 24px 0;
}

@media (max-width: 640px) {
  .function-operator-form__name-grid,
  .function-operator-form__test-panes {
    grid-template-columns: 1fr;
  }
}
</style>

<style lang="scss">
.function-operator-form-dialog.el-dialog {
  display: flex;
  flex-direction: column;
  align-self: center;
  height: auto;
  max-height: 80vh;
  margin: auto !important;
  overflow: hidden;
}

.function-operator-form-dialog.el-dialog .el-dialog__header {
  flex-shrink: 0;
}

.function-operator-form-dialog.el-dialog .el-dialog__body {
  flex: 0 1 auto;
  min-height: 0;
  overflow: auto;
}

.function-operator-form-dialog.el-dialog .el-dialog__footer {
  flex-shrink: 0;
}
</style>
