import type { Cell, Graph } from "@antv/x6";
import type { RuleCompositeCondition, RuleFlowSwitchCase, RuleFlowSwitchStep, RuleFlowThenAction, RuleValueNode } from "@/types";
import { cloneRuleFlowValue, summarizeRuleCondition, summarizeThenAction, truncateRuleFlowText } from "./scheduleRuleFlowFactory";

/** 画布节点形态。 */
export type ScheduleRuleGraphNodeKind = "start" | "end" | "condition" | "action" | "switch";

/** 画布节点载荷。 */
export interface ScheduleRuleGraphNodeData {
  /** 节点形态。 */
  kind: ScheduleRuleGraphNodeKind;
  /** 条件节点条件。 */
  condition?: RuleCompositeCondition;
  /** 执行行为。 */
  action?: RuleFlowThenAction;
  /** Switch 步骤。 */
  switchStep?: RuleFlowSwitchStep;
}

/** 待接入下一节点的出边引用。 */
export interface ScheduleRuleGraphWireRef {
  /** 源节点标识。 */
  sourceId: string;
  /** 源端口标识。 */
  sourcePort: string;
}

/** 节点 / 边创建时的图上下文。 */
export interface ScheduleRuleGraphCellContext {
  /** X6 图实例。 */
  graph: Graph | null;
  /** 整图渲染缓冲；非空时只入队不立即写入。 */
  renderBuffer: Cell[] | null;
}

export const START_NODE_ID = "__rule_start__";
export const END_NODE_ID = "__rule_end__";
export const COND_W = 300;
export const COND_H = 170;
export const ACT_W = 250;
export const ACT_H = 104;
export const TERMINAL_W = 128;
export const TERMINAL_H = 56;
export const PORT_IN = "in";
export const PORT_OUT = "out";
export const PORT_TRUE = "true";
export const PORT_FALSE = "false";
export const PORT_SWITCH_CASE_PREFIX = "case_";
export const PORT_SWITCH_DEFAULT = "default";
export const SWITCH_W = 220;
export const SWITCH_PORT_SPACING = 36;
export const SWITCH_CASE_VERTICAL_START = 72;
export const SWITCH_HEADER_H = 56;
export const SWITCH_FOOTER_H = 24;
export const DEPTH_X_GAP = 500;
export const SWITCH_CASE_X_GAP = 600;
export const COND_COLUMN_X = 240;
export const ACT_STEP_X = 290;
export const ACT_OFFSET_Y = 16;
export const BAND_GAP_Y = 180;
export const SUFFIX_GAP_Y = 130;
export const PREFIX_BAND_PUSH_Y = 110;

/**
 * @description 按深度计算步骤节点横坐标。
 * @param depth 嵌套深度。
 * @param xOffset 额外偏移。
 * @returns 横坐标。
 */
export function regionColumnX(depth: number, xOffset = 0): number {
  return COND_COLUMN_X + depth * DEPTH_X_GAP + xOffset;
}

/**
 * @description 读取节点载荷；缺失时按开始节点处理。
 * @param node 图单元。
 * @returns 节点载荷。
 */
export function readGraphNodeData(node: Cell): ScheduleRuleGraphNodeData {
  return (node.isNode() ? node.getData<ScheduleRuleGraphNodeData>() : null) ?? { kind: "start" };
}

/**
 * @description 重置 X6 默认文字定位，避免节点标题被居中黑色覆盖。
 * @returns 共用文字属性。
 */
function sharedTextAttrs() {
  return {
    refX: null,
    refY: null,
    fill: "var(--aircas-color-text-primary)",
    fontSize: 11,
    textAnchor: "start",
    textVerticalAnchor: "middle",
  };
}

/**
 * @description 生成输入 / 输出端口分组样式。
 * @returns 端口分组。
 */
function portGroups() {
  /**
   * @description 生成端口圆点样式。
   * @param magnet 是否允许拖出连线。
   * @param stroke 描边色。
   * @param fill 填充色。
   * @returns 圆点属性。
   */
  const portCircle = (magnet: "passive" | true, stroke: string, fill: string) => ({
    r: 5.5,
    magnet,
    stroke,
    strokeWidth: 2,
    fill,
  });
  return {
    [PORT_IN]: {
      position: { name: "absolute" },
      attrs: {
        circle: portCircle("passive", "var(--aircas-color-accent-cyan)", "var(--aircas-color-panel-background)"),
      },
    },
    [PORT_OUT]: {
      position: { name: "absolute" },
      attrs: {
        circle: portCircle(true, "var(--aircas-color-accent-cyan)", "var(--aircas-color-panel-background)"),
      },
    },
    [PORT_TRUE]: {
      position: { name: "absolute" },
      attrs: {
        circle: portCircle(true, "var(--aircas-color-accent-cyan)", "var(--aircas-color-accent-cyan)"),
      },
    },
    [PORT_FALSE]: {
      position: { name: "absolute" },
      attrs: {
        circle: portCircle(true, "var(--aircas-color-accent-purple)", "var(--aircas-color-accent-purple)"),
      },
    },
  };
}

/**
 * @description 创建绝对定位端口。
 * @param id 端口标识。
 * @param x 横坐标。
 * @param y 纵坐标。
 * @param group 端口分组。
 * @returns 端口配置。
 */
export function createPortItem(id: string, x: number, y: number, group: string) {
  return { id, group, args: { x, y } };
}

/**
 * @description 生成连线样式。
 * @param stroke 线条颜色。
 * @returns 边属性。
 */
export function createEdgeAttrs(stroke: string) {
  return {
    line: {
      stroke,
      strokeWidth: 1.8,
      targetMarker: { name: "block", width: 9, height: 7 },
    },
  };
}

/**
 * @description 生成边上的满足 / 否则等标签。
 * @param text 标签文案。
 * @returns 边标签配置。
 */
export function createEdgeLabelConfig(text: string) {
  return [
    {
      markup: [
        { tagName: "rect", selector: "body" },
        { tagName: "text", selector: "label" },
      ],
      attrs: {
        body: {
          fill: "var(--aircas-color-panel-background-deep)",
          stroke: "var(--aircas-color-border-soft)",
          strokeWidth: 1,
          rx: 3,
          ry: 3,
          refWidth: "100%",
          refHeight: "100%",
          refX: -4,
          refY: -2,
          refWidth2: 8,
          refHeight2: 4,
        },
        label: {
          text,
          fill: "var(--aircas-color-text-primary)",
          fontSize: 11,
          textAnchor: "middle",
          textVerticalAnchor: "middle",
        },
      },
      position: 0.5,
    },
  ];
}

/**
 * @description 判断端口是否属于 Switch 出口。
 * @param portId 端口标识。
 * @returns 是否为 case / default 端口。
 */
export function isSwitchPort(portId: string | null | undefined): boolean {
  return Boolean(portId && (portId.startsWith(PORT_SWITCH_CASE_PREFIX) || portId === PORT_SWITCH_DEFAULT));
}

/**
 * @description 按源端口选择连线颜色。
 * @param portId 源端口标识。
 * @returns 主题色变量。
 */
export function edgeColorForSourcePort(portId: string | null | undefined): string {
  if (isSwitchPort(portId) || portId === PORT_FALSE) return "var(--aircas-color-accent-purple)";
  return "var(--aircas-color-accent-cyan)";
}

/**
 * @description 把规则值压缩成节点展示短文案。
 * @param value 规则值。
 * @returns 展示文案。
 */
function serializeValueForNodeDisplay(value: RuleValueNode): string {
  if (value.kind === "input") return value.text ? `"${value.text}"` : "";
  if (value.kind === "variable") return `${value.objectName}.${value.propertyName}`;
  if (value.kind === "function") return `${value.fn}(...)`;
  return value.terms.length ? `${value.terms.length} 项表达式` : "";
}

/**
 * @description 读取 Switch case 端口展示文案。
 * @param item case。
 * @returns 端口旁文字。
 */
function switchCaseDisplayText(item: RuleFlowSwitchCase): string {
  if (item.value.kind === "input") {
    const text = item.value.text.trim();
    return text || item.label.trim() || "case";
  }
  return serializeValueForNodeDisplay(item.value).trim() || item.label.trim() || "case";
}

/**
 * @description 读取 Switch 指定端口的边标签。
 * @param step Switch 步骤。
 * @param portId 端口标识。
 * @returns 边标签。
 */
export function switchCasePortDisplay(step: RuleFlowSwitchStep, portId: string): string {
  if (portId === PORT_SWITCH_DEFAULT) return "default";
  if (!portId.startsWith(PORT_SWITCH_CASE_PREFIX)) return "";
  const index = Number(portId.slice(PORT_SWITCH_CASE_PREFIX.length));
  const item = step.cases[index];
  if (!item) return `case ${index}`;
  return switchCaseDisplayText(item);
}

/**
 * @description 按源端口生成边标签。
 * @param ctx 图上下文。
 * @param sourceId 源节点标识。
 * @param portId 源端口标识。
 * @returns 标签文案；无标签时为空。
 */
export function edgeLabelForSourcePort(ctx: ScheduleRuleGraphCellContext, sourceId: string | null | undefined, portId: string | null | undefined): string {
  if (portId === PORT_TRUE) return "满足";
  if (portId === PORT_FALSE) return "否则";
  if (portId && isSwitchPort(portId) && sourceId && ctx.graph) {
    const node = ctx.graph.getCellById(sourceId);
    if (node?.isNode()) {
      const data = readGraphNodeData(node);
      if (data.kind === "switch" && data.switchStep) {
        return truncateRuleFlowText(switchCasePortDisplay(data.switchStep, portId), 12);
      }
    }
  }
  if (portId === PORT_SWITCH_DEFAULT) return "default";
  if (portId?.startsWith(PORT_SWITCH_CASE_PREFIX)) {
    return `case ${portId.slice(PORT_SWITCH_CASE_PREFIX.length)}`;
  }
  return "";
}

/**
 * @description 把节点或边写入缓冲或立即加入图。
 * @param ctx 图上下文。
 * @param cell 新建单元。
 */
function pushOrAddCell(ctx: ScheduleRuleGraphCellContext, cell: Cell): void {
  if (ctx.renderBuffer) {
    ctx.renderBuffer.push(cell);
    return;
  }
  ctx.graph?.addCell(cell);
}

/**
 * @description 添加规则开始或结束节点。第一期画布不渲染结束节点。
 * @param ctx 图上下文。
 * @param kind 起止形态。
 * @param position 坐标。
 */
export function addTerminalNode(ctx: ScheduleRuleGraphCellContext, kind: "start" | "end", position: { x: number; y: number }): void {
  if (!ctx.graph) return;
  const isStart = kind === "start";
  const cell = ctx.graph.createNode({
    id: isStart ? START_NODE_ID : END_NODE_ID,
    x: position.x,
    y: position.y,
    width: TERMINAL_W,
    height: TERMINAL_H,
    zIndex: 2,
    data: { kind } satisfies ScheduleRuleGraphNodeData,
    markup: [
      { tagName: "rect", selector: "body" },
      { tagName: "text", selector: "title" },
    ],
    attrs: {
      text: { ...sharedTextAttrs() },
      body: {
        fill: "var(--aircas-color-section-header)",
        stroke: isStart ? "var(--aircas-color-accent-cyan)" : "var(--aircas-color-accent-orange)",
        strokeWidth: 1.5,
        rx: 10,
        ry: 10,
      },
      title: {
        x: TERMINAL_W / 2,
        y: TERMINAL_H / 2,
        text: isStart ? "规则开始" : "规则结束",
        fill: "var(--aircas-color-text-primary)",
        fontSize: 14,
        fontWeight: 700,
        textAnchor: "middle",
      },
    },
    ports: {
      groups: portGroups(),
      items: isStart ? [createPortItem(PORT_OUT, TERMINAL_W, TERMINAL_H / 2, PORT_OUT)] : [createPortItem(PORT_IN, 0, TERMINAL_H / 2, PORT_IN)],
    },
  });
  pushOrAddCell(ctx, cell);
}

/**
 * @description 添加条件菱形节点。
 * @param ctx 图上下文。
 * @param nodeId 节点标识。
 * @param condition 条件树。
 * @param position 坐标。
 */
export function addConditionNode(
  ctx: ScheduleRuleGraphCellContext,
  nodeId: string,
  condition: RuleCompositeCondition,
  position: { x: number; y: number },
): void {
  if (!ctx.graph) return;
  const cx = COND_W / 2;
  const halfH = COND_H / 2;
  const cell = ctx.graph.createNode({
    id: nodeId,
    x: position.x,
    y: position.y,
    width: COND_W,
    height: COND_H,
    zIndex: 2,
    data: { kind: "condition", condition: cloneRuleFlowValue(condition) } satisfies ScheduleRuleGraphNodeData,
    markup: [
      { tagName: "polygon", selector: "body" },
      { tagName: "text", selector: "title" },
      { tagName: "text", selector: "badge" },
      { tagName: "text", selector: "summary" },
      { tagName: "text", selector: "hint" },
    ],
    attrs: {
      text: sharedTextAttrs(),
      body: {
        fill: "var(--aircas-color-panel-background)",
        stroke: "var(--aircas-color-accent-cyan)",
        strokeWidth: 1.6,
        points: `${cx},0 ${COND_W},${halfH} ${cx},${COND_H} 0,${halfH}`,
      },
      title: {
        x: cx,
        y: 50,
        text: "条件分支",
        fill: "var(--aircas-color-text-primary)",
        fontSize: 14,
        fontWeight: 700,
        textAnchor: "middle",
      },
      badge: {
        x: cx,
        y: 74,
        text: "如果",
        fill: "var(--aircas-color-accent-cyan)",
        fontSize: 11,
        fontWeight: 600,
        textAnchor: "middle",
      },
      summary: {
        x: cx,
        y: 104,
        text: truncateRuleFlowText(summarizeRuleCondition(condition) || "未配置条件", 28),
        fill: "var(--aircas-color-text-secondary)",
        fontSize: 12,
        textAnchor: "middle",
      },
      hint: {
        x: cx,
        y: 132,
        text: "拖动端口连线",
        fill: "var(--aircas-color-text-muted)",
        fontSize: 10,
        textAnchor: "middle",
      },
    },
    ports: {
      groups: portGroups(),
      items: [
        createPortItem(PORT_IN, 0, COND_H / 2, PORT_IN),
        createPortItem(PORT_TRUE, COND_W, COND_H / 2, PORT_TRUE),
        createPortItem(PORT_FALSE, COND_W / 2, COND_H, PORT_FALSE),
      ],
    },
  });
  pushOrAddCell(ctx, cell);
}

/**
 * @description 添加执行行为节点。
 * @param ctx 图上下文。
 * @param action 执行行为。
 * @param position 坐标。
 */
export function addActionNode(ctx: ScheduleRuleGraphCellContext, action: RuleFlowThenAction, position: { x: number; y: number }): void {
  if (!ctx.graph) return;
  const cell = ctx.graph.createNode({
    id: action.id,
    x: position.x,
    y: position.y,
    width: ACT_W,
    height: ACT_H,
    zIndex: 2,
    data: { kind: "action", action: cloneRuleFlowValue(action) } satisfies ScheduleRuleGraphNodeData,
    markup: [
      { tagName: "rect", selector: "body" },
      { tagName: "rect", selector: "header" },
      { tagName: "text", selector: "title" },
      { tagName: "text", selector: "badge" },
      { tagName: "text", selector: "summary" },
      { tagName: "text", selector: "hint" },
    ],
    attrs: {
      text: sharedTextAttrs(),
      body: {
        fill: "var(--aircas-color-panel-background)",
        stroke: "var(--aircas-color-accent-green)",
        strokeWidth: 1.2,
        rx: 8,
        ry: 8,
      },
      header: {
        x: 0,
        y: 0,
        width: ACT_W,
        height: 40,
        fill: "var(--aircas-color-section-header)",
        stroke: "var(--aircas-color-transparent)",
        rx: 8,
        ry: 8,
      },
      title: {
        x: 14,
        y: 20,
        text: truncateRuleFlowText(action.behaviorName || "未配置行为", 14),
        fill: "var(--aircas-color-text-primary)",
        fontSize: 13,
        fontWeight: 700,
      },
      badge: {
        x: ACT_W - 14,
        y: 20,
        text: "执行行为",
        fill: "var(--aircas-color-accent-green)",
        fontSize: 11,
        fontWeight: 700,
        textAnchor: "end",
      },
      summary: {
        x: 14,
        y: 64,
        text: summarizeThenAction(action),
        fill: "var(--aircas-color-text-secondary)",
        fontSize: 11,
      },
      hint: {
        x: 14,
        y: 90,
        text: "拖动端口连线",
        fill: "var(--aircas-color-text-muted)",
        fontSize: 10,
      },
    },
    ports: {
      groups: portGroups(),
      items: [createPortItem(PORT_IN, 0, ACT_H / 2, PORT_IN), createPortItem(PORT_OUT, ACT_W, ACT_H / 2, PORT_OUT)],
    },
  });
  pushOrAddCell(ctx, cell);
}

/**
 * @description 按 case 数量计算 Switch 节点高度。
 * @param caseCount case 数量。
 * @param hasDefault 是否含默认分支。
 * @returns 高度。
 */
export function switchNodeHeight(caseCount: number, hasDefault: boolean): number {
  const totalOut = caseCount + (hasDefault ? 1 : 0);
  return SWITCH_HEADER_H + 40 + Math.max(totalOut, 1) * SWITCH_PORT_SPACING + SWITCH_FOOTER_H;
}

/**
 * @description 生成 Switch 端口列表。
 * @param caseCount case 数量。
 * @param hasDefault 是否含默认分支。
 * @returns 端口配置。
 */
export function switchNodePorts(caseCount: number, hasDefault: boolean) {
  const result = [{ id: PORT_IN, group: PORT_IN, args: { x: 0, y: SWITCH_HEADER_H / 2 } }];
  for (let index = 0; index < caseCount; index += 1) {
    result.push({
      id: `${PORT_SWITCH_CASE_PREFIX}${index}`,
      group: PORT_OUT,
      args: { x: SWITCH_W, y: SWITCH_CASE_VERTICAL_START + index * SWITCH_PORT_SPACING },
    });
  }
  if (hasDefault) {
    result.push({
      id: PORT_SWITCH_DEFAULT,
      group: PORT_OUT,
      args: { x: SWITCH_W, y: SWITCH_CASE_VERTICAL_START + caseCount * SWITCH_PORT_SPACING },
    });
  }
  return result;
}

/**
 * @description 添加 Switch 节点。
 * @param ctx 图上下文。
 * @param step Switch 步骤。
 * @param position 坐标。
 */
export function addSwitchNode(ctx: ScheduleRuleGraphCellContext, step: RuleFlowSwitchStep, position: { x: number; y: number }): void {
  if (!ctx.graph) return;
  const caseCount = step.cases.length;
  const hasDefault = Boolean(step.defaultSteps && step.defaultSteps.length > 0);
  const height = switchNodeHeight(caseCount, hasDefault);
  const ports = switchNodePorts(caseCount, hasDefault);
  const switchOnText = serializeValueForNodeDisplay(step.switchOn);
  const caseLabelAttrs: Record<string, Record<string, string | number>> = {};
  step.cases.forEach((item, index) => {
    caseLabelAttrs[`caseLabel${index}`] = {
      x: SWITCH_W - 14,
      y: SWITCH_CASE_VERTICAL_START + index * SWITCH_PORT_SPACING,
      text: truncateRuleFlowText(switchCaseDisplayText(item), 10),
      fill: "var(--aircas-color-text-secondary)",
      fontSize: 11,
      textAnchor: "end",
      textVerticalAnchor: "middle",
    };
  });
  if (hasDefault) {
    caseLabelAttrs.defaultLabel = {
      x: SWITCH_W - 14,
      y: SWITCH_CASE_VERTICAL_START + caseCount * SWITCH_PORT_SPACING,
      text: "default",
      fill: "var(--aircas-color-text-muted)",
      fontSize: 11,
      textAnchor: "end",
      textVerticalAnchor: "middle",
    };
  }
  const caseLabels = step.cases.map((_item, index) => ({ tagName: "text", selector: `caseLabel${index}` }));
  const defaultLabel = hasDefault ? [{ tagName: "text", selector: "defaultLabel" }] : [];
  const cell = ctx.graph.createNode({
    id: step.id,
    x: position.x,
    y: position.y,
    width: SWITCH_W,
    height,
    zIndex: 2,
    data: { kind: "switch", switchStep: cloneRuleFlowValue(step) } satisfies ScheduleRuleGraphNodeData,
    markup: [
      { tagName: "rect", selector: "body" },
      { tagName: "rect", selector: "header" },
      { tagName: "text", selector: "title" },
      { tagName: "text", selector: "summary" },
      ...caseLabels,
      ...defaultLabel,
    ],
    attrs: {
      text: sharedTextAttrs(),
      body: {
        fill: "var(--aircas-color-panel-background)",
        stroke: "var(--aircas-color-accent-purple)",
        strokeWidth: 1.6,
        rx: 10,
        ry: 10,
      },
      header: {
        x: 0,
        y: 0,
        width: SWITCH_W,
        height: SWITCH_HEADER_H,
        fill: "var(--aircas-color-accent-purple-fill)",
        stroke: "var(--aircas-color-transparent)",
        rx: 10,
        ry: 10,
      },
      title: {
        x: SWITCH_W / 2,
        y: 24,
        text: "Switch 分支",
        fill: "var(--aircas-color-accent-purple)",
        fontSize: 14,
        fontWeight: 700,
        textAnchor: "middle",
      },
      summary: {
        x: 14,
        y: SWITCH_HEADER_H + 24,
        text: `按 ${truncateRuleFlowText(switchOnText || "未配置变量", 20)} 分发`,
        fill: "var(--aircas-color-text-secondary)",
        fontSize: 12,
      },
      ...caseLabelAttrs,
    },
    ports: {
      groups: portGroups(),
      items: ports.map((item) => createPortItem(item.id, item.args.x, item.args.y, item.group)),
    },
  });
  pushOrAddCell(ctx, cell);
}

/**
 * @description 添加规则流连线。
 * @param ctx 图上下文。
 * @param wire 连线端点。
 */
export function addGraphEdge(
  ctx: ScheduleRuleGraphCellContext,
  wire: {
    sourceId: string;
    sourcePort: string;
    targetId: string;
    targetPort: string;
  },
): void {
  if (!ctx.graph) return;
  const label = edgeLabelForSourcePort(ctx, wire.sourceId, wire.sourcePort);
  const cell = ctx.graph.createEdge({
    source: { cell: wire.sourceId, port: wire.sourcePort },
    target: { cell: wire.targetId, port: wire.targetPort },
    router: { name: "manhattan", args: { padding: 18 } },
    connector: { name: "rounded", args: { radius: 8 } },
    connectionPoint: "anchor",
    attrs: createEdgeAttrs(edgeColorForSourcePort(wire.sourcePort)),
    labels: label ? createEdgeLabelConfig(label) : [],
    zIndex: 0,
  });
  pushOrAddCell(ctx, cell);
}
