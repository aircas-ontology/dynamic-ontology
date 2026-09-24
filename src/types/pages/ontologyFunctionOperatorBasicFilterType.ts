/** 空间函数算子基础过滤表达式类型 */

export const BASIC_FILTER_LOGIC_OPTIONS = [
  { value: "AND", label: "AND（并且）" },
  { value: "OR", label: "OR（或者）" },
] as const;

export type BasicFilterLogic = (typeof BASIC_FILTER_LOGIC_OPTIONS)[number]["value"];

export const BASIC_FILTER_OP_OPTIONS = [
  { value: "EQ", label: "等于 EQ" },
  { value: "NE", label: "不等于 NE" },
  { value: "LIKE", label: "全模糊 LIKE" },
  { value: "LIKE_LEFT", label: "左模糊 LIKE_LEFT" },
  { value: "LIKE_RIGHT", label: "右模糊 LIKE_RIGHT" },
  { value: "IN", label: "包含 IN" },
  { value: "NOT_IN", label: "不包含 NOT_IN" },
  { value: "BETWEEN", label: "区间内 BETWEEN" },
  { value: "NOT_BETWEEN", label: "区间外 NOT_BETWEEN" },
  { value: "GT", label: "大于 GT" },
  { value: "GE", label: "大于等于 GE" },
  { value: "LT", label: "小于 LT" },
  { value: "LE", label: "小于等于 LE" },
  { value: "IS_NULL", label: "为空 IS_NULL" },
  { value: "IS_NOT_NULL", label: "不为空 IS_NOT_NULL" },
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
