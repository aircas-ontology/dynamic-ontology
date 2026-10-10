<template>
  <el-dialog
    :model-value="modelValue"
    :title="mode === 'create' ? '创建行为' : '编辑行为'"
    width="min(960px, 94vw)"
    :close-on-click-modal="false"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <el-alert v-if="readonly" title="已发布或已停用行为不可直接编辑，可另存为草稿副本。" type="warning" :closable="false" />
    <el-form label-position="top" class="object-behavior-form">
      <h3>基本信息</h3>
      <div class="object-behavior-form__grid">
        <el-form-item label="行为名称" required><el-input v-model="draft.displayName" :disabled="readonly" placeholder="输入行为名称" /></el-form-item
        ><el-form-item label="行为分类" required
          ><el-select v-model="draft.categoryId" :disabled="readonly"
            ><el-option v-for="item in categoryOptions" :key="item.id" :label="item.label" :value="item.id" /></el-select
        ></el-form-item>
      </div>
      <div class="object-behavior-form__grid">
        <el-form-item label="基础操作"
          ><el-select v-model="draft.basicAction" :disabled="readonly"
            ><el-option
              v-for="item in SPACE_BEHAVIOR_BASIC_ACTION_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value" /></el-select></el-form-item
        ><el-form-item label="关联基础函数算子" required
          ><el-input v-model="draft.functionOperatorName" :disabled="readonly" placeholder="关联基础函数算子"
        /></el-form-item>
      </div>
      <el-form-item label="行为描述"
        ><el-input v-model="draft.description" type="textarea" :rows="3" :disabled="readonly" placeholder="输入行为描述" /></el-form-item
      ><el-form-item label="变更说明"><el-input v-model="draft.changeNote" :disabled="readonly" placeholder="输入变更说明" /></el-form-item>
    </el-form>
    <template #footer
      ><el-button @click="emit('update:modelValue', false)">取消</el-button><el-button v-if="readonly" @click="emit('save-copy', draft)">另存草稿副本</el-button
      ><el-button v-else :disabled="!canSubmit" @click="submitBehaviorForm">保存行为</el-button></template
    >
  </el-dialog>
</template>
<script setup lang="ts">
import { computed, reactive, watch } from "vue";
import type { SpaceBehaviorBasicAction, SpaceBehaviorDraft, SpaceBehaviorItem } from "@/types";
import { ROOT_SPACE_BEHAVIOR_CATEGORY_ID, SPACE_BEHAVIOR_BASIC_ACTION_OPTIONS } from "@/types";
const props = defineProps<{
  modelValue: boolean;
  mode: "create" | "edit";
  behavior: SpaceBehaviorItem | null;
  categoryOptions: Array<{ id: string; label: string }>;
  defaultCategoryId: string;
}>();
const emit = defineEmits<{ "update:modelValue": [value: boolean]; submit: [draft: SpaceBehaviorDraft]; "save-copy": [draft: SpaceBehaviorDraft] }>();
const draft = reactive<SpaceBehaviorDraft>({
  displayName: "",
  functionOperatorId: "",
  functionOperatorName: "",
  description: "",
  categoryId: ROOT_SPACE_BEHAVIOR_CATEGORY_ID,
  status: "draft",
  basicAction: "query",
  changeNote: "",
});
const readonly = computed(() => props.mode === "edit" && (props.behavior?.status === "published" || props.behavior?.status === "disabled"));
const canSubmit = computed(() => Boolean(draft.displayName.trim() && draft.functionOperatorName.trim() && draft.categoryId));
/** @description 初始化当前行为草稿。 */
function initializeBehaviorDraft(): void {
  const item = props.behavior;
  Object.assign(
    draft,
    item
      ? {
          displayName: item.displayName,
          functionOperatorId: item.functionOperatorId,
          functionOperatorName: item.functionOperatorName,
          description: item.description,
          categoryId: item.categoryId,
          status: item.status,
          basicAction: item.basicAction,
          changeNote: item.changeNote,
        }
      : {
          displayName: "",
          functionOperatorId: "",
          functionOperatorName: "",
          description: "",
          categoryId: props.defaultCategoryId || ROOT_SPACE_BEHAVIOR_CATEGORY_ID,
          status: "draft",
          basicAction: "query" as SpaceBehaviorBasicAction,
          changeNote: "",
        },
  );
}
/** @description 提交行为草稿。 */
function submitBehaviorForm(): void {
  if (canSubmit.value)
    emit("submit", {
      ...draft,
      displayName: draft.displayName.trim(),
      functionOperatorName: draft.functionOperatorName.trim(),
      description: draft.description.trim(),
    });
}
watch(
  () => props.modelValue,
  (visible) => {
    if (visible) initializeBehaviorDraft();
  },
);
</script>
<style scoped lang="scss">
.object-behavior-form {
  margin-top: 12px;
}
.object-behavior-form h3 {
  margin: 12px 0;
  color: var(--aircas-color-text-primary);
  font-size: 16px;
}
.object-behavior-form__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
@media (max-width: 720px) {
  .object-behavior-form__grid {
    grid-template-columns: 1fr;
  }
}
</style>
