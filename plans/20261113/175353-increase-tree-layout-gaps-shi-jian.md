# 加大行为树自动布局间距

## 需求理解

在保留 `manhattan` 路由的前提下，加大同级水平与层间垂直间距，缓解多子节点时横干线/竖落线显得拥挤的问题。

## 修改范围

- `src/views/BehaviorTreeOrchestration/utils/behaviorTreeConstants.ts`

## 新增、修改和删除文件

- 修改：`behaviorTreeConstants.ts`（`H_GAP` 28→56，`V_GAP` 52→80）
- 无新增/删除

## 核心实现方式

仅调整自动布局常量；`behaviorTreeLayout.ts` 已引用上述常量，点「自动布局」后生效。

## 新增依赖及必要性

无。

## 验证方式

编排弹框点「自动布局」观察同级间距；`format:check` 针对改动文件。
