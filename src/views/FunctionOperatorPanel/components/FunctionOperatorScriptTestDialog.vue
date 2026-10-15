<template>
  <el-dialog v-model="visible" class="function-operator-script-test" title="脚本函数测试" width="720px" append-to-body destroy-on-close>
    <p class="function-operator-script-test__title">{{ operatorName }}</p>
    <div class="function-operator-script-test__body">
      <p v-if="detailLoading" class="function-operator-script-test__state" role="status">
        <AircasLoading>正在加载函数详情...</AircasLoading>
      </p>
      <template v-else>
        <el-form label-position="top" class="function-operator-script-test__form">
          <p v-if="inputRows.length === 0" class="function-operator-script-test__empty">当前版本无 INPUT 入参</p>
          <el-form-item v-for="row in inputRows" :key="row.paramName" :label="formatScriptTestParamLabel(row.paramName, row.paramType)">
            <el-input
              :model-value="row.paramValue"
              clearable
              placeholder="请输入参数值"
              @update:model-value="emit('update-param', row.paramName, String($event ?? ''))"
            />
          </el-form-item>
          <el-form-item label="执行结果">
            <el-input :model-value="output" type="textarea" :rows="14" readonly placeholder="运行测试后展示完整接口响应" />
          </el-form-item>
        </el-form>
      </template>
    </div>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="submitting" :disabled="detailLoading" @click="emit('run')">执行</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import AircasLoading from "@/components/AircasLoading.vue";
import type { OntologyFunctionScriptTestInputRow } from "@/utils/mapOntologyFunctionTest";

const visible = defineModel<boolean>({ required: true });

defineProps<{
  operatorName: string;
  detailLoading: boolean;
  submitting: boolean;
  inputRows: OntologyFunctionScriptTestInputRow[];
  output: string;
}>();

const emit = defineEmits<{
  run: [];
  "update-param": [paramName: string, paramValue: string];
}>();

/**
 * @description 组装脚本测试入参表单项标签：参数名与类型。
 * @param paramName 参数名。
 * @param paramType 参数类型。
 * @returns 展示标签。
 */
function formatScriptTestParamLabel(paramName: string, paramType: string): string {
  const typeLabel = paramType.trim();
  return typeLabel ? `${paramName}（${typeLabel}）` : paramName;
}
</script>

<style scoped lang="scss">
.function-operator-script-test__title {
  margin: 0 0 8px;
  color: var(--aircas-color-text-primary);
  font-size: 14px;
}

.function-operator-script-test__body {
  min-height: 120px;
}

.function-operator-script-test__state,
.function-operator-script-test__empty {
  margin: 0 0 8px;
  color: var(--aircas-color-text-secondary);
  font-size: 13px;
}

.function-operator-script-test__form {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
</style>
