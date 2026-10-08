import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const mockDataRoot = path.join(repoRoot, "src", "mockData");

/**
 * @description 读取录制脚本使用的真实服务基址与登录凭据。
 * @returns {{baseUrl: string, username: string, password: string}} 录制配置。
 */
function readMockRecordConfig() {
  return {
    baseUrl: (process.env.MOCK_RECORD_BASE_URL ?? "http://172.16.18.58:37002").replace(/\/+$/, ""),
    username: process.env.MOCK_RECORD_USERNAME ?? "admin",
    password: process.env.MOCK_RECORD_PASSWORD ?? "admin",
  };
}

/**
 * @description 判断路由是否适合在无额外参数时直接 GET 录制。
 * @param {{method: string, path: string}} route 路由项。
 * @returns {boolean} 可直接录制时为 true。
 */
function canRecordMockRoute(route) {
  return route.method.toUpperCase() === "GET" && !route.path.includes(":");
}

/**
 * @description 登录真实服务并返回 access-token。
 * @param {{baseUrl: string, username: string, password: string}} config 录制配置。
 * @returns {Promise<string>} 登录令牌。
 */
async function requestRecordLoginToken(config) {
  const response = await fetch(`${config.baseUrl}/ontology/user/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: config.username, password: config.password }),
  });
  const accessToken = response.headers.get("access-token") ?? response.headers.get("Access-Token") ?? "";
  if (!response.ok || accessToken.trim().length === 0) {
    throw new Error("录制登录失败，请检查 MOCK_RECORD_BASE_URL 与账号。");
  }
  return accessToken.trim();
}

/**
 * @description 将真实接口响应写入对应 fixture 文件。
 * @param {string} fixtureRelativePath 相对 mockData 的 fixture 路径。
 * @param {unknown} payload 响应体。
 */
async function writeRecordedFixture(fixtureRelativePath, payload) {
  const fixturePath = path.join(mockDataRoot, fixtureRelativePath);
  await mkdir(path.dirname(fixturePath), { recursive: true });
  await writeFile(fixturePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

/**
 * @description 按 routes.json 从真实环境覆盖可直接 GET 的 Mock fixture。
 */
async function recordMockFixturesFromApi() {
  const config = readMockRecordConfig();
  const routes = JSON.parse(await readFile(path.join(mockDataRoot, "routes.json"), "utf8"));
  const accessToken = await requestRecordLoginToken(config);

  for (const route of routes) {
    if (!canRecordMockRoute(route)) {
      continue;
    }

    const response = await fetch(`${config.baseUrl}${route.path}`, {
      headers: { "access-token": accessToken },
    });
    const payload = await response.json();
    await writeRecordedFixture(route.file, payload);
    console.log(`recorded ${route.method} ${route.path} -> ${route.file}`);
  }
}

await recordMockFixturesFromApi();
