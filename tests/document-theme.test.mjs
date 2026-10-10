import assert from "node:assert/strict";
import { test } from "node:test";
import { effectScope, isReadonly } from "vue";

/**
 * @description 建立根节点和 MutationObserver 的可控测试环境。
 * @param {boolean} dark 初始暗色状态。
 * @returns {object} 可变主题环境与清理函数。
 */
function createThemeEnvironment(dark) {
  const classes = new Set(dark ? ["dark", "application"] : ["application"]);
  const observers = [];
  const root = {
    classList: {
      contains: (name) => classes.has(name),
      toggle: (name, enabled) => {
        const next = enabled ?? !classes.has(name);
        if (next) classes.add(name);
        else classes.delete(name);
        return next;
      },
    },
  };
  const oldDocument = globalThis.document;
  const oldObserver = globalThis.MutationObserver;
  globalThis.document = { documentElement: root };
  globalThis.MutationObserver = class {
    /** @description 记录主题观察器。
     * @param {Function} callback 主题同步回调。
     */
    constructor(callback) {
      this.callback = callback;
      this.stopped = false;
      observers.push(this);
    }
    /** @description 检查监听边界仅限根 class。
     * @param {object} target 根节点。
     * @param {object} options 监听配置。
     */
    observe(target, options) {
      assert.equal(target, root);
      assert.deepEqual(options.attributeFilter, ["class"]);
    }
    /** @description 记录停止监听。 */
    disconnect() {
      this.stopped = true;
    }
  };
  return {
    root,
    classes,
    observers,
    notify: () => observers.filter((o) => !o.stopped).forEach((o) => o.callback([])),
    restore: () => {
      if (oldDocument === undefined) delete globalThis.document;
      else globalThis.document = oldDocument;
      if (oldObserver === undefined) delete globalThis.MutationObserver;
      else globalThis.MutationObserver = oldObserver;
    },
  };
}

for (const dark of [true, false]) {
  test(`document theme initializes ${dark ? "dark" : "light"} and toggles without removing other classes`, async () => {
    const { useDocumentTheme } = await import("../src/composables/shared/useDocumentTheme.ts");
    const environment = createThemeEnvironment(dark);
    const scope = effectScope();
    try {
      const theme = scope.run(useDocumentTheme);
      assert.equal(theme.isDark.value, dark);
      assert.equal(isReadonly(theme.isDark), true);
      theme.toggleTheme();
      assert.equal(theme.isDark.value, !dark);
      assert.equal(environment.classes.has("dark"), !dark);
      theme.toggleTheme();
      assert.equal(theme.isDark.value, dark);
      assert.equal(environment.classes.has("application"), true);
      environment.root.classList.toggle("dark", !dark);
      environment.notify();
      assert.equal(theme.isDark.value, !dark);
      scope.stop();
      assert.ok(environment.observers.every((observer) => observer.stopped));
      environment.root.classList.toggle("dark", dark);
      environment.notify();
      theme.toggleTheme();
      assert.equal(environment.classes.has("dark"), dark);
      const nextScope = effectScope();
      const nextTheme = nextScope.run(useDocumentTheme);
      assert.equal(nextTheme.isDark.value, dark);
      nextScope.stop();
    } finally {
      scope.stop();
      environment.restore();
    }
  });
}

test("document theme is inert when browser APIs are unavailable", async () => {
  const { useDocumentTheme } = await import("../src/composables/shared/useDocumentTheme.ts");
  const scope = effectScope();
  const theme = scope.run(useDocumentTheme);
  assert.equal(theme.isDark.value, false);
  assert.doesNotThrow(theme.toggleTheme);
  scope.stop();
});
