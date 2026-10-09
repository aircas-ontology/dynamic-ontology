<template>
  <el-dialog v-model="visible" class="aircas-dialog" title="新建子分类" width="min(480px, 94vw)" append-to-body destroy-on-close>
    <el-form class="aircas-form" label-position="top">
      <el-form-item label="输入子分类名称" required>
        <el-input v-model="categoryName" class="aircas-input" maxlength="64" ariaLabel="输入子分类名称" placeholder="请输入子分类名称" :disabled="submitting" />
      </el-form-item>
    </el-form>
    <p v-if="error" class="category-tree-child-dialog__error" role="alert">{{ error }}</p>
    <template #footer>
      <el-button class="aircas-button" :disabled="submitting" @click="visible = false">取消</el-button>
      <el-button class="aircas-button" type="primary" :loading="submitting" @click="confirmCategoryChildName">确认</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";

const visible = defineModel<boolean>({ required: true });
const props = defineProps<{ submitting: boolean; error: string }>();
const emit = defineEmits<{ submit: [name: string] }>();
const categoryName = ref("");

watch(visible, (opened) => {
  if (opened) categoryName.value = "";
});

/**
 * @description 校验子分类名称后交给父组件提交创建接口；名称为空或正在提交时不发出。
 */
function confirmCategoryChildName() {
  const name = categoryName.value.trim();
  if (!name || props.submitting) return;
  emit("submit", name);
}
</script>

<style scoped lang="scss">
.category-tree-child-dialog__error {
  margin-top: 8px;
  color: var(--aircas-color-danger);
  font-size: 12px;
}
</style>
