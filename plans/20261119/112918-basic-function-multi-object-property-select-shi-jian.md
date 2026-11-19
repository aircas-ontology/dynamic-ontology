# Plan: 多对象基础函数聚合参数名 / 参数配置改为属性下拉

## 需求理解

多对象时：「聚合参数名」由输入改为下拉；选项为当前选中第一个对象的属性；对象选择变化时清空聚合参数名。「参数配置」属性名与上述同源下拉。

## 修改范围

`BehaviorFormDialog.vue` 表单与同步逻辑；相关测试与校验文案。不改 create API 契约。

## 新增、修改和删除文件

- 修改：`src/views/SpaceBehaviorWorkspace/components/BehaviorFormDialog.vue`
- 修改：`src/views/SpaceBehaviorWorkspace/utils/buildBasicFunctionCreateActionParams.ts`（校验文案）
- 修改：`tests/ontology-space-behavior.test.mjs`
- 不新增、不删除文件

## 核心实现方式

1. 对象数 ≥ 1 时按第一个对象加载属性选项（复用 `loadBasicFunctionSelectFieldOptions`）；多对象不展示展示字段/写入字段。
2. 对象选择变化时清空 `basicFunctionTargetField`；多对象时重载首对象属性。
3. 「聚合参数名」改为 `el-select`，选项为 `basicFunctionSelectFieldOptions`。
4. `basicFunctionFilterPropertyOptions` 在基础函数有对象时始终使用首对象属性选项。
5. 参数配置 placeholder 改为「选择属性名」。

## 新增依赖及必要性

无

## 验证方式

先更新测试并确认失败，再实现；`npm test` 相关用例；`format:check`；人工冒烟多对象切换。
