<template>
  <el-dialog v-model="visible" class="aircas-dialog" title="修改分类名称" width="min(480px, 94vw)" append-to-body destroy-on-close>
    <el-form class="aircas-form" label-position="top">
      <el-form-item label="分类名称" required>
        <el-input v-model="categoryName" class="aircas-input" maxlength="64" ariaLabel="分类名称" placeholder="请输入分类名称" :disabled="submitting" />
      </el-form-item>
    </el-form>
    <p v-if="error" class="category-tree-rename-dialog__error" role="alert">{{ error }}</p>
    <template #footer>
      <el-button class="aircas-button" :disabled="submitting" @click="visible = false">取消</el-button>
      <el-button class="aircas-button" type="primary" :loading="submitting" @click="confirmRenameCategory">确认</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";

const visible = defineModel<boolean>({ required: true });
const props = defineProps<{ initialName: string; submitting: boolean; error: string }>();
const emit = defineEmits<{ submit: [name: string] }>();
const categoryName = ref("");

watch(visible, (opened) => {
  if (opened) categoryName.value = props.initialName;
});

/**
 * @description 校验分类名称后交给父组件；名称为空时不发出。
 */
function confirmRenameCategory() {
  const name = categoryName.value.trim();
  if (!name || props.submitting) return;
  emit("submit", name);
}
</script>

<style scoped lang="scss">
.category-tree-rename-dialog__error {
  margin-top: 8px;
  color: var(--aircas-color-danger);
  font-size: 12px;
}
</style>
