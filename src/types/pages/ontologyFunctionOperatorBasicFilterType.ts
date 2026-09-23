/** 空间函数算子基础过滤表达式类型 */

export const BASIC_FILTER_LOGIC_OPTIONS = [
  { value: "AND", label: "AND（并且）" },
  { value: "OR", label: "OR（或者）" },
] as const;

export type BasicFilterLogic = (typeof BASIC_FILTER_LOGIC_OPTIONS)[number]["value"];

export const BASIC_FILTER_OP_OPTIONS = [
  { value: "EQ", label: "等于 EQ" },
  { value: "NEQ", label: "不等于 NEQ" },
  { value: "GT", label: "大于 GT" },
  { value: "GTE", label: "大于等于 GTE" },
  { value: "LT", label: "小于 LT" },
  { value: "LTE", label: "小于等于 LTE" },
  { value: "CONTAINS", label: "包含 CONTAINS" },
  { value: "IS_NULL", label: "为空 IS_NULL" },
  { value: "IS_NOT_NULL", label: "非空 IS_NOT_NULL" },
  { value: "BETWEEN", label: "区间 BETWEEN" },
] as const;

export type BasicFilterOp = (typeof BASIC_FILTER_OP_OPTIONS)[number]["value"];

export const BASIC_FILTER_VALUE_TYPE_OPTIONS = [
  { value: "string", label: "字符串" },
  { value: "number", label: "数字" },
  { value: "boolean", label: "布尔" },
] as const;

export type BasicFilterValueType = (typeof BASIC_FILTER_VALUE_TYPE_OPTIONS)[number]["value"];

export type BasicFilterValue = string | number | boolean;

export interface BasicFilterCondition {
  op: BasicFilterOp;
  propertyApiName: string;
  valueType: BasicFilterValueType;
  value?: BasicFilterValue;
  values?: BasicFilterValue[];
}

export interface BasicFilterGroup {
  logic: BasicFilterLogic;
  children: BasicFilterNode[];
}

export interface BasicFilterNode {
  type: "FILTER" | "GROUP";
  filter?: BasicFilterCondition;
  group?: BasicFilterGroup;
}

export type BasicFilterDocument = BasicFilterGroup;
