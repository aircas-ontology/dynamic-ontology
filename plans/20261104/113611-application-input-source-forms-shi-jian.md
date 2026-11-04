# 应用行为入参输入来源三态表单

## 需求理解

非对象行的「输入来源」可选对象属性 / 固定值 / 外部输入；「读取属性 / 参数值」按图一～三切换。本轮只做入参表单交互与本地状态。

## 修改范围

- BehaviorFormDialog.vue
- ontologySpaceBehaviorType.ts 与 types 导出
- tests/ontology-space-behavior.test.mjs

## 新增、修改和删除文件

- 修改：上述文件
- 新增/删除：无业务新文件

## 核心实现方式

1. 来源选项 PROPERTY / FIXED / EXTERNAL
2. 右侧：属性 select / 固定值 textarea / 外部输入 checkbox+默认值 textarea
3. 按 rowKey 存本地状态；切换算子时重置
4. 不改 createAction 提交与属性选项加载

## 新增依赖及必要性

无

## 验证方式

相关单测 + 任务文件 format:check
