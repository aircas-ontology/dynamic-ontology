import { ref, type Ref } from "vue";

/** 引导步骤链覆盖的页面标识；用于跨页续接时判断步骤归属。 */
export type OnboardingGuidePageId = "space-list" | "space-manage" | "object-detail" | "theme-list" | "theme-create";

/** 六步流程式新手引导的单个小步骤定义。 */
export interface OnboardingGuideStep {
  /** 步骤唯一标识，同时作为 sessionStorage 续接键。 */
  id: string;
  /** 所属大步骤（六步链）名称，用于卡片进度展示。 */
  chain: string;
  /** 目标元素所在页面；跨页续接时按此字段判断是否在当前页面续播。 */
  page: OnboardingGuidePageId;
  /** 步骤标题。 */
  title: string;
  /** 步骤操作说明，指导用户完成真实点击与提交。 */
  description: string;
  /** 补充操作提示，按顺序展示为编号列表；可选。 */
  hints?: string[];
  /** 目标元素选择器；找不到时使用 Mock 兜底展示。 */
  targetSelector: string;
  /** 弹窗打开触发元素选择器；进入该步骤且目标元素未渲染时，引导自动点击该元素弹出目标弹窗。可选。 */
  enterTriggerSelector?: string;
  /** 进入该步骤时自动点击的元素选择器（如切换弹窗内的「导入创建」模式页签）；无论目标是否已渲染都会执行。可选。 */
  enterClickSelector?: string;
  /** 目标元素为按钮、页签、菜单项等可点击控件时置为 true，真实点击目标等同点击下一步；表单、拖拽区等非按钮目标不配置。可选。 */
  advanceOnTargetClick?: boolean;
  /** 换链离开时自动点击的元素选择器（如弹窗取消按钮），用于切换大步骤前关闭上一步打开的弹窗。可选。 */
  exitClickSelector?: string;
  /** 跨页离开时自动点击的元素选择器（如「进入」按钮），用于切换页面小步时由页面自身完成路由跳转；缺省回退 targetSelector。可选。 */
  leaveClickSelector?: string;
  /** Mock 兜底展示文案。 */
  mockLabel: string;
}

const ONBOARDING_GUIDE_STORAGE_KEY = "onboarding-guide-active-step";

/**
 * @description 读取 sessionStorage 中待续接的引导步骤 id。
 * @returns 步骤 id；不存在或环境不可用时返回空字符串。
 */
export function readOnboardingGuideStepId(): string {
  if (typeof window === "undefined" || !window.sessionStorage) return "";
  return window.sessionStorage.getItem(ONBOARDING_GUIDE_STORAGE_KEY) ?? "";
}

/**
 * @description 写入当前引导步骤 id，供跨页跳转后新页面续接。
 * @param stepId 当前步骤 id；空串表示清空。
 */
export function writeOnboardingGuideStepId(stepId: string): void {
  if (typeof window === "undefined" || !window.sessionStorage) return;
  if (!stepId) {
    window.sessionStorage.removeItem(ONBOARDING_GUIDE_STORAGE_KEY);
    return;
  }
  window.sessionStorage.setItem(ONBOARDING_GUIDE_STORAGE_KEY, stepId);
}

/**
 * @description 清空 sessionStorage 中的引导续接状态；跳过、完成或关闭引导时调用。
 */
export function clearOnboardingGuideStep(): void {
  writeOnboardingGuideStepId("");
}

interface UseOnboardingGuideOptions {
  /** 完整步骤链配置；用于解析续接步骤的页面归属。 */
  steps: readonly OnboardingGuideStep[];
  /** 当前页面标识。 */
  page: OnboardingGuidePageId;
  /** 点击帮助入口时的起始步骤 id。 */
  entryStepId: string;
}

interface UseOnboardingGuideResult {
  /** 引导浮层可见状态，绑定浮层的 v-model。 */
  visible: Ref<boolean>;
  /** 浮层起始步骤 id，绑定浮层的 start-id。 */
  startId: Ref<string>;
  /** 打开引导：从当前页面帮助入口步骤开始。 */
  openOnboardingGuide(): void;
  /** 关闭引导并清空续接状态。 */
  closeOnboardingGuide(): void;
}

/**
 * @description 管理六步流程式新手引导的页面接线：提供帮助入口打开能力，并在页面挂载时检测 sessionStorage
 *              中待续接的步骤；仅当续接步骤归属当前页面时自动续播，实现跨页真实跳转后的引导接续。
 * @param options 页面接线配置：步骤链、当前页面标识与帮助入口起始步骤。
 * @returns 浮层可见状态、起始步骤 id 与打开/关闭方法；引导状态由浮层写入 sessionStorage，关闭时清空。
 */
export function useOnboardingGuide(options: UseOnboardingGuideOptions): UseOnboardingGuideResult {
  const visible = ref(false);
  const startId = ref(options.entryStepId);

  const storedId = readOnboardingGuideStepId();
  const storedStep = storedId ? options.steps.find((step) => step.id === storedId) : undefined;
  if (storedStep && storedStep.page === options.page) {
    startId.value = storedStep.id;
    visible.value = true;
  }

  /** @description 从当前页面帮助入口步骤重新开始引导。 */
  function openOnboardingGuide() {
    startId.value = options.entryStepId;
    visible.value = true;
  }

  /** @description 关闭引导并清空续接状态。 */
  function closeOnboardingGuide() {
    clearOnboardingGuideStep();
    visible.value = false;
  }

  return { visible, startId, openOnboardingGuide, closeOnboardingGuide };
}
