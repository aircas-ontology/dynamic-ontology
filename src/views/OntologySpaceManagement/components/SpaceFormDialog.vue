<template>
  <el-dialog v-model="visible" class="aircas-dialog" :title="space ? '编辑本体空间' : '新建本体空间'" width="min(640px, 94vw)" :close-on-click-modal="!busy" :close-on-press-escape="!busy" :show-close="!busy" destroy-on-close>
    <el-radio-group v-if="!space" :model-value="mode" @update:model-value="setMode" class="aircas-radio-group" :disabled="busy">
      <el-radio-button value="manual">手动创建</el-radio-button>
      <el-radio-button value="import">导入创建</el-radio-button>
      <el-radio-button value="conceptual">基于概念模型创建</el-radio-button>
    </el-radio-group>
    <el-form v-if="mode === 'manual'" class="aircas-form space-form" label-position="top" :disabled="busy">
      <el-form-item label="API 名称（必填）"><el-input v-model="draft.apiName" class="aircas-input" ariaLabel="API 名称" :disabled="!!space" maxlength="63" placeholder="例如 example_space" /></el-form-item>
      <el-form-item label="空间名称（必填）"><el-input v-model="draft.displayName" class="aircas-input" ariaLabel="空间名称" maxlength="64" /></el-form-item>
      <el-form-item label="空间描述"><el-input v-model="draft.description" class="aircas-input" ariaLabel="空间描述" type="textarea" :rows="3" maxlength="256" show-word-limit /></el-form-item>
      <el-form-item label="空间图标">
        <img v-if="draft.iconUrl" :src="draft.iconUrl" class="space-form__preview" alt="空间图标预览" />
        <label class="space-form__file">选择图片（PNG/JPEG/WEBP，最大 2MB）<input type="file" accept="image/png,image/jpeg,image/webp" :disabled="busy" @change="readIcon" /></label>
        <el-button v-if="draft.iconUrl" class="aircas-button" link @click="draft.iconUrl = ''">清除</el-button>
      </el-form-item>
    </el-form>
    <div v-else-if="mode === 'import'" class="space-form">
      <p>上传空间基本信息 JSON 文件，最大 2MB。</p>
      <el-button class="aircas-button" link type="primary" :disabled="busy" @click="template">下载模板</el-button>
      <label class="space-form__file">选择 JSON 文件<input type="file" accept=".json,application/json" :disabled="busy" @change="readJson" /></label>
      <p v-if="imported">已读取：{{ imported.displayName }}</p>
    </div>
    <p v-else class="space-form">概念模型创建页面尚未接入，请使用手动创建或导入创建。</p>
    <p v-if="error || externalError" class="space-form__error" role="alert">{{ error || externalError }}</p>
    <template #footer>
      <el-button class="aircas-button" :disabled="busy" @click="visible = false">取消</el-button>
      <el-button class="aircas-button" type="primary" :loading="busy" :disabled="mode === 'conceptual'" @click="submit">确定</el-button>
    </template>
  </el-dialog>
</template>
<script setup lang="ts">
import { onScopeDispose, reactive, ref, watch } from "vue";
import type { OntologySpaceDraft, OntologySpaceItem } from "@/types";
import { parseSpaceImport, serializeSpace } from "../utils/spaceOperations";
import { downloadSpaceJson } from "../utils/downloadSpaceJson";
const props = defineProps<{ space: OntologySpaceItem | null; externalError: string }>();
const visible = defineModel<boolean>({ required: true });
const emit = defineEmits<{ save: [draft: OntologySpaceDraft] }>();
const mode = ref<"manual" | "import" | "conceptual">("manual");
const draft = reactive<OntologySpaceDraft>({ apiName: "", displayName: "", description: "", iconUrl: "" });
const imported = ref<OntologySpaceDraft | null>(null);
const busy = ref(false);
const error = ref("");
let generation = 0;
onScopeDispose(() => { generation++; });
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
    imported.value = null;
    error.value = "";
    busy.value = false;
  }
});
function selectedFile(event: Event): File | undefined {
  return event.target instanceof HTMLInputElement ? event.target.files?.[0] : undefined;
}
async function readJson(event: Event) {
  const file = selectedFile(event);
  imported.value = null;
  if (!file || busy.value) return;
  if (file.size > 2 * 1024 * 1024) { error.value = "文件不能超过 2MB。"; return; }
  busy.value = true;
  error.value = "";
  const current = ++generation;
  try {
    const text = await file.text();
    if (current !== generation) return;
    imported.value = parseSpaceImport(text);
  } catch (cause) {
    if (current === generation) error.value = cause instanceof Error ? cause.message : "文件读取失败。";
  } finally { if (current === generation) busy.value = false; }
}
async function readIcon(event: Event) {
  const file = selectedFile(event);
  if (!file || busy.value) return;
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 2 * 1024 * 1024) { error.value = "请选择不超过 2MB 的 PNG、JPEG 或 WEBP 图片。"; return; }
  busy.value = true;
  error.value = "";
  const current = ++generation;
  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    let binary = "";
    for (const byte of bytes) binary += String.fromCharCode(byte);
    if (current === generation) draft.iconUrl = 'data:' + file.type + ';base64,' + btoa(binary);
  } catch {
    if (current === generation) error.value = "图片读取失败。";
  } finally { if (current === generation) busy.value = false; }
}
function template() {
  downloadSpaceJson("ontologySpaceTemplate.json", serializeSpace({ apiName: "example_space", displayName: "示例空间", description: "", iconUrl: "" }));
}
async function submit() {
  if (busy.value || mode.value === "conceptual") return;
  error.value = "";
  if (mode.value === "import" && !imported.value) { error.value = "请先选择有效的 JSON 文件。"; return; }
  busy.value = true;
  const current = generation;
  await Promise.resolve();
  if (current !== generation) return;
  emit("save", mode.value === "import" && imported.value ? imported.value : { ...draft });
  busy.value = false;
}
function setMode(value: unknown) { if (value === "manual" || value === "import" || value === "conceptual") { mode.value = value; error.value = ""; } }
</script>
<style scoped lang="scss">
.space-form { margin-top: 20px; line-height: 1.8; }
.space-form__file { display: flex; flex-direction: column; gap: 8px; margin: 12px 0; color: var(--aircas-color-text-secondary); font-size: 12px; }
.space-form__preview { width: 48px; height: 48px; object-fit: cover; margin-right: 12px; }
.space-form__error { color: var(--aircas-color-danger); margin-top: 12px; }
input:focus-visible { outline: 2px solid var(--aircas-color-accent-cyan); outline-offset: 2px; }
</style>

