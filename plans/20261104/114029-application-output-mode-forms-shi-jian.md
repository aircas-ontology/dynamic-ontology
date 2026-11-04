# 应用行为出参输出方式两态表单

## 需求理解

非对象出参行的「输出方式」可选仅返回结果 / 写入对象属性；「写入目标」分别展示固定文案或属性下拉。本轮只做表单与本地状态。

## 修改范围

- BehaviorFormDialog.vue
- ontologySpaceBehaviorType.ts 与 types 导出
- tests/ontology-space-behavior.test.mjs

## 新增、修改和删除文件

- 修改：上述文件
- 新增业务文件：无

## 核心实现方式

1. 选项 RESULT_ONLY / WRITE_PROPERTY
2. 写入目标：说明文案或「选择写入属性」下拉（选项本轮可空）
3. 按 rowKey 存本地状态；切换算子时重置
4. 不改 createAction 提交

## 新增依赖及必要性

无

## 验证方式

相关单测 + 任务文件 format:check
