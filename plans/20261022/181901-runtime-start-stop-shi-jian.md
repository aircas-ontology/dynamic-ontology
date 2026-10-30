---
name: Runtime Start Stop
overview: 在运行配置表格右侧增加「操作」列（启动 / 停止），对接已有后端 runtime/start、runtime/stop 契约，并按 phase 控制按钮可用与行级提交态。
todos:
  - id: runtime-start-stop-api
    content: 新增 start/stop 类型、API、Mock 与契约测试
    status: in_progress
  - id: runtime-ops-column-ui
    content: 运行配置表加操作列与启停逻辑/行级 submitting
    status: pending
  - id: runtime-ops-verify
    content: 更新工作区测试并 format/type-check
    status: pending
isProject: false
---

# 运行配置表格增加启动/停止操作列

## 需求理解

在 [`FunctionOperatorContainerRuntimePanel.vue`](src/views/FunctionOperatorPanel/components/FunctionOperatorContainerRuntimePanel.vue) 表格「运行状态」右侧增加 **操作** 列，提供 **启动**、**停止**；红框位置即该列。

## 接口依据（选定）

仓库暂无独立 `*Api.md`；采用 [`docs/20261021/api-container-test.md`](docs/20261021/api-container-test.md) 已写明契约（与 list 同域）：

- `POST` `/ontology/function/container/runtime/start?containerKey=`
- `POST` `/ontology/function/container/runtime/stop?containerKey=`
- 成功响应 `data` 为更新后的实例（与 list 项同形）；幂等。

不新增 npm 依赖。本期不做重启/刷新。

## 修改范围

**新增**

- `src/types/apis/postOntologyFunctionContainerRuntimeStartType.ts`
- `src/types/apis/postOntologyFunctionContainerRuntimeStopType.ts`
- `src/mocks/postOntologyFunctionContainerRuntimeStartMock/...`
- `src/mocks/postOntologyFunctionContainerRuntimeStopMock/...`
- `tests/post-ontology-function-container-runtime-start-api.test.mjs`
- `tests/post-ontology-function-container-runtime-stop-api.test.mjs`

**修改**

- [`src/apis/functionApi.ts`](src/apis/functionApi.ts)、[`src/apis/index.ts`](src/apis/index.ts)
- [`src/types/index.ts`](src/types/index.ts)
- [`FunctionOperatorContainerRuntimePanel.vue`](src/views/FunctionOperatorPanel/components/FunctionOperatorContainerRuntimePanel.vue)
- [`tests/function-operator-workspace.test.mjs`](tests/function-operator-workspace.test.mjs)（断言操作列与启停文案）
- 如本地 Mock 路由需登记，按现有 list mock 方式补 start/stop（仅任务涉及文件）

## 核心实现方式

**API**

- `postOntologyFunctionContainerRuntimeStartInterface` / `StopInterface`
- query：`containerKey`；`data` 复用 `OntologyFunctionContainerRuntimeItem`（或与 list 同结构的单条）

**表格 UI**（对齐主列表 link 按钮风格）

```vue
<el-table-column label="操作" width="140" fixed="right">
  <el-button link type="primary" ...>启动</el-button>
  <el-button link type="danger" ...>停止</el-button>
</el-table-column>
```

**按钮可用性**

| 按钮 | 可用                             | 禁用                                                     |
| ---- | -------------------------------- | -------------------------------------------------------- |
| 启动 | `CREATED` / `STOPPED` / `FAILED` | `RUNNING` / `STOPPING` / `RESTARTING`，或该行 submitting |
| 停止 | `RUNNING`                        | 其余 phase，或该行 submitting                            |

**命令态**

- 按 `containerKey` 记录 submitting，防重复点击；成功用返回 `data` 更新该行（无则重新拉 list）；失败 `ElMessage.error`。

## 新增依赖及必要性

无。

## 验证方式

- 新增/更新相关 `tests/*.test.mjs` 后跑相关用例
- `format:check`、`type-check`、`check:types-conventions`（区分既有失败）
- 人工：运行配置页点启动/停止，看状态与按钮禁用变化
