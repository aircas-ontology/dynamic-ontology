<template>
  <el-dialog v-model="visible" class="asset-build-dialog" title="资产构建" width="min(1480px, 98vw)" :show-close="!submitting" :close-on-click-modal="!submitting" :close-on-press-escape="!submitting" align-center append-to-body destroy-on-close>
    <div v-loading="submitting" class="asset-build">
      <aside class="asset-build__tree">
        <h3>资产模型树</h3>
        <el-input v-model="keyword" placeholder="搜索资产模型" ariaLabel="搜索资产模型" clearable />
        <el-tree
          ref="treeRef"
          :data="assetModelTreeMock"
          node-key="id"
          default-expand-all
          :filter-node-method="filterAssetNode"
          :props="{ label: 'label', children: 'children' }"
          @node-click="selectAssetModel"
        />
      </aside>
      <section class="asset-build__content">
        <template v-if="detail">
          <el-steps :active="buildStep - 1" finish-status="success" align-center class="asset-build__steps">
            <el-step title="资产标准" />
            <el-step title="对象信息" />
          </el-steps>

          <template v-if="buildStep === 1">
            <header class="asset-build__heading">
              <h3>资产标准</h3>
              <el-tag>{{ detail.domain }}</el-tag>
            </header>
            <p class="asset-build__hint">选择模型「{{ detail.name }}」中需要纳入对象的概念属性。</p>
            <header class="asset-build__heading">
              <h3>模型概念属性</h3>
              <span>已选 {{ selectedIds.length }} / {{ detail.properties.length }} 个属性</span>
            </header>
            <el-table
              ref="standardTableRef"
              :key="detail.id"
              :data="detail.properties"
              :row-key="getAssetPropertyKey"
              v-loading="selectionRestoring"
              max-height="520"
              @selection-change="selectAssetProperties"
            >
              <el-table-column type="selection" width="44" fixed="left" />
              <el-table-column prop="id" label="数据元标识符" min-width="130" show-overflow-tooltip />
              <el-table-column prop="name" label="数据元名称" min-width="150" show-overflow-tooltip />
              <el-table-column label="数据元简称" min-width="110" show-overflow-tooltip>
                <template #default="{ row }">{{ row.shortName || "—" }}</template>
              </el-table-column>
              <el-table-column prop="description" label="数据元定义" min-width="260" show-overflow-tooltip />
              <el-table-column prop="dataType" label="数据元值的数据类型" min-width="140" show-overflow-tooltip />
              <el-table-column prop="representation" label="数据元值的表示形式" min-width="140" show-overflow-tooltip />
            </el-table>
          </template>

          <template v-else>
            <header class="asset-build__heading">
              <h3>对象信息</h3>
              <el-tag>{{ detail.domain }}</el-tag>
            </header>
            <el-form label-position="top" class="asset-build__object-form">
              <div class="asset-build__form">
                <el-form-item label="API 名称" required>
                  <el-input v-model="objectDraft.apiName" maxlength="63" ariaLabel="API 名称" placeholder="如 airplane" :disabled="iconUploading" />
                </el-form-item>
                <el-form-item label="显示名称" required>
                  <el-input v-model="objectDraft.displayName" maxlength="64" ariaLabel="显示名称" placeholder="请输入对象显示名称" :disabled="iconUploading" />
                </el-form-item>
              </div>
              <el-form-item label="描述">
                <el-input v-model="objectDraft.description" type="textarea" :rows="2" maxlength="300" ariaLabel="描述" :disabled="iconUploading" />
              </el-form-item>
              <el-form-item label="对象图标">
                <div class="asset-build__icon-field">
                  <div v-if="objectDraft.iconUrl" class="asset-build__icon-preview">
                    <img :src="objectDraft.iconUrl" alt="对象图标预览" />
                    <el-button :disabled="iconUploading" @click="clearIcon">清除</el-button>
                  </div>
                  <el-upload
                    v-if="!objectDraft.iconUrl"
                    class="asset-build__picture-upload"
                    action="#"
                    list-type="picture-card"
                    :auto-upload="false"
                    :show-file-list="false"
                    :limit="1"
                    accept="image/png,image/jpeg,.png,.jpg,.jpeg"
                    :disabled="iconUploading"
                    :on-change="handleIconChange"
                    :on-exceed="handleIconExceed"
                  >
                    <el-icon><Plus /></el-icon>
                  </el-upload>
                  <span class="asset-build__hint">可选，PNG / JPG，不超过 2MB</span>
                  <p v-if="iconError" class="asset-build__error" role="alert">{{ iconError }}</p>
                </div>
              </el-form-item>
              <div class="asset-build__form">
                <el-form-item label="继承对象">
                  <el-select v-model="objectDraft.parentId" clearable filterable placeholder="可选" :disabled="iconUploading" style="width: 100%">
                    <el-option v-for="item in parentOptions" :key="item.id" :label="`${item.displayName} (${item.apiName})`" :value="item.id" />
                  </el-select>
                </el-form-item>
                <el-form-item label="分类" required>
                  <el-tree-select
                    v-model="objectDraft.categoryId"
                    :data="categoryTree"
                    check-strictly
                    filterable
                    :render-after-expand="false"
                    node-key="id"
                    :props="{ label: 'label', children: 'children' }"
                    placeholder="请选择分类"
                    :disabled="iconUploading || Boolean(objectDraft.parentId)"
                    style="width: 100%"
                  />
                </el-form-item>
              </div>
            </el-form>

            <header class="asset-build__heading">
              <h3>属性列表</h3>
              <span>已纳入 {{ objectPropertyList.length }} 个属性</span>
            </header>
            <el-table :data="objectPropertyList" row-key="sourceKey" max-height="320">
              <el-table-column prop="name" label="属性名称" min-width="150" show-overflow-tooltip />
              <el-table-column label="API" min-width="170">
                <template #default="{ row }"
                  ><el-input v-model="row.apiName" maxlength="63" :ariaLabel="`${row.name} API`" placeholder="请输入 API"
                /></template>
              </el-table-column>
              <el-table-column label="数据类型" min-width="135">
                <template #default="{ row }">
                  <el-select v-model="row.dataType" :ariaLabel="`${row.name}数据类型`" placeholder="请选择类型">
                    <el-option v-for="type in ASSET_PROPERTY_DATA_TYPES" :key="type" :label="type" :value="type" />
                  </el-select>
                </template>
              </el-table-column>
              <el-table-column label="默认值" min-width="150">
                <template #default="{ row }"><el-input v-model="row.defaultValue" :ariaLabel="`${row.name}默认值`" placeholder="请输入默认值" /></template>
              </el-table-column>
              <el-table-column label="属性描述" min-width="230">
                <template #default="{ row }"><el-input v-model="row.description" :ariaLabel="`${row.name}属性描述`" placeholder="请输入属性描述" /></template>
              </el-table-column>
              <el-table-column label="主键" width="64" align="center">
                <template #default="{ row }"
                  ><el-radio :model-value="row.isPrimary" :value="true" @change="setAssetPropertyKey(row.sourceKey, 'primary')"
                    ><span class="asset-build__sr-only">{{ row.name }}设为主键</span></el-radio
                  ></template
                >
              </el-table-column>
              <el-table-column label="名称键" width="75" align="center">
                <template #default="{ row }"
                  ><el-radio :model-value="row.isNameKey" :value="true" @change="setAssetPropertyKey(row.sourceKey, 'name')"
                    ><span class="asset-build__sr-only">{{ row.name }}设为名称键</span></el-radio
                  ></template
                >
              </el-table-column>
              <el-table-column type="expand" label="元数据" width="80">
                <template #default="{ row }">
                  <p class="asset-build__metadata"><span>元数据：</span>{{ row.representation?.trim() ? row.representation : "暂无元数据" }}</p>
                </template>
              </el-table-column>
            </el-table>
          </template>
        </template>
        <el-empty v-else description="请在左侧选择一个资产模型" />
        <el-alert v-if="error" :title="error" type="error" :closable="false" class="asset-build__saved" />
      </section>
    </div>
    <template #footer>
      <el-button :disabled="submitting" @click="visible = false">关闭</el-button>
      <el-button v-if="detail && buildStep === 2" :disabled="submitting" @click="goToAssetStandardStep">上一步</el-button>
      <el-button v-if="detail && buildStep === 1" type="primary" :disabled="selectionRestoring || submitting" @click="goToObjectInfoStep">下一步</el-button>
      <el-button v-if="detail && buildStep === 2" type="primary" :disabled="iconUploading" :loading="submitting" @click="confirmAssetCreate">确认创建</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, reactive, ref, watch } from "vue";
import { Plus } from "@element-plus/icons-vue";
import { ElMessage, ElTree, vLoading } from "element-plus";
import type { UploadFile } from "element-plus";
import { postBuildOntologyAssetInterface, postUploadOntologyThumbnailInterface } from "@/apis";
import type { AssetModelDetail, AssetModelProperty, AssetObjectPropertyDraft, OntologyObjectCreateDraft } from "@/types";
import { assetModelDetailMock, assetModelTreeMock } from "@/mocks/assetModelBuilderMock/assetModelBuilderMock";
import {
  assertAssetStandardSelection,
  ASSET_PROPERTY_DATA_TYPES,
  buildAssetModelConfiguration,
  buildAssetOntologyRequest,
  buildAssetPropertyDrafts,
} from "../utils/buildAssetModelConfiguration";

interface CategoryTreeOption {
  id: string;
  label: string;
  children: CategoryTreeOption[];
}

interface ParentOption {
  id: string;
  displayName: string;
  apiName: string;
  categoryId: string;
}

const visible = defineModel<boolean>({ required: true });
const props = defineProps<{
  spaceId: string;
  categoryTree: CategoryTreeOption[];
  parentOptions: ParentOption[];
  initialCategoryId: string;
}>();
const emit = defineEmits<{ created: [] }>();

const treeRef = ref<InstanceType<typeof ElTree>>();
const standardTableRef = ref<{ toggleRowSelection: (row: AssetModelProperty, selected?: boolean) => void }>();
const keyword = ref("");
const detail = ref<AssetModelDetail | null>(null);
const buildStep = ref<1 | 2>(1);
const objectDraft = reactive<OntologyObjectCreateDraft>({
  apiName: "",
  displayName: "",
  description: "",
  iconUrl: "",
  categoryId: "",
  parentId: undefined,
});
const selectedIds = ref<string[]>([]);
/** 第二步展示的已选标准属性快照，避免第一步表格销毁清空勾选。 */
const objectPropertyList = ref<AssetObjectPropertyDraft[]>([]);
const selectionRestoring = ref(false);
const error = ref("");
const iconError = ref("");
const iconUploading = ref(false);
const submitting = ref(false);
let iconUploadSerial = 0;
let selectionRestoreSerial = 0;
let createRequestSerial = 0;

/**
 * @description 按模型节点名称过滤树。
 * @param value 搜索词。
 * @param data 树节点。
 * @returns 是否匹配。
 */
function filterAssetNode(value: string, data: unknown): boolean {
  if (!value.trim()) return true;
  return (
    typeof data === "object" &&
    data !== null &&
    "label" in data &&
    typeof data.label === "string" &&
    data.label.toLowerCase().includes(value.trim().toLowerCase())
  );
}

/**
 * @description 选择资产模板并重置到资产标准步骤。
 * @param node 树节点。
 */
function selectAssetModel(node: { modelId?: string }): void {
  if (submitting.value) return;
  const model = assetModelDetailMock.find((item) => item.id === node.modelId);
  if (!model) return;
  detail.value = model;
  buildStep.value = 1;
  Object.assign(objectDraft, {
    apiName: model.apiName,
    displayName: model.name,
    description: model.description,
    iconUrl: "",
    categoryId: props.initialCategoryId,
    parentId: undefined,
  });
  selectedIds.value = [];
  objectPropertyList.value = [];
  selectionRestoring.value = false;
  selectionRestoreSerial += 1;
  error.value = "";
  iconError.value = "";
}

/**
 * @description 保留勾选属性标识；仅在资产标准步骤响应，避免销毁表格时被清空。
 * @param rows 当前选中属性。
 */
function selectAssetProperties(rows: AssetModelProperty[]): void {
  if (buildStep.value !== 1 || selectionRestoring.value) return;
  selectedIds.value = rows.map(getAssetPropertyKey).filter((key) => key !== "");
}

/**
 * @description 用标准属性在模型中的位置区分相同数据元标识的不同记录。
 * @param row 资产标准属性。
 * @returns 当前模型内唯一的行标识；未找到时为空字符串。
 */
function getAssetPropertyKey(row: AssetModelProperty): string {
  const index = detail.value?.properties.indexOf(row) ?? -1;
  return index < 0 ? "" : String(index);
}

/**
 * @description 校验资产标准后将已选标准带入对象信息步骤的属性列表。
 */
function goToObjectInfoStep(): void {
  error.value = "";
  try {
    assertAssetStandardSelection(selectedIds.value);
    if (!detail.value) return;
    const selected = new Set(selectedIds.value);
    objectPropertyList.value = buildAssetPropertyDrafts(
      detail.value.properties.map((property, index) => ({ key: String(index), property })).filter((item) => selected.has(item.key)),
      objectPropertyList.value,
    );
    if (!objectPropertyList.value.length) throw new Error("请至少选择一个属性");
    buildStep.value = 2;
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : "请完善资产标准";
  }
}

/**
 * @description 返回资产标准步骤。
 */
async function goToAssetStandardStep(): Promise<void> {
  const serial = ++selectionRestoreSerial;
  selectionRestoring.value = true;
  buildStep.value = 1;
  error.value = "";
  await nextTick();
  if (serial !== selectionRestoreSerial || buildStep.value !== 1 || !detail.value) return;
  const selected = new Set(selectedIds.value);
  detail.value.properties.forEach((property, index) => {
    if (selected.has(String(index))) standardTableRef.value?.toggleRowSelection(property, true);
  });
  selectionRestoring.value = false;
}

/**
 * @description 为已选属性设置唯一的主键或名称键。
 * @param sourceKey 属性行标识。
 * @param kind 要设置的键类型。
 */
function setAssetPropertyKey(sourceKey: string, kind: "primary" | "name"): void {
  for (const property of objectPropertyList.value) {
    if (kind === "primary") property.isPrimary = property.sourceKey === sourceKey;
    else property.isNameKey = property.sourceKey === sourceKey;
  }
}

/**
 * @description 校验并上传对象图标。
 * @param file Element Plus 上传文件。
 */
async function handleIconChange(file: UploadFile): Promise<void> {
  const raw = file.raw;
  iconError.value = "";
  if (!raw || iconUploading.value) return;
  if (raw.size > 2 * 1024 * 1024 || (!/^(image\/(png|jpeg))$/i.test(raw.type) && !/\.(png|jpe?g)$/i.test(raw.name))) {
    iconError.value = "仅支持不超过 2MB 的 PNG / JPG 图片";
    return;
  }
  const serial = ++iconUploadSerial;
  iconUploading.value = true;
  try {
    const response = await postUploadOntologyThumbnailInterface({ image: raw });
    if (serial !== iconUploadSerial) return;
    if (response.code !== 200) {
      iconError.value = typeof response.message === "string" && response.message.trim() ? response.message : "图标上传失败";
      return;
    }
    objectDraft.iconUrl = typeof response.data === "string" ? response.data : "";
    if (!objectDraft.iconUrl) iconError.value = "图标上传失败";
  } catch (cause: unknown) {
    if (serial === iconUploadSerial) {
      iconError.value = cause instanceof Error && cause.message.trim() ? cause.message : "图标上传失败";
    }
  } finally {
    if (serial === iconUploadSerial) iconUploading.value = false;
  }
}

/** @description 提示对象图标仅允许选择一张图片。 */
function handleIconExceed(): void {
  iconError.value = "对象图标仅支持上传一张图片，请先清除当前图片。";
}

/** @description 清除当前对象图标预览。 */
function clearIcon(): void {
  iconUploadSerial += 1;
  iconUploading.value = false;
  objectDraft.iconUrl = "";
  iconError.value = "";
}

/**
 * @description 校验配置并创建资产对象，成功后关闭弹窗并通知刷新列表。
 */
async function confirmAssetCreate(): Promise<void> {
  if (!detail.value || submitting.value || iconUploading.value || iconError.value) return;
  error.value = "";
  try {
    const configuration = buildAssetModelConfiguration(detail.value, objectDraft, objectPropertyList.value);
    const params = buildAssetOntologyRequest(configuration, props.spaceId);
    const serial = ++createRequestSerial;
    submitting.value = true;
    try {
      const response = await postBuildOntologyAssetInterface(params);
      if (serial !== createRequestSerial) return;
      if (response.code !== 200) throw new Error(response.message?.trim() || "资产构建对象失败，请重试。");
      if (!response.data?.uniqueIdentifier) throw new Error("创建接口未返回对象标识，请检查创建结果。");
      visible.value = false;
      ElMessage.success("对象创建成功");
      emit("created");
    } catch (cause: unknown) {
      if (serial === createRequestSerial) {
        error.value = cause instanceof Error && cause.message.trim() ? cause.message : "资产构建对象失败，请重试。";
        ElMessage.error(error.value);
      }
    } finally {
      if (serial === createRequestSerial) submitting.value = false;
    }
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : "确认创建失败";
    ElMessage.error(error.value);
  }
}

watch(keyword, (value) => treeRef.value?.filter(value));

watch(
  () => objectDraft.parentId,
  (parentId) => {
    if (!parentId) return;
    const parentOption = props.parentOptions.find((item) => item.id === parentId);
    if (parentOption) objectDraft.categoryId = parentOption.categoryId;
  },
);

watch(visible, (opened) => {
  createRequestSerial += 1;
  submitting.value = false;
  keyword.value = "";
  detail.value = null;
  buildStep.value = 1;
  selectedIds.value = [];
  objectPropertyList.value = [];
  selectionRestoring.value = false;
  selectionRestoreSerial += 1;
  error.value = "";
  iconError.value = "";
  iconUploading.value = false;
  iconUploadSerial += 1;
  Object.assign(objectDraft, {
    apiName: "",
    displayName: "",
    description: "",
    iconUrl: "",
    categoryId: opened ? props.initialCategoryId : "",
    parentId: undefined,
  });
}, { flush: "sync" });

onBeforeUnmount(() => {
  createRequestSerial += 1;
});
</script>

<style scoped lang="scss">
.asset-build__metadata {
  margin: 8px 12px;
  padding: 8px 16px;
  border: 1px solid var(--aircas-color-border);
  border-radius: 4px;
  background: var(--aircas-color-panel-background-deep);
  color: var(--aircas-color-text-primary);
  overflow-wrap: anywhere;
}
.asset-build__metadata span {
  color: var(--aircas-color-text-secondary);
}
.asset-build__sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
.asset-build {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 20px;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}
.asset-build__tree,
.asset-build__content {
  min-width: 0;
  min-height: 0;
  overflow: auto;
  padding: 16px;
  border: 1px solid var(--aircas-color-border);
  border-radius: 8px;
  background: var(--aircas-color-panel-background);
}
.asset-build__tree h3,
.asset-build__heading h3 {
  margin: 0;
  font-size: 16px;
}
.asset-build__tree {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.asset-build__steps {
  margin-bottom: 16px;
}
.asset-build__heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}
.asset-build__heading span {
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
}
.asset-build__hint {
  margin: 0 0 12px;
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
}
.asset-build__form {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.asset-build__object-form {
  margin-bottom: 16px;
}
.asset-build__icon-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.asset-build__icon-preview {
  display: flex;
  align-items: center;
  gap: 12px;
}
.asset-build__icon-preview img {
  width: 72px;
  height: 72px;
  object-fit: cover;
  border: 1px solid var(--aircas-color-border-light);
  border-radius: 6px;
}
.asset-build__picture-upload :deep(.el-upload--picture-card) {
  width: 72px;
  height: 72px;
}
.asset-build__error {
  margin: 0;
  color: var(--aircas-color-danger);
  font-size: 12px;
}
.asset-build__saved {
  margin-top: 12px;
}
@media (max-width: 800px) {
  .asset-build {
    grid-template-columns: 1fr;
    overflow: hidden;
  }
  .asset-build__tree {
    max-height: 220px;
  }
  .asset-build__form {
    grid-template-columns: 1fr;
  }
}
</style>

<style lang="scss">
.el-overlay-dialog:has(.asset-build-dialog) {
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.asset-build-dialog.el-dialog {
  display: flex;
  flex-direction: column;
  max-height: 92vh;
  margin: 0 !important;
  overflow: hidden;
}
.asset-build-dialog .el-dialog__header,
.asset-build-dialog .el-dialog__footer {
  flex-shrink: 0;
}
.asset-build-dialog .el-dialog__body {
  flex: 1 1 auto;
  min-height: 0;
  height: min(800px, calc(92vh - 150px));
  overflow: hidden;
}
</style>
