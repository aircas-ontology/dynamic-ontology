import { TimeEngine } from "@/models/TimeEngine";

/** 时间轴跨度：当前时刻 ±50 年（毫秒） */
const TIME_SPAN_MS = 1000 * 60 * 60 * 24 * 365 * 50;

const now = Date.now();

/** 全局时间引擎单例：模块首次被 import 时初始化并播放 */
export const timeEngineInstance = new TimeEngine({
  startTime: now - TIME_SPAN_MS,
  endTime: now + TIME_SPAN_MS,
  currentTime: now,
  speed: 1,
  loop: true,
  autoPauseAtStart: false,
});

timeEngineInstance.play();
