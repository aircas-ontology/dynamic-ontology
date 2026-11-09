import type { EntityBrowseOverview, EntityBrowseOverviewMockData } from "@/types";

/**
 * @description 将实体浏览 Mock 原始数据映射为顶部统计与质量卡片。
 * @param data Mock 原始数据。
 * @returns 页面可直接渲染的概览结构。
 */
export function mapEntityBrowseOverview(data: EntityBrowseOverviewMockData): EntityBrowseOverview {
  return {
    statistics: [
      { id: "ontology", label: "对象数量", value: data.ontologyCount, icon: "Box" },
      { id: "relation", label: "关系数量", value: data.relationCount, icon: "Share" },
      { id: "entity", label: "实体数量", value: data.entityCount, icon: "Connection" },
    ],
    quality: [
      {
        id: "resilience",
        label: "韧性标准应用数",
        value: data.resilienceStandardCount,
        displayValue: data.resilienceStandardCount.toLocaleString("zh-CN"),
        icon: "Medal",
      },
      {
        id: "attributeFill",
        label: "属性填充率",
        value: data.attributeFillRate,
        displayValue: `${data.attributeFillRate}%`,
        icon: "DataLine",
      },
    ],
  };
}
