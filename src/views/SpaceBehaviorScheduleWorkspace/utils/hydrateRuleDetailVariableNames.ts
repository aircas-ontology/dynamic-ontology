import type { getOntologyCategoryTreeInterface, getOntologyEntitiesInterface, getOntologyPropertyByOntologyIdInterface } from "@/apis";
import type { OntologyCategoryTreeNode, RuleConditionNode, RuleVariableValue, ScheduleRuleDetailGroup } from "@/types";

/** @description 加载详情中实际引用的对象、属性和实例显示名称，错误时保留标识且阻止过期会话写入。 @param groups 独立规则画布。 @param spaceId 当前空间。 @param services 查询接口。 @param isCurrent 会话是否有效。 @returns 可展示的降级提示。 */
export async function hydrateRuleDetailVariableNames(
  groups: ScheduleRuleDetailGroup[],
  spaceId: string,
  services: {
    getOntologyCategoryTreeInterface: typeof getOntologyCategoryTreeInterface;
    getOntologyPropertyByOntologyIdInterface: typeof getOntologyPropertyByOntologyIdInterface;
    getOntologyEntitiesInterface: typeof getOntologyEntitiesInterface;
  },
  isCurrent: () => boolean,
): Promise<string> {
  const variables: RuleVariableValue[] = [];
  /** @description 收集分组条件中所有变量。 @param condition 条件节点。 */
  function collectVariables(condition: RuleConditionNode): void {
    if (condition.type === "composite") condition.children.forEach(collectVariables);
    else for (const value of [condition.left, condition.right]) if (value.kind === "variable") variables.push(value);
  }
  for (const group of groups) for (const step of group.flow.steps) if (step.kind === "branch") collectVariables(step.condition);
  if (!variables.length) return "";
  const names = new Map<string, string>();
  let failed = false;
  try {
    const response = await services.getOntologyCategoryTreeInterface({ spaceId });
    if ((response.code !== 200 && response.code !== 0) || response.success === false || !response.data) throw new Error("对象查询失败");
    /** @description 收集对象分类树中的显示名称。 @param node 分类节点。 */
    function collectObjects(node: OntologyCategoryTreeNode): void {
      node.ontologyMetaInfos?.forEach((item) => names.set(item.uniqueIdentifier, item.displayName || item.apiName));
      node.children?.forEach(collectObjects);
    }
    collectObjects(response.data);
  } catch {
    failed = true;
  }
  if (!isCurrent()) return "";
  const objects = [...new Set(variables.map((value) => value.objectId))];
  for (const objectId of objects) {
    const selected = variables.filter((value) => value.objectId === objectId);
    const objectName = names.get(objectId);
    if (!objectName) failed = true;
    else for (const value of selected) value.objectName = objectName;
    try {
      const response = await services.getOntologyPropertyByOntologyIdInterface({ ontologyUniqueIdentifier: objectId });
      if ((response.code !== 200 && response.code !== 0) || response.success === false || !Array.isArray(response.data)) throw new Error("属性查询失败");
      if (!isCurrent()) return "";
      for (const value of selected) {
        const property = response.data.find(
          (item) => (value.propertyId && item.uniqueIdentifier === value.propertyId) || (!value.propertyId && item.apiName === value.propertyName),
        );
        if (property) value.propertyName = property.displayName || property.apiName || value.propertyName;
        else failed = true;
      }
    } catch {
      failed = true;
    }
    if (!isCurrent()) return "";
    try {
      const instanceNames = new Map<string, string>();
      const wanted = new Set(selected.flatMap((value) => value.instanceIds));
      for (let pageNum = 1; wanted.size; pageNum++) {
        const response = await services.getOntologyEntitiesInterface({ ontologyUniqueIdentifier: objectId, pageNum, pageSize: 100 });
        if (
          (response.code !== 200 && response.code !== 0) ||
          response.success === false ||
          !response.data ||
          !Array.isArray(response.data.records) ||
          !Number.isSafeInteger(response.data.total)
        )
          throw new Error("实例查询失败");
        if (!isCurrent()) return "";
        for (const row of response.data.records) {
          if (typeof row.primaryKey !== "number" && typeof row.primaryKey !== "string") continue;
          const key = String(row.primaryKey);
          if (wanted.has(key)) {
            instanceNames.set(key, typeof row.displayName === "string" && row.displayName ? row.displayName : key);
            wanted.delete(key);
          }
        }
        if (pageNum * 100 >= response.data.total) break;
        if (!response.data.records.length) throw new Error("实例分页无效");
      }
      for (const value of selected) value.instanceNames = value.instanceIds.map((id) => instanceNames.get(id) || id);
      if (wanted.size) failed = true;
    } catch {
      failed = true;
    }
    if (!isCurrent()) return "";
  }
  return failed ? "部分对象、属性或实例名称加载失败，已显示标识" : "";
}
