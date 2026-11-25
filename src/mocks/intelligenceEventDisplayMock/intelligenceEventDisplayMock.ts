import type { EventDisplayEvent, EventDisplayTarget } from "@/types";

export const eventDisplayRelatedSpaces = ["陆军本体空间", "空军本体空间"];

export const eventDisplayTargets: EventDisplayTarget[] = [
  { id: "target-1", name: "杜威号驱逐舰", country: "美国", category: "舰船目标", type: "阿利·伯克级驱逐舰", coordinates: [33.4, 45.2] },
  { id: "target-2", name: "卡尔·文森号航空母舰", country: "美国", category: "舰船目标", type: "尼米兹级航空母舰", coordinates: [32.8, 44.6] },
  { id: "target-3", name: "提康德罗加号巡洋舰", country: "美国", category: "舰船目标", type: "提康德罗加级巡洋舰", coordinates: [34.6, 44.9] },
  { id: "target-4", name: "供应号补给舰", country: "美国", category: "舰船目标", type: "快速战斗支援舰", coordinates: [33.9, 44.1] },
  { id: "target-5", name: "美利坚号两栖攻击舰", country: "美国", category: "舰船目标", type: "美利坚级两栖攻击舰", coordinates: [31.9, 45.6] },
  { id: "target-6", name: "F/A-18E 超级大黄蜂", country: "美国", category: "空中目标", type: "舰载战斗机", coordinates: [35.2, 45.8] },
  { id: "target-7", name: "E-2D 鹰眼预警机", country: "美国", category: "空中目标", type: "舰载预警机", coordinates: [34.1, 46.2] },
  { id: "target-8", name: "P-8A 海神巡逻机", country: "美国", category: "空中目标", type: "海上巡逻机", coordinates: [36.3, 45.4] },
  { id: "target-9", name: "米利厄斯号驱逐舰", country: "美国", category: "舰船目标", type: "阿利·伯克级驱逐舰", coordinates: [32.2, 46.1] },
  { id: "target-10", name: "蓝岭号指挥舰", country: "美国", category: "舰船目标", type: "蓝岭级指挥舰", coordinates: [33.1, 45.9] },
  { id: "target-11", name: "出云号直升机驱逐舰", country: "日本", category: "舰船目标", type: "出云级", coordinates: [37.2, 44.3] },
  { id: "target-12", name: "加贺号直升机驱逐舰", country: "日本", category: "舰船目标", type: "出云级", coordinates: [37.8, 45.0] },
  { id: "target-13", name: "P-1 巡逻机", country: "日本", category: "空中目标", type: "海上巡逻机", coordinates: [36.9, 45.7] },
];

export const eventDisplayEvents: EventDisplayEvent[] = [
  {
    id: "event-1",
    time: "2026-09-20 06:00",
    title: "舰队编组识别",
    description: "识别到相关编组进入任务区域，建立初始目标清单。",
    coordinates: [33.8, 45.0],
  },
  {
    id: "event-2",
    time: "2026-09-20 06:20",
    title: "DDG-105 杜威号进入监视区",
    description: "关联杜威号历史航迹与当前目标位置，确认其进入任务区域。",
    coordinates: [33.4, 45.2],
  },
  {
    id: "event-3",
    time: "2026-09-20 06:40",
    title: "多源情报关联",
    description: "融合舰艇轨迹、空中巡逻和本体空间数据，形成任务关联研判。",
    coordinates: [34.0, 45.1],
  },
  {
    id: "event-4",
    time: "2026-09-20 07:00",
    title: "P-8A-207 巡逻轨迹确认",
    description: "确认海上巡逻机航迹与舰队活动方向一致，纳入当前任务态势。",
    coordinates: [36.3, 45.4],
  },
  {
    id: "event-5",
    time: "2026-09-20 07:20",
    title: "舰载预警机接力巡查",
    description: "预警机完成空域接力，扩大编队周边空情覆盖范围。",
    coordinates: [34.1, 46.2],
  },
  {
    id: "event-6",
    time: "2026-09-20 07:40",
    title: "航母编队航向修正",
    description: "航母编队小幅调整航向，保持与支援舰的协同距离。",
    coordinates: [32.8, 44.6],
  },
  {
    id: "event-7",
    time: "2026-09-20 08:00",
    title: "巡洋舰防空扇区展开",
    description: "巡洋舰建立外围防空扇区，更新编队防护态势。",
    coordinates: [34.6, 44.9],
  },
];
