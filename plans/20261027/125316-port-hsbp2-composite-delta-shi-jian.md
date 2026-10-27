# 移植 hsbp2 函数编排增量（方案 C）

## 需求理解

以 `dynamic-ontology-hsbp2/dynamic-ontology/` 为源，把相对当前仓库的编排增量迁入。用户确认 **方案 C**：

- 移植类型、`compositeConfig` 编译/回显中的 transform JSON 映射字段
- 移植连线后按参数名自动绑定
- **不改**转换节点弹框 UI（仍为 TypeScript 脚本 + 解析 + 入参绑定）
- **不回退**当前已有的 switch / start-end / 控制边出口映射 / 旧 SavePayload 回显 / `rateLimitTemplateId`

## 修改范围

- 新增/扩展 Transform `mappingMode`/`mappings` 类型与后端契约
- 移植 `buildAutoConfiguredCompositeWorkflowInputBindings` 并在 canvas 连线后使用
- backendConfig compile/restore、defaults、弹框 confirm 写入 `mappingMode: "script"`
- 更新相关测试

## 新增、修改和删除文件

**修改**

- `src/types/pages/ontologyCompositeWorkflowType.ts`
- `src/types/apis/ontologyCompositeConfigType.ts`
- `src/types/index.ts`
- `src/views/FunctionOperatorPanel/utils/compositeWorkflowTransformDefaults.ts`
- `src/views/FunctionOperatorPanel/utils/compositeWorkflowGraph.ts`
- `src/views/FunctionOperatorPanel/composables/useCompositeWorkflowCanvas.ts`
- `src/views/FunctionOperatorPanel/utils/compositeWorkflowBackendConfig.ts`
- `src/views/FunctionOperatorPanel/components/FunctionOperatorCompositeTransformNodeDialog.vue`
- `tests/compositeWorkflowBackendConfig.test.mjs`
- `tests/composite-workflow-utils.test.mjs`
- `tests/composite-workflow-transform.test.mjs`

**不修改**：Transform JSON 映射 UI、限流/容器/EXTERNAL、`public/`、`html/`、`dynamic-ontology-hsbp2/`

## 核心实现方式

1. 页面与后端类型对齐 `mappingMode`/`mappings`；缺省按 script。
2. 新建 transform 默认 `mappingMode: "script"`。
3. 编译/回显按 mode 输出；保留 switch/出口/normalize。
4. 自动绑定按参数名 + 类型兼容；canvas 连到 function/transform 时使用。
5. `resolveCompositeWorkflowTransformOutputs` 兼容 mappings 输出字段。

## 新增依赖

无。

## 验证方式

- `node --test tests/composite*.test.mjs tests/compositeWorkflowBackendConfig.test.mjs`
- `npm run type-check`、`npm run build:verify`
- `npm run format:check -- <本任务修改文件>`
- `npm run check:types-conventions`
