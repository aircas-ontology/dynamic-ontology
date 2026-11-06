import { validateApiName } from "../../../utils/validateApiName.ts";
import { findInvalidConceptualAttribute } from "./validateConceptualAttributes.ts";

interface CanvasAttribute {
  id: number;
  displayName: string;
  apiName: string;
  dataType: string;
  storageGroup: string;
  defaultValue: string;
  isPrimary: boolean;
  isNameKey: boolean;
}
interface CanvasObject {
  id: number;
  displayName: string;
  apiName: string;
  description: string;
  attributes: CanvasAttribute[];
}
interface CanvasRelation {
  id: number;
  displayName: string;
  apiName: string;
  description: string;
  sourceId: number | null;
  targetId: number | null;
}
export interface CanvasValidationError {
  kind: "object" | "attribute" | "relation";
  id: number;
  field: string;
  message: string;
}

/**
 * @description 校验画布对象、属性和关系并返回首个错误。
 * @param objects 画布对象。
 * @param relations 画布关系。
 * @returns 首个错误及定位信息，全部合法时返回 null。
 */
export function findInvalidCanvasModel(objects: CanvasObject[], relations: CanvasRelation[]): CanvasValidationError | null {
  const objectNames = new Set<string>();
  const ids = new Set(objects.map((object) => object.id));
  for (const object of objects) {
    const name = object.apiName.trim();
    const objectError: [string, string] | null = !object.displayName.trim()
      ? ["displayName", "请输入显示名称"]
      : !name
        ? ["apiName", "请输入 API 名称"]
        : !validateApiName(name)
          ? ["apiName", "API 名称须以字母或下划线开头，且只能包含字母、数字和下划线"]
          : name.length > 64
            ? ["apiName", "API 名称不能超过 64 字符"]
            : object.displayName.length > 64
              ? ["displayName", "显示名称不能超过 64 字符"]
              : object.description.length > 300
                ? ["description", "描述不能超过 300 字符"]
                : objectNames.has(name)
                  ? ["apiName", "对象 API 名称重复"]
                  : null;
    if (objectError) return { kind: "object", id: object.id, field: objectError[0], message: objectError[1] };
    objectNames.add(name);
    const attributeNames = new Set<string>();
    for (const attribute of object.attributes) {
      const apiName = attribute.apiName.trim();
      if (apiName && !validateApiName(apiName))
        return { kind: "attribute", id: attribute.id, field: "apiName", message: "API 名称须以字母或下划线开头，且只能包含字母、数字和下划线" };
      if (apiName && attributeNames.has(apiName)) return { kind: "attribute", id: attribute.id, field: "apiName", message: "当前对象的属性 API 名称重复" };
      attributeNames.add(apiName);
    }
    const invalid = findInvalidConceptualAttribute([object]);
    if (invalid) return { kind: "attribute", id: invalid.attributeId, field: invalid.field, message: invalid.message };
  }
  const relationNames = new Set<string>();
  for (const relation of relations) {
    const name = relation.apiName.trim();
    const error: [string, string] | null = !relation.displayName.trim()
      ? ["displayName", "请输入关系名称"]
      : !name
        ? ["apiName", "请输入 API 名称"]
        : !validateApiName(name)
          ? ["apiName", "API 名称须以字母或下划线开头，且只能包含字母、数字和下划线"]
          : name.length > 64
            ? ["apiName", "API 名称不能超过 64 字符"]
            : relation.displayName.length > 64
              ? ["displayName", "关系名称不能超过 64 字符"]
              : relation.description.length > 300
                ? ["description", "描述不能超过 300 字符"]
                : relationNames.has(name)
                  ? ["apiName", "关系 API 名称重复"]
                  : relation.sourceId === null || !ids.has(relation.sourceId)
                    ? ["sourceId", "请选择有效的源对象"]
                    : relation.targetId === null || !ids.has(relation.targetId)
                      ? ["targetId", "请选择有效的目标对象"]
                      : relation.sourceId === relation.targetId
                        ? ["targetId", "源对象和目标对象不能相同"]
                        : null;
    if (error) return { kind: "relation", id: relation.id, field: error[0], message: error[1] };
    relationNames.add(name);
  }
  return null;
}
