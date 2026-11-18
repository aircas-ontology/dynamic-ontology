# Schema 接口补充 ontology 前缀

已获用户确认。

## 需求与范围

将未绑定空间的 schema 查询地址修正为 `/ontology/datasource/connection/schema/list_by_datasource`，保留查询参数 `id`，不调整其他接口或向导流程。

## 文件及实现

修改 `src/apis/datasourceConnectionApi.ts` 的请求路径及注释，更新 `tests/datasource-schema-flow.test.mjs` 的路径断言和 `docs/20261102/1.datasourceConnectionApi.md` 的说明。新增本 Plan，无删除文件，无新增依赖。

## 验证

先修改路径测试并确认失败，再修复接口。执行定向测试、npm test、test:coverage、type-check、build:verify、限定文件格式和 diff 检查。保留已有无关修改，真实后端联调及人工验收待执行。

## 验证结果

- 路径断言先失败（29 项中 1 项失败），修复后定向测试 29 / 29 通过；请求仍仅传 `id`。
- 临时目录构建、限定文件格式和 `git diff --check` 通过。
- 全量测试 1203 项中 1166 通过、37 项既有失败，失败集合与修复前一致。类型检查仍有其他文件的 14 项既有错误，本次接口文件无新增错误。
- 已加载文件覆盖率：行 93.41%、分支 78.86%、函数 90.41%；分支未达 80%，并存在既有测试失败，覆盖率检查未通过。该统计不代表全部项目源码。
- 真实后端联调、浏览器与人工验收未执行，整体必需检查尚未全部通过。
