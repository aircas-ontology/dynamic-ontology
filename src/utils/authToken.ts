import { getStorage, removeStorage, setStorage, StorageError } from "./storage.ts";

/** 登录令牌在会话存储中的键名。 */
export const LOGIN_TOKEN_STORAGE_KEY = "ontology-login-token";

const BEARER_PREFIX = "Bearer ";

/**
 * @description 解析会话级存储适配器；显式传入时优先使用，浏览器环境外返回 null。
 * @param storage 可选的存储适配器，便于测试注入。
 * @returns 可用的 Storage；不可用时为 null。
 */
function resolveSessionStorage(storage?: Storage): Storage | null {
  if (storage) return storage;
  if (typeof window === "undefined" || !window.sessionStorage) return null;
  return window.sessionStorage;
}

/**
 * @description 类型守卫：仅接受非空白字符串令牌。
 * @param value 从存储读取的未知值。
 * @returns 是否为可用的令牌字符串。
 */
function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * @description 归一化 Bearer 令牌：去除首尾空白与已有的 Bearer 前缀，拒绝空令牌。
 * @param rawToken 登录响应头中的原始 Authorization 值。
 * @returns 不带 Bearer 前缀的原始令牌。
 */
function normalizeBearerToken(rawToken: string): string {
  const trimmedToken = rawToken.trim();
  if (trimmedToken.length === 0) {
    throw new Error("登录令牌无效，无法保存空令牌。");
  }
  return trimmedToken.startsWith(BEARER_PREFIX) ? trimmedToken.slice(BEARER_PREFIX.length).trim() : trimmedToken;
}

/**
 * @description 保存登录令牌到 sessionStorage（关闭标签页后失效），自动归一化 Bearer 前缀。
 * @param rawToken 登录响应头返回的 Authorization 值。
 * @param storage 可选存储适配器，未传时使用 window.sessionStorage。
 */
export function saveLoginToken(rawToken: string, storage?: Storage): void {
  const targetStorage = resolveSessionStorage(storage);
  if (!targetStorage) throw new StorageError("set");
  setStorage(LOGIN_TOKEN_STORAGE_KEY, normalizeBearerToken(rawToken), targetStorage);
}

/**
 * @description 读取登录令牌；存储不可用或数据损坏时清理脏数据并降级为未登录（null）。
 * @param storage 可选存储适配器。
 * @returns 不带 Bearer 前缀的令牌；未登录或数据无效时为 null。
 */
export function getLoginToken(storage?: Storage): string | null {
  const targetStorage = resolveSessionStorage(storage);
  if (!targetStorage) return null;
  try {
    return getStorage(LOGIN_TOKEN_STORAGE_KEY, isNonEmptyString, targetStorage);
  } catch (error: unknown) {
    if (error instanceof StorageError) {
      removeStorage(LOGIN_TOKEN_STORAGE_KEY, targetStorage);
      return null;
    }
    throw error;
  }
}

/**
 * @description 获取可直接写入请求头的完整 Authorization 值。
 * @param storage 可选存储适配器。
 * @returns 形如 `Bearer <token>` 的值；未登录时为 null。
 */
export function getAuthorizationHeader(storage?: Storage): string | null {
  const token = getLoginToken(storage);
  return token ? `${BEARER_PREFIX}${token}` : null;
}

/**
 * @description 判断当前会话是否持有登录令牌。
 * @param storage 可选存储适配器。
 * @returns 已登录返回 true。
 */
export function hasLoginToken(storage?: Storage): boolean {
  return getLoginToken(storage) !== null;
}

/**
 * @description 清除登录令牌（登出或 401 时调用）；无可用存储时视为已清除。
 * @param storage 可选存储适配器。
 */
export function clearLoginToken(storage?: Storage): void {
  const targetStorage = resolveSessionStorage(storage);
  if (!targetStorage) return;
  removeStorage(LOGIN_TOKEN_STORAGE_KEY, targetStorage);
}
