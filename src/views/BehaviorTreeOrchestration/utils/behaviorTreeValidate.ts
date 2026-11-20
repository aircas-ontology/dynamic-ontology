import type {
  ActionTreeBindableAction,
  BehaviorTreeKindMeta,
  BehaviorTreeModel,
  BehaviorTreeNodeConfigDraft,
  BehaviorTreeNodeDraft,
  BehaviorTreeNodeKind,
  BehaviorTreeObjectPropertyOption,
  BehaviorTreeValueType,
} from "@/types";
import {
  mapBehaviorTreePropertyTypeToValueType,
  resolveBehaviorTreeBlackboardObjectIdentifier,
  resolveBehaviorTreeBlackboardSource,
} from "../../../utils/behaviorTreeBlackboard.ts";
import { parseBehaviorTreeTypedValue } from "../../../utils/behaviorTreeTypedValue.ts";
import {
  findBehaviorTreeBindableAction,
  findBehaviorTreeSurePreviousActionNode,
  listBehaviorTreeBindableInputs,
  listBehaviorTreeBindableOutputs,
  listBehaviorTreeInputBindingDrafts,
  listBehaviorTreeOutputBindingDrafts,
} from "./behaviorTreeActionBindings.ts";
import {
  BEHAVIOR_TREE_BLACKBOARD_SOURCE_LABELS,
  BEHAVIOR_TREE_NUMBER_TYPES,
  BEHAVIOR_TREE_OP_OPTIONS,
  isBehaviorTreeValueLessOp,
} from "./behaviorTreeConstants.ts";
import { forEachBehaviorTreeNode } from "./behaviorTreeModel.ts";

/**
 * @description 解析比较运算符中文标签。
 * @param op 运算符。
 * @returns 标签。
 */
function resolveBehaviorTreeOpLabel(op: string): string {
  return BEHAVIOR_TREE_OP_OPTIONS.find((item) => item.value === op)?.label || op;
}

/**
 * @description 读取配置标量字段文本。
 * @param draft 节点配置。
 * @param field 字段名。
 * @returns 字符串。
 */
function readBehaviorTreeConfigText(draft: BehaviorTreeNodeConfigDraft, field: string): string {
  const value = draft[field];
  return typeof value === "string" ? value : "";
}

/**
 * @description 收集行为树本地校验错误。
 * @param model 模型。
 * @param kindMeta kind 元信息。
 * @param objectProperties 可选对象属性目录（用于 PROPERTY 类型对齐校验）。
 * @param availableActions 可选可绑定行为目录（用于入参/出参绑定校验）。
 * @returns 错误文案列表。
 */
export function collectBehaviorTreeErrors(
  model: BehaviorTreeModel,
  kindMeta: Record<BehaviorTreeNodeKind, BehaviorTreeKindMeta>,
  objectProperties: Record<string, BehaviorTreeObjectPropertyOption> = {},
  availableActions: ActionTreeBindableAction[] = [],
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
    if (!resolveBehaviorTreeBlackboardObjectIdentifier(item, objectProperties)) {
      errors.push(`黑板键 ${key} 绑定的属性 ${property.displayName} 认不出所属对象，请重新选择对象与属性`);
      return;
    }
    const mapped = mapBehaviorTreePropertyTypeToValueType(property.propertyType);
    if (mapped !== item.valueType) {
      errors.push(`黑板键 ${key} 的类型与绑定属性 ${property.objectId} · ${property.displayName} 不一致：${item.valueType} != ${mapped}`);
    }
  });
  if (model.roots.length !== 1) {
    errors.push(`行为树必须且只能有一个根节点，当前 ${model.roots.length} 个`);
  }
  const seen: Record<string, boolean> = {};
  model.roots.forEach((root) => validateBehaviorTreeNode(root, types, errors, seen, kindMeta, model, availableActions));
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
  model: BehaviorTreeModel,
  availableActions: ActionTreeBindableAction[],
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
  const intField = (value: string, fieldLabel: string, required: boolean, min = 1): void => {
    const text = value.trim();
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
      if (!readBehaviorTreeConfigText(draft, "runMode")) errors.push(`${label} 必须选择执行模式`);
      break;
    case "PARALLEL":
      if (!readBehaviorTreeConfigText(draft, "policy")) errors.push(`${label} 必须选择成败判定策略`);
      intField(readBehaviorTreeConfigText(draft, "maxConcurrency"), `${label} 的最大并发数`, false);
      break;
    case "REPEATER": {
      const loopMode = readBehaviorTreeConfigText(draft, "loopMode");
      if (!loopMode) errors.push(`${label} 必须选择循环模式`);
      intField(readBehaviorTreeConfigText(draft, "times"), `${label} 的循环次数`, loopMode === "FIXED_TIMES");
      if (loopMode && loopMode !== "FIXED_TIMES" && !node.whileCondition.trim()) {
        errors.push(`${label} 选择${loopMode}时必须填写持续执行条件`);
      }
      break;
    }
    case "UNTIL_SUCCESS":
    case "UNTIL_FAILURE":
      intField(readBehaviorTreeConfigText(draft, "maxTimes"), `${label} 的最大重试次数`, false, 0);
      if (!readBehaviorTreeConfigText(draft, "finishState")) errors.push(`${label} 必须选择次数耗尽后的收尾状态`);
      break;
    case "COOLDOWN": {
      intField(readBehaviorTreeConfigText(draft, "intervalSeconds"), `${label} 的冷却时长`, true);
      if (!readBehaviorTreeConfigText(draft, "hitResult")) errors.push(`${label} 必须选择冷却期内的结果状态`);
      const entityKey = readBehaviorTreeConfigText(draft, "entityPrimaryKeyKey").trim();
      if (entityKey && !types[entityKey]) {
        errors.push(`${label} 引用了未声明的黑板键：${entityKey}`);
      }
      break;
    }
    case "TIME_LIMIT":
      intField(readBehaviorTreeConfigText(draft, "limitSeconds"), `${label} 的限时时长`, true);
      if (!readBehaviorTreeConfigText(draft, "timeoutState")) errors.push(`${label} 必须选择超时后的状态`);
      break;
    case "BLACKBOARD_CONDITION": {
      const key = readBehaviorTreeConfigText(draft, "key").trim();
      const op = readBehaviorTreeConfigText(draft, "op");
      const compareValue = readBehaviorTreeConfigText(draft, "value");
      if (!key) errors.push(`${label} 必须选择黑板键`);
      else if (!types[key]) errors.push(`${label} 的黑板键未声明：${key}`);
      if (!op) errors.push(`${label} 必须选择比较方式`);
      else {
        const declared = types[key];
        if (declared) {
          if (["GT", "GE", "LT", "LE"].includes(op) && !BEHAVIOR_TREE_NUMBER_TYPES.includes(declared)) {
            errors.push(`${label} 的比较只支持数值类型，黑板键类型是 ${declared}`);
          }
          if (["CONTAINS", "NOT_CONTAINS"].includes(op) && declared !== "STRING" && declared !== "LIST") {
            errors.push(`${label} 的比较只支持字符串和列表，黑板键类型是 ${declared}`);
          }
        }
        if (!isBehaviorTreeValueLessOp(op)) {
          if (!compareValue.trim()) errors.push(`${label} 必须填写比较值`);
          else if (declared && !parseBehaviorTreeTypedValue(compareValue, declared).ok) {
            errors.push(`${label} 的比较值与黑板键 ${key} 的类型 ${declared} 不匹配`);
          }
        }
      }
      break;
    }
    case "CONDITION":
      if (!readBehaviorTreeConfigText(draft, "expression").trim()) errors.push(`${label} 必须填写条件表达式`);
      break;
    case "ACTION": {
      if (!readBehaviorTreeConfigText(draft, "actionApi").trim()) errors.push(`${label} 必须绑定行为`);
      const timeoutText = readBehaviorTreeConfigText(draft, "timeoutSeconds").trim();
      if (timeoutText) {
        const timeout = Number(timeoutText);
        if (!Number.isInteger(timeout) || timeout < 0) errors.push(`${label} 的 timeoutSeconds 只能为空、0 或正整数`);
        else if (timeout > 0) errors.push(`${label} 不支持超时时长（后端会拒绝正数），需要限制后续步骤请改用限时节点`);
      }
      intField(readBehaviorTreeConfigText(draft, "retryTimes"), `${label} 的重试次数`, false, 0);
      validateBehaviorTreeActionBindings(node, label, model, availableActions, errors);
      break;
    }
    case "INVERTER":
    case "FORCE_SUCCESS":
      break;
    default:
      errors.push(`${label} 未知节点类型`);
  }
  node.children.forEach((child) => validateBehaviorTreeNode(child, types, errors, seen, kindMeta, model, availableActions));
}

/**
 * @description 校验 ACTION 节点入参/出参绑定。
 * @param node 节点。
 * @param label 节点标签。
 * @param model 模型。
 * @param availableActions 可绑定行为。
 * @param errors 错误收集。
 */
function validateBehaviorTreeActionBindings(
  node: BehaviorTreeNodeDraft,
  label: string,
  model: BehaviorTreeModel,
  availableActions: ActionTreeBindableAction[],
  errors: string[],
): void {
  const actionApi = readBehaviorTreeConfigText(node.config || {}, "actionApi").trim();
  const action = findBehaviorTreeBindableAction(availableActions, actionApi);
  const declaredKeys = model.blackboard.map((item) => item.key.trim()).filter(Boolean);
  const inputNames = listBehaviorTreeBindableInputs(action).map((item) => item.name);
  const outputNames = listBehaviorTreeBindableOutputs(action).map((item) => item.name);
  const seenParams: Record<string, true> = {};
  for (const binding of listBehaviorTreeInputBindingDrafts(node.config)) {
    const name = binding.key;
    if (!name) continue;
    if (seenParams[name]) {
      errors.push(`${label} 的入参 ${name} 绑了多条取值来源`);
      continue;
    }
    seenParams[name] = true;
    if (action && !inputNames.includes(name)) {
      errors.push(`${label} 绑的入参 ${name} 不是行为 ${action.actionApi} 声明的入参`);
    }
    if (binding.from === "BLACKBOARD") {
      if (!binding.blackboardKey) continue;
      if (!declaredKeys.includes(binding.blackboardKey)) {
        errors.push(`${label} 的入参 ${name} 引用的黑板键 ${binding.blackboardKey} 没在「黑板 / 变量」里声明`);
      }
      continue;
    }
    if (binding.from !== "ACTION_OUTPUT") {
      errors.push(`${label} 的入参 ${name} 没选取值来源`);
      continue;
    }
    if (!binding.fromOutput) continue;
    const previous = findBehaviorTreeSurePreviousActionNode(model.roots, node.id);
    if (!previous) {
      errors.push(`${label} 的入参 ${name} 要取上游出参，但它前面没有行为节点：请改用黑板变量传递`);
    } else if (binding.fromNodeId !== previous.id) {
      errors.push(
        `${label} 的入参 ${name} 引用的上游节点已不是它的上一个行为节点（当前上一个是「${previous.displayName || "未命名节点"}」）：请重新选择，更早的出参用黑板变量传递`,
      );
    }
  }
  const seenOutputs: Record<string, true> = {};
  for (const binding of listBehaviorTreeOutputBindingDrafts(node.config)) {
    const name = binding.key;
    if (!name || !binding.blackboardKey) continue;
    if (seenOutputs[name]) {
      errors.push(`${label} 的出参 ${name} 回传了多次黑板`);
      continue;
    }
    seenOutputs[name] = true;
    if (action && !outputNames.includes(name)) {
      errors.push(`${label} 要回传的出参 ${name} 在该行为上不存在${action && !outputNames.length ? "（属性值/实例关系行为没有返回体，出参不能回传）" : ""}`);
    }
    const key = model.blackboard.find((item) => item.key.trim() === binding.blackboardKey);
    if (!key) {
      errors.push(`${label} 的出参 ${name} 回传的黑板键 ${binding.blackboardKey} 没在「黑板 / 变量」里声明`);
    } else if (resolveBehaviorTreeBlackboardSource(key) === "FIXED") {
      errors.push(
        `${label} 的出参 ${name} 不能回传固定值来源的黑板键 ${binding.blackboardKey}：固定值以声明为准，回传只能选外部输入来源的键，或绑定属性就是该出参写回属性的对象属性键`,
      );
    } else if (resolveBehaviorTreeBlackboardSource(key) === "PROPERTY" && key.bindPropertyUniqueIdentifier.trim() !== name) {
      errors.push(`${label} 的出参 ${name} 不能回传对象属性黑板键 ${binding.blackboardKey}：回传给属性键要求该键绑定的属性就是这个出参写回的属性`);
    }
  }
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
      const n = Number(readBehaviorTreeConfigText(draft, "maxConcurrency"));
      if (Number.isInteger(n) && n > 8) warnings.push(`并行节点 ${node.id} 配置了 ${n} 路并发，执行时按 8 路封顶`);
    }
    if (node.kind === "REPEATER") {
      const n = Number(readBehaviorTreeConfigText(draft, "times"));
      if (Number.isInteger(n) && n > 1000) warnings.push(`重复节点 ${node.id} 的循环次数超过 1000，单次执行按失败上报`);
    }
    if (node.kind === "ACTION") {
      const n = Number(readBehaviorTreeConfigText(draft, "retryTimes"));
      if (Number.isInteger(n) && n > 0) warnings.push(`行为节点 ${node.id} 开启了 ${n} 次重试，失败时会重复落库`);
    }
  });
  if (!availableActions.length) return warnings;
  forEachBehaviorTreeNode(model.roots, (node) => {
    if (node.kind !== "ACTION") return;
    const api = readBehaviorTreeConfigText(node.config || {}, "actionApi").trim();
    if (!api) return;
    if (!availableActions.some((item) => item.actionApi === api)) {
      warnings.push(`行为节点 ${node.id} 绑定的 ${api} 不在当前目录（可能未发布或属于其他空间）`);
    }
  });
  return warnings;
}
