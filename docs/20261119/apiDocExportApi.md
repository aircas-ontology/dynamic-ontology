# 接口名称

- 导出接口文档（HTML 文件），包含查询对象、查询属性、查询关系、查询实例

## 编译位置

apis 与 types 文件名自行语义化命名

- apis：`src/apis/`
- types：`src/types/apis/`

## 接口描述

- 导出接口文档为 HTML 文件。
- 文档内容包含：查询对象、查询属性、查询关系、查询实例。
- `spaceId` 为对象空间 id；导出后会写入文档示例参数。

## 接口 domain

- `DOMAIN_CONFIG.ONTOLOGYMANAGE_URL`（以实际网关/在线文档域名为准）

## 接口 uri

- `/ontology/api_doc/export`

## 请求方式

- GET

## 输入参数

- 请求通过 `query` 传递参数：

| 字段名    | 位置  | 类型            | 必填 | 说明                                |
| --------- | ----- | --------------- | ---- | ----------------------------------- |
| `spaceId` | query | Integer / int32 | 是   | 对象空间 id；导出后写入文档示例参数 |

- 示例：

```http
GET /api_doc/export?spaceId=156
```

## 输出参数

- 成功时返回 **HTML 文件**（接口文档导出产物），供浏览器下载或直接打开。
- 在线文档未声明统一 JSON 包装字段（`code` / `message` / `data`）时，不要假定为普通业务 JSON；按文件流处理。

## code

- 文档未列出业务 `code` 枚举；HTTP 成功一般为 `200`。

## message

- 文档未声明 `message`。

## 前端调用说明

- 调用时必须传 `spaceId`。
- 响应按文件下载处理（例如 `blob` / 附件下载），不要按普通列表接口解析 `data`。
