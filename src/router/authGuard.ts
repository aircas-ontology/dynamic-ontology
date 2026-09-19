import type { RouteLocationNormalized, RouteLocationRaw, Router } from "vue-router";

import { hasLoginToken } from "../utils/authToken.ts";

/** 登录路由名称。 */
export const LOGIN_ROUTE_NAME = "Login";

/** 登录成功后的业务首页路由名称。 */
export const AUTH_HOME_ROUTE_NAME = "OntologySpaceManagement";

/** 守卫判断所需的最小路由结构。 */
type GuardRouteLocation = Pick<RouteLocationNormalized, "name">;

/**
 * @description 根据登录态计算鉴权重定向，避免重定向循环：未登录仅放行登录页，已登录不再回到登录页。
 * @param to 即将进入的路由（守卫只依赖其 name）。
 * @param hasToken 当前会话是否持有登录令牌。
 * @returns 重定向目标；放行时返回 undefined。
 */
export function resolveAuthRedirect(to: GuardRouteLocation, hasToken: boolean): RouteLocationRaw | undefined {
  if (!hasToken && to.name !== LOGIN_ROUTE_NAME) {
    return { name: LOGIN_ROUTE_NAME };
  }
  if (hasToken && to.name === LOGIN_ROUTE_NAME) {
    return { name: AUTH_HOME_ROUTE_NAME };
  }
  return undefined;
}

/**
 * @description 在路由实例上注册全局前置鉴权守卫，并返回该守卫的注销函数。
 * @param router Vue Router 实例（仅依赖 beforeEach 注册能力）。
 * @returns 注销已注册守卫的函数。
 */
export function registerAuthGuard(router: Pick<Router, "beforeEach">): () => void {
  return router.beforeEach((to) => resolveAuthRedirect(to, hasLoginToken()));
}
