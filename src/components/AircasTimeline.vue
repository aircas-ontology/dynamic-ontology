<template>
  <AircasPanel title="时间轴" width="1200" height="160" bottom="20" left="calc(50% - 600px)" :isTitle="false" @close="handlePanelClose">
    <div class="aircas-timeline">
      <header>
        <div class="state-controls">
          <button type="button" :class="{ active: stepIndex === 3 }" :aria-pressed="stepIndex === 3" @click="setStep(3)">日制</button>
          <button type="button" :class="{ active: stepIndex === 2 }" :aria-pressed="stepIndex === 2" @click="setStep(2)">时制</button>
          <button type="button" :class="{ active: stepIndex === 1 }" :aria-pressed="stepIndex === 1" @click="setStep(1)">分制</button>
          <button type="button" :class="{ active: stepIndex === 0 }" :aria-pressed="stepIndex === 0" @click="setStep(0)">秒制</button>
        </div>

        <div class="time-controls">
          <button v-show="!isPlaying" class="icon-control" type="button" title="播放时间轴" aria-label="播放时间轴" @click="handleToggleTimeline(true)">
            <VideoPlay />
          </button>

          <button v-show="isPlaying" class="icon-control" type="button" title="暂停时间轴" aria-label="暂停时间轴" @click="handleToggleTimeline(false)">
            <VideoPause />
          </button>

          <!-- el-date-picker 类型未声明 emits，用 v-on 对象语法绑定事件 -->
          <el-date-picker
            class="current-time"
            popper-class="aircas-picker"
            v-model="timeShow"
            type="datetime"
            placeholder="设定开始时间"
            :clearable="false"
            v-on="{ 'visible-change': handleToggleDatePicker, change: handleSetCurrentTime }"
          />

          <button class="icon-control" type="button" title="重置时间轴" aria-label="重置时间轴" @click="handleResetTimeline">
            <RefreshRight />
          </button>
        </div>

        <div class="speed-controls">
          <span class="speed-label">{{ speed.valueOf() }}&nbsp;x</span>
          <button type="button" @click="setSpeed(-1)">减速</button>
          <button type="button" @click="setSpeed(0)">常速</button>
          <button type="button" @click="setSpeed(1)">加速</button>
        </div>
      </header>

      <footer>
        <canvas ref="aircasTimelineRef" role="img" aria-label="当前时间轴刻度"></canvas>
      </footer>
    </div>
  </AircasPanel>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { RefreshRight, VideoPause, VideoPlay } from "@element-plus/icons-vue";
import dayjs from "dayjs";

import { createTimeEngine } from "@/utils/initTimeEngine";
import AircasPanel from "./AircasPanel.vue";

const emit = defineEmits<{ close: [] }>();

const aircasTimelineRef = ref<HTMLCanvasElement | null>(null);
const stepScales = [1000, 60 * 1000, 60 * 60 * 1000, 24 * 60 * 60 * 1000];
const offsetX = 60; // 每个刻度线间距 60 像素
const width = 1168;
const height = 80;
const timelineInstance = createTimeEngine();

const isPlaying = ref(false);
const speed = ref(1);
const stepIndex = ref(0);
const timeShow = ref<number>(timelineInstance.getTime());

let ctx: CanvasRenderingContext2D | null = null;
let offDraw = () => {};
let stopInteraction = () => {};
let resumeAfterDatePicker = false;

onMounted(() => {
  const canvas = aircasTimelineRef.value;
  if (!canvas) return;

  ctx = canvas.getContext("2d");
  canvas.width = width;
  canvas.height = height;

  offDraw = timelineInstance.onTick(draw);
  draw(timelineInstance.getTime());
  stopInteraction = enableInteraction(canvas);
  timelineInstance.play();
  isPlaying.value = true;
});

onUnmounted(() => {
  offDraw();
  stopInteraction();
  timelineInstance.dispose();
});

function getThemeColor(variableName: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();
}

function draw(currentTime: number) {
  if (!ctx) return;

  ctx.clearRect(0, 0, width, height);

  const timelineSurface = document.documentElement.getAttribute("theme") === "light" ? "--aircas-color-card-background" : "--aircas-color-overlay-deep";
  ctx.fillStyle = getThemeColor(timelineSurface);
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = getThemeColor("--aircas-color-text-primary");
  ctx.fillStyle = getThemeColor("--aircas-color-text-primary");
  ctx.font = "700 16px Arial";
  ctx.textAlign = "center";

  const centerX = width / 2;
  const step = stepScales[stepIndex.value]!;

  const visibleStart = currentTime - (centerX / offsetX) * step;
  const visibleEnd = currentTime + (centerX / offsetX) * step;
  const firstTick = Math.floor(visibleStart / step) * step;

  for (let time = firstTick; time < visibleEnd; time += step) {
    const x = ((time - visibleStart) / step) * offsetX;

    const timeText = formatTime(time);
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.moveTo(x, 30);
    ctx.lineTo(x, 50);
    ctx.stroke();
    ctx.fillText(timeText, x, 70);
  }

  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 40);
  ctx.lineTo(width, 40);
  ctx.stroke();

  ctx.lineWidth = 4;
  ctx.strokeStyle = getThemeColor("--aircas-color-danger");
  ctx.beginPath();
  ctx.moveTo(centerX, 10);
  ctx.lineTo(centerX, 70);
  ctx.stroke();

  speed.value = timelineInstance.speed;
  timeShow.value = currentTime;
}

function setStep(index: number) {
  stepIndex.value = index;
}

function setSpeed(x: number) {
  if (speed.value < 0 && x < 0) {
    speed.value = -1 * speed.value * 2 * x;
  } else if (speed.value > 0 && x > 0) {
    speed.value = 1 * speed.value * 2 * x;
  } else if (x === 0) {
    speed.value = 1;
  } else {
    speed.value = x * 2;
  }

  timelineInstance.setSpeed(speed.value);
}

function handleSetCurrentTime() {
  const setTimeNow = dayjs(timeShow.value).valueOf();

  timelineInstance.setTime(setTimeNow);
}

function handleToggleDatePicker(isVisible: boolean) {
  if (isVisible) {
    resumeAfterDatePicker = isPlaying.value;
    timelineInstance.pause();
    isPlaying.value = false;
  } else if (resumeAfterDatePicker) {
    timelineInstance.play();
    isPlaying.value = true;
    resumeAfterDatePicker = false;
  }
}

function handleToggleTimeline(shouldPlay: boolean) {
  if (shouldPlay) {
    timelineInstance.play();
    isPlaying.value = true;
  } else {
    timelineInstance.pause();
    isPlaying.value = false;
  }
}

function handleResetTimeline() {
  timelineInstance.reset();
}

function formatTime(d: number) {
  if (stepIndex.value === 0) {
    return dayjs(d).format("ss");
  } else if (stepIndex.value === 1) {
    return dayjs(d).format("mm");
  } else if (stepIndex.value === 2) {
    return dayjs(d).format("HH");
  } else if (stepIndex.value === 3) {
    return dayjs(d).format("DD");
  } else {
    return "";
  }
}

/**
 * 启用画布拖拽改时间，返回清理函数（移除全部监听器）
 */
function enableInteraction(canvas: HTMLCanvasElement): () => void {
  let dragging = false;
  let lastX = 0;

  const handleMouseDown = (e: MouseEvent) => {
    dragging = true;
    lastX = e.clientX;
  };

  const handleMouseUp = () => {
    dragging = false;
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!dragging) return;

    const step = stepScales[stepIndex.value]!;
    const dx = e.clientX - lastX;
    lastX = e.clientX;

    timelineInstance.setTime(timelineInstance.getTime() - (dx / offsetX) * step);
  };

  canvas.addEventListener("mousedown", handleMouseDown);
  window.addEventListener("mouseup", handleMouseUp);
  window.addEventListener("mousemove", handleMouseMove);

  return () => {
    canvas.removeEventListener("mousedown", handleMouseDown);
    window.removeEventListener("mouseup", handleMouseUp);
    window.removeEventListener("mousemove", handleMouseMove);
  };
}

function handlePanelClose() {
  emit("close");
}
</script>

<style lang="scss" scoped>
.aircas-timeline {
  font-size: 14px;
  color: var(--aircas-color-text-primary);

  button {
    font-size: 14px;
    background: var(--aircas-color-selected-background);
    width: 60px;
    height: 28px;
    outline: none;
    border: 1px solid var(--aircas-color-border);
    border-radius: 3px;
    color: var(--aircas-color-text-primary);
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
      background: var(--aircas-color-hover-background);
    }

    &.active {
      background: var(--aircas-color-active-background);
    }

    &:focus-visible {
      outline: 2px solid var(--aircas-color-focus-border);
      outline-offset: 2px;
    }
  }

  .speed-label {
    font-weight: bolder;
    font-size: 16px;
    color: var(--aircas-color-text-primary);
    width: 60px;
    text-align: right;
  }

  .current-time {
    font-weight: bolder;
    font-size: 18px;
    color: var(--aircas-color-text-primary);
  }
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0 0 10px 0;

  .state-controls {
    width: 280px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .speed-controls {
    width: 280px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .time-controls {
    width: 300px;
    display: flex;
    justify-content: space-between;
    align-items: center;

    .icon-control {
      font-size: 14px;
      width: 40px;
      height: 28px;
      border: 0;
      border-radius: 3px;
      color: var(--aircas-color-text-primary);
      background: var(--aircas-color-transparent);
      cursor: pointer;
      transition: all 0.3s;
      display: flex;
      align-items: center;
      justify-content: center;
      user-select: none;

      &:hover {
        background: var(--aircas-color-hover-background);
      }

      &:focus-visible {
        outline: 2px solid var(--aircas-color-focus-border);
        outline-offset: 2px;
      }

      svg {
        width: 22px;
        height: 22px;
      }
    }
  }
}

footer {
  padding: 5px;
  border: 1px solid var(--aircas-color-border);
  border-radius: 3px;

  canvas {
    width: 1168px;
    height: 80px;
  }
}

:deep(.aircas-timeline) {
  .current-time {
    .el-input__prefix {
      display: none;
    }

    .el-input__wrapper {
      box-shadow: none;

      &:hover {
        box-shadow: 0 0 0 1px var(--el-input-hover-border-color) inset;
      }

      .el-input__inner {
        padding-left: 15px;
        font-weight: bolder;
        font-size: 18px;
        color: var(--aircas-color-text-primary);
      }
    }
  }
}
</style>
