import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const readSource = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

const mockSource = readSource("../src/mocks/loginMock/loginMock.ts");
const apiSource = readSource("../src/apis/loginApi.ts");
const commandSource = readSource("../src/views/LoginPage/composables/useLoginCommand.ts");
const pageSource = readSource("../src/views/LoginPage/index.vue");

test("login mock provides a bearer mock token alongside the success envelope", () => {
  assert.match(mockSource, /export const LOGIN_MOCK_TOKEN = "Bearer mock-login-token";/);
  assert.match(mockSource, /export const loginMock: ApiResponse<LoginData> = \{/);
  assert.match(mockSource, /code: 200,/);
});

test("login request uses the shared ten second timeout without a dedicated fallback path", () => {
  const constantsSource = readSource("../src/utils/constants.ts");
  const requestSource = readSource("../src/utils/request.ts");
  assert.match(constantsSource, /export const requestTimeoutMs: number = 10000;/);
  assert.match(requestSource, /import \{ requestTimeoutMs \} from "\.\/constants\.ts";/);
  assert.match(requestSource, /timeout: requestTimeoutMs,/);
  assert.doesNotMatch(apiSource, /timeout:/);
  assert.doesNotMatch(apiSource, /requestTimeoutMs/);
  assert.match(apiSource, /postLoginInterface/);
  assert.doesNotMatch(apiSource, /LOGIN_REQUEST_TIMEOUT/);
});

test("login command calls the real api and does not fall back to mock data on failure", () => {
  assert.match(commandSource, /import \{ postLoginInterface \} from "@\/apis";/);
  assert.match(commandSource, /export function useLoginCommand\(\)/);
  assert.match(commandSource, /return postLoginInterface\(params\)/);
  assert.doesNotMatch(commandSource, /from "@\/mocks\/loginMock\/loginMock"/);
  assert.doesNotMatch(commandSource, /LOGIN_MOCK_TOKEN/);
  assert.doesNotMatch(commandSource, /structuredClone\(loginMock\)/);
  assert.doesNotMatch(commandSource, /saveLoginToken/);
  assert.match(commandSource, /@description/);
});

test("login page submits through the login command and keeps the code 200 business check", () => {
  assert.match(pageSource, /import \{ useLoginCommand \} from "\.\/composables\/useLoginCommand";/);
  assert.match(pageSource, /const \{ submitLogin \} = useLoginCommand\(\);/);
  assert.match(pageSource, /const response = await submitLogin\(formData\.value\);/);
  assert.match(pageSource, /if \(response\.code !== 200\)/);
  assert.doesNotMatch(pageSource, /import \{ postLoginInterface \} from "@\/apis";/);
});

/**
 * @description 从 composable 源码中提取真实的 submitLogin 函数体（去除 TS 注解），在 VM 中注入替身依赖执行。
 * @param setupCode 注入到 VM 的依赖定义。
 * @returns VM 状态对象。
 */
function runSubmitLogin(setupCode) {
  const rawFunction = commandSource.match(/async function submitLogin\(params: LoginParams\): Promise<ApiResponse<LoginData>> \{[\s\S]*?\n  \}/)?.[0];
  assert.ok(rawFunction, "submitLogin function body not found");
  const plainFunction = rawFunction.replace(
    /async function submitLogin\(params: LoginParams\): Promise<ApiResponse<LoginData>> \{/,
    "async function submitLogin(params) {",
  );
  const state = {};
  vm.createContext(state);
  vm.runInContext(setupCode, state);
  vm.runInContext(`${plainFunction}\nthis.__result = submitLogin({ username: "admin", password: "a123456" });`, state);
  return state;
}

test("submitLogin returns the real api response when the service is healthy", async () => {
  const state = runSubmitLogin(`
    var requests = [];
    var postLoginInterface = async (params) => {
      requests.push(params);
      return { code: 200, message: "登录成功", success: true, data: { userId: 7 } };
    };
  `);

  const response = await state.__result;
  assert.equal(state.requests.length, 1);
  assert.equal(state.requests[0].username, "admin");
  assert.equal(state.requests[0].password, "a123456");
  assert.deepEqual(JSON.parse(JSON.stringify(response)), { code: 200, message: "登录成功", success: true, data: { userId: 7 } });
});

test("submitLogin propagates transport failure without mock success", async () => {
  const state = runSubmitLogin(`
    var postLoginInterface = async () => {
      throw new Error("网络连接失败，请检查网络后重试。");
    };
  `);

  await assert.rejects(() => state.__result, /网络连接失败/);
});
