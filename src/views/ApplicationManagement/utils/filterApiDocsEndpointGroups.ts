import type { ApiDocsEndpointGroup, ApiDocsEndpointItem } from "@/types";

/**
 * @description 判断接口路径是否模糊匹配关键字（忽略大小写，支持连续包含与子序列）。
 * @param path 接口路径。
 * @param keyword 搜索关键字。
 * @returns 是否命中。
 */
export function matchApiDocsEndpointPath(path: string, keyword: string): boolean {
  const normalizedPath = path.trim().toLowerCase();
  const normalizedKeyword = keyword.trim().toLowerCase();
  if (!normalizedKeyword) {
    return true;
  }
  if (normalizedPath.includes(normalizedKeyword)) {
    return true;
  }
  let searchIndex = 0;
  for (const char of normalizedPath) {
    if (char === normalizedKeyword[searchIndex]) {
      searchIndex += 1;
      if (searchIndex >= normalizedKeyword.length) {
        return true;
      }
    }
  }
  return false;
}

/**
 * @description 提取接口菜单（分组 tag）下拉选项。
 * @param groups 原始分组列表。
 * @returns 菜单选项标签列表。
 */
export function mapApiDocsEndpointMenuOptions(groups: ApiDocsEndpointGroup[]): string[] {
  return groups.map((group) => group.tag);
}

/**
 * @description 按接口菜单与路径关键字过滤分组，去掉空分组。
 * @param groups 原始分组列表。
 * @param menuTag 选中的接口菜单 tag；空表示全部。
 * @param pathKeyword 路径搜索关键字。
 * @returns 过滤后的分组列表。
 */
export function filterApiDocsEndpointGroups(groups: ApiDocsEndpointGroup[], menuTag: string, pathKeyword: string): ApiDocsEndpointGroup[] {
  const normalizedMenu = menuTag.trim();
  const normalizedPathKeyword = pathKeyword.trim();
  const scopedGroups = normalizedMenu ? groups.filter((group) => group.tag === normalizedMenu) : groups;
  if (!normalizedPathKeyword) {
    return scopedGroups;
  }
  const result: ApiDocsEndpointGroup[] = [];
  for (const group of scopedGroups) {
    const endpoints: ApiDocsEndpointItem[] = group.endpoints.filter((item) => matchApiDocsEndpointPath(item.path, normalizedPathKeyword));
    if (endpoints.length > 0) {
      result.push({ tag: group.tag, endpoints });
    }
  }
  return result;
}

/**
 * @description 按接口路径关键字过滤分组，去掉空分组。
 * @param groups 原始分组列表。
 * @param keyword 路径搜索关键字。
 * @returns 过滤后的分组列表。
 */
export function filterApiDocsEndpointGroupsByPath(groups: ApiDocsEndpointGroup[], keyword: string): ApiDocsEndpointGroup[] {
  return filterApiDocsEndpointGroups(groups, "", keyword);
}
