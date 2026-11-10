# 应用行为测试：inputParams / outputParams 按参数独立选值

## 需求理解

按 `docs/20261106/shijian.md` 102–122 行：

- `inputEntities` → `inputParams`，`outputEntities` → `outputParams`
- Map 键改为参数名，不再用 `ontologyUniqueIdentifier`
- 绑定值结构不变：`{ entityPrimaryKey, dataPrimaryKeys? }`；`storageGroup` 为 main 或空时不传 `dataPrimaryKeys`
- `entityPrimaryKeys.from/to`、`params` 逻辑不变
- 同一本体下多个 PROPERTY 参数可各自选不同实例，UI 按参数独立选择器

## 修改范围

- `src/types/apis/testOntologyActionType.ts`、`src/types/index.ts`
- `src/views/SpaceBehaviorWorkspace/utils/buildApplicationTestRequestParams.ts`
- `src/views/SpaceBehaviorWorkspace/utils/collectApplicationPropertyOntologyPickers.ts`
- `src/views/SpaceBehaviorWorkspace/components/BehaviorTestDialog.vue`
- `tests/ontology-space-behavior.test.mjs`

## 新增、修改和删除文件

- 修改：上述文件
- 新增：本 Plan
- 删除：无

## 核心实现方式

1. 类型字段改为 `inputParams` / `outputParams`
2. 选择快照增加 `paramName`；组装按参数名写入，去掉同一本体多实例冲突校验
3. 收集器按参数行生成种子（不再按 ontology 去重）；非 main 键为 `paramName::storageGroup`
4. 弹框按参数选择器独立选实例与数据行

## 新增依赖

无

## 验证方式

- `node --test --experimental-strip-types tests/ontology-space-behavior.test.mjs`
- `npm run format:check --` 改动文件
- `npm run type-check`、`npm run build:verify`
