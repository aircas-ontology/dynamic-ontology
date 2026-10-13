import type { RouteLocationNormalized, Router } from "vue-router";

import type { LoginParams } from "@/types";
import { postLoginInterface } from "../apis/loginApi.ts";
import { EMBEDDED_MODE_QUERY_KEY } from "./embeddedModeGuard.ts";
import { getStorage, removeStorage, setStorage, StorageError } from "../utils/storage.ts";
import { hasLoginToken } from "../utils/authToken.ts";

/** 嵌入式自动登录固定密码。 */
export const EMBEDDED_AUTOLOGIN_PASSWORD = "a123456";

/** 记录当前嵌入登录令牌归属用户的会话存储键。 */
export const EMBEDDED_USER_STORAGE_KEY = "ontology-embedded-user";

/** 守卫判断所需的最小路由结构。 */
type GuardRouteLocation = Pick<RouteLocationNormalized, "path" | "query" | "matched">;

/** 自动登录决策结果。 */
export interface AutoLoginDecision {
  needsLogin: boolean;
  userName?: string;
}

/** 注入守卫的外部依赖，便于测试替换。 */
export interface EmbeddedAutoLoginDeps {
  login: (params: LoginParams) => Promise<unknown>;
  getStoredUser: () => string | null;
  setStoredUser: (userName: string) => void;
  clearStoredUser: () => void;
  hasToken: () => boolean;
}

/**
 * @description 校验存储值是否为非空白字符串。
 * @param value 从存储读取的未知值。
 * @returns 是否为可用用户名字符串。
 */
function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * @description 从 sessionStorage 读取嵌入登录用户名。
 * @returns 已存储的用户名；不存在或损坏时为 null。
 */
export function readStoredUser(): string | null {
  if (typeof window === "undefined" || !window.sessionStorage) return null;
  try {
    return getStorage(EMBEDDED_USER_STORAGE_KEY, isNonEmptyString, window.sessionStorage);
  } catch (error: unknown) {
    if (error instanceof StorageError) {
      removeStorage(EMBEDDED_USER_STORAGE_KEY, window.sessionStorage);
      return null;
    }
    throw error;
  }
}

/**
 * @description 将嵌入登录用户名写入 sessionStorage。
 * @param userName 嵌入模式传入的用户名。
 */
export function writeStoredUser(userName: string): void {
  if (typeof window === "undefined" || !window.sessionStorage) return;
  setStorage(EMBEDDED_USER_STORAGE_KEY, userName, window.sessionStorage);
}

/**
 * @description 清除嵌入登录用户名记录。
 */
export function clearStoredUser(): void {
  if (typeof window === "undefined" || !window.sessionStorage) return;
  removeStorage(EMBEDDED_USER_STORAGE_KEY, window.sessionStorage);
}

/** 默认依赖：绑定真实登录接口、会话存储与令牌检查。 */
const defaultDeps: EmbeddedAutoLoginDeps = {
  login: postLoginInterface,
  getStoredUser: readStoredUser,
  setStoredUser: writeStoredUser,
  clearStoredUser: clearStoredUser,
  hasToken: hasLoginToken,
};

/**
 * @description 计算嵌入模式自动登录决策：无 userName 参数时放行；已以同一用户登录且令牌有效时放行；否则需要登录。
 * @param query 目标路由的查询参数。
 * @param currentStoredUser 当前已记录的嵌入登录用户名（无记录时为 null）。
 * @param hasToken 当前会话是否持有有效令牌。
 * @returns 需要登录时返回用户名，否则返回放行。
 */
export function resolveAutoLoginDecision(query: Record<string, unknown>, currentStoredUser: string | null, hasToken: boolean): AutoLoginDecision {
  const raw = query[EMBEDDED_MODE_QUERY_KEY];
  if (typeof raw !== "string" || raw.trim().length === 0) {
    return { needsLogin: false };
  }
  const userName = raw.trim();
  if (currentStoredUser === userName && hasToken) {
    return { needsLogin: false };
  }
  return { needsLogin: true, userName };
}

/**
 * @description 在路由实例上注册嵌入模式自动登录守卫，并返回注销函数。须在鉴权守卫之前注册，使嵌入令牌在鉴权前就绪。
 * @param router Vue Router 实例（仅依赖 beforeEach 注册能力）。
 * @param deps 可选依赖注入，默认绑定真实登录接口与会话存储。
 * @returns 注销已注册守卫的函数。
 */
export function registerEmbeddedAutoLoginGuard(router: Pick<Router, "beforeEach">, deps: EmbeddedAutoLoginDeps = defaultDeps): () => void {
  return router.beforeEach(async (to: GuardRouteLocation) => {
    const decision = resolveAutoLoginDecision(to.query ?? {}, deps.getStoredUser(), deps.hasToken());
    if (!decision.needsLogin || !decision.userName) {
      return;
    }
    try {
      await deps.login({ username: decision.userName, password: EMBEDDED_AUTOLOGIN_PASSWORD });
      deps.setStoredUser(decision.userName);
    } catch {
      deps.clearStoredUser();
    }
  });
}
