# 加高行为树父子连线竖段

## 需求理解

在已加大水平间距后，蓝框内 manhattan 横干线上下竖段仍偏矮，需再加高。

## 修改范围

- `behaviorTreeConstants.ts`：`V_GAP` 80→120
- `useBehaviorTreeGraph.ts`：manhattan `padding` 18→28

## 新增、修改和删除文件

- 修改上述两文件；无新增/删除

## 核心实现方式

增大层间距给折线留垂直空间；增大 router padding 使折线更离开节点包围盒。

## 新增依赖及必要性

无。

## 验证方式

点「自动布局」后观察父子间竖段高度；`format:check` 针对改动文件。
