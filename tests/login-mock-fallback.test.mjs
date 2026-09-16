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

test("login request fails fast with a dedicated ten second timeout before fallback", () => {
  assert.match(apiSource, /const LOGIN_REQUEST_TIMEOUT = 10000;/);
  assert.match(apiSource, /timeout: LOGIN_REQUEST_TIMEOUT,/);
  assert.match(apiSource, /postLoginInterface/);
});

test("login command calls the real api first and falls back to the mock token only on transport failure", () => {
  assert.match(commandSource, /import \{ postLoginInterface \} from "@\/apis";/);
  assert.match(commandSource, /import \{ LOGIN_MOCK_TOKEN, loginMock \} from "@\/mocks\/loginMock\/loginMock";/);
  assert.match(commandSource, /import \{ saveLoginToken \} from "@\/utils\/authToken";/);
  assert.match(commandSource, /export function useLoginCommand\(\)/);
  assert.match(commandSource, /return await postLoginInterface\(params\)/);
  assert.match(commandSource, /saveLoginToken\(LOGIN_MOCK_TOKEN\)/);
  assert.match(commandSource, /structuredClone\(loginMock\)/);
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
 * 从 composable 源码中提取真实的 submitLogin 函数体（去除 TS 注解），在 VM 中注入替身依赖执行，
 * 避免 Node 无法解析 "@/" 别名的问题。
 */
function runSubmitLogin(setupCode) {
  const rawFunction = commandSource.match(/async function submitLogin\(params: LoginParams\): Promise<ApiResponse<LoginData>> \{[\s\S]*?\n  \}/)[0];
  const plainFunction = rawFunction.replace(
    /async function submitLogin\(params: LoginParams\): Promise<ApiResponse<LoginData>> \{/,
    "async function submitLogin(params) {",
  );
  const state = {
    loginMock: { code: 200, message: "登录成功", success: true, data: {} },
    LOGIN_MOCK_TOKEN: "Bearer mock-login-token",
    structuredClone: (value) => JSON.parse(JSON.stringify(value)),
  };
  vm.createContext(state);
  vm.runInContext(setupCode, state);
  vm.runInContext(`${plainFunction}\nthis.__result = submitLogin({ username: "admin", password: "a123456" });`, state);
  return state;
}

test("submitLogin returns the real api response and skips the mock when the service is healthy", async () => {
  const state = runSubmitLogin(`
    var requests = [];
    var savedTokens = [];
    var postLoginInterface = async (params) => {
      requests.push(params);
      return { code: 200, message: "登录成功", success: true, data: { userId: 7 } };
    };
    var saveLoginToken = (token) => savedTokens.push(token);
  `);

  const response = await state.__result;
  assert.equal(state.requests.length, 1);
  assert.equal(state.requests[0].username, "admin");
  assert.equal(state.requests[0].password, "a123456");
  assert.deepEqual(JSON.parse(JSON.stringify(response)), { code: 200, message: "登录成功", success: true, data: { userId: 7 } });
  assert.equal(state.savedTokens.length, 0);
});

test("submitLogin persists the mock token and returns a detached mock success on transport failure", async () => {
  const state = runSubmitLogin(`
    var savedTokens = [];
    var postLoginInterface = async () => {
      throw new Error("网络连接失败，请检查网络后重试。");
    };
    var saveLoginToken = (token) => savedTokens.push(token);
  `);

  const response = await state.__result;
  assert.equal(state.savedTokens.length, 1);
  assert.equal(state.savedTokens[0], "Bearer mock-login-token");
  assert.equal(response.code, 200);
  assert.equal(response.message, "登录成功");
  assert.notEqual(response, state.loginMock);
  response.code = 500;
  assert.equal(state.loginMock.code, 200);
});
