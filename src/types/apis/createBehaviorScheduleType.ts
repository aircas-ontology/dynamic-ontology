/** 周期调度任务配置。 */
export interface CreateBehaviorScheduleTask {
  /** 页面周期类型对应的接口枚举。 */
  periodType: "DAILY" | "WEEKLY" | "MONTHLY" | "CRON";
  taskCronExpression: string;
  /** 完整行为执行参数的 JSON 字符串。 */
  entityJson: string;
}

/** 行为调度创建参数。 */
export interface CreateTaskBehaviorScheduleParams {
  /** 对象空间 id。 */
  spaceId: number;
  /** 应用行为可省略，由后端从 linkMapping 推导。 */
  ontologyIdentifier?: string;
  actionApi: string;
  name: string;
  description: string;
  type: "TASK";
  task: CreateBehaviorScheduleTask;
}

/** 文档支持的比较运算符；CH 明确不支持。 */
export type ScheduleRuleCompareOperator = "LT" | "LE" | "EQ" | "NE" | "GT" | "GE" | "CONTAINS" | "NOT_CONTAINS";

/** 监测事件类型：新增 / 更新 / 删除；与属性比较同构时写在规则组上。 */
export type ScheduleRuleMonitorType = "insert" | "update" | "delete";

/** 规则操作数；`fixed` 用 fixValue，`dynamic` 按对象属性取值。 */
export type ScheduleRuleOperand =
  | { type: "fixed"; fixValue: string }
  | {
      type: "dynamic";
      OntologyId: string;
      /** 绑定具体实例；前端比较表单必填。 */
      entityId?: string;
      propertyId?: string;
      propertyName?: string;
      /** 历史监测载荷可能带存储分组；新同构比较项不传。 */
      storageGroup?: string;
      /** 子表数据行主键；main 或空存储分组省略。 */
      dataPrimaryKey?: string | number | boolean | Record<string, unknown>;
    };

/** 条件项：属性比较与监测同构，均需左右操作数与比较符；连接符指向下一项。 */
export interface ScheduleRuleJudgeItem {
  leftOperate: ScheduleRuleOperand;
  rightOperate?: ScheduleRuleOperand;
  condition?: ScheduleRuleCompareOperator;
  /** 当前条件之前的左括号数量。 */
  isLeft?: number;
  /** 当前条件之后的右括号数量。 */
  isRight?: number;
  linkFlag?: "AND" | "OR";
  /** 条件项级监测类型；与组级互斥且不得不一致。 */
  monitorType?: ScheduleRuleMonitorType;
}

/** 规则执行行为。 */
export interface ScheduleRuleActionParam {
  action_api: string;
  ontology_identifier?: string;
  entity_json: string;
}

/** 条件组合和命中行为；condition 为 true 时整体取反。 */
export interface ScheduleRuleJudgeGroup {
  condition: boolean;
  /** 组级监测事件；有值时 judgeParams 仍为属性比较同构。 */
  monitorType?: ScheduleRuleMonitorType;
  judgeParams: ScheduleRuleJudgeItem[];
  actionParam: ScheduleRuleActionParam;
}

/** 规则调度创建参数。 */
export interface CreateRuleBehaviorScheduleParams {
  spaceId: number;
  ontologyIdentifier?: string;
  actionApi: string;
  name: string;
  description: string;
  type: "RULE";
  rule: { judgeRules: ScheduleRuleJudgeGroup[]; flowDocument: string };
}

/** 行为调度创建请求，按类型区分周期和规则配置。 */
export type CreateBehaviorScheduleParams = CreateTaskBehaviorScheduleParams | CreateRuleBehaviorScheduleParams;
