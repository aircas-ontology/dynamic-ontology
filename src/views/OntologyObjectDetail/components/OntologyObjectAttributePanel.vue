<template>
  <section class="ontology-object-attribute-panel" aria-label="本体对象属性">
    <AttributeCategoryTree
      :categories="categories"
      :tree-props="treeProps"
      :category-search="categorySearch"
      :category-tree-loading="categoryTreeLoading"
      :category-tree-error="categoryTreeError"
      :category-tree-empty="categoryTreeEmpty"
      :selected-category-id="selectedCategoryId"
      :filter-category-node="filterCategoryNode"
      @update:category-search="categorySearch = $event"
      @select-category="selectCategory"
      @create-root="openRootCategoryCreate"
      @create-category="openCategoryCreate"
      @edit-category="openCategoryEdit"
      @remove-category="removeCategory"
    />
    <AttributePropertyTable
      :selected-category-name="selectedCategoryName"
      :attribute-search="attributeSearch"
      :attribute-loading="attributeLoading"
      :attribute-error="attributeError"
      :visible-attributes="visibleAttributes"
      @update:attribute-search="attributeSearch = $event"
      @open-data-source="openDataSource"
      @create-attribute="openCreateAttribute"
      @edit-attribute="openEditAttribute"
      @remove-attribute="removeAttribute"
    />
    <AttributeCategoryCreateDialog
      :visible="categoryDialogVisible"
      :parent-name="categoryParentName"
      :name="categoryName"
      :submitting="categorySubmitting"
      :error="categoryError"
      @update:visible="categoryDialogVisible = $event"
      @update:name="categoryName = $event"
      @confirm="saveCategoryDraft"
    />
    <AttributeCategoryEditDialog
      :visible="categoryEditDialogVisible"
      :parent-name="categoryParentName"
      :name="categoryEditName"
      :submitting="categoryEditSubmitting"
      :error="categoryEditError"
      @update:visible="categoryEditDialogVisible = $event"
      @update:name="categoryEditName = $event"
      @confirm="saveCategoryEdit"
    />
    <AttributePropertyFormDialog
      :visible="attributeDialogVisible"
      :editing-attribute-id="editingAttributeId"
      :draft="draft"
      :rules="attributeRules"
      :category-options="categoryOptions"
      :data-types="dataTypes"
      :storage-groups="storageGroups"
      :command-error="attributeCommandError"
      :saving="savingAttribute"
      @update:visible="attributeDialogVisible = $event"
      @confirm="saveAttributeDraft"
    />
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useAttributeCategoryTree } from "../composables/useAttributeCategoryTree";
import { useAttributePropertyList } from "../composables/useAttributePropertyList";
import AttributeCategoryCreateDialog from "./AttributeCategoryCreateDialog.vue";
import AttributeCategoryEditDialog from "./AttributeCategoryEditDialog.vue";
import AttributeCategoryTree from "./AttributeCategoryTree.vue";
import AttributePropertyFormDialog from "./AttributePropertyFormDialog.vue";
import AttributePropertyTable from "./AttributePropertyTable.vue";

const selectedCategoryId = ref("all");

let categoryApi: ReturnType<typeof useAttributeCategoryTree>;

const {
  dataTypes,
  storageGroups,
  attributes,
  attributeLoading,
  attributeError,
  attributeCommandError,
  attributeSearch,
  attributeDialogVisible,
  savingAttribute,
  editingAttributeId,
  draft,
  attributeRules,
  visibleAttributes,
  categoryOptions,
  loadAttributesForSelection,
  openDataSource,
  openCreateAttribute,
  openEditAttribute,
  saveAttributeDraft,
  removeAttribute,
} = useAttributePropertyList({
  selectedCategoryId,
  getCategories: () => categoryApi.categories.value,
});

categoryApi = useAttributeCategoryTree({
  selectedCategoryId,
  attributes,
  onCategorySelected: () => {
    void loadAttributesForSelection();
  },
});

const {
  categories,
  treeProps,
  categorySearch,
  categoryTreeLoading,
  categoryTreeError,
  categoryTreeEmpty,
  categoryDialogVisible,
  categorySubmitting,
  categoryError,
  categoryEditDialogVisible,
  categoryEditSubmitting,
  categoryEditError,
  categoryEditName,
  categoryName,
  categoryParentName,
  selectedCategoryName,
  filterCategoryNode,
  loadAttributeCategoryTree,
  selectCategory,
  openCategoryEdit,
  saveCategoryEdit,
  openCategoryCreate,
  openRootCategoryCreate,
  saveCategoryDraft,
  removeCategory,
} = categoryApi;

onMounted(() => {
  void loadAttributeCategoryTree();
  void loadAttributesForSelection();
});
</script>

<style scoped lang="scss">
.ontology-object-attribute-panel {
  display: grid;
  width: 100%;
  min-width: 0;
  min-height: 0;
  flex: 1;
  grid-template-columns: minmax(260px, 28%) minmax(0, 1fr);
  gap: 8px;
}

@media (max-width: 980px) {
  .ontology-object-attribute-panel {
    grid-template-columns: 230px minmax(0, 1fr);
  }
}

@media (max-width: 720px) {
  .ontology-object-attribute-panel {
    grid-template-columns: 1fr;
    overflow: auto;
  }
}
</style>
