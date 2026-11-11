import { toRaw } from "vue";
import type { BehaviorParameterSnapshot, BehaviorTestEntityRow, TestOntologyActionEntityBinding } from "@/types";

/** @description 递归复制接口 JSON 值，移除嵌套响应式代理。 @param value 接口值。 @returns 独立值。 */
function cloneParameterValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(cloneParameterValue);
  if (value !== null && typeof value === "object") return cloneParameterRecord(value);
  return value;
}

/** @description 复制接口对象的所有字段。 @param value 接口对象。 @returns 独立对象。 */
function cloneParameterRecord(value: object): Record<string, unknown> {
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, cloneParameterValue(item)]));
}

/** @description 复制简单或复合主键。 @param value 主键。 @returns 独立主键。 */
function clonePrimaryKey(value: TestOntologyActionEntityBinding["entityPrimaryKey"]): TestOntologyActionEntityBinding["entityPrimaryKey"] {
  return typeof value === "object" ? cloneParameterRecord(value) : value;
}

/** @description 复制单个参数的实体及数据行绑定。 @param binding 实例绑定。 @returns 独立绑定。 */
function cloneEntityBinding(binding: TestOntologyActionEntityBinding): TestOntologyActionEntityBinding {
  return {
    entityPrimaryKey: clonePrimaryKey(binding.entityPrimaryKey),
    ...(binding.dataPrimaryKeys
      ? { dataPrimaryKeys: Object.fromEntries(Object.entries(binding.dataPrimaryKeys).map(([key, value]) => [key, clonePrimaryKey(value)])) }
      : {}),
  };
}

/** @description 复制实体展示行及原始数据，避免草稿和选项共享引用。 @param row 实体行。 @returns 独立实体行。 */
function cloneEntityRow(row: BehaviorTestEntityRow): BehaviorTestEntityRow {
  return { ...row, raw: structuredClone(toRaw(row.raw)) };
}

/** @description 深拷贝参数配置数据，并清除不会持久化的请求状态。 @param snapshot 参数配置。 @returns 独立配置。 */
export function cloneBehaviorParameterSnapshot(snapshot: BehaviorParameterSnapshot): BehaviorParameterSnapshot {
  return {
    ...snapshot,
    request: {
      ...snapshot.request,
      ...(snapshot.request.params ? { params: cloneParameterRecord(snapshot.request.params) } : {}),
      ...(snapshot.request.inputParams
        ? { inputParams: Object.fromEntries(Object.entries(snapshot.request.inputParams).map(([key, bindings]) => [key, bindings.map(cloneEntityBinding)])) }
        : {}),
      ...(snapshot.request.outputParams
        ? { outputParams: Object.fromEntries(Object.entries(snapshot.request.outputParams).map(([key, binding]) => [key, cloneEntityBinding(binding)])) }
        : {}),
      ...(snapshot.request.entityPrimaryKeys
        ? {
            entityPrimaryKeys: {
              from: snapshot.request.entityPrimaryKeys.from.map(clonePrimaryKey),
              to: snapshot.request.entityPrimaryKeys.to.map(clonePrimaryKey),
            },
          }
        : {}),
    },
    values: { ...snapshot.values },
    inputBindings: Object.fromEntries(
      Object.entries(snapshot.inputBindings).map(([key, records]) => [
        key,
        records.map((record) => ({
          ...record,
          entityPrimaryKey: structuredClone(toRaw(record.entityPrimaryKey)),
          dataPrimaryKey: structuredClone(toRaw(record.dataPrimaryKey)),
        })),
      ]),
    ),
    ontologyPickers: snapshot.ontologyPickers.map((picker) => ({
      ...picker,
      loading: false,
      error: "",
      rows: picker.rows.map(cloneEntityRow),
      selectedRowKeys: [...picker.selectedRowKeys],
      selectedEntities: picker.selectedEntities.map(cloneEntityRow),
    })),
    storagePickers: snapshot.storagePickers.map((picker) => ({
      ...picker,
      entitySlots: picker.entitySlots.map((slot) => ({
        ...slot,
        loading: false,
        error: "",
        entityPrimaryKey: structuredClone(toRaw(slot.entityPrimaryKey)),
        rows: slot.rows.map((row) => ({ ...row, dataPrimaryKey: structuredClone(toRaw(row.dataPrimaryKey)) })),
        selectedDataRow: slot.selectedDataRow ? { ...slot.selectedDataRow, dataPrimaryKey: structuredClone(toRaw(slot.selectedDataRow.dataPrimaryKey)) } : null,
      })),
    })),
    fromEntities: snapshot.fromEntities.map(cloneEntityRow),
    toEntities: snapshot.toEntities.map(cloneEntityRow),
  };
}
