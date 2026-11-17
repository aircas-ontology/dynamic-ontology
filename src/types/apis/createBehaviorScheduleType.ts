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

/** 规则操作数，变量按唯一标识取属性值；非 main 存储分组可带数据行主键。 */
export type ScheduleRuleOperand =
  | { type: "fixed"; fixValue: string }
  | {
      type: "dynamic";
      OntologyId: string;
      entityId: string;
      propertyId: string;
      /** 子表数据行主键；main 或空存储分组省略。 */
      dataPrimaryKey?: string | number | boolean | Record<string, unknown>;
    };

/** 条件项，连接符指向下一项。 */
export interface ScheduleRuleJudgeItem {
  leftOperate: ScheduleRuleOperand;
  rightOperate: ScheduleRuleOperand;
  condition: ScheduleRuleCompareOperator;
  /** 当前条件之前的左括号数量。 */
  isLeft?: number;
  /** 当前条件之后的右括号数量。 */
  isRight?: number;
  linkFlag?: "AND" | "OR";
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
