import type {
  ActionTreeBindableAction,
  BehaviorTreeKindMeta,
  BehaviorTreeModel,
  BehaviorTreeNodeDraft,
  BehaviorTreeNodeKind,
  BehaviorTreeObjectPropertyOption,
  BehaviorTreeValueType,
} from "@/types";
import { mapBehaviorTreePropertyTypeToValueType, resolveBehaviorTreeBlackboardSource } from "./behaviorTreeBlackboard.ts";
import { BEHAVIOR_TREE_BLACKBOARD_SOURCE_LABELS, BEHAVIOR_TREE_NUMBER_TYPES, isBehaviorTreeValueLessOp } from "./behaviorTreeConstants.ts";
import { forEachBehaviorTreeNode } from "./behaviorTreeModel.ts";
import { parseBehaviorTreeTypedValue } from "./behaviorTreeTypedValue.ts";

/**
 * @description 收集行为树本地校验错误。
 * @param model 模型。
 * @param kindMeta kind 元信息。
 * @param objectProperties 可选对象属性目录（用于 PROPERTY 类型对齐校验）。
 * @returns 错误文案列表。
 */
export function collectBehaviorTreeErrors(
  model: BehaviorTreeModel,
  kindMeta: Record<BehaviorTreeNodeKind, BehaviorTreeKindMeta>,
  objectProperties: Record<string, BehaviorTreeObjectPropertyOption> = {},
): string[] {
  const errors: string[] = [];
  const types: Record<string, BehaviorTreeValueType> = {};
  model.blackboard.forEach((item, index) => {
    const key = item.key.trim();
    if (!key) {
      errors.push(`黑板第 ${index + 1} 行键名为空`);
      return;
    }
    if (types[key]) {
      errors.push(`黑板键名重复：${key}`);
      return;
    }
    if (!item.valueType) {
      errors.push(`黑板键 ${key} 必须选择值类型`);
      return;
    }
    types[key] = item.valueType;
    const source = resolveBehaviorTreeBlackboardSource(item);
    const fixedText = String(item.fixedValueText ?? "").trim();
    const defaultText = String(item.defaultValueText ?? "").trim();
    if (source !== "EXTERNAL" && defaultText !== "") {
      errors.push(`黑板键 ${key} 的来源是${BEHAVIOR_TREE_BLACKBOARD_SOURCE_LABELS[source] || source}，取值不来自默认值，清空默认值再保存`);
    }
    if (source === "FIXED") {
      if (fixedText === "") errors.push(`黑板键 ${key} 的值来源是固定值，必须填写固定值`);
      else if (!parseBehaviorTreeTypedValue(fixedText, item.valueType).ok) {
        errors.push(`黑板键 ${key} 的固定值不符合 ${item.valueType} 类型`);
      }
    }
    if (source === "EXTERNAL" && defaultText !== "" && !parseBehaviorTreeTypedValue(defaultText, item.valueType).ok) {
      errors.push(`黑板键 ${key} 的默认值不符合 ${item.valueType} 类型`);
    }
    if (source !== "PROPERTY") return;
    if (!(item.bindPropertyUniqueIdentifier || "").trim()) {
      errors.push(`黑板键 ${key} 的值来源是对象属性，必须选择属性`);
      return;
    }
    const property = objectProperties[item.bindPropertyUniqueIdentifier.trim()];
    if (!property) return;
    const mapped = mapBehaviorTreePropertyTypeToValueType(property.propertyType);
    if (mapped !== item.valueType) {
      errors.push(`黑板键 ${key} 的类型与绑定属性 ${property.objectId} · ${property.displayName} 不一致：${item.valueType} != ${mapped}`);
    }
  });
  if (model.roots.length !== 1) {
    errors.push(`行为树必须且只能有一个根节点，当前 ${model.roots.length} 个`);
  }
  const seen: Record<string, boolean> = {};
  model.roots.forEach((root) => validateBehaviorTreeNode(root, types, errors, seen, kindMeta));
  return errors;
}

/**
 * @description 校验单个节点。
 * @param node 节点。
 * @param types 黑板类型表。
 * @param errors 错误收集。
 * @param seen 已见 id。
 * @param kindMeta kind 元信息。
 */
function validateBehaviorTreeNode(
  node: BehaviorTreeNodeDraft,
  types: Record<string, BehaviorTreeValueType>,
  errors: string[],
  seen: Record<string, boolean>,
  kindMeta: Record<BehaviorTreeNodeKind, BehaviorTreeKindMeta>,
): void {
  const label = `${kindMeta[node.kind].name}(${node.id})`;
  if (!node.id) {
    errors.push("节点标识不能为空");
    return;
  }
  if (seen[node.id]) errors.push(`节点标识重复：${node.id}`);
  seen[node.id] = true;

  const category = kindMeta[node.kind].category;
  if (category === "COMPOSITE" && node.children.length === 0) errors.push(`${label} 至少要有子节点`);
  if (category === "DECORATOR" && node.children.length !== 1) errors.push(`${label} 只能有一个子节点，当前 ${node.children.length} 个`);
  if (category === "LEAF" && node.children.length !== 0) errors.push(`${label} 是叶子节点，不能有子节点`);

  const draft = node.config || {};
  const intField = (value: string | undefined, fieldLabel: string, required: boolean, min = 1): void => {
    const text = String(value ?? "").trim();
    if (!text) {
      if (required) errors.push(`${fieldLabel}必须填写`);
      return;
    }
    const n = Number(text);
    if (!Number.isInteger(n) || n < min) {
      errors.push(fieldLabel + (min === 0 ? "不能为负数" : "必须是大于 0 的整数"));
    }
  };

  switch (node.kind) {
    case "SELECTOR":
    case "SEQUENCE":
      if (!draft.runMode) errors.push(`${label} 必须选择执行模式`);
      break;
    case "PARALLEL":
      if (!draft.policy) errors.push(`${label} 必须选择成败判定策略`);
      intField(draft.maxConcurrency, `${label} 的最大并发数`, false);
      break;
    case "REPEATER":
      if (!draft.loopMode) errors.push(`${label} 必须选择循环模式`);
      intField(draft.times, `${label} 的循环次数`, draft.loopMode === "FIXED_TIMES");
      if (draft.loopMode && draft.loopMode !== "FIXED_TIMES" && !node.whileCondition.trim()) {
        errors.push(`${label} 选择${draft.loopMode}时必须填写持续执行条件`);
      }
      break;
    case "UNTIL_SUCCESS":
    case "UNTIL_FAILURE":
      intField(draft.maxTimes, `${label} 的最大重试次数`, false, 0);
      if (!draft.finishState) errors.push(`${label} 必须选择次数耗尽后的收尾状态`);
      break;
    case "COOLDOWN":
      intField(draft.intervalSeconds, `${label} 的冷却时长`, true);
      if (!draft.hitResult) errors.push(`${label} 必须选择冷却期内的结果状态`);
      if (draft.entityPrimaryKeyKey?.trim() && !types[draft.entityPrimaryKeyKey.trim()]) {
        errors.push(`${label} 引用了未声明的黑板键：${draft.entityPrimaryKeyKey}`);
      }
      break;
    case "TIME_LIMIT":
      intField(draft.limitSeconds, `${label} 的限时时长`, true);
      if (!draft.timeoutState) errors.push(`${label} 必须选择超时后的状态`);
      break;
    case "BLACKBOARD_CONDITION": {
      const key = (draft.key || "").trim();
      if (!key) errors.push(`${label} 必须选择黑板键`);
      else if (!types[key]) errors.push(`${label} 的黑板键未声明：${key}`);
      if (!draft.op) errors.push(`${label} 必须选择比较方式`);
      else {
        const declared = types[key];
        if (declared) {
          if (["GT", "GE", "LT", "LE"].includes(draft.op) && !BEHAVIOR_TREE_NUMBER_TYPES.includes(declared)) {
            errors.push(`${label} 的比较只支持数值类型，黑板键类型是 ${declared}`);
          }
          if (["CONTAINS", "NOT_CONTAINS"].includes(draft.op) && declared !== "STRING" && declared !== "LIST") {
            errors.push(`${label} 的比较只支持字符串和列表，黑板键类型是 ${declared}`);
          }
        }
        if (!isBehaviorTreeValueLessOp(draft.op)) {
          if (!String(draft.value ?? "").trim()) errors.push(`${label} 必须填写比较值`);
          else if (declared && !parseBehaviorTreeTypedValue(draft.value, declared).ok) {
            errors.push(`${label} 的比较值与黑板键 ${key} 的类型 ${declared} 不匹配`);
          }
        }
      }
      break;
    }
    case "CONDITION":
      if (!String(draft.expression || "").trim()) errors.push(`${label} 必须填写条件表达式`);
      break;
    case "ACTION": {
      if (!(draft.actionApi || "").trim()) errors.push(`${label} 必须绑定行为`);
      const timeoutText = String(draft.timeoutSeconds ?? "").trim();
      if (timeoutText) {
        const timeout = Number(timeoutText);
        if (!Number.isInteger(timeout) || timeout < 0) errors.push(`${label} 的 timeoutSeconds 只能为空、0 或正整数`);
        else if (timeout > 0) errors.push(`${label} 不支持超时时长（后端会拒绝正数），需要限制后续步骤请改用限时节点`);
      }
      intField(draft.retryTimes, `${label} 的重试次数`, false, 0);
      break;
    }
    case "INVERTER":
    case "FORCE_SUCCESS":
      break;
    default:
      errors.push(`${label} 未知节点类型`);
  }
  node.children.forEach((child) => validateBehaviorTreeNode(child, types, errors, seen, kindMeta));
}

/**
 * @description 收集行为树警告。
 * @param model 模型。
 * @param availableActions 可绑定行为。
 * @returns 警告列表。
 */
export function collectBehaviorTreeWarnings(model: BehaviorTreeModel, availableActions: ActionTreeBindableAction[]): string[] {
  const warnings: string[] = [];
  forEachBehaviorTreeNode(model.roots, (node) => {
    const draft = node.config || {};
    if (node.kind === "PARALLEL") {
      const n = Number(draft.maxConcurrency);
      if (Number.isInteger(n) && n > 8) warnings.push(`并行节点 ${node.id} 配置了 ${n} 路并发，执行时按 8 路封顶`);
    }
    if (node.kind === "REPEATER") {
      const n = Number(draft.times);
      if (Number.isInteger(n) && n > 1000) warnings.push(`重复节点 ${node.id} 的循环次数超过 1000，单次执行按失败上报`);
    }
    if (node.kind === "ACTION") {
      const n = Number(draft.retryTimes);
      if (Number.isInteger(n) && n > 0) warnings.push(`行为节点 ${node.id} 开启了 ${n} 次重试，失败时会重复落库`);
    }
  });
  if (!availableActions.length) return warnings;
  forEachBehaviorTreeNode(model.roots, (node) => {
    if (node.kind !== "ACTION") return;
    const api = (node.config?.actionApi || "").trim();
    if (!api) return;
    if (!availableActions.some((item) => item.actionApi === api)) {
      warnings.push(`行为节点 ${node.id} 绑定的 ${api} 不在当前目录（可能未发布或属于其他空间）`);
    }
  });
  return warnings;
}
