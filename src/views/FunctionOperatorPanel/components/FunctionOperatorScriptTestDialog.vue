<template>
  <el-dialog v-model="visible" class="function-operator-script-test" :title="dialogTitle" width="720px" append-to-body destroy-on-close>
    <p class="function-operator-script-test__title">{{ operatorName }}</p>
    <div class="function-operator-script-test__body">
      <p v-if="detailLoading" class="function-operator-script-test__state" role="status">
        <AircasLoading>正在加载函数详情...</AircasLoading>
      </p>
      <template v-else>
        <el-form label-position="top" class="function-operator-script-test__form">
          <p v-if="inputRows.length === 0" class="function-operator-script-test__empty">当前版本无 INPUT 入参</p>
          <FunctionOperatorScriptTestParamTree
            v-else
            :rows="inputRows"
            ariaLabel="脚本测试入参"
            @update-param="(path, paramValue) => emit('update-param', path, paramValue)"
          />
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
import { computed } from "vue";

import AircasLoading from "@/components/AircasLoading.vue";
import type { FunctionOperatorType } from "@/types";
import type { OntologyFunctionScriptTestInputRow } from "@/utils/mapOntologyFunctionTest";
import FunctionOperatorScriptTestParamTree from "./FunctionOperatorScriptTestParamTree.vue";

const visible = defineModel<boolean>({ required: true });

const props = defineProps<{
  operatorName: string;
  /** 页面函数类型；外部 API、容器算子、函数编排使用独立标题。 */
  functionType: FunctionOperatorType | "";
  detailLoading: boolean;
  submitting: boolean;
  inputRows: OntologyFunctionScriptTestInputRow[];
  output: string;
}>();

const emit = defineEmits<{
  run: [];
  "update-param": [path: number[], paramValue: string];
}>();

/**
 * @description 按函数类型返回测试弹框标题。
 * @returns 外部 API、容器算子、函数编排或脚本函数标题。
 */
const dialogTitle = computed(() => {
  if (props.functionType === "api") {
    return "外部 API 函数测试";
  }
  if (props.functionType === "docker") {
    return "容器算子测试";
  }
  if (props.functionType === "composite") {
    return "函数编排测试";
  }
  return "脚本函数测试";
});
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
