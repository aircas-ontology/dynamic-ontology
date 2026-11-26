<template>
  <div class="rule-condition-wire-surface">
    <div ref="surfaceRef" class="rule-condition-wire-surface__surface">
      <svg class="rule-condition-wire-surface__wires" :width="size.width" :height="size.height" aria-hidden="true">
        <path v-for="(path, index) in paths" :key="index" :d="path" fill="none" />
      </svg>
      <ScheduleRuleConditionEditor :node="condition" is-root :readonly="readonly" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, provide, reactive, ref, toRef, watch } from "vue";
import type { RuleCompositeCondition, RuleConditionNode } from "@/types";
import ScheduleRuleConditionEditor from "./ScheduleRuleConditionEditor.vue";
import { RULE_CONDITION_ROOT_KEY } from "./ruleConditionRootKey";
const props = withDefaults(defineProps<{ condition: RuleCompositeCondition; readonly?: boolean }>(), {
  readonly: false,
});
provide(RULE_CONDITION_ROOT_KEY, toRef(props, "condition"));
const surfaceRef = ref<HTMLElement | null>(null);
const size = reactive({ width: 1, height: 1 });
const paths = ref<string[]>([]);
let observer: ResizeObserver | null = null;
let frame = 0;
let disposed = false;

/** @description 取得当前条件卡片指定端口中心坐标，避免嵌套端口混淆。 @param id 条件标识。 @param port 端口方向。 @returns 相对画布的坐标。 */
function readConditionPort(id: string, port: "in" | "out"): { x: number; y: number } | null {
  const surface = surfaceRef.value;
  if (!surface) return null;
  const branch = [...surface.querySelectorAll<HTMLElement>("[data-rule-node-id]")].find((item) => item.dataset.ruleNodeId === id);
  const target = branch?.querySelector<HTMLElement>(`:scope > article > [data-rule-port="${port}"]`);
  if (!target) return null;
  const bounds = surface.getBoundingClientRect();
  const rect = target.getBoundingClientRect();
  return { x: rect.left - bounds.left + rect.width / 2, y: rect.top - bounds.top + rect.height / 2 };
}

/** @description 递归生成组合条件与直属子条件的贝塞尔连接线。 @param node 当前条件。 @param result 路径集合。 */
function appendConditionPaths(node: RuleConditionNode, result: string[]): void {
  if (node.type !== "composite") return;
  const from = readConditionPort(node.id, "out");
  node.children.forEach((child) => {
    const to = readConditionPort(child.id, "in");
    if (from && to) {
      const middle = (from.x + to.x) / 2;
      result.push(`M ${from.x} ${from.y} C ${middle} ${from.y}, ${middle} ${to.y}, ${to.x} ${to.y}`);
    }
    appendConditionPaths(child, result);
  });
}

/** @description 在 Vue 布局完成后合并重绘，条件增删与控件尺寸变化时保持端口对齐。 */
function scheduleConditionRedraw(): void {
  window.cancelAnimationFrame(frame);
  frame = window.requestAnimationFrame(() => {
    void nextTick(() => {
      const surface = surfaceRef.value;
      if (!surface || disposed) return;
      size.width = Math.max(surface.scrollWidth, surface.clientWidth, 1);
      size.height = Math.max(surface.scrollHeight, surface.clientHeight, 1);
      const result: string[] = [];
      appendConditionPaths(props.condition, result);
      paths.value = result;
    });
  });
}
watch(() => props.condition, scheduleConditionRedraw, { deep: true });
onMounted(() => {
  observer = new ResizeObserver(scheduleConditionRedraw);
  if (surfaceRef.value) observer.observe(surfaceRef.value);
  window.addEventListener("resize", scheduleConditionRedraw);
  scheduleConditionRedraw();
});
onBeforeUnmount(() => {
  disposed = true;
  observer?.disconnect();
  window.cancelAnimationFrame(frame);
  window.removeEventListener("resize", scheduleConditionRedraw);
});
</script>
<style scoped lang="scss">
.rule-condition-wire-surface {
  min-width: 0;
  overflow-x: hidden;
  overflow-y: visible;
}
.rule-condition-wire-surface__surface {
  position: relative;
  min-width: 100%;
  width: max-content;
  padding: 4px 8px 8px;
}
.rule-condition-wire-surface__wires {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  overflow: visible;
}
.rule-condition-wire-surface__wires path {
  stroke: var(--aircas-color-accent-cyan);
  stroke-width: 1.6;
  stroke-linecap: round;
  opacity: 0.85;
}
</style>
