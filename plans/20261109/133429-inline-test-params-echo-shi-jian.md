# 测试参数嵌到分组数据行并回显

## 需求理解

属性值-修改的实例数据弹框：去掉底部测试参数表；在选中数据行的属性值列内联编辑框，并用原属性值回显。

## 修改范围

- BehaviorEntityRowDetailDialog.vue
- BehaviorTestDialog.vue
- tests/ontology-space-behavior.test.mjs

## 新增、修改和删除文件

- 仅修改上述文件

## 核心实现方式

paramName 匹配 propertyApiName；仅 selectedDataPrimaryKey 对应行可编辑；detail-loaded 后父级 seed paramValues。

## 新增依赖

无

## 验证方式

相关测试、format:check、type-check、build:verify
