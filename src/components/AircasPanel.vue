<template>
  <div class="aircas-panel" ref="panelBoxRef" :style="{ ...initStyle, 'z-index': currentPanelIndex }">
    <!-- 顶部区域 -->
    <div class="panel-head" v-show="isTitle" ref="panelHeadRef" @click.stop="handlerChangeIndex">
      <div class="head-left">
        <img v-show="!isMin" :src="titleDecoration" class="title-decoration is-reversed" alt="" aria-hidden="true" />
        <span :title="title">{{ titleStr }}</span>
        <img v-show="!isMin" :src="titleDecoration" class="title-decoration" alt="" aria-hidden="true" />
      </div>

      <div class="head-right" v-show="isFunc">
        <button v-show="isMin" class="panel-action" type="button" title="恢复面板" aria-label="恢复面板" @click.stop="handleFullScreen">
          <FullScreen />
        </button>
        <button v-show="!isMin" class="panel-action" type="button" title="最小化面板" aria-label="最小化面板" @click.stop="handleMinimize">
          <Minus />
        </button>
        <button class="panel-action panel-action-close" type="button" title="关闭面板" aria-label="关闭面板" @click.stop="handlerCloseAircasPanel">
          <Close />
        </button>
      </div>
    </div>

    <div class="panel-body" v-show="!isMin" :style="{ width: panelBodyWidth, height: panelHeight }">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { Close, FullScreen, Minus } from "@element-plus/icons-vue";
import { useDraggable } from "@vueuse/core";

import titleDecoration from "@/assets/components/aircasPanel/images/titleDecoration.png";
import { useAircasPanelStore } from "@/stores/useAircasPanelStore";

const props = withDefaults(
  defineProps<{
    title?: string;
    isTitle?: boolean;
    width?: number | string;
    height?: number | string;
    top?: number | string;
    bottom?: number | string;
    left?: number | string;
    right?: number | string;
    isStatic?: boolean;
    isFunc?: boolean;
  }>(),
  {
    title: "插件面板",
    isTitle: true,
    width: 300,
    height: 400,
    top: 120,
    bottom: -9999,
    left: 100,
    right: -9999,
    isStatic: false,
    isFunc: true,
  }
);

const emit = defineEmits<{ close: [] }>();

const store = useAircasPanelStore();

const isMin = ref(false);
const panelBoxRef = ref<HTMLDivElement | null>(null);
const panelHeadRef = ref<HTMLDivElement | null>(null);

/** 当前面板 z-index：初始化与点击标题栏时递增 */
const currentPanelIndex = ref(store.currentPanelIndex + 1);
store.updatePanelIndex(currentPanelIndex.value);

const { x, y } = useDraggable(panelHeadRef, { disabled: props.isStatic });

/** 尺寸值 → CSS 长度：数字加 px，字符串原样 */
const sizeToCss = (value: number | string): string =>
  isFinite(Number(value)) ? `${value}px` : String(value);

/** 面板定位与宽度样式（拖拽后按屏幕范围 clamp） */
const initStyle = computed<Record<string, string>>(() => {
  const style: Record<string, string> = {};
  style.width = sizeToCss(props.width);
  if (isMin.value) style.width = "200px";

  // 拖拽过：以拖拽位置为准，并限制面板不能移动出屏幕外
  if (x.value !== 0 || y.value !== 0) {
    const panelWidth = panelBoxRef.value?.offsetWidth ?? 0;
    const windowsWidth = window.innerWidth;
    const windowsHeight = window.innerHeight;
    let top = y.value;
    let left = x.value;
    if (top < 0) top = 0;
    if (left < 0) left = 0;
    if (top + 38 > windowsHeight) top = windowsHeight - 38;
    if (left + panelWidth > windowsWidth) left = windowsWidth - panelWidth;
    style.top = `${top}px`;
    style.left = `${left}px`;
    return style;
  }

  // 未拖拽：按 props 定位（bottom/right 优先）
  if (Number(props.bottom) !== -9999) {
    style.bottom = sizeToCss(props.bottom);
  } else {
    style.top = sizeToCss(props.top);
  }

  if (Number(props.right) !== -9999) {
    style.right = sizeToCss(props.right);
  } else {
    style.left = sizeToCss(props.left);
  }

  return style;
});

/** panel-body 宽度：与 initStyle 保持一致的尺寸规则 */
const panelBodyWidth = computed(() => sizeToCss(props.width));

/** 面板内容高度：有标题栏时扣除 38px 标题高度 */
const panelHeight = computed(() => {
  if (props.isTitle) {
    return isFinite(Number(props.height)) ? `${Number(props.height) - 38}px` : `calc(${props.height} - 38px)`;
  }
  return sizeToCss(props.height);
});

const titleStr = computed(() => {
  if (isMin.value && props.title.length > 4) {
    return props.title.substring(0, 4) + "...";
  }
  return props.title;
});

function handlerChangeIndex() {
  currentPanelIndex.value = store.currentPanelIndex + 1;
  store.updatePanelIndex(currentPanelIndex.value);
}

function handleFullScreen() {
  isMin.value = false;
}

function handleMinimize() {
  isMin.value = true;
}

function handlerCloseAircasPanel() {
  emit("close");
}
</script>

<style lang="scss" scoped>
.aircas-panel {
  position: fixed;
  overflow: hidden !important;
  border: 1px solid var(--aircas-color-border);
  border-radius: 4px;
  box-shadow: 0 0 3px 1px var(--aircas-color-border);
  background-color: var(--aircas-color-background);

  .panel-head {
    height: 38px;
    width: 100%;
    border-radius: 4px 4px 0px 0px;
    border-bottom: 1px solid var(--aircas-color-border);
    padding: 0 12px;
    background: var(--aircas-color-background);
    display: flex;
    align-items: center;
    justify-content: space-between;
    user-select: none;
    cursor: move;

    .head-left {
      display: flex;
      align-items: center;

      .title-decoration {
        display: block;
      }

      .title-decoration.is-reversed {
        transform: rotateY(180deg);
      }

      span {
        font-size: 16px;
        padding: 0 5px;
        font-weight: bolder;
        color: var(--aircas-color-title);
      }
    }

    .head-right {
      display: flex;
      align-items: center;

      .panel-action {
        display: grid;
        place-items: center;
        font-size: 16px;
        font-weight: bold;
        width: 24px;
        height: 24px;
        padding: 2px;
        border: 0;
        border-radius: 2px;
        color: var(--aircas-color-text-primary);
        background: var(--aircas-color-selected-background);
        margin-left: 3px;
        transition: background-color 0.3s;
        cursor: pointer;
      }

      .panel-action:hover {
        background: var(--aircas-color-active-background);
      }

      .panel-action-close:hover {
        background: var(--aircas-color-danger);
      }

      .panel-action:focus-visible {
        outline: 2px solid var(--aircas-color-focus-border);
        outline-offset: 2px;
      }
    }
  }

  .panel-body {
    transition: all 0.3s;
    padding: 10px;
    overflow: auto;
  }
}
</style>
