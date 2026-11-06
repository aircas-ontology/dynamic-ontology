import type { GetOntologyPropertyDetailByOntologyIdData } from "@/types";

/**
 * @description 创建按对象缓存的属性绑定查询，同一对象的并发查询共享请求，失败可重试。
 * @param loadDetails 查询对象属性详情。
 * @returns 判断指定属性是否绑定数据源的异步函数。
 */
export function createCanvasAttributeBindingLookup(loadDetails: (objectId: string) => Promise<GetOntologyPropertyDetailByOntologyIdData>) {
  const cache = new Map<string, Promise<GetOntologyPropertyDetailByOntologyIdData>>();
  return async (objectId: string, propertyId: string): Promise<boolean> => {
    let pending = cache.get(objectId);
    if (!pending) {
      pending = loadDetails(objectId);
      cache.set(objectId, pending);
      pending.catch(() => {
        if (cache.get(objectId) === pending) cache.delete(objectId);
      });
    }
    const details = await pending;
    const detail = details.find((item) => item.uniqueIdentifier === propertyId);
    if (!detail) {
      cache.delete(objectId);
      throw new Error("属性详情不存在，请重试");
    }
    return Boolean(detail.datasourceId?.trim() && detail.datasourceColumnName?.trim());
  };
}
