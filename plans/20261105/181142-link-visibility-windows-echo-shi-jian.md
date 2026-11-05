# 修复实例关系编辑持续时间回显

## 需求理解

编辑实例关系行为时，`linkMapping.visibilityWindows` 有值但「持续时间」为空。详情接口返回 ISO 时间字符串，映射需转为毫秒后回填表单。

## 修改范围

- `src/types/apis/getOntologyActionInfoType.ts`
- `src/views/SpaceBehaviorWorkspace/utils/mapOntologyActionInfoToFormState.ts`
- `src/views/SpaceBehaviorWorkspace/components/BehaviorFormDialog.vue`
- `tests/ontology-space-behavior.test.mjs`

## 新增 / 修改 / 删除文件

| 操作 | 路径     |
| ---- | -------- |
| 修改 | 上述文件 |
| 新增 | 本 Plan  |

## 核心实现方式

详情 `visibilityWindows.startTime/endTime` 类型改为 `number | string`；mapper 将 number / ISO / 可解析日期转为有限毫秒；`readVisibilityWindowTimestamp` 对字符串改用 `Date.parse` 兜底。创建入参仍为 number。

## 新增依赖及必要性

无。

## 验证方式

- `node --test tests/ontology-space-behavior.test.mjs`
- `npm run format:check -- <本次文件>`
- `npm run type-check`、`npm run build:verify`
