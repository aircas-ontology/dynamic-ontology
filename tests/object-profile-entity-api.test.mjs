import test, { after } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { createServer } from "vite";
import { effectScope, nextTick, ref } from "vue";

const server = await createServer({ configFile: false, appType: "custom", server: { middlewareMode: true }, resolve: { alias: { "@": path.resolve("src") } } });
after(() => server.close());
const { useObjectProfileEntityList } = await server.ssrLoadModule("/src/views/EntityBrowsingObjectProfile/composables/useObjectProfileEntityList.ts");
const { resolveEntityBrowsingObjectProfile } = await server.ssrLoadModule("/src/mocks/entityBrowsingObjectProfileMock/entityBrowsingObjectProfileMock.ts");
const { mapObjectProfileEntityRows } = await server.ssrLoadModule("/src/views/EntityBrowsingObjectProfile/utils/mapObjectProfileEntityRows.ts");

/** @description 等待响应和 Vue 更新完成。 @returns 完成状态。 */
async function flushUpdates() {
  await new Promise((resolve) => setImmediate(resolve));
  await nextTick();
}

/** @description 构造可控制完成顺序的接口响应。 @returns Promise 及其完成函数。 */
function createDeferred() {
  let resolve;
  const promise = new Promise((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

/** @description 构造实体分页响应。 @param records 当前页实体。 @param current 当前页码。 @returns 接口响应。 */
function pageResponse(records, current = 1) {
  return { code: 200, message: "成功", data: { records, total: records.length, current, size: 20 } };
}

test("unknown objects retain the source default profile and current display name", () => {
  const profile = resolveEntityBrowsingObjectProfile("airplane", "飞机");
  assert.equal(profile.objectId, "airplane");
  assert.equal(profile.displayName, "飞机");
  assert.ok(profile.blocks.length > 0);
  assert.ok(profile.attributeGroups.length > 0);
});

test("default profile exposes its cover, side image and original model gallery", () => {
  const profile = resolveEntityBrowsingObjectProfile("airplane", "飞机");
  assert.match(profile.coverImage, /navy\.webp/);
  assert.equal(profile.sideImage, profile.coverImage);
  const gallery = profile.blocks.find((block) => block.id === "models-gallery");
  assert.deepEqual(
    gallery.images.map((image) => image.caption),
    ["Flight I", "Flight IIA", "Flight III"],
  );
  assert.ok(gallery.images.every((image) => image.src === profile.coverImage));
});

test("entity property arrays retain display names and values", () => {
  const rows = mapObjectProfileEntityRows([{ entityPrimaryKey: "1", properties: [{ propertyDisplayName: "航速", propertyValue: 23 }] }]);
  assert.equal(rows[0].cells["航速"], "23");
});

test("entity list queries object and page, displays results, handles empty and retry", async () => {
  const scope = effectScope();
  const calls = [];
  let mode = "success";
  const loader = async (params) => {
    calls.push(params);
    if (mode === "error") throw new Error("服务不可用");
    if (mode === "response-error") return { code: 500, message: "接口返回失败", data: { records: [], total: 0, current: params.pageNum, size: 20 } };
    return pageResponse(mode === "empty" ? [] : [{ entityPrimaryKey: "one", properties: { name: "示例" } }], params.pageNum);
  };
  const state = scope.run(() => useObjectProfileEntityList(ref("airplane"), loader));
  await flushUpdates();
  assert.deepEqual(calls[0], { ontologyUniqueIdentifier: "airplane", pageNum: 1, pageSize: 20 });
  assert.equal(state.status.value, "ready");
  assert.equal(state.filteredRows.value[0].cells.name, "示例");
  await state.loadObjectProfileEntityPage(2, 20);
  assert.equal(calls.at(-1).pageNum, 2);
  mode = "empty";
  await state.loadObjectProfileEntityPage(1, 20);
  assert.equal(state.status.value, "empty");
  mode = "error";
  await state.loadObjectProfileEntityPage(1, 20);
  assert.equal(state.status.value, "error");
  assert.match(state.error.value, /服务不可用/);
  mode = "response-error";
  await state.loadObjectProfileEntityPage(1, 20);
  assert.equal(state.status.value, "error");
  assert.match(state.error.value, /接口返回失败/);
  mode = "success";
  await state.loadObjectProfileEntityPage(1, 20);
  assert.equal(state.status.value, "ready");
  scope.stop();
});

test("entity list suppresses duplicate requests and ignores stale and disposed results", async () => {
  const scope = effectScope();
  const objectId = ref("old");
  const pending = new Map();
  const calls = [];
  const loader = (params) => {
    calls.push(params);
    const request = createDeferred();
    pending.set(params.ontologyUniqueIdentifier, request);
    return request.promise;
  };
  const state = scope.run(() => useObjectProfileEntityList(objectId, loader));
  void state.loadObjectProfileEntityPage();
  assert.equal(calls.length, 1);
  objectId.value = "new";
  await nextTick();
  pending.get("new").resolve(pageResponse([{ entityPrimaryKey: "new" }]));
  await flushUpdates();
  pending.get("old").resolve(pageResponse([{ entityPrimaryKey: "old" }]));
  await flushUpdates();
  assert.equal(state.rows.value[0].rowKey, "new");
  objectId.value = "disposed";
  await nextTick();
  scope.stop();
  pending.get("disposed").resolve(pageResponse([{ entityPrimaryKey: "disposed" }]));
  await flushUpdates();
  assert.notEqual(state.rows.value[0]?.rowKey, "disposed");
});
