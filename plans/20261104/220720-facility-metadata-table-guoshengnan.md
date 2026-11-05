# 设施类元数据录入（已确认）

- 需求：按8张截图录入79条设施属性的全部12列元数据，展示及保存方式同油品。
- 范围：修改src/mocks/assetModelBuilderMock/facilityAssetStandardMock.ts，新增tests/facility-standard-metadata.test.mjs及本计划，无删除、无新增依赖。
- 实现：逐行保留原表字段，复用现有展开列与metadata.元数据请求格式。E0117的名称和代码两条均保留；保留原图Z0008交换格式等特殊值，不擅自修正。
- 验证：新增测试先失败后实现；验证79行完整列、截图样本、重复标识两行、实际Vue展开模板服务端渲染及请求保存。执行npm test、test:coverage、type-check、build:verify、范围格式检查及git diff --check。浏览器视觉待人工验收，记录已有失败。

## 验证记录

- TDD：新增4项测试先因缺少10列而失败，录入后相关14项全部通过；覆盖79条属性的真实Vue展开模板服务端渲染和metadata.元数据保存。
- npm test：795项，767通过，28项既有失败，与人员类任务基线一致。
- test:coverage：已加载文件行92.19%、函数89.50%、分支77.37%；分支低于80%，并存在上述既有测试失败，非全项目覆盖率。
- type-check：11项既有错误，均不在本次修改文件中。
- build:verify：通过，输出至系统临时目录。
- git diff --check：通过。无新增依赖，无计划外文件变更，保留工作区既有修改。
- 未执行浏览器验证；实际展开模板已通过服务端渲染测试，视觉及业务人工验收待完成。
