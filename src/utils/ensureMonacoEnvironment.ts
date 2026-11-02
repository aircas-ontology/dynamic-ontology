/**
 * @description 配置全局 MonacoEnvironment：按语言标签路由 worker，避免 TypeScript 调用 getNavigationTree 时落到无 handler 的 editor worker。
 */
export function ensureMonacoEnvironment(): void {
  const globalScope = globalThis as typeof globalThis & {
    MonacoEnvironment?: {
      getWorker(workerId: string, label: string): Worker;
    };
  };
  globalScope.MonacoEnvironment = {
    /**
     * @description 按 Monaco 语言标签创建对应 worker。
     * @param _workerId Monaco worker id（未使用）。
     * @param label 语言标签，如 typescript、javascript。
     * @returns Worker 实例。
     */
    getWorker(_workerId: string, label: string): Worker {
      if (label === "typescript" || label === "javascript") {
        return new Worker(new URL("monaco-editor/esm/vs/language/typescript/ts.worker.js", import.meta.url), { type: "module" });
      }
      if (label === "json") {
        return new Worker(new URL("monaco-editor/esm/vs/language/json/json.worker.js", import.meta.url), { type: "module" });
      }
      if (label === "css" || label === "scss" || label === "less") {
        return new Worker(new URL("monaco-editor/esm/vs/language/css/css.worker.js", import.meta.url), { type: "module" });
      }
      if (label === "html" || label === "handlebars" || label === "razor") {
        return new Worker(new URL("monaco-editor/esm/vs/language/html/html.worker.js", import.meta.url), { type: "module" });
      }
      return new Worker(new URL("monaco-editor/esm/vs/editor/editor.worker.js", import.meta.url), { type: "module" });
    },
  };
}
