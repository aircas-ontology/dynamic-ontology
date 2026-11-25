export type ImplicitRelationProgress = "已完成" | "未发现";

export interface ImplicitRelationTask {
  id: string;
  nodeName: string;
  spaceName: string;
  relationTypes: string[];
  hops: number[];
  progress: ImplicitRelationProgress;
  implicitCount: number;
  updatedAt: string;
}

export type ImplicitRelationSummaryTone = "cyan" | "purple" | "orange" | "green" | "gray";

export type ImplicitRelationVerifyStatus = "已保存" | "待校验";

export interface ImplicitRelationVerificationRow {
  id: string;
  startNodeName: string;
  startNodeInstance: string;
  relationLabel: string;
  endNodeName: string;
  endNodeInstance: string;
  chainPath: string;
  chainSummary: string;
  status: ImplicitRelationVerifyStatus;
}

export interface ImplicitRelationSummaryCard {
  key: "tasks" | "discovered" | "pending" | "saved" | "ignored";
  label: string;
  count: number;
  unit: "个" | "条";
  description: string;
  tone: ImplicitRelationSummaryTone;
}
