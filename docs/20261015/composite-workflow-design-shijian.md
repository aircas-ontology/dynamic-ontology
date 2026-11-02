# 函数编排工作流 — 补充设计（可落地默认）

本文在 [`shijian.md`](./shijian.md) 五条需求之上，补齐图约束、端口、参数绑定、逻辑节点、保存载荷等缺口。**未特别声明处均为本版拍板默认**；后续接 COMPOSITE 创建/更新接口时，以本文「保存载荷」为前端契约基准。

---

## 0. 范围与阶段

| 阶段                 | 目标                                                                                          |
| -------------------- | --------------------------------------------------------------------------------------------- |
| P0（本设计对应实现） | LogicFlow 画布：拖拽、连线、函数节点详情与参数绑定、类型校验、保存 `console.log` 完整 payload |
| P1                   | 持久化到 COMPOSITE 创建/更新接口；测试执行                                                    |
| 明确不做（P0）       | 自动布局算法精调、缩放持久化、编排套编排、运行时真实调度引擎                                  |

技术：`@logicflow/core`（已依赖）；自定义节点 + 侧栏 HTML5 DnD 落入画布。全屏弹框 `destroy-on-close` 时必须销毁 LogicFlow 实例。

---

## 1. 图约束

1. **允许**：有向图；同一函数可多次入画（每次新 `nodeId`）；多个无前驱「起点」。
2. **禁止环**：连线前检测，成环则拒绝并 `ElMessage.warning`。
3. **函数节点入边**：最多 **1** 条业务数据入边（单前驱）。多前驱需求留给 P1。
4. **函数节点出边**：允许多条（扇出）；每条边携带同一套输出快照语义，由下游各自映射。
5. **逻辑节点**：
   - `branch`：1 入；2 出（`true` / `false`），出边必须带 `branch: "true" | "false"`。
   - `loop`：1 入；1 出（循环体出口）；循环配置见 §4。
   - `transform`：1 入；1 出。
6. 孤立节点允许存在；保存时校验「至少 1 个函数节点」，否则警告仍可打印（便于调试）。

---

## 2. 节点类型与身份

### 2.1 函数节点 `kind: "function"`

拖入时钉死：

```ts
{
  kind: "function";
  functionApi: string;
  version: string; // 钉死列表中的版本，不随源函数升级自动变
  displayName: string;
}
```

- 同 `functionApi+version` 可重复入画。
- 双击：调 `getOntologyFunctionDetailInterface({ functionApi, version })`，缓存于节点 properties（generation 防过期）。
- 详情弹框只读展示：名称、版本、说明、INPUT/OUTPUT 表；并提供 **参数绑定编辑区**（见 §3）。

### 2.2 逻辑节点

| kind        | 展示名       | 双击行为                           |
| ----------- | ------------ | ---------------------------------- |
| `loop`      | 循环         | 打开逻辑配置弹框（非函数详情接口） |
| `branch`    | 条件分支     | 同上                               |
| `transform` | 数据格式转换 | 同上                               |

左侧「当前空间函数」仅 `type=CUSTOMIZE` 列表；逻辑节点不走 list/详情函数接口。

---

## 3. 端口与参数绑定

### 3.1 端口模型（P0 拍板）

**节点级单入单出端口**（非参数级端口），降低 LogicFlow 复杂度。

- 边表示「上游整包输出 → 下游整包输入」的数据依赖。
- **参数名映射**不在边上画线，而在**下游节点配置**里维护 `inputBindings`。

### 3.2 `inputBindings`（下游函数节点）

对每个 INPUT 参数一条：

```ts
type InputBinding =
  | { mode: "manual"; paramName: string; value: string } // 无前驱或用户强制手填
  | { mode: "fromUpstream"; paramName: string; upstreamParamName: string }; // 来自唯一前驱的某 OUTPUT
```

规则：

1. **无前驱**：所有 INPUT 仅允许 `manual`；值为字符串（与测试接口 `paramValue` 一致）。
2. **有前驱**：默认尝试 **同名** OUTPUT→INPUT 自动填充为 `fromUpstream`；用户可改映射或改为 `manual`。
3. 每个 INPUT 必须有一条 binding；保存前校验。
4. 前驱变更（删边/换边）时：清除无效 `fromUpstream`，保留可手填项。

### 3.3 类型检测

在以下时机执行：**连线成功后**、**修改 binding 时**、**保存前**：

| 规则                                             | 行为                                                                  |
| ------------------------------------------------ | --------------------------------------------------------------------- |
| `fromUpstream` 时上下游 `paramType` 规范化后相等 | 通过                                                                  |
| 一方为空/未知                                    | 警告，不阻断                                                          |
| 规范化后不等                                     | **阻断该 binding 生效**（保存失败或连线后标红节点），`ElMessage` 说明 |

规范化（小写 trim）：

- `string` / `str` → `string`
- `number` / `int` / `float` / `double` / `long` → `number`
- `boolean` / `bool` → `boolean`
- `object` / `json` / `map` → `object`
- `array` / `list` → `array`
- 其余保留原小写串，仅全等通过

P0 **不做** number↔string 隐式兼容。

---

## 4. 逻辑节点配置 schema

### 4.1 `loop`

```ts
{
  kind: "loop";
  /** 迭代来源：前驱某个 OUTPUT 名，或 manual JSON 数组文本 */
  collection: { mode: "fromUpstream"; upstreamParamName: string } | { mode: "manual"; jsonText: string };
  /** 注入循环体下游的单项变量名，默认 item */
  itemParamName: string; // default "item"
  maxIterations?: number; // default 100，仅配置展示，P0 不执行
}
```

P0 只持久化配置，不跑循环引擎。

### 4.2 `branch`

```ts
{
  kind: "branch";
  /** 简易表达式：上游输出字段名 + 比较 + 字面量；P0 不做完整表达式引擎 */
  left: { mode: "fromUpstream"; upstreamParamName: string } | { mode: "manual"; value: string };
  operator: "eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "truthy";
  right?: { mode: "manual"; value: string }; // truthy 时可不填
}
```

出边 `branch: "true" | "false"`；缺少任一侧出边时保存警告。

### 4.3 `transform`

```ts
{
  kind: "transform";
  language: "javascript"; // P0 固定
  /** 用户脚本：function transform(input) { return outputObject } */
  code: string;
}
```

P0 只存代码，不执行。输出视为 `object`，下游映射时 `upstreamParamName` 使用返回对象的 key（详情式列出需用户在配置里声明 `outputKeys: string[]`，默认 `["result"]`）。

---

## 5. 交互（对齐现有 UI）

| 操作                   | 行为                                                        |
| ---------------------- | ----------------------------------------------------------- |
| 拖拽逻辑/函数卡到画布  | 落点创建对应节点                                            |
| 画布内连线             | 校验图约束 + 函数节点单入；成功后刷新下游默认同名 binding   |
| 双击函数节点           | 详情接口 + 绑定编辑                                         |
| 双击逻辑节点           | 逻辑配置弹框                                                |
| 删除选中               | 删节点及关联边，清理下游 binding                            |
| 自动布局 / 适应 / 缩放 | LogicFlow 内置能力即可，不持久化 zoom                       |
| 测试                   | P0 仍提示暂未开放                                           |
| 返回上一步             | 销毁 LF 实例，关闭画布弹框（草稿可留在父级 ref，P0 可丢弃） |
| 保存                   | `console.log` §6 payload；校验失败则不打印成功态            |

右侧「测试参数 / 运行结果」：P0 保持占位；与节点 `manual` 绑定独立，避免两套入口混淆。

---

## 6. 保存载荷（P0 console / 未来 API 共用形状）

```ts
interface CompositeWorkflowSavePayload {
  schemaVersion: 1;
  meta: {
    displayName: string;
    functionApi: string; // 编排函数自身 API（来自上一步表单）
    version: string;
    ontologySpaceId: number;
    savedAt: string; // ISO
  };
  graph: {
    /** LogicFlow raw graphData（nodes + edges） */
    logicFlow: unknown;
  };
  nodes: Array<
    | {
        id: string;
        kind: "function";
        functionApi: string;
        version: string;
        displayName: string;
        inputBindings: InputBinding[];
        /** 详情缓存摘要，便于无网时阅读；可选 */
        paramsSnapshot?: { inputs: ParamBrief[]; outputs: ParamBrief[] };
      }
    | { id: string; kind: "loop"; config: LoopConfig }
    | { id: string; kind: "branch"; config: BranchConfig }
    | { id: string; kind: "transform"; config: TransformConfig }
  >;
  edges: Array<{
    id: string;
    sourceNodeId: string;
    targetNodeId: string;
    branch?: "true" | "false";
  }>;
}

interface ParamBrief {
  paramName: string;
  paramType: string;
}
```

保存按钮：组装上述对象 → `console.log("[composite-workflow]", payload)`；校验错误用 `ElMessage.error` 列出首条原因。

---

## 7. 异步与错误

- 详情请求：loading / error；失败可关弹框，节点保留，绑定区不可用。
- 列表仍按现逻辑：`pageSize=1000` + `type=CUSTOMIZE`；搜索本地过滤。
- 过期响应：generation；弹框卸载 disposed。

---

## 8. 验收清单（P0）

1. 可从左侧拖入循环/分支/转换与 CUSTOMIZE 函数节点。
2. 函数节点双击可见详情 INPUT/OUTPUT，并可编辑 binding。
3. 可连线；成环与函数多入边被拒绝。
4. 有前驱时类型不一致的 `fromUpstream` 无法通过保存校验；无前驱可 manual。
5. 保存时控制台打印符合 §6 的 JSON；不调用后端保存接口。

---

## 9. 与原五条需求对照

| 原需求               | 本设计落点          |
| -------------------- | ------------------- |
| 1 拖拽               | §2 + §5             |
| 2 双击详情           | §2.1；逻辑节点走 §4 |
| 3 连接               | §1 + §3.1           |
| 4 输入来源与类型检测 | §3.2 §3.3           |
| 5 保存打印           | §6                  |
