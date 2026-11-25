export interface IntelligenceTaskTheme {
  id: string;
  taskCode?: string;
  title: string;
  region: string;
  description: string;
  counts: { target: number; sea: number; air: number; land: number; event: number };
  category: string;
  period: string;
  spaceId?: number | null;
  points?: [number, number][];
}

export interface IntelligenceTaskEvent {
  id: string;
  name: string;
  status: string;
  time: string;
  progress: string;
  location: string;
  coordinates: string;
  sourceType: string;
  sourcePlatform: string;
  confidence: number;
  description: string;
  targets: { name: string; category: string }[];
}
