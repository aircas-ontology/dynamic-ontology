type TickCallback = (time: number) => void;

interface TimeEngineOptions {
  /** 时间轴起点（ms 时间戳） */
  startTime: number;
  /** 时间轴终点（ms 时间戳） */
  endTime: number;
  /** 初始当前时刻；缺省取 startTime */
  currentTime?: number;
  /** 播放速度倍率，负数表示倒放；缺省 1 */
  speed?: number;
  /** 到达 endTime 后是否循环回 startTime；缺省 true */
  loop?: boolean;
  /** 倒放到达 startTime 时是否自动暂停；缺省 true */
  autoPauseAtStart?: boolean;
}

export class TimeEngine {
  readonly startTime: number;
  readonly endTime: number;
  currentTime: number;
  speed: number;
  loop: boolean;
  autoPauseAtStart: boolean;

  private isPlaying = false;
  private rafId = 0;
  private lastRealTime = 0;
  private listeners = new Set<TickCallback>();
  private isDisposed = false;

  constructor(options: TimeEngineOptions) {
    this.startTime = options.startTime;
    this.endTime = options.endTime;
    this.currentTime = options.currentTime ?? options.startTime;
    this.speed = options.speed ?? 1;
    this.loop = options.loop ?? true;
    this.autoPauseAtStart = options.autoPauseAtStart ?? true;
  }

  /**
   * 注册时钟回调，返回取消订阅函数
   */
  onTick(callback: TickCallback): () => void {
    if (this.isDisposed) {
      return () => {};
    }

    this.listeners.add(callback);
    return () => this.offTick(callback);
  }

  offTick(callback: TickCallback) {
    this.listeners.delete(callback);
  }

  private emit() {
    this.listeners.forEach((callback) => callback(this.currentTime));
  }

  play() {
    if (this.isPlaying || this.isDisposed) return;
    this.isPlaying = true;
    this.lastRealTime = performance.now();
    this.tick();
  }

  pause() {
    this.isPlaying = false;
    if (this.rafId !== 0) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
  }

  dispose() {
    if (this.isDisposed) return;

    this.pause();
    this.listeners.clear();
    this.isDisposed = true;
  }

  reset() {
    if (this.isDisposed) return;
    this.speed = 1;
    this.setTime(Date.now());
  }

  setSpeed(speed: number) {
    if (this.isDisposed) return;
    this.speed = speed;
  }

  setTime(time: number) {
    if (this.isDisposed) return;
    this.currentTime = this.clamp(time);
    this.emit();
  }

  getTime() {
    return this.currentTime;
  }

  private clamp(time: number) {
    return Math.min(Math.max(time, this.startTime), this.endTime);
  }

  private tick = () => {
    if (!this.isPlaying) return;

    const now = performance.now();
    const delta = now - this.lastRealTime;
    this.lastRealTime = now;

    this.currentTime += delta * this.speed;

    // 结束边界
    if (this.currentTime > this.endTime) {
      if (this.loop) {
        this.currentTime = this.startTime;
      } else {
        this.pause();
        return;
      }
    }

    // 开始边界（倒放）：始终 clamp 到起点，防止越界无限倒退
    if (this.currentTime < this.startTime) {
      this.currentTime = this.startTime;
      if (this.autoPauseAtStart) {
        this.pause();
        this.emit();
        return;
      }
    }

    this.emit();
    this.rafId = requestAnimationFrame(this.tick);
  };
}
