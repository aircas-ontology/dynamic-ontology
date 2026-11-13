# 编排弹框增加返回上一步

## 需求理解

在「清空」与「保存/更新」之间增加「返回上一步」；点击关闭编排弹框，回到创建/编辑行为表单。

## 修改范围

- `src/views/BehaviorTreeOrchestration/BehaviorTreeOrchestrationDialog.vue`

## 新增、修改和删除文件

- 修改：上述 1 个文件
- 新增 / 删除：无

## 核心实现方式

按钮点击 `emit('update:modelValue', false)`，沿用父级 v-model 关闭编排弹框。

## 新增依赖及必要性

无。

## 验证方式

- 任务文件 `format:check`
- 点击后编排关闭且上级表单仍在
