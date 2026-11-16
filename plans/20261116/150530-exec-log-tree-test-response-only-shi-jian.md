# 接口日志只展示执行返回

## 需求理解

「接口日志」只展示点「执行」后 `POST /ontology/action/tree/test` 的返回内容；不再记录读执行要求、拉实体、请求体、失败摘要等。

## 修改范围

仅改 `src/composables/behaviorTree/useBehaviorTreeExecution.ts`：

- 去掉对 `GET /entity/list`、`GET /action（执行要求）`、读失败、试跑请求体、试跑失败 的 `appendBehaviorTreeExecLog`
- 拿到执行响应后：清空旧日志，只写入一次响应（`code` / `message` / `data`）
- 纯传输失败无响应体时不写日志（仍用 toast / `testError` /「试跑结果」）
- 面板 UI、清空按钮、编排与列表测试接线不变

## 新增、修改和删除文件

- 修改：`src/composables/behaviorTree/useBehaviorTreeExecution.ts`
- 无新增/删除业务文件

## 核心实现方式

在 `runBehaviorTreeTest` 收到 `postOntologyActionTreeTestInterface` 响应后 `clearBehaviorTreeExecLogs` 再追加一条响应日志；其它调用点停止写日志。

## 新增依赖及必要性

无。

## 验证方式

- `node --test --experimental-strip-types tests/behavior-tree-orchestration.test.mjs`
- `npm run format:check --` 改动文件
