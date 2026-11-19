<template>
  <el-dialog
    :model-value="modelValue"
    title="配置参数"
    width="min(1100px, 94vw)"
    append-to-body
    destroy-on-close
    draggable
    overflow
    :modal="false"
    modal-penetrable
    :z-index="5110"
    :close-on-click-modal="false"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div ref="editorRef" class="rule-action-editor">
      <el-form v-if="action" label-width="100px">
        <ScheduleRuleConditionInstances ref="conditionInstancesRef" :key="actionNodeId" :paths="paths" :readonly="readonly" />
        <h3 class="rule-action-editor__section-title">执行行为配置</h3>
        <el-form-item label="行为">
          <el-select
            :model-value="selectedActionOption?.id || action.behaviorId"
            :disabled="readonly"
            filterable
            placeholder="请选择行为"
            :no-data-text="actionObjectIds.length ? '条件对象没有关联行为' : '暂无可选行为'"
            @update:model-value="emit('changeBehavior', $event)"
          >
            <el-option v-for="option in filteredBehaviorOptions" :key="option.id" :value="option.id" :label="option.displayName" />
            <el-option
              v-if="readonly && selectedActionOption && !filteredBehaviorOptions.some((option) => option.id === selectedActionOption?.id)"
              :value="selectedActionOption.id"
              :label="selectedActionOption.displayName"
            />
          </el-select>
        </el-form-item>
        <section class="rule-action-editor__parameters" aria-label="行为参数">
          <h3 class="rule-action-editor__parameters-title">行为参数</h3>
          <el-alert
            v-if="readonly && !actionDetail?.entityJson && !action.treeParameters && !action.behaviorParameters"
            title="未保存行为参数"
            type="info"
            :closable="false"
          />
          <p v-if="readonly && actionDetail?.entityId">目标实例：{{ actionDetail.entityId }}</p>
          <BehaviorParameterConfig v-if="selectedActionOption?.kind === 'application'" :controller="parameterConfig" :readonly="readonly || parameterBusy" />
          <ScheduleTreeParametersPanel v-else-if="selectedActionOption?.kind === 'behaviorTree'" :tree-parameters="treeParameters" />
          <p v-else>请选择行为以配置参数</p>
          <el-alert v-if="parameterError" :title="parameterError" type="error" :closable="false" />
          <el-button v-if="parameterError" :disabled="parameterBusy" link @click="emit('reloadParameters')">重新加载行为参数</el-button>
        </section>
      </el-form>
    </div>
    <template #footer>
      <el-button @click="emit('update:modelValue', false)">{{ readonly ? "关闭" : "取消" }}</el-button>
      <el-button v-if="!readonly" type="primary" :disabled="parameterBusy" @click="emit('confirm')">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref } from "vue";
import type { RuleFlowThenAction, ScheduleBehaviorOption, ScheduleRuleDetailGroup } from "@/types";
import BehaviorParameterConfig from "@/components/BehaviorParameterConfig/BehaviorParameterConfig.vue";
import ScheduleTreeParametersPanel from "../components/ScheduleTreeParametersPanel.vue";
import ScheduleRuleConditionInstances from "./ScheduleRuleConditionInstances.vue";
import type { ActionConditionSource } from "../utils/ruleConditionInstanceBindings";

defineProps<{
  modelValue: boolean;
  action: RuleFlowThenAction | null;
  actionNodeId: string;
  paths: ActionConditionSource[][];
  readonly?: boolean;
  filteredBehaviorOptions: readonly ScheduleBehaviorOption[];
  selectedActionOption?: ScheduleBehaviorOption;
  actionObjectIds: readonly string[];
  actionDetail?: ScheduleRuleDetailGroup["actionDetails"][string];
  parameterConfig: unknown;
  treeParameters: unknown;
  parameterBusy: boolean;
  parameterError: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  confirm: [];
  changeBehavior: [value: unknown];
  reloadParameters: [];
}>();

const editorRef = ref<HTMLElement | null>(null);
const conditionInstancesRef = ref<InstanceType<typeof ScheduleRuleConditionInstances> | null>(null);

defineExpose({ editorRef, conditionInstancesRef });
</script>

<style scoped lang="scss">
.rule-action-editor {
  min-height: 240px;
  max-height: 62vh;
  padding: 4px;
  overflow: auto;
}

.rule-action-editor__parameters {
  margin-top: 16px;
  padding: 16px;
  border: 1px solid var(--aircas-color-border-soft);
  border-radius: 8px;
  background: var(--aircas-color-panel-background-deep);
}

.rule-action-editor__parameters-title {
  margin: 0 0 12px;
  color: var(--aircas-color-text-primary);
  font-size: 14px;
  font-weight: 600;
}

.rule-action-editor__section-title {
  margin: 0 0 8px;
  color: var(--aircas-color-text-primary);
  font-size: 16px;
  font-weight: 600;
}
</style>
