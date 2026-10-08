import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const MOCK_SERVER_HOST = "127.0.0.1";
const MOCK_SERVER_PORT = 37003;

/**
 * @description 生成未匹配路由的标准错误信封。
 * @returns {{code: number, message: string, success: false, data: null}}
 */
export function createNotFoundMockBody() {
  return {
    code: 404,
    message: "未匹配到 Mock 路由",
    success: false,
    data: null,
  };
}

/**
 * @description 将带 `:param` 的路由路径编译为正则，精确段优先由调用方处理。
 * @param {string} routePath 路由路径。
 * @returns {RegExp} 路径匹配正则。
 */
function createRoutePathPattern(routePath) {
  const pattern = routePath
    .split("/")
    .map((segment) => (segment.startsWith(":") ? "([^/]+)" : segment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")))
    .join("/");
  return new RegExp(`^${pattern}$`);
}

/**
 * @description 按 method 与 pathname 匹配路由表：先精确路径，再匹配 `:param` 模式。
 * @param {string} method HTTP 方法。
 * @param {string} pathname 请求路径。
 * @param {Array<{method: string, path: string, file: string, headers?: Record<string, string>}>} routes 路由表。
 * @returns {{method: string, path: string, file: string, headers?: Record<string, string>} | null} 命中路由；未命中返回 null。
 */
export function matchMockRoute(method, pathname, routes) {
  const normalizedMethod = method.toUpperCase();
  const exactRoute = routes.find((route) => route.method.toUpperCase() === normalizedMethod && route.path === pathname);
  if (exactRoute) {
    return exactRoute;
  }

  return (
    routes.find((route) => {
      if (route.method.toUpperCase() !== normalizedMethod || !route.path.includes(":")) {
        return false;
      }
      return createRoutePathPattern(route.path).test(pathname);
    }) ?? null
  );
}

/**
 * @description 解析仓库内 `src/mockData` 根目录。
 * @returns {string} mockData 绝对路径。
 */
function resolveMockDataRoot() {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../src/mockData");
}

/**
 * @description 读取 `routes.json` 路由表。
 * @param {string} [mockDataRoot] mockData 根目录。
 * @returns {Promise<Array<{method: string, path: string, file: string, headers?: Record<string, string>}>>} 路由表。
 */
export async function loadMockRoutes(mockDataRoot = resolveMockDataRoot()) {
  const source = await readFile(path.join(mockDataRoot, "routes.json"), "utf8");
  return JSON.parse(source);
}

/**
 * @description 写入跨域响应头，并暴露登录令牌头。
 * @param {import("node:http").ServerResponse} response HTTP 响应。
 * @param {Record<string, string>} [extraHeaders] 路由附加响应头。
 */
function writeCorsHeaders(response, extraHeaders = {}) {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type, access-token, Access-Token");
  response.setHeader("Access-Control-Expose-Headers", "access-token, Access-Token");
  for (const [headerName, headerValue] of Object.entries(extraHeaders)) {
    response.setHeader(headerName, headerValue);
  }
}

/**
 * @description 按路由表返回 fixture JSON；未匹配时返回 404 信封。
 * @param {import("node:http").IncomingMessage} request HTTP 请求。
 * @param {import("node:http").ServerResponse} response HTTP 响应。
 * @param {{mockDataRoot?: string, routes?: Array<{method: string, path: string, file: string, headers?: Record<string, string>}>}} [options] 可注入路由与根目录。
 * @returns {Promise<void>}
 */
export async function handleMockRequest(request, response, options = {}) {
  const mockDataRoot = options.mockDataRoot ?? resolveMockDataRoot();
  const routes = options.routes ?? (await loadMockRoutes(mockDataRoot));

  if (request.method === "OPTIONS") {
    writeCorsHeaders(response);
    response.writeHead(204);
    response.end();
    return;
  }

  const requestUrl = new URL(request.url ?? "/", `http://${MOCK_SERVER_HOST}`);
  const matchedRoute = matchMockRoute(request.method ?? "GET", requestUrl.pathname, routes);
  if (!matchedRoute) {
    writeCorsHeaders(response);
    response.writeHead(404, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify(createNotFoundMockBody()));
    return;
  }

  const fixtureSource = await readFile(path.join(mockDataRoot, matchedRoute.file), "utf8");
  writeCorsHeaders(response, matchedRoute.headers ?? {});
  response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
  response.end(fixtureSource);
}

/**
 * @description 创建 Mock HTTP 服务实例。
 * @param {{mockDataRoot?: string, routes?: Array<{method: string, path: string, file: string, headers?: Record<string, string>}>}} [options] 可注入路由与根目录。
 * @returns {import("node:http").Server} HTTP 服务。
 */
export function createMockHttpServer(options = {}) {
  return http.createServer((request, response) => {
    handleMockRequest(request, response, options).catch((error) => {
      writeCorsHeaders(response);
      response.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
      response.end(
        JSON.stringify({
          code: 500,
          message: error instanceof Error ? error.message : "Mock 服务异常",
          success: false,
          data: null,
        }),
      );
    });
  });
}

/**
 * @description 在本机 37003 启动 Mock HTTP 服务；端口占用时视为已有实例并结束。
 * @param {{host?: string, port?: number, mockDataRoot?: string}} [options] 监听选项。
 * @returns {Promise<import("node:http").Server | null>} 新启动的服务；端口已被占用时返回 null。
 */
export function startMockHttpServer(options = {}) {
  const host = options.host ?? MOCK_SERVER_HOST;
  const port = options.port ?? MOCK_SERVER_PORT;
  const server = createMockHttpServer(options);

  return new Promise((resolve, reject) => {
    server.once("error", (error) => {
      if (error && typeof error === "object" && "code" in error && error.code === "EADDRINUSE") {
        console.warn(`Mock HTTP server already listening at http://${host}:${port}`);
        resolve(null);
        return;
      }
      reject(error);
    });
    server.listen(port, host, () => {
      console.log(`Mock HTTP server listening at http://${host}:${port}`);
      resolve(server);
    });
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await startMockHttpServer();
}
