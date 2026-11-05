## 2. 查询实例信息

### 2.1 实体分页查询（主属性列表）

**接口**：`GET /ontology/entity/list`

## 接口 domain

- `DOMAIN_CONFIG.ONTOLOGYMANAGE_URL`

## 输出参数

```json
{
  "code": 200,
  "message": "SUCCESS",
  "data": null
}
```

- `code`：【integer / int32】响应码
- `message`：【string】消息描述
- `data`：【unknown】删除接口无业务响应数据

## 前端编译位置

- apis：`src/apis/`
- types：`src/types/`

**请求参数**：

| 参数名                     | 类型    | 必填 | 说明                |
| -------------------------- | ------- | ---- | ------------------- |
| `ontologyUniqueIdentifier` | String  | 是   | 对象唯一标识        |
| `pageNum`                  | Integer | 否   | 页号，默认 `1`      |
| `pageSize`                 | Integer | 否   | 每页条数，默认 `10` |

**响应字段（`EntityInfoVO`）**：

| 字段名                     | 类型                     | 说明           |
| -------------------------- | ------------------------ | -------------- |
| `ontologyUniqueIdentifier` | String                   | 对象 id        |
| `ontologyName`             | String                   | 对象名称       |
| `primaryKey`               | Object                   | 实体主键值     |
| `displayName`              | String                   | 实体显示名称   |
| `properties`               | List\<EntityPropertyVO\> | 实体属性值列表 |

**示例**：

```http
GET /entity/list?ontologyUniqueIdentifier=ea512d439cd34c6ebbcde6b692261ab5&pageNum=1&pageSize=20
```
