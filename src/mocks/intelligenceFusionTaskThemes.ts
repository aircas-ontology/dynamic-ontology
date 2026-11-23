import type { IntelligenceTaskTheme } from "@/types";

export const intelligenceTaskThemes: IntelligenceTaskTheme[] = [
  {
    id: "task-1",
    title: "台湾地区“汉光42号”演习监测分析",
    region: "台湾岛",
    description:
      "围绕“汉光42号”备战部署、战力防护及保存、联合反登陆、纵深防御及持久作战四个阶段，复盘推演、M1A2T、海马斯、玄捷、天弓三型、爱国者等重点目标动机，研判台军…",
    counts: { target: 19, sea: 4, air: 4, land: 11, event: 5 },
    category: "演习演练",
    period: "2026-08-05 00:00 ~ 2026-08-14 23:59",
  },
  {
    id: "task-2",
    title: "防空反导拦截任务",
    region: "关岛周边",
    description: "针对来袭空中目标与巡航导弹，组织预警探测、威胁判定、拦截力量分配与拦截效果评估。",
    counts: { target: 11, sea: 0, air: 10, land: 1, event: 5 },
    category: "军事作战",
    period: "2026-09-23 08:00 ~ 2026-09-23 20:00",
  },
  {
    id: "task-3",
    title: "海上反舰打击任务",
    region: "东海海域",
    description: "跟踪重点水面舰艇编队，融合雷达、光电与电子侦察信息，形成目标指示并评估打击与毁伤效果。",
    counts: { target: 11, sea: 10, air: 0, land: 1, event: 5 },
    category: "军事作战",
    period: "2026-09-24 04:00 ~ 2026-09-25 04:00",
  },
];
