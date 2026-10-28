## 1 基础函数算子测试功能

## 功能描述

该功能为调用/ontology/function/test 接口（接口文档testFunApt-shijian.md） 测试函数能力。

主要为组装 参数variableBindings对象中的内容，
variableBindings对象中可能有多个键值，键来自函数详情接口中返回的数据（所以打开测试弹框后需要调用函数详情接口获取数据），值来自选取的对象的属性。

基础函数详情结果示例

```JSON
{
  "code": 200,
  "message": "SUCCESS",
  "data": {
    "functionApi": "ss",
    "displayName": "ss",
    "description": "ss",
    "model": "BASIC",
    "type": "BASIC_QUERY",
    "ontologySpaceId": 46,
    "params": [
      {
        "paramId": 25,
        "paramName": "xingbie",
        "paramType": "STRING",
        "category": "INPUT",
        "paramOrder": 1,
        "description": "过滤条件",
        "paramRole": "FILTER"
      },
      {
        "paramId": 26,
        "paramName": "age",
        "paramType": "STRING",
        "category": "INPUT",
        "paramOrder": 2,
        "description": "过滤条件",
        "paramRole": "FILTER"
      },
      {
        "paramId": 27,
        "paramName": "target",
        "paramType": "STRING",
        "category": "INPUT",
        "paramOrder": 3,
        "description": "聚合目标",
        "paramRole": "AGGREGATION"
      }
    ],
    "code": "{\"aggFunc\":null,\"targetProperty\":null,\"filters\":{\"logic\":\"AND\",\"children\":[{\"type\":\"FILTER\",\"filter\":{\"propertyApiName\":\"age\",\"op\":\"EQ\",\"value\":\"10\",\"values\":null,\"dataType\":\"STRING\"},\"group\":null}]}}",
    "queryConfig": {
      "filters": {
        "logic": "AND",
        "children": [
          {
            "type": "FILTER",
            "filter": {
              "propertyApiName": "age",
              "op": "EQ",
              "value": "10",
              "dataType": "STRING"
            }
          }
        ]
      }
    }
  }
}
```

键来源说明：键来源于详情接口中返回的params数组，如果params数组对象中的paramRole==AGGREGATION,第一个键为对象的paramName，其他键为paramRole==FILTER 的paramName。

值来源说明：值为选取的对象的属性的apiName,需要在当前测试弹框界面中添加选择当前空间下对象和对象属性的前端组件元素和功能，为三个键都选择属性的apiname,这三个属性只能来自于同一个对象。可以设计为先选择对象，然后再分别选择属性。选择对象和属性的接口如果找不到可以退出执行，待我补充信息后再实施。

variableBindings 对象组装完成后，就把完整的请求参数展示在参数框中，用户点击测试运行按钮后再调用测试接口（/ontology/function/test）

## 2 基础函数算子参数配置比较运算符替换

## 功能描述

| 枚举值      | 符号                  | 含义     |
| ----------- | --------------------- | -------- |
| EQ          | `=`                   | 等于     |
| NE          | `!=`                  | 不等于   |
| LIKE        | `%val%`               | 全模糊   |
| LIKE_LEFT   | `%val`                | 左模糊   |
| LIKE_RIGHT  | `val%`                | 右模糊   |
| IN          | `IN (...)`            | 包含     |
| NOT_IN      | `NOT IN (...)`        | 不包含   |
| BETWEEN     | `BETWEEN a AND b`     | 区间内   |
| NOT_BETWEEN | `NOT BETWEEN a AND b` | 区间外   |
| GT          | `>`                   | 大于     |
| GE          | `>=`                  | 大于等于 |
| LT          | `<`                   | 小于     |
| LE          | `<=`                  | 小于等于 |
| IS_NULL     | `IS NULL`             | 为空     |
| IS_NOT_NULL | `IS NOT NULL`         | 不为空   |

把当前使用的枚举值和符号全部替换为以上标准数据（删除当前，完全使用以上标准）
