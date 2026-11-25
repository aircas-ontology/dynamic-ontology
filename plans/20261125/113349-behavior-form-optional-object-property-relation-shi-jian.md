# 创建行为取消对象/属性/关系必填

## 需求理解

创建（及同表单保存）行为时，以下不再必填：

- 属性值：对象、属性选择
- 关系实例：关系选择

名称、api、分类、行为类型、基础操作等其它必填保持不变。基础函数「选择对象」、关系的状态/持续时段、应用行为入参绑定仍按现有规则。无对象/属性/关系时仍可提交，请求体省略对应字段，由后端接受。

## 修改范围

`BehaviorFormDialog.vue` 提交校验与星号；属性值/关系实例创建参数组装器。

## 新增、修改和删除文件

- 修改：`src/views/SpaceBehaviorWorkspace/components/BehaviorFormDialog.vue`
- 修改：`src/views/SpaceBehaviorWorkspace/utils/buildPropertyValueCreateActionParams.ts`
- 修改：`src/views/SpaceBehaviorWorkspace/utils/buildLinkCreateActionParams.ts`
- 修改：`tests/ontology-space-behavior.test.mjs` 及组装器相关断言
- 新增：本 Plan
- 删除：无

## 核心实现方式

1. UI：去掉对象星号；提交不再因未选对象/属性/关系 return。
2. 属性值组装：对象与 `mappingIns` 按有值再带；`storageGroup` 仅在有属性时带。
3. 关系组装：无关系 id 时仍返回合法基础字段，不带 `linkMapping`。
4. 不改基础函数「请选择对象」、应用行为绑定关系（已可选）。

## 新增依赖及必要性

- 无

## 验证方式

- 相关 `npm test`；`format:check`；`type-check` / `build:verify`
