import { validateAttributeDefaultValue } from "../../../utils/validateAttributeDefaultValue.ts";

interface AttributeForValidation {
  id: number;
  displayName: string;
  apiName: string;
  dataType: string;
  storageGroup: string;
  defaultValue: string;
  isPrimary: boolean;
  isNameKey: boolean;
}

interface ObjectForValidation {
  displayName: string;
  attributes: AttributeForValidation[];
}

/**
 * @description 找出画布中第一个不满足属性规则的字段，供保存前定位。
 * @param objects 画布对象及属性。
 * @returns 首个无效属性及提示，没有错误时为 null。
 */
export function findInvalidConceptualAttribute(objects: ObjectForValidation[]): { attributeId: number; field: string; message: string } | null {
  const types = ["Boolean", "Int", "Long", "Float", "Short", "Byte", "Double", "Decimal", "String", "Date", "Array", "Timestamp"];
  for (const object of objects) {
    let primaryCount = 0;
    let nameCount = 0;
    for (const attribute of object.attributes) {
      if (attribute.isPrimary) primaryCount++;
      if (attribute.isNameKey) nameCount++;
      const error = !attribute.displayName.trim()
        ? "请输入属性名称"
        : !attribute.apiName.trim()
          ? "请输入 API 名称"
          : !types.includes(attribute.dataType)
            ? "请选择数据类型"
            : !/^[A-Za-z0-9_]+$/.test(attribute.storageGroup)
              ? "存储分组只能包含字母、数字和下划线"
              : primaryCount > 1
                ? "每个对象只能有一个主键"
                : nameCount > 1
                  ? "每个对象只能有一个名称键"
                  : attribute.isPrimary && (attribute.apiName !== "id" || attribute.dataType !== "Int")
                    ? "主键的 API 必须为 id，数据类型必须为 Int"
                    : validateAttributeDefaultValue(attribute.dataType, attribute.defaultValue);
      if (error) {
        const field = !attribute.displayName.trim()
          ? "displayName"
          : !attribute.apiName.trim()
            ? "apiName"
            : !types.includes(attribute.dataType)
              ? "dataType"
              : !/^[A-Za-z0-9_]+$/.test(attribute.storageGroup)
                ? "storageGroup"
                : "defaultValue";
        return { attributeId: attribute.id, field, message: `对象“${object.displayName}”的属性“${attribute.displayName || attribute.apiName}”：${error}` };
      }
    }
  }
  return null;
}
