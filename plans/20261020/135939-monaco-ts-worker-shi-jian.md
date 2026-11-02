# Plan：修复 Monaco getNavigationTree 报错

## 需求理解

脚本 IDE 使用 `typescript` 语言但只挂了通用 `editor.worker`，TS 语言服务调用 `getNavigationTree` 时报错。需按语言正确配置 worker。

## 修改范围

Monaco `MonacoEnvironment.getWorker` 配置；两处编辑器共用，避免先加载的错误配置锁死全局。

## 新增、修改和删除文件

| 操作      | 路径                                   |
| --------- | -------------------------------------- |
| 新增      | `src/utils/ensureMonacoEnvironment.ts` |
| 修改      | `FunctionOperatorScriptCodeEditor.vue` |
| 修改      | `ScheduleRuleFlowCodeEditor.vue`       |
| 修改/新增 | `tests/` 相关断言                      |

## 核心实现方式

1. 共享 `ensureMonacoEnvironment`：`typescript`/`javascript` → `ts.worker`，其余 → `editor.worker`。
2. 两处编辑器改为调用共享工具；覆盖已存在的错误全局配置，避免「先设置者永久错误」。
3. 单测断言 worker 路由与编辑器引用共享工具。

## 新增依赖及必要性

无（已有 monaco-editor）。

## 验证方式

- 相关单测、format:check、build:verify；type-check 关注本次文件。
