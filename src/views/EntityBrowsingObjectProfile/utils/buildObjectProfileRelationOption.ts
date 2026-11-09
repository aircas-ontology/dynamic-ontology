import type { EntityBrowsingObjectProfileRelationNode } from "@/types";

/** 关系图使用的主题颜色。 */
interface ObjectProfileRelationColors {
  primary: string;
  background: string;
  border: string;
  text: string;
}

/**
 * @description 生成画像关系图的节点、连线及二维视图外观。
 * @param centerName 中心对象名称。
 * @param nodes 当前关系节点。
 * @param colors 当前主题颜色。
 * @returns 可传入图表实例的关系图配置。
 */
export function buildObjectProfileRelationOption(
  centerName: string,
  nodes: readonly EntityBrowsingObjectProfileRelationNode[],
  colors: ObjectProfileRelationColors,
) {
  return {
    series: [
      {
        type: "graph" as const,
        layout: "force" as const,
        roam: true,
        draggable: true,
        label: { show: true, position: "bottom" as const, color: colors.text, fontSize: 12, fontWeight: 600 as const },
        lineStyle: { color: colors.primary, width: 1.6, type: "dashed" as const, opacity: 0.9 },
        data: [
          {
            id: "center",
            name: centerName,
            symbolSize: 32,
            draggable: true,
            itemStyle: { color: colors.primary, borderColor: colors.primary, borderWidth: 2 },
          },
          ...nodes.map((node) => ({
            id: node.id,
            name: node.name,
            symbolSize: 22,
            draggable: true,
            itemStyle: { color: colors.background, borderColor: colors.border, borderWidth: 1.2 },
          })),
        ],
        links: nodes.map((node) => ({ source: "center", target: node.id })),
        force: { repulsion: 320, edgeLength: 118 },
      },
    ],
  };
}
