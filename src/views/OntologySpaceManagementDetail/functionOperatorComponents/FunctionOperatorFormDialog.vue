<template>
  <el-dialog
    :model-value="modelValue"
    class="aircas-dialog function-operator-form-dialog"
    :title="operator ? '编辑函数算子' : '新建函数算子'"
    width="min(960px, calc(100vw - 48px))"
    align-center
    destroy-on-close
    @update:model-value="emit('update:modelValue', $event)"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top" class="aircas-form function-operator-form">
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
        <el-form-item label="函数名称" prop="name">
          <el-input v-model="form.name" class="aircas-input" maxlength="64" placeholder="例如：目标识别算子" />
        </el-form-item>
        <el-form-item label="函数说明" prop="description">
          <el-input v-model="form.description" class="aircas-input" type="textarea" :rows="2" maxlength="240" show-word-limit />
        </el-form-item>
        <el-form-item v-if="form.definition.kind === 'basic'" label="参数配置" prop="definition.parameterConfig">
          <FunctionOperatorBasicFilterBuilder v-model="form.definition.parameterConfig" />
        </el-form-item>
      </section>

      <section v-else class="function-operator-form__section function-operator-form__section--empty">
        <el-empty class="aircas-empty" description="该函数类型本阶段暂未开放，请选择基础函数" />
      </section>
    </el-form>

    <template #footer>
      <el-button class="aircas-button" @click="emit('update:modelValue', false)">取消</el-button>
      <el-button class="aircas-button" type="primary" :loading="loading" :disabled="form.type !== 'basic'" @click="submitDraft"> 保存 </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { ElMessage } from "element-plus";

import { FUNCTION_OPERATOR_TYPE_OPTIONS, type FunctionOperator, type FunctionOperatorDraft, type FunctionOperatorType } from "@/types";
import { createEmptyBasicFilterDocument, stringifyBasicFilterConfig } from "@/utils/functionOperatorBasicFilter";

import FunctionOperatorBasicFilterBuilder from "./FunctionOperatorBasicFilterBuilder.vue";

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
}>();

const formRef = ref<FormInstance>();

/**
 * @description 创建空草稿，默认基础函数。
 * @returns 新建草稿。
 */
function createEmptyDraft(): FunctionOperatorDraft {
  return {
    spaceId: props.spaceId,
    name: "",
    type: "basic",
    protocol: "HTTP",
    version: "v1.0.0",
    description: "",
    createdBy: "admin",
    status: "draft",
    category: "基础操作",
    inputParameters: [],
    outputParameters: [],
    timeout: 5000,
    retryCount: 0,
    retryInterval: 0,
    definition: { kind: "basic", parameterConfig: createDefaultBasicParameterConfig() },
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
    type: operator.type,
    protocol: operator.protocol,
    version: operator.version,
    description: operator.description,
    createdBy: operator.createdBy,
    status: operator.status,
    category: operator.category,
    inputParameters: operator.inputParameters.map((item) => ({ ...item })),
    outputParameters: operator.outputParameters.map((item) => ({ ...item })),
    timeout: operator.timeout,
    retryCount: operator.retryCount,
    retryInterval: operator.retryInterval,
    definition: structuredClone(operator.definition),
    dependencies: [...operator.dependencies],
    testStatus: operator.testStatus,
    testedAt: operator.testedAt,
  };
}

const form = reactive<FunctionOperatorDraft>(createEmptyDraft());

const rules: FormRules = {
  name: [{ required: true, message: "请输入函数名称", trigger: "blur" }],
  description: [{ required: true, message: "请输入函数说明", trigger: "blur" }],
};

/**
 * @description 切换函数类型；非 basic 仅占位。
 * @param type 目标类型。
 */
function changeType(type: FunctionOperatorType): void {
  form.type = type;
  if (type === "basic") {
    form.definition = { kind: "basic", parameterConfig: createDefaultBasicParameterConfig() };
    return;
  }
  form.definition = { kind: type };
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
  emit("submit", {
    ...form,
    name: form.name.trim(),
    description: form.description.trim(),
    type: "basic",
    definition: { ...form.definition },
  });
}

watch(
  () => [props.modelValue, props.operator, props.draft, props.spaceId] as const,
  ([visible]) => {
    if (!visible) {
      return;
    }
    const next = props.draft ? structuredClone(props.draft) : props.operator ? toDraft(props.operator) : createEmptyDraft();
    next.spaceId = props.spaceId;
    Object.assign(form, next);
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
  border: 1px solid var(--aircas-color-border-soft);
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
  border-color: var(--aircas-color-accent-cyan);
  box-shadow: inset 0 0 0 1px var(--aircas-color-accent-cyan);
}

.function-operator-form__section--empty {
  padding: 24px 0;
}
</style>
