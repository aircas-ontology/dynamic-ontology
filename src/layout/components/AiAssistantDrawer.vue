<template>
  <el-button class="ai-assistant-launcher" :aria-label="visible ? '关闭 AI 助手' : '打开 AI 助手'" :aria-expanded="visible" @click="visible = !visible">
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 6.5h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H9l-4 3v-3H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Z" />
    </svg>
  </el-button>
  <el-drawer
    v-model="visible"
    class="aircas-drawer ai-assistant-drawer"
    title="AI 助手"
    direction="rtl"
    size="620px"
    :modal="false"
    modal-penetrable
    append-to-body
  >
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
      <p v-if="errorMessage && !messages.length" class="ai-assistant-drawer__banner">{{ errorMessage }}</p>
      <div class="ai-assistant-drawer__composer">
        <el-input
          v-model="draft"
          class="aircas-input"
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
            <el-dropdown trigger="click" popper-class="aircas-popper">
              <button class="ai-assistant-drawer__mode" type="button">
                <span aria-hidden="true">✦</span>
                智能管理助手
                <span aria-hidden="true">⌄</span>
              </button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item>智能管理助手</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <button class="ai-assistant-drawer__mode" type="button" @click="startNewAssistantConversation">新对话</button>
          </div>
          <button
            class="ai-assistant-drawer__send"
            type="button"
            aria-label="发送问题"
            :disabled="status === 'submitting' || !draft.trim()"
            @click="submitAssistantQuestion"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 12h12M13 6l6 6-6 6" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from "vue";

import { useAiAssistantChat } from "@/composables/agent/useAiAssistantChat";

import AiAssistantConversation from "./AiAssistantConversation.vue";

const prompts = ["新建福特级航空母舰", "创建一个名称属性", "创建舰艇编制关系", "创建一个巡航行为", "编辑函数算子运行配置", "导出行为调度和规则库"];
const visible = ref(false);
const stageRef = ref<HTMLElement | null>(null);
const { draft, messages, status, errorMessage, sendAssistantMessage, startNewAssistantConversation, selectAssistantOption } = useAiAssistantChat();

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
  void sendAssistantMessage();
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
.ai-assistant-launcher {
  position: absolute;
  left: 50%;
  bottom: 24px;
  z-index: 20;
  display: grid;
  width: 30px;
  height: 30px;
  padding: 0;
  place-items: center;
  transform: translateX(-50%);
  cursor: pointer;
}

.ai-assistant-launcher svg {
  width: 25px;
  height: 25px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.6;
  stroke-linejoin: round;
  stroke-linecap: round;
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

.ai-assistant-drawer:deep(.el-drawer__body) {
  display: flex;
  height: 100%;
  min-height: 0;
  flex-direction: column;
  overflow: hidden;
  padding: 0 16px 16px;
}

.ai-assistant-drawer__panel {
  display: flex;
  height: 100%;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  gap: 12px;
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
  padding: 28px 24px 8px;
  text-align: center;
}

.ai-assistant-drawer__mark {
  display: grid;
  width: 42px;
  height: 42px;
  place-items: center;
  border: 1px solid var(--aircas-color-accent-cyan-border);
  border-radius: 50%;
  color: var(--aircas-color-accent-cyan);
  background: var(--aircas-color-accent-cyan-soft);
}

.ai-assistant-drawer__intro strong {
  color: var(--aircas-color-text-primary);
  font-size: 16px;
}

.ai-assistant-drawer__intro p {
  margin: 0;
  color: var(--aircas-color-text-muted);
  font-size: 12px;
  line-height: 1.6;
}

.ai-assistant-drawer__prompts {
  display: flex;
  min-height: 0;
  flex-direction: column;
  gap: 8px;
}

.ai-assistant-drawer__prompts button {
  width: 100%;
  margin: 0;
  padding: 10px 12px;
  border: 1px solid var(--aircas-color-border-soft);
  border-radius: 6px;
  color: var(--aircas-color-text-primary);
  background: var(--aircas-color-overlay-deep);
  font-size: 13px;
  text-align: left;
  cursor: pointer;
}

:root[theme="light"] .ai-assistant-drawer__prompts button {
  background: var(--aircas-color-card-background);
}

.ai-assistant-drawer__prompts button:hover,
.ai-assistant-drawer__prompts button:focus-visible {
  border-color: var(--aircas-color-border);
  background: var(--aircas-color-hover-background);
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
  padding: 12px;
  border: 1px solid var(--aircas-color-border);
  border-radius: 8px;
  background: var(--aircas-color-input-background);
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

.ai-assistant-drawer__mode {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 10px;
  border: 1px solid var(--aircas-color-border-soft);
  border-radius: 14px;
  color: var(--aircas-color-text-secondary);
  background: var(--aircas-color-transparent);
  font-size: 12px;
  cursor: pointer;
}

.ai-assistant-drawer__mode:hover,
.ai-assistant-drawer__mode:focus-visible {
  border-color: var(--aircas-color-border);
  color: var(--aircas-color-text-primary);
  outline: none;
}

.ai-assistant-drawer__send {
  display: grid;
  width: 32px;
  height: 32px;
  place-items: center;
  border: 0;
  border-radius: 50%;
  color: var(--aircas-color-text-inverse);
  background: var(--aircas-color-accent-cyan);
  cursor: pointer;
}

.ai-assistant-drawer__send:hover,
.ai-assistant-drawer__send:focus-visible {
  background: var(--aircas-color-button-hover-background);
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
</style>
