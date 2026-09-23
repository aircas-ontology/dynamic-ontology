<template>
  <el-dialog v-model="visible" class="aircas-dialog ontology-object-create-dialog" title="新建本体" width="min(720px, 94vw)" append-to-body destroy-on-close>
    <template #header>
      <span>{{ editingItem ? "编辑本体" : "新建本体" }}</span>
    </template>
    <div v-if="!editingItem" class="ontology-object-create-dialog__modes" role="tablist" aria-label="创建方式">
      <button
        v-for="mode in modes"
        :key="mode.value"
        type="button"
        class="ontology-object-create-dialog__mode"
        :class="{ 'is-active': createMode === mode.value }"
        role="tab"
        :aria-selected="createMode === mode.value"
        @click="selectCreateMode(mode.value)"
      >
        <el-icon><component :is="mode.icon" /></el-icon>
        <strong>{{ mode.label }}</strong>
        <span>{{ mode.hint }}</span>
      </button>
    </div>

    <div v-if="createMode === 'manual'" class="ontology-object-create-dialog__panel">
      <el-form class="aircas-form" label-position="top">
        <div class="ontology-object-create-dialog__grid">
          <el-form-item label="API 名称" required>
            <el-input
              v-model="draft.apiName"
              class="aircas-input"
              maxlength="64"
              ariaLabel="API 名称"
              placeholder="如 airplane"
              :disabled="submitting || Boolean(editingItem)"
            />
          </el-form-item>
          <el-form-item label="显示名称" required>
            <el-input
              v-model="draft.displayName"
              class="aircas-input"
              maxlength="64"
              ariaLabel="显示名称"
              placeholder="请输入本体显示名称"
              :disabled="submitting"
            />
          </el-form-item>
        </div>
        <el-form-item label="描述">
          <el-input v-model="draft.description" class="aircas-input" type="textarea" :rows="2" maxlength="300" ariaLabel="描述" :disabled="submitting" />
        </el-form-item>
        <el-form-item label="本体图标">
          <div class="ontology-object-create-dialog__icon-field">
            <div v-if="draft.iconUrl" class="ontology-object-create-dialog__icon-preview">
              <img :src="draft.iconUrl" alt="本体图标预览" />
              <el-button class="aircas-button" :disabled="submitting" @click="clearIcon">清除</el-button>
            </div>
            <el-upload
              :auto-upload="false"
              :show-file-list="false"
              accept="image/png,image/jpeg,image/webp,image/svg+xml,.png,.jpg,.jpeg,.webp,.svg"
              :on-change="handleIconChange"
            >
              <el-button class="aircas-button" :disabled="submitting">{{ draft.iconUrl ? "重新选择" : "选择本地图片" }}</el-button>
            </el-upload>
            <span class="ontology-object-create-dialog__hint">可选，PNG / JPG / WEBP / SVG，不超过 2MB</span>
            <p v-if="iconError" class="ontology-object-create-dialog__error" role="alert">{{ iconError }}</p>
          </div>
        </el-form-item>
        <div class="ontology-object-create-dialog__grid">
          <el-form-item v-if="!editingItem" label="继承本体">
            <el-select
              v-model="draft.parentId"
              class="aircas-select"
              popper-class="aircas-select-popper"
              clearable
              filterable
              placeholder="可选"
              :disabled="submitting"
            >
              <el-option v-for="item in parentOptions" :key="item.id" :label="`${item.displayName} (${item.apiName})`" :value="item.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="分类" required>
            <el-tree-select
              v-model="draft.categoryId"
              class="aircas-tree-select"
              popper-class="aircas-tree-select-popper"
              :data="categoryTreeOptions"
              check-strictly
              filterable
              :render-after-expand="false"
              node-key="id"
              :props="{ label: 'label', children: 'children' }"
              placeholder="请选择分类"
              :disabled="submitting"
              style="width: 100%"
            />
          </el-form-item>
        </div>
      </el-form>
    </div>

    <div v-else-if="createMode === 'import'" class="ontology-object-create-dialog__panel">
      <div class="ontology-object-create-dialog__import-head">
        <p>上传符合字段结构的 JSON 文件，支持批量导入当前分类。</p>
        <el-button class="aircas-button" :disabled="submitting" @click="downloadTemplate">下载模板</el-button>
      </div>
      <el-upload
        class="ontology-object-create-dialog__upload"
        drag
        :auto-upload="false"
        accept=".json,application/json"
        :limit="1"
        :disabled="submitting"
        :on-change="handleImportChange"
      >
        <el-icon><UploadFilled /></el-icon>
        <p>将文件拖到此处，或<em>点击上传</em></p>
        <span>仅支持 .json</span>
      </el-upload>
      <p v-if="importError" class="ontology-object-create-dialog__error" role="alert">{{ importError }}</p>
    </div>

    <div v-else class="ontology-object-create-dialog__panel ontology-object-create-dialog__panel--llm">
      <el-icon><MagicStick /></el-icon>
      <div>
        <strong>大模型动态构建</strong>
        <p>进入智能管理助手构建流程，完成对象、属性、关系和行为等知识结构的配置。</p>
      </div>
    </div>

    <p v-if="validationError" class="ontology-object-create-dialog__error" role="alert">{{ validationError }}</p>
    <p v-if="error" class="ontology-object-create-dialog__error" role="alert">{{ error }}</p>
    <template #footer>
      <el-button class="aircas-button" :disabled="submitting" @click="visible = false">取消</el-button>
      <el-button v-if="createMode === 'llm'" class="aircas-button" type="primary" :disabled="submitting" @click="emit('open-llm')">进入大模型构建</el-button>
      <el-button v-else class="aircas-button" type="primary" :loading="submitting" @click="submitCreate">{{ editingItem ? "保存修改" : "确认创建" }}</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { MagicStick, UploadFilled, Plus, Upload } from "@element-plus/icons-vue";
import type { UploadFile } from "element-plus";
import type { OntologyConceptNode, OntologyObjectCreateDraft, OntologyObjectItem } from "@/types";

interface CategoryTreeOption {
  id: string;
  label: string;
  children: CategoryTreeOption[];
}
interface ParentOption {
  id: string;
  displayName: string;
  apiName: string;
}
type CreateMode = "manual" | "import" | "llm";

const visible = defineModel<boolean>({ required: true });
const props = defineProps<{
  categoryTree: OntologyConceptNode[];
  parentOptions: ParentOption[];
  submitting: boolean;
  error: string;
  editingItem?: OntologyObjectItem | null;
}>();
const emit = defineEmits<{
  "submit-manual": [draft: OntologyObjectCreateDraft];
  "submit-import": [file: File];
  "submit-edit": [draft: OntologyObjectCreateDraft];
  "open-llm": [];
}>();
const modes = [
  { value: "manual" as const, label: "手动创建", hint: "表单填写并可继承", icon: Plus },
  { value: "import" as const, label: "导入创建", hint: "JSON 批量导入", icon: Upload },
  { value: "llm" as const, label: "大模型构建", hint: "智能助手流程", icon: MagicStick },
];
const createMode = ref<CreateMode>("manual");
const draft = reactive<OntologyObjectCreateDraft>({ apiName: "", displayName: "", description: "", iconUrl: "", categoryId: "", parentId: undefined });
const importFile = ref<File | null>(null);
const importError = ref("");
const validationError = ref("");
const iconError = ref("");
const templateJson = JSON.stringify([{ apiName: "airplane", displayName: "飞机", description: "", iconUrl: "", categoryId: "1" }], null, 2);

/**
 * @description 将概念层级树映射为分类树选择数据，节点 id 使用分类提交 id。
 * @param nodes 概念层级树节点。
 * @returns 树选择选项。
 */
function mapCategoryTreeOptions(nodes: OntologyConceptNode[]): CategoryTreeOption[] {
  return nodes.map((node) => ({
    id: node.targetCategoryId ?? node.id,
    label: node.label || `分类 ${node.id}`,
    children: mapCategoryTreeOptions(node.children),
  }));
}

const categoryTreeOptions = computed(() => mapCategoryTreeOptions(props.categoryTree));

watch([visible, () => props.editingItem], ([opened, editingItem]) => {
  if (!opened) return;
  createMode.value = "manual";
  draft.apiName = editingItem?.apiName ?? "";
  draft.displayName = editingItem?.displayName ?? "";
  draft.description = editingItem?.description ?? "";
  draft.iconUrl = editingItem?.iconUrl ?? "";
  draft.parentId = undefined;
  draft.categoryId = editingItem?.categoryId ?? categoryTreeOptions.value[0]?.id ?? "";
  importFile.value = null;
  importError.value = "";
  validationError.value = "";
  iconError.value = "";
});

/**
 * @description 切换创建模式并清理上次表单校验提示。
 * @param mode 目标创建模式。
 */
function selectCreateMode(mode: CreateMode) {
  createMode.value = mode;
  validationError.value = "";
  importFile.value = null;
  importError.value = "";
}

/** @description 读取本地图片并返回预览数据地址。 */
function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => (typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("读取图片失败")));
    reader.onerror = () => reject(new Error("读取图片失败"));
    reader.readAsDataURL(file);
  });
}

/**
 * @description 校验并读取本地本体图标。
 * @param file Element Plus 上传文件。
 * @returns 图片读取流程的 Promise。
 */
async function handleIconChange(file: UploadFile) {
  const raw = file.raw;
  iconError.value = "";
  if (!raw || raw.size > 2 * 1024 * 1024 || (!/^(image\/(png|jpeg|webp|svg\+xml))$/i.test(raw.type) && !/\.(png|jpe?g|webp|svg)$/i.test(raw.name))) {
    iconError.value = "仅支持不超过 2MB 的 PNG / JPG / WEBP / SVG 图片";
    return;
  }
  try {
    draft.iconUrl = await readFileAsDataUrl(raw);
  } catch {
    iconError.value = "图片读取失败，请重试";
  }
}

/** @description 清除当前本体图标预览。 */
function clearIcon() {
  draft.iconUrl = "";
  iconError.value = "";
}

/**
 * @description 记录导入创建所选文件，确认时再提交给导入接口。
 * @param file Element Plus 上传文件。
 */
function handleImportChange(file: UploadFile) {
  importError.value = "";
  importFile.value = file.raw ?? null;
}

/** @description 下载当前项目可直接导入的本体 JSON 模板。 */
function downloadTemplate() {
  const url = URL.createObjectURL(new Blob([templateJson], { type: "application/json" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "create_ontology_template.json";
  anchor.click();
  URL.revokeObjectURL(url);
}

/** @description 校验当前创建模式并向父组件提交一个或多个本体草稿。 */
function submitCreate() {
  if (props.submitting || iconError.value) return;
  if (createMode.value === "import") {
    if (!importFile.value) {
      importError.value = "请先选择文件。";
      return;
    }
    emit("submit-import", importFile.value);
    return;
  }
  if (!draft.apiName.trim() || !draft.displayName.trim() || !draft.categoryId) {
    validationError.value = "请填写 API 名称、显示名称并选择分类";
    return;
  }
  const payload: OntologyObjectCreateDraft = { ...draft };
  if (props.editingItem) emit("submit-edit", payload);
  else emit("submit-manual", payload);
}
</script>

<style scoped lang="scss">
.ontology-object-create-dialog__modes {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 16px;
}
.ontology-object-create-dialog__mode {
  display: flex;
  min-height: 92px;
  padding: 12px;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  border: 1px solid var(--aircas-color-border-soft);
  border-radius: 8px;
  color: var(--aircas-color-text-secondary);
  background: var(--aircas-color-panel-background-deep);
  text-align: left;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}
.ontology-object-create-dialog__mode .el-icon {
  margin-bottom: 4px;
  color: var(--aircas-color-accent-cyan);
  font-size: 20px;
}
.ontology-object-create-dialog__mode strong {
  color: var(--aircas-color-text-primary);
  font-size: 14px;
}
.ontology-object-create-dialog__mode span,
.ontology-object-create-dialog__hint {
  color: var(--aircas-color-text-muted);
  font-size: 12px;
}
.ontology-object-create-dialog__mode.is-active {
  border-color: var(--aircas-color-accent-cyan);
  box-shadow: 0 0 12px var(--aircas-color-accent-cyan-soft);
}
.ontology-object-create-dialog__panel {
  padding: 14px;
  border: 1px solid var(--aircas-color-border-soft);
  border-radius: 8px;
  background: var(--aircas-color-panel-background-deep);
}
.ontology-object-create-dialog__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 16px;
}
.ontology-object-create-dialog__icon-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.ontology-object-create-dialog__icon-preview {
  display: flex;
  align-items: center;
  gap: 12px;
}
.ontology-object-create-dialog__icon-preview img {
  width: 64px;
  height: 64px;
  object-fit: contain;
  border: 1px solid var(--aircas-color-border-soft);
  border-radius: 8px;
}
.ontology-object-create-dialog__import-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.ontology-object-create-dialog__import-head p,
.ontology-object-create-dialog__panel--llm p {
  margin: 0;
  color: var(--aircas-color-text-secondary);
  font-size: 13px;
}
.ontology-object-create-dialog__upload {
  margin-top: 14px;
  text-align: center;
}
.ontology-object-create-dialog__upload p {
  margin: 8px 0 4px;
  color: var(--aircas-color-text-secondary);
}
.ontology-object-create-dialog__upload em {
  color: var(--aircas-color-accent-cyan);
  font-style: normal;
}
.ontology-object-create-dialog__upload span {
  color: var(--aircas-color-text-muted);
  font-size: 12px;
}
.ontology-object-create-dialog__panel--llm {
  display: flex;
  min-height: 120px;
  align-items: center;
  gap: 14px;
}
.ontology-object-create-dialog__panel--llm > .el-icon {
  color: var(--aircas-color-accent-cyan);
  font-size: 40px;
}
.ontology-object-create-dialog__panel--llm strong {
  display: block;
  margin-bottom: 6px;
  color: var(--aircas-color-accent-cyan);
  font-size: 15px;
}
.ontology-object-create-dialog__error {
  margin: 10px 0 0;
  color: var(--aircas-color-danger);
  font-size: 12px;
}
@media (max-width: 640px) {
  .ontology-object-create-dialog__modes,
  .ontology-object-create-dialog__grid {
    grid-template-columns: 1fr;
  }
}
</style>
