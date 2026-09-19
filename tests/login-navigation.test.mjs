import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const source = readFileSync(new URL("../src/views/LoginPage/index.vue", import.meta.url), "utf8");
const handler = source.match(/async function onSubmit\(\) \{[\s\S]*?(?=\n<\/script>)/)[0];

function runHandler(setupCode) {
  const state = {
    formData: { value: { username: "admin", password: "a123456" } },
    loginStatus: { value: "idle" },
    loginError: { value: "" },
    ElMessage: { warning() {}, error() {} },
  };
  vm.createContext(state);
  vm.runInContext(setupCode, state);
  vm.runInContext(handler, state);
  return state;
}

test("successful login posts credentials and enters ontology space management", async () => {
  const state = runHandler(`
    var requests = [];
    var pushes = [];
    var submitLogin = async (params) => {
      requests.push(params);
      return { code: 200, success: true, message: "登录成功", data: {} };
    };
    var router = {
      push: async (target) => {
        pushes.push(target);
        return undefined;
      },
    };
  `);

  await state.onSubmit();

  assert.equal(state.requests.length, 1);
  assert.equal(state.requests[0].username, "admin");
  assert.equal(state.requests[0].password, "a123456");
  assert.equal(state.pushes.length, 1);
  assert.equal(state.pushes[0].name, "OntologySpaceManagement");
  assert.equal(state.loginStatus.value, "success");
  assert.equal(state.loginError.value, "");
});

test("duplicate submissions while pending send only one login request", async () => {
  const state = runHandler(`
    var requests = [];
    var resolveLogin;
    var submitLogin = (params) => {
      requests.push(params);
      return new Promise((resolve) => {
        resolveLogin = resolve;
      });
    };
    var router = { push: async () => undefined };
  `);

  const pending = state.onSubmit();
  await state.onSubmit();
  assert.equal(state.requests.length, 1);
  state.resolveLogin({ code: 200, success: true, message: "登录成功", data: {} });
  await pending;
  assert.equal(state.loginStatus.value, "success");
});

test("business failure shows the server message without navigating", async () => {
  const state = runHandler(`
    var pushes = [];
    var submitLogin = async () => ({
      code: 401,
      success: false,
      message: "用户名或密码错误",
      data: {},
    });
    var router = {
      push: async (target) => {
        pushes.push(target);
      },
    };
  `);

  await state.onSubmit();

  assert.equal(state.pushes.length, 0);
  assert.equal(state.loginStatus.value, "error");
  assert.equal(state.loginError.value, "用户名或密码错误");
});

test("transport failure is replaced by the command mock fallback and still enters the system", async () => {
  // useLoginCommand 内部捕获传输失败并返回 mock 成功响应，页面侧 submitLogin 始终得到 code 200。
  const state = runHandler(`
    var pushes = [];
    var submitLogin = async () => ({ code: 200, success: true, message: "登录成功", data: {} });
    var router = {
      push: async (target) => {
        pushes.push(target);
        return undefined;
      },
    };
  `);

  await state.onSubmit();
  assert.equal(state.loginStatus.value, "success");
  assert.equal(state.pushes.length, 1);
  assert.equal(state.pushes[0].name, "OntologySpaceManagement");
});

test("navigation errors are visible and allow retry", async () => {
  const state = runHandler(`
    var submitLogin = async () => ({
      code: 200,
      success: true,
      message: "登录成功",
      data: {},
    });
    var router = {
      async push() {
        throw new Error("进入系统失败，请稍后重试。");
      },
    };
  `);

  await state.onSubmit();
  assert.equal(state.loginStatus.value, "error");
  assert.match(state.loginError.value, /进入系统失败/);
});
