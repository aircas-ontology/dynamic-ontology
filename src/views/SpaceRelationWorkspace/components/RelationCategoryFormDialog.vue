<template>
  <el-dialog
    :model-value="modelValue"
    :title="mode === 'create' ? '添加关系分类' : '编辑关系分类'"
    width="520px"
    append-to-body
    destroy-on-close
    :close-on-click-modal="false"
    @close="emit('update:modelValue', false)"
  >
    <el-form label-position="top">
      <el-form-item label="父分类" required>
        <el-tree-select
          v-model="parentId"
          :data="parentOptions"
          node-key="id"
          :props="{ label: 'label', children: 'children' }"
          check-strictly
          :render-after-expand="false"
          :disabled="loading"
          placeholder="请选择父分类"
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item label="分类名称" required>
        <el-input v-model="name" maxlength="64" placeholder="请输入分类名称" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button data-onboarding="relation-category-cancel" @click="emit('update:modelValue', false)">取消</el-button>
      <el-button :loading="loading" data-onboarding="relation-category-confirm" @click="submitCategoryForm">确认</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";

const props = defineProps<{
  modelValue: boolean;
  mode: "create" | "edit";
  parentLabel: string;
  parentId: string;
  parentOptions: Array<{ id: string; label: string }>;
  initialName: string;
}>();
const emit = defineEmits<{ "update:modelValue": [value: boolean]; submit: [name: string, parentId: string] }>();
const name = ref("");
const parentId = ref("");
const loading = ref(false);

watch(
  () => props.modelValue,
  (visible) => {
    if (!visible) return;
    name.value = props.initialName;
    parentId.value = props.parentId;
    loading.value = false;
  },
);

/**
 * @description 校验分类名称后向父组件提交新建或编辑请求。
 */
function submitCategoryForm() {
  const trimmed = name.value.trim();
  if (!trimmed) return;
  loading.value = true;
  if (!parentId.value) return;
  emit("submit", trimmed, parentId.value);
}

defineExpose({
  /**
   * @description 同步弹窗确认按钮的 loading 状态。
   * @param value 是否处于提交中
   */
  setLoading(value: boolean) {
    loading.value = value;
  },
});
</script>
