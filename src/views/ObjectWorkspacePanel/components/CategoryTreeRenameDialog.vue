<template>
  <el-dialog v-model="visible" title="编辑分类" width="min(480px, 94vw)" append-to-body destroy-on-close>
    <el-form label-position="top">
      <el-form-item label="父分类" required>
        <el-tree-select
          v-model="parentId"
          :data="parentOptions"
          node-key="id"
          check-strictly
          :render-after-expand="false"
          :disabled="submitting"
          placeholder="请选择父分类"
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item label="分类名称" required>
        <el-input v-model="categoryName" maxlength="64" ariaLabel="分类名称" placeholder="请输入分类名称" :disabled="submitting" />
      </el-form-item>
    </el-form>
    <p v-if="error" class="category-tree-rename-dialog__error" role="alert">{{ error }}</p>
    <template #footer>
      <el-button :disabled="submitting" @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="confirmRenameCategory">确认</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";

const visible = defineModel<boolean>({ required: true });
const props = defineProps<{
  initialName: string;
  initialParentId: string;
  parentOptions: Array<{ id: string; label: string }>;
  submitting: boolean;
  error: string;
}>();
const emit = defineEmits<{ submit: [name: string, parentId: string] }>();
const categoryName = ref("");
const parentId = ref("");

watch(visible, (opened) => {
  if (opened) {
    categoryName.value = props.initialName;
    parentId.value = props.initialParentId;
  }
});

/**
 * @description 校验分类名称后交给父组件；名称为空时不发出。
 */
function confirmRenameCategory() {
  const name = categoryName.value.trim();
  if (!name || !parentId.value || props.submitting) return;
  emit("submit", name, parentId.value);
}
</script>

<style scoped lang="scss">
.category-tree-rename-dialog__error {
  margin-top: 8px;
  color: var(--aircas-color-danger);
  font-size: 12px;
}
</style>
