# Plan：对接创建本体分类树接口

确认依据：用户指定 `docs/20260918/createOntologyCategoryTreeApi-shijian.md`，并明确 name、parentId=0、spaceId。

## 需求理解

确认按钮 POST 创建分类树。name 为主分类名称，parentId 固定 0（样例为数字），spaceId 为当前空间 id。成功后关闭弹框并重新加载树。

## 修改范围

- `ontologyCategoryTreeType.ts`：`CreateOntologyCategoryTreeParams`
- `ontologyManageApi.ts`：`postCreateOntologyCategoryTreeInterface`
- `apis/index.ts`、`types/index.ts`
- Mock 增加成功样例 `message: SUCCESS`
- 弹框提交改为调用接口

## 新增依赖

无。

## 验证方式

相关测试 + `check:types-conventions` + `type-check`
