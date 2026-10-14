import type { RouteLocationNormalized, RouteLocationRaw, Router } from "vue-router";

/** 嵌入模式查询参数键名，与布局层 `isEmbedded` 判断保持一致。 */
export const EMBEDDED_MODE_QUERY_KEY = "userName";

/** 布局路由名称：嵌入模式参数仅在该布局的子路由间透传。 */
export const WORKSPACE_LAYOUT_ROUTE_NAME = "Workspace";

/** 守卫判断所需的最小路由结构。 */
type GuardRouteLocation = Pick<RouteLocationNormalized, "path" | "query" | "hash" | "matched">;

/**
 * @description 计算嵌入模式参数透传结果：目标已携带参数时放行；来源路由携带参数且目标属于 Workspace 布局时，返回合并参数后的重定向位置，使嵌入状态在站内跳转与刷新间持续生效。
 * @param to 即将进入的路由。
 * @param from 当前离开的路由。
 * @returns 重定向目标；放行时返回 undefined。
 */
export function resolveEmbeddedPropagation(to: GuardRouteLocation, from: GuardRouteLocation): RouteLocationRaw | undefined {
  if (to.query[EMBEDDED_MODE_QUERY_KEY]) {
    return undefined;
  }
  const carriedValue = from.query[EMBEDDED_MODE_QUERY_KEY];
  if (typeof carriedValue !== "string" || carriedValue.length === 0) {
    return undefined;
  }
  const isWithinWorkspaceLayout = to.matched.some((record) => record.name === WORKSPACE_LAYOUT_ROUTE_NAME);
  if (!isWithinWorkspaceLayout) {
    return undefined;
  }
  return {
    path: to.path,
    query: { ...to.query, [EMBEDDED_MODE_QUERY_KEY]: carriedValue },
    hash: to.hash,
  };
}

/**
 * @description 在路由实例上注册嵌入模式参数透传守卫，并返回该守卫的注销函数；须在鉴权守卫之后注册，保证登录重定向优先。
 * @param router Vue Router 实例（仅依赖 beforeEach 注册能力）。
 * @returns 注销已注册守卫的函数。
 */
export function registerEmbeddedModeGuard(router: Pick<Router, "beforeEach">): () => void {
  return router.beforeEach((to, from) => resolveEmbeddedPropagation(to, from));
}
