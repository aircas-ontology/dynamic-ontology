<template>
  <Teleport to="body">
    <div v-if="visible" class="onboarding-guide" role="dialog" aria-modal="true" aria-label="新手引导" @keydown.esc="close">
      <div class="onboarding-guide__board" :style="boardStyle.top" aria-hidden="true" />
      <div class="onboarding-guide__board" :style="boardStyle.bottom" aria-hidden="true" />
      <div class="onboarding-guide__board" :style="boardStyle.left" aria-hidden="true" />
      <div class="onboarding-guide__board" :style="boardStyle.right" aria-hidden="true" />
      <div v-if="targetRect" class="onboarding-guide__spotlight" :style="spotlightStyle" aria-hidden="true" />
      <div v-else class="onboarding-guide__mock-target" aria-hidden="true">
        <span>{{ currentStep.mockLabel }}</span>
        <span class="onboarding-guide__mock-hint">未找到目标元素，请先完成上一步操作</span>
      </div>
      <section class="onboarding-guide__card" :style="cardStyle">
        <button class="onboarding-guide__exit" type="button" aria-label="退出引导" @click="close">
          <el-icon><Close /></el-icon>
        </button>
        <p v-if="currentStep.chain" class="onboarding-guide__progress">{{ currentStep.chain }} · 第 {{ index + 1 }} / {{ steps.length }} 步</p>
        <el-icon class="onboarding-guide__icon"><QuestionFilled /></el-icon>
        <strong>{{ currentStep.title }}</strong>
        <p class="onboarding-guide__description">{{ currentStep.description }}</p>
        <ol v-if="currentStep.hints?.length" class="onboarding-guide__hints">
          <li v-for="hint in currentStep.hints" :key="hint">{{ hint }}</li>
        </ol>
        <div class="onboarding-guide__actions">
          <el-button text @click="skipChain()">跳过</el-button>
          <el-button v-if="index > 0" text @click="move(-1)">上一步</el-button>
          <el-button type="primary" @click="move(1)">{{ index === steps.length - 1 ? "完成" : "下一步" }}</el-button>
        </div>
      </section>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import { Close, QuestionFilled } from "@element-plus/icons-vue";
import type { OnboardingGuideStep } from "@/composables/shared/useOnboardingGuide";
import { clearOnboardingGuideStep, writeOnboardingGuideStepId } from "@/composables/shared/useOnboardingGuide";

const props = withDefaults(defineProps<{ steps: readonly OnboardingGuideStep[]; startId?: string }>(), { startId: "" });

const visible = defineModel<boolean>({ default: false });
const index = ref(0);
const targetRect = ref<DOMRect | null>(null);
const fallbackStep: OnboardingGuideStep = {
  id: "fallback",
  chain: "",
  page: "space-list",
  title: "新手引导",
  description: "请按页面提示完成操作。",
  targetSelector: "",
  mockLabel: "示例操作",
};
const currentStep = computed(() => props.steps[index.value] ?? props.steps[0] ?? fallbackStep);
const spotlightStyle = computed(() => {
  const rect = targetRect.value;
  return rect ? { left: `${rect.left - 6}px`, top: `${rect.top - 6}px`, width: `${rect.width + 12}px`, height: `${rect.height + 12}px` } : {};
});
/** 遮板空样式：目标未定位时收拢为不可见尺寸。 */
const emptyBoardStyle = { left: "0px", top: "0px", width: "0px", height: "0px" };
const boardStyle = computed(() => {
  const rect = targetRect.value;
  if (!rect) {
    const fullBoardStyle = { left: "0px", top: "0px", width: "100%", height: "100%" };
    return { top: fullBoardStyle, bottom: emptyBoardStyle, left: emptyBoardStyle, right: emptyBoardStyle };
  }
  return {
    top: { left: "0px", top: "0px", width: "100%", height: `${Math.max(rect.top - 6, 0)}px` },
    bottom: { left: "0px", top: `${rect.bottom + 6}px`, width: "100%", height: `${Math.max(window.innerHeight - rect.bottom - 6, 0)}px` },
    left: { left: "0px", top: `${rect.top - 6}px`, width: `${Math.max(rect.left - 6, 0)}px`, height: `${rect.height + 12}px` },
    right: {
      left: `${rect.right + 6}px`,
      top: `${rect.top - 6}px`,
      width: `${Math.max(window.innerWidth - rect.right - 6, 0)}px`,
      height: `${rect.height + 12}px`,
    },
  };
});
const cardStyle = computed(() => {
  const rect = targetRect.value;
  if (!rect) return { left: "50%", top: "50%", transform: "translate(-50%, -50%)" };
  const left = Math.min(Math.max(rect.left, 16), window.innerWidth - 336);
  const top = rect.bottom + 16 + 180 < window.innerHeight ? rect.bottom + 16 : Math.max(16, rect.top - 196);
  return { left: `${left}px`, top: `${top}px` };
});

/** @description 定位当前步骤的目标元素；找不到时回退 Mock 兜底展示。 */
function locateTarget() {
  const selector = currentStep.value?.targetSelector;
  targetRect.value = selector ? (document.querySelector<HTMLElement>(selector)?.getBoundingClientRect() ?? null) : null;
}

/** @description 在下一次渲染后重新定位目标元素，跟随弹窗展开与布局变化。 */
function refreshTarget() {
  void nextTick(locateTarget);
}

/** 程序化触发点击期间置位，抑制按钮类步骤的点击推进；label 激活转发的 click 在 Chromium 中 isTrusted 为 true，需一并抑制。 */
let suppressAdvanceClick = false;

/**
 * @description 程序化点击元素并短暂抑制按钮类步骤推进，避免自动开弹窗、切页签时误跳步。
 * @param element 待点击元素。
 */
function clickWithSuppress(element: HTMLElement) {
  suppressAdvanceClick = true;
  element.click();
  window.setTimeout(() => {
    suppressAdvanceClick = false;
  }, 0);
}

/**
 * @description 点击进入该步骤时需要自动激活的元素（如切换弹窗内的「导入创建」模式页签）。
 * @param step 当前引导步骤。
 */
function runEnterClick(step: OnboardingGuideStep) {
  const clickSelector = step.enterClickSelector;
  const clickTarget = clickSelector ? document.querySelector<HTMLElement>(clickSelector) : null;
  if (clickTarget) clickWithSuppress(clickTarget);
}

/**
 * @description 换链离开时自动点击当前步骤配置的退出元素（如弹窗取消按钮），关闭上一步打开的弹窗。
 * @param step 当前引导步骤。
 */
function runExitClick(step: OnboardingGuideStep) {
  const exitSelector = step.exitClickSelector;
  const exitTarget = exitSelector ? document.querySelector<HTMLElement>(exitSelector) : null;
  if (exitTarget) clickWithSuppress(exitTarget);
}

/**
 * @description 跨页离开时自动点击当前步骤配置的离开元素（如「进入」按钮），由页面自身完成路由跳转；缺省回退目标元素。
 * @param step 当前引导步骤。
 */
function runLeaveClick(step: OnboardingGuideStep) {
  const leaveTarget = document.querySelector<HTMLElement>(step.leaveClickSelector || step.targetSelector);
  if (leaveTarget) clickWithSuppress(leaveTarget);
}

/**
 * @description 激活当前步骤：目标元素已渲染时执行进入点击并定位；未渲染且配置了触发选择器时自动点击弹窗触发按钮，
 *              待弹窗渲染后再执行进入点击并重新定位；两者均未命中时先定位并延迟重试，仍失败则回退 Mock 兜底展示。
 */
function activateCurrentStep() {
  const step = currentStep.value;
  if (step.targetSelector && document.querySelector(step.targetSelector)) {
    runEnterClick(step);
    locateTarget();
    return;
  }
  const triggerSelector = step.enterTriggerSelector;
  const trigger = triggerSelector ? document.querySelector<HTMLElement>(triggerSelector) : null;
  if (!trigger) {
    locateTarget();
    window.setTimeout(locateTarget, 360);
    return;
  }
  clickWithSuppress(trigger);
  void nextTick(locateTarget);
  window.setTimeout(() => {
    runEnterClick(step);
    locateTarget();
  }, 360);
}

/**
 * @description 跳转到指定小步：跨大步骤时先点击退出元素关闭遗留弹窗，跨页面时点击离开元素由页面自身完成真实路由跳转，
 *              随后写入续接状态并激活目标步骤；索引越界时关闭引导。
 * @param nextIndex 目标小步索引。
 */
function goToStep(nextIndex: number) {
  if (nextIndex < 0 || nextIndex >= props.steps.length) {
    close();
    return;
  }
  const current = currentStep.value;
  const next = props.steps[nextIndex];
  if (!next) {
    close();
    return;
  }
  if (next.chain !== current.chain) runExitClick(current);
  if (next.page !== current.page) runLeaveClick(current);
  index.value = nextIndex;
  writeOnboardingGuideStepId(props.steps[nextIndex]?.id ?? "");
  activateCurrentStep();
}

/**
 * @description 前进或后退一步；越界关闭与跨链、跨页处理由 goToStep 统一完成。
 * @param offset 步进偏移，1 为下一步，-1 为上一步。
 */
function move(offset: number) {
  goToStep(index.value + offset);
}

/**
 * @description 跳过当前整个大步骤：从当前小步向后找到下一个大步骤的起始小步并跳转；已是最后一个大步骤时结束引导。
 */
function skipChain() {
  const current = currentStep.value;
  const nextIndex = props.steps.findIndex((step, i) => i > index.value && step.chain !== current.chain);
  if (nextIndex === -1) {
    close();
    return;
  }
  goToStep(nextIndex);
}

/** @description 关闭引导并清空 sessionStorage 续接状态。 */
function close() {
  visible.value = false;
}

/**
 * @description 按钮类步骤（advanceOnTargetClick）中，真实点击目标元素等同点击下一步；
 *              引导自身程序化触发与模拟点击不推进（isTrusted 与抑制标志双重防护），避免自动开弹窗、切页签时误跳步。
 * @param event 文档捕获阶段的点击事件。
 */
function handleTargetClick(event: MouseEvent) {
  if (!visible.value || !event.isTrusted || suppressAdvanceClick || !currentStep.value.advanceOnTargetClick) return;
  const selector = currentStep.value.targetSelector;
  const target = selector ? document.querySelector<HTMLElement>(selector) : null;
  if (target && event.target instanceof Node && target.contains(event.target)) move(1);
}

watch(
  visible,
  (isVisible, previous) => {
    if (isVisible) {
      const requestedIndex = props.steps.findIndex((step) => step.id === props.startId);
      index.value = requestedIndex >= 0 ? requestedIndex : 0;
      writeOnboardingGuideStepId(currentStep.value.id);
      activateCurrentStep();
      return;
    }
    if (previous) clearOnboardingGuideStep();
  },
  { immediate: true },
);

watch(() => props.steps, refreshTarget, { deep: true });
window.addEventListener("resize", refreshTarget);
window.addEventListener("scroll", refreshTarget, true);
window.addEventListener("click", handleTargetClick, true);
onBeforeUnmount(() => {
  window.removeEventListener("resize", refreshTarget);
  window.removeEventListener("scroll", refreshTarget, true);
  window.removeEventListener("click", handleTargetClick, true);
});
</script>

<style scoped lang="scss">
.onboarding-guide {
  position: fixed;
  inset: 0;
  z-index: 3000;
}
// 遮板围绕目标元素挖洞：非目标区域被半透明遮盖并拦截点击，高亮洞内事件穿透到真实页面元素。
.onboarding-guide__board {
  position: fixed;
  background: color-mix(in srgb, var(--aircas-color-overlay) 50%, transparent);
}
.onboarding-guide__spotlight {
  position: fixed;
  z-index: 1;
  border: 2px solid var(--aircas-color-primary);
  border-radius: 8px;
  box-shadow: 0 0 0 4px var(--aircas-color-effect-primary-soft);
  pointer-events: none;
}
.onboarding-guide__mock-target {
  position: fixed;
  z-index: 1;
  left: 50%;
  top: 42%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: min(360px, calc(100vw - 32px));
  padding: 32px;
  border: 2px dashed var(--aircas-color-primary);
  border-radius: 10px;
  color: var(--aircas-color-primary);
  background: var(--aircas-color-panel-background);
  text-align: center;
}
.onboarding-guide__mock-hint {
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
}
.onboarding-guide__card {
  position: fixed;
  z-index: 2;
  width: 320px;
  padding: 16px;
  border: 1px solid var(--aircas-color-border);
  border-radius: 10px;
  color: var(--aircas-color-text-primary);
  background: var(--aircas-color-panel-background);
  box-shadow: var(--aircas-shadow-popup);
}
.onboarding-guide__progress {
  margin: 0 0 4px;
  padding-right: 24px;
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
}
.onboarding-guide__exit {
  position: absolute;
  top: 8px;
  right: 8px;
  display: inline-flex;
  padding: 4px;
  border: none;
  border-radius: 6px;
  color: var(--aircas-color-text-secondary);
  background: transparent;
  cursor: pointer;
}
.onboarding-guide__exit:hover {
  color: var(--aircas-color-primary);
}
.onboarding-guide__exit:focus-visible {
  outline: 2px solid var(--aircas-color-primary);
  outline-offset: 2px;
}
.onboarding-guide__icon {
  margin-right: 6px;
  color: var(--aircas-color-primary);
}
.onboarding-guide__description {
  margin: 8px 0 0;
  color: var(--aircas-color-text-secondary);
}
.onboarding-guide__hints {
  margin: 8px 0 0;
  padding-left: 18px;
  color: var(--aircas-color-text-secondary);
  li + li {
    margin-top: 4px;
  }
}
.onboarding-guide__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
