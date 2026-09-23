# Plan：空间函数算子模块（基础函数）

## 需求理解

从 `ontology_cursor` 移植函数算子到当前系统空间详情「函数算子」Tab。仅落地基础函数 Mock 与列表/卡片/详情/新建编辑/测试/发布/删除；新建弹框只实现【基础函数】；不含运行配置。

## 修改范围

- 路由 `function-operator` 由空面板改为函数算子工作区
- 新增页面私有组件、类型、Mock、basicFilter 工具与 composable

## 新增 / 修改文件

| 路径                                                         | 动作                       |
| ------------------------------------------------------------ | -------------------------- |
| `src/types/pages/ontologyFunctionOperatorType.ts`            | 新增业务类型               |
| `src/types/pages/ontologyFunctionOperatorBasicFilterType.ts` | 新增基础过滤类型           |
| `src/types/index.ts`                                         | 转导出                     |
| `src/mocks/functionOperatorMock/functionOperatorMock.ts`     | 基础函数 Mock + 内存 CRUD  |
| `src/utils/functionOperatorBasicFilter.ts`                   | 过滤配置解析序列化         |
| `src/views/.../composables/useFunctionOperatorWorkspace.ts`  | 工作区状态                 |
| `src/views/.../functionOperatorComponents/*`                 | Panel/详情/表单/过滤编辑器 |
| `src/router/modules/workspaceRoutes.ts`                      | 挂载 Panel                 |
| `tests/function-operator-workspace.test.mjs`                 | 接线与过滤测试             |

## 核心实现方式

1. Mock 驱动列表与命令操作；无后端契约时不新增真实 API。
2. 表单保留类型卡片；非 basic 显示空态；basic 使用 BasicFilterBuilder。
3. 去掉运行配置入口；不移植 FullscreenEditor。
4. 样式遵循 Aircas 主题。

## 新增依赖

无。

## 验证方式

- `node --test tests/function-operator-workspace.test.mjs`
- `npm run format:check -- <任务文件>`
- `npm run type-check`（记录既有无关失败）
- `npm run build:verify`
