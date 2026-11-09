import type { EntityBrowsingObjectProfileStatsData } from "@/types";

/** 阿利·伯克级实体统计 Mock（贴合舰船统计示意）。 */
export const burkeEntityBrowsingObjectProfileStatsMock: EntityBrowsingObjectProfileStatsData = {
  title: "舰船统计",
  configPie: [
    { name: "Flight I", value: 21 },
    { name: "Flight II", value: 7 },
    { name: "Flight IIA", value: 45 },
    { name: "Flight III", value: 1 },
  ],
  serviceBar: {
    categories: ["1995", "2000", "2005", "2010", "2015", "2020", "2025"],
    values: [4, 9, 12, 11, 15, 16, 8],
  },
  homePortBar: {
    categories: ["诺福克", "梅波特", "圣迭戈", "横须贺", "珍珠港", "埃弗雷特", "罗塔", "巴林"],
    values: [18, 8, 14, 10, 7, 5, 4, 3],
  },
  statusPie: [
    { name: "服役中", value: 74 },
    { name: "建造已获批", value: 8 },
    { name: "建造中", value: 6 },
    { name: "试验中", value: 2 },
    { name: "即期交付", value: 3 },
    { name: "已退役", value: 4 },
  ],
  manufacturerBar: {
    categories: ["巴斯钢铁厂", "英格尔斯造船厂"],
    values: [36, 42],
  },
  launchBar: {
    categories: ["1995", "2000", "2005", "2010", "2015", "2020", "2025"],
    values: [6, 12, 16, 18, 14, 11, 5],
  },
};

/**
 * @description 解析对象画像实体统计数据；当前统一回落伯克级 Mock。
 * @param _objectId 对象 id（预留按对象切换）。
 */
export function resolveEntityBrowsingObjectProfileStats(_objectId: string): EntityBrowsingObjectProfileStatsData {
  return burkeEntityBrowsingObjectProfileStatsMock;
}
