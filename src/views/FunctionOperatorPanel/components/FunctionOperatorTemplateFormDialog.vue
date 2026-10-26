<template>
  <el-dialog
    :model-value="modelValue"
    :title="readOnly ? '查看模板' : editing ? '编辑模板' : '新增模板'"
    width="760px"
    destroy-on-close
    @update:model-value="emit('update:modelValue', $event)"
  >
    <el-form ref="formRef" :model="draft" :rules="rules" label-width="80px">
      <el-form-item label="模板名称" prop="name"><el-input v-model="draft.name" :disabled="readOnly" maxlength="80" show-word-limit /></el-form-item>
      <el-form-item label="语言类型" prop="language">
        <el-select v-model="draft.language" :disabled="readOnly || editing" style="width: 100%">
          <el-option v-for="item in FUNCTION_OPERATOR_SCRIPT_LANGUAGE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="模板说明"
        ><el-input v-model="draft.description" :disabled="readOnly" type="textarea" :rows="2" maxlength="200" show-word-limit
      /></el-form-item>
      <el-form-item label="代码内容" prop="code" class="template-form-dialog__code-item">
        <div class="template-form-dialog__editor"><FunctionOperatorScriptCodeEditor v-model="draft.code" :language="draft.language" /></div>
      </el-form-item>
    </el-form>
    <template #footer
      ><el-button @click="emit('update:modelValue', false)">{{ readOnly ? "关闭" : "取消" }}</el-button
      ><el-button v-if="!readOnly" type="primary" :loading="saving" @click="submitTemplate">保存</el-button></template
    >
  </el-dialog>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { FUNCTION_OPERATOR_SCRIPT_LANGUAGE_OPTIONS, type FunctionOperatorScriptLanguage } from "@/types";
import FunctionOperatorScriptCodeEditor from "./FunctionOperatorScriptCodeEditor.vue";

export interface FunctionOperatorTemplateDraft {
  id?: number;
  name: string;
  language: FunctionOperatorScriptLanguage;
  description: string;
  code: string;
  updatedAt?: string;
}
const props = defineProps<{ modelValue: boolean; template: FunctionOperatorTemplateDraft | null; readOnly: boolean; editing: boolean; saving: boolean }>();
const emit = defineEmits<{ "update:modelValue": [value: boolean]; save: [value: FunctionOperatorTemplateDraft] }>();
const formRef = ref<FormInstance>();
const draft = reactive<FunctionOperatorTemplateDraft>({ name: "", language: "typescript", description: "", code: "" });
const rules: FormRules = {
  name: [{ required: true, message: "请输入模板名称", trigger: "blur" }],
  language: [{ required: true, message: "请选择语言类型", trigger: "change" }],
  code: [{ required: true, message: "请输入代码内容", trigger: "change" }],
};

watch(
  () => [props.modelValue, props.template] as const,
  ([visible, template]) => {
    if (!visible) return;
    Object.assign(draft, template ?? { name: "", language: "typescript", description: "", code: "" });
    void formRef.value?.clearValidate();
  },
  { immediate: true },
);

/** @description 校验并提交模板草稿。 */
async function submitTemplate(): Promise<void> {
  if (props.saving || !(await formRef.value?.validate().catch(() => false))) return;
  emit("save", { ...draft });
}
</script>

<style scoped lang="scss">
.template-form-dialog__code-item :deep(.el-form-item__content) {
  min-height: 360px;
}
.template-form-dialog__editor {
  width: 100%;
  height: 360px;
}
</style>
