import { TimeEngine } from "@/models/TimeEngine";

/** 时间轴跨度：当前时刻 ±50 年（毫秒） */
const TIME_SPAN_MS = 1000 * 60 * 60 * 24 * 365 * 50;

/** 创建由调用方显式启动和销毁的时间引擎。 */
export function createTimeEngine(currentTime = Date.now()): TimeEngine {
  return new TimeEngine({
    startTime: currentTime - TIME_SPAN_MS,
    endTime: currentTime + TIME_SPAN_MS,
    currentTime,
    speed: 1,
    loop: true,
    autoPauseAtStart: false,
  });
}
