import { ref } from "vue";

interface ManagedGraph<T> {
  setData: (data: T) => Promise<void>;
  resize: () => void;
  dispose: () => void;
}

/**
 * @description 管理关系图初始化、更新和重试，阻止过期响应及卸载后的回写。
 * @param createGraph 创建图形实例的工厂，初始化失败时由工厂清理部分资源。
 * @returns 只由当前视图持有的状态与生命周期操作。
 */
export function createRelationGraphLifecycle<T>(createGraph: () => ManagedGraph<T>) {
  const status = ref<"initializing" | "ready" | "error">("initializing");
  const error = ref("");
  let graph: ManagedGraph<T> | null = null;
  let disposed = false;
  let revision = 0;

  /** @description 释放当前实例，并在销毁前移除所有者引用以防重复清理。 */
  function releaseGraph(): void {
    const current = graph;
    graph = null;
    current?.dispose();
  }

  /**
   * @description 显示当前图形错误并释放实例，等待用户明确重试。
   * @param cause 初始化或数据更新异常。
   */
  function reportGraphError(cause: unknown): void {
    releaseGraph();
    status.value = "error";
    error.value = cause instanceof Error && cause.message.trim() ? cause.message : "关系图初始化失败，请检查浏览器 WebGL 支持后重试。";
  }

  /**
   * @description 创建或更新实例，只有最新更新可以设置就绪状态。
   * @param data 当前关系图数据。
   */
  async function update(data: T): Promise<void> {
    if (disposed || status.value === "error") return;
    const currentRevision = ++revision;
    try {
      graph ??= createGraph();
      const current = graph;
      await current.setData(data);
      if (disposed || currentRevision !== revision || graph !== current) return;
      current.resize();
      status.value = "ready";
    } catch (cause) {
      if (!disposed && currentRevision === revision) reportGraphError(cause);
    }
  }

  /**
   * @description 用户明确重试时重建实例，废弃之前的更新。
   * @param data 当前关系图数据。
   */
  async function retry(data: T): Promise<void> {
    if (disposed || status.value !== "error") return;
    revision += 1;
    releaseGraph();
    status.value = "initializing";
    error.value = "";
    await update(data);
  }

  /** @description 容器尺寸变化时调整实例，失败时提供可恢复错误。 */
  function resize(): void {
    if (disposed || !graph) return;
    try {
      graph.resize();
    } catch (cause) {
      revision += 1;
      reportGraphError(cause);
    }
  }

  /** @description 幂等销毁实例，阻止后续初始化、尺寸调整及异步状态更新。 */
  function dispose(): void {
    if (disposed) return;
    disposed = true;
    revision += 1;
    releaseGraph();
  }

  return { status, error, update, retry, resize, dispose };
}
