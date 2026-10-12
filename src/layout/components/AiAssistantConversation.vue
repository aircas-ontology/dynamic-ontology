<template>
  <div class="ai-assistant-drawer__conversation">
    <div v-for="message in messages" :key="message.id" class="ai-assistant-drawer__message" :class="resolveAssistantMessageClass(message)">
      <div class="ai-assistant-drawer__bubble">
        <ol v-if="message.role === 'assistant' && message.buildProgress" class="ai-assistant-drawer__build-steps" aria-label="本体构建步骤">
          <li v-for="step in message.buildProgress.steps" :key="`${message.id}-step-${step.index}`" :class="`is-${step.status}`">
            <span class="ai-assistant-drawer__build-step-index">{{ step.index }}</span>
            <span class="ai-assistant-drawer__build-step-title">{{ step.title }}</span>
          </li>
        </ol>
        <details v-if="message.role === 'assistant' && message.processItems.length" class="ai-assistant-drawer__process">
          <summary>过程</summary>
          <p v-for="(item, index) in message.processItems" :key="`${message.id}-process-${index}`">{{ item.text }}</p>
        </details>
        <div v-if="resolveAssistantVisibleContentBlocks(message).length" class="ai-assistant-drawer__content">
          <template v-for="(block, index) in resolveAssistantVisibleContentBlocks(message)" :key="`${message.id}-block-${index}`">
            <p v-if="block.kind === 'text'">{{ block.text }}</p>
            <p v-else-if="block.kind === 'item'" class="ai-assistant-drawer__content-item">
              <strong v-if="block.label">{{ block.label }}</strong>
              <span>{{ block.text }}</span>
            </p>
            <pre v-else class="ai-assistant-drawer__content-code">{{ block.text }}</pre>
          </template>
        </div>
        <p v-else-if="message.role === 'assistant' && !message.errorMessage && !message.selection" class="ai-assistant-drawer__pending">正在回复…</p>
        <p v-if="message.role === 'assistant' && message.errorMessage" class="ai-assistant-drawer__error">{{ message.errorMessage }}</p>
        <div v-if="message.role === 'assistant' && message.selection" class="ai-assistant-drawer__selection">
          <strong>{{ message.selection.title || "请选择" }}</strong>
          <AiAssistantPropertySelectionTable
            v-if="isAssistantPropertySelectionCard(message.selection)"
            :rows="mapAssistantPropertySelectionRows(resolveAssistantSelection(message)?.options ?? [])"
            :selected-ids="selectedIdsByMessage[message.id] ?? []"
            :multi-select="resolveAssistantSelection(message)?.multiSelect ?? false"
            :disabled="isAssistantSelectionConfirmed(message.id)"
            @change-option="
              (optionId, checked) => changeAssistantOption(message.id, optionId, resolveAssistantSelection(message)?.multiSelect ?? false, checked)
            "
            @change-all="(checked) => changeAllAssistantOptions(message.id, resolveAssistantSelection(message)?.options ?? [], checked)"
          />
          <template v-else>
            <label v-for="option in resolveAssistantSelection(message)?.options ?? []" :key="option.id" class="ai-assistant-drawer__option">
              <el-checkbox
                class="aircas-checkbox"
                :model-value="isAssistantOptionSelected(message.id, option.id)"
                :disabled="isAssistantSelectionConfirmed(message.id)"
                @change="changeAssistantOption(message.id, option.id, resolveAssistantSelection(message)?.multiSelect ?? false, $event)"
              />
              <span class="ai-assistant-drawer__option-text">
                <span>{{ option.label }}</span>
                <small v-if="option.description">{{ option.description }}</small>
              </span>
            </label>
          </template>
          <el-button
            class="aircas-button"
            type="primary"
            size="small"
            :disabled="!canConfirmAssistantSelection(message.id)"
            @click="confirmAssistantSelection(message.id)"
          >
            确认
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import type { DeepReadonly } from "vue";
import type { CheckboxValueType } from "element-plus";

import type { AiAssistantMessage, AiAssistantSelectionCard } from "@/types";
import {
  isAssistantPropertyProposalCode,
  isAssistantPropertySelectionCard,
  mapAssistantPropertySelectionRows,
} from "@/utils/mapAssistantPropertySelectionRows";
import { splitAssistantChatContentBlocks, type AssistantChatContentBlock } from "@/utils/splitAssistantChatContent";
import {
  resolveAssistantSelectionConfirmDisplay,
  resolveAssistantSelectionConfirmMessage,
  toggleAssistantSelectionIds,
} from "@/utils/toggleAssistantSelectionIds";

import AiAssistantPropertySelectionTable from "./AiAssistantPropertySelectionTable.vue";

const props = defineProps<{
  messages: DeepReadonly<AiAssistantMessage[]>;
}>();

const emit = defineEmits<{
  "select-option": [optionId: string, displayContent: string];
}>();

const selectedIdsByMessage = ref<Record<string, string[]>>({});
const confirmedMessageIds = ref<string[]>([]);

/**
 * @description 解析消息气泡的角色与属性表格加宽样式。
 * @param message 会话消息。
 * @returns 消息容器 class。
 */
function resolveAssistantMessageClass(message: DeepReadonly<AiAssistantMessage>): Record<string, boolean> {
  return {
    "ai-assistant-drawer__message--user": message.role === "user",
    "ai-assistant-drawer__message--assistant": message.role === "assistant",
    "ai-assistant-drawer__message--wide": message.role === "assistant" && isAssistantPropertySelectionCard(message.selection),
  };
}

/**
 * @description 读取助手消息中的选择卡片，供模板复用类型窄化结果。
 * @param message 会话消息。
 * @returns 助手选择卡片；无卡片时返回 undefined。
 */
function resolveAssistantSelection(message: DeepReadonly<AiAssistantMessage>): DeepReadonly<AiAssistantSelectionCard> | undefined {
  return message.role === "assistant" ? message.selection : undefined;
}

/**
 * @description 解析气泡正文块，属性选择时隐藏已被表格承接的草案 JSON。
 * @param message 会话消息。
 * @returns 可见正文块。
 */
function resolveAssistantVisibleContentBlocks(message: DeepReadonly<AiAssistantMessage>): AssistantChatContentBlock[] {
  const blocks = splitAssistantChatContentBlocks(message.content);
  if (message.role !== "assistant" || !isAssistantPropertySelectionCard(message.selection)) {
    return blocks;
  }
  return blocks.filter((block) => block.kind !== "code" || !isAssistantPropertyProposalCode(block.text));
}

/**
 * @description 判断某条选择卡片中的选项是否已勾选。
 * @param messageId 助手消息 id。
 * @param optionId 选项 id。
 * @returns 是否已勾选。
 */
function isAssistantOptionSelected(messageId: string, optionId: string): boolean {
  return (selectedIdsByMessage.value[messageId] ?? []).includes(optionId);
}

/**
 * @description 判断该选择卡片是否已经确认过。
 * @param messageId 助手消息 id。
 * @returns 是否已确认。
 */
function isAssistantSelectionConfirmed(messageId: string): boolean {
  return confirmedMessageIds.value.includes(messageId);
}

/**
 * @description 判断确认按钮是否可点。
 * @param messageId 助手消息 id。
 * @returns 已勾选且未确认时为 true。
 */
function canConfirmAssistantSelection(messageId: string): boolean {
  return !isAssistantSelectionConfirmed(messageId) && (selectedIdsByMessage.value[messageId] ?? []).length > 0;
}

/**
 * @description 按单选或多选更新勾选状态。
 * @param messageId 助手消息 id。
 * @param optionId 选项 id。
 * @param multiSelect 是否允许多选。
 * @param checked 复选框目标勾选状态。
 */
function changeAssistantOption(messageId: string, optionId: string, multiSelect: boolean, checked: CheckboxValueType): void {
  if (isAssistantSelectionConfirmed(messageId)) {
    return;
  }
  selectedIdsByMessage.value = {
    ...selectedIdsByMessage.value,
    [messageId]: toggleAssistantSelectionIds(selectedIdsByMessage.value[messageId] ?? [], optionId, multiSelect, checked === true),
  };
}

/**
 * @description 多选时按表格全选结果更新已选属性。
 * @param messageId 助手消息 id。
 * @param options 当前属性选项。
 * @param checked 是否全选。
 */
function changeAllAssistantOptions(messageId: string, options: readonly { id: string }[], checked: boolean): void {
  if (isAssistantSelectionConfirmed(messageId)) {
    return;
  }
  selectedIdsByMessage.value = {
    ...selectedIdsByMessage.value,
    [messageId]: checked ? options.map((option) => option.id) : [],
  };
}

/**
 * @description 确认当前勾选，把选项 id 回喂给模型，页面展示选项名称。
 * @param messageId 助手消息 id。
 */
function confirmAssistantSelection(messageId: string): void {
  const selectedIds = selectedIdsByMessage.value[messageId] ?? [];
  const payload = resolveAssistantSelectionConfirmMessage(selectedIds);
  if (!payload || isAssistantSelectionConfirmed(messageId)) {
    return;
  }
  const current = props.messages.find((item) => item.id === messageId);
  const options = current?.role === "assistant" ? (current.selection?.options ?? []) : [];
  const displayContent = resolveAssistantSelectionConfirmDisplay(selectedIds, options);
  confirmedMessageIds.value = [...confirmedMessageIds.value, messageId];
  emit("select-option", payload, displayContent);
}
</script>

<style scoped lang="scss">
.ai-assistant-drawer__conversation {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 0;
}

.ai-assistant-drawer__message {
  display: flex;
}

.ai-assistant-drawer__message--assistant {
  justify-content: flex-start;
}

.ai-assistant-drawer__message--user {
  justify-content: flex-end;
}

.ai-assistant-drawer__bubble {
  display: flex;
  max-width: 72%;
  min-width: 0;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.5;
}

.ai-assistant-drawer__message--wide {
  width: 100%;
}

.ai-assistant-drawer__message--wide .ai-assistant-drawer__bubble {
  max-width: 100%;
}

.ai-assistant-drawer__message--assistant .ai-assistant-drawer__bubble {
  max-width: 95%;
  border: 1px solid var(--aircas-color-border-soft);
  border-top-left-radius: 2px;
  color: var(--aircas-color-text-primary);
  background: var(--aircas-color-overlay-deep);
}

:root[theme="light"] .ai-assistant-drawer__message--assistant .ai-assistant-drawer__bubble {
  background: var(--aircas-color-card-background);
}

.ai-assistant-drawer__message--user .ai-assistant-drawer__bubble {
  border-top-right-radius: 2px;
  color: var(--aircas-color-text-inverse);
  background: var(--aircas-color-accent-cyan);
}

.ai-assistant-drawer__bubble p,
.ai-assistant-drawer__content-code {
  margin: 0;
}

.ai-assistant-drawer__build-steps {
  display: grid;
  grid-template-columns: repeat(6, minmax(110px, 1fr));
  gap: 6px;
  margin: 0;
  padding: 0 0 8px;
  overflow-x: auto;
  list-style: none;
}

.ai-assistant-drawer__build-steps li {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 5px;
  color: var(--aircas-color-text-disabled);
  font-size: 11px;
  white-space: nowrap;
}

.ai-assistant-drawer__build-steps li.is-active {
  color: var(--aircas-color-accent-cyan);
}
.ai-assistant-drawer__build-steps li.is-complete {
  color: var(--aircas-color-text-secondary);
}
.ai-assistant-drawer__build-steps li.is-error {
  color: var(--aircas-color-danger);
}

.ai-assistant-drawer__build-step-index {
  display: grid;
  width: 18px;
  height: 18px;
  flex: none;
  place-items: center;
  border: 1px solid currentColor;
  border-radius: 50%;
  font-size: 10px;
}

.ai-assistant-drawer__build-step-title {
  overflow: hidden;
  text-overflow: ellipsis;
}

.ai-assistant-drawer__content {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 8px;
  word-break: break-word;
}

.ai-assistant-drawer__content-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ai-assistant-drawer__content-item strong {
  font-size: 12px;
  font-weight: 600;
}

.ai-assistant-drawer__message--assistant .ai-assistant-drawer__content-item strong {
  color: var(--aircas-color-text-muted);
}

.ai-assistant-drawer__content-code {
  padding: 8px 10px;
  overflow: auto;
  max-width: 100%;
  border: 1px solid var(--aircas-color-border-soft);
  border-radius: 6px;
  color: var(--aircas-color-text-muted);
  background: var(--aircas-color-transparent);
  font-size: 12px;
  line-height: 1.45;
  white-space: pre-wrap;
}

.ai-assistant-drawer__pending,
.ai-assistant-drawer__process,
.ai-assistant-drawer__error {
  color: var(--aircas-color-text-muted);
  font-size: 12px;
}

.ai-assistant-drawer__error {
  color: var(--aircas-color-danger);
}

.ai-assistant-drawer__process summary {
  cursor: pointer;
}

.ai-assistant-drawer__selection {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ai-assistant-drawer__selection strong {
  font-size: 13px;
}

.ai-assistant-drawer__option {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px 10px;
  border: 1px solid var(--aircas-color-border-soft);
  border-radius: 6px;
  color: var(--aircas-color-text-primary);
  background: var(--aircas-color-transparent);
  text-align: left;
  cursor: pointer;
}

.ai-assistant-drawer__option:hover,
.ai-assistant-drawer__option:focus-within {
  border-color: var(--aircas-color-border);
  background: var(--aircas-color-hover-background);
}

.ai-assistant-drawer__option-text {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 2px;
}

.ai-assistant-drawer__option small {
  color: var(--aircas-color-text-muted);
  font-size: 12px;
}
</style>
