# 需求理解

- 对象行为卡片「执行 / 测试」打开的弹窗改成左右分栏：左详情、右填参。
- 左侧参考键值摘要展示方式，只使用行为详情真实字段。
- 右侧继续承担现有执行参数填写与测试交互。

# 修改范围

- `src/components/BehaviorTestDialog/BehaviorTestDialog.vue`
- 按需调整 `src/components/BehaviorParameterConfig/BehaviorParameterConfig.vue` 容器样式
- `tests/ontology-space-behavior.test.mjs`（及相关断言）

# 新增、修改和删除文件

## 新增

- `plans/20261119/144329-behavior-test-dialog-split-guoshengnan.md`

## 修改

- `src/components/BehaviorTestDialog/BehaviorTestDialog.vue`
- `src/composables/behavior/useBehaviorParameters.ts`（暴露详情 viewState 供左栏复用）
- `tests/ontology-space-behavior.test.mjs`

## 删除

- 无

# 核心实现方式

- 弹窗加宽为左右两列；左侧用 `mapOntologyActionInfoToViewState` 结果展示行为摘要。
- 右侧收纳现有 `BehaviorParameterConfig` 与各测试表单。
- 复用已有 `GET /ontology/action` 结果，避免左栏重复请求。

# 新增依赖及必要性

- 无

# 验证方式

- TDD 后执行相关测试、格式检查、type-check、build:verify，并做浏览器冒烟。
