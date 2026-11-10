## 应用行为测试逻辑

mappingIns值示例
data.mappingIns
:[
{
"functionParamId": 2309,
"category": "INPUT",
"parameterName": "name",
"sourceType": "PROPERTY",
"ontologyUniqueIdentifier": "ea512d439cd34c6ebbcde6b692261ab5",
"propertyUniqueIdentifier": "1d63fe1e5e794e449fb1ca514605c1f6",
"propertyType": "String",
"displayName": "飞机名称"
},
{
"functionParamId": 2311,
"category": "INPUT",
"parameterName": "max_mach",
"sourceType": "EXTERNAL"
},
{
"functionParamId": 2311,
"category": "INPUT",
"parameterName": "max_mach",
"sourceType": "FIXED",
"sourceConfig": "ggg"
},
{
"functionParamId": 2310,
"category": "OUTPUT",
"parameterName": "startTime",
"outputMode": "RESULT_ONLY"
},
{
"functionParamId": 2310,
"category": "OUTPUT",
"parameterName": "endTime",
"outputMode": "RESULT_ONLY"
},
{
"functionParamId": 2310,
"category": "OUTPUT",
"parameterName": "description",
"outputMode": "RESULT_ONLY"
},
{
"functionParamId": 2310,
"category": "OUTPUT",
"parameterName": "taskId",
"outputMode": "RESULT_ONLY"
},
{
"functionParamId": 2310,
"category": "OUTPUT",
"parameterName": "startTime",
"outputMode": "RESULT_ONLY"
},
{
"functionParamId": 2310,
"category": "OUTPUT",
"parameterName": "endTime",
"outputMode": "RESULT_ONLY"
}
]
点击应用行为的测试按钮弹出弹框后首先调用行为详情的接口，根据接口返回的数据data.mappingIns获取参数数据，测试弹框中需要关注和展示的是category=INPUT 的参数。
当sourceType=EXTERNAL时，需要提供一个输入框以供填写外部值，当sourceType=FIXED,展示出sourceConfig字段值（仅展示不可编辑），当sourceType=PROPERTY，要根据ontologyUniqueIdentifier去选择实例

测试弹框中还需要关注和展示category=OUTPUT 且 outputMode=WRITE_PROPERTY的参数，此时需要根据ontologyUniqueIdentifier来选取实例，并根据接口参数规则进行传递

如果接口返回的data.linkMapping.ontologyLinkUniqIdentifier有值，则按照关系实例行为的逻辑在图中红框处添加对应的表单

修改下 应用行为测试 接口的传参：当有关系实例的选择时，不要linkEntityPrimaryKey 参数了，把关系两端的实例添加到entityPrimaryKeys对象中进行传递，示例"entityPrimaryKeys": {
"from": 1,//源关系实例key
"to": 5,//目标关系实例key
},

应用行为测试的传参又变了，格式如下
{
"ontologySpaceId": 156,
"actionApi": "testFull",
"entityPrimaryKeys": { "from": 1, "to": 3 },
"inputEntities": {
"c91b7d43-5e28-4a06-9f31-82d4b0c7e659": { "entityPrimaryKey": 5, "dataPrimaryKeys": { "weapon_load": 11 } }
},
"outputEntities": {
"a5e8c206-3f17-4d92-8b74-1c6f9d3e5028": { "entityPrimaryKey": 7, "dataPrimaryKeys": { "duty_log": 12 } }
},
"params": { "threshold": 300 }
}
其中entityPrimaryKeys参数还是传递关系实例信息
params参数还是传递外部参数信息

"inputEntities": {
"c91b7d43-5e28-4a06-9f31-82d4b0c7e659": { "entityPrimaryKey": 5, "dataPrimaryKeys": { "weapon_load": 11 } },

},
inputEntities是测试入参，<c91b7d43-5e28-4a06-9f31-82d4b0c7e659>是本体唯一值，entityPrimaryKey是实例key,如果mappingIns.storageGroup（mappingIns.storageGroup是行为详情接口中新增加返回的字段）=main则不需要传递dataPrimaryKeys对象，如果mappingIns.storageGroup！==main 则调用/ontology/entity/row_detail/page 接口（storageGroup参数值为mappingIns.storageGroup）获取子表的实例，weapon_load为分组名称，11是分组的实例key

outputEntities是测试出参和inputEntities 值获取逻辑一致

应用行为的参数又又变了，格式如下
{
"ontologySpaceId":156,
"actionApi":"testFull",
"entityPrimaryKeys":{"from":1,"to":3},
"inputParams":{
"speed":{"entityPrimaryKey":5}
},
"outputParams":{
"price":{"entityPrimaryKey":2},
"duty":{
"entityPrimaryKey":3,
"dataPrimaryKeys":{"duty_log":12}
}
,
"params":{
"threshold":300
}
}
}
这次为了解决参数来自同一个本体时的传参问题，区别是speed，price，duty为参数名，之前是本体唯一值，因为参数名不可能相同，所以不会有重名的了，然后改inputEntities为inputParams，outputEntities为outputParams。其他参数与之前一致

应用行为测试的参数又又又变了，格式如下
{
"ontologySpaceId":"156",
"actionApi":"yyy",
"inputParams":{
"name":[
{
"entityPrimaryKey": 11,
},
{
"entityPrimaryKey": 12,
},
],
"max_mach": [
{
"entityPrimaryKey": 101,
"dataPrimaryKeys": {
"duty_log": 11
}
},
{
"entityPrimaryKey": 102,
"dataPrimaryKeys": {
"duty_log": 12,
}
}
]
},
"outputParams":{
"price":{"entityPrimaryKey":2},
"duty":{
"entityPrimaryKey":3,
"dataPrimaryKeys":{"duty_log":12}
}
}
"entityPrimaryKeys":{
"from":[1,2],
"to":[11,12]
}
}
修改内容测试入参改为可以多选，前端界面也要同步修改，不同参数的多选个数可以不同，绑定关系的实例也可以多选，并且两端实例个数也可以不一样
