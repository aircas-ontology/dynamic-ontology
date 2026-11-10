import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { compile, parse } from "@vue/compiler-dom";
import * as Vue from "vue";
import { renderToString } from "vue/server-renderer";
import { useDialog } from "element-plus/es/components/dialog/src/use-dialog.mjs";
import { ZINDEX_INJECTION_KEY, zIndexContextKey } from "element-plus/es/hooks/use-z-index/index.mjs";
import { ID_INJECTION_KEY } from "element-plus/es/hooks/use-id/index.mjs";

const dialogPaths = [
  "ObjectWorkspacePanel/components/OntologyObjectCreateDialog.vue",
  "OntologySpaceManagement/components/SpaceFormDialog.vue",
  "SpaceRelationWorkspace/components/SpaceRelationFormDialog.vue",
  "OntologyObjectAttributePanel/components/AttributePropertyFormDialog.vue",
];

/**
 * @description 编译实际模板的弹窗根节点，取得传给 Element Plus 的运行时属性。
 * @param {string} relativePath 页面目录下的弹窗路径。
 * @param {boolean} busy 是否正在提交。
 * @returns {Promise<Record<string, unknown>>} 实际弹窗属性。
 */
async function renderDialogProps(relativePath, busy) {
  const source = readFileSync(new URL(`../src/views/${relativePath}`, import.meta.url), "utf8");
  const template = source.slice(source.indexOf("<template>") + 10, source.indexOf("</template>"));
  const root = parse(template.slice(0, template.indexOf(">", template.indexOf("<el-dialog")) + 1) + "</el-dialog>", { isCustomElement: () => true });
  const { code } = compile(root, { mode: "function", isCustomElement: () => true });
  const render = new Function("Vue", code)(Vue);
  let vnode;
  await renderToString(
    Vue.createSSRApp({
      /** @description 在 Vue 渲染上下文执行弹窗模板并捕获根节点。 @returns {null} 不渲染 DOM。
       */
      render() {
        vnode = render({ visible: true, modelValue: true, busy, space: null, mode: "create", editingAttributeId: null, emit: () => {} }, []);
        return null;
      },
    }),
  );
  return Object.fromEntries(Object.entries(vnode.props).map(([key, value]) => [Vue.camelize(key), value]));
}

/**
 * @description 在无 DOM 的 Vue 宿主中挂载真实 Element Plus 弹窗状态逻辑。
 * @param {Record<string, unknown>} templateProps 实际模板属性。
 * @returns {{ state: ReturnType<typeof useDialog>, unmount: () => void }} 弹窗状态与清理方法。
 */
function mountDialogState(templateProps) {
  let state;
  const renderer = Vue.createRenderer({
    createComment: () => ({}),
    insert: () => {},
    remove: () => {},
    parentNode: () => null,
    nextSibling: () => null,
  });
  const app = renderer.createApp({
    /** @description 初始化待验证的真实弹窗关闭逻辑。 @returns {Function} 空渲染函数。 */
    setup() {
      const props = Vue.reactive({ closeOnClickModal: true, ...templateProps, modelValue: true, lockScroll: false, zIndex: 2000 });
      state = useDialog(props, Vue.ref());
      return () => null;
    },
  });
  app.provide(ZINDEX_INJECTION_KEY, { current: 0 });
  app.provide(zIndexContextKey, { current: 0 });
  app.provide(ID_INJECTION_KEY, { prefix: 1, current: 0 });
  app.mount({});
  return { state, unmount: () => app.unmount() };
}

for (const relativePath of dialogPaths) {
  for (const busy of [false, true]) {
    test(`${relativePath}: overlay clicks preserve open dialog (busy=${busy})`, async () => {
      const { state, unmount } = mountDialogState(await renderDialogProps(relativePath, busy));
      try {
        assert.equal(state.visible.value, true);
        state.onModalClick();
        state.onModalClick();
        assert.equal(state.visible.value, true, "重复点击遮罩不应关闭弹窗");
        state.handleClose();
        assert.equal(state.visible.value, false, "显式关闭仍应生效");
      } finally {
        unmount();
      }
    });
  }
}
