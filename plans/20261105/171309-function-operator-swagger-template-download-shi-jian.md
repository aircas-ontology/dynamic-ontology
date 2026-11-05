# 函数算子下载接口文档模版

## 需求理解

在上传接口文档旁增加【下载接口文档模版】；模版为最简 OpenAPI JSON，放在 `src/assets`，构建部署后可下载。

## 修改范围

- 新增模版 JSON
- 外部 API / 容器算子上传行增加下载按钮与下载函数
- 更新相关测试断言

## 新增、修改和删除文件

### 新增

- `src/assets/pages/functionOperatorPanel/swaggerApiDocTemplate.json`
- `plans/20261105/171309-function-operator-swagger-template-download-shi-jian.md`

### 修改

- `src/views/FunctionOperatorPanel/components/FunctionOperatorFormDialog.vue`
- `tests/function-operator-workspace.test.mjs`

### 删除

无

## 核心实现方式

`import` 模版 → `JSON.stringify` → Blob 触发下载；两处上传提示旁放置 link 按钮。

## 新增依赖及必要性

无。

## 验证方式

- `node --test tests/function-operator-workspace.test.mjs`
- `npm run format:check -- <任务文件>`
