# 调度日志执行信息展示

用户已确认。

## 需求理解

后端 GET /ontology/action/scheduling/result 的实时 OpenAPI 已确认存在 executorHost、executorIp、executeStartTime、completeTime。表格新增执行机器和执行时间，保留完成时间，顺序为触发时间、执行机器、执行时间、完成时间。机器名与 IP 同时存在显示“主机名（IP）”，单项缺失显示另一项，全缺失显示 —。

## 修改范围与文件

修改 src/types/apis/getBehaviorSchedulingResultType.ts、src/views/SpaceBehaviorScheduleWorkspace/BehaviorScheduleInvocationLogDialog.vue、tests/schedule-save-api.test.mjs；新增本 Plan；无删除文件、无新增依赖。不改变接口请求、分页、状态或详情。

## 核心实现

补齐可选字段类型，在表格 computed 中派生机器展示字段，复用现有最小列宽和溢出提示，空时间显示 —。

## 验证

TDD 先运行机器组合及字段透传测试并确认失败，再完成实现。运行定向、全量、覆盖率、类型规范、类型检查、临时目录构建、限定文件格式与 diff 检查。浏览器工具不可用，视觉、暗亮主题及横向滚动需人工验收。

## 实施与验证记录

- 已补齐三个可选响应字段，新增执行机器与执行时间列，保留完成时间、分页、状态及详情；无新增依赖。
- TDD：实现前机器显示值均为 undefined，新增测试失败；实现后定向 41/41 通过。
- 类型规范及 build:verify 通过。type-check 有 15 项既有其他模块错误，本次文件无报错。
- npm test 共 1228 项，1188 通过、40 项既有失败，对比上一任务记录未新增失败。
- test:coverage 未通过：已加载文件行 93.74%、函数 90.62%、分支 78.87%，分支未达 80%；同时存在上述既有测试失败。
- 限定文件格式及 git diff --check 通过。已审查本任务三个文件 diff，保留其他任务工作区修改。
- 浏览器工具不可用，未执行浏览器或人工视觉验收，列宽、暗亮主题及横向滚动仍需人工验收。
