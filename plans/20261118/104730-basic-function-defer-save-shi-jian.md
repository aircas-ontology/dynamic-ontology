# 基础函数：去掉算子/参数表单，保存暂不调接口

## 需求理解

基础行为且行为类型为「基础函数」时：去掉「函数基础算子」与「参数配置」表单及相关逻辑；点保存先不调用创建/更新接口（接口后续修改）。

## 修改范围

- `BehaviorFormDialog.vue`：移除 UI 与仅服务该路径的加载/绑定；`submitBehaviorForm` 对 `basicFunctionOperator` 提示并中止，不 emit
- `tests/ontology-space-behavior.test.mjs`：更新接线断言
- 应用行为算子配置保持不变；不改 create API 文档与 `buildBasicOperatorCreateActionParams` 实现（表单不再走到该路径）

## 新增、修改和删除文件

- 修改：上述文件；新增本 Plan
- 删除：无

## 核心实现方式

- 行为类型可选「基础函数」；该类型下不展示基础操作/算子下拉/参数配置
- 保存：`ElMessage.warning("基础函数保存接口待更新")` 并 return
- 清理：基础函数专用详情绑定、属性绑定加载与校验

## 新增依赖及必要性

无

## 验证方式

- `node --test tests/ontology-space-behavior.test.mjs`
- `npm run format:check -- <任务文件>`
