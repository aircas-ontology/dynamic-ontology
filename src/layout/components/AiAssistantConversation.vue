<template>
  <div class="ai-assistant-drawer__conversation">
    <div v-for="group in conversationGroups" :key="group.key" class="ai-assistant-drawer__message" :class="resolveGroupMessageClass(group)">
      <ol v-if="group.kind === 'build'" class="ai-assistant-drawer__build-steps" aria-label="对象构建步骤">
        <li v-for="step in group.progress.steps" :key="`${group.key}-step-${step.index}`" :class="`is-${step.status}`">
          <component
            :is="isBuildStepInteractive(group, step.index) ? 'button' : 'span'"
            class="ai-assistant-drawer__build-step-header"
            :class="{ 'is-collapsed': isBuildStepInteractive(group, step.index) && !isBuildStepBodyVisible(group, step.index) }"
            :type="isBuildStepInteractive(group, step.index) ? 'button' : undefined"
            :aria-expanded="isBuildStepInteractive(group, step.index) ? isBuildStepBodyVisible(group, step.index) : undefined"
            @click="toggleBuildStepExpanded(group, step.index)"
          >
            <span class="ai-assistant-drawer__build-step-index">{{ step.index }}</span>
            <span class="ai-assistant-drawer__build-step-title">{{ step.title }}</span>
            <span v-if="isBuildStepCurrent(group, step.index)" class="ai-assistant-drawer__build-step-meta">
              第{{ group.progress.current }}步/共{{ group.progress.total }}步
            </span>
            <svg v-if="isBuildStepInteractive(group, step.index)" class="ai-assistant-drawer__build-step-arrow" viewBox="0 0 24 24" aria-hidden="true">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </component>
          <div v-show="isBuildStepBodyVisible(group, step.index)" class="ai-assistant-drawer__build-step-body">
            <div
              v-for="item in resolveBuildStepItems(group, step.index)"
              :key="item.message.id"
              class="ai-assistant-drawer__bubble"
              :class="{ 'ai-assistant-drawer__bubble--user-inline': item.kind === 'user' }"
            >
              <div class="ai-assistant-drawer__bubble-body">
                <details v-if="item.message.role === 'assistant' && item.message.processItems.length" class="ai-assistant-drawer__process">
                  <summary>过程</summary>
                  <p v-for="(process, processIndex) in item.message.processItems" :key="`${item.message.id}-process-${processIndex}`">
                    {{ process.text }}
                  </p>
                </details>
                <div v-if="resolveAssistantVisibleContentBlocks(item.message).length" class="ai-assistant-drawer__content">
                  <template v-for="(block, blockIndex) in resolveAssistantVisibleContentBlocks(item.message)" :key="`${item.message.id}-block-${blockIndex}`">
                    <p v-if="block.kind === 'text'">{{ block.text }}</p>
                    <p v-else-if="block.kind === 'item'" class="ai-assistant-drawer__content-item">
                      <strong v-if="block.label">{{ block.label }}</strong>
                      <span>{{ block.text }}</span>
                    </p>
                    <pre v-else class="ai-assistant-drawer__content-code">{{ block.text }}</pre>
                  </template>
                </div>
                <p v-else-if="item.message.role === 'assistant' && !item.message.errorMessage && !item.message.selection" class="ai-assistant-drawer__pending">
                  正在回复…
                </p>
                <p v-if="item.message.role === 'assistant' && item.message.errorMessage" class="ai-assistant-drawer__error">
                  {{ item.message.errorMessage }}
                </p>
                <div v-if="item.message.role === 'assistant' && item.message.selection" class="ai-assistant-drawer__selection">
                  <strong>{{ item.message.selection.title || "请选择" }}</strong>
                  <div class="ai-assistant-drawer__option-list">
                    <AiAssistantPropertySelectionTable
                      v-if="isAssistantPropertySelectionCard(item.message.selection)"
                      :rows="mapAssistantPropertySelectionRows(resolveAssistantSelection(item.message)?.options ?? [])"
                      :selected-ids="selectedIdsByMessage[item.message.id] ?? []"
                      :multi-select="resolveAssistantSelection(item.message)?.multiSelect ?? false"
                      :disabled="isAssistantSelectionConfirmed(item.message.id)"
                      @change-option="
                        (optionId, checked) =>
                          changeAssistantOption(item.message.id, optionId, resolveAssistantSelection(item.message)?.multiSelect ?? false, checked)
                      "
                      @change-all="(checked) => changeAllAssistantOptions(item.message.id, resolveAssistantSelection(item.message)?.options ?? [], checked)"
                    />
                    <template v-else>
                      <label v-for="option in resolveAssistantSelection(item.message)?.options ?? []" :key="option.id" class="ai-assistant-drawer__option">
                        <el-checkbox
                          class="aircas-checkbox"
                          :model-value="isAssistantOptionSelected(item.message.id, option.id)"
                          :disabled="isAssistantSelectionConfirmed(item.message.id)"
                          @change="changeAssistantOption(item.message.id, option.id, resolveAssistantSelection(item.message)?.multiSelect ?? false, $event)"
                        />
                        <span class="ai-assistant-drawer__option-text">
                          <span>{{ option.label }}</span>
                          <small v-if="option.description">{{ option.description }}</small>
                        </span>
                      </label>
                    </template>
                  </div>
                  <el-button
                    class="aircas-button"
                    type="primary"
                    size="small"
                    :disabled="!canConfirmAssistantSelection(item.message.id)"
                    @click="confirmAssistantSelection(item.message.id)"
                  >
                    确认
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </li>
      </ol>
      <div v-else class="ai-assistant-drawer__bubble">
        <div class="ai-assistant-drawer__bubble-body">
          <details v-if="group.message.role === 'assistant' && group.message.processItems.length" class="ai-assistant-drawer__process">
            <summary>过程</summary>
            <p v-for="(process, processIndex) in group.message.processItems" :key="`${group.message.id}-process-${processIndex}`">
              {{ process.text }}
            </p>
          </details>
          <div v-if="resolveAssistantVisibleContentBlocks(group.message).length" class="ai-assistant-drawer__content">
            <template v-for="(block, blockIndex) in resolveAssistantVisibleContentBlocks(group.message)" :key="`${group.message.id}-block-${blockIndex}`">
              <p v-if="block.kind === 'text'">{{ block.text }}</p>
              <p v-else-if="block.kind === 'item'" class="ai-assistant-drawer__content-item">
                <strong v-if="block.label">{{ block.label }}</strong>
                <span>{{ block.text }}</span>
              </p>
              <pre v-else class="ai-assistant-drawer__content-code">{{ block.text }}</pre>
            </template>
          </div>
          <p v-else-if="group.message.role === 'assistant' && !group.message.errorMessage && !group.message.selection" class="ai-assistant-drawer__pending">
            正在回复…
          </p>
          <p v-if="group.message.role === 'assistant' && group.message.errorMessage" class="ai-assistant-drawer__error">
            {{ group.message.errorMessage }}
          </p>
          <div v-if="group.message.role === 'assistant' && group.message.selection" class="ai-assistant-drawer__selection">
            <strong>{{ group.message.selection.title || "请选择" }}</strong>
            <div class="ai-assistant-drawer__option-list">
              <AiAssistantPropertySelectionTable
                v-if="isAssistantPropertySelectionCard(group.message.selection)"
                :rows="mapAssistantPropertySelectionRows(resolveAssistantSelection(group.message)?.options ?? [])"
                :selected-ids="selectedIdsByMessage[group.message.id] ?? []"
                :multi-select="resolveAssistantSelection(group.message)?.multiSelect ?? false"
                :disabled="isAssistantSelectionConfirmed(group.message.id)"
                @change-option="
                  (optionId, checked) =>
                    changeAssistantOption(group.message.id, optionId, resolveAssistantSelection(group.message)?.multiSelect ?? false, checked)
                "
                @change-all="(checked) => changeAllAssistantOptions(group.message.id, resolveAssistantSelection(group.message)?.options ?? [], checked)"
              />
              <template v-else>
                <label v-for="option in resolveAssistantSelection(group.message)?.options ?? []" :key="option.id" class="ai-assistant-drawer__option">
                  <el-checkbox
                    class="aircas-checkbox"
                    :model-value="isAssistantOptionSelected(group.message.id, option.id)"
                    :disabled="isAssistantSelectionConfirmed(group.message.id)"
                    @change="changeAssistantOption(group.message.id, option.id, resolveAssistantSelection(group.message)?.multiSelect ?? false, $event)"
                  />
                  <span class="ai-assistant-drawer__option-text">
                    <span>{{ option.label }}</span>
                    <small v-if="option.description">{{ option.description }}</small>
                  </span>
                </label>
              </template>
            </div>
            <el-button
              class="aircas-button"
              type="primary"
              size="small"
              :disabled="!canConfirmAssistantSelection(group.message.id)"
              @click="confirmAssistantSelection(group.message.id)"
            >
              确认
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import type { DeepReadonly } from "vue";
import type { CheckboxValueType } from "element-plus";

import type { AiAssistantAssistantMessage, AiAssistantBuildProgress, AiAssistantMessage, AiAssistantSelectionCard } from "@/types";
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

type AssistantConversationItem = { kind: "assistant" | "user"; message: DeepReadonly<AiAssistantMessage>; stepIndex?: number };
type AssistantConversationBuildGroup = {
  kind: "build";
  key: string;
  progress: DeepReadonly<AiAssistantBuildProgress>;
  items: AssistantConversationItem[];
};
type AssistantConversationPlainGroup = { kind: "plain"; key: string; message: DeepReadonly<AiAssistantMessage> };
type AssistantConversationGroup = AssistantConversationBuildGroup | AssistantConversationPlainGroup;

const selectedIdsByMessage = ref<Record<string, string[]>>({});
const confirmedMessageIds = ref<string[]>([]);
const collapsedBuildStepsByMessage = ref<Record<string, number[]>>({});
const expandedCompletedBuildStepsByMessage = ref<Record<string, number[]>>({});
const collapsedCompletedBuildStepsByMessage = ref<Record<string, number[]>>({});

/**
 * @description 将会话消息划分为构建组与普通消息组：连续的构建类助手消息合并为同一构建组，夹在两条构建类助手消息之间的用户追问也归入该组，避免续流回复重复生成步骤条。
 * @returns 分组后的会话渲染单元。
 */
const conversationGroups = computed<AssistantConversationGroup[]>(() => {
  const groups: AssistantConversationGroup[] = [];
  let buildItems: AssistantConversationItem[] | null = null;
  let buildKey = "";

  /**
   * @description 结束当前构建分组并写入分组列表，未形成有效构建组时按普通消息回退。
   */
  const flushBuildGroup = () => {
    if (!buildItems) return;
    const lastProgressItem = [...buildItems].reverse().find((item) => item.message.role === "assistant" && item.message.buildProgress);
    let progress: DeepReadonly<AiAssistantBuildProgress> | undefined;
    if (lastProgressItem && lastProgressItem.message.role === "assistant") {
      progress = lastProgressItem.message.buildProgress;
    }
    if (progress) {
      groups.push({ kind: "build", key: buildKey, progress, items: buildItems });
    } else {
      for (const item of buildItems) {
        groups.push({ kind: "plain", key: item.message.id, message: item.message });
      }
    }
    buildItems = null;
  };

  props.messages.forEach((message, index) => {
    if (message.role === "assistant" && (message.buildProgress || buildItems !== null)) {
      if (!buildItems) {
        buildItems = [];
        buildKey = message.id;
      }
      const currentStepIndex = [...buildItems].reverse().find((item) => item.stepIndex !== undefined)?.stepIndex ?? message.buildProgress?.current ?? 1;
      buildItems.push({
        kind: "assistant",
        message,
        stepIndex: message.buildProgress ? resolveAssistantMessageStepIndex(message, currentStepIndex) : currentStepIndex,
      });
      return;
    }
    const next = props.messages[index + 1];
    const joinsBuildGroup = message.role === "user" && buildItems !== null && next !== undefined && next.role === "assistant";
    if (joinsBuildGroup && buildItems) {
      const currentStepIndex = [...buildItems].reverse().find((item) => item.stepIndex !== undefined)?.stepIndex;
      buildItems.push({ kind: "user", message, stepIndex: currentStepIndex });
      return;
    }
    flushBuildGroup();
    groups.push({ kind: "plain", key: message.id, message });
  });
  flushBuildGroup();
  return groups;
});

/**
 * @description 解析分组容器的角色与加宽样式，构建组固定按助手消息展示。
 * @param group 会话分组。
 * @returns 分组容器 class。
 */
function resolveGroupMessageClass(group: AssistantConversationGroup): Record<string, boolean> {
  if (group.kind === "build") {
    return { "ai-assistant-drawer__message--assistant": true };
  }
  return resolveAssistantMessageClass(group.message);
}

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

const buildProgressMarkerPattern = /^\s*【第\s*\d+\s*步\s*\/\s*共\s*\d+\s*步】\s*$/;
const buildProgressMarkerSearchPattern = /【第\s*(\d+)\s*步\s*\/\s*共\s*\d+\s*步】/;

/**
 * @description 解析助手消息正文中的明确步骤标识，未标识时使用当前进行中步骤。
 * @param message 助手消息。
 * @param currentStepIndex 当前进行中步骤。
 * @returns 消息所属步骤序号。
 */
function resolveAssistantMessageStepIndex(message: DeepReadonly<AiAssistantAssistantMessage>, currentStepIndex: number): number {
  const match = message.content.match(buildProgressMarkerSearchPattern);
  return match ? Math.max(1, Number(match[1])) : currentStepIndex;
}

/**
 * @description 解析气泡正文块，属性选择时隐藏已被表格承接的草案 JSON，构建进度消息过滤与进度标签重复的步骤标记文本。
 * @param message 会话消息。
 * @returns 可见正文块。
 */
function resolveAssistantVisibleContentBlocks(message: DeepReadonly<AiAssistantMessage>): AssistantChatContentBlock[] {
  if (message.role !== "assistant") {
    return splitAssistantChatContentBlocks(message.content);
  }
  const blocks = splitAssistantChatContentBlocks(message.content).filter(
    (block) => block.kind !== "text" || !(message.buildProgress && buildProgressMarkerPattern.test(block.text)),
  );
  if (!isAssistantPropertySelectionCard(message.selection)) {
    return blocks;
  }
  return blocks.filter((block) => block.kind !== "code" || !isAssistantPropertyProposalCode(block.text));
}

/**
 * @description 判断构建步骤是否为构建组当前进行中的步骤。
 * @param group 构建分组。
 * @param stepIndex 步骤序号。
 * @returns 是否为当前步骤。
 */
function isBuildStepCurrent(group: AssistantConversationBuildGroup, stepIndex: number): boolean {
  return group.progress.current === stepIndex;
}

/** @description 判断步骤是否有可查看的历史对话。 */
function isBuildStepInteractive(group: AssistantConversationBuildGroup, stepIndex: number): boolean {
  const step = group.progress.steps.find((item) => item.index === stepIndex);
  return step?.status === "active" || step?.status === "complete";
}

/** @description 返回当前进行中步骤，否则返回最后一个已完成步骤。 */
function resolveDefaultExpandedStepIndex(group: AssistantConversationBuildGroup): number | undefined {
  return (
    group.progress.steps.find((step) => step.status === "active")?.index ??
    [...group.progress.steps].reverse().find((step) => step.status === "complete")?.index
  );
}

/**
 * @description 读取构建组中归属于指定步骤的消息，消息步骤在进入构建组时确定。
 * @param group 构建分组。
 * @param stepIndex 步骤序号。
 * @returns 当前步骤的对话消息。
 */
function resolveBuildStepItems(group: AssistantConversationBuildGroup, stepIndex: number): AssistantConversationItem[] {
  return group.items.filter((item) => item.stepIndex === stepIndex);
}

/**
 * @description 判断构建步骤内容区是否可见，仅当前步骤且未被收起时展示组内全部消息内容。
 * @param group 构建分组。
 * @param stepIndex 步骤序号。
 * @returns 是否展示内容区。
 */
function isBuildStepBodyVisible(group: AssistantConversationBuildGroup, stepIndex: number): boolean {
  const step = group.progress.steps.find((item) => item.index === stepIndex);
  if (step?.status === "pending" || step?.status === "error") {
    return false;
  }
  const collapsed = collapsedBuildStepsByMessage.value[group.key] ?? [];
  if (step?.status === "active") return !collapsed.includes(stepIndex);
  if (step?.status !== "complete") return false;
  const expanded = expandedCompletedBuildStepsByMessage.value[group.key] ?? [];
  const collapsedCompleted = collapsedCompletedBuildStepsByMessage.value[group.key] ?? [];
  return (
    !collapsedCompleted.includes(stepIndex) && (expanded.includes(stepIndex) || (!expanded.length && resolveDefaultExpandedStepIndex(group) === stepIndex))
  );
}

/**
 * @description 切换构建组当前步骤对话框的收起/展开，非当前步骤不响应。
 * @param group 构建分组。
 * @param stepIndex 步骤序号。
 */
function toggleBuildStepExpanded(group: AssistantConversationBuildGroup, stepIndex: number): void {
  if (!isBuildStepInteractive(group, stepIndex)) return;
  const step = group.progress.steps.find((item) => item.index === stepIndex);
  if (step?.status === "complete") {
    const expanded = expandedCompletedBuildStepsByMessage.value[group.key] ?? [];
    const collapsedCompleted = collapsedCompletedBuildStepsByMessage.value[group.key] ?? [];
    const isVisible = isBuildStepBodyVisible(group, stepIndex);
    if (isVisible) {
      collapsedCompletedBuildStepsByMessage.value = {
        ...collapsedCompletedBuildStepsByMessage.value,
        [group.key]: collapsedCompleted.includes(stepIndex) ? collapsedCompleted : [...collapsedCompleted, stepIndex],
      };
      expandedCompletedBuildStepsByMessage.value = {
        ...expandedCompletedBuildStepsByMessage.value,
        [group.key]: expanded.filter((index) => index !== stepIndex),
      };
      return;
    }
    collapsedCompletedBuildStepsByMessage.value = {
      ...collapsedCompletedBuildStepsByMessage.value,
      [group.key]: collapsedCompleted.filter((index) => index !== stepIndex),
    };
    expandedCompletedBuildStepsByMessage.value = {
      ...expandedCompletedBuildStepsByMessage.value,
      [group.key]: expanded.includes(stepIndex) ? expanded : [...expanded, stepIndex],
    };
    return;
  }
  const collapsed = collapsedBuildStepsByMessage.value[group.key] ?? [];
  collapsedBuildStepsByMessage.value = {
    ...collapsedBuildStepsByMessage.value,
    [group.key]: collapsed.includes(stepIndex) ? collapsed.filter((index) => index !== stepIndex) : [...collapsed, stepIndex],
  };
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
  if (isAssistantSelectionConfirmed(messageId)) return;
  const current = props.messages.find((item) => item.id === messageId);
  const options = current?.role === "assistant" ? (current.selection?.options ?? []) : [];
  const payload = resolveAssistantSelectionConfirmMessage(selectedIds, options);
  if (!payload) return;
  confirmedMessageIds.value = [...confirmedMessageIds.value, messageId];
  emit("select-option", payload, payload);
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
  border: 1px solid var(--aircas-color-border-light);
  border-top-left-radius: 2px;
  color: var(--aircas-color-text-primary);
  background: var(--aircas-color-panel-background-deep);
}

:root[theme="light"] .ai-assistant-drawer__message--assistant .ai-assistant-drawer__bubble {
  background: var(--aircas-color-card-background);
}

.ai-assistant-drawer__message--user .ai-assistant-drawer__bubble {
  border-top-right-radius: 2px;
  color: var(--aircas-color-on-accent);
  background: var(--aircas-color-primary);
}

.ai-assistant-drawer__bubble p,
.ai-assistant-drawer__content-code {
  margin: 0;
}

/* 构建步骤时间线：步骤在外层，最左侧竖线连接圆圈，组内全部消息内容插入当前步骤下方 */
.ai-assistant-drawer__build-steps {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  margin: 0;
  padding: 0;
  list-style: none;
}

.ai-assistant-drawer__build-steps li {
  position: relative;
}

.ai-assistant-drawer__build-steps li::after {
  content: "";
  position: absolute;
  top: 15px;
  bottom: -6px;
  left: 9px;
  width: 1px;
  background: var(--aircas-color-border-light);
}

.ai-assistant-drawer__build-steps li:last-child::after {
  display: none;
}

.ai-assistant-drawer__build-step-header {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 6px 0;
  border: 0;
  color: var(--aircas-color-text-disabled);
  background: transparent;
  font-size: 12px;
  text-align: left;
}

span.ai-assistant-drawer__build-step-header {
  cursor: default;
}

button.ai-assistant-drawer__build-step-header {
  cursor: pointer;
}

button.ai-assistant-drawer__build-step-header:focus-visible {
  outline: 1px solid var(--aircas-color-primary);
  outline-offset: 2px;
}

.ai-assistant-drawer__build-steps li.is-active > .ai-assistant-drawer__build-step-header {
  color: var(--aircas-color-primary);
}

.ai-assistant-drawer__build-steps li.is-complete > .ai-assistant-drawer__build-step-header {
  color: var(--aircas-color-success);
}

.ai-assistant-drawer__build-steps li.is-complete .ai-assistant-drawer__build-step-index {
  border-color: var(--aircas-color-success);
  color: var(--aircas-color-success);
}

.ai-assistant-drawer__build-steps li.is-complete::after {
  background: var(--aircas-color-success);
}

.ai-assistant-drawer__build-steps li.is-error > .ai-assistant-drawer__build-step-header {
  color: var(--aircas-color-danger);
}

.ai-assistant-drawer__build-step-index {
  position: relative;
  z-index: 1;
  display: grid;
  width: 18px;
  height: 18px;
  flex: none;
  place-items: center;
  border: 1px solid currentColor;
  border-radius: 50%;
  background: var(--aircas-color-panel-background);
  font-size: 10px;
}

.ai-assistant-drawer__build-step-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ai-assistant-drawer__build-step-meta {
  margin-left: auto;
  color: var(--aircas-color-text-secondary);
  font-size: 11px;
}

.ai-assistant-drawer__build-step-arrow {
  width: 14px;
  height: 14px;
  flex: none;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
  transition: transform 0.2s ease;
}

.ai-assistant-drawer__build-step-header.is-collapsed .ai-assistant-drawer__build-step-arrow {
  transform: rotate(-90deg);
}

.ai-assistant-drawer__build-step-body {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 8px;
  padding: 2px 0 10px 28px;
}

.ai-assistant-drawer__build-step-body .ai-assistant-drawer__bubble {
  max-width: 100%;
}

.ai-assistant-drawer__build-step-body .ai-assistant-drawer__bubble--user-inline {
  max-width: 85%;
  margin-left: auto;
  border: 0;
  border-top-right-radius: 2px;
  color: var(--aircas-color-on-accent);
  background: var(--aircas-color-primary);
}

:root[theme="light"] .ai-assistant-drawer__build-step-body .ai-assistant-drawer__bubble--user-inline {
  background: var(--aircas-color-primary);
}

.ai-assistant-drawer__bubble-body {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 8px;
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
  color: var(--aircas-color-text-secondary);
}

.ai-assistant-drawer__content-code {
  padding: 8px 10px;
  overflow: auto;
  max-width: 100%;
  border: 1px solid var(--aircas-color-border-light);
  border-radius: 6px;
  color: var(--aircas-color-text-secondary);
  background: transparent;
  font-size: 12px;
  line-height: 1.45;
  white-space: pre-wrap;
}

.ai-assistant-drawer__pending,
.ai-assistant-drawer__process,
.ai-assistant-drawer__error {
  color: var(--aircas-color-text-secondary);
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

.ai-assistant-drawer__option-list {
  max-height: 360px;
  min-height: 0;
  overflow-y: auto;
  padding-right: 4px;
}

.ai-assistant-drawer__selection strong {
  font-size: 13px;
}

.ai-assistant-drawer__option {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px 10px;
  border: 1px solid var(--aircas-color-border-light);
  border-radius: 6px;
  color: var(--aircas-color-text-primary);
  background: transparent;
  text-align: left;
  cursor: pointer;
}

.ai-assistant-drawer__option:hover,
.ai-assistant-drawer__option:focus-within {
  border-color: var(--aircas-color-border);
  background: var(--aircas-color-hover);
}

.ai-assistant-drawer__option-text {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 2px;
}

.ai-assistant-drawer__option small {
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
}
</style>
