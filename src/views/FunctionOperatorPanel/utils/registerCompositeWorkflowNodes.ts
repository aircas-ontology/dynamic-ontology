import LogicFlow, { RectNode, RectNodeModel } from "@logicflow/core";

import type { CompositeWorkflowNodeKind } from "@/types";

import { isCompositeWorkflowInputAnchorId, isCompositeWorkflowOutputAnchorId } from "./compositeWorkflowAnchors.ts";

/** LogicFlow 节点 type 常量。 */
export const COMPOSITE_WORKFLOW_LF_NODE_TYPES = {
  function: "composite-function",
  loop: "composite-loop",
  branch: "composite-branch",
  transform: "composite-transform",
} as const;

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
  return "#6b7a99";
}

/**
 * @description 向 LogicFlow 注册编排四类矩形节点（普通左入右出；branch 右双出）。
 * @param lf LogicFlow 实例。
 */
export function registerCompositeWorkflowNodes(lf: LogicFlow): void {
  /**
   * @description 注册单类矩形节点。
   * @param type LF type。
   * @param withBranchAnchors 是否使用分支双出锚点。
   */
  function registerRectNodeType(type: string, withBranchAnchors: boolean): void {
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
            strokeWidth: 2,
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
            overflowMode: "ellipsis" as const,
            lineHeight: 1.3,
            wrapPadding: "4px 8px",
          };
        }

        /**
         * @description 左入右出；分支节点右侧 true/false 双出。
         * @returns 锚点配置。
         */
        getDefaultAnchor() {
          const { x, y, width, id } = this;
          const inputAnchor = { x: x - width / 2, y, id: `${id}_in` };
          if (withBranchAnchors) {
            return [inputAnchor, { x: x + width / 2, y: y - 14, id: `${id}_out_true` }, { x: x + width / 2, y: y + 14, id: `${id}_out_false` }];
          }
          return [inputAnchor, { x: x + width / 2, y, id: `${id}_out` }];
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

  registerRectNodeType(COMPOSITE_WORKFLOW_LF_NODE_TYPES.function, false);
  registerRectNodeType(COMPOSITE_WORKFLOW_LF_NODE_TYPES.loop, false);
  registerRectNodeType(COMPOSITE_WORKFLOW_LF_NODE_TYPES.transform, false);
  registerRectNodeType(COMPOSITE_WORKFLOW_LF_NODE_TYPES.branch, true);
}
