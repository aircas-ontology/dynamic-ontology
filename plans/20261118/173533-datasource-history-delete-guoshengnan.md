# 历史连接删除与新建入口简化

已获用户确认。

## 需求与范围

历史连接卡片右侧增加删除操作，和选择按钮分开；确认物理删除并显示连接名称后，调用 DELETE `/ontology/datasource/connection?id=连接ID`。成功移除卡片，删除当前选择时清空关联 schema、表、字段和外键；失败保留数据并反馈。移除新建连接右上角“使用新建连接”按钮，保留编辑表单、测试连接自动选用新建模式。

## 文件

修改 `src/apis/datasourceConnectionApi.ts`、`src/apis/index.ts`、`src/views/ObjectWorkspacePanel/components/DatasourceBuildDialog.vue`、`tests/datasource-schema-flow.test.mjs`、`docs/20261102/1.datasourceConnectionApi.md`。新增本 Plan，无删除文件，无新增依赖。保留现有未提交的表与字段接口分流修改。

## 核心实现

复用 Element Plus 确认框，使用同级按钮避免嵌套按钮和误触选择；删除不触发步骤前进。提供取消、提交中、防重复、错误和弹窗关闭后的过期响应保护。新增独立删除 API 并从公共出口导出，复用现有依赖配置清理函数。

## 验证

先补删除接口及成功、取消、失败、重复、关闭场景测试并确认失败，再实现。执行定向测试、npm test、test:coverage、type-check、build:verify、限定文件格式及 diff 检查。浏览器工具不可用，暗亮主题、焦点、长文本及真实删除接口留待人工验收；自动化使用替身，不删除真实数据。

## 实施与验证记录

- 已新增 DELETE API 与公共导出；历史连接使用同级选择/删除按钮，移除右上角新建连接按钮。
- 删除确认、防重复、成功清理、取消/失败保留及卸载过期响应保护已实现，保留既有已绑定/未绑定查询分流。
- TDD：实现前定向测试失败；最终定向 46/46 通过，覆盖成功、取消、失败、重复确认/请求、非当前连接删除及卸载。
- build:verify 通过（最后按钮兼容修正后复验通过）。格式检查及 diff 检查通过。
- 全量 npm test：1223 项，1182 通过、41 失败；对比上一任务 40 项失败，新增失败来自并行工作区的 ontology-attribute-metadata.test.mjs，非本次改动。
- test:coverage 未通过：已加载文件行 93.44%、函数 90.51%、分支 78.75%（低于 80%）；测试失败同上。
- type-check 未通过：原有错误以及并行属性元数据修改的错误；本次按钮类型错误已修复，最终日志无 DatasourceBuildDialog / datasourceConnectionApi 错误。
- 工作区发现另一任务正在修改属性元数据页面、类型及测试，本任务未编辑或回退这些内容。全量检查反映共享工作区快照，不代表仅本次改动。
- 浏览器工具不可用，未执行浏览器、真实后端删除和人工视觉验收；仍需人工验收。
