# 属性值行为 EXTERNAL 且去掉新增值列

## 需求理解

属性值行为创建/编辑：mappingIns 对 CREATE/UPDATE 固定 sourceType=EXTERNAL，不传 sourceConfig；去掉新增值/修改值列。

## 修改范围

- buildPropertyValueCreateActionParams.ts
- BehaviorFormDialog.vue
- tests/ontology-space-behavior.test.mjs

## 新增、修改和删除文件

- 修改：上述文件
- 新增/删除：无

## 核心实现方式

1. CREATE/UPDATE mapping 使用 EXTERNAL，删除 sourceConfig
2. 移除属性表新增值/修改值列
3. 更新单测

## 新增依赖及必要性

无

## 验证方式

相关单测 + 任务文件 format:check
