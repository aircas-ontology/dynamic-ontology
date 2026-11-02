# 编辑回显函数版本

## 需求理解

编辑时详情映射把 version 写成空串，导致表单版本为空。需从详情 data.version 回填，缺省回退列表行版本。

## 修改范围

详情类型、映射、openEdit、mock/fixture、相关测试；不改表单 UI、不改 public/。

## 新增、修改和删除文件

- 修改：getOntologyFunctionDetailType.ts、mapOntologyFunctionDetail.ts、useFunctionOperatorWorkspace.ts、getOntologyFunctionDetailMock.ts、detail.get.json、get-ontology-function-detail-api.test.mjs

## 核心实现方式

detail.version trim 优先；否则 fallbackVersion / listOperator.version。openEdit 传入 operator.version。

## 新增依赖及必要性

无。

## 验证方式

TDD 更新 get-ontology-function-detail-api.test.mjs；node --test；format:check。
