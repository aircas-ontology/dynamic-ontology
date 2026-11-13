## 行为树编辑功能

开发步骤：点击行为树的编辑按钮，调用行为详情接口（已调用），编辑弹框中类别表单需自动选中【行为树】且不可编辑，回显对应表单中的内容

行为树详情数据示例如下
{
"code": 200,
"message": "SUCCESS",
"data": {
"id": 95,
"ontologyUniqIdentifier": "48c5dada6b68431ba376d0c791f63f4d,ea512d439cd34c6ebbcde6b692261ab5",
"actionApi": "tree",
"displayName": "tree",
"categoryId": 14,
"status": 2,
"actionKind": "TREE",
"createTime": "2026-11-13 10:42:09",
"updateTime": "2026-11-13 10:42:09",
"ontologySpaceId": 156,
"treeDefinition": {
"blackboard": [
{
"key": "key_1",
"valueType": "STRING"
}
],
"variables": [
{
"name": "key_1",
"valueType": "STRING",
"scope": "RUNTIME",
"defaultValue": "1"
}
],
"roots": [
{
"id": "node_1",
"kind": "SELECTOR",
"displayName": "选择节点",
"enabled": true,
"config": {
"runMode": "STANDARD"
},
"children": [
{
"id": "node_2",
"kind": "ACTION",
"displayName": "行为节点",
"enabled": true,
"config": {
"actionApi": "test11"
},
"children": []
},
{
"id": "node_3",
"kind": "ACTION",
"displayName": "行为节点",
"enabled": true,
"config": {
"actionApi": "test12"
},
"children": []
}
]
}
]
},
"executeInputs": {
"entityPrimaryKeyRequired": true,
"inputParams": [],
"instanceRequirements": [
{
"actionApi": "test11",
"actionDisplayName": "test11",
"objectIdentifier": "48c5dada6b68431ba376d0c791f63f4d",
"nodeIds": [
"node_2"
],
"linkEntityPrimaryKeyRequired": true,
"linkObjectIdentifier": "d98e283a9c52463eb4ad3958ffe13898"
},
{
"actionApi": "test12",
"actionDisplayName": "test12",
"objectIdentifier": "ea512d439cd34c6ebbcde6b692261ab5",
"nodeIds": [
"node_3"
],
"linkEntityPrimaryKeyRequired": true,
"linkObjectIdentifier": "c8adbff823c54653adc11c8fa1fa7c14"
}
]
}
}
}
