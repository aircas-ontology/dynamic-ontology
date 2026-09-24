<template>
  <button v-show="!visible" class="ai-assistant-launcher" type="button" aria-label="打开 AI 助手" @click="visible = true">
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 6.5h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H9l-4 3v-3H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Z" />
    </svg>
  </button>
  <el-drawer v-model="visible" class="aircas-drawer ai-assistant-drawer" title="AI 助手" direction="rtl" size="620px" :modal="false" append-to-body>
    <div class="ai-assistant-drawer__panel">
      <div ref="stageRef" class="ai-assistant-drawer__stage">
        <div v-if="messages.length" class="ai-assistant-drawer__conversation">
          <div
            v-for="(message, index) in messages"
            :key="`${index}-${message.role}`"
            class="ai-assistant-drawer__message"
            :class="message.role === 'user' ? 'ai-assistant-drawer__message--user' : 'ai-assistant-drawer__message--assistant'"
          >
            <p>{{ message.content }}</p>
          </div>
        </div>
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
      <div class="ai-assistant-drawer__composer">
        <el-input
          v-model="draft"
          class="aircas-input"
          type="textarea"
          :rows="4"
          maxlength="1000"
          show-word-limit
          resize="none"
          placeholder="请输入问题，Ctrl + Enter 发送"
          @keydown.ctrl.enter.prevent="submitAssistantQuestion"
        />
        <div class="ai-assistant-drawer__composer-bar">
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
          <button class="ai-assistant-drawer__send" type="button" aria-label="发送问题" :disabled="!draft.trim()" @click="submitAssistantQuestion">
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

interface AssistantChatMessage {
  role: "user" | "assistant";
  content: string;
}

const prompts = ["新建福特级航空母舰", "创建一个名称属性", "创建舰艇编制关系", "创建一个巡航行为", "编辑函数算子运行配置", "导出行为调度和规则库"];
const promptReplies: Record<string, string> = {
  新建福特级航空母舰:
    "已按示例整理对象草案：在「舰船 / 航空母舰」下新建「福特级航空母舰(CVN)」，API 名称建议为 carrier_ford。对象会带默认 main 存储分组，创建后可继续补充属性与关系。",
  创建一个名称属性:
    "名称属性用于标识对象实例。新增属性后打开「名称键」即可。同一对象只能有一个名称键；若已存在，需要先取消原属性上的名称键。设置成功后，关联数据源时会显示（名）。",
  创建舰艇编制关系: "可新增一条舰艇编制关系：源对象与目标对象分别选择编制双方，并填写必填分类。保存后可在关系图或列表中查看，筛选时以所选对象为中心。",
  创建一个巡航行为: "可为当前对象新建「巡航」行为，写明触发条件与执行步骤。该行为之后可以编入行为树，并由行为调度按规则触发。",
  编辑函数算子运行配置: "打开对应函数算子进行编辑，调整运行配置后保存。建议先用测试核对输入与输出，确认结果后再发布。",
  导出行为调度和规则库: "可导出当前行为调度及其规则库，内容包含触发条件与对应规则，便于在其他空间复用。导出前请确认调度范围和规则是否完整。",
};
const visible = ref(false);
const draft = ref("");
const messages = ref<AssistantChatMessage[]>([]);
const stageRef = ref<HTMLElement | null>(null);

/**
 * @description 把示例问题写入输入框，便于继续编辑后发送。
 * @param prompt 示例问题。
 */
function applyAssistantPrompt(prompt: string) {
  draft.value = prompt;
}

/**
 * @description 按示例问题返回本地助手回复。
 * @param question 已去掉首尾空白的问题。
 * @returns 对应回复；不是六条示例时返回空字符串。
 */
function resolveAssistantReply(question: string): string {
  return promptReplies[question] ?? "";
}

/**
 * @description 提交当前问题。空问题不发送；命中六条示例时在右侧用户消息后追加左侧助手回复。
 */
function submitAssistantQuestion() {
  const question = draft.value.trim();
  if (!question) return;
  const nextMessages: AssistantChatMessage[] = [...messages.value, { role: "user", content: question }];
  const reply = resolveAssistantReply(question);
  if (reply) nextMessages.push({ role: "assistant", content: reply });
  messages.value = nextMessages;
  draft.value = "";
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
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 20;
  display: grid;
  width: 44px;
  height: 44px;
  place-items: center;
  border: 1px solid var(--aircas-color-border);
  border-radius: 50%;
  color: var(--aircas-color-text-primary);
  background: color-mix(in srgb, var(--aircas-color-accent-cyan) 60%, transparent);
  box-shadow: 0 8px 20px var(--aircas-color-divider);
  cursor: pointer;
}

.ai-assistant-launcher:hover,
.ai-assistant-launcher:focus-visible {
  border-color: var(--aircas-color-accent-cyan);
  color: var(--aircas-color-accent-cyan);
  outline: none;
}

.ai-assistant-launcher svg,
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

.ai-assistant-drawer__message p {
  max-width: 72%;
  margin: 0;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.5;
}

.ai-assistant-drawer__message--assistant p {
  border: 1px solid var(--aircas-color-border-soft);
  border-top-left-radius: 2px;
  color: var(--aircas-color-text-primary);
  background: var(--aircas-color-overlay-deep);
}

:root[theme="light"] .ai-assistant-drawer__message--assistant p {
  background: var(--aircas-color-card-background);
}

.ai-assistant-drawer__message--user p {
  border-top-right-radius: 2px;
  color: var(--aircas-color-text-inverse);
  background: var(--aircas-color-accent-cyan);
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
