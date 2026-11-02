import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRuntimeTemplateState } from "../src/views/FunctionOperatorPanel/utils/runtimeTemplateState.ts";

test("HTTP Mock route resolves the documented create response", async () => {
  const routes = JSON.parse(await readFile(new URL("../src/mockData/routes.json", import.meta.url), "utf8"));
  const route = routes.find((item) => item.method === "POST" && item.path === "/ontology/function/rate_limit_template");
  assert.ok(route);
  const response = JSON.parse(await readFile(new URL("../src/mockData/" + route.file, import.meta.url), "utf8"));
  const state = createRuntimeTemplateState();
  state.beginCreate();
  state.draft.name = "标准";
  await state.createRemoteTemplate(async () => response);
  assert.equal(state.records[0].name, "标准");
  assert.equal(state.records[0].id, 1);
  assert.equal(state.records[0].enabled, true);
});

test("create sends mapped fields, ignores repeat submission and uses server record", async () => {
  const state = createRuntimeTemplateState();
  state.beginCreate();
  state.draft.name = "Remote";
  state.draft.enabled = false;
  let finish;
  let calls = 0;
  const create = (params) => {
    calls++;
    assert.deepEqual(params, { name: "Remote", timeoutMs: 5000, retryCount: 2, retryIntervalMs: 300, tpsLimit: 600, maxConcurrency: 80, enabled: 0 });
    return new Promise((resolve) => {
      finish = resolve;
    });
  };
  const pending = state.createRemoteTemplate(create);
  await state.createRemoteTemplate(create);
  assert.equal(calls, 1);
  state.cancelEdit();
  assert.equal(state.editing, true);
  finish({ code: 200, data: { id: 99, name: "Remote", timeoutMs: 6000, retryCount: 2, retryIntervalMs: 300, tpsLimit: 600, maxConcurrency: 80, enabled: 0 } });
  await pending;
  assert.equal(state.records[0].id, 99);
  assert.equal(state.records[0].timeout, 6000);
  assert.equal(state.records[0].enabled, false);
  assert.equal(state.editing, false);
  assert.equal(state.submitting, false);
});
test("failed create retains draft and invalid response does not create a record", async () => {
  const state = createRuntimeTemplateState();
  state.beginCreate();
  state.draft.name = "Retry";
  await assert.rejects(
    state.createRemoteTemplate(async () => {
      throw new Error("offline");
    }),
  );
  assert.equal(state.editing, true);
  assert.equal(state.draft.name, "Retry");
  assert.equal(state.submitting, false);
  await assert.rejects(
    state.createRemoteTemplate(async () => ({ code: 400, message: "invalid" })),
    /invalid/,
  );
  await assert.rejects(state.createRemoteTemplate(async () => ({ code: 200, data: {} })));
  assert.equal(state.records.length, 0);
});

test("enabled status defaults on, supports direct changes and draft save/cancel", () => {
  const state = createRuntimeTemplateState();
  state.beginCreate();
  assert.equal(state.draft.enabled, true);
  state.draft.name = "Status";
  state.commitDraft();
  const id = state.records[0].id;
  state.setRecordEnabled(id, false);
  state.setRecordEnabled(id, false);
  assert.equal(state.records[0].enabled, false);
  state.setRecordEnabled(-1, true);
  state.beginEdit(id);
  state.setRecordEnabled(id, true);
  assert.equal(state.records[0].enabled, false);
  state.draft.enabled = true;
  state.cancelEdit();
  assert.equal(state.records[0].enabled, false);
  state.beginEdit(id);
  state.draft.enabled = true;
  state.commitDraft();
  assert.equal(state.records[0].enabled, true);
});

test("new draft cancels without creating a record; saved draft can edit and cancel", () => {
  const state = createRuntimeTemplateState();
  state.beginCreate();
  state.cancelEdit();
  assert.equal(state.records.length, 0);
  state.beginCreate();
  state.draft.name = "Default";
  state.commitDraft();
  assert.equal(state.records.length, 1);
  state.beginEdit(state.records[0].id);
  state.draft.timeout = 9000;
  state.cancelEdit();
  assert.equal(state.records[0].timeout, 5000);
  state.beginEdit(state.records[0].id);
  state.draft.timeout = 9000;
  state.commitDraft();
  assert.equal(state.records[0].timeout, 9000);
  state.removeRecord(state.records[0].id);
  assert.equal(state.records.length, 0);
});

test("rejects blank names, invalid numeric values and repeated save", () => {
  const state = createRuntimeTemplateState();
  state.beginCreate();
  assert.throws(() => state.commitDraft());
  state.draft.name = "Config";
  state.draft.retries = -1;
  assert.throws(() => state.commitDraft());
  state.draft.retries = 0;
  state.commitDraft();
  state.commitDraft();
  assert.equal(state.records.length, 1);
});

test("list query maps records, handles empty/error, duplicate calls and invalidation", async () => {
  const state = createRuntimeTemplateState();
  let finish;
  let calls = 0;
  const pending = state.queryRemoteTemplates(() => {
    calls++;
    return new Promise((resolve) => {
      finish = resolve;
    });
  });
  await state.queryRemoteTemplates(() => {
    calls++;
  });
  assert.equal(calls, 1);
  assert.equal(state.loading, true);
  state.invalidateQuery();
  await state.queryRemoteTemplates(async () => ({ code: 200, data: [] }));
  finish({ code: 200, data: [remoteRecord] });
  await pending;
  assert.equal(state.records.length, 0);
  await state.queryRemoteTemplates(async () => ({ code: 200, data: [remoteRecord] }));
  assert.equal(state.records[0].timeout, 5000);
  assert.equal(state.records[0].enabled, false);
  await assert.rejects(
    state.queryRemoteTemplates(async () => ({ code: 400, message: "list failed" })),
    /list failed/,
  );
  assert.equal(state.queryError, "list failed");
  await assert.rejects(state.queryRemoteTemplates(async () => ({ code: 200, data: [{}] })));
  await assert.rejects(
    state.queryRemoteTemplates(async () => {
      throw new Error("offline");
    }),
    /offline/,
  );
  assert.equal(state.loading, false);
  await state.queryRemoteTemplates(async () => ({ code: 200, data: [] }));
  assert.equal(state.queryError, "");
  assert.equal(state.records.length, 0);
});

const remoteRecord = { id: 9, name: "Remote", timeoutMs: 5000, retryCount: 2, retryIntervalMs: 300, tpsLimit: 600, maxConcurrency: 80, enabled: 0 };

test("remote edit preserves failed draft and refreshes after successful save", async () => {
  const state = createRuntimeTemplateState();
  await state.queryRemoteTemplates(async () => ({ code: 200, data: [remoteRecord] }));
  state.beginEdit(9);
  state.draft.name = "Changed";
  await assert.rejects(
    state.saveRemoteTemplate(
      async () => {
        throw new Error("unused");
      },
      async () => ({ code: 400, message: "update failed" }),
      async () => {
        throw new Error("unexpected query");
      },
    ),
    /update failed/,
  );
  assert.equal(state.editing, true);
  assert.equal(state.records[0].name, "Remote");
  let finish;
  let updates = 0;
  const update = (params) => {
    updates++;
    assert.equal(params.id, 9);
    assert.equal(params.enabled, 0);
    return new Promise((resolve) => {
      finish = resolve;
    });
  };
  const query = async () => ({ code: 200, data: [{ ...remoteRecord, name: "Server changed" }] });
  const pending = state.saveRemoteTemplate(async () => {}, update, query);
  await state.saveRemoteTemplate(async () => {}, update, query);
  assert.equal(updates, 1);
  finish({ code: 200, data: { ...remoteRecord, name: "Changed" } });
  await pending;
  assert.equal(state.records[0].name, "Server changed");
  assert.equal(state.editing, false);
});

test("create refresh failure is separate from successful save and allows retrying query", async () => {
  const state = createRuntimeTemplateState();
  state.beginCreate();
  state.draft.name = "Created";
  await state.saveRemoteTemplate(
    async () => ({ code: 200, data: remoteRecord }),
    async () => {},
    async () => {
      throw new Error("refresh offline");
    },
  );
  assert.equal(state.editing, false);
  assert.match(state.queryError, /refresh offline/);
  assert.equal(state.submitting, false);
  await state.queryRemoteTemplates(async () => ({ code: 200, data: [remoteRecord] }));
  assert.equal(state.queryError, "");
});

test("API request configuration uses GET query and PUT JSON and HTTP fixtures map into rows", async () => {
  const { transpileModule } = await import("typescript");
  const source = await readFile(new URL("../src/apis/functionRateLimitTemplateApi.ts", import.meta.url), "utf8");
  const compiled = transpileModule(source, { compilerOptions: { module: 99, target: 99 } }).outputText;
  const instrumented = compiled.replace(
    /import \{ request \} from "@\/utils\/request";/,
    'const request = async (config) => config; const DOMAIN_CONFIG = { ONTOLOGYMANAGE_URL: "http://test" };',
  );
  const api = await import("data:text/javascript;base64," + Buffer.from(instrumented).toString("base64"));
  for (const [name, method, suffix] of [
    ["deleteFunctionRateLimitTemplateInterface", "delete", ""],
    ["putEnableFunctionRateLimitTemplateInterface", "put", "/enable"],
    ["putDisableFunctionRateLimitTemplateInterface", "put", "/disable"],
  ]) {
    const config = await api[name]({ id: 9 });
    assert.equal(config.method, method);
    assert.equal(config.url, "http://test/ontology/function/rate_limit_template" + suffix);
    assert.deepEqual(config.params, { id: 9 });
    assert.equal(config.data, undefined);
  }
  const all = await api.getListFunctionRateLimitTemplateInterface();
  assert.equal(all.method, "get");
  assert.equal(all.url, "http://test/ontology/function/rate_limit_template/list");
  assert.equal(all.params, undefined);
  const disabled = await api.getListFunctionRateLimitTemplateInterface({ enabled: 0 });
  assert.deepEqual(disabled.params, { enabled: 0 });
  const updated = await api.putUpdateFunctionRateLimitTemplateInterface(remoteRecord);
  assert.equal(updated.method, "put");
  assert.equal(updated.url, "http://test/ontology/function/rate_limit_template");
  assert.deepEqual(updated.data, remoteRecord);
  const routes = JSON.parse(await readFile(new URL("../src/mockData/routes.json", import.meta.url), "utf8"));
  const route = routes.find((item) => item.method === "GET" && item.path === "/ontology/function/rate_limit_template/list");
  assert.ok(route);
  const response = JSON.parse(await readFile(new URL("../src/mockData/" + route.file, import.meta.url), "utf8"));
  const state = createRuntimeTemplateState();
  await state.queryRemoteTemplates(async () => response);
  assert.equal(state.records.length, response.data.length);
  const updateRoute = routes.find((item) => item.method === "PUT" && item.path === "/ontology/function/rate_limit_template");
  assert.ok(updateRoute);
});

test("delete and status commands preserve records on failure and refresh only after success", async () => {
  const state = createRuntimeTemplateState();
  await state.queryRemoteTemplates(async () => ({ code: 200, data: [remoteRecord] }));
  let queries = 0;
  const refresh = async () => {
    queries++;
    return { code: 200, data: [] };
  };
  await assert.rejects(
    state.executeRemoteCommand(9, async () => ({ code: 400, message: "denied" }), refresh),
    /denied/,
  );
  assert.equal(state.records.length, 1);
  assert.equal(queries, 0);
  assert.equal(state.submitting, false);
  await assert.rejects(
    state.executeRemoteCommand(
      9,
      async () => {
        throw new Error("offline");
      },
      refresh,
    ),
    /offline/,
  );
  await assert.rejects(
    state.executeRemoteCommand(0, async () => {}, refresh),
    /ID/,
  );
  let finish;
  let commands = 0;
  const command = (params) => {
    commands++;
    assert.deepEqual(params, { id: 9 });
    return new Promise((resolve) => {
      finish = resolve;
    });
  };
  const pending = state.executeRemoteCommand(9, command, refresh);
  await state.executeRemoteCommand(9, command, refresh);
  assert.equal(commands, 1);
  assert.equal(state.submitting, true);
  assert.equal(state.records.length, 1);
  finish({ code: 200 });
  await pending;
  assert.equal(queries, 1);
  assert.equal(state.records.length, 0);
  assert.equal(state.submitting, false);
});

test("enable and disable choose the correct endpoint and retain the switch on failure", async () => {
  const state = createRuntimeTemplateState();
  await state.queryRemoteTemplates(async () => ({ code: 200, data: [remoteRecord] }));
  let enabledCalls = 0;
  let disabledCalls = 0;
  const enable = async () => {
    enabledCalls++;
    return { code: 200 };
  };
  const disable = async () => {
    disabledCalls++;
    return { code: 400, message: "blocked" };
  };
  await state.changeRemoteEnabled(9, true, enable, disable, async () => ({ code: 200, data: [{ ...remoteRecord, enabled: 1 }] }));
  assert.equal(enabledCalls, 1);
  assert.equal(state.records[0].enabled, true);
  await assert.rejects(
    state.changeRemoteEnabled(9, false, enable, disable, async () => {}),
    /blocked/,
  );
  assert.equal(disabledCalls, 1);
  assert.equal(state.records[0].enabled, true);
  await state.changeRemoteEnabled(9, true, enable, disable, async () => {});
  assert.equal(enabledCalls, 1);
  await state.executeRemoteCommand(9, enable, async () => {
    throw new Error("refresh failed");
  });
  assert.equal(state.queryError, "refresh failed");
});

test("successful disable refreshes state; unmount invalidates command refresh", async () => {
  const state = createRuntimeTemplateState();
  await state.queryRemoteTemplates(async () => ({ code: 200, data: [{ ...remoteRecord, enabled: 1 }] }));
  await state.changeRemoteEnabled(
    9,
    false,
    async () => {
      throw new Error("wrong endpoint");
    },
    async () => ({ code: 200 }),
    async () => ({ code: 200, data: [remoteRecord] }),
  );
  assert.equal(state.records[0].enabled, false);
  let finish;
  let queries = 0;
  const pending = state.executeRemoteCommand(
    9,
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
    async () => {
      queries++;
      return { code: 200, data: [] };
    },
  );
  state.invalidateQuery();
  finish({ code: 200 });
  await pending;
  assert.equal(queries, 0);
  assert.equal(state.submitting, false);
});
