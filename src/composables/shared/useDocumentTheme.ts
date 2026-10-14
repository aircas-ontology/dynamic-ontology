import { onScopeDispose, readonly, ref } from "vue";

/**
 * @description 以文档根节点 dark 类为唯一来源同步主题；每个调用作用域拥有并清理自己的监听器。
 * @returns 只读暗色状态与主题切换方法；无文档环境或作用域销毁后切换不执行。
 */
export function useDocumentTheme() {
  const root = typeof document === "undefined" ? null : document.documentElement;
  const isDark = ref(root?.classList.contains("dark") ?? false);
  let disposed = false;

  /**
   * @description 同步外部对文档根节点主题类的修改，忽略销毁后排队的回调。
   */
  function syncDocumentTheme() {
    if (!disposed && root) isDark.value = root.classList.contains("dark");
  }

  /**
   * @description 切换 dark 类并立即同步状态，保留根节点其他类。
   */
  function toggleTheme() {
    if (disposed || !root) return;
    root.classList.toggle("dark", !root.classList.contains("dark"));
    syncDocumentTheme();
  }

  const observer = root && typeof MutationObserver !== "undefined" ? new MutationObserver(syncDocumentTheme) : null;
  if (root) observer?.observe(root, { attributes: true, attributeFilter: ["class"] });
  onScopeDispose(() => {
    disposed = true;
    observer?.disconnect();
  });

  return { isDark: readonly(isDark), toggleTheme };
}
