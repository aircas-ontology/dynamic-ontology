import type {
  BehaviorScheduleDraft,
  CreateRuleBehaviorScheduleParams,
  RuleCompareOperator,
  RuleCompositeCondition,
  RuleConditionMonitorType,
  RuleFlowStep,
  RuleFlowThenAction,
  RuleValueNode,
  ScheduleBehaviorOption,
  ScheduleRuleActionParam,
  ScheduleRuleDetailGroup,
  ScheduleRuleCompareOperator,
  ScheduleRuleJudgeGroup,
  ScheduleRuleJudgeItem,
  ScheduleRuleOperand,
} from "@/types";
import { needsRuleVariableDataRow } from "./needsRuleVariableDataRow.ts";

const compareOperators: Partial<Record<RuleCompareOperator, ScheduleRuleCompareOperator>> = {
  eq: "EQ",
  neq: "NE",
  gt: "GT",
  gte: "GE",
  lt: "LT",
  lte: "LE",
  contains: "CONTAINS",
  notContains: "NOT_CONTAINS",
};

/** @description 将固定值和单实例变量转换为接口操作数，不推测函数及表达式协议。 @param value 画布值。 @returns 操作数。 */
function buildRuleOperand(value: RuleValueNode): ScheduleRuleOperand {
  if (value.kind === "input") {
    if (!value.text.trim()) throw new Error("请填写条件固定值");
    return { type: "fixed", fixValue: value.text };
  }
  if (value.kind !== "variable") throw new Error("当前接口尚未约定函数或表达式的传参方式");
  if (!value.objectId || !value.propertyId || value.instanceIds.length !== 1 || !value.instanceIds[0]?.trim())
    throw new Error("条件变量必须选择对象、属性和一个具体实例");
  if (needsRuleVariableDataRow(value.storageGroup)) {
    if (value.dataPrimaryKey === undefined || value.dataPrimaryKey === null || value.dataPrimaryKey === "") throw new Error("条件变量的子表属性必须选择数据行");
    return {
      type: "dynamic",
      OntologyId: value.objectId,
      entityId: value.instanceIds[0],
      propertyId: value.propertyId,
      dataPrimaryKey: value.dataPrimaryKey,
    };
  }
  return { type: "dynamic", OntologyId: value.objectId, entityId: value.instanceIds[0], propertyId: value.propertyId };
}

/**
 * @description 判断条件项是否为监测形态（无比较符与右操作数）。
 * @param item 条件项。
 * @returns 是否为监测项。
 */
function isMonitorJudgeItem(item: ScheduleRuleJudgeItem): boolean {
  return item.condition === undefined && item.rightOperate === undefined;
}

/**
 * @description 收集条件树中的属性比较与监测事件类型。
 * @param condition 条件节点。
 * @param fallback 祖先组级监测类型。
 * @returns 是否含比较及监测类型集合。
 */
function collectConditionKinds(
  condition: RuleCompositeCondition["children"][number] | RuleCompositeCondition,
  fallback?: RuleConditionMonitorType,
): { hasCompare: boolean; monitorTypes: Set<RuleConditionMonitorType> } {
  if (condition.type === "composite") {
    const monitorTypes = new Set<RuleConditionMonitorType>();
    let hasCompare = false;
    const nextFallback = condition.monitorType ?? fallback;
    for (const child of condition.children) {
      const part = collectConditionKinds(child, nextFallback);
      hasCompare = hasCompare || part.hasCompare;
      part.monitorTypes.forEach((item) => monitorTypes.add(item));
    }
    return { hasCompare, monitorTypes };
  }
  if (condition.type === "monitor") {
    const monitorType = condition.monitorType ?? fallback;
    if (!monitorType) throw new Error("请选择条件变更类型");
    return { hasCompare: false, monitorTypes: new Set([monitorType]) };
  }
  return { hasCompare: true, monitorTypes: new Set() };
}

/**
 * @description 递归展开条件组合；监测形态只输出对象与存储分组。
 * @param condition 条件组合。
 * @param nested 是否为子分组。
 * @param writeItemMonitorType 是否在条件项上写 monitorType。
 * @param fallback 祖先组级监测类型。
 * @returns 判断项。
 */
function buildRuleJudgeItems(
  condition: RuleCompositeCondition,
  nested = false,
  writeItemMonitorType = false,
  fallback?: RuleConditionMonitorType,
): ScheduleRuleJudgeItem[] {
  if (!condition.children.length) throw new Error("请至少配置一个判断条件");
  const items: ScheduleRuleJudgeItem[] = [];
  const nextFallback = condition.monitorType ?? fallback;
  for (const child of condition.children) {
    let childItems: ScheduleRuleJudgeItem[];
    if (child.type === "composite") childItems = buildRuleJudgeItems(child, true, writeItemMonitorType, nextFallback);
    else if (child.type === "monitor") {
      const monitorType = child.monitorType ?? nextFallback;
      if (!monitorType) throw new Error("请选择条件变更类型");
      if (!child.objectId.trim()) throw new Error("请选择监测对象");
      const storageGroup = child.storageGroup.trim() || "main";
      childItems = [
        {
          leftOperate: { type: "dynamic", OntologyId: child.objectId.trim(), storageGroup },
          ...(writeItemMonitorType ? { monitorType } : {}),
        },
      ];
    } else {
      const operator = compareOperators[child.operator];
      if (!operator) throw new Error("前置包含操作符已移除，请重新选择条件操作符");
      childItems = [{ leftOperate: buildRuleOperand(child.left), rightOperate: buildRuleOperand(child.right), condition: operator }];
    }
    const previous = items.at(-1);
    if (previous) previous.linkFlag = condition.logic === "and" ? "AND" : "OR";
    items.push(...childItems);
  }
  if (nested) {
    const first = items[0];
    const last = items.at(-1);
    if (first && last) {
      first.isLeft = (first.isLeft ?? 0) + 1;
      last.isRight = (last.isRight ?? 0) + 1;
    }
  }
  return items;
}

/**
 * @description 按条件树解析组级监测类型并生成判断项。
 * @param condition 根组合条件。
 * @returns 判断项与可选组级监测类型。
 */
function buildBranchJudgeParams(condition: RuleCompositeCondition): {
  items: ScheduleRuleJudgeItem[];
  monitorType?: RuleConditionMonitorType;
  isMonitor: boolean;
} {
  const kinds = collectConditionKinds(condition, condition.monitorType);
  if (kinds.hasCompare && kinds.monitorTypes.size) throw new Error("同一规则组不能混合属性比较与新增/删除监测条件");
  if (!kinds.hasCompare && !kinds.monitorTypes.size) throw new Error("请至少配置一个判断条件");
  if (kinds.hasCompare) return { items: buildRuleJudgeItems(condition, false, false), isMonitor: false };
  const uniform = kinds.monitorTypes.size === 1 ? [...kinds.monitorTypes][0] : undefined;
  const writeItemMonitorType = !uniform;
  return {
    items: buildRuleJudgeItems(condition, false, writeItemMonitorType, condition.monitorType),
    monitorType: uniform,
    isMonitor: true,
  };
}

/** 路径中的一层判断，inverted 表示进入该分支的不成立路径。 */
interface RulePathPredicate {
  items: ScheduleRuleJudgeItem[];
  inverted: boolean;
  isMonitor: boolean;
  monitorType?: RuleConditionMonitorType;
}

const inverseOperators: Record<ScheduleRuleCompareOperator, ScheduleRuleCompareOperator> = {
  EQ: "NE",
  NE: "EQ",
  GT: "LE",
  LE: "GT",
  GE: "LT",
  LT: "GE",
  CONTAINS: "NOT_CONTAINS",
  NOT_CONTAINS: "CONTAINS",
};

/**
 * @description 合并路径约束；监测项取反只翻转连接符，属性比较按德摩根下推操作符。
 * @param path 从根到行为的约束。
 * @returns 接口判断条件与组级监测类型。
 */
function buildPathJudgeParams(path: RulePathPredicate[]): {
  judgeParams: ScheduleRuleJudgeItem[];
  inverted: boolean;
  monitorType?: RuleConditionMonitorType;
} {
  const single = path[0];
  if (!single) throw new Error("规则画布需要配置条件分支或 switch 分支");
  const hasMonitor = path.some((item) => item.isMonitor);
  const hasCompare = path.some((item) => !item.isMonitor);
  if (hasMonitor && hasCompare) throw new Error("同一规则路径不能混合属性比较与新增/删除监测条件");
  const monitorTypes = [...new Set(path.map((item) => item.monitorType).filter((item): item is RuleConditionMonitorType => Boolean(item)))];
  const monitorType =
    hasMonitor && monitorTypes.length === 1 && path.every((item) => !item.isMonitor || item.monitorType === monitorTypes[0]) ? monitorTypes[0] : undefined;
  if (path.length === 1) return { judgeParams: single.items.map((item) => ({ ...item })), inverted: single.inverted, monitorType };
  const judgeParams: ScheduleRuleJudgeItem[] = [];
  for (const predicate of path) {
    const items = predicate.items.map((item): ScheduleRuleJudgeItem => {
      if (isMonitorJudgeItem(item)) {
        return {
          ...item,
          ...(item.linkFlag ? { linkFlag: predicate.inverted ? (item.linkFlag === "AND" ? "OR" : "AND") : item.linkFlag } : {}),
        };
      }
      if (!item.condition) throw new Error("请至少配置一个判断条件");
      return {
        ...item,
        condition: predicate.inverted ? inverseOperators[item.condition] : item.condition,
        ...(item.linkFlag ? { linkFlag: predicate.inverted ? (item.linkFlag === "AND" ? "OR" : "AND") : item.linkFlag } : {}),
      };
    });
    const first = items[0];
    const last = items.at(-1);
    if (!first || !last) throw new Error("请至少配置一个判断条件");
    first.isLeft = (first.isLeft ?? 0) + 1;
    last.isRight = (last.isRight ?? 0) + 1;
    const previous = judgeParams.at(-1);
    if (previous) previous.linkFlag = "AND";
    judgeParams.push(...items);
  }
  return { judgeParams, inverted: false, monitorType };
}

/** @description 验证保存的行为请求为普通对象。 @param value 外部请求。 @returns 是否为参数对象。 */
function isActionRequest(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
/** @description 优先使用已确认的新快照或行为树请求，否则恢复未编辑行为的原始请求，不拼接临时表单状态。 @param action 行为节点。 @param savedDetails 历史请求映射。 @returns 完整执行请求。 */
function readRuleActionRequest(action: RuleFlowThenAction, savedDetails: Readonly<ScheduleRuleDetailGroup["actionDetails"]>): Record<string, unknown> {
  const saved = savedDetails[action.id];
  const request: unknown = action.treeParameters ?? action.behaviorParameters?.request ?? (saved ? JSON.parse(saved.entityJson) : null);
  if (!isActionRequest(request)) throw new Error("请双击行为节点选择当前空间行为并确认行为参数");
  return request;
}

/** @description 递归生成每个行为的完整路径规则；独立规则不承诺行为执行顺序。 @param steps 当前区域步骤。 @param path 祖先路径条件。 @param options 空间行为。 @param spaceId 当前空间。 @param savedDetails 未编辑节点的原始请求。 @returns 执行规则列表。 */
function buildRulePathGroups(
  steps: RuleFlowStep[],
  path: RulePathPredicate[],
  options: readonly ScheduleBehaviorOption[],
  spaceId: string,
  savedDetails: Readonly<ScheduleRuleDetailGroup["actionDetails"]>,
): ScheduleRuleJudgeGroup[] {
  if (steps.length > 1 && steps.some((step) => step.kind !== "actions")) throw new Error("当前接口不保证行为与后续条件的执行顺序，请使用分支内嵌套配置");
  return steps.flatMap((step): ScheduleRuleJudgeGroup[] => {
    if (step.kind === "branch") {
      const { items, monitorType, isMonitor } = buildBranchJudgeParams(step.condition);
      return [
        ...buildRulePathGroups(step.then, [...path, { items, inverted: false, isMonitor, monitorType }], options, spaceId, savedDetails),
        ...buildRulePathGroups(step.otherwise ?? [], [...path, { items, inverted: true, isMonitor, monitorType }], options, spaceId, savedDetails),
      ];
    }
    if (step.kind === "switch") {
      if (!step.cases.length) throw new Error("Switch 至少需要一个 case");
      const cases: ScheduleRuleJudgeItem[] = step.cases.map((item) => ({
        leftOperate: buildRuleOperand(step.switchOn),
        rightOperate: buildRuleOperand(item.value),
        condition: "EQ",
      }));
      return [
        ...step.cases.flatMap((item, index) => {
          const comparison = cases[index];
          if (!comparison) throw new Error("Switch 条件无效");
          return buildRulePathGroups(item.steps, [...path, { items: [comparison], inverted: false, isMonitor: false }], options, spaceId, savedDetails);
        }),
        ...buildRulePathGroups(
          step.defaultSteps ?? [],
          [
            ...path,
            {
              items: cases.map((item, index) => ({ ...item, ...(index < cases.length - 1 ? { linkFlag: "OR" as const } : {}) })),
              inverted: true,
              isMonitor: false,
            },
          ],
          options,
          spaceId,
          savedDetails,
        ),
      ];
    }
    const { judgeParams, inverted, monitorType } = buildPathJudgeParams(path);
    if (!step.actions.length) throw new Error("请配置执行行为");
    return step.actions.map((action) => {
      const option = options.find((item) => item.id === action.behaviorId);
      if (!option) throw new Error("请双击行为节点选择当前空间行为并确认行为参数");
      const actionRequest = readRuleActionRequest(action, savedDetails);
      const requestApi =
        typeof actionRequest.actionApi === "string" ? actionRequest.actionApi : typeof actionRequest.treeApi === "string" ? actionRequest.treeApi : "";
      if (requestApi !== option.actionApi || Number(actionRequest.ontologySpaceId) !== Number(spaceId))
        throw new Error("行为参数与当前行为或空间不匹配，请重新配置");
      const actionParam: ScheduleRuleActionParam = {
        action_api: option.actionApi,
        ...(option.ontologyUniqIdentifier ? { ontology_identifier: option.ontologyUniqIdentifier } : {}),
        entity_json: JSON.stringify(actionRequest),
      };
      return {
        condition: inverted,
        ...(monitorType ? { monitorType } : {}),
        judgeParams: judgeParams.map((item) => ({ ...item })),
        actionParam,
      };
    });
  });
}

/** @description 提取画布业务结构和已确认执行请求，避免保存参数组件的临时查询状态。 @param steps 画布步骤。 @param savedDetails 原始行为请求。 @returns 可序列化步骤。 */
function buildSavedFlowSteps(steps: RuleFlowStep[], savedDetails: Readonly<ScheduleRuleDetailGroup["actionDetails"]>): object[] {
  return steps.map((step) => {
    if (step.kind === "actions")
      return {
        ...step,
        actions: step.actions.map((action) => ({
          ...action,
          behaviorParameters: { request: readRuleActionRequest(action, savedDetails) },
        })),
      };
    if (step.kind === "branch")
      return {
        ...step,
        then: buildSavedFlowSteps(step.then, savedDetails),
        otherwise: step.otherwise ? buildSavedFlowSteps(step.otherwise, savedDetails) : null,
      };
    return {
      ...step,
      cases: step.cases.map((item) => ({ ...item, steps: buildSavedFlowSteps(item.steps, savedDetails) })),
      defaultSteps: step.defaultSteps ? buildSavedFlowSteps(step.defaultSteps, savedDetails) : null,
    };
  });
}

/** @description 递归转换多层 if/else 和 switch/case 草稿，每个行为包含全部祖先路径约束，同时保存原始画布。 @param draft 调度草稿。 @param options 当前空间可用行为。 @param spaceId 空间标识。 @param savedDetails 编辑时的原始行为请求。 @returns 创建或编辑公共参数或用户可读错误。 */
export function buildRuleScheduleCreateParams(
  draft: BehaviorScheduleDraft,
  options: readonly ScheduleBehaviorOption[],
  spaceId: string,
  savedDetails: Readonly<ScheduleRuleDetailGroup["actionDetails"]> = {},
): { ok: true; request: CreateRuleBehaviorScheduleParams } | { ok: false; error: string } {
  try {
    if (!Number.isSafeInteger(Number(spaceId)) || Number(spaceId) <= 0) throw new Error("空间标识无效");
    if (!draft.name.trim()) throw new Error("请输入调度名称");
    const steps = draft.ruleFlow?.steps;
    if (!steps?.length) throw new Error("请配置规则画布");
    const judgeRules = buildRulePathGroups(steps, [], options, spaceId, savedDetails);
    const firstAction = judgeRules[0]?.actionParam;
    if (!firstAction) throw new Error("规则画布至少需要一个已配置行为");
    return {
      ok: true,
      request: {
        spaceId: Number(spaceId),
        name: draft.name.trim(),
        description: draft.description,
        type: "RULE",
        actionApi: firstAction.action_api,
        ...(firstAction.ontology_identifier ? { ontologyIdentifier: firstAction.ontology_identifier } : {}),
        rule: { judgeRules, flowDocument: JSON.stringify({ version: 1, steps: buildSavedFlowSteps(steps, savedDetails) }) },
      },
    };
  } catch (cause) {
    return { ok: false, error: cause instanceof Error ? cause.message : "规则参数转换失败" };
  }
}
