export type EventDisplayTargetCountry = "美国" | "日本";
export type EventDisplayTargetCategory = "舰船目标" | "空中目标";

export interface EventDisplayTarget {
  id: string;
  name: string;
  country: EventDisplayTargetCountry;
  category: EventDisplayTargetCategory;
  type: string;
  coordinates: [number, number];
}

export interface EventDisplayEvent {
  id: string;
  time: string;
  title: string;
  description: string;
  coordinates: [number, number];
}
