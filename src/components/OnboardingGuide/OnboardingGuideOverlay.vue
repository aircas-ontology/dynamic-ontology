<template>
  <Teleport to="body">
    <div v-if="visible" class="onboarding-guide" role="dialog" aria-modal="true" aria-label="新手引导" @keydown.esc="close">
      <div class="onboarding-guide__backdrop" @click="close" />
      <div v-if="targetRect" class="onboarding-guide__spotlight" :style="spotlightStyle" aria-hidden="true" />
      <div v-else class="onboarding-guide__mock-target" aria-hidden="true">
        <span>{{ currentStep.mockLabel }}</span>
      </div>
      <section class="onboarding-guide__card" :style="cardStyle">
        <el-icon class="onboarding-guide__icon"><QuestionFilled /></el-icon>
        <strong>{{ currentStep.title }}</strong>
        <p class="onboarding-guide__description">{{ currentStep.description }}</p>
        <div class="onboarding-guide__actions">
          <el-button text @click="close">跳过</el-button>
          <el-button v-if="index > 0" text @click="move(-1)">上一步</el-button>
          <el-button type="primary" @click="move(1)">{{ index === steps.length - 1 ? "完成" : "下一步" }}</el-button>
        </div>
      </section>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import { QuestionFilled } from "@element-plus/icons-vue";

export interface OnboardingGuideStep {
  id: string;
  title: string;
  description: string;
  targetSelector: string;
  mockLabel: string;
}

const props = withDefaults(defineProps<{ steps: readonly OnboardingGuideStep[]; startId?: string }>(), { startId: "" });

const visible = defineModel<boolean>({ default: false });
const index = ref(0);
const targetRect = ref<DOMRect | null>(null);
const fallbackStep: OnboardingGuideStep = {
  id: "fallback",
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
const cardStyle = computed(() => {
  const rect = targetRect.value;
  if (!rect) return { left: "50%", top: "50%", transform: "translate(-50%, -50%)" };
  const left = Math.min(Math.max(rect.left, 16), window.innerWidth - 336);
  const top = rect.bottom + 16 + 180 < window.innerHeight ? rect.bottom + 16 : Math.max(16, rect.top - 196);
  return { left: `${left}px`, top: `${top}px` };
});

function locateTarget() {
  const selector = currentStep.value?.targetSelector;
  targetRect.value = selector ? (document.querySelector<HTMLElement>(selector)?.getBoundingClientRect() ?? null) : null;
}

function refreshTarget() {
  void nextTick(locateTarget);
}

function move(offset: number) {
  const nextIndex = index.value + offset;
  if (nextIndex < 0 || nextIndex >= props.steps.length) {
    close();
    return;
  }
  index.value = nextIndex;
  refreshTarget();
}

function close() {
  visible.value = false;
}

watch(visible, (isVisible) => {
  if (!isVisible) return;
  const requestedIndex = props.steps.findIndex((step) => step.id === props.startId);
  index.value = requestedIndex >= 0 ? requestedIndex : 0;
  refreshTarget();
});

watch(() => props.steps, refreshTarget, { deep: true });
window.addEventListener("resize", refreshTarget);
window.addEventListener("scroll", refreshTarget, true);
onBeforeUnmount(() => {
  window.removeEventListener("resize", refreshTarget);
  window.removeEventListener("scroll", refreshTarget, true);
});
</script>

<style scoped lang="scss">
.onboarding-guide {
  position: fixed;
  inset: 0;
  z-index: 3000;
}
.onboarding-guide__backdrop {
  position: absolute;
  inset: 0;
  background: transparent;
}
.onboarding-guide__spotlight {
  position: fixed;
  z-index: 1;
  border: 2px solid var(--aircas-color-primary);
  border-radius: 8px;
  box-shadow:
    0 0 0 9999px var(--aircas-color-overlay),
    0 0 0 4px var(--aircas-color-effect-primary-soft);
  pointer-events: none;
}
.onboarding-guide__mock-target {
  position: fixed;
  z-index: 1;
  left: 50%;
  top: 42%;
  transform: translate(-50%, -50%);
  width: min(360px, calc(100vw - 32px));
  padding: 32px;
  border: 2px dashed var(--aircas-color-primary);
  border-radius: 10px;
  color: var(--aircas-color-primary);
  background: var(--aircas-color-panel-background);
  text-align: center;
  box-shadow: 0 0 0 9999px var(--aircas-color-overlay);
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
.onboarding-guide__icon {
  margin-right: 6px;
  color: var(--aircas-color-primary);
}
.onboarding-guide__description {
  margin: 8px 0 0;
  color: var(--aircas-color-text-secondary);
}
.onboarding-guide__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
