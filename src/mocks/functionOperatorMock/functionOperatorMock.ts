import type {
  FunctionOperator,
  FunctionOperatorDraft,
  FunctionOperatorPage,
  FunctionOperatorQuery,
  FunctionOperatorStatus,
  FunctionOperatorTestResult,
} from "@/types";

const EMPTY_BASIC_PARAMETER_CONFIG = `${JSON.stringify(
  {
    logic: "AND",
    children: [
      {
        type: "FILTER",
        filter: {
          op: "EQ",
          propertyApiName: "",
          valueType: "string",
          value: "",
        },
      },
    ],
  },
  null,
  2,
)}\n`;

const BASIC_FILTER_EXAMPLE_CONFIG = {
  logic: "AND" as const,
  children: [
    {
      type: "FILTER" as const,
      filter: {
        op: "EQ" as const,
        propertyApiName: "Country",
        valueType: "string" as const,
        value: "美国",
      },
    },
    {
      type: "GROUP" as const,
      group: {
        logic: "OR" as const,
        children: [
          {
            type: "FILTER" as const,
            filter: {
              op: "IS_NOT_NULL" as const,
              propertyApiName: "Height",
              valueType: "number" as const,
            },
          },
          {
            type: "FILTER" as const,
            filter: {
              op: "BETWEEN" as const,
              propertyApiName: "Length",
              valueType: "number" as const,
              values: [1, 100],
            },
          },
        ],
      },
    },
  ],
};

const store = new Map<number, FunctionOperator[]>();

/**
 * @description 生成当前时间戳文案。
 * @returns `YYYY-MM-DD HH:mm` 格式时间。
 */
function stampNow(): string {
  const date = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * @description 深拷贝函数算子，避免调用方修改 Mock 内存态。
 * @param operator 源算子。
 * @returns 拷贝后的算子。
 */
function cloneOperator(operator: FunctionOperator): FunctionOperator {
  return structuredClone(operator);
}

/**
 * @description 创建指定空间的默认基础函数样例列表。
 * @param spaceId 空间 id。
 * @returns 基础函数算子列表。
 */
function createSeedOperators(spaceId: number): FunctionOperator[] {
  const filterConfig = JSON.stringify(BASIC_FILTER_EXAMPLE_CONFIG, null, 2);
  return [
    {
      id: `function-${spaceId}-basic-filter-ddg`,
      spaceId,
      name: "驱逐舰属性筛选基础函数",
      functionApi: "ddg_property_filter",
      type: "basic",
      protocol: "HTTP",
      category: "基础操作",
      version: "v1.0.0",
      description: "按国家、高度、长度等条件筛选驱逐舰相关对象属性。",
      createdBy: "系统管理员",
      updatedAt: "2026-09-21 09:20",
      status: "published",
      inputParameters: [{ id: `in-${spaceId}-1`, name: "objectId", type: "string", required: true, description: "对象唯一标识" }],
      outputParameters: [{ id: `out-${spaceId}-1`, name: "matched", type: "boolean", required: true, description: "是否命中筛选条件" }],
      timeout: 5000,
      retryCount: 0,
      retryInterval: 0,
      definition: {
        kind: "basic",
        parameterConfig: filterConfig,
        basicAction: "update",
        objectId: "obj-ddg-105",
        objectName: "驱逐舰 DDG-105",
      },
      dependencies: [],
      testStatus: "passed",
      testedAt: "2026-09-21 09:20",
      versions: [
        {
          id: `ver-${spaceId}-1`,
          version: "v1.0.0",
          status: "published",
          createdAt: "2026-09-21 09:20",
          createdBy: "系统管理员",
          changeLog: "初始版本",
        },
      ],
    },
    {
      id: `function-${spaceId}-basic-create-ship`,
      spaceId,
      name: "新增舰船基础函数",
      functionApi: "create_ship_basic",
      type: "basic",
      protocol: "HTTP",
      category: "基础操作",
      version: "v1.0.0",
      description: "执行新增舰船对象的基础操作。",
      createdBy: "admin",
      updatedAt: "2026-09-20 14:10",
      status: "draft",
      inputParameters: [{ id: `in-${spaceId}-2`, name: "payload", type: "object", required: true, description: "创建参数" }],
      outputParameters: [{ id: `out-${spaceId}-2`, name: "objectId", type: "string", required: true, description: "新建对象标识" }],
      timeout: 5000,
      retryCount: 0,
      retryInterval: 0,
      definition: {
        kind: "basic",
        parameterConfig: EMPTY_BASIC_PARAMETER_CONFIG,
        basicAction: "create",
        objectId: "obj-ship",
        objectName: "舰船",
      },
      dependencies: [],
      testStatus: "untested",
      testedAt: "",
      versions: [
        {
          id: `ver-${spaceId}-2`,
          version: "v1.0.0",
          status: "draft",
          createdAt: "2026-09-20 14:10",
          createdBy: "admin",
          changeLog: "草稿",
        },
      ],
    },
    {
      id: `function-${spaceId}-basic-delete-airport`,
      spaceId,
      name: "删除机场基础函数",
      functionApi: "delete_airport_basic",
      type: "basic",
      protocol: "HTTP",
      category: "基础操作",
      version: "v1.0.0",
      description: "执行删除机场对象的基础操作。",
      createdBy: "editor",
      updatedAt: "2026-09-19 11:00",
      status: "disabled",
      inputParameters: [{ id: `in-${spaceId}-3`, name: "objectId", type: "string", required: true, description: "对象唯一标识" }],
      outputParameters: [{ id: `out-${spaceId}-3`, name: "success", type: "boolean", required: true, description: "是否删除成功" }],
      timeout: 3000,
      retryCount: 0,
      retryInterval: 0,
      definition: {
        kind: "basic",
        parameterConfig: EMPTY_BASIC_PARAMETER_CONFIG,
        basicAction: "delete",
        objectId: "obj-airport",
        objectName: "机场",
      },
      dependencies: [],
      testStatus: "failed",
      testedAt: "2026-09-19 10:50",
      versions: [
        {
          id: `ver-${spaceId}-3`,
          version: "v1.0.0",
          status: "disabled",
          createdAt: "2026-09-19 11:00",
          createdBy: "editor",
          changeLog: "已停用",
        },
      ],
    },
  ];
}

/**
 * @description 获取空间函数算子内存列表，首次访问时用样例初始化。
 * @param spaceId 空间 id。
 * @returns 可变算子数组引用。
 */
function ensureSpaceOperators(spaceId: number): FunctionOperator[] {
  const existing = store.get(spaceId);
  if (existing) {
    return existing;
  }
  const seeded = createSeedOperators(spaceId).map(cloneOperator);
  store.set(spaceId, seeded);
  return seeded;
}

/**
 * @description 按查询条件分页过滤基础函数算子。
 * @param query 查询参数。
 * @returns 分页结果。
 */
export function queryFunctionOperatorsMock(query: FunctionOperatorQuery): FunctionOperatorPage {
  let records = ensureSpaceOperators(query.spaceId).map(cloneOperator);
  const keyword = query.keyword.trim().toLowerCase();
  if (keyword) {
    records = records.filter((item) => item.name.toLowerCase().includes(keyword) || item.description.toLowerCase().includes(keyword));
  }
  if (query.type) {
    records = records.filter((item) => item.type === query.type);
  }
  if (query.creator) {
    records = records.filter((item) => item.createdBy === query.creator);
  }
  if (query.status) {
    records = records.filter((item) => item.status === query.status);
  }
  if (query.updatedFrom) {
    records = records.filter((item) => item.updatedAt.slice(0, 10) >= query.updatedFrom);
  }
  if (query.updatedTo) {
    records = records.filter((item) => item.updatedAt.slice(0, 10) <= query.updatedTo);
  }
  records.sort((left, right) => {
    const factor = query.sortOrder === "asc" ? 1 : -1;
    if (query.sortBy === "name") {
      return left.name.localeCompare(right.name, "zh-CN") * factor;
    }
    return left.updatedAt.localeCompare(right.updatedAt) * factor;
  });
  const start = Math.max(0, (query.page - 1) * query.pageSize);
  const pageRecords = records.slice(start, start + query.pageSize);
  return {
    records: pageRecords,
    total: records.length,
    page: query.page,
    pageSize: query.pageSize,
  };
}

/**
 * @description 创建基础函数算子。
 * @param draft 新建草稿。
 * @returns 创建后的算子。
 */
export function createFunctionOperatorMock(draft: FunctionOperatorDraft): FunctionOperator {
  const list = ensureSpaceOperators(draft.spaceId);
  const now = stampNow();
  const operator: FunctionOperator = {
    id: `function-${draft.spaceId}-basic-${Date.now()}`,
    spaceId: draft.spaceId,
    name: draft.name.trim(),
    functionApi: draft.functionApi.trim(),
    type: "basic",
    protocol: draft.protocol || "HTTP",
    version: draft.version.trim() || "v1.0.0",
    description: draft.description.trim(),
    createdBy: draft.createdBy || "admin",
    updatedAt: now,
    status: draft.status || "draft",
    category: draft.category || "基础操作",
    inputParameters: draft.inputParameters.map((item) => ({ ...item })),
    outputParameters: draft.outputParameters.map((item) => ({ ...item })),
    timeout: draft.timeout,
    retryCount: draft.retryCount,
    retryInterval: draft.retryInterval,
    definition: draft.definition.kind === "basic" ? { ...draft.definition } : { kind: "basic", parameterConfig: EMPTY_BASIC_PARAMETER_CONFIG },
    dependencies: [...draft.dependencies],
    testStatus: "untested",
    testedAt: "",
    versions: [
      {
        id: `ver-${Date.now()}`,
        version: draft.version.trim() || "v1.0.0",
        status: draft.status || "draft",
        createdAt: now,
        createdBy: draft.createdBy || "admin",
        changeLog: "新建",
      },
    ],
  };
  list.unshift(operator);
  return cloneOperator(operator);
}

/**
 * @description 更新函数算子。
 * @param draft 含 id 的草稿。
 * @returns 更新后的算子；找不到时返回 null。
 */
export function updateFunctionOperatorMock(draft: FunctionOperatorDraft): FunctionOperator | null {
  if (!draft.id) {
    return null;
  }
  const list = ensureSpaceOperators(draft.spaceId);
  const index = list.findIndex((item) => item.id === draft.id);
  if (index < 0) {
    return null;
  }
  const previous = list[index];
  if (!previous) {
    return null;
  }
  const updated: FunctionOperator = {
    ...previous,
    name: draft.name.trim(),
    functionApi: previous.functionApi,
    description: draft.description.trim(),
    version: draft.version.trim() || previous.version,
    protocol: draft.protocol,
    status: draft.status,
    category: draft.category,
    inputParameters: draft.inputParameters.map((item) => ({ ...item })),
    outputParameters: draft.outputParameters.map((item) => ({ ...item })),
    timeout: draft.timeout,
    retryCount: draft.retryCount,
    retryInterval: draft.retryInterval,
    definition:
      draft.definition.kind === "basic"
        ? { ...draft.definition }
        : previous.definition.kind === "basic"
          ? previous.definition
          : { kind: "basic", parameterConfig: EMPTY_BASIC_PARAMETER_CONFIG },
    dependencies: [...draft.dependencies],
    updatedAt: stampNow(),
  };
  list[index] = updated;
  return cloneOperator(updated);
}

/**
 * @description 删除函数算子。
 * @param spaceId 空间 id。
 * @param operatorId 算子 id。
 * @returns 是否删除成功。
 */
export function deleteFunctionOperatorMock(spaceId: number, operatorId: string): boolean {
  const list = ensureSpaceOperators(spaceId);
  const index = list.findIndex((item) => item.id === operatorId);
  if (index < 0) {
    return false;
  }
  list.splice(index, 1);
  return true;
}

/**
 * @description 发布或停用函数算子。
 * @param spaceId 空间 id。
 * @param operatorId 算子 id。
 * @param status 目标状态。
 * @returns 更新后的算子；找不到时返回 null。
 */
export function setFunctionOperatorStatusMock(
  spaceId: number,
  operatorId: string,
  status: Extract<FunctionOperatorStatus, "published" | "disabled">,
): FunctionOperator | null {
  const list = ensureSpaceOperators(spaceId);
  const target = list.find((item) => item.id === operatorId);
  if (!target) {
    return null;
  }
  target.status = status;
  target.updatedAt = stampNow();
  return cloneOperator(target);
}

/**
 * @description 模拟函数算子测试。
 * @param spaceId 空间 id。
 * @param operatorId 算子 id。
 * @param payload 测试入参。
 * @returns 测试结果。
 */
export function testFunctionOperatorMock(spaceId: number, operatorId: string, payload: Record<string, unknown>): FunctionOperatorTestResult {
  const list = ensureSpaceOperators(spaceId);
  const target = list.find((item) => item.id === operatorId);
  const now = stampNow();
  const success = Boolean(target);
  if (target) {
    target.testStatus = success ? "passed" : "failed";
    target.testedAt = now;
    target.status = target.status === "draft" ? "testing" : target.status;
    target.updatedAt = now;
  }
  return {
    success,
    duration: 12 + Math.floor(Math.random() * 40),
    output: JSON.stringify({ echo: payload, operatorId }, null, 2),
    message: success ? "测试通过" : "未找到函数算子",
    testedAt: now,
  };
}

/**
 * @description 默认空参数配置（新建基础函数）。
 * @returns 序列化后的空过滤配置。
 */
export function createDefaultBasicParameterConfig(): string {
  return EMPTY_BASIC_PARAMETER_CONFIG;
}
