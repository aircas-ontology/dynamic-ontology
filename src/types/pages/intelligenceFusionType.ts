export interface IntelligenceTaskTheme {
  id: string;
  title: string;
  region: string;
  description: string;
  counts: { target: number; sea: number; air: number; land: number; event: number };
  category: string;
  period: string;
  spaceId?: number | null;
  points?: [number, number][];
}
