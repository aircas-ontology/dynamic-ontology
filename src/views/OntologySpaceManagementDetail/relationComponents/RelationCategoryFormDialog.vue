<template>
  <el-dialog
    :model-value="modelValue"
    class="aircas-dialog"
    :title="mode === 'create' ? '添加关系分类' : '编辑关系分类'"
    width="520px"
    append-to-body
    destroy-on-close
    @close="emit('update:modelValue', false)"
  >
    <el-form class="aircas-form" label-position="top">
      <el-form-item v-if="mode === 'create'" label="父分类">
        <el-input class="aircas-input" :model-value="parentLabel" disabled />
      </el-form-item>
      <el-form-item label="分类名称" required>
        <el-input v-model="name" class="aircas-input" maxlength="64" placeholder="请输入分类名称" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button class="aircas-button aircas-button--tone-ghost" @click="emit('update:modelValue', false)">取消</el-button>
      <el-button class="aircas-button aircas-button--tone-primary" :loading="loading" @click="submitCategoryForm">确认</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";

const props = defineProps<{
  modelValue: boolean;
  mode: "create" | "edit";
  parentLabel: string;
  initialName: string;
}>();
const emit = defineEmits<{ "update:modelValue": [value: boolean]; submit: [name: string] }>();
const name = ref("");
const loading = ref(false);

watch(
  () => props.modelValue,
  (visible) => {
    if (!visible) return;
    name.value = props.initialName;
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
  emit("submit", trimmed);
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
