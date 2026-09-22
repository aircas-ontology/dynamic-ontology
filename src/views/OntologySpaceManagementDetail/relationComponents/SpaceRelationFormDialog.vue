<template>
  <el-dialog
    :model-value="modelValue"
    class="aircas-dialog"
    :title="mode === 'create' ? '添加关系' : '编辑关系'"
    width="560px"
    append-to-body
    destroy-on-close
    @close="emit('update:modelValue', false)"
  >
    <el-form class="aircas-form" label-position="top">
      <el-form-item label="关系名称" required>
        <el-input v-model="displayName" class="aircas-input" maxlength="64" placeholder="请输入关系名称" />
      </el-form-item>
      <el-form-item label="API 名称" required>
        <el-input v-model="apiName" class="aircas-input" maxlength="64" placeholder="请输入 API 名称" :disabled="mode === 'edit'" />
      </el-form-item>
      <el-form-item v-if="categoryOptions.length" label="分类" :required="mode === 'edit'">
        <el-tree-select
          v-model="categoryId"
          class="aircas-tree-select"
          popper-class="aircas-tree-select-popper"
          :data="categoryOptions"
          check-strictly
          :render-after-expand="false"
          node-key="id"
          :props="{ label: 'label', children: 'children' }"
          :clearable="mode !== 'edit'"
          placeholder="请选择关系分类"
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item label="源本体" required>
        <el-select
          v-model="sourceName"
          class="aircas-select"
          popper-class="aircas-select-popper"
          filterable
          placeholder="请选择源本体对象"
          style="width: 100%"
          :disabled="mode === 'edit'"
        >
          <el-option v-for="item in objectOptions" :key="`src-${item.value}`" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="目标本体" required>
        <el-select
          v-model="targetName"
          class="aircas-select"
          popper-class="aircas-select-popper"
          filterable
          placeholder="请选择目标本体对象"
          style="width: 100%"
          :disabled="mode === 'edit'"
        >
          <el-option v-for="item in objectOptions" :key="`tgt-${item.value}`" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="描述" :required="mode === 'edit'">
        <el-input v-model="description" class="aircas-input" type="textarea" :rows="3" maxlength="300" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button class="aircas-button" @click="emit('update:modelValue', false)">取消</el-button>
      <el-button class="aircas-button" type="primary" :loading="loading" @click="submit">确认</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import type {
  OntologyRelationCardinality,
  OntologyRelationCategoryNode,
  OntologyRelationClass,
  RelationClassWritePayload,
  SpaceRelationObjectOption,
} from "@/types";
import { ROOT_RELATION_CATEGORY_ID } from "@/types";
import { findRelationCategoryNode } from "../utils/relationOperations";

const props = defineProps<{
  modelValue: boolean;
  mode: "create" | "edit";
  categoryOptions: OntologyRelationCategoryNode[];
  objectOptions: SpaceRelationObjectOption[];
  defaultCategoryId: string;
  relation: OntologyRelationClass | null;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  submit: [payload: RelationClassWritePayload];
}>();

const displayName = ref("");
const apiName = ref("");
const categoryId = ref("");
const sourceName = ref("");
const targetName = ref("");
const cardinality = ref<OntologyRelationCardinality>("一对多");
const description = ref("");
const loading = ref(false);
const allowRootCategory = computed(() => props.categoryOptions.length === 0);

/**
 * @description 创建模式下解析默认分类：仅当 defaultCategoryId 存在于完整分类树（含根）中时预填，不在选项中则留空以展示占位符。
 * @returns 可写入表单的分类 id，无可选项时回退根常量。
 */
function resolveCreateCategoryId(): string {
  if (allowRootCategory.value) return ROOT_RELATION_CATEGORY_ID;
  if (props.defaultCategoryId && findRelationCategoryNode(props.categoryOptions, props.defaultCategoryId)) {
    return props.defaultCategoryId;
  }
  return "";
}

watch(
  () => props.modelValue,
  (visible) => {
    if (!visible) return;
    loading.value = false;
    if (props.mode === "edit" && props.relation) {
      displayName.value = props.relation.displayName;
      apiName.value = props.relation.apiName;
      categoryId.value = props.relation.categoryId;
      sourceName.value = props.relation.sourceName;
      targetName.value = props.relation.targetName;
      cardinality.value = props.relation.cardinality;
      description.value = props.relation.description;
      return;
    }
    displayName.value = "";
    apiName.value = "";
    categoryId.value = resolveCreateCategoryId();
    sourceName.value = "";
    targetName.value = "";
    cardinality.value = "一对多";
    description.value = "";
  },
);

/**
 * @description 提交关系表单：创建校验名称与源目标；编辑校验名称、分类与描述。
 */
function submit() {
  const src = sourceName.value.trim();
  const tgt = targetName.value.trim();
  const trimmedName = displayName.value.trim();
  const trimmedCategoryId = categoryId.value.trim();
  const trimmedDescription = description.value.trim();

  if (props.mode === "edit") {
    if (!trimmedName || !trimmedCategoryId || !trimmedDescription) {
      ElMessage.warning("请填写关系名称、分类和描述");
      return;
    }
  } else if (!trimmedName || !apiName.value.trim() || !src || !tgt) {
    return;
  }

  if (src && tgt && src === tgt) {
    ElMessage.warning("源本体与目标本体不能相同");
    return;
  }
  loading.value = true;
  emit("submit", {
    ...(trimmedCategoryId ? { categoryId: trimmedCategoryId } : {}),
    displayName: trimmedName,
    apiName: apiName.value.trim(),
    sourceName: src,
    targetName: tgt,
    cardinality: cardinality.value,
    description: trimmedDescription,
  });
}

defineExpose({
  setLoading(value: boolean) {
    loading.value = value;
  },
});
</script>
