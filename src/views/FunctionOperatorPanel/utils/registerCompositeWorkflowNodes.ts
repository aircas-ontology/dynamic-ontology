import LogicFlow, { DiamondNode, DiamondNodeModel, h, PolylineEdge, PolylineEdgeModel, RectNode, RectNodeModel } from "@logicflow/core";

import type { CompositeWorkflowNodeKind, CompositeWorkflowSwitchCaseItem } from "@/types";

import {
  buildCompositeWorkflowSwitchCaseOutletAnchorId,
  buildCompositeWorkflowSwitchDefaultOutletAnchorId,
  isCompositeWorkflowInputAnchorId,
  isCompositeWorkflowOutputAnchorId,
} from "./compositeWorkflowAnchors.ts";
import { normalizeCompositeWorkflowSwitchConfig } from "./compositeWorkflowSwitchDefaults.ts";

/** LogicFlow 节点 type 常量。 */
export const COMPOSITE_WORKFLOW_LF_NODE_TYPES = {
  function: "composite-function",
  loop: "composite-loop",
  branch: "composite-branch",
  transform: "composite-transform",
  switch: "composite-switch",
} as const;

/** Switch 节点出口垂直间距。 */
const SWITCH_OUTLET_SPACING = 28;
/** Switch 节点最小高度。 */
const SWITCH_MIN_HEIGHT = 64;
/** Switch 节点宽度。 */
const SWITCH_NODE_WIDTH = 200;

/**
 * @description 从节点属性读取 Switch cases。
 * @param properties 节点 properties。
 * @returns case 列表。
 */
function readSwitchCasesFromProperties(properties: Record<string, unknown>): CompositeWorkflowSwitchCaseItem[] {
  return normalizeCompositeWorkflowSwitchConfig(properties.switchConfig).cases;
}

/**
 * @description 按 case 数计算 Switch 节点高度（含 default 出口）。
 * @param caseCount case 数量。
 * @returns 高度。
 */
function resolveSwitchNodeHeight(caseCount: number): number {
  const outletCount = Math.max(caseCount, 1) + 1;
  return Math.max(SWITCH_MIN_HEIGHT, 24 + outletCount * SWITCH_OUTLET_SPACING);
}

/**
 * @description 由业务 kind 解析 LogicFlow 节点 type。
 * @param kind 业务节点 kind。
 * @returns LF type。
 */
export function resolveCompositeWorkflowLfNodeType(kind: CompositeWorkflowNodeKind): string {
  return COMPOSITE_WORKFLOW_LF_NODE_TYPES[kind];
}

/**
 * @description 按 kind 解析节点描边色（使用实色，避免 SVG 对 CSS 变量解析失败导致不可见）。
 * @param kind 业务 kind。
 * @returns stroke 颜色。
 */
function resolveCompositeWorkflowNodeStroke(kind: unknown): string {
  if (kind === "function") {
    return "#409eff";
  }
  if (kind === "branch") {
    return "#e6a23c";
  }
  if (kind === "switch") {
    return "#67c23a";
  }
  if (kind === "loop") {
    return "#909399";
  }
  return "#6b7a99";
}

/**
 * @description 选中时加粗节点自身描边（不额外画外围 outline）。
 * @param selected 是否选中。
 * @returns strokeWidth。
 */
function resolveCompositeWorkflowNodeStrokeWidth(selected: boolean): number {
  return selected ? 3.5 : 2;
}

/**
 * @description 向 LogicFlow 注册编排节点（普通矩形左入右出；循环双出口；分支菱形；Switch 多出口矩形）。
 * @param lf LogicFlow 实例。
 */
export function registerCompositeWorkflowNodes(lf: LogicFlow): void {
  /**
   * @description 注册单类矩形节点。
   * @param type LF type。
   */
  function registerRectNodeType(type: string): void {
    lf.register(type, () => {
      class CompositeRectModel extends RectNodeModel {
        /**
         * @description 初始化尺寸与不可编辑文本。
         */
        initNodeData(data: LogicFlow.NodeConfig): void {
          super.initNodeData(data);
          this.width = 180;
          this.height = 64;
          this.radius = 8;
          this.text.editable = false;
          this.text.draggable = false;
        }

        /**
         * @description 按 kind 区分描边色。
         * @returns 节点样式。
         */
        getNodeStyle() {
          const style = super.getNodeStyle();
          const kind = (this.properties as Record<string, unknown>).kind;
          return {
            ...style,
            fill: "#1a2236",
            stroke: resolveCompositeWorkflowNodeStroke(kind),
            strokeWidth: resolveCompositeWorkflowNodeStrokeWidth(this.isSelected),
            radius: 8,
          };
        }

        /**
         * @description 文本样式适配暗色面板；autoWrap 使多行文案在节点内垂直居中。
         * @returns 文本样式。
         */
        getTextStyle() {
          const style = super.getTextStyle();
          return {
            ...style,
            color: "#e8eefc",
            fontSize: 12,
            overflowMode: "autoWrap" as const,
            lineHeight: 1.3,
            wrapPadding: "4px 8px",
          };
        }

        /**
         * @description 左入右出锚点。
         * @returns 锚点配置。
         */
        getDefaultAnchor() {
          const { x, y, width, id } = this;
          return [
            { x: x - width / 2, y, id: `${id}_in` },
            { x: x + width / 2, y, id: `${id}_out` },
          ];
        }

        /**
         * @description 仅允许从输出锚点拉出连线。
         * @returns 作为 source 的连接规则。
         */
        getConnectedSourceRules() {
          const rules = super.getConnectedSourceRules();
          rules.push({
            message: "只能从右侧输出锚点连出",
            validate: (_source, _target, sourceAnchor) => isCompositeWorkflowOutputAnchorId(sourceAnchor?.id),
          });
          return rules;
        }

        /**
         * @description 仅允许连入左侧输入锚点。
         * @returns 作为 target 的连接规则。
         */
        getConnectedTargetRules() {
          const rules = super.getConnectedTargetRules();
          rules.push({
            message: "只能连到左侧输入锚点",
            validate: (_source, _target, _sourceAnchor, targetAnchor) => isCompositeWorkflowInputAnchorId(targetAnchor?.id),
          });
          return rules;
        }
      }

      return {
        view: RectNode,
        model: CompositeRectModel,
      };
    });
  }

  /**
   * @description 注册条件分支菱形节点：左入、右 true、下 false，并在出口旁标注文字。
   */
  function registerBranchDiamondNodeType(): void {
    lf.register(COMPOSITE_WORKFLOW_LF_NODE_TYPES.branch, () => {
      class CompositeBranchDiamondModel extends DiamondNodeModel {
        /**
         * @description 初始化菱形尺寸与不可编辑文本。
         */
        initNodeData(data: LogicFlow.NodeConfig): void {
          super.initNodeData(data);
          this.rx = 90;
          this.ry = 56;
          this.text.editable = false;
          this.text.draggable = false;
        }

        /**
         * @description 设置菱形半径属性。
         */
        setAttributes(): void {
          super.setAttributes();
          this.rx = 90;
          this.ry = 56;
        }

        /**
         * @description 条件分支橙色描边。
         * @returns 节点样式。
         */
        getNodeStyle() {
          const style = super.getNodeStyle();
          return {
            ...style,
            fill: "#1a2236",
            stroke: resolveCompositeWorkflowNodeStroke("branch"),
            strokeWidth: resolveCompositeWorkflowNodeStrokeWidth(this.isSelected),
          };
        }

        /**
         * @description 文本样式适配暗色面板；autoWrap 使多行文案在节点内垂直居中。
         * @returns 文本样式。
         */
        getTextStyle() {
          const style = super.getTextStyle();
          return {
            ...style,
            color: "#e8eefc",
            fontSize: 12,
            overflowMode: "autoWrap" as const,
            lineHeight: 1.3,
            wrapPadding: "4px 8px",
          };
        }

        /**
         * @description 左入、右 true、下 false。
         * @returns 锚点配置。
         */
        getDefaultAnchor() {
          const { x, y, rx, ry, id } = this;
          return [
            { x: x - rx, y, id: `${id}_in` },
            { x: x + rx, y, id: `${id}_out_true` },
            { x, y: y + ry, id: `${id}_out_false` },
          ];
        }

        /**
         * @description 仅允许从右侧/下侧输出锚点拉出连线。
         * @returns 作为 source 的连接规则。
         */
        getConnectedSourceRules() {
          const rules = super.getConnectedSourceRules();
          rules.push({
            message: "只能从右侧/下侧输出锚点连出",
            validate: (_source, _target, sourceAnchor) => isCompositeWorkflowOutputAnchorId(sourceAnchor?.id),
          });
          return rules;
        }

        /**
         * @description 仅允许连入左侧输入锚点。
         * @returns 作为 target 的连接规则。
         */
        getConnectedTargetRules() {
          const rules = super.getConnectedTargetRules();
          rules.push({
            message: "只能连到左侧输入锚点",
            validate: (_source, _target, _sourceAnchor, targetAnchor) => isCompositeWorkflowInputAnchorId(targetAnchor?.id),
          });
          return rules;
        }
      }

      /**
       * @description 菱形视图：在右侧/下侧出口旁绘制 true / false 标注。
       */
      class CompositeBranchDiamondView extends DiamondNode {
        /**
         * @description 绘制菱形与出口文字；文字不拦截锚点拖线。
         * @returns 节点 SVG 形状。
         */
        getShape() {
          const { model } = this.props;
          const { x, y, rx, ry } = model;
          const labelStyle = {
            fill: "#e8eefc",
            fontSize: 11,
            "pointer-events": "none",
          };
          return h("g", {}, [
            super.getShape(),
            h(
              "text",
              {
                ...labelStyle,
                x: x + rx + 6,
                y: y - 4,
              },
              "true",
            ),
            h(
              "text",
              {
                ...labelStyle,
                x,
                y: y + ry + 14,
                "text-anchor": "middle",
              },
              "false",
            ),
          ]);
        }
      }

      return {
        view: CompositeBranchDiamondView,
        model: CompositeBranchDiamondModel,
      };
    });
  }

  /**
   * @description 注册循环矩形节点：左入、右 body、下 done，并在出口旁标注文字。
   */
  function registerLoopRectNodeType(): void {
    lf.register(COMPOSITE_WORKFLOW_LF_NODE_TYPES.loop, () => {
      class CompositeLoopRectModel extends RectNodeModel {
        /**
         * @description 初始化尺寸与不可编辑文本。
         */
        initNodeData(data: LogicFlow.NodeConfig): void {
          super.initNodeData(data);
          this.width = 180;
          this.height = 72;
          this.radius = 8;
          this.text.editable = false;
          this.text.draggable = false;
        }

        /**
         * @description 循环灰色描边。
         * @returns 节点样式。
         */
        getNodeStyle() {
          const style = super.getNodeStyle();
          return {
            ...style,
            fill: "#1a2236",
            stroke: resolveCompositeWorkflowNodeStroke("loop"),
            strokeWidth: resolveCompositeWorkflowNodeStrokeWidth(this.isSelected),
            radius: 8,
          };
        }

        /**
         * @description 文本样式适配暗色面板。
         * @returns 文本样式。
         */
        getTextStyle() {
          const style = super.getTextStyle();
          return {
            ...style,
            color: "#e8eefc",
            fontSize: 12,
            overflowMode: "autoWrap" as const,
            lineHeight: 1.3,
            wrapPadding: "4px 8px",
          };
        }

        /**
         * @description 左入、右 body、下 done。
         * @returns 锚点配置。
         */
        getDefaultAnchor() {
          const { x, y, width, height, id } = this;
          return [
            { x: x - width / 2, y, id: `${id}_in` },
            { x: x + width / 2, y, id: `${id}_out_body` },
            { x, y: y + height / 2, id: `${id}_out_done` },
          ];
        }

        /**
         * @description 仅允许从右侧/下侧输出锚点拉出连线。
         * @returns 作为 source 的连接规则。
         */
        getConnectedSourceRules() {
          const rules = super.getConnectedSourceRules();
          rules.push({
            message: "只能从右侧/下侧输出锚点连出",
            validate: (_source, _target, sourceAnchor) => isCompositeWorkflowOutputAnchorId(sourceAnchor?.id),
          });
          return rules;
        }

        /**
         * @description 仅允许连入左侧输入锚点。
         * @returns 作为 target 的连接规则。
         */
        getConnectedTargetRules() {
          const rules = super.getConnectedTargetRules();
          rules.push({
            message: "只能连到左侧输入锚点",
            validate: (_source, _target, _sourceAnchor, targetAnchor) => isCompositeWorkflowInputAnchorId(targetAnchor?.id),
          });
          return rules;
        }
      }

      /**
       * @description 循环视图：在右侧/下侧出口旁绘制「循环体 / 结束后」标注。
       */
      class CompositeLoopRectView extends RectNode {
        /**
         * @description 绘制矩形与出口文字；文字不拦截锚点拖线。
         * @returns 节点 SVG 形状。
         */
        getShape() {
          const { model } = this.props;
          const { x, y, width, height } = model;
          const labelStyle = {
            fill: "#e8eefc",
            fontSize: 11,
            "pointer-events": "none",
          };
          return h("g", {}, [
            super.getShape(),
            h(
              "text",
              {
                ...labelStyle,
                x: x + width / 2 + 6,
                y: y - 4,
              },
              "循环体",
            ),
            h(
              "text",
              {
                ...labelStyle,
                x,
                y: y + height / 2 + 14,
                "text-anchor": "middle",
              },
              "结束后",
            ),
          ]);
        }
      }

      return {
        view: CompositeLoopRectView,
        model: CompositeLoopRectModel,
      };
    });
  }

  /**
   * @description 注册 Switch Case 矩形：左入、右侧 case… + default，高度随 case 数伸缩。
   */
  function registerSwitchRectNodeType(): void {
    lf.register(COMPOSITE_WORKFLOW_LF_NODE_TYPES.switch, () => {
      class CompositeSwitchRectModel extends RectNodeModel {
        /**
         * @description 初始化尺寸与不可编辑文本。
         */
        initNodeData(data: LogicFlow.NodeConfig): void {
          super.initNodeData(data);
          const cases = readSwitchCasesFromProperties((data.properties ?? {}) as Record<string, unknown>);
          this.width = SWITCH_NODE_WIDTH;
          this.height = resolveSwitchNodeHeight(cases.length);
          this.radius = 8;
          this.text.editable = false;
          this.text.draggable = false;
        }

        /**
         * @description 按 switchConfig.cases 刷新高度。
         */
        setAttributes(): void {
          super.setAttributes();
          const cases = readSwitchCasesFromProperties(this.properties as Record<string, unknown>);
          this.width = SWITCH_NODE_WIDTH;
          this.height = resolveSwitchNodeHeight(cases.length);
        }

        /**
         * @description Switch 绿色描边。
         * @returns 节点样式。
         */
        getNodeStyle() {
          const style = super.getNodeStyle();
          return {
            ...style,
            fill: "#1a2236",
            stroke: resolveCompositeWorkflowNodeStroke("switch"),
            strokeWidth: resolveCompositeWorkflowNodeStrokeWidth(this.isSelected),
            radius: 8,
          };
        }

        /**
         * @description 文本样式适配暗色面板。
         * @returns 文本样式。
         */
        getTextStyle() {
          const style = super.getTextStyle();
          return {
            ...style,
            color: "#e8eefc",
            fontSize: 12,
            overflowMode: "autoWrap" as const,
            lineHeight: 1.3,
            wrapPadding: "4px 8px",
          };
        }

        /**
         * @description 左入；右侧自上而下为各 case 与 default。
         * @returns 锚点配置。
         */
        getDefaultAnchor() {
          const { x, y, width, height, id } = this;
          const cases = readSwitchCasesFromProperties(this.properties as Record<string, unknown>);
          const outletCount = Math.max(cases.length, 1) + 1;
          const top = y - height / 2;
          const anchors: Array<{ x: number; y: number; id: string }> = [{ x: x - width / 2, y, id: `${id}_in` }];
          for (let index = 0; index < cases.length; index += 1) {
            const caseItem = cases[index];
            if (!caseItem) {
              continue;
            }
            const outletY = top + ((index + 1) / (outletCount + 1)) * height;
            anchors.push({
              x: x + width / 2,
              y: outletY,
              id: buildCompositeWorkflowSwitchCaseOutletAnchorId(id, caseItem.id),
            });
          }
          const defaultIndex = cases.length;
          const defaultY = top + ((defaultIndex + 1) / (outletCount + 1)) * height;
          anchors.push({
            x: x + width / 2,
            y: defaultY,
            id: buildCompositeWorkflowSwitchDefaultOutletAnchorId(id),
          });
          return anchors;
        }

        /**
         * @description 仅允许从右侧输出锚点拉出连线。
         * @returns 作为 source 的连接规则。
         */
        getConnectedSourceRules() {
          const rules = super.getConnectedSourceRules();
          rules.push({
            message: "只能从右侧输出锚点连出",
            validate: (_source, _target, sourceAnchor) => isCompositeWorkflowOutputAnchorId(sourceAnchor?.id),
          });
          return rules;
        }

        /**
         * @description 仅允许连入左侧输入锚点。
         * @returns 作为 target 的连接规则。
         */
        getConnectedTargetRules() {
          const rules = super.getConnectedTargetRules();
          rules.push({
            message: "只能连到左侧输入锚点",
            validate: (_source, _target, _sourceAnchor, targetAnchor) => isCompositeWorkflowInputAnchorId(targetAnchor?.id),
          });
          return rules;
        }
      }

      /**
       * @description Switch 视图：在右侧出口旁绘制 case 值与 default。
       */
      class CompositeSwitchRectView extends RectNode {
        /**
         * @description 绘制矩形与出口标注。
         * @returns 节点 SVG 形状。
         */
        getShape() {
          const { model } = this.props;
          const { x, y, width, height, id } = model;
          const cases = readSwitchCasesFromProperties(model.getProperties() as Record<string, unknown>);
          const outletCount = Math.max(cases.length, 1) + 1;
          const top = y - height / 2;
          const right = x + width / 2;
          const labelStyle = {
            fill: "#e8eefc",
            fontSize: 11,
            "pointer-events": "none",
          };
          const labels = cases.map((caseItem, index) => {
            const outletY = top + ((index + 1) / (outletCount + 1)) * height;
            const text = caseItem.value.trim() || "case";
            return h(
              "text",
              {
                ...labelStyle,
                x: right + 6,
                y: outletY + 4,
              },
              text,
            );
          });
          const defaultY = top + ((cases.length + 1) / (outletCount + 1)) * height;
          labels.push(
            h(
              "text",
              {
                ...labelStyle,
                x: right + 6,
                y: defaultY + 4,
              },
              "default",
            ),
          );
          return h("g", { key: id }, [super.getShape(), ...labels]);
        }
      }

      return {
        view: CompositeSwitchRectView,
        model: CompositeSwitchRectModel,
      };
    });
  }

  /**
   * @description 覆盖默认折线：选中时加粗加亮边自身描边（不依赖外围 outline）。
   */
  function registerCompositeWorkflowPolylineEdge(): void {
    lf.register("polyline", () => {
      class CompositeWorkflowPolylineModel extends PolylineEdgeModel {
        /**
         * @description 未选中灰色细线；选中时亮蓝加粗。
         * @returns 边样式。
         */
        getEdgeStyle() {
          const style = super.getEdgeStyle();
          if (this.isSelected) {
            return {
              ...style,
              stroke: "#79bbff",
              strokeWidth: 3,
            };
          }
          return {
            ...style,
            stroke: "#6b7a99",
            strokeWidth: 2,
          };
        }
      }

      return {
        view: PolylineEdge,
        model: CompositeWorkflowPolylineModel,
      };
    });
  }

  registerRectNodeType(COMPOSITE_WORKFLOW_LF_NODE_TYPES.function);
  registerRectNodeType(COMPOSITE_WORKFLOW_LF_NODE_TYPES.transform);
  registerLoopRectNodeType();
  registerBranchDiamondNodeType();
  registerSwitchRectNodeType();
  registerCompositeWorkflowPolylineEdge();
}
