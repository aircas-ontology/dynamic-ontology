# 接口名称

- 按对象查询实体实例

## 接口说明

分页查询指定对象下的实体实例，仅返回实体主属性信息列表。接口用于对象详情或实例选择场景中的实例列表加载。

## 接口 domain

- `DOMAIN_CONFIG.ONTOLOGYMANAGE_URL`

## 接口 URI

- `/ontology/entity/list`

## 请求方式

- GET

## 操作标识

- `OntologyEntityController_getEntities`

## 输入参数

GET 请求通过 `query` 传递参数。

| 参数                       | 类型            | 必填 | 默认值 | 说明                        |
| -------------------------- | --------------- | ---- | ------ | --------------------------- |
| `ontologyUniqueIdentifier` | string          | 是   | -      | 对象唯一标识（对象 id） |
| `pageNum`                  | integer / int32 | 否   | `1`    | 页码，从 1 开始             |
| `pageSize`                 | integer / int32 | 否   | `10`   | 每页条数                    |

### 请求示例

```text
GET /ontology/entity/list?ontologyUniqueIdentifier=space_a.airplane&​pageNum=1&pageSize=10
```

```ts
interface GetOntologyEntitiesParams {
  ontologyUniqueIdentifier: string;
  pageNum?: number;
  pageSize?: number;
}
```

## 输出参数

接口返回标准响应包装，`data` 为分页对象。

```json
{
  "code": 200,
  "message": "SUCCESS",
  "success": true,
  "data": {
    "records": [
      {
        "id": 204,
        "entityPrimaryKey": 204,
        "ontologyUniqueIdentifier": "space_a.airplane",
        "properties": {
          "name": "示例实体",
          "code": "AIR-001"
        }
      }
    ],
    "total": 1,
    "size": 10,
    "current": 1,
    "pages": 1
  }
}
```

### 响应字段

| 字段           | 类型    | 说明                                         |
| -------------- | ------- | -------------------------------------------- |
| `code`         | number  | 响应码；前端以 `code === 200` 判定成功       |
| `message`      | string  | 响应消息                                     |
| `success`      | boolean | 成功标记，实际判断以 `code` 为准             |
| `data`         | object  | 分页响应体                                   |
| `data.records` | array   | 实体主属性信息列表；字段随对象主属性定义返回 |
| `data.total`   | number  | 总记录数                                     |
| `data.size`    | number  | 当前页大小                                   |
| `data.current` | number  | 当前页码                                     |
| `data.pages`   | number  | 总页数                                       |

实体记录属于 `EntityInfoVO`，接口只返回主属性信息。主键和属性字段应按接口实际返回内容读取，不应假设所有对象具有相同的动态属性集合。

### TypeScript 类型示例

```ts
export interface GetOntologyEntitiesParams {
  ontologyUniqueIdentifier: string;
  pageNum?: number;
  pageSize?: number;
}

export interface OntologyEntityInfo {
  id?: number | string;
  entityPrimaryKey?: number | string;
  ontologyUniqueIdentifier?: string;
  properties?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface GetOntologyEntitiesPage {
  records: OntologyEntityInfo[];
  total: number;
  size: number;
  current: number;
  pages?: number;
}

export interface GetOntologyEntitiesResponse {
  code: number;
  message: string;
  success?: boolean;
  data: GetOntologyEntitiesPage;
}
```

## 错误码

| code  | 说明                       |
| ----- | -------------------------- |
| `200` | 查询成功                   |
| `400` | 请求参数错误               |
| `401` | 权限不足，请重新登录       |
| `404` | 对象不存在或无可用实例 |
| `500` | 服务器内部错误             |

## 前端处理约定

- `ontologyUniqueIdentifier` 为空时不发起请求，并向用户提示缺少对象标识。
- 分页查询需要处理 loading、success、empty 和 error 状态。
- 翻页或改变页大小时，应使用最新请求结果，避免过期响应覆盖当前列表。
- `records` 为空时展示“暂无实例”，不要将空列表当作请求失败。

## 参考文档

- [在线接口文档](http://172.16.18.58:37002/ontology/doc.html#/ontology/%E5%AE%9E%E4%BD%93%E7%AE%A1%E7%90%86/OntologyEntityController_getEntities/doc)
