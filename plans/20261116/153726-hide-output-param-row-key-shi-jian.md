# 对齐参考：OUTPUT_PARAM 默认不展示/不传行主键

## 需求理解

「写入对象属性」出参仅因非 main 的 `storageGroup`（如 orbit_point）不应展示行主键；执行也不传对应 `dataPrimaryKeys`。与 `behavior-tree-editor/index.html` 一致：仅 `DATA_PRIMARY_KEY` 或 `rowRequired` 时展示并传行主键。

## 修改范围

- `src/components/BehaviorTreeExecPanel.vue`：收紧行主键展示条件
- `src/utils/behaviorTreeExecutePlan.ts`：`OUTPUT_PARAM` 仅 `rowRequired` 时写入 `dataPrimaryKeys`
- 相关单测补充断言

## 新增、修改和删除文件

- 修改：上述实现与 `tests/behavior-tree-orchestration.test.mjs`
- 无新增/删除业务文件

## 核心实现方式

展示与组包条件对齐参考 HTML 的 `outputParamValueHtml` / 组包逻辑。

## 新增依赖及必要性

无。

## 验证方式

- `node --test --experimental-strip-types tests/behavior-tree-orchestration.test.mjs`
- `npm run format:check --` 改动文件
