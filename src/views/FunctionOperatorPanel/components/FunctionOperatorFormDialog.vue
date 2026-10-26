<template>
  <el-dialog
    :model-value="modelValue"
    class="function-operator-form-dialog"
    :title="operator ? '编辑函数算子' : '新建函数算子'"
    width="min(960px, calc(100vw - 48px))"
    align-center
    destroy-on-close
    :close-on-click-modal="false"
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

        <el-form-item label="上传接口文档">
          <div class="function-operator-form__upload-row">
            <el-upload
              :auto-upload="false"
              :show-file-list="false"
              accept=".json,.yaml,.yml,application/json,application/x-yaml,text/yaml"
              :disabled="externalApiDocUploading"
              :on-change="onExternalApiDocFileChange"
            >
              <el-button type="primary" plain native-type="button" :loading="externalApiDocUploading" :disabled="externalApiDocUploading">
                上传接口文档
              </el-button>
            </el-upload>
            <span class="function-operator-form__upload-hint">支持 OpenAPI / Swagger (.json / .yaml / .yml)</span>
            <span v-if="externalApiDocFileName" class="function-operator-form__upload-name">{{ externalApiDocFileName }}</span>
            <el-button v-if="externalApiDocFileName" link type="primary" native-type="button" @click="clearExternalApiDocFile">清除</el-button>
          </div>
        </el-form-item>
        <div class="function-operator-form__param-head">
          <div class="function-operator-form__section-title">已发现接口</div>
          <span class="function-operator-form__upload-hint">请勾选一条接口以回填入出参</span>
        </div>
        <el-table
          v-if="externalApiDiscoveredInterfaces.length > 0"
          class="function-operator-form__param-table"
          :data="externalApiDiscoveredInterfaces"
          :row-key="resolveExternalApiDiscoveredInterfaceRowKey"
          empty-text="暂无已发现接口"
        >
          <el-table-column width="52" label="">
            <template #default="{ row }">
              <el-radio
                :model-value="externalApiSelectedInterfaceKey"
                :value="resolveExternalApiDiscoveredInterfaceRowKey(row)"
                @change="onExternalApiDiscoveredInterfaceSelect(resolveExternalApiDiscoveredInterfaceRowKey(row))"
              />
            </template>
          </el-table-column>
          <el-table-column type="expand">
            <template #default="{ row }">
              <div class="function-operator-form__probe-expand">
                <div class="function-operator-form__section-subtitle">入参</div>
                <el-table
                  class="function-operator-form__param-table"
                  :data="row.inputParameters"
                  row-key="_rowKey"
                  :tree-props="{ children: 'fields' }"
                  default-expand-all
                  empty-text="暂无入参"
                >
                  <el-table-column prop="name" label="name" min-width="120" show-overflow-tooltip />
                  <el-table-column prop="in" label="in" width="88" />
                  <el-table-column label="required" width="88">
                    <template #default="{ row: paramRow }">
                      {{ paramRow.required ? "是" : "否" }}
                    </template>
                  </el-table-column>
                  <el-table-column prop="type" label="type" width="100" />
                  <el-table-column prop="description" label="description" min-width="160" show-overflow-tooltip />
                </el-table>
                <div class="function-operator-form__section-subtitle">出参</div>
                <el-table
                  class="function-operator-form__param-table"
                  :data="row.outputParameters"
                  row-key="_rowKey"
                  :tree-props="{ children: 'fields' }"
                  default-expand-all
                  empty-text="暂无出参"
                >
                  <el-table-column prop="name" label="name" min-width="120" show-overflow-tooltip />
                  <el-table-column prop="in" label="in" width="88" />
                  <el-table-column label="required" width="88">
                    <template #default="{ row: paramRow }">
                      {{ paramRow.required ? "是" : "否" }}
                    </template>
                  </el-table-column>
                  <el-table-column prop="type" label="type" width="100" />
                  <el-table-column prop="description" label="description" min-width="160" show-overflow-tooltip />
                </el-table>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="name" label="接口名称" min-width="140" show-overflow-tooltip />
          <el-table-column prop="method" label="请求方式" width="100" />
          <el-table-column prop="path" label="路径" min-width="140" show-overflow-tooltip />
          <el-table-column prop="description" label="说明" min-width="180" show-overflow-tooltip />
        </el-table>
        <el-empty v-else description="上传接口文档并探测后展示" />

        <div class="function-operator-form__param-head">
          <div class="function-operator-form__section-title">输入参数</div>
          <el-button type="primary" plain native-type="button" @click="addExternalApiInputParameter">添加</el-button>
        </div>
        <el-table
          class="function-operator-form__param-table"
          :data="externalApiInputParameters"
          row-key="id"
          :expand-row-keys="externalApiInputExpandKeys"
          empty-text="暂无输入参数"
        >
          <el-table-column type="expand">
            <template #default="{ row }">
              <FunctionOperatorExternalApiParamFieldsEditor
                v-if="resolveExternalApiParamRow(row).type === 'object'"
                :model-value="ensureExternalApiObjectFields(resolveExternalApiParamRow(row))"
                :type-options="EXTERNAL_API_PARAMETER_TYPE_OPTIONS"
                :create-field-id="createExternalApiNestedFieldId"
                @update:model-value="(next) => onExternalApiNestedFieldsChange(resolveExternalApiParamRow(row), next)"
              />
            </template>
          </el-table-column>
          <el-table-column label="name" min-width="140">
            <template #default="{ row }">
              <el-input v-model="row.name" maxlength="64" placeholder="请输入字段名称" />
            </template>
          </el-table-column>
          <el-table-column label="type" min-width="140">
            <template #default="{ row }">
              <el-select v-model="row.type" placeholder="请选择 type" @change="onExternalApiParameterTypeChange(resolveExternalApiParamRow(row))">
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
        <el-table
          class="function-operator-form__param-table"
          :data="externalApiOutputParameters"
          row-key="id"
          :expand-row-keys="externalApiOutputExpandKeys"
          empty-text="暂无输出参数"
        >
          <el-table-column type="expand">
            <template #default="{ row }">
              <FunctionOperatorExternalApiParamFieldsEditor
                v-if="resolveExternalApiParamRow(row).type === 'object'"
                :model-value="ensureExternalApiObjectFields(resolveExternalApiParamRow(row))"
                :type-options="EXTERNAL_API_PARAMETER_TYPE_OPTIONS"
                :create-field-id="createExternalApiNestedFieldId"
                @update:model-value="(next) => onExternalApiNestedFieldsChange(resolveExternalApiParamRow(row), next)"
              />
            </template>
          </el-table-column>
          <el-table-column label="name" min-width="160">
            <template #default="{ row }">
              <el-input v-model="row.name" maxlength="64" placeholder="请输入字段名称" />
            </template>
          </el-table-column>
          <el-table-column label="type" min-width="160">
            <template #default="{ row }">
              <el-select v-model="row.type" placeholder="请选择 type" @change="onExternalApiParameterTypeChange(resolveExternalApiParamRow(row))">
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
      </section>

      <section v-else-if="form.type === 'docker'" class="function-operator-form__section">
        <div class="function-operator-form__section-title">通用配置</div>
        <el-form-item label="函数名称" prop="name">
          <el-input v-model="form.name" maxlength="64" placeholder="例如：目标识别算子" :disabled="Boolean(operator)" />
        </el-form-item>
        <el-form-item label="版本">
          <el-input :model-value="form.version" disabled />
        </el-form-item>
        <el-form-item label="API名称" prop="functionApi">
          <el-input v-model="form.functionApi" maxlength="64" placeholder="例如：TargetDetectFn" :disabled="Boolean(operator)" />
        </el-form-item>
        <el-form-item label="调用协议" prop="protocol">
          <el-select v-model="form.protocol" placeholder="请选择调用协议" :disabled="Boolean(operator)">
            <el-option v-for="item in PROTOCOL_OPTIONS" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="函数说明" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" maxlength="240" show-word-limit />
        </el-form-item>

        <template v-if="!operator">
          <div class="function-operator-form__section-title">容器算子函数配置</div>
          <el-form-item label="上传镜像">
            <div class="function-operator-form__upload-row">
              <el-upload
                :auto-upload="false"
                :show-file-list="false"
                :disabled="dockerImageUploading"
                accept=".tar,.tar.gz,.tgz"
                :on-change="onDockerImageFileChange"
              >
                <el-button type="primary" plain native-type="button" :loading="dockerImageUploading" :disabled="dockerImageUploading">上传镜像</el-button>
              </el-upload>
              <span class="function-operator-form__upload-hint">支持 .tar / .tar.gz / .tgz</span>
              <span v-if="dockerImageFileName" class="function-operator-form__upload-name">{{ dockerImageFileName }}</span>
              <el-button v-if="dockerImageFileName" link type="primary" native-type="button" @click="clearDockerImageFile">清除</el-button>
            </div>
          </el-form-item>
          <el-form-item label="上传接口文档">
            <div class="function-operator-form__upload-row">
              <el-upload
                :auto-upload="false"
                :show-file-list="false"
                :disabled="dockerApiDocUploading"
                accept=".json,.yaml,.yml"
                :on-change="onDockerApiDocFileChange"
              >
                <el-button type="primary" plain native-type="button" :loading="dockerApiDocUploading" :disabled="dockerApiDocUploading">
                  上传接口文档
                </el-button>
              </el-upload>
              <span class="function-operator-form__upload-hint">支持 OpenAPI / Swagger (.json / .yaml / .yml)</span>
              <span v-if="dockerApiDocFileName" class="function-operator-form__upload-name">{{ dockerApiDocFileName }}</span>
              <el-button v-if="dockerApiDocFileName" link type="primary" native-type="button" @click="clearDockerApiDocFile">清除</el-button>
            </div>
          </el-form-item>
          <el-form-item label="启动命令">
            <el-input v-model="dockerStartupCommand" maxlength="500" placeholder="python /app/main.py" />
          </el-form-item>
          <div class="function-operator-form__param-head">
            <div class="function-operator-form__section-title">已发现接口</div>
            <span class="function-operator-form__upload-hint">请选择本算子绑定的接口</span>
          </div>
          <el-table
            v-if="dockerDiscoveredInterfaces.length > 0"
            class="function-operator-form__param-table"
            :data="dockerDiscoveredInterfaces"
            :row-key="resolveDockerDiscoveredInterfaceRowKey"
            empty-text="暂无已发现接口"
            @selection-change="onDockerDiscoveredInterfacesSelectionChange"
          >
            <el-table-column type="selection" width="48" />
            <el-table-column type="expand">
              <template #default="{ row }">
                <div class="function-operator-form__probe-expand">
                  <div class="function-operator-form__section-subtitle">入参</div>
                  <el-table
                    class="function-operator-form__param-table"
                    :data="row.inputParameters"
                    row-key="_rowKey"
                    :tree-props="{ children: 'fields' }"
                    default-expand-all
                    empty-text="暂无入参"
                  >
                    <el-table-column prop="name" label="name" min-width="120" show-overflow-tooltip />
                    <el-table-column prop="in" label="in" width="88" />
                    <el-table-column label="required" width="88">
                      <template #default="{ row: paramRow }">
                        {{ paramRow.required ? "是" : "否" }}
                      </template>
                    </el-table-column>
                    <el-table-column prop="type" label="type" width="100" />
                    <el-table-column prop="description" label="description" min-width="160" show-overflow-tooltip />
                  </el-table>
                  <div class="function-operator-form__section-subtitle">出参</div>
                  <el-table
                    class="function-operator-form__param-table"
                    :data="row.outputParameters"
                    row-key="_rowKey"
                    :tree-props="{ children: 'fields' }"
                    default-expand-all
                    empty-text="暂无出参"
                  >
                    <el-table-column prop="name" label="name" min-width="120" show-overflow-tooltip />
                    <el-table-column prop="in" label="in" width="88" />
                    <el-table-column label="required" width="88">
                      <template #default="{ row: paramRow }">
                        {{ paramRow.required ? "是" : "否" }}
                      </template>
                    </el-table-column>
                    <el-table-column prop="type" label="type" width="100" />
                    <el-table-column prop="description" label="description" min-width="160" show-overflow-tooltip />
                  </el-table>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="name" label="接口名称" min-width="140" show-overflow-tooltip />
            <el-table-column prop="method" label="请求方式" width="100" />
            <el-table-column prop="path" label="路径" min-width="140" show-overflow-tooltip />
            <el-table-column prop="description" label="说明" min-width="180" show-overflow-tooltip />
          </el-table>
          <el-empty v-else description="上传接口文档并探测后展示" />
        </template>
      </section>

      <section v-else class="function-operator-form__section function-operator-form__section--empty">
        <el-empty description="该函数类型本阶段暂未开放，请选择基础函数、脚本函数、外部 API、容器算子或函数编排" />
      </section>
    </el-form>

    <template #footer>
      <el-button @click="emit('update:modelValue', false)">取消</el-button>
      <el-button v-if="form.type === 'composite' || form.type === 'code'" type="primary" :loading="loading" @click="goGeneralConfigNextStep">下一步</el-button>
      <el-button
        v-else
        type="primary"
        :loading="loading"
        :disabled="form.type !== 'basic' && form.type !== 'api' && form.type !== 'docker'"
        @click="submitCurrentDraft"
      >
        保存
      </el-button>
    </template>
  </el-dialog>

  <FunctionOperatorScriptIdeDialog
    :model-value="scriptIdeVisible"
    v-model:code="scriptDraftCode"
    v-model:language="scriptDraftLanguage"
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
    :description="form.description"
    :composite-config="form.type === 'composite' ? form.compositeConfig : undefined"
    :saving="loading"
    @save="emitSaveComposite"
  />
</template>

<script setup lang="ts">
import { computed, nextTick, reactive, ref, toRaw, watch } from "vue";
import type { FormInstance, FormRules, UploadFile } from "element-plus";
import { ElMessage } from "element-plus";

import {
  getOntologyFunctionDetailInterface,
  getOntologyFunctionListInterface,
  getOntologyFunctionVersionsInterface,
  postProbeOntologyFunctionContainerInterfacesInterface,
  postUploadOntologyFunctionContainerDocInterface,
  postUploadOntologyFunctionContainerImageInterface,
} from "@/apis";
import {
  FUNCTION_OPERATOR_AGG_FUNC_OPTIONS,
  FUNCTION_OPERATOR_TYPE_OPTIONS,
  type CreateOntologyFunctionContainerParams,
  type CreateOntologyFunctionParams,
  type FunctionOperator,
  type FunctionOperatorDraft,
  type FunctionOperatorProtocol,
  type FunctionOperatorScriptLanguage,
  type FunctionOperatorType,
  type GetOntologyFunctionListItem,
  type ParseOntologyFunctionParamItem,
  type ProbeOntologyFunctionContainerInterfaceItem,
  type ProbeOntologyFunctionContainerInterfaceParameter,
  type UploadOntologyFunctionContainerDocData,
  type UploadOntologyFunctionContainerImageData,
} from "@/types";

/** 探查参数树展示行：在契约字段上附加稳定 _rowKey。 */
type ProbeContainerParamTreeRow = ProbeOntologyFunctionContainerInterfaceParameter & {
  _rowKey: string;
  fields?: ProbeContainerParamTreeRow[];
};

/** 探查接口展示项：入出参带树表 row-key。 */
type ProbeContainerInterfaceDisplayItem = Omit<ProbeOntologyFunctionContainerInterfaceItem, "inputParameters" | "outputParameters"> & {
  inputParameters: ProbeContainerParamTreeRow[];
  outputParameters: ProbeContainerParamTreeRow[];
};
import {
  createEmptyBasicFilterDocument,
  parseBasicFilterConfig,
  stringifyBasicFilterConfig,
  validateBasicFilterDocument,
} from "@/utils/functionOperatorBasicFilter";
import { mapFunctionOperatorTypeToApi } from "@/utils/mapFunctionOperatorTypeToApi";
import { mapOntologyExternalApiConfigToForm, mapOntologyFunctionDetailToDraft, type OntologyExternalApiFormField } from "@/utils/mapOntologyFunctionDetail";
import { mapProbeInterfaceToExternalApiFormParams } from "@/utils/mapProbeInterfaceToExternalApiForm";

import FunctionOperatorBasicFilterBuilder from "./FunctionOperatorBasicFilterBuilder.vue";
import FunctionOperatorCompositeWorkflowDialog from "./FunctionOperatorCompositeWorkflowDialog.vue";
import FunctionOperatorExternalApiParamFieldsEditor, { type ExternalApiParamFieldRow } from "./FunctionOperatorExternalApiParamFieldsEditor.vue";
import FunctionOperatorScriptIdeDialog from "./FunctionOperatorScriptIdeDialog.vue";
import { createDefaultScriptFunctionCode, DEFAULT_SCRIPT_FUNCTION_LANGUAGE } from "../utils/scriptFunctionStarters";
import { buildCreateOntologyExternalFunctionParams } from "../utils/buildCreateOntologyExternalFunctionParams";
import { buildCreateOntologyFunctionContainerParams } from "../utils/buildCreateOntologyFunctionContainerParams";
import { mapOperatorParametersToScriptParamTree } from "../utils/mapOperatorParametersToScriptParamTree";

const PROTOCOL_OPTIONS: ReadonlyArray<Extract<FunctionOperatorProtocol, "HTTP">> = ["HTTP"];
const EXTERNAL_API_METHOD_OPTIONS = ["GET", "POST", "PUT", "DELETE"] as const;
const EXTERNAL_API_AUTH_OPTIONS = [
  { value: "none", label: "无认证" },
  { value: "apiKey", label: "API Key" },
] as const;
const EXTERNAL_API_PARAMETER_TYPE_OPTIONS = ["string", "number", "boolean", "array", "object"] as const;
const EXTERNAL_API_PARAMETER_LOCATION_OPTIONS = ["Body", "Path", "Query", "Header"] as const;

/** 外部 API 输入参数行；object 可嵌套 fields。 */
interface ExternalApiInputParameterRow extends ExternalApiParamFieldRow {
  location: (typeof EXTERNAL_API_PARAMETER_LOCATION_OPTIONS)[number];
  required: "yes" | "no";
}

/** 外部 API 输出参数行；object 可嵌套 fields。 */
type ExternalApiOutputParameterRow = ExternalApiParamFieldRow;

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
/** 外部 API 输入参数，仅表单展示。 */
const externalApiInputParameters = ref<ExternalApiInputParameterRow[]>([]);
/** 外部 API 输出参数，仅表单展示。 */
const externalApiOutputParameters = ref<ExternalApiOutputParameterRow[]>([]);
/** object 输入行自动展开，便于编辑嵌套属性。 */
const externalApiInputExpandKeys = computed(() => externalApiInputParameters.value.filter((row) => row.type === "object").map((row) => row.id));
/** object 输出行自动展开，便于编辑嵌套属性。 */
const externalApiOutputExpandKeys = computed(() => externalApiOutputParameters.value.filter((row) => row.type === "object").map((row) => row.id));
let externalApiParameterSerial = 0;
/** 外部 API 已选接口文档文件名，仅表单展示。 */
const externalApiDocFileName = ref("");
/** 外部 API 接口文档是否正在上传或随后探查。 */
const externalApiDocUploading = ref(false);
/** 外部 API 探查得到的已发现接口列表。 */
const externalApiDiscoveredInterfaces = ref<ProbeContainerInterfaceDisplayItem[]>([]);
/** 外部 API 当前单选的已发现接口 row-key。 */
const externalApiSelectedInterfaceKey = ref("");
/** 外部 API 接口文档上传/探查代数，用于丢弃过期响应。 */
let externalApiDocUploadGeneration = 0;

/** 容器算子已选镜像文件名，仅表单展示。 */
const dockerImageFileName = ref("");
/** 上传镜像接口返回的完整镜像信息，供保存回填。 */
const dockerImageInfo = ref<UploadOntologyFunctionContainerImageData | null>(null);
/** 容器算子镜像是否正在上传。 */
const dockerImageUploading = ref(false);
/** 容器算子已选接口文档文件名，仅表单展示。 */
const dockerApiDocFileName = ref("");
/** 上传接口文档返回的完整文档信息，供探查与保存回填。 */
const dockerInterfaceDoc = ref<UploadOntologyFunctionContainerDocData | null>(null);
/** 容器算子接口文档是否正在上传或随后探查。 */
const dockerApiDocUploading = ref(false);
/** 探查得到的已发现接口列表（入出参已注入树表 _rowKey）。 */
const dockerDiscoveredInterfaces = ref<ProbeContainerInterfaceDisplayItem[]>([]);
/** 多选绑定的接口 api 标识列表。 */
const dockerSelectedInterfaceApis = ref<string[]>([]);
/** 容器算子启动命令（完整 docker run），映射为 runCommand。 */
const dockerStartupCommand = ref("");
/** 镜像上传代数，用于丢弃过期响应。 */
let dockerImageUploadGeneration = 0;
/** 接口文档上传/探查代数，用于丢弃过期响应。 */
let dockerApiDocUploadGeneration = 0;

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
  "save-container": [params: CreateOntologyFunctionContainerParams];
  "save-composite": [params: CreateOntologyFunctionParams];
}>();

/**
 * @description 将脚本 IDE 组装的创建请求转发给工作区保存。
 * @param params CUSTOMIZE 创建参数。
 */
function emitSaveScript(params: CreateOntologyFunctionParams): void {
  emit("save-script", params);
}

/**
 * @description 将编排画布组装的创建请求转发给工作区保存。
 * @param params COMPOSITE 创建参数。
 */
function emitSaveComposite(params: CreateOntologyFunctionParams): void {
  emit("save-composite", params);
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
 * @description 用详情 apiConfig 回填外部 API 表单。配置里的输入或输出为空时，改用详情 params。没有配置时清空这些字段。
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
    ...mapExternalApiFormFieldWithIds(row, "input"),
    location: row.location,
    required: row.required,
  }));
  externalApiOutputParameters.value = formValues.outputs.map((row) => mapExternalApiFormFieldWithIds(row, "output"));
}
/**
 * @description 清空外部 API 表单中的接口地址、请求方法、认证方式、Header、文档探查与参数行。
 */
function resetExternalApiForm(): void {
  externalApiDocUploadGeneration += 1;
  externalApiEndpoint.value = "";
  externalApiMethod.value = "POST";
  externalApiAuth.value = "none";
  externalApiHeaderKey.value = "";
  externalApiHeader.value = "";
  externalApiInputParameters.value = [];
  externalApiOutputParameters.value = [];
  externalApiDocFileName.value = "";
  externalApiDocUploading.value = false;
  externalApiDiscoveredInterfaces.value = [];
  externalApiSelectedInterfaceKey.value = "";
}

/**
 * @description 清空容器算子表单中的镜像、接口文档与启动命令本地状态，并取消进行中的上传代数。
 */
function resetDockerOperatorForm(): void {
  dockerImageUploadGeneration += 1;
  dockerApiDocUploadGeneration += 1;
  dockerImageFileName.value = "";
  dockerImageInfo.value = null;
  dockerImageUploading.value = false;
  dockerApiDocFileName.value = "";
  dockerInterfaceDoc.value = null;
  dockerApiDocUploading.value = false;
  dockerDiscoveredInterfaces.value = [];
  dockerSelectedInterfaceApis.value = [];
  dockerStartupCommand.value = "";
}

/**
 * @description 判断文件名是否为允许的容器镜像包扩展名。
 * @param fileName 文件名。
 * @returns 是否为 .tar / .tar.gz / .tgz。
 */
function isDockerImageFileName(fileName: string): boolean {
  const lower = fileName.trim().toLowerCase();
  return lower.endsWith(".tar.gz") || lower.endsWith(".tgz") || lower.endsWith(".tar");
}

/**
 * @description 判断文件名是否为允许的接口文档扩展名。
 * @param fileName 文件名。
 * @returns 是否为 .json / .yaml / .yml。
 */
function isDockerApiDocFileName(fileName: string): boolean {
  const lower = fileName.trim().toLowerCase();
  return lower.endsWith(".json") || lower.endsWith(".yaml") || lower.endsWith(".yml");
}

/**
 * @description 选择镜像文件：校验扩展名后调用上传接口；成功保留镜像信息并提示上传成功。
 * @param uploadFile Element Plus 上传文件。
 */
async function onDockerImageFileChange(uploadFile: UploadFile): Promise<void> {
  const name = typeof uploadFile.name === "string" ? uploadFile.name.trim() : "";
  const rawFile = uploadFile.raw;
  if (!name || !isDockerImageFileName(name) || !rawFile) {
    ElMessage.warning("请选择 .tar / .tar.gz / .tgz 镜像文件");
    return;
  }
  if (dockerImageUploading.value) {
    return;
  }
  dockerImageUploading.value = true;
  const current = ++dockerImageUploadGeneration;
  try {
    const response = await postUploadOntologyFunctionContainerImageInterface({ file: rawFile });
    if (current !== dockerImageUploadGeneration) {
      return;
    }
    const imagePath = typeof response.data?.path === "string" ? response.data.path.trim() : "";
    if (response.code !== 200 || !response.data || !imagePath) {
      dockerImageFileName.value = "";
      dockerImageInfo.value = null;
      ElMessage.error(response.message.trim() || "镜像上传失败");
      return;
    }
    dockerImageFileName.value = name;
    dockerImageInfo.value = response.data;
    ElMessage.success("上传成功");
  } catch (cause) {
    if (current !== dockerImageUploadGeneration) {
      return;
    }
    dockerImageFileName.value = "";
    dockerImageInfo.value = null;
    ElMessage.error(cause instanceof Error && cause.message.trim() ? cause.message : "镜像上传失败");
  } finally {
    if (current === dockerImageUploadGeneration) {
      dockerImageUploading.value = false;
    }
  }
}

/**
 * @description 清除已选镜像文件名与镜像信息。
 */
function clearDockerImageFile(): void {
  dockerImageFileName.value = "";
  dockerImageInfo.value = null;
}

/**
 * @description 选择接口文档：校验扩展名后上传；成功保存文档信息并自动探查，结果写入已发现接口表格。
 * @param uploadFile Element Plus 上传文件。
 */
async function onDockerApiDocFileChange(uploadFile: UploadFile): Promise<void> {
  const name = typeof uploadFile.name === "string" ? uploadFile.name.trim() : "";
  const rawFile = uploadFile.raw;
  if (!name || !isDockerApiDocFileName(name) || !rawFile) {
    ElMessage.warning("请选择 OpenAPI / Swagger（.json / .yaml / .yml）文件");
    return;
  }
  if (dockerApiDocUploading.value) {
    return;
  }
  dockerApiDocUploading.value = true;
  const current = ++dockerApiDocUploadGeneration;
  let docPath = "";
  try {
    try {
      const response = await postUploadOntologyFunctionContainerDocInterface({ file: rawFile });
      if (current !== dockerApiDocUploadGeneration) {
        return;
      }
      docPath = typeof response.data?.path === "string" ? response.data.path.trim() : "";
      if (response.code !== 200 || !response.data || !docPath) {
        dockerApiDocFileName.value = "";
        dockerInterfaceDoc.value = null;
        dockerDiscoveredInterfaces.value = [];
        dockerSelectedInterfaceApis.value = [];
        ElMessage.error(response.message.trim() || "接口文档上传失败");
        return;
      }
      dockerApiDocFileName.value = name;
      dockerInterfaceDoc.value = response.data;
      ElMessage.success("上传成功");
    } catch (cause) {
      if (current !== dockerApiDocUploadGeneration) {
        return;
      }
      dockerApiDocFileName.value = "";
      dockerInterfaceDoc.value = null;
      dockerDiscoveredInterfaces.value = [];
      dockerSelectedInterfaceApis.value = [];
      ElMessage.error(cause instanceof Error && cause.message.trim() ? cause.message : "接口文档上传失败");
      return;
    }

    try {
      const probeResponse = await postProbeOntologyFunctionContainerInterfacesInterface({ docPath });
      if (current !== dockerApiDocUploadGeneration) {
        return;
      }
      if (probeResponse.code !== 200) {
        ElMessage.error(probeResponse.message.trim() || "接口探查失败");
        return;
      }
      dockerDiscoveredInterfaces.value = Array.isArray(probeResponse.data) ? probeResponse.data.map((item) => mapProbeContainerInterfaceForDisplay(item)) : [];
      dockerSelectedInterfaceApis.value = [];
    } catch (cause) {
      if (current !== dockerApiDocUploadGeneration) {
        return;
      }
      ElMessage.error(cause instanceof Error && cause.message.trim() ? cause.message : "接口探查失败");
    }
  } finally {
    if (current === dockerApiDocUploadGeneration) {
      dockerApiDocUploading.value = false;
    }
  }
}

/**
 * @description 为探查参数树递归注入稳定 _rowKey，供树表展开。
 * @param params 探查参数列表。
 * @param prefix 路径前缀。
 * @returns 带 _rowKey 的参数树。
 */
function mapProbeContainerParamsForDisplay(params: ProbeOntologyFunctionContainerInterfaceParameter[], prefix = ""): ProbeContainerParamTreeRow[] {
  return params.map((param, index) => {
    const _rowKey = `${prefix}${index}-${param.name}`;
    const row: ProbeContainerParamTreeRow = {
      name: param.name,
      in: param.in,
      required: param.required,
      type: param.type,
      description: param.description,
      _rowKey,
    };
    if (Array.isArray(param.fields) && param.fields.length > 0) {
      row.fields = mapProbeContainerParamsForDisplay(param.fields, `${_rowKey}.`);
    }
    return row;
  });
}

/**
 * @description 将探查接口项映射为树表展示结构。
 * @param item 探查接口项。
 * @returns 带参数树 row-key 的展示项。
 */
function mapProbeContainerInterfaceForDisplay(item: ProbeOntologyFunctionContainerInterfaceItem): ProbeContainerInterfaceDisplayItem {
  return {
    ...item,
    inputParameters: mapProbeContainerParamsForDisplay(item.inputParameters ?? []),
    outputParameters: mapProbeContainerParamsForDisplay(item.outputParameters ?? []),
  };
}

/**
 * @description 解析已发现接口行的稳定 row-key；优先使用 api，否则回退 method+path+name。
 * @param row 探查接口项。
 * @returns 行键。
 */
function resolveDockerDiscoveredInterfaceRowKey(row: ProbeOntologyFunctionContainerInterfaceItem): string {
  const api = typeof row.api === "string" ? row.api.trim() : "";
  if (api) {
    return api;
  }
  return `${row.method.trim()} ${row.path.trim()} ${row.name.trim()}`.trim();
}

/**
 * @description 同步已发现接口多选绑定结果到本地选中 api 列表。
 * @param selection 当前选中行。
 */
function onDockerDiscoveredInterfacesSelectionChange(selection: ProbeContainerInterfaceDisplayItem[]): void {
  dockerSelectedInterfaceApis.value = selection.map((item) => resolveDockerDiscoveredInterfaceRowKey(item));
}

/**
 * @description 清除已选接口文档、文档信息与探查结果。
 */
function clearDockerApiDocFile(): void {
  dockerApiDocFileName.value = "";
  dockerInterfaceDoc.value = null;
  dockerDiscoveredInterfaces.value = [];
  dockerSelectedInterfaceApis.value = [];
}

/**
 * @description 解析外部 API 已发现接口行的稳定 row-key；表格槽位行按对象收窄。
 * @param row 探查接口项或表格行。
 * @returns 行键。
 */
function resolveExternalApiDiscoveredInterfaceRowKey(row: unknown): string {
  if (!row || typeof row !== "object") {
    return "";
  }
  return resolveDockerDiscoveredInterfaceRowKey(row as ProbeOntologyFunctionContainerInterfaceItem);
}

/**
 * @description 将选中的探查接口回填到外部 API 入出参表，并同步可识别的请求方法。
 * @param item 探查接口展示项。
 */
function applyExternalApiDiscoveredInterface(item: ProbeContainerInterfaceDisplayItem): void {
  const mapped = mapProbeInterfaceToExternalApiFormParams(item);
  externalApiInputParameters.value = mapped.inputs.map((row) => ({
    ...mapExternalApiFormFieldWithIds(row, "input"),
    location: row.location,
    required: row.required,
  }));
  externalApiOutputParameters.value = mapped.outputs.map((row) => mapExternalApiFormFieldWithIds(row, "output"));
  if (mapped.method) {
    externalApiMethod.value = mapped.method;
  }
}

/**
 * @description 单选已发现接口：按 row-key 回填入出参。
 * @param key 选中行键。
 */
function onExternalApiDiscoveredInterfaceSelect(key: string | number | boolean | undefined): void {
  const selectedKey = typeof key === "string" ? key : "";
  externalApiSelectedInterfaceKey.value = selectedKey;
  if (!selectedKey) {
    return;
  }
  const selected = externalApiDiscoveredInterfaces.value.find((item) => resolveExternalApiDiscoveredInterfaceRowKey(item) === selectedKey);
  if (!selected) {
    return;
  }
  applyExternalApiDiscoveredInterface(selected);
}

/**
 * @description 选择外部 API 接口文档：上传后自动探查；仅 1 条结果时自动选中回填。
 * @param upload 上传组件文件对象。
 */
async function onExternalApiDocFileChange(upload: UploadFile): Promise<void> {
  const rawFile = upload.raw;
  if (!rawFile) {
    return;
  }
  const name = typeof rawFile.name === "string" ? rawFile.name : "";
  if (!isDockerApiDocFileName(name)) {
    ElMessage.warning("请选择 OpenAPI / Swagger（.json / .yaml / .yml）文件");
    return;
  }
  if (externalApiDocUploading.value) {
    return;
  }
  externalApiDocUploading.value = true;
  const current = ++externalApiDocUploadGeneration;
  let docPath = "";
  try {
    const response = await postUploadOntologyFunctionContainerDocInterface({ file: rawFile });
    if (current !== externalApiDocUploadGeneration) {
      return;
    }
    if (response.code !== 200 || !response.data) {
      externalApiDocFileName.value = "";
      externalApiDiscoveredInterfaces.value = [];
      externalApiSelectedInterfaceKey.value = "";
      ElMessage.error(response.message.trim() || "接口文档上传失败");
      return;
    }
    externalApiDocFileName.value = name;
    docPath = response.data.path;
    ElMessage.success("上传成功");
  } catch (cause) {
    if (current !== externalApiDocUploadGeneration) {
      return;
    }
    externalApiDocFileName.value = "";
    externalApiDiscoveredInterfaces.value = [];
    externalApiSelectedInterfaceKey.value = "";
    ElMessage.error(cause instanceof Error && cause.message.trim() ? cause.message : "接口文档上传失败");
    return;
  }

  try {
    const probeResponse = await postProbeOntologyFunctionContainerInterfacesInterface({ docPath });
    if (current !== externalApiDocUploadGeneration) {
      return;
    }
    if (probeResponse.code !== 200) {
      externalApiDiscoveredInterfaces.value = [];
      externalApiSelectedInterfaceKey.value = "";
      ElMessage.error(probeResponse.message.trim() || "接口探查失败");
      return;
    }
    const discovered = Array.isArray(probeResponse.data) ? probeResponse.data.map((item) => mapProbeContainerInterfaceForDisplay(item)) : [];
    externalApiDiscoveredInterfaces.value = discovered;
    if (discovered.length === 1 && discovered[0]) {
      const onlyKey = resolveExternalApiDiscoveredInterfaceRowKey(discovered[0]);
      externalApiSelectedInterfaceKey.value = onlyKey;
      applyExternalApiDiscoveredInterface(discovered[0]);
    } else {
      externalApiSelectedInterfaceKey.value = "";
    }
  } catch (cause) {
    if (current !== externalApiDocUploadGeneration) {
      return;
    }
    externalApiDiscoveredInterfaces.value = [];
    externalApiSelectedInterfaceKey.value = "";
    ElMessage.error(cause instanceof Error && cause.message.trim() ? cause.message : "接口探查失败");
  } finally {
    if (current === externalApiDocUploadGeneration) {
      externalApiDocUploading.value = false;
    }
  }
}

/**
 * @description 清除外部 API 已选接口文档与探查结果；不强制清空入出参表。
 */
function clearExternalApiDocFile(): void {
  externalApiDocUploadGeneration += 1;
  externalApiDocFileName.value = "";
  externalApiDocUploading.value = false;
  externalApiDiscoveredInterfaces.value = [];
  externalApiSelectedInterfaceKey.value = "";
}

/**
 * @description 生成外部 API 参数行的列表键。
 * @param prefix 输入或输出前缀。
 * @returns 不重复的行 id。
 */
function createExternalApiParameterId(prefix: "input" | "output" | "field"): string {
  externalApiParameterSerial += 1;
  return `${prefix}-${externalApiParameterSerial}`;
}

/**
 * @description 生成嵌套属性行 id，供递归编辑组件使用。
 * @returns 不重复的嵌套行 id。
 */
function createExternalApiNestedFieldId(): string {
  return createExternalApiParameterId("field");
}

/**
 * @description 将回填字段树转为带稳定 id 的表单行；object 递归挂 fields。
 * @param row 回填字段。
 * @param prefix 输入或输出前缀。
 * @returns 带 id 的表单行。
 */
function mapExternalApiFormFieldWithIds(row: OntologyExternalApiFormField, prefix: "input" | "output"): ExternalApiParamFieldRow {
  const mapped: ExternalApiParamFieldRow = {
    id: createExternalApiParameterId(prefix),
    name: row.name,
    type: row.type,
    description: row.description,
  };
  if (row.type === "object" && Array.isArray(row.fields) && row.fields.length > 0) {
    mapped.fields = row.fields.map((child) => mapExternalApiFormFieldWithIds(child, prefix));
  }
  return mapped;
}

/**
 * @description 将 el-table 槽位行收窄为外部 API 参数行；校验 id / name / type / description 字段形态。
 * @param row 表格行。
 * @returns 外部 API 参数行。
 */
function resolveExternalApiParamRow(row: unknown): ExternalApiParamFieldRow {
  if (!row || typeof row !== "object") {
    throw new Error("invalid external api param row");
  }
  const candidate = row as Partial<ExternalApiParamFieldRow>;
  if (
    typeof candidate.id !== "string" ||
    typeof candidate.name !== "string" ||
    typeof candidate.type !== "string" ||
    typeof candidate.description !== "string"
  ) {
    throw new Error("invalid external api param row");
  }
  return candidate as ExternalApiParamFieldRow;
}

/**
 * @description 保证 object 行具备可编辑的 fields 数组引用。
 * @param row 顶层参数行。
 * @returns fields 数组。
 */
function ensureExternalApiObjectFields(row: ExternalApiParamFieldRow): ExternalApiParamFieldRow[] {
  if (!row.fields) {
    row.fields = [];
  }
  return row.fields;
}

/**
 * @description 同步嵌套 fields 变更到顶层参数行。
 * @param row 顶层参数行。
 * @param next 嵌套 fields。
 */
function onExternalApiNestedFieldsChange(row: ExternalApiParamFieldRow, next: ExternalApiParamFieldRow[]): void {
  row.fields = next;
}

/**
 * @description 顶层参数 type 变更时，非 object 清空 fields，object 初始化空 fields。
 * @param row 顶层参数行。
 */
function onExternalApiParameterTypeChange(row: ExternalApiParamFieldRow): void {
  if (row.type !== "object") {
    delete row.fields;
    return;
  }
  if (!row.fields) {
    row.fields = [];
  }
}

/**
 * @description 递归校验 object 下级属性：同级 name 非空且不重复。
 * @param fields 嵌套属性行。
 * @param parentLabel 父级路径文案，用于错误提示。
 * @returns 错误文案；通过时返回空串。
 */
function validateExternalApiNestedFields(fields: ExternalApiParamFieldRow[] | undefined, parentLabel: string): string {
  if (!Array.isArray(fields) || fields.length === 0) {
    return "";
  }
  const seen = new Set<string>();
  for (const field of fields) {
    const name = field.name.trim();
    if (!name) {
      return `${parentLabel}下存在未填写名称的属性`;
    }
    if (seen.has(name)) {
      return `${parentLabel}下属性名称重复：${name}`;
    }
    seen.add(name);
    if (field.type === "object") {
      const nestedError = validateExternalApiNestedFields(field.fields, `${parentLabel}.${name}`);
      if (nestedError) {
        return nestedError;
      }
    }
  }
  return "";
}

/**
 * @description 校验外部 API 输入、输出中 object 嵌套属性。
 * @returns 错误文案；通过时返回空串。
 */
function validateExternalApiParameterTrees(): string {
  for (const row of externalApiInputParameters.value) {
    if (row.type !== "object") {
      continue;
    }
    const label = row.name.trim() || "输入参数";
    const error = validateExternalApiNestedFields(row.fields, label);
    if (error) {
      return error;
    }
  }
  for (const row of externalApiOutputParameters.value) {
    if (row.type !== "object") {
      continue;
    }
    const label = row.name.trim() || "输出参数";
    const error = validateExternalApiNestedFields(row.fields, label);
    if (error) {
      return error;
    }
  }
  return "";
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

/** 按函数类型切换校验文案；编排、脚本、外部 API 与容器算子额外校验协议与说明；容器算子不校验版本。 */
const rules = computed<FormRules>(() => {
  if (form.type === "docker") {
    return {
      name: [{ required: true, message: "请输入函数名称", trigger: "blur" }],
      functionApi: [{ required: true, message: "请输入API名称", trigger: "blur" }],
      protocol: [{ required: true, message: "请选择调用协议", trigger: "change" }],
      description: [{ required: true, message: "请输入函数说明", trigger: "blur" }],
    };
  }
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
  } else if (type === "docker") {
    next.protocol = "HTTP";
    next.version = "1.0.0";
    next.definition = { kind: "docker" };
  } else {
    next.definition = { kind: type };
  }
  resetExternalApiForm();
  resetDockerOperatorForm();
  Object.assign(form, next);
  delete form.id;
  delete form.compositeConfig;
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
  const filterDoc = parseBasicFilterConfig(form.definition.parameterConfig);
  const filterError = validateBasicFilterDocument(filterDoc);
  if (filterError) {
    ElMessage.warning(filterError);
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
    sourceVersion: props.operator ? "" : sourceVersion.value.trim(),
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
  const nestedFieldsError = validateExternalApiParameterTrees();
  if (nestedFieldsError) {
    ElMessage.warning(nestedFieldsError);
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
 * @description 校验容器算子配置后组装创建参数并发给工作区保存。
 */
async function submitDockerOperator(): Promise<void> {
  if (form.type !== "docker") {
    return;
  }
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) {
    return;
  }
  const image = dockerImageInfo.value;
  if (!image?.path.trim()) {
    ElMessage.warning("请先上传镜像");
    return;
  }
  const runCommand = dockerStartupCommand.value.trim();
  if (!runCommand) {
    ElMessage.warning("请填写启动命令");
    return;
  }
  const selectedKeySet = new Set(dockerSelectedInterfaceApis.value);
  const selectedInterfaces = dockerDiscoveredInterfaces.value.filter((item) => selectedKeySet.has(resolveDockerDiscoveredInterfaceRowKey(item)));
  if (selectedInterfaces.length === 0) {
    ElMessage.warning("请至少勾选一条已发现接口");
    return;
  }
  emit(
    "save-container",
    buildCreateOntologyFunctionContainerParams({
      functionApi: form.functionApi,
      version: form.version,
      displayName: form.name,
      description: form.description,
      ontologySpaceId: form.spaceId,
      image,
      interfaceDoc: dockerInterfaceDoc.value,
      runCommand,
      selectedInterfaces,
    }),
  );
}

/**
 * @description 按当前函数类型提交基础函数、外部 API 或容器算子函数。
 */
function submitCurrentDraft(): void {
  if (form.type === "api") {
    void submitExternalApi();
    return;
  }
  if (form.type === "docker") {
    void submitDockerOperator();
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
      resetDockerOperatorForm();
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
    if (next.type === "composite" && next.compositeConfig) {
      form.compositeConfig = next.compositeConfig;
    } else {
      delete form.compositeConfig;
    }
    if (next.definition.kind === "code") {
      applyScriptDraftFromDefinition(next);
    } else {
      resetScriptDraft();
    }
    applyExternalApiConfig(next.type === "api" ? next : undefined);
    resetDockerOperatorForm();
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

.function-operator-form__probe-expand {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px 12px 12px;
}

.function-operator-form__param-table {
  width: 100%;
  margin-bottom: 12px;
}

.function-operator-form__upload-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
}

.function-operator-form__upload-hint {
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
}

.function-operator-form__upload-name {
  min-width: 0;
  color: var(--aircas-color-text-primary);
  font-size: 12px;
  word-break: break-all;
}

.function-operator-form__section--empty {
  padding: 24px 0;
}

@media (max-width: 640px) {
  .function-operator-form__name-grid {
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
