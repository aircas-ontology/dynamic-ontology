import type { ImplicitRelationSummaryCard, ImplicitRelationTask } from "@/types";

/**
 * @description 汇总隐含关系挖掘页顶部的五张统计卡片。
 * @param tasks 关系发现任务列表。
 * @param savedCount 已保存关系数量。
 * @param ignoredCount 已忽略关系数量。
 * @returns 按原型顺序排列的统计卡片。
 */
export function summarizeImplicitRelations(tasks: ImplicitRelationTask[], savedCount = 0, ignoredCount = 0): ImplicitRelationSummaryCard[] {
  const discovered = tasks.reduce((total, task) => total + task.implicitCount, 0);
  const pending = Math.max(0, discovered - savedCount - ignoredCount);
  return [
    {
      key: "tasks",
      label: "发现任务",
      count: tasks.length,
      unit: "个",
      description: "当前保留的关系发现任务",
      tone: "cyan",
    },
    {
      key: "discovered",
      label: "发现关系",
      count: discovered,
      unit: "条",
      description: "发现结果与已保存关系去重统计",
      tone: "purple",
    },
    {
      key: "pending",
      label: "待校验关系",
      count: pending,
      unit: "条",
      description: "含新增证据需再次校验的关系",
      tone: "orange",
    },
    {
      key: "saved",
      label: "已保存关系",
      count: savedCount,
      unit: "条",
      description: "已保存至关系数据的关系",
      tone: "green",
    },
    {
      key: "ignored",
      label: "已忽略关系",
      count: ignoredCount,
      unit: "条",
      description: "当前已忽略，可取消忽略的关系",
      tone: "gray",
    },
  ];
}
