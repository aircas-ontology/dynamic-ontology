<template>
  <el-dialog
    v-model="visible"
    :title="space ? '编辑对象空间' : '新建对象空间'"
    width="min(640px, 94vw)"
    :close-on-click-modal="!busy"
    :close-on-press-escape="!busy"
    :show-close="!busy"
    destroy-on-close
  >
    <el-radio-group v-if="!space" :model-value="mode" @update:model-value="setMode" :disabled="busy">
      <el-radio-button value="manual">手动创建</el-radio-button>
      <el-radio-button value="import">导入创建</el-radio-button>
    </el-radio-group>
    <el-form v-if="mode === 'manual'" class="space-form" label-position="top" :disabled="busy">
      <el-form-item label="API 名称（必填）" :error="apiNameError"
        ><el-input v-model="draft.apiName" ariaLabel="API 名称" :disabled="!!space" maxlength="63" placeholder="例如 example_space"
      /></el-form-item>
      <el-form-item label="空间名称（必填）" :error="displayNameError"
        ><el-input v-model="draft.displayName" ariaLabel="空间名称" maxlength="64"
      /></el-form-item>
      <el-form-item label="空间描述"
        ><el-input v-model="draft.description" ariaLabel="空间描述" type="textarea" :rows="3" maxlength="256" show-word-limit
      /></el-form-item>
      <el-form-item label="空间图标">
        <div class="space-form__upload">
          <div v-if="draft.iconUrl" class="space-form__preview">
            <img :src="draft.iconUrl" alt="空间图标预览" />
            <el-button link :disabled="busy" @click="draft.iconUrl = ''">清除图片</el-button>
          </div>
          <el-upload
            v-if="!draft.iconUrl"
            class="space-form__picture-upload"
            action="#"
            list-type="picture-card"
            :auto-upload="false"
            :show-file-list="false"
            :limit="1"
            accept="image/png,image/jpeg,.png,.jpg,.jpeg"
            :disabled="busy"
            :on-change="readIcon"
            :on-exceed="handleIconExceed"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
          <span class="space-form__upload-hint">PNG/JPEG，最大 2MB</span>
        </div>
      </el-form-item>
    </el-form>
    <div v-else-if="mode === 'import'" class="space-form">
      <p>选择导入文件后点击确定。</p>
      <el-button link type="primary" :disabled="busy" @click="template">下载模板</el-button>
      <label class="space-form__file">选择文件<input type="file" :disabled="busy" @change="selectImportFile" /></label>
      <p v-if="importFile">已选择：{{ importFile.name }}</p>
    </div>
    <p v-if="error || externalError" class="space-form__error" role="alert">{{ error || externalError }}</p>
    <template #footer>
      <el-button :disabled="busy" @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="busy" @click="submit">确定</el-button>
    </template>
  </el-dialog>
</template>
<script setup lang="ts">
import { Plus } from "@element-plus/icons-vue";
import type { UploadFile } from "element-plus";
import { onScopeDispose, reactive, ref, watch } from "vue";
import type { OntologySpaceDraft, OntologySpaceItem } from "@/types";
import { postImportOntologySpaceInterface, postUploadOntologyThumbnailInterface } from "@/apis";
import spaceImportTemplate from "@/assets/pages/ontologySpaceManagement/spaceImportTemplate.json";
import { downloadSpaceJson } from "../utils/downloadSpaceJson";
const props = defineProps<{ space: OntologySpaceItem | null; externalError: string }>();
const visible = defineModel<boolean>({ required: true });
const emit = defineEmits<{ save: [draft: OntologySpaceDraft]; imported: [] }>();
const mode = ref<"manual" | "import">("manual");
const draft = reactive<OntologySpaceDraft>({ apiName: "", displayName: "", description: "", iconUrl: "" });
const importFile = ref<File | null>(null);
const busy = ref(false);
const error = ref("");
const apiNameError = ref("");
const displayNameError = ref("");
let generation = 0;
onScopeDispose(() => {
  generation++;
});
watch(visible, () => {
  generation++;
  if (visible.value) {
    Object.assign(draft, {
      apiName: props.space?.apiName ?? "",
      displayName: props.space?.displayName ?? "",
      description: props.space?.description ?? "",
      iconUrl: props.space?.iconUrl ?? "",
    });
    mode.value = "manual";
    importFile.value = null;
    error.value = "";
    busy.value = false;
  }
});
/**
 * @description 从文件选择事件中取出第一个文件。
 * @param event 文件选择事件。
 * @returns 选中的文件；未选中时为 undefined。
 */
function selectedFile(event: Event): File | undefined {
  return event.target instanceof HTMLInputElement ? event.target.files?.[0] : undefined;
}
/**
 * @description 记录导入创建所选文件，确定时再提交给导入接口。
 * @param event 文件选择事件。
 */
function selectImportFile(event: Event) {
  const file = selectedFile(event);
  importFile.value = file ?? null;
  if (file) error.value = "";
}
/**
 * @description 提示空间图标仅允许选择一张图片。
 */
function handleIconExceed() {
  error.value = "空间图标仅支持上传一张图片，请先清除当前图片。";
}
/**
 * @description 上传空间图标并写入返回的缩略图 URL；创建与编辑共用此流程。
 * @param event 文件选择事件。
 */
async function readIcon(upload: UploadFile) {
  const file = upload.raw;
  if (!file || busy.value) return;
  if (!["image/png", "image/jpeg"].includes(file.type) || file.size > 2 * 1024 * 1024) {
    error.value = "请选择不超过 2MB 的 PNG 或 JPEG 图片。";
    return;
  }
  busy.value = true;
  error.value = "";
  const current = ++generation;
  try {
    const response = await postUploadOntologyThumbnailInterface({ image: file });
    if (current !== generation) return;
    if (response.code !== 200) {
      error.value = response.message || "图标上传失败。";
      return;
    }
    draft.iconUrl = response.data;
  } catch (cause) {
    if (current === generation) error.value = cause instanceof Error ? cause.message : "图标上传失败。";
  } finally {
    if (current === generation) busy.value = false;
  }
}
/**
 * @description 下载空间导入 JSON 模板。
 */
function template() {
  downloadSpaceJson("ontologySpaceTemplate.json", JSON.stringify(spaceImportTemplate, null, 2));
}
/**
 * @description 校验并提交当前模式：手动创建提交草稿，导入创建提交所选文件。
 */
async function submit() {
  if (busy.value) return;
  error.value = "";
  if (mode.value === "import") {
    if (!importFile.value) {
      error.value = "请先选择文件。";
      return;
    }
    busy.value = true;
    const current = ++generation;
    try {
      const response = await postImportOntologySpaceInterface({ file: importFile.value });
      if (current !== generation) return;
      if (response.code !== 200) {
        error.value = response.message || "导入失败，请重试。";
        return;
      }
      emit("imported");
    } catch (cause) {
      if (current === generation) error.value = cause instanceof Error && cause.message.trim() ? cause.message : "导入失败，请重试。";
    } finally {
      if (current === generation) busy.value = false;
    }
    return;
  }
  apiNameError.value = "";
  displayNameError.value = "";
  const apiName = draft.apiName.trim();
  const displayName = draft.displayName.trim();
  if (!apiName) {
    apiNameError.value = "请输入 API 名称。";
  } else if (!/^[a-z][a-z0-9_]*$/.test(apiName)) {
    apiNameError.value = "API 名称格式不正确。";
  }
  if (!displayName) displayNameError.value = "请输入空间名称。";
  if (apiNameError.value || displayNameError.value) return;
  busy.value = true;
  const current = generation;
  await Promise.resolve();
  if (current !== generation) return;
  emit("save", { ...draft });
  busy.value = false;
}
/**
 * @description 切换创建模式并清空局部错误。
 * @param value 单选组更新值。
 */
function setMode(value: unknown) {
  if (value === "manual" || value === "import") {
    mode.value = value;
    error.value = "";
  }
}
</script>
<style scoped lang="scss">
.space-form {
  margin-top: 20px;
  line-height: 1.8;
}

.space-form__file {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 12px 0;
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
}

.space-form__file input[type="file"] {
  color: var(--aircas-color-text-secondary);
}

.space-form__file input[type="file"]::file-selector-button {
  margin-right: 12px;
  border: 1px solid var(--aircas-color-border);
  border-radius: 4px;
  background-color: var(--aircas-color-primary);
  color: var(--aircas-color-on-accent);
  cursor: pointer;
}

.space-form__file input[type="file"]::file-selector-button:hover {
  background-color: var(--aircas-color-hover);
  border-color: var(--aircas-color-primary);
}

.space-form__file input[type="file"]:disabled {
  color: var(--aircas-color-text-disabled);
}

.space-form__file input[type="file"]:disabled::file-selector-button {
  background-color: var(--aircas-color-input-background);
  border-color: var(--aircas-color-border-light);
  color: var(--aircas-color-text-disabled);
  cursor: not-allowed;
}

.space-form__upload {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  flex-wrap: wrap;
}

.space-form__preview {
  display: flex;
  align-items: center;
  gap: 8px;
}

.space-form__preview img {
  width: 88px;
  height: 88px;
  object-fit: cover;
  border: 1px solid var(--aircas-color-border-light);
  border-radius: 6px;
}

.space-form__preview .el-button {
  align-self: flex-end;
}

.space-form__picture-upload {
  line-height: 1;
}

.space-form__picture-upload :deep(.el-upload--picture-card) {
  width: 88px;
  height: 88px;
  margin: 0;
  border-color: var(--aircas-color-border-light);
  background-color: var(--aircas-color-input-background);
}

.space-form__picture-upload :deep(.el-upload--picture-card:hover) {
  border-color: var(--aircas-color-primary);
  color: var(--aircas-color-primary);
}

.space-form__upload-hint {
  align-self: center;
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
}

.space-form__error {
  color: var(--aircas-color-danger);
  margin-top: 12px;
}

input:focus-visible {
  outline: 2px solid var(--aircas-color-primary);
  outline-offset: 2px;
}
</style>
