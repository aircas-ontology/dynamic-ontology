<template>
  <aside class="ai-assistant-drawer" :class="{ 'is-open': visible }" aria-label="AI 助手" :aria-hidden="!visible">
    <div class="ai-assistant-drawer__inner">
      <header class="ai-assistant-drawer__header">
        <span class="ai-assistant-drawer__header-title">AI 助手</span>
        <button class="ai-assistant-drawer__close" type="button" aria-label="关闭 AI 助手" :tabindex="visible ? 0 : -1" @click="visible = false">
          <el-icon :size="16"><Close /></el-icon>
        </button>
      </header>
      <div class="ai-assistant-drawer__panel">
        <div ref="stageRef" class="ai-assistant-drawer__stage">
          <AiAssistantConversation v-if="messages.length" :messages="messages" @select-option="selectAssistantOption" />
          <div v-else class="ai-assistant-drawer__prompts">
            <div class="ai-assistant-drawer__intro">
              <span class="ai-assistant-drawer__mark" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M12 2.5 13.6 8 19 9.5 13.6 11 12 16.5 10.4 11 5 9.5 10.4 8Z" />
                  <path d="M18 14.5 18.7 16.8 19.8 17.5 18.7 18.2 18 20.5 17.3 18.2 16.2 17.5 17.3 16.8Z" />
                </svg>
              </span>
              <strong>智能管理助手</strong>
              <p>提供对象、属性、关系、行为、函数算子和行为调度的构建管理问答</p>
            </div>
            <button v-for="prompt in prompts" :key="prompt" type="button" @click="applyAssistantPrompt(prompt)">{{ prompt }}</button>
          </div>
        </div>
        <p v-if="errorMessage" class="ai-assistant-drawer__banner" role="alert">{{ errorMessage }}</p>
        <div class="ai-assistant-drawer__composer" @dragover.prevent @drop.prevent="handleAssistantFileDrop">
          <div v-if="attachment" class="ai-assistant-drawer__attachment-card">
            <span>{{ attachment.fileName }}</span>
            <button type="button" aria-label="移除附件" @click="removeAssistantAttachment">×</button>
          </div>
          <el-input
            v-model="draft"
            type="textarea"
            :rows="4"
            maxlength="1000"
            show-word-limit
            resize="none"
            :disabled="status === 'submitting'"
            placeholder="请输入问题，Enter 发送，Shift + Enter 换行"
            @keydown="handleAssistantInputKeydown"
          />
          <div class="ai-assistant-drawer__composer-bar">
            <div class="ai-assistant-drawer__composer-actions">
              <input
                ref="fileInputRef"
                class="ai-assistant-drawer__file-input"
                type="file"
                accept=".txt,.md,text/plain,text/markdown"
                @change="handleAssistantFileChange"
              />
              <button class="ai-assistant-drawer__mode" type="button" @click="fileInputRef?.click()">＋ 附件</button>
              <button class="ai-assistant-drawer__mode" type="button" @click="startNewAssistantConversation">新对话</button>
            </div>
            <button
              class="ai-assistant-drawer__send"
              type="button"
              :aria-label="status === 'submitting' ? '停止生成' : '发送问题'"
              :disabled="status !== 'submitting' && !draft.trim() && attachment?.status !== 'ready'"
              @click="status === 'submitting' ? stopAssistantChat() : submitAssistantQuestion()"
            >
              <svg v-if="status !== 'submitting'" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M21 3 3 10.5l6.8 2.7L12.5 20 21 3Z" />
                <path d="M21 3 9.8 13.2" /></svg
              ><span v-else class="ai-assistant-drawer__stop-icon" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from "vue";
import { Close } from "@element-plus/icons-vue";

import { useAiAssistantChat } from "@/composables/agent/useAiAssistantChat";

import AiAssistantConversation from "./AiAssistantConversation.vue";

const prompts = ["新建福特级航空母舰", "创建一个名称属性", "创建舰艇编制关系", "创建一个巡航行为", "编辑函数算子运行配置", "导出行为调度和规则库"];
const visible = defineModel<boolean>({ default: false });
const stageRef = ref<HTMLElement | null>(null);
const {
  draft,
  messages,
  status,
  errorMessage,
  attachment,
  uploadAssistantDocument,
  removeAssistantAttachment,
  sendAssistantMessage,
  startNewAssistantConversation,
  selectAssistantOption,
  stopAssistantChat,
} = useAiAssistantChat();
const fileInputRef = ref<HTMLInputElement | null>(null);

/**
 * @description 把示例问题写入输入框，便于继续编辑后发送。
 * @param prompt 示例问题。
 */
function applyAssistantPrompt(prompt: string) {
  draft.value = prompt;
}

/**
 * @description 提交当前输入框中的问题。
 */
function submitAssistantQuestion() {
  if (attachment.value?.status === "uploading" || attachment.value?.status === "error") return;
  void sendAssistantMessage();
}

/** @description 处理文件选择并上传到当前会话。 */
function handleAssistantFileChange(event: Event): void {
  const file = event.target instanceof HTMLInputElement ? event.target.files?.[0] : undefined;
  if (file) void uploadAssistantDocument(file);
  if (event.target instanceof HTMLInputElement) event.target.value = "";
}

/** @description 处理拖入文件并上传到当前会话。 */
function handleAssistantFileDrop(event: DragEvent): void {
  const file = event.dataTransfer?.files?.[0];
  if (file) void uploadAssistantDocument(file);
}

/**
 * @description 处理助手编辑框快捷键：Enter 发送，Shift+Enter 换行，输入法组合输入期间不发送。
 * @param event 编辑框键盘事件。
 */
function handleAssistantInputKeydown(event: Event | KeyboardEvent): void {
  if (!(event instanceof KeyboardEvent)) {
    return;
  }
  if (event.key !== "Enter" || event.isComposing || event.shiftKey) {
    return;
  }
  event.preventDefault();
  submitAssistantQuestion();
}

/**
 * @description 对话区滚动到最新一条消息。
 */
function scrollAssistantConversation() {
  const stage = stageRef.value;
  if (!stage) return;
  stage.scrollTop = stage.scrollHeight;
}

watch(messages, () => {
  void nextTick(scrollAssistantConversation);
});
</script>

<style scoped lang="scss">
.ai-assistant-drawer {
  width: 0;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  pointer-events: none;
  transition: width 0.25s ease;
  background-color: var(--aircas-color-background);
}

.ai-assistant-drawer.is-open {
  width: 620px;
  pointer-events: auto;
}

.ai-assistant-drawer__inner {
  display: flex;
  width: 620px;
  min-width: 620px;
  height: 100%;
  min-height: 0;
  flex-direction: column;
  overflow: hidden;
  border-left: 1px solid var(--aircas-color-border-light);
  background-color: var(--aircas-color-background);
}

.ai-assistant-drawer__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex: none;
  min-height: 48px;
  padding: 12px 16px;
}

.ai-assistant-drawer__header-title {
  color: var(--aircas-color-primary);
  font-size: 16px;
}

.ai-assistant-drawer__close {
  display: grid;
  width: 28px;
  height: 28px;
  padding: 0;
  place-items: center;
  border: 0;
  border-radius: 4px;
  color: var(--aircas-color-text-secondary);
  background: transparent;
  cursor: pointer;
}

.ai-assistant-drawer__close:hover,
.ai-assistant-drawer__close:focus-visible {
  color: var(--aircas-color-text-primary);
  background: var(--aircas-color-hover);
  outline: none;
}

.ai-assistant-drawer__send svg,
.ai-assistant-drawer__mark svg {
  width: 20px;
  height: 20px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.6;
  stroke-linejoin: round;
  stroke-linecap: round;
}

.ai-assistant-drawer__panel {
  display: flex;
  height: 100%;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  gap: 12px;
  padding: 0 16px 16px;
  overflow: hidden;
}

.ai-assistant-drawer__stage {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  overflow: auto;
}

.ai-assistant-drawer__intro {
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 8px;
  padding: 28px 24px 20px;
  text-align: center;
}

.ai-assistant-drawer__mark {
  display: grid;
  width: 56px;
  height: 56px;
  place-items: center;
  border: 1px solid var(--aircas-color-effect-primary-border);
  border-radius: 50%;
  color: var(--aircas-color-primary);
  background: var(--aircas-color-effect-primary-soft);
}

.ai-assistant-drawer__mark svg {
  width: 26px;
  height: 26px;
}

.ai-assistant-drawer__intro strong {
  color: var(--aircas-color-text-primary);
  font-size: 16px;
}

.ai-assistant-drawer__intro p {
  margin: 0;
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
  line-height: 1.6;
}

.ai-assistant-drawer__prompts {
  display: flex;
  min-height: 0;
  flex-direction: column;
  gap: 10px;
  padding: 0 64px;
}

.ai-assistant-drawer__prompts button {
  width: 100%;
  margin: 0;
  padding: 12px 16px;
  border: 0;
  border-radius: 8px;
  color: var(--aircas-color-text-primary);
  background: var(--aircas-color-section-background);
  font-size: 13px;
  text-align: left;
  cursor: pointer;
}

.ai-assistant-drawer__prompts button:hover,
.ai-assistant-drawer__prompts button:focus-visible {
  background: var(--aircas-color-hover);
  outline: none;
}

.ai-assistant-drawer__banner {
  margin: 0;
  color: var(--aircas-color-danger);
  font-size: 12px;
}

.ai-assistant-drawer__composer {
  display: flex;
  flex: none;
  flex-direction: column;
  gap: 10px;
  padding: 14px 14px 12px;
  border: 0;
  border-radius: 12px;
  background: var(--aircas-color-section-background);
}

.ai-assistant-drawer__composer :deep(.el-textarea__inner) {
  border: 0;
  background: transparent;
  box-shadow: none;
}

.ai-assistant-drawer__composer :deep(.el-textarea__inner:focus) {
  border: 0;
  box-shadow: none;
}

.ai-assistant-drawer__composer :deep(.el-input__count) {
  background: transparent;
}

.ai-assistant-drawer__composer-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.ai-assistant-drawer__composer-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ai-assistant-drawer__file-input {
  display: none;
}

.ai-assistant-drawer__mode {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 30px;
  padding: 0 14px;
  border: 1px solid var(--aircas-color-effect-primary-border);
  border-radius: 15px;
  color: var(--aircas-color-primary);
  background: var(--aircas-color-effect-primary-soft);
  font-size: 12px;
  cursor: pointer;
}

.ai-assistant-drawer__mode:hover,
.ai-assistant-drawer__mode:focus-visible {
  border-color: var(--aircas-color-primary);
  outline: none;
}

.ai-assistant-drawer__send {
  display: grid;
  width: 36px;
  height: 36px;
  place-items: center;
  border: 0;
  border-radius: 50%;
  color: var(--aircas-color-on-accent);
  background: var(--aircas-color-primary);
  cursor: pointer;
}

.ai-assistant-drawer__send:hover,
.ai-assistant-drawer__send:focus-visible {
  background: color-mix(in srgb, var(--aircas-color-primary) 85%, var(--aircas-color-white));
  outline: none;
}

.ai-assistant-drawer__send:disabled {
  color: var(--aircas-color-text-disabled);
  background: var(--aircas-color-panel-background);
  cursor: not-allowed;
}

.ai-assistant-drawer__send svg {
  width: 16px;
  height: 16px;
}
.ai-assistant-drawer__stop-icon {
  display: block;
  width: 10px;
  height: 10px;
  border-radius: 2px;
  background: currentColor;
}
</style>
