export interface TaskTopicItem {
  id: string | number;
  taskName: string;
  taskType: string;
  taskRegion: string;
  regionPoint: string;
  startTime: string;
  endTime: string;
  description: string;
  ontologySpace: string;
  status: number;
  creator?: string;
  createTime: string;
  targetCount: number;
  seaCount: number;
  airCount: number;
  landCount: number;
  eventCount: number;
}

/** 任务主题详情中的事件阶段。 */
export interface TaskTopicEventStage {
  id: string | number;
  taskCode: string | number;
  stageName: string;
  startTime: string;
  endTime: string;
  eventCount: number;
  eventCodes: string;
}

/** 任务主题详情。 */
export interface TaskTopicDetail {
  id: string | number;
  taskName: string;
  taskType: string;
  taskRegion: string;
  regionPoint: string;
  startTime: string;
  endTime: string;
  description: string;
  ontologySpace: string;
  eventStages: TaskTopicEventStage[];
}

export type TaskTopicCreateParams = Omit<
  TaskTopicItem,
  "id" | "taskCode" | "createTime" | "targetCount" | "seaCount" | "airCount" | "landCount" | "eventCount"
>;
export type TaskTopicUpdateParams = TaskTopicCreateParams & { id: string | number };

export interface TaskTopicDictionaryItem {
  id: string | number;
  dictName: string;
}
