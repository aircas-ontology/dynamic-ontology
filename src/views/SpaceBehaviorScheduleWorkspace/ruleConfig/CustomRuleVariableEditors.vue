<template>
  <el-dialog
    :model-value="objectOpen"
    class="aircas-dialog custom-rule-variable-editor"
    :title="objectTitle"
    width="420px"
    append-to-body
    destroy-on-close
    :z-index="5200"
    :close-on-click-modal="false"
    @update:model-value="emit('update:objectOpen', $event)"
  >
    <form class="aircas-form" @submit.prevent="emit('save-object')">
      <el-form label-position="top">
        <el-form-item label="名称" required>
          <el-input v-model="objectName" class="aircas-input" maxlength="48" placeholder="例如：任务上下文" />
        </el-form-item>
      </el-form>
    </form>
    <template #footer>
      <el-button class="aircas-button aircas-button--tone-ghost" @click="emit('update:objectOpen', false)">取消</el-button>
      <el-button class="aircas-button aircas-button--tone-primary" :loading="submitting" @click="emit('save-object')">保存</el-button>
    </template>
  </el-dialog>

  <el-dialog
    :model-value="propertyOpen"
    class="aircas-dialog custom-rule-variable-editor"
    :title="propertyTitle"
    width="520px"
    append-to-body
    destroy-on-close
    :z-index="5200"
    :close-on-click-modal="false"
    @update:model-value="emit('update:propertyOpen', $event)"
  >
    <form class="aircas-form" @submit.prevent="emit('save-property')">
      <el-form label-position="top">
        <div class="custom-rule-variable-editor__row">
          <el-form-item label="键名称" required>
            <el-input v-model="propertyName" class="aircas-input" maxlength="48" placeholder="例如：任务优先级" />
          </el-form-item>
          <el-form-item label="值类型" required>
            <el-select v-model="propertyValueType" class="aircas-select" popper-class="aircas-select-popper" placeholder="请选择值类型" style="width: 100%">
              <el-option v-for="item in RULE_VARIABLE_PROPERTY_VALUE_TYPE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
        </div>
        <div v-if="propertyValueType === 'object'" class="custom-rule-variable-editor__children">
          <div class="custom-rule-variable-editor__children-header">
            <div>
              <div class="custom-rule-variable-editor__children-title">子键定义</div>
              <div class="custom-rule-variable-editor__children-hint">对象类型可包含若干子键</div>
            </div>
            <el-button class="aircas-button aircas-button--tone-primary" @click="addChildProperty">+ 添加子键</el-button>
          </div>
          <div v-if="propertyChildren.length" class="custom-rule-variable-editor__child-list">
            <div v-for="(child, index) in propertyChildren" :key="child.id" class="custom-rule-variable-editor__child">
              <el-input v-model="child.name" class="aircas-input" maxlength="48" placeholder="子键名称" />
              <el-select v-model="child.valueType" class="aircas-select" popper-class="aircas-select-popper">
                <el-option v-for="item in RULE_VARIABLE_PROPERTY_VALUE_TYPE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
              <el-button class="aircas-button aircas-button--tone-danger" type="danger" @click="removeChildProperty(index)">删除</el-button>
            </div>
          </div>
          <el-empty v-else description="暂无子键，点击上方添加子键开始定义" :image-size="54" />
        </div>
      </el-form>
    </form>
    <template #footer>
      <el-button class="aircas-button aircas-button--tone-ghost" @click="emit('update:propertyOpen', false)">取消</el-button>
      <el-button class="aircas-button aircas-button--tone-primary" :loading="submitting" @click="emit('save-property')">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { RULE_VARIABLE_PROPERTY_VALUE_TYPE_OPTIONS, type RuleVariablePropertyOption, type RuleVariablePropertyValueType } from "@/types";

defineProps<{
  objectOpen: boolean;
  propertyOpen: boolean;
  objectTitle: string;
  propertyTitle: string;
  submitting: boolean;
}>();

const objectName = defineModel<string>("objectName", { required: true });
const propertyName = defineModel<string>("propertyName", { required: true });
const propertyValueType = defineModel<RuleVariablePropertyValueType>("propertyValueType", { required: true });
const propertyChildren = defineModel<RuleVariablePropertyOption[]>("propertyChildren", { required: true });

const emit = defineEmits<{
  "update:objectOpen": [value: boolean];
  "update:propertyOpen": [value: boolean];
  "save-object": [];
  "save-property": [];
}>();

/**
 * @description 为对象类型键追加一条空白子键。
 */
function addChildProperty() {
  propertyChildren.value = [
    ...propertyChildren.value,
    {
      id: `child-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      name: "",
      valueType: "string",
    },
  ];
}

/**
 * @description 删除指定下标的子键。
 * @param index 子键下标。
 */
function removeChildProperty(index: number) {
  propertyChildren.value = propertyChildren.value.filter((_, itemIndex) => itemIndex !== index);
}
</script>

<style scoped lang="scss">
.custom-rule-variable-editor__row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.custom-rule-variable-editor__children {
  margin-top: 4px;
  padding: 12px;
  border: 1px dashed var(--aircas-color-border);
  border-radius: 8px;
  background: var(--aircas-color-overlay);
}

.custom-rule-variable-editor__children-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.custom-rule-variable-editor__children-title {
  color: var(--aircas-color-text-primary);
  font-size: 13px;
  font-weight: 600;
}

.custom-rule-variable-editor__children-hint {
  margin-top: 2px;
  color: var(--aircas-color-text-muted);
  font-size: 12px;
}

.custom-rule-variable-editor__child-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.custom-rule-variable-editor__child {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 120px auto;
  gap: 8px;
  align-items: center;
}
</style>
