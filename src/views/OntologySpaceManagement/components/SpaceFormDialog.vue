<template>
  <el-dialog
    v-model="visible"
    class="aircas-dialog"
    :title="space ? '编辑本体空间' : '新建本体空间'"
    width="min(640px, 94vw)"
    :close-on-click-modal="!busy"
    :close-on-press-escape="!busy"
    :show-close="!busy"
    destroy-on-close
  >
    <el-radio-group v-if="!space" :model-value="mode" @update:model-value="setMode" class="aircas-radio-group" :disabled="busy">
      <el-radio-button value="manual">手动创建</el-radio-button>
      <el-radio-button value="import">导入创建</el-radio-button>
    </el-radio-group>
    <el-form v-if="mode === 'manual'" class="aircas-form space-form" label-position="top" :disabled="busy">
      <el-form-item label="API 名称（必填）"
        ><el-input v-model="draft.apiName" class="aircas-input" ariaLabel="API 名称" :disabled="!!space" maxlength="63" placeholder="例如 example_space"
      /></el-form-item>
      <el-form-item label="空间名称（必填）"><el-input v-model="draft.displayName" class="aircas-input" ariaLabel="空间名称" maxlength="64" /></el-form-item>
      <el-form-item label="空间描述"
        ><el-input v-model="draft.description" class="aircas-input" ariaLabel="空间描述" type="textarea" :rows="3" maxlength="256" show-word-limit
      /></el-form-item>
      <el-form-item label="空间图标">
        <img v-if="draft.iconUrl" :src="draft.iconUrl" class="space-form__preview" alt="空间图标预览" />
        <label class="space-form__file"
          >选择图片（PNG/JPEG/WEBP，最大 2MB）<input type="file" accept="image/png,image/jpeg,image/webp" :disabled="busy" @change="readIcon"
        /></label>
        <el-button v-if="draft.iconUrl" class="aircas-button" link @click="draft.iconUrl = ''">清除</el-button>
      </el-form-item>
    </el-form>
    <div v-else-if="mode === 'import'" class="space-form">
      <p>选择导入文件后点击确定。</p>
      <el-button class="aircas-button" link type="primary" :disabled="busy" @click="template">下载模板</el-button>
      <label class="space-form__file">选择文件<input type="file" :disabled="busy" @change="selectImportFile" /></label>
      <p v-if="importFile">已选择：{{ importFile.name }}</p>
    </div>
    <p v-if="error || externalError" class="space-form__error" role="alert">{{ error || externalError }}</p>
    <template #footer>
      <el-button class="aircas-button" :disabled="busy" @click="visible = false">取消</el-button>
      <el-button class="aircas-button" type="primary" :loading="busy" @click="submit">确定</el-button>
    </template>
  </el-dialog>
</template>
<script setup lang="ts">
import { onScopeDispose, reactive, ref, watch } from "vue";
import type { OntologySpaceDraft, OntologySpaceItem } from "@/types";
import { postImportOntologySpaceInterface, postUploadOntologyThumbnailInterface } from "@/apis";
import { serializeSpace } from "../utils/spaceOperations";
import { downloadSpaceJson } from "../utils/downloadSpaceJson";
const props = defineProps<{ space: OntologySpaceItem | null; externalError: string }>();
const visible = defineModel<boolean>({ required: true });
const emit = defineEmits<{ save: [draft: OntologySpaceDraft]; imported: [] }>();
const mode = ref<"manual" | "import">("manual");
const draft = reactive<OntologySpaceDraft>({ apiName: "", displayName: "", description: "", iconUrl: "" });
const importFile = ref<File | null>(null);
const busy = ref(false);
const error = ref("");
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
 * @description 上传空间图标并写入返回的缩略图 URL；创建与编辑共用此流程。
 * @param event 文件选择事件。
 */
async function readIcon(event: Event) {
  const input = event.target instanceof HTMLInputElement ? event.target : null;
  const file = selectedFile(event);
  if (!file || busy.value) return;
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 2 * 1024 * 1024) {
    error.value = "请选择不超过 2MB 的 PNG、JPEG 或 WEBP 图片。";
    if (input) input.value = "";
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
    if (input) input.value = "";
    if (current === generation) busy.value = false;
  }
}
/**
 * @description 下载空间导入 JSON 模板。
 */
function template() {
  downloadSpaceJson("ontologySpaceTemplate.json", serializeSpace({ apiName: "example_space", displayName: "示例空间", description: "", iconUrl: "" }));
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
  background-color: var(--aircas-color-button-background);
  color: var(--aircas-color-button-text);
  cursor: pointer;
}

.space-form__file input[type="file"]::file-selector-button:hover {
  background-color: var(--aircas-color-button-hover-background);
  border-color: var(--aircas-color-border-highlight);
}

.space-form__file input[type="file"]:disabled {
  color: var(--aircas-color-text-disabled);
}

.space-form__file input[type="file"]:disabled::file-selector-button {
  background-color: var(--aircas-color-input-background);
  border-color: var(--aircas-color-border-soft);
  color: var(--aircas-color-text-disabled);
  cursor: not-allowed;
}

.space-form__preview {
  width: 48px;
  height: 48px;
  object-fit: cover;
  margin-right: 12px;
}

.space-form__error {
  color: var(--aircas-color-danger);
  margin-top: 12px;
}

input:focus-visible {
  outline: 2px solid var(--aircas-color-accent-cyan);
  outline-offset: 2px;
}
</style>
