<template>
  <aside class="rule-ai-drawer" aria-label="AI 生成规则">
    <header class="rule-ai-drawer__header">
      <div class="rule-ai-drawer__heading">
        <strong>AI 生成规则</strong>
        <span>用自然语言描述条件与行为，也可上传文本文件辅助生成</span>
      </div>
      <el-button class="aircas-button aircas-button--tone-ghost" @click="emit('update:open', false)">收起</el-button>
    </header>
    <div class="rule-ai-drawer__presets">
      <button
        v-for="item in SCHEDULE_RULE_AI_PRESET_PROMPTS"
        :key="item"
        type="button"
        class="rule-ai-drawer__preset"
        :disabled="sending"
        @click="usePreset(item)"
      >
        {{ item }}
      </button>
    </div>
    <div v-if="messages.length" ref="listRef" class="rule-ai-drawer__messages" aria-live="polite">
      <article
        v-for="message in messages"
        :key="message.id"
        class="rule-ai-drawer__message"
        :class="{ 'is-user': message.role === 'user', 'is-error': message.status === 'error' }"
      >
        <span class="rule-ai-drawer__message-role">{{ message.role === "user" ? "我" : "AI" }}</span>
        <div class="rule-ai-drawer__message-body">
          <p>{{ message.content }}</p>
          <pre v-if="message.dsl" class="rule-ai-drawer__dsl">{{ message.dsl }}</pre>
        </div>
      </article>
    </div>
    <footer class="rule-ai-drawer__footer">
      <div class="rule-ai-drawer__composer">
        <div v-if="attachmentName" class="rule-ai-drawer__attachment">
          <span class="rule-ai-drawer__attachment-name" :title="attachmentName">{{ attachmentName }}</span>
          <button type="button" class="rule-ai-drawer__attachment-remove" :disabled="sending" aria-label="移除上传文件" @click="clearAttachment">×</button>
        </div>
        <el-input
          v-model="input"
          class="aircas-input rule-ai-drawer__input"
          type="textarea"
          :rows="2"
          resize="none"
          :maxlength="SCHEDULE_RULE_AI_PROMPT_MAX_LENGTH"
          show-word-limit
          placeholder="描述规则，Ctrl + Enter 发送；可上传 .txt / .md / .json 等"
          :disabled="sending"
          @keydown.ctrl.enter.prevent="submitAiPrompt"
        />
      </div>
      <div class="rule-ai-drawer__actions">
        <el-button class="aircas-button aircas-button--tone-secondary" :disabled="!lastDsl || sending" @click="emit('apply', lastDsl)">同步到规则</el-button>
        <div class="rule-ai-drawer__action-row">
          <el-button class="aircas-button aircas-button--tone-ghost" :disabled="sending" @click="triggerFilePick">上传</el-button>
          <el-button class="aircas-button aircas-button--tone-primary" :loading="sending" :disabled="!canSubmit || sending" @click="submitAiPrompt"
            >发送</el-button
          >
        </div>
      </div>
      <input ref="fileInputRef" class="rule-ai-drawer__file-input" type="file" :accept="SCHEDULE_RULE_AI_ATTACHMENT_ACCEPT" @change="onFileChange" />
    </footer>
  </aside>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import {
  SCHEDULE_RULE_AI_ATTACHMENT_ACCEPT,
  SCHEDULE_RULE_AI_ATTACHMENT_MAX_BYTES,
  SCHEDULE_RULE_AI_PRESET_PROMPTS,
  SCHEDULE_RULE_AI_PROMPT_MAX_LENGTH,
  type RuleVariableCatalogObject,
  type ScheduleRuleAiMessage,
} from "@/types";
import { generateScheduleRuleFromPrompt } from "../utils/scheduleRuleAiGenerate";

const props = defineProps<{
  open: boolean;
  catalog: RuleVariableCatalogObject[];
}>();

const emit = defineEmits<{
  "update:open": [value: boolean];
  apply: [dsl: string];
}>();

const input = ref("");
const sending = ref(false);
const messages = ref<ScheduleRuleAiMessage[]>([]);
const lastDsl = ref("");
const listRef = ref<HTMLElement | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);
const attachmentName = ref("");
const attachmentText = ref("");
let abortController: AbortController | null = null;

const canSubmit = computed(() => Boolean(input.value.trim() || attachmentText.value.trim()));

/**
 * @description 生成对话消息标识。
 * @param prefix 前缀。
 * @returns 标识。
 */
function createMessageId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * @description 把对话列表滚到最新消息。
 */
async function scrollToBottom() {
  await nextTick();
  const el = listRef.value;
  if (el) el.scrollTop = el.scrollHeight;
}

/**
 * @description 把预设文案填入输入框。
 * @param text 预设提示。
 */
function usePreset(text: string) {
  input.value = text;
}

/**
 * @description 打开本地文件选择。
 */
function triggerFilePick() {
  if (!sending.value) fileInputRef.value?.click();
}

/**
 * @description 清除当前附件。
 */
function clearAttachment() {
  attachmentName.value = "";
  attachmentText.value = "";
  if (fileInputRef.value) fileInputRef.value.value = "";
}

/**
 * @description 校验附件扩展名。
 * @param name 文件名。
 * @returns 是否允许。
 */
function isAllowedExtension(name: string): boolean {
  const lower = name.toLowerCase();
  return (
    lower.endsWith(".txt") ||
    lower.endsWith(".md") ||
    lower.endsWith(".markdown") ||
    lower.endsWith(".json") ||
    lower.endsWith(".csv") ||
    lower.endsWith(".log")
  );
}

/**
 * @description 以 UTF-8 读取文本文件。
 * @param file 本地文件。
 * @returns 文件内容。
 */
function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(new Error("读取文件失败"));
    reader.readAsText(file, "UTF-8");
  });
}

/**
 * @description 选择附件后校验类型、大小和内容。
 * @param event 文件选择事件。
 */
async function onFileChange(event: Event) {
  const inputEl = event.target instanceof HTMLInputElement ? event.target : null;
  const file = inputEl?.files?.[0];
  if (!file) return;
  if (!isAllowedExtension(file.name)) {
    ElMessage.warning("仅支持 .txt / .md / .json / .csv / .log 文本文件");
    if (inputEl) inputEl.value = "";
    return;
  }
  if (file.size > SCHEDULE_RULE_AI_ATTACHMENT_MAX_BYTES) {
    ElMessage.warning("文件过大，请上传不超过 200KB 的文本文件");
    if (inputEl) inputEl.value = "";
    return;
  }
  try {
    const text = await readFileAsText(file);
    if (!text.trim()) {
      ElMessage.warning("文件内容为空");
      return;
    }
    attachmentName.value = file.name;
    attachmentText.value = text;
    ElMessage.success(`已选择文件：${file.name}`);
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "读取文件失败");
  } finally {
    if (inputEl) inputEl.value = "";
  }
}

/**
 * @description 发送描述并本地 Mock 生成规则文本。
 */
async function submitAiPrompt() {
  const prompt = input.value.trim();
  const fileText = attachmentText.value.trim();
  if ((!prompt && !fileText) || sending.value) return;
  abortController?.abort();
  abortController = new AbortController();
  const displayParts = [prompt];
  if (attachmentName.value) displayParts.push(`[附件] ${attachmentName.value}`);
  const assistantId = createMessageId("ai");
  messages.value.push(
    { id: createMessageId("user"), role: "user", content: displayParts.filter(Boolean).join("\n"), createdAt: new Date().toISOString(), status: "success" },
    { id: assistantId, role: "assistant", content: "正在生成规则…", createdAt: new Date().toISOString(), status: "sending" },
  );
  input.value = "";
  clearAttachment();
  sending.value = true;
  await scrollToBottom();
  try {
    const result = await generateScheduleRuleFromPrompt({
      prompt,
      attachmentText: fileText,
      catalog: props.catalog,
      signal: abortController.signal,
    });
    const target = messages.value.find((item) => item.id === assistantId);
    if (!target) return;
    target.status = "success";
    target.content = result.reply;
    target.dsl = result.dsl;
    lastDsl.value = result.dsl;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") return;
    const target = messages.value.find((item) => item.id === assistantId);
    if (target) {
      target.status = "error";
      target.content = error instanceof Error ? error.message : "生成失败";
    }
  } finally {
    sending.value = false;
    await scrollToBottom();
  }
}

watch(
  () => props.open,
  (open) => {
    if (open) void scrollToBottom();
  },
);

onBeforeUnmount(() => {
  abortController?.abort();
});
</script>

<style scoped lang="scss">
.rule-ai-drawer {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 0;
  max-height: 280px;
  padding: 12px;
  border: 1px solid var(--aircas-color-accent-cyan-border);
  border-radius: 8px;
  background: linear-gradient(180deg, var(--aircas-color-overlay), var(--aircas-color-overlay-deep));
}

.rule-ai-drawer__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.rule-ai-drawer__heading {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
}

.rule-ai-drawer__heading strong {
  color: var(--aircas-color-text-primary);
  font-size: 14px;
  font-weight: 650;
}

.rule-ai-drawer__heading span {
  color: var(--aircas-color-text-muted);
  font-size: 12px;
}

.rule-ai-drawer__presets {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.rule-ai-drawer__preset {
  max-width: 100%;
  height: 28px;
  padding: 0 10px;
  overflow: hidden;
  border: 1px solid var(--aircas-color-border-soft);
  border-radius: 14px;
  color: var(--aircas-color-accent-cyan);
  background: var(--aircas-color-accent-cyan-soft);
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
}

.rule-ai-drawer__preset:hover:not(:disabled) {
  border-color: var(--aircas-color-accent-cyan);
}

.rule-ai-drawer__preset:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.rule-ai-drawer__messages {
  display: flex;
  min-height: 72px;
  max-height: 120px;
  flex: 1;
  flex-direction: column;
  gap: 8px;
  overflow: auto;
  padding: 8px;
  border: 1px solid var(--aircas-color-border-soft);
  border-radius: 6px;
  background: var(--aircas-color-section-background);
}

.rule-ai-drawer__message {
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr);
  gap: 8px;
}

.rule-ai-drawer__message-role {
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
  line-height: 20px;
}

.rule-ai-drawer__message-body {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 6px;
  padding: 8px 10px;
  border-radius: 6px;
  background: var(--aircas-color-overlay);
}

.rule-ai-drawer__message.is-user .rule-ai-drawer__message-body {
  background: var(--aircas-color-accent-blue-soft);
}

.rule-ai-drawer__message.is-error .rule-ai-drawer__message-body {
  color: var(--aircas-color-accent-orange);
}

.rule-ai-drawer__message-body p {
  margin: 0;
  color: var(--aircas-color-text-primary);
  font-size: 13px;
  line-height: 1.5;
  white-space: pre-wrap;
}

.rule-ai-drawer__dsl {
  margin: 0;
  padding: 8px;
  overflow: auto;
  border-radius: 4px;
  color: var(--aircas-color-accent-cyan);
  background: var(--aircas-color-overlay-deep);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
  line-height: 1.45;
  white-space: pre;
}

.rule-ai-drawer__footer {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 8px;
  align-items: end;
}

.rule-ai-drawer__composer {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 6px;
}

.rule-ai-drawer__attachment {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  height: 28px;
  padding: 0 8px 0 10px;
  border: 1px solid var(--aircas-color-border-soft);
  border-radius: 6px;
  background: var(--aircas-color-accent-cyan-soft);
}

.rule-ai-drawer__attachment-name {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  color: var(--aircas-color-accent-cyan);
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rule-ai-drawer__attachment-remove {
  width: 20px;
  height: 20px;
  padding: 0;
  border: none;
  border-radius: 4px;
  color: var(--aircas-color-text-secondary);
  background: var(--aircas-color-transparent);
  cursor: pointer;
}

.rule-ai-drawer__actions,
.rule-ai-drawer__action-row {
  display: flex;
  gap: 8px;
}

.rule-ai-drawer__actions {
  flex-direction: column;
}

.rule-ai-drawer__file-input {
  display: none;
}
</style>
