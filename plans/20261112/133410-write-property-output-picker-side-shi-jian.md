# Plan：写回属性出参独立实例选择器

## 需求理解

应用行为测试中，写回属性出参的实体列表请求必须使用该出参行自身的 `ontologyUniqueIdentifier`。与入参同名时不得共用选择器。

## 修改范围

- `src/utils/behaviorParameters/collectApplicationPropertyOntologyPickers.ts`
- `src/composables/behavior/useBehaviorParameters.ts`
- `src/components/BehaviorParameterConfig/BehaviorParameterConfig.vue`
- `src/types/behavior/behaviorParameterType.ts`
- `src/views/SpaceBehaviorScheduleWorkspace/utils/restoreScheduleBehaviorParameters.ts`（按 pickerKey 恢复）
- 相关单测

## 新增、修改和删除文件

- 修改上述文件；无新增依赖文件删除。

## 核心实现方式

1. `pickerKey` 改为 `input::paramName` / `output::paramName`，按 key 去重。
2. 查找/加载/选择 API 增加 `side`（input|output）。
3. 入参 UI 用 input，写回 UI 用 output；selectionMode 按 side 设置。
4. 快照恢复按 pickerKey 匹配。

## 新增依赖及必要性

无。

## 验证方式

- 相关单测（含同名不同 ontology）
- format:check
