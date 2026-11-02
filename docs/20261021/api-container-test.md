# 容器算子（CONTAINER）测试用例（ApiPost 直接抄）

验证容器算子全链路：**五步注册向导（上传镜像 → 上传接口文档 → 探查接口 → 保存算子）→ 运行管理（启动/停止/重启/刷新）→ 查询/详情 → 执行/测试 → 删除**。样例镜像用 [go-httpbin](https://github.com/mccutchen/go-httpbin)。

- **服务器 IP 请自行替换**：主应用 `172.16.18.58`（ontology-server）。
- **主应用端口/前缀**：`37002`，context-path `/ontology`。
- **鉴权头**：`Authorization: Bearer <access-token>`（token 用登录接口获取，必须带 `Bearer ` 前缀）。multipart 上传同理带此头。
- **ARM 校验**：生产 `arm-check-enabled=true` 只收 arm64；本地 `application-local.yml` 已设 `false`，可直接用 amd64 的 go-httpbin。
- **容器算子不参与版本管理**：所有生成算子 `version` 恒为 `1.0.0`；`type` 恒为 `CONTAINER`。
- **执行前置**：execute/test 时对应容器 **必须已 RUNNING**，否则报「容器尚未运行…」——执行器不会代为拉起。

---

## 0. 关键约定：算子 api / 名称是怎么生成的

保存时（接口 4），**每个勾选接口各生成一条独立算子**（一算子一接口），命名规则：

| 生成项             | 规则                                               | 例（functionApi=`httpbin`，接口 api=`POST /post`） |
| ------------------ | -------------------------------------------------- | -------------------------------------------------- |
| 算子 `api`         | `functionApi` + `_` + 规整(接口 api)               | `httpbin_POST_post`                                |
| 规整(接口 api)     | 把 `/ \ 空格` 换成 `_`，折叠连续 `_`，去首尾分隔符 | `POST /post` → `POST_post`                         |
| 算子 `displayName` | 公共 `displayName` + `-` + 接口 name               | `HTTPBin 容器算子-POST 回显请求体`                 |
| 算子 `version`     | 恒 `1.0.0`                                         | `1.0.0`                                            |

> execute/test 里的 `functionApi` 是**派生后的完整 api**（如 `httpbin_POST_post`），不是接口 4 里填的 `httpbin`。保存响应会返回生成的完整 api 列表，照抄即可。

---

## 一、五步注册向导

### 1. 上传镜像

- Method: `POST`
- URL: `http://172.16.18.58:37002/ontology/function/container/upload_image`
- Header: `Content-Type: multipart/form-data`，表单字段名固定 `file`，接受 `.tar / .tar.gz / .tgz`
- Body（form-data）：`file = go-httpbin.tar`
- 响应 `data`（`ContainerImageInfo`）：

```json
{
  "fileName": "go-httpbin.tar",
  "path": "/app/container-images/d19ef4ec-0a3b-4faf-b7cc-97f47c00d474go-httpbin.tar",
  "size": 5573632,
  "architecture": "unknown",
  "repoTags": []
}
```

| 字段           | 说明                                                                                                                                   |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `path`         | 服务器存储的绝对路径；docker-compose 下对应宿主机 `./container-images/<UUID><fileName>`                                                |
| `architecture` | 开启 ARM 校验时必须 `arm64`；本地关校验解析不到会回 `unknown`（不阻断）                                                                |
| `repoTags`     | start 时按首个 tag 判断是否已 `docker load`。**若为空（当前关校验情形），启动不会自动 load，需先在宿主机手动 `docker load -i <path>`** |

### 2. 上传接口文档

- Method: `POST`
- URL: `http://172.16.18.58:37002/ontology/function/container/upload_doc`
- Header: `Content-Type: multipart/form-data`，表单字段名固定 `file`，接受 `.json / .yaml / .yml`
- Body（form-data）：`file = httpbin.json`
- 响应 `data`（`ContainerInterfaceDoc`）：

```json
{
  "fileName": "httpbin.json",
  "path": "/app/interface-docs/f4a96fb9-7cc9-4f4e-b1a7-d466c5cd52f2-httpbin.json",
  "format": "openapi3"
}
```

### 3. 探查接口

- Method: `POST`
- URL: `http://172.16.18.58:37002/ontology/function/container/probe_interfaces`
- Header: `Content-Type: application/json`
- Body（`docPath` 用接口 2 返回的 `path` 原样填入）：

```json
{ "docPath": "/app/interface-docs/f4a96fb9-7cc9-4f4e-b1a7-d466c5cd52f2-httpbin.json" }
```

- 响应 `data`（`ContainerInterface[]`），本例探出 2 条，整块作为接口 4 的 `selectedInterfaces`（可只保留想生成的）：

```json
[
  {
    "name": "GET 回显查询参数",
    "api": "GET /get",
    "method": "GET",
    "path": "/get",
    "description": "把查询参数原样回显，验证容器算子 GET 链路",
    "inputParameters": [{ "name": "name", "in": "query", "required": false, "type": "string", "description": "要回显的名字" }],
    "outputParameters": [
      { "name": "args", "in": "body", "required": false, "type": "object", "description": "回显的查询参数" },
      { "name": "origin", "in": "body", "required": false, "type": "string", "description": "调用方地址" },
      { "name": "url", "in": "body", "required": false, "type": "string", "description": "完整请求 URL" }
    ]
  },
  {
    "name": "POST 回显请求体",
    "api": "POST /post",
    "method": "POST",
    "path": "/post",
    "description": "把 JSON 请求体原样回显，验证容器算子 POST 链路",
    "inputParameters": [
      { "name": "title", "in": "body", "required": false, "type": "string", "description": "标题" },
      { "name": "content", "in": "body", "required": false, "type": "string", "description": "内容" }
    ],
    "outputParameters": [{ "name": "json", "in": "body", "required": false, "type": "object", "description": "回显的请求体" }]
  }
]
```

**`ContainerInterface` 字段**

| 字段                                   | 说明                                                         |
| -------------------------------------- | ------------------------------------------------------------ |
| `name`                                 | 接口展示名                                                   |
| `api`                                  | 展示串，如 `POST /post`；派生算子 api 时用它                 |
| `method`                               | `GET` / `POST` / `PUT` / `DELETE`                            |
| `path`                                 | 容器内接口路径（执行时拼 `http://execHost:hostPort + path`） |
| `inputParameters` / `outputParameters` | 出入参数组，元素结构见下表                                   |

**`ContainerInterfaceParam` 字段（入参/出参通用）**

| 字段          | 说明                                                                                |
| ------------- | ----------------------------------------------------------------------------------- |
| `name`        | 参数名（= 执行时 `paramName`）                                                      |
| `in`          | 落点：`query` / `header` / `path` / `body`（**出参固定 `body`**）                   |
| `required`    | 是否必填                                                                            |
| `type`        | `string` / `integer` / `number` / `boolean` / `object` / `array`（未知归 `object`） |
| `description` | 描述                                                                                |

### 4. 保存容器算子

- Method: `POST`
- URL: `http://172.16.18.58:37002/ontology/function`
- Header: `Content-Type: application/json`
- Body（`image`/`interfaceDoc` 直接回填 1/2 的 `data`，`selectedInterfaces` 回填 3 的 `data`；`ontologySpaceId` 改成你的空间 ID；`runCommand` 里的宿主端口不能与已注册算子冲突）：

```json
{
  "functionApi": "httpbin",
  "displayName": "HTTPBin 容器算子",
  "description": "常驻 httpbin 容器算子端到端测试",
  "ontologySpaceId": 1,
  "type": "",
  "version":"",
  "containerConfig":{
  "image": {
    "fileName": "go-httpbin.tar",
    "path": "/app/container-images/d19ef4ec-0a3b-4faf-b7cc-97f47c00d474go-httpbin.tar",
    "size": 5573632,
    "architecture": "unknown",
    "repoTags": []
  },
  "interfaceDoc": {
    "fileName": "httpbin.json",
    "path": "/app/interface-docs/f4a96fb9-7cc9-4f4e-b1a7-d466c5cd52f2-httpbin.json",
    "format": "openapi3"
  },
  "runCommand": "docker run -p 18080:8080 --name httpbin-ctr-18080 mccutchen/go-httpbin:latest",
  "selectedInterfaces": [/* 接口 3 的 data 数组，原样拷贝 */]
  }
}
```

**`ContainerFunctionCreateParam` 字段**

| 字段                 | 必填 | 说明                                                                                                                      |
| -------------------- | ---- | ------------------------------------------------------------------------------------------------------------------------- |
| `functionApi`        | ✔    | 算子基础 api；真实 api = 此值 + `_` + 接口段（见第 0 节）                                                                 |
| `displayName`        | ✔    | 名称公共前缀；每条算子名 = 此值 + `-` + 接口 name                                                                         |
| `description`        |      | 描述公共前缀                                                                                                              |
| `ontologySpaceId`    |      | 所属空间 id                                                                                                               |
| `image`              | ✔    | 接口 1 返回的镜像信息（`path` 必须在服务器真实存在）                                                                      |
| `interfaceDoc`       |      | 接口 2 返回的文档信息                                                                                                     |
| `runCommand`         | ✔    | 完整 `docker run` 命令；**必须含显式 `-p 宿主端口:容器端口`**，可含 `--name`（无则平台默认 `foundry-ctr-<containerKey>`） |
| `selectedInterfaces` | ✔    | 接口 3 探出并勾选的接口列表（非空）                                                                                       |

- 响应 `data`（`String[]`）：

```json
["httpbin_GET_get", "httpbin_POST_post"]
```

**保存期校验（不满足直接 400）**：

- 未勾选接口 / `image.path` 不存在 / 启动命令解析不出宿主端口 → 拒绝。
- 宿主端口 `18080` 已被其它容器算子占用 → 拒绝（一宿主端口=一容器算子）。
- 容器名（`--name` 或默认）与已注册实例重名 → 拒绝。
- 派生 api（`httpbin_POST_post`）与任意已存在函数重复 → 拒绝（重跑用例需换 `functionApi`）。

---

## 二、运行管理（前缀 `/ontology/function/container/runtime`）

所有操作**以 `containerKey` 定位**（一个容器算子=一个容器，多接口算子共用同一 `containerKey`）。

### 5. 列出实例

- Method: `GET`
- URL: `http://172.16.18.58:37002/ontology/function/container/runtime/list?spaceId=1`
- `spaceId` 可不传（则列全部）。响应 `data`（`ContainerRuntimeVO[]`）：

```json
[
  {
    "containerKey": "<32位十六进制>",
    "ontologySpaceId": 1,
    "displayName": "HTTPBin 容器算子",
    "containerName": "httpbin-ctr-18080",
    "phase": "CREATED",
    "phaseLabel": "已创建",
    "hostPort": 18080,
    "containerPort": 8080,
    "containerId": "",
    "lastAction": null,
    "message": "容器算子已创建，尚未启动"
  }
]
```

| 字段           | 说明                                                                     |
| -------------- | ------------------------------------------------------------------------ |
| `containerKey` | **启停操作凭此定位**，记下来给 6~9 用                                    |
| `phase`        | `CREATED` / `RUNNING` / `STOPPING` / `STOPPED` / `RESTARTING` / `FAILED` |
| `hostPort`     | 宿主端口（= 调用入口端口）                                               |

### 6. 启动

- Method: `POST`
- URL: `http://172.16.18.58:37002/ontology/function/container/runtime/start?containerKey=<key>`
- 幂等：已 RUNNING 直接返回当前态。内部先按需 `docker load`（tag 不在本地时从镜像 tar 加载）再 `docker run`。
- **期望**：`data.phase == "RUNNING"`、`data.containerId` 非空。若非 RUNNING，停止后续执行用例。
- ⚠️ 若 `image.repoTags` 为空，`docker load` 不会自动触发，需先手动 `docker load -i <path>`。

### 7. 停止并移除

- Method: `POST`
- URL: `http://172.16.18.58:37002/ontology/function/container/runtime/stop?containerKey=<key>`
- `docker stop` + `rm`，幂等。期望 `phase == "STOPPED"`。

### 8. 重启

- Method: `POST`
- URL: `http://172.16.18.58:37002/ontology/function/container/runtime/restart?containerKey=<key>`
- 先停后启，期望 `phase == "RUNNING"`。

### 9. 刷新状态

- Method: `POST`
- URL: `http://172.16.18.58:37002/ontology/function/container/runtime/refresh?containerKey=<key>`
- `docker inspect` 回查真实运行态并落库（用于 DB 与 docker 状态对账）。

---

## 三、查询容器算子（复用通用函数接口）

### 10. 查询容器算子列表

- Method: `GET`
- URL: `http://172.16.18.58:37002/ontology/function/list?type=CONTAINER&ontologySpaceId=1&pageNum=1&pageSize=20`
- 支持 `displayName`（模糊）、`publishStatus`、`startDate`/`endDate` 等通用筛选。
- **期望**：`data.records` 包含接口 4 保存生成的两条（`httpbin_GET_get`、`httpbin_POST_post`），每条 `type=CONTAINER`、`version=1.0.0`。

### 11. 查询容器算子详情

- Method: `GET`
- URL: `http://172.16.18.58:37002/ontology/function/detail?functionApi=httpbin_POST_post&version=1.0.0`
- **期望**：`data.type == "CONTAINER"`、`data.dockerConfig` 非空且含 `image`/`runCommand`/`hostPort`/`containerPort`/`interfaceDoc`/`interfaces`；`data.params` 含该接口出入参。

| 详情字段                                  | 说明                                            |
| ----------------------------------------- | ----------------------------------------------- |
| `dockerConfig.image`                      | 镜像信息（fileName/path/architecture/repoTags） |
| `dockerConfig.runCommand`                 | 完整 docker run 命令                            |
| `dockerConfig.hostPort` / `containerPort` | 宿主端口 / 容器端口                             |
| `dockerConfig.interfaces`                 | 本算子绑定的接口定义（含出入参）                |
| `params`                                  | 该接口的输入/输出参数列表                       |

---

## 四、执行 / 测试（需容器 RUNNING）

### 12. 执行 POST 回显算子

- Method: `POST`
- URL: `http://172.16.18.58:37002/ontology/function/execute`
- Header: `Content-Type: application/json`
- Body：

```json
{
  "functionApi": "httpbin_POST_post",
  "version": "1.0.0",
  "parameters": [
    { "paramName": "title", "paramValue": "hello" },
    { "paramName": "content", "paramValue": "world" }
  ]
}
```

- 执行器按入参 `in`（`title`/`content` = `body`）拼进请求体，打到 `http://127.0.0.1:18080/post`。
- **期望 `data`**：容器返回的原始 JSON 平铺到顶层，含 `json` 字段回显了你发的 body。

```json
{ "json": { "title": "hello", "content": "world" }, "headers": { ... } }
```

### 13. 测试 GET 回显算子

- Method: `POST`
- URL: `http://172.16.18.58:37002/ontology/function/test`
- Header: `Content-Type: application/json`
- Body：

```json
{
  "functionApi": "httpbin_GET_get",
  "version": "1.0.0",
  "parameters": [{ "paramName": "name", "paramValue": "qoder" }]
}
```

- `name` 的 `in=query` → 打到 `http://127.0.0.1:18080/get?name=qoder`（GET 无 body）。
- **期望 `data`**：`args` 里能看到 `{"name":"qoder"}`，`url`/`origin` 一并回显。

> `parameters[].paramName` 必须等于探查接口里的参数 `name`；`paramValue` 为字符串，执行器按类型/落点分发。

---

## 五、删除容器算子

### 14. 删除单个算子

- Method: `DELETE`
- URL: `http://172.16.18.58:37002/ontology/function/delete?functionApi=httpbin_POST_post&version=1.0.0`
- **期望**：`code == 0`。再调查询列表（接口 10），`data.records` 中不再包含该算子。
- **注意**：
  - 删除前建议先跑接口 7 停止容器；删除接口本身不要求容器已停止，只删 `function` + `function_param` 元数据，不自动清 docker 镜像/实例。
  - 若同一 `containerKey` 下所有算子都已删除，后端会清理 `function_container_instance` 并停止容器、移除镜像 tar 文件。
  - 若算子已被本体行为（编排/引用）使用，删除会被拒绝并提示引用关系，需先解除引用。

---

## 六、通过标准汇总

1. 五步向导各接口 `code=0`；接口 3 探出 2 个接口；接口 4 返回 `["httpbin_GET_get","httpbin_POST_post"]`。
2. `runtime/start` 后 `phase=RUNNING` 且 `containerId` 非空。
3. 查询列表（`type=CONTAINER`）返回 2 条记录，详情 `dockerConfig` 含完整镜像/端口/接口信息。
4. `execute(httpbin_POST_post)` 回显 body、`test(httpbin_GET_get)` 回显 query，响应 `data` 顶层就是容器接口原样返回（已不再包 `FunctionResultVO`）。
5. `runtime/stop` 后 `phase=STOPPED`，docker 容器被移除。
6. `function/delete` 后查询列表不再包含已删算子。
7. 保存期四条唯一性/存在性校验（宿主端口 / 容器名 / 派生 api / `image.path`）能正确拒绝重复。

---

## 七、常见坑

- **未启动就 execute/test** → 报「容器尚未运行」，先调 `runtime/start`。
- **`repoTags` 为空导致 start 失败**：`arm-check-enabled=false` 时 `DockerImageInspector` 解析失败会给空 `repoTags`，`ensureImageLoaded` 直接跳过 `docker load`，`docker run` 报 `Unable to find image`。规避：在宿主机 `docker load -i <path>` 一次；或修 `DockerImageInspector` 让它非 ARM 也能读出 tag。
- **换端口重跑**：只换**宿主端口**（`-p 18080:8080` 的左边），右边由镜像决定不要改。若左端口已被别的容器算子注册，保存会被拒。
- **改镜像名/接口重存**：派生 api 会撞库，换 `functionApi` 前缀重来。
- **docker load 慢**：首次 start 若本地无镜像需从 tar 加载，大镜像会明显卡顿（属正常）。
- **ARM 环境**：`arm-check-enabled=true` 时 amd64 的 go-httpbin 会在上传阶段被拒，需 arm64 镜像或本地关掉校验。
- **EXTERNAL 算子的鉴权**：外部 API 算子的 `apiConfig.authType` 应为 `api-key`（历史驼峰 `apiKey` 后端已做宽松匹配兼容）；`apiKeyHeader` 用 `access-token`、`apiKey` 值必须带 `Bearer ` 前缀。
