# 数据源构建对象最后接口说明

## 需求理解

为数据源构建对象流程补充 `OntologyBuildFromDatasourceController_buildObject` 最后一步接口的 Markdown 说明，并给出前端对接方案。前三步连接数据库、选择数据表、配置字段与外键继续复用现有接口；最后一步在校验通过后提交对象构建请求。

## 修改范围

- 新增 `docs/20261103/1.buildObjectApi.md`。
- 文档记录接口用途、当前页面可确定的请求数据映射、待后端文档确认的契约字段，以及分阶段对接方案。
- 不修改业务源码、接口类型、Mock 或生产构建目录。

## 核心实现方式

1. 复用数据源连接、数据表和字段查询接口获得 `datasourceId`、表字段及外键候选。
2. 在第四步完成主表、字段和外键校验后组装构建对象请求。
3. 调用 `OntologyBuildFromDatasourceController_buildObject`，处理提交中、成功、失败和重复提交状态。
4. 成功后关闭向导并刷新对象列表；失败时保留当前步骤和用户配置。
5. 接口 URL、请求 DTO、响应 DTO 和错误码以用户提供的后端接口文档为最终准据；当前环境无法访问该内网页面的部分在文档中显式标记。

## 新增、修改和删除文件

- 新增：`docs/20261103/1.buildObjectApi.md`
- 新增：`plans/20261103/124425-build-object-api-guoshengnan.md`
- 修改：无
- 删除：无

## 新增依赖

无。

## 验证方式

- 对新增 Markdown 文件执行 Prettier 格式检查。
- 执行 `git diff --check`。
- 检查工作区状态，确认没有修改受保护目录或产生无关文件。
