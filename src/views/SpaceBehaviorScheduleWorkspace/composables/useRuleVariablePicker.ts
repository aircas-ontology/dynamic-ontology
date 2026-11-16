import { onScopeDispose, ref } from "vue";
import { getOntologyCategoryTreeInterface, getOntologyPropertyByOntologyIdInterface, getOntologyEntitiesInterface } from "@/apis";
import type { ApiResponse, OntologyCategoryTreeNode, RuleVariableCatalogObject } from "@/types";

/** @description 校验变量查询响应，失败时保留服务端错误。 @param response 接口响应。 @returns 响应数据。 */
function requireVariableData<Value>(response: ApiResponse<Value>): Value {
  if ((response.code !== 200 && response.code !== 0) || response.success === false || response.data == null)
    throw new Error(response.message || "变量查询失败");
  return response.data;
}

/** @description 读取当前空间对象、属性及实例，阻止重复请求和过期响应回写。 @param getSpaceId 当前空间标识。 @returns 变量选择状态及查询操作。 */
export function useRuleVariablePicker(getSpaceId: () => string) {
  const catalog = ref<RuleVariableCatalogObject[]>([]);
  const instances = ref<{ id: string; label: string }[]>([]);
  const catalogLoading = ref(false);
  const catalogError = ref("");
  const instanceLoading = ref(false);
  const instanceError = ref("");
  let catalogSession = 0;
  let instanceSession = 0;
  let pendingObject = "";

  /** @description 加载空间内真实对象和属性作为变量目录。 @returns 查询结束。 */
  async function fetchVariableCatalog(): Promise<void> {
    if (catalogLoading.value) return;
    const session = ++catalogSession;
    const spaceId = getSpaceId();
    catalog.value = [];
    catalogError.value = "";
    catalogLoading.value = true;
    try {
      if (!Number.isSafeInteger(Number(spaceId)) || Number(spaceId) <= 0) throw new Error("空间标识无效");
      const tree = requireVariableData(await getOntologyCategoryTreeInterface({ spaceId }));
      if (session !== catalogSession) return;
      const objects = new Map<string, string>();
      /** @description 收集分类树内去重后的对象。 @param node 分类树节点。 */
      function collectVariableObjects(node: OntologyCategoryTreeNode): void {
        node.ontologyMetaInfos?.forEach((item) => objects.set(item.uniqueIdentifier, item.displayName || item.apiName));
        node.children?.forEach(collectVariableObjects);
      }
      collectVariableObjects(tree);
      const result: RuleVariableCatalogObject[] = [];
      for (const [id, name] of objects) {
        if (session !== catalogSession) return;
        const properties = requireVariableData(await getOntologyPropertyByOntologyIdInterface({ ontologyUniqueIdentifier: id }));
        result.push({
          id,
          name,
          kind: "object",
          category: "ontology",
          properties: properties.flatMap((property) => {
            if (!property.uniqueIdentifier) return [];
            const propertyType = property.propertyType?.toLowerCase() || "";
            const valueType =
              propertyType === "boolean"
                ? "boolean"
                : /int|float|double|number|decimal/.test(propertyType)
                  ? "number"
                  : propertyType === "object"
                    ? "object"
                    : "string";
            return [{ id: property.uniqueIdentifier, name: property.displayName || property.apiName || property.uniqueIdentifier, valueType }];
          }),
        });
      }
      if (session === catalogSession && getSpaceId() === spaceId) catalog.value = result;
    } catch (cause) {
      if (session === catalogSession) catalogError.value = cause instanceof Error ? cause.message : "变量目录加载失败";
    } finally {
      if (session === catalogSession) catalogLoading.value = false;
    }
  }

  /** @description 分页加载选中对象实例，替换过期对象查询。 @param objectId 对象标识。 @returns 查询结束。 */
  async function fetchVariableInstances(objectId: string): Promise<void> {
    if (instanceLoading.value && pendingObject === objectId) return;
    const session = ++instanceSession;
    pendingObject = objectId;
    instances.value = [];
    instanceError.value = "";
    instanceLoading.value = true;
    try {
      const result = new Map<string, { id: string; label: string }>();
      for (let pageNum = 1; ; pageNum++) {
        const page = requireVariableData(await getOntologyEntitiesInterface({ ontologyUniqueIdentifier: objectId, pageNum, pageSize: 100 }));
        if (session !== instanceSession) return;
        if (!Array.isArray(page.records) || !Number.isSafeInteger(page.total) || page.total < 0) throw new Error("实例分页数据无效");
        for (const record of page.records) {
          const key = record.primaryKey;
          if (typeof key !== "string" && typeof key !== "number") continue;
          result.set(String(key), { id: String(key), label: typeof record.displayName === "string" ? record.displayName : String(key) });
        }
        if (pageNum * 100 >= page.total) break;
        if (!page.records.length) throw new Error("实例分页数据不完整");
      }
      if (session === instanceSession) instances.value = [...result.values()];
    } catch (cause) {
      if (session === instanceSession) instanceError.value = cause instanceof Error ? cause.message : "实例加载失败";
    } finally {
      if (session === instanceSession) instanceLoading.value = false;
    }
  }

  /** @description 关闭选择器或卸载时使所有旧请求失效。 */
  function cancelVariableQueries(): void {
    catalogSession++;
    instanceSession++;
    catalogLoading.value = false;
    instanceLoading.value = false;
    pendingObject = "";
  }
  onScopeDispose(cancelVariableQueries);
  return {
    catalog,
    instances,
    catalogLoading,
    catalogError,
    instanceLoading,
    instanceError,
    fetchVariableCatalog,
    fetchVariableInstances,
    cancelVariableQueries,
  };
}
