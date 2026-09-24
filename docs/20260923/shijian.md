## 1 函数算子前端页面开发

## 情况说明

项目当中ontology_cursor文件夹下为系统原型设计代码，本次任务为根据原型项目的代码移植和开发当前系统中空间函数算子模块内容

## 移植开发范围

函数算子主页面：页面代码位置：\dynamic-ontology\ontology_cursor\src\views\OntologySpaceManagementDetail\components\FunctionOperatorPanel.vue，只保留基础函数的mock数据即可（表格和卡片的操作相关功能页面也需要移植）；新建函数弹框中的【基础函数】相关功能，其他函数对应内容留空即可，不包括运行配置页面。

## 开发要求

只参考原型系统的页面及功能，代码编写规范要遵循当前系统的代码规范要求

## 2 全文检索功能开发

## 功能描述

该功能为在检索框检索内容后根据接口返回的数据展示查询结果列表，点击列表项可跳转到对应的页面内容。
搜索框位置：全文检索菜单对应页面中的搜索框，系统主页面banner处的搜索框，两者功能完全一样。
调用接口：globalSearchApi-shijian.md 中的接口。
跳转方式：使用路由方式跳转。
数据说明：data数组中返回的对象字段"name"和"type"字段是必返回字段，"desc"可能有也可能没有，有就展示，没有就展示为空。
当type值为"空间"时，返回字段中肯定有spaceId，对应跳转的路由为 /workspace/ontology-space-management/{spaceId}/overview
当type值为"对象"时，返回字段中肯定有spaceId和uniqueIdentifier，对应跳转的路由为 /workspace/ontology-object/{uniqueIdentifier}/object?spaceId={spaceId}&spaceName={spaceName}&objectName={objectName}

当type值为"属性"时，返回字段中肯定有spaceId和uniqueIdentifier，对应跳转的路由为 /workspace/ontology-object/{uniqueIdentifier}/attribute?spaceId={spaceId}&spaceName={spaceName}&objectName={objectName}

需要注意一个逻辑是：先根据objectid的值调用getInfoByObjectidApi-shijian.md 中的接口，然后获取到对象名称objectName和空间名称spaceName后拼接到完成地址再跳转

当type值为"关系分组"时，返回字段中肯定有spaceId，对应跳转的路由为 /workspace/ontology-space-management/{spaceId}/relation

目前先实现这四个类型的跳转

## 3 新建函数算子功能开发

## 功能描述

使用 \dynamic-ontology\docs\20260923\6.createFunApi-shijian.md 接口文档开发新建函数算子功能,目前只需要开发基础函数即可，queryConfig参数说明：使用参数配置表单构建queryConfig.filters对象数据；配置规范（参考示例"filters": {
"logic": "AND",
"children": [
{
"type": "FILTER",
"filter": {
"propertyApiName": "status",
"op": "EQ",
"value": "1",
"dataType": "STRING"
}
},
{
"type": "FILTER",
"filter": {
"propertyApiName": "amount",
"op": "GT",
"value": 100,
"dataType": "NUMBER"
}
}
]
}）

    queryConfig.aggFunc为聚合类型：SUM/COUNT/AVG/MAX/MIN/DISTINCT，需要新增一个下拉表单去选择 聚合类型 ，不选择择不传 queryConfig.aggFunc 参数
