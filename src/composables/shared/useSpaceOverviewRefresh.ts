import { inject, type InjectionKey } from "vue";

/** 空间概览统计刷新选项。 */
export interface SpaceOverviewRefreshOptions {
  /** 为 true 时保留当前展示数值，避免刷新过程闪空。 */
  keepPrevious?: boolean;
}

/** 空间管理布局提供的概览统计刷新函数。 */
export type SpaceOverviewRefreshFn = (options?: SpaceOverviewRefreshOptions) => void | Promise<void>;

/** 空间概览统计刷新注入键。 */
export const SPACE_OVERVIEW_REFRESH_KEY: InjectionKey<SpaceOverviewRefreshFn> = Symbol("spaceOverviewRefresh");

/**
 * @description 读取布局层注入的空间概览统计刷新函数；布局外使用时返回空。
 * @returns 刷新函数；未提供时为 undefined。
 */
export function useSpaceOverviewRefresh(): SpaceOverviewRefreshFn | undefined {
  return inject(SPACE_OVERVIEW_REFRESH_KEY, undefined);
}
